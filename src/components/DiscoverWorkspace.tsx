import { useState } from 'react';
import {
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  ExternalLink,
  FolderPlus,
  Globe,
  MessageSquarePlus,
  Search,
  WifiOff,
} from 'lucide-react';
import {
  cacheSearchResults,
  OFFLINE_CURRICULUM_BANK,
  searchOfflineResources,
} from '../data/offlineLibrary';
import type { LanguageCode, TranslationBundle } from '../i18n/translations';
import type {
  GradeBand,
  GroundCitation,
  LessonFolder,
  ResourceType,
  SavedResource,
  SearchResult,
} from '../types';

interface DiscoverWorkspaceProps {
  folders: LessonFolder[];
  savedResources: SavedResource[];
  activeFolderId: string | null;
  language: LanguageCode;
  isOnline: boolean;
  labels: TranslationBundle['discover'];
  onSaveResultToFolder: (
    result: SearchResult,
    folderId: string,
    fullGuideMarkdown?: string
  ) => void;
  onCreateFolderFromSearch: (result: SearchResult, fullGuideMarkdown?: string) => void;
  onAskAssistantDeeper: (prompt: string) => void;
  onOpenFolder: (folderId: string) => void;
}

const GRADE_FILTERS: GradeBand[] = ['All K-12', 'K-2', '3-5', '6-8', '9-12'];
const FORMAT_FILTERS: ('All' | ResourceType)[] = [
  'All',
  'Lesson Plan',
  'Activity',
  'Video & Media',
  'Assessment',
  'Reading',
];

