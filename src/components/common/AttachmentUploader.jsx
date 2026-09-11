import React, { useState, useRef } from 'react';
import { storageService } from '../../services/storageService';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  X,
  ExternalLink,
  AlertCircle,
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
  required = false,
  maxFiles = 10,
  maxSizeMb = 50,
  accept = 'image/*,video/mp4,video/quicktime,video/webm,video/x-matroska,application/pdf,.doc,.docx,.xls,.xlsx,.csv',
  newFiles = [],
  onNewFilesChange,
  existingAttachments = [],
  onDeleteExisting,
  disabled = false,
  hint = 'Photos, videos (proof of work), PDFs or docs up to 50 MB each',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  const currentTotal = (existingAttachments?.length || 0) + (newFiles?.length || 0);
  const isLimitReached = currentTotal >= maxFiles;

  const handleFilesAdded = (incomingList) => {
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

    if (validNewFiles.length > 0 && onNewFilesChange) {
      onNewFilesChange([...newFiles, ...validNewFiles]);
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
    handleFilesAdded(files);
    // Reset file input value so selecting the same file again works
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveNewFile = (idx) => {
    if (!onNewFilesChange) return;
    const updated = newFiles.filter((_, i) => i !== idx);
    onNewFilesChange(updated);
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

      {/* Drag and Drop Zone */}
      {!disabled && !isLimitReached && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left ${
            isDragging
              ? 'border-pms-accent bg-blue-50/70 ring-4 ring-pms-accent/15'
              : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 hover:border-pms-accent/70'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 text-pms-primary flex items-center justify-center flex-shrink-0 shadow-xs">
            <UploadCloud className="w-5 h-5 text-pms-accent" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800">
              <span className="text-pms-accent hover:underline">Click to browse</span> or drag & drop {maxFiles === 1 ? 'file' : 'files'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {hint}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
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

                      <button
                        type="button"
                        onClick={() => handleRemoveNewFile(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded cursor-pointer transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
