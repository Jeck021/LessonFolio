export type GradeBand = 'All K-12' | 'K-2' | '3-5' | '6-8' | '9-12';

export type ResourceType =
  | 'Lesson Plan'
  | 'Activity'
  | 'Video & Media'
  | 'Assessment'
  | 'Reading'
  | 'AI Guide';

export type FolderColor = 'sage' | 'ochre' | 'slate' | 'plum' | 'teal';

export interface LessonFolder {
  id: string;
  name: string;
  description: string;
  gradeBand: GradeBand;
  colorTag: FolderColor;
  createdAt: string;
  updatedAt: string;
}

export interface SavedResource {
  id: string;
  folderId: string;
  title: string;
  url?: string;
  sourceDomain?: string;
  resourceType: ResourceType;
  gradeBand: GradeBand;
  estimatedTime: string;
  summary: string;
  fullGuideMarkdown?: string;
  keyTakeaways?: string[];
  teacherNotes: string;
  addedBy: 'user' | 'assistant';
  savedAt: string;
}

export interface GroundCitation {
  title: string;
  uri: string;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  gradeBand: GradeBand;
  resourceType: ResourceType;
  estimatedTime: string;
  keyTakeaways: string[];
}

export type FolderAction =
  | {
      type: 'create_folder';
      folderName: string;
      gradeBand: GradeBand;
      description: string;
      colorTag: FolderColor;
    }
  | {
      type: 'save_resource';
      folderName: string;
      title: string;
      url?: string;
      sourceDomain?: string;
      resourceType: ResourceType;
      gradeBand: GradeBand;
      estimatedTime: string;
      summary: string;
      fullGuideMarkdown?: string;
      keyTakeaways?: string[];
      teacherNotes?: string;
    };

export interface AppliedActionReceipt {
  id: string;
  type: 'create_folder' | 'save_resource';
  folderId: string;
  folderName: string;
  resourceTitle?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: GroundCitation[];
  appliedActions?: AppliedActionReceipt[];
  timestamp: string;
  isError?: boolean;
}

export interface BinderExportData {
  version: number;
  exportedAt: string;
  folders: LessonFolder[];
  resources: SavedResource[];
}