export function DiscoverWorkspace({
  folders,
  savedResources,
  activeFolderId,
  language,
  isOnline,
  labels,
  onSaveResultToFolder,
  onCreateFolderFromSearch,
  onAskAssistantDeeper,
  onOpenFolder,
}: DiscoverWorkspaceProps) {
  const [query, setQuery] = useState('');
  const [gradeBand, setGradeBand] = useState<GradeBand>('All K-12');
  const [resourceType, setResourceType] = useState<'All' | ResourceType>('All');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryNote, setSummaryNote] = useState<string | null>(null);
  const [usedOfflineSearch, setUsedOfflineSearch] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [webSources, setWebSources] = useState<GroundCitation[]>([]);
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [isRefreshingLive, setIsRefreshingLive] = useState(false);

  const runLocalFallbackSearch = (
    trimmedQuery: string,
    targetGrade: GradeBand,
    noticeMessage?: string
  ) => {
    const localMatches = searchOfflineResources({
      query: trimmedQuery,
      gradeBand: targetGrade,
      resourceType,
      savedResources,
      languageCode: language,
    });
    setUsedOfflineSearch(true);
    setApiNotice(noticeMessage ?? null);
    setSummaryNote(noticeMessage ? null : labels.offlineSearchBanner);
    setResults(localMatches);
    setWebSources([]);
    setError(null);
  };

  const runSearch = async (searchQuery: string, targetGrade = gradeBand) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setError(null);
    setApiNotice(null);
    setOpenPickerId(null);

    if (!isOnline) {
      setIsLoading(false);
      setIsRefreshingLive(false);
      runLocalFallbackSearch(trimmed, targetGrade);
      return;
    }

    // Instant local + cached preview while live web research runs
    const instantMatches = searchOfflineResources({
      query: trimmed,
      gradeBand: targetGrade,
      resourceType,
      savedResources,
      languageCode: language,
      allowGenericFallback: false,
    });
    if (instantMatches.length > 0) {
      setResults(instantMatches);
      setUsedOfflineSearch(true);
      setIsLoading(false);
      setIsRefreshingLive(true);
    } else {
      setIsLoading(true);
      setIsRefreshingLive(false);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 14000);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          query: trimmed,
          gradeBand: targetGrade,
          resourceType,
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
          runLocalFallbackSearch(
            trimmed,
            targetGrade,
            `${data.error || 'Live Gemini search is temporarily busy.'} Showing local binder, cached searches, and offline curriculum matches below.`
          );
          return;
        }
        throw new Error(data.error || 'Search request failed.');
      }
      const nextResults: SearchResult[] = Array.isArray(data.results) ? data.results : [];
      cacheSearchResults(nextResults);
      setUsedOfflineSearch(false);
      setApiNotice(null);
      setSummaryNote(data.summaryNote || null);
      setResults(nextResults);
      setWebSources(Array.isArray(data.webSources) ? data.webSources : []);
    } catch (err) {
      if (
        !navigator.onLine ||
        (err instanceof Error && err.name === 'AbortError') ||
        (err instanceof TypeError && err.message.includes('fetch'))
      ) {
        runLocalFallbackSearch(
          trimmed,
          targetGrade,
          navigator.onLine
            ? 'Live web research took too long — showing instant local & cached matches.'
            : undefined
        );
      } else {
        setError(err instanceof Error ? err.message : 'Unable to complete search right now.');
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
      setIsRefreshingLive(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch(query);
  };

  const handleQuickTopic = (topic: TranslationBundle['discover']['quickTopics'][number]) => {
    setQuery(topic.query);
    setGradeBand(topic.grade);
    void runSearch(topic.query, topic.grade);
  };

  const lookupOfflineGuide = (resultId: string): string | undefined => {
    const bankMatch = OFFLINE_CURRICULUM_BANK.find((item) => item.id === resultId);
    if (!bankMatch) return undefined;
    return language === 'tl' && bankMatch.fullGuideMarkdownTl
      ? bankMatch.fullGuideMarkdownTl
      : bankMatch.fullGuideMarkdown;
  };

  const handleSavePick = (result: SearchResult, folderId: string) => {
    const guide = lookupOfflineGuide(result.id);
    onSaveResultToFolder(result, folderId, guide);
    const folder = folders.find((f) => f.id === folderId);
    setSavedMap((prev) => ({ ...prev, [result.id]: folder?.name ?? 'Folder' }));
    setOpenPickerId(null);
  };

  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? folders[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <section className="rounded-xl border border-[#E5E2DC] bg-white p-6">
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-12">
          <div className="flex flex-col justify-between md:col-span-7">
            <div>
              <p className="text-xs font-medium text-[#57534E]">{labels.kicker}</p>
              <h1 className="font-display mt-2 text-2xl font-semibold leading-tight text-[#1C1917] sm:text-3xl [text-wrap:balance]">
                {labels.headline}
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-[#57534E]">{labels.subheadline}</p>
            </div>
          </div>

          <div className="md:col-span-5">
            {!imageError ? (
              <div className="relative h-40 w-full overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#F3F1EC] md:h-full md:min-h-[164px]">
                <img
                  src="/src/assets/images/editorial_planner_desk_1795522011699.jpg"
                  alt="Open linen teacher lesson planner notebook on warm parchment paper"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-40 w-full flex-col items-center justify-center rounded-lg border border-[#E5E2DC] bg-[#F3F1EC] p-4 text-center md:h-full">
                <BookOpen className="h-7 w-7 text-[#1B4332]" aria-hidden="true" />
                <span className="font-display mt-2 text-sm font-medium text-[#1C1917]">
                  LessonFolio
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#78716C]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={labels.searchPlaceholder}
                aria-label={labels.searchPlaceholder}
                className="w-full rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] py-3 pr-4 pl-10 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1B4332] focus:bg-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isRefreshingLive || !query.trim()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#1B4332] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2D6A4F] disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span>{isLoading || isRefreshingLive ? labels.searchingButton : labels.searchButton}</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2DC] pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[#57534E]">{labels.gradeBandLabel}</span>
              <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F3F1EC] p-1">
                {GRADE_FILTERS.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeBand(grade)}
                    className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      gradeBand === grade
                        ? 'bg-white text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="format-select" className="text-xs font-medium text-[#57534E]">
                {labels.formatLabel}
              </label>
              <select
                id="format-select"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as 'All' | ResourceType)}
                className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-2.5 py-1.5 text-xs font-medium text-[#1C1917] focus:border-[#1B4332] focus:outline-none"
              >
                {FORMAT_FILTERS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt === 'All' ? labels.allFormats : fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </section>

      {!isLoading && results.length === 0 && !error && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold tracking-wide text-[#57534E]">
            {labels.trySearchHeading}
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {labels.quickTopics.map((topic) => (
              <button
                key={topic.label}
                type="button"
                onClick={() => handleQuickTopic(topic)}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#E5E2DC] bg-white px-4 py-3 text-left transition-colors hover:border-[#1B4332]/40 hover:bg-[#FAF9F6]"
              >
                <div>
                  <div className="text-sm font-medium text-[#1C1917]">{topic.label}</div>
                  <div className="mt-0.5 text-xs text-[#57534E]">
                    {topic.grade} · {labels.groundedLabel}
                  </div>
                </div>
                <Search className="h-4 w-4 shrink-0 text-[#57534E]" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900"
        >
          <p className="font-medium">Could not complete resource search</p>
          <p className="mt-1 text-red-800">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 space-y-4" aria-live="polite" aria-label="Loading search results">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-[#E5E2DC] bg-white p-5">
              <div className="h-3 w-48 rounded bg-[#E5E2DC]" />
              <div className="mt-3 h-5 w-3/4 rounded bg-[#E5E2DC]" />
              <div className="mt-2.5 h-3.5 w-full rounded bg-[#F3F1EC]" />
              <div className="mt-1.5 h-3.5 w-5/6 rounded bg-[#F3F1EC]" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <section className="mt-6 space-y-4">
          {isRefreshingLive && !apiNotice && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-lg border border-[#1B4332]/25 bg-[#EDF3EF]/70 px-4 py-2.5 text-xs text-[#1B4332]"
            >
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Showing instant local matches while researching live web resources...</span>
            </div>
          )}

          {apiNotice && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#B45309]/35 bg-[#FEF3C7]/55 px-4 py-3 text-xs text-[#1C1917]"
            >
              <div className="flex items-start gap-2">
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
                <span>{apiNotice}</span>
              </div>
              {isOnline && query.trim() && (
                <button
                  type="button"
                  onClick={() => void runSearch(query)}
                  className="cursor-pointer rounded-md border border-[#1C1917]/15 bg-white px-3 py-1 font-medium text-[#1C1917] hover:bg-[#FAF9F6] whitespace-nowrap shrink-0"
                >
                  Retry Live Search
                </button>
              )}
            </div>
          )}

          {summaryNote && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm ${
                usedOfflineSearch
                  ? 'border-[#B45309]/30 bg-[#FEF3C7]/45 text-[#1C1917]'
                  : 'border-[#E5E2DC] bg-[#F3F1EC]/70 text-[#1C1917]'
              }`}
            >
              {usedOfflineSearch && (
                <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[#B45309]" aria-hidden="true" />
              )}
              <span>{summaryNote}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#57534E]">
            <span className="font-mono-tabular">{results.length}</span>
            {activeFolder && (
              <button
                type="button"
                onClick={() => onOpenFolder(activeFolder.id)}
                className="cursor-pointer font-medium text-[#1B4332] hover:underline"
              >
                {labels.activeFolderPrefix} {activeFolder.name}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {results.map((result) => {
              const savedFolderName = savedMap[result.id];
              const pickerOpen = openPickerId === result.id;

              return (
                <article
                  key={result.id}
                  className="rounded-xl border border-[#E5E2DC] bg-white p-5 transition-colors hover:border-[#D6D3CD]"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#57534E]">
                    <span>{result.gradeBand}</span>
                    <span aria-hidden="true">·</span>
                    <span>{result.resourceType}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">{result.estimatedTime}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{result.domain}</span>
                  </div>

                  <h3 className="font-display mt-1.5 text-lg font-semibold text-[#1C1917]">
                    {result.url ? (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-baseline gap-1.5 hover:text-[#1B4332] hover:underline"
                      >
                        <span>{result.title}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    ) : (
                      result.title
                    )}
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#44403C]">{result.snippet}</p>

                  {result.keyTakeaways.length > 0 && (
                    <ul className="mt-3 space-y-1 border-t border-[#F3F1EC] pt-3 text-xs text-[#57534E]">
                      {result.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#1B4332]" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="relative mt-4 flex flex-wrap items-center gap-2.5 border-t border-[#E5E2DC] pt-3.5">
                    {activeFolder && !savedFolderName && (
                      <button
                        type="button"
                        onClick={() => handleSavePick(result, activeFolder.id)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#1B4332] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#2D6A4F]"
                      >
                        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="max-w-[200px] truncate">
                          {labels.saveToPrefix} {activeFolder.name}
                        </span>
                      </button>
                    )}

                    {savedFolderName && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B4332]/25 bg-[#EDF3EF] px-3.5 py-1.5 text-xs font-medium text-[#1B4332]">
                        <BookmarkCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {labels.savedToPrefix} {savedFolderName}
                        </span>
                      </span>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPickerId((prev) => (prev === result.id ? null : result.id))
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#1C1917] transition-colors hover:bg-[#F3F1EC]"
                      >
                        <FolderPlus className="h-3.5 w-3.5 text-[#57534E]" aria-hidden="true" />
                        <span>{labels.chooseFolder}</span>
                      </button>

                      {pickerOpen && (
                        <div className="absolute top-full left-0 z-20 mt-1.5 w-64 rounded-lg border border-[#E5E2DC] bg-white p-1.5 shadow-lg">
                          <div className="px-2.5 py-1.5 text-xs font-medium text-[#57534E]">
                            {labels.chooseFolder}
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                type="button"
                                onClick={() => handleSavePick(result, folder.id)}
                                className="flex w-full cursor-pointer items-center justify-between rounded-md px-2.5 py-2 text-left text-xs text-[#1C1917] hover:bg-[#F3F1EC]"
                              >
                                <span className="truncate font-medium">{folder.name}</span>
                                <span className="ml-2 shrink-0 text-[#57534E]">
                                  {folder.gradeBand}
                                </span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenPickerId(null);
                              onCreateFolderFromSearch(result, lookupOfflineGuide(result.id));
                            }}
                            className="mt-1 flex w-full cursor-pointer items-center gap-1.5 border-t border-[#E5E2DC] px-2.5 py-2 text-left text-xs font-medium text-[#1B4332] hover:bg-[#EDF3EF]"
                          >
                            <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{labels.createNewFolderOption}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onAskAssistantDeeper(
                          `Go deeper on "${result.title}" (${result.gradeBand}, ${result.resourceType})${
                            result.url ? ` from ${result.url}` : ''
                          }. Explain how I can teach this effectively, suggest differentiation strategies for ELL/struggling learners, and offer an exit ticket.`
                        )
                      }
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E5E2DC] bg-white px-3 py-1.5 text-xs font-medium text-[#57534E] transition-colors hover:border-[#1B4332]/40 hover:text-[#1B4332]"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{labels.askDeeper}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {webSources.length > 0 && (
            <div className="rounded-xl border border-[#E5E2DC] bg-[#F3F1EC]/60 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917]">
                <Globe className="h-3.5 w-3.5 text-[#1B4332]" aria-hidden="true" />
                <span>{labels.groundedSourcesTitle}</span>
              </div>
              <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {webSources.map((src, idx) => (
                  <li key={`${src.uri}-${idx}`} className="truncate text-xs">
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-[#1B4332] hover:underline"
                    >
                      <span className="truncate">{src.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
