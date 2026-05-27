export type TagLevel = 'L1' | 'L2';
export type TagTone = 'teal' | 'rust' | 'clay' | 'ochre' | 'sage' | 'slate' | 'plum' | 'rose';

export interface Tag {
  id: string;
  name: string;
  level: TagLevel;
  tone: TagTone;
  parentId?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  title: string;
  projectId: string;
  categoryId: string;
  todoId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  projectId: string;
  planIds: string[];
  isOpen: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  tone: TagTone;
  categoryIds: string[];
  isOpen: boolean;
  sortOrder: number;
  createdAt: string;
}

export const TAG_TONES: Record<TagTone, string> = {
  teal: 'var(--tag-teal)',
  rust: 'var(--tag-rust)',
  clay: 'var(--tag-clay)',
  ochre: 'var(--tag-ochre)',
  sage: 'var(--tag-sage)',
  slate: 'var(--tag-slate)',
  plum: 'var(--tag-plum)',
  rose: 'var(--tag-rose)',
};

export const DEFAULT_TONE: TagTone = 'teal';
