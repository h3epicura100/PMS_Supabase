import { SYSTEM_PROMPT } from './chatbotPrompts';

const STORAGE_KEY = 'h3_gemini_api_key';

export const chatbotService = {
  /**
   * Retrieves the active Gemini API Key from Vite environment variable or localStorage.
   */
  getApiKey() {
    const envKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (envKey) {
      return envKey;
    }
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && local.trim().length > 0) {
      return local.trim();
    }
    return '';
  },

  /**
   * Sets or clears the user-specified Gemini API Key in localStorage.
   */
  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  },

  /**
   * Checks if an API key is available.
   */
  hasApiKey() {
    return Boolean(this.getApiKey());
  },

  /**
   * Extracts JSON block from Gemini markdown text response.
   */
  extractJsonFromText(text) {
    if (!text) return null;

    try {
      // 1. Try markdown ```json ... ``` block
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1]);
      }

      // 2. Try any ``` ... ``` block that looks like JSON
      const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch && codeBlockMatch[1]) {
        const trimmed = codeBlockMatch[1].trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          return JSON.parse(trimmed);
        }
      }

      // 3. Try finding first '{' and last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const jsonSubstring = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonSubstring);
      }
    } catch (e) {
      console.warn('Could not parse JSON from model output:', e);
    }

    return null;
  },

  /**
   * Cleans text to display in chat (removes raw JSON code blocks for clean reading if desired).
   */
  cleanMessageText(text) {
    if (!text) return '';
    // Replace json code block with a friendly note or remove it from chat bubble
    return text.replace(/```json[\s\S]*?```/gi, '').trim();
  },

  /**
   * Decodes Base64 to UTF-8 text string safely.
   */
  decodeBase64Text(base64) {
    if (!base64) return '';
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch {
      try {
        return atob(base64);
      } catch {
        return '';
      }
    }
  },

  /**
   * Sends conversation to Gemini API and parses conversational text + menu JSON.
   * @param {Array<{ role: 'user' | 'model', text: string }>} conversation
   * @param {Object} currentMenuData - Current active menu state
   * @param {Object|null} attachment - Optional attachment { name, mimeType, base64 }
   */
  async sendMessage(conversation, currentMenuData = null, attachment = null) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Please configure your API key in settings or top bar.');
    }

    // Prepare contents array for Gemini
    const contents = [];

    // System instruction passed via systemInstruction property (supported in Gemini 1.5+)
    let systemText = `${SYSTEM_PROMPT}\n\nCURRENT MENU STATE:\n${
      currentMenuData ? JSON.stringify(currentMenuData, null, 2) : 'No menu created yet.'
    }`;

    if (attachment) {
      systemText += `\n\nATTACHMENT INSTRUCTION:\nA file "${attachment.name}" (${attachment.mimeType}) has been provided by the user. Carefully analyze and extract all relevant menu details (OCR for images/scans, text from PDFs/documents) including dish names, caterers, courses, timings, sessions, guest count, live counters, staff meals, and catering policies. Structure everything into the standard H3 Menu Blueprint JSON output format.`;
    }

    const systemInstruction = {
      role: 'user',
      parts: [
        {
          text: systemText
        }
      ]
    };

    // Format conversation history
    const totalMsgs = conversation.length;
    conversation.forEach((msg, index) => {
      const isLastUserMsg = (index === totalMsgs - 1) && msg.role === 'user';

      if (isLastUserMsg && attachment && attachment.base64) {
        const isTextFile =
          attachment.mimeType === 'text/plain' ||
          attachment.mimeType === 'text/csv' ||
          attachment.name?.toLowerCase().endsWith('.txt') ||
          attachment.name?.toLowerCase().endsWith('.csv');

        if (isTextFile) {
          const textContent = this.decodeBase64Text(attachment.base64);
          const combinedText = `[Uploaded File: ${attachment.name}]\n${textContent}\n\n${msg.text || 'Please structure this uploaded file into an H3 menu blueprint.'}`;
          contents.push({
            role: 'user',
            parts: [{ text: combinedText }]
          });
        } else {
          // Multimodal inline data (Images, PDFs)
          contents.push({
            role: 'user',
            parts: [
              {
                text: msg.text || `Please analyze this attached document/image (${attachment.name}) and extract all menu details into the structured H3 Menu Blueprint.`
              },
              {
                inlineData: {
                  mimeType: attachment.mimeType || 'application/pdf',
                  data: attachment.base64
                }
              }
            ]
          });
        }
      } else {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text || '' }]
        });
      }
    });

    const payload = {
      systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite-preview',
      'gemini-3-flash-preview',
      'gemini-flash-latest',
      'gemini-3.7-flash',
      'gemini-3.8-flash'
    ];

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${response.status} ${response.statusText}`;

          // If model not found (404), unsupported (400), rate-limited/quota (429), or temporarily overloaded (503/500), cascade
          lastError = new Error(`Gemini ${model}: ${errMsg}`);
          console.warn(`Model ${model} returned ${response.status} (${errMsg}), cascading to next model...`);

          // Short backoff before trying next model if server is busy or rate limited
          if (response.status === 503 || response.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
          continue;
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text || '';

        if (!rawText) {
          throw new Error(`No response text received from Gemini (${model}).`);
        }

        const extractedMenu = this.extractJsonFromText(rawText);
        const cleanMessage = this.cleanMessageText(rawText) || rawText;

        return {
          rawText,
          message: cleanMessage,
          menuData: extractedMenu,
          modelUsed: model
        };
      } catch (err) {
        lastError = err;
        console.warn(`Attempt with ${model} failed:`, err.message);
      }
    }

    throw lastError || new Error('Failed to connect to Gemini API. Please verify your API key.');
  }
};
