import { supabase } from './supabase';

const BUCKET_NAME = 'pms-attachments';

export const storageService = {
  /**
   * Uploads a file to Supabase Storage (or returns Base64 DataURL fallback if bucket is missing).
   */
  async uploadAttachment(folderPath, file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${folderPath}/${fileName}`;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { upsert: true });

      if (!error && data) {
        return {
          path: data.path,
          name: file.name,
        };
      }
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }

    // Fallback to base64 DataURL if storage bucket isn't created in Supabase yet
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        path: reader.result,
        name: file.name,
        dataUrl: reader.result,
      });
      reader.readAsDataURL(file);
    });
  },

  /**
   * Generates a signed URL or returns direct path/dataUrl.
   */
  async getSignedUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith('data:')) return filePath;

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 3600);

      if (!error && data) return data.signedUrl;
    } catch (e) {}

    return filePath;
  },

  /**
   * Generates a public URL or returns direct path/dataUrl.
   */
  getPublicUrl(filePath) {
    if (!filePath) return null;
    if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) return filePath;

    try {
      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (data?.publicUrl) return data.publicUrl;
    } catch (e) {
      console.warn('Error getting public URL:', e);
    }

    return filePath;
  },

  /**
   * Removes an attachment from Supabase Storage.
   */
  async deleteAttachment(filePath) {
    if (!filePath || filePath.startsWith('data:')) return;
    try {
      await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    } catch (e) {}
  }
};
