import { Plus } from 'lucide-react';
import type { TranslationBundle } from '../i18n/translations';

export type WorkspaceView = 'discover' | 'binder' | 'print';

interface TopBarProps {
  activeView: WorkspaceView;
  labels: TranslationBundle['nav'];
  onSelectView: (view: WorkspaceView) => void;
  onOpenNewFolder: () => void;
}

export function TopBar({ activeView, labels, onSelectView, onOpenNewFolder }: TopBarProps) {
  const navItems: { id: WorkspaceView; label: string }[] = [
    { id: 'discover', label: labels.discover },
    { id: 'binder', label: labels.binder },
    { id: 'print', label: labels.printPacket },
  ];

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-8 border-b border-[#E5E2DC] bg-[#FAF9F6]/95 px-6 py-3.5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onSelectView('discover')}
        className="font-display cursor-pointer text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332]"
      >
        LessonFolio
      </button>

      <nav aria-label="Primary workspace views" className="flex items-center gap-6 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={`cursor-pointer border-b-2 py-1 text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1B4332] ${
                isActive
                  ? 'border-[#1B4332] text-[#1C1917]'
                  : 'border-transparent text-[#57534E] hover:border-[#D6D3CD] hover:text-[#1C1917]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenNewFolder}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#2D6A4F] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4332]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{labels.newFolder}</span>
        </button>
      </div>
    </header>
  );
}
