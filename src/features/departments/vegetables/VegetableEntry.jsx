import React from 'react';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';
import { Trash2, UploadCloud, Leaf, Clock, CheckCircle2 } from 'lucide-react';

export function VegetableEntry({ entry, index, onChange, onRemove }) {
  const handleFieldChange = (field, value) => {
    onChange(index, { ...entry, [field]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(index, { ...entry, attachmentFile: file });
    }
  };

  const vegType = entry.vegType || 'Normal';
  const source = entry.source || 'Local';
  const status = entry.status || 'Pending';

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4.5 space-y-4 shadow-sm relative transition-all border-l-4 border-l-pms-accent hover:border-slate-300">
      {/* Entry Card Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="bg-blue-100 text-pms-primary font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            <span>Item #{index + 1}</span>
          </span>
          <span className="text-xs font-bold text-slate-800">
            {vegType} Vegetable {vegType === 'English' ? `(${source})` : ''}
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Item</span>
        </Button>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Veg Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Vegetable Type <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-white p-1 border border-slate-200 rounded-xl shadow-xs">
            {['Normal', 'English'].map((t) => {
              const isSelected = vegType === t;
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleFieldChange('vegType', t)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pms-primary text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Source Selector (If English) OR Status Selector */}
        {vegType === 'English' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Source Location <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-white p-1 border border-slate-200 rounded-xl shadow-xs">
              {['Local', 'Outstation'].map((s) => {
                const isSelected = source === s;
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => handleFieldChange('source', s)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-pms-accent text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 3. Status Selector */}
        <div className={`space-y-1.5 ${vegType === 'Normal' ? 'sm:col-span-1' : 'sm:col-span-2'}`}>
          <label className="text-xs font-semibold text-slate-700 block">
            Status <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 bg-white p-1 border border-slate-200 rounded-xl shadow-xs">
            <button
              type="button"
              onClick={() => handleFieldChange('status', 'Pending')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                status === 'Pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span>Pending</span>
            </button>

            <button
              type="button"
              onClick={() => handleFieldChange('status', 'Complete')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                status === 'Complete'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 opacity-80" />
              <span>Complete</span>
            </button>
          </div>
        </div>
      </div>

      {/* Remarks Field */}
      <Textarea
        label="Remarks"
        required={status === 'Pending'}
        optional={status === 'Complete'}
        placeholder="Vegetable specifications, weight/quantity or supplier instructions..."
        value={entry.remarks || ''}
        onChange={(e) => handleFieldChange('remarks', e.target.value)}
      />

      {/* Attachment Proof Field (when Complete) */}
      {status === 'Complete' && (
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Attachment Proof <span className="text-red-500 font-bold">*</span></span>
            <span className="text-[10px] text-slate-400 font-normal">Photo / Receipt up to 5MB</span>
          </label>
          <label className="border-2 border-dashed border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 hover:border-pms-accent transition-all cursor-pointer flex items-center gap-3">
            <UploadCloud className="w-5 h-5 text-pms-accent flex-shrink-0" />
            <div className="flex-1 min-w-0 text-xs">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="font-semibold text-slate-900 truncate">
                {entry.attachmentFile ? entry.attachmentFile.name : (entry.attachment?.name || 'Click to select receipt or proof photo')}
              </div>
              <div className="text-[11px] text-slate-400">
                {entry.attachmentFile ? `${(entry.attachmentFile.size / 1024 / 1024).toFixed(2)} MB` : 'Upload purchase proof or receipt image'}
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
