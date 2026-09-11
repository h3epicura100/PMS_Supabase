import React, { useState, useEffect, useRef, useId } from 'react';
import { storageService } from '../../services/storageService';
import {
  saveFilesToSession,
  restoreFilesFromSession,
  clearFilesFromSession,
} from '../../utils/fileSessionStore';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  X,
  ExternalLink,
  AlertCircle,
  Eye,
  Film
} from 'lucide-react';

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function getFileCategory(fileOrObj) {
  const mime = fileOrObj.type || fileOrObj.mimeType || '';
  const name = fileOrObj.name || fileOrObj.path || '';
  const ext = name.split('.').pop()?.toLowerCase();

  if (mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v', '3gp'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
    return 'image';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'pdf';
  }
  return 'document';
}

function FileTypeIcon({ category, className = 'w-4 h-4' }) {
  if (category === 'video') return <VideoIcon className={`${className} text-indigo-500 flex-shrink-0`} />;
  if (category === 'image') return <ImageIcon className={`${className} text-emerald-500 flex-shrink-0`} />;
  if (category === 'pdf') return <FileText className={`${className} text-rose-500 flex-shrink-0`} />;
  return <FileText className={`${className} text-blue-500 flex-shrink-0`} />;
}

export function AttachmentUploader({
  label = 'Attachments',
  sessionKey = null,
  required = false,
  maxFiles = 10,
  maxSizeMb = 50,
  accept = 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv',
  newFiles = [],
  onNewFilesChange,
  existingAttachments = [],
  onDeleteExisting,
  disabled = false,
  hint = 'Photos, videos (proof of work), PDFs or docs up to 50 MB each',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewMedia, setPreviewMedia] = useState(null); // { url, type, title }
  const fileInputRef = useRef(null);
  const generatedId = useId();
  const inputId = `file_input_${sessionKey || generatedId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const effectiveKey = sessionKey || `pms_att_${label.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const currentTotal = (existingAttachments?.length || 0) + (newFiles?.length || 0);
  const isLimitReached = currentTotal >= maxFiles;

  // Restore staged files from IndexedDB on initial mount (especially if page reloaded on mobile)
  useEffect(() => {
    let isMounted = true;
    async function restoreStagedFiles() {
      if (!effectiveKey) return;
      try {
        const savedFiles = await restoreFilesFromSession(effectiveKey);
        if (isMounted && savedFiles && savedFiles.length > 0 && newFiles.length === 0) {
          if (onNewFilesChange) {
            onNewFilesChange(savedFiles);
          }
        }
      } catch (err) {
        console.warn('Could not restore staged files from IndexedDB:', err);
      }
    }

    restoreStagedFiles();

    return () => {
      isMounted = false;
    };
  }, [effectiveKey]);

  // Sync with visibility changes (when returning from mobile camera/gallery picker)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && effectiveKey && newFiles.length === 0) {
        try {
          const savedFiles = await restoreFilesFromSession(effectiveKey);
          if (savedFiles && savedFiles.length > 0 && onNewFilesChange) {
            onNewFilesChange(savedFiles);
          }
        } catch (err) {
          console.warn('Visibility restoration error:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [effectiveKey, newFiles.length, onNewFilesChange]);

  const handleFilesAdded = async (incomingList) => {
    setLocalError('');
    if (!incomingList || !incomingList.length) return;

    const validNewFiles = [];
    let oversizedCount = 0;
    let limitExceeded = false;

    for (let i = 0; i < incomingList.length; i++) {
      const file = incomingList[i];

      if ((existingAttachments?.length || 0) + (newFiles?.length || 0) + validNewFiles.length >= maxFiles) {
        limitExceeded = true;
        break;
      }

      if (file.size > maxSizeBytes) {
        oversizedCount++;
        continue;
      }

      // Check if file with same name and size is already staged
      const isDuplicate = newFiles.some(f => f.name === file.name && f.size === file.size);
      if (!isDuplicate) {
        validNewFiles.push(file);
      }
    }

    if (oversizedCount > 0) {
      setLocalError(`Some files were skipped because they exceed the ${maxSizeMb} MB limit.`);
    } else if (limitExceeded) {
      setLocalError(`Maximum ${maxFiles} attachments allowed in total.`);
    }

    if (validNewFiles.length > 0) {
      const updatedList = [...newFiles, ...validNewFiles];
      if (onNewFilesChange) {
        onNewFilesChange(updatedList);
      }
      // Persist immediately to IndexedDB
      if (effectiveKey) {
        await saveFilesToSession(effectiveKey, updatedList);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled || isLimitReached) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isLimitReached) return;
    const files = Array.from(e.dataTransfer.files || []);
    handleFilesAdded(files);
  };

  const handleInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesAdded(files);
    }
    // Reset file input value so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = async (idx) => {
    if (!onNewFilesChange) return;
    const updated = newFiles.filter((_, i) => i !== idx);
    onNewFilesChange(updated);
    if (effectiveKey) {
      await saveFilesToSession(effectiveKey, updated);
    }
  };

  const handlePreviewNewFile = (file) => {
    const cat = getFileCategory(file);
    const objectUrl = URL.createObjectURL(file);
    if (cat === 'image' || cat === 'video') {
      setPreviewMedia({
        url: objectUrl,
        type: cat,
        title: file.name,
      });
    } else {
      window.open(objectUrl, '_blank');
    }
  };

  const handleViewExisting = async (att) => {
    if (!att || !att.path) return;
    if (att.path.startsWith('data:') || att.path.startsWith('http://') || att.path.startsWith('https://')) {
      window.open(att.path, '_blank');
      return;
    }
    const url = await storageService.getSignedUrl(att.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Label and Count Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span>{label}</span>
          {required && <span className="text-red-500 font-bold">*</span>}
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          {maxFiles === 1 ? (
            <span className={currentTotal >= 1 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
              {currentTotal >= 1 ? '1 file attached' : `1 file max (${maxSizeMb} MB)`}
            </span>
          ) : (
            <>
              <span className={currentTotal >= maxFiles ? 'text-amber-600 font-bold' : 'text-slate-600 font-semibold'}>
                {currentTotal}
              </span>
              /{maxFiles} files (max {maxSizeMb} MB each)
            </>
          )}
        </span>
      </div>

      {/* Drag and Drop Zone / Mobile File Trigger */}
      {!disabled && !isLimitReached && (
        <label
          htmlFor={inputId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left select-none ${
            isDragging
              ? 'border-pms-accent bg-blue-50/70 ring-4 ring-pms-accent/15'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 hover:border-pms-accent/70 active:bg-blue-50/30'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-pms-primary flex items-center justify-center flex-shrink-0 shadow-xs pointer-events-none">
            <UploadCloud className="w-5 h-5 text-pms-accent" />
          </div>

          <div className="flex-1 min-w-0 pointer-events-none">
            <div className="text-xs font-semibold text-slate-800">
              <span className="text-pms-accent hover:underline">Click to browse</span> or drag & drop {maxFiles === 1 ? 'file' : 'files'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hint}
            </div>
          </div>

          <input
            id={inputId}
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            onChange={handleInputChange}
            className="sr-only"
            disabled={disabled}
          />
        </label>
      )}

      {/* Limit Reached Banner */}
      {isLimitReached && !disabled && (
        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
          <span>
            {maxFiles === 1
              ? '1 file attached. To upload a different file, remove or delete the current one first.'
              : `Maximum attachment limit reached (${maxFiles}/${maxFiles}). Delete an existing item to upload new ones.`}
          </span>
        </div>
      )}

      {/* Local Error message */}
      {localError && (
        <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{localError}</span>
        </div>
      )}

      {/* Combined File List Display */}
      {currentTotal > 0 && (
        <div className="space-y-1.5 pt-1">
          {/* Existing Saved Attachments */}
          {existingAttachments && existingAttachments.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
                Saved Attachments ({existingAttachments.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {existingAttachments.map((att, idx) => {
                  const cat = getFileCategory(att);
                  return (
                    <div
                      key={att.path || idx}
                      className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileTypeIcon category={cat} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-800 truncate" title={att.name || 'Attachment'}>
                            {att.name || 'Attachment'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                            {att.size ? <span>{formatBytes(att.size)}</span> : null}
                            {cat === 'video' && <span className="font-semibold text-indigo-600">Video Proof</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleViewExisting(att)}
                          className="p-1 text-slate-500 hover:text-pms-accent hover:bg-slate-100 rounded cursor-pointer transition-colors"
                          title="View / Download file"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteExisting && !disabled && (
                          <button
                            type="button"
                            onClick={() => onDeleteExisting(idx, att)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer transition-colors"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Staged New Files for Upload */}
          {newFiles && newFiles.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pms-accent block px-0.5">
                New Files Ready to Upload ({newFiles.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {newFiles.map((file, idx) => {
                  const cat = getFileCategory(file);
                  return (
                    <div
                      key={`${file.name}_${idx}`}
                      className="flex items-center justify-between gap-2 p-2 bg-blue-50/50 border border-blue-200 rounded-lg shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileTypeIcon category={cat} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900 truncate" title={file.name}>
                            {file.name}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                            <span>{formatBytes(file.size)}</span>
                            {cat === 'video' && <span className="font-semibold text-indigo-600">Video Proof</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(cat === 'image' || cat === 'video') && (
                          <button
                            type="button"
                            onClick={() => handlePreviewNewFile(file)}
                            className="p-1 text-slate-500 hover:text-pms-accent hover:bg-white rounded cursor-pointer transition-colors"
                            title="Preview media"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded cursor-pointer transition-colors"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative bg-slate-900 rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700 text-white">
              <span className="text-xs font-semibold truncate flex items-center gap-2">
                {previewMedia.type === 'video' ? <Film className="w-4 h-4 text-indigo-400" /> : <ImageIcon className="w-4 h-4 text-emerald-400" />}
                {previewMedia.title}
              </span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewMedia.url);
                  setPreviewMedia(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center bg-black/50 rounded-xl overflow-hidden max-h-[70vh]">
              {previewMedia.type === 'video' ? (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[65vh] w-full rounded-lg"
                />
              ) : (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.title}
                  className="max-h-[65vh] object-contain rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
