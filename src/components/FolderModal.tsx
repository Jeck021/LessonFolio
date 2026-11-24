import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';
import type { FolderColor, GradeBand, LessonFolder } from '../types';

interface FolderModalProps {
  isOpen: boolean;
  editingFolder: LessonFolder | null;
  labels: TranslationBundle['modal'];
  onClose: () => void;
  onSave: (data: {
    name: string;
    gradeBand: GradeBand;
    description: string;
    colorTag: FolderColor;
  }) => void;
}

const GRADE_OPTIONS: GradeBand[] = ['All K-12', 'K-2', '3-5', '6-8', '9-12'];

const COLOR_OPTIONS: { id: FolderColor; label: string; hex: string }[] = [
  { id: 'sage', label: 'Forest Sage', hex: '#1B4332' },
  { id: 'ochre', label: 'Warm Ochre', hex: '#B45309' },
  { id: 'slate', label: 'Slate Blue', hex: '#334155' },
  { id: 'plum', label: 'Muted Plum', hex: '#6B21A8' },
  { id: 'teal', label: 'Deep Teal', hex: '#0F766E' },
];

export function FolderModal({
  isOpen,
  editingFolder,
  labels,
  onClose,
  onSave,
}: FolderModalProps) {
  const [name, setName] = useState('');
  const [gradeBand, setGradeBand] = useState<GradeBand>('All K-12');
  const [description, setDescription] = useState('');
  const [colorTag, setColorTag] = useState<FolderColor>('sage');

  useEffect(() => {
    if (isOpen) {
      if (editingFolder) {
        setName(editingFolder.name);
        setGradeBand(editingFolder.gradeBand);
        setDescription(editingFolder.description);
        setColorTag(editingFolder.colorTag);
      } else {
        setName('');
        setGradeBand('All K-12');
        setDescription('');
        setColorTag('sage');
      }
    }
  }, [isOpen, editingFolder]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, gradeBand, description, colorTag });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/35 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-modal-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[#E5E2DC] bg-white p-6 shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-[#E5E2DC] pb-4">
          <div>
            <h2 id="folder-modal-title" className="font-display text-xl font-semibold text-[#1C1917]">
              {editingFolder ? labels.editTitle : labels.createTitle}
            </h2>
            <p className="mt-1 text-sm text-[#57534E]">{labels.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.cancel}
            className="cursor-pointer rounded-lg p-1.5 text-[#57534E] transition-colors hover:bg-[#F3F1EC] hover:text-[#1C1917]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-[#1C1917]">
              {labels.nameLabel}
            </label>
            <input
              id="folder-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={labels.namePlaceholder}
              className="mt-1.5 w-full rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="folder-grade" className="block text-sm font-medium text-[#1C1917]">
              {labels.gradeLabel}
            </label>
            <select
              id="folder-grade"
              value={gradeBand}
              onChange={(e) => setGradeBand(e.target.value as GradeBand)}
              className="mt-1.5 w-full rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1C1917] focus:border-[#1B4332] focus:bg-white focus:outline-none"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="folder-desc" className="block text-sm font-medium text-[#1C1917]">
              {labels.descLabel}
            </label>
            <textarea
              id="folder-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={labels.descPlaceholder}
              className="mt-1.5 w-full resize-none rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-[#1C1917]">{labels.colorLabel}</span>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              {COLOR_OPTIONS.map((swatch) => {
                const selected = colorTag === swatch.id;
                return (
                  <button
                    key={swatch.id}
                    type="button"
                    onClick={() => setColorTag(swatch.id)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-[#1B4332] bg-[#EDF3EF] text-[#1C1917]'
                        : 'border-[#E5E2DC] bg-white text-[#57534E] hover:bg-[#FAF9F6]'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: swatch.hex }}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">{swatch.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#E5E2DC] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-[#E5E2DC] bg-white px-4 py-2 text-sm font-medium text-[#57534E] transition-colors hover:bg-[#F3F1EC] hover:text-[#1C1917]"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F]"
            >
              {editingFolder ? labels.saveBtn : labels.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
