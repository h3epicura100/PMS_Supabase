import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  RotateCcw,
  MessagesSquare,
  FileText,
  Loader2
} from 'lucide-react';
import { chatbotService } from './chatbotService';
import { ChatBubble } from './ChatBubble';
import { MenuChatbotInput } from './MenuChatbotInput';
import { MenuPreviewPanel } from './MenuPreviewPanel';
import { toast } from 'sonner';

const INITIAL_MESSAGE = {
  role: 'model',
  text: `👋 **Welcome to H3 Menu AI!**\n\nType your event requirements or paste your raw WhatsApp notes (sessions, guest counts, stall requirements). I'll automatically organize everything into structured session menus and ready-to-print catering PDF.`,
  timestamp: 'Just now',
};

export function MenuChatbotPage() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [menuData, setMenuData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState('chat'); // 'chat' | 'preview'
  const messagesEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userText, attachment = null) => {
    if (!userText?.trim() && !attachment) return;

    const trimmedText = userText?.trim() || '';
    const newMsg = {
      role: 'user',
      text: trimmedText || (attachment ? `[Attached File: ${attachment.name}]` : ''),
      attachment: attachment ? {
        name: attachment.name,
        mimeType: attachment.mimeType,
        previewUrl: attachment.previewUrl,
        size: attachment.size,
      } : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      const geminiHistory = updatedHistory
        .filter((m) => m.role === 'user' || m.role === 'model')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'model',
          text: m.text,
        }));

      const result = await chatbotService.sendMessage(geminiHistory, menuData, attachment);

      const botMsg = {
        role: 'model',
        text: result.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (result.menuData) {
        setMenuData(result.menuData);
        toast.success('Live Menu Blueprint updated!');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errMsg = {
        role: 'model',
        text: `⚠️ **Error:** ${err.message || 'Failed to process request.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
      toast.error(err.message || 'AI request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset the conversation and menu?')) {
      setMessages([INITIAL_MESSAGE]);
      setMenuData(null);
      toast.info('Menu assistant reset.');
    }
  };

  return (
    <div className="h-[calc(100dvh-5.5rem)] sm:h-[calc(100vh-4.5rem)] flex flex-col bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden max-w-full">
      {/* Sleek Top Control Bar */}
      <div className="h-11 px-3 sm:px-4 bg-slate-900 text-white flex items-center justify-between shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-tight">H3 Menu AI</span>
        </div>

        {/* Mobile View Toggle Segmented Tabs */}
        <div className="flex lg:hidden bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setMobileTab('chat')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 font-semibold transition-all ${
              mobileTab === 'chat' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessagesSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 font-semibold transition-all ${
              mobileTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Menu ({menuData?.sessions?.length || 0})</span>
          </button>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset Chat & Menu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Panel: Chat Stream & Input */}
        <div
          className={`flex-1 flex-col h-full bg-slate-50/40 overflow-hidden min-h-0 ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            {messages.map((msg, index) => (
              <ChatBubble key={index} message={msg} />
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl w-fit shadow-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>H3 Menu AI is structuring the menu...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <MenuChatbotInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            disabled={false}
          />
        </div>

        {/* Right Panel: Live Menu Preview */}
        <div
          className={`w-full lg:w-[48%] h-full overflow-hidden min-h-0 ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <MenuPreviewPanel
            menuData={menuData}
            onResetMenu={() => setMenuData(null)}
          />
        </div>
      </div>
    </div>
  );
}
