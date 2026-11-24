import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import {
  CheckCircle2,
  ExternalLink,
  FolderPlus,
  Globe,
  Maximize2,
  Minimize2,
  Send,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { LanguageCode, TranslationBundle } from '../i18n/translations';
import type {
  AppliedActionReceipt,
  ChatMessage,
  FolderAction,
  LessonFolder,
  SavedResource,
} from '../types';
import { runOfflineTeachingAssistant } from '../utils/offlineAssistant';

interface TeachingAssistantPanelProps {
  folders: LessonFolder[];
  allResources: SavedResource[];
  activeFolder: LessonFolder | null;
  activeFolderResources: SavedResource[];
  language: LanguageCode;
  isOnline: boolean;
  labels: TranslationBundle['assistant'];
  queuedPrompt: { id: string; text: string } | null;
  onClearQueuedPrompt: () => void;
  onApplyAgentActions: (actions: FolderAction[]) => AppliedActionReceipt[];
  onNavigateToFolder: (folderId: string) => void;
}

export function TeachingAssistantPanel({
  folders,
  allResources,
  activeFolder,
  activeFolderResources,
  language,
  isOnline,
  labels,
  queuedPrompt,
  onClearQueuedPrompt,
  onApplyAgentActions,
  onNavigateToFolder,
}: TeachingAssistantPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: labels.welcomeMessage,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Keep welcome message synchronized when language switches on an untouched thread
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.id === 'welcome-msg') {
        return [{ ...prev[0], content: labels.welcomeMessage }];
      }
      return prev;
    });
  }, [labels.welcomeMessage]);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const executeOfflineReply = (promptText: string, upstreamNotice?: string) => {
    const offlineOutput = runOfflineTeachingAssistant({
      prompt: promptText,
      language,
      folders,
      activeFolder,
      activeFolderResources,
      allResources,
    });

    const receipts =
      offlineOutput.folderActions.length > 0
        ? onApplyAgentActions(offlineOutput.folderActions)
        : [];

    const noticePrefix = upstreamNotice ? `> **Note:** ${upstreamNotice}\n\n` : '';

    const assistantMsg: ChatMessage = {
      id: `a-off-${Date.now()}`,
      role: 'assistant',
      content: `${noticePrefix}${offlineOutput.reply}`,
      appliedActions: receipts,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMsg]);
  };

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isSending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    if (!isOnline) {
      executeOfflineReply(trimmed);
      setIsSending(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 16000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextHistory
            .filter((m) => !m.isError)
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
          folders: folders.map((f) => ({
            id: f.id,
            name: f.name,
            gradeBand: f.gradeBand,
            description: f.description,
          })),
          activeFolderId: activeFolder?.id ?? null,
          activeFolderResources: activeFolderResources.slice(0, 8).map((r) => ({
            title: r.title,
            resourceType: r.resourceType,
            gradeBand: r.gradeBand,
            url: r.url,
          })),
          language,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (
          response.status === 429 ||
          response.status === 503 ||
          data.code === 'RATE_LIMIT' ||
          data.code === 'MODEL_BUSY'
        ) {
          executeOfflineReply(
            trimmed,
            data.error || 'Live Gemini API is temporarily busy; using Offline Assistant.'
          );
          return;
        }
        throw new Error(data.error || 'Assistant request failed.');
      }

      const actions: FolderAction[] = Array.isArray(data.folderActions) ? data.folderActions : [];
      const receipts = actions.length > 0 ? onApplyAgentActions(actions) : [];

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Done!',
        citations: Array.isArray(data.citations) ? data.citations : [],
        appliedActions: receipts,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      if (
        !navigator.onLine ||
        (err instanceof Error && err.name === 'AbortError') ||
        (err instanceof TypeError && err.message.includes('fetch'))
      ) {
        executeOfflineReply(
          trimmed,
          navigator.onLine && err instanceof Error && err.name === 'AbortError'
            ? 'Live Teaching Assistant took too long to respond; using instant Offline Assistant.'
            : undefined
        );
      } else {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content:
            err instanceof Error
              ? err.message
              : 'I ran into an issue reaching the teaching assistant.',
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (queuedPrompt) {
      const text = queuedPrompt.text;
      onClearQueuedPrompt();
      void sendMessage(text);
    }
  }, [queuedPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <aside
      aria-label={labels.title}
      className={`no-print flex h-full w-full flex-col border-l border-[#E5E2DC] bg-[#FAF9F6] transition-all duration-200 ${
        isWide ? 'lg:w-[540px]' : 'lg:w-[396px]'
      } lg:shrink-0`}
    >
      <div className="flex items-center justify-between border-b border-[#E5E2DC] bg-white px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-[#1C1917]">{labels.title}</h2>
          <p className="truncate text-xs text-[#57534E]">
            {!isOnline ? (
              <span className="inline-flex items-center gap-1 text-[#B45309]">
                <WifiOff className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{labels.offlineReady}</span>
              </span>
            ) : activeFolder ? (
              `${labels.contextPrefix} ${activeFolder.name}`
            ) : (
              labels.subtitleDefault
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsWide((prev) => !prev)}
            title={isWide ? 'Compact panel' : 'Expand panel'}
            aria-label={isWide ? 'Compact panel' : 'Expand panel'}
            className="hidden cursor-pointer rounded-lg p-1.5 text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917] lg:inline-flex"
          >
            {isWide ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() =>
              setMessages([
                {
                  id: 'welcome-msg',
                  role: 'assistant',
                  content: labels.welcomeMessage,
                  timestamp: new Date().toISOString(),
                },
              ])
            }
            title="Clear conversation"
            aria-label="Clear conversation"
            className="cursor-pointer rounded-lg p-1.5 text-[#57534E] hover:bg-[#F3F1EC] hover:text-[#1C1917]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[92%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1B4332] text-white'
                  : msg.isError
                  ? 'border border-red-200 bg-red-50 text-red-900'
                  : 'border border-[#E5E2DC] bg-white text-[#1C1917]'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="space-y-2 [&_a]:text-[#1B4332] [&_a]:underline [&_h2]:font-display [&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-display [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_ol]:ml-4 [&_ol]:list-decimal [&_p]:leading-relaxed">
                  <Markdown>{msg.content}</Markdown>
                </div>
              )}
            </div>

            {msg.appliedActions && msg.appliedActions.length > 0 && (
              <div className="mt-2 w-[92%] space-y-1.5">
                {msg.appliedActions.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => onNavigateToFolder(act.folderId)}
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#1B4332]/25 bg-[#EDF3EF] px-3 py-2 text-left text-xs transition-colors hover:bg-[#E1ECE5]"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {act.type === 'create_folder' ? (
                        <FolderPlus className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1B4332]" />
                      )}
                      <span className="truncate font-medium text-[#1C1917]">
                        {act.type === 'create_folder'
                          ? `${labels.createdFolderPrefix} ${act.folderName}`
                          : `${labels.savedResourcePrefix} "${act.resourceTitle}" -> ${act.folderName}`}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium text-[#1B4332]">
                      {labels.openAction}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 w-[92%] rounded-lg border border-[#E5E2DC] bg-[#F3F1EC]/70 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#57534E]">
                  <Globe className="h-3 w-3 text-[#1B4332]" aria-hidden="true" />
                  <span>{labels.sourcesLabel}</span>
                </div>
                <ul className="mt-1 space-y-1">
                  {msg.citations.slice(0, 4).map((cite, idx) => (
                    <li key={`${cite.uri}-${idx}`} className="truncate text-xs">
                      <a
                        href={cite.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1 text-[#1B4332] hover:underline"
                      >
                        <span className="truncate">{cite.title}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {messages.length === 1 && !isSending && (
          <div className="space-y-2 pt-2">
            <p className="text-xs font-medium text-[#57534E]">{labels.askToLabel}</p>
            {labels.starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="block w-full cursor-pointer rounded-lg border border-[#E5E2DC] bg-white px-3 py-2.5 text-left text-xs leading-relaxed text-[#1C1917] transition-colors hover:border-[#1B4332]/40 hover:bg-[#F3F1EC]/50"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {isSending && (
          <div className="flex items-start">
            <div className="rounded-xl border border-[#E5E2DC] bg-white px-4 py-3 text-xs text-[#57534E]">
              {isOnline ? labels.thinkingOnline : labels.thinkingOffline}
            </div>
          </div>
        )}

        <div ref={scrollEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-[#E5E2DC] bg-white p-3.5">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage(input);
              }
            }}
            placeholder={labels.placeholder}
            aria-label={labels.title}
            className="flex-1 resize-none rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            aria-label="Send message"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-[#1B4332] text-white transition-colors hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 shrink-0"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </form>
    </aside>
  );
}
