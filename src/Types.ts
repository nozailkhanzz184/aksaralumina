export type FileSystemItemType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: FileSystemItemType;
  content?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface AIGenFile {
  title: string;
  content: string;
}

export type AIMode = 'generate_command' | 'generate_command_explain';
