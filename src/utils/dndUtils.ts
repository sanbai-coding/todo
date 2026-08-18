/**
 * 拖拽用的复合 id。
 *
 * 注意分隔符必须是 nanoid 生成不出来的字符：nanoid 的字母表包含 "-" 和 "_"，
 * 约三成的 id 里带 "-"，所以用 "-" 拼再 split("-") 会把 id 本身切碎。这里统一用 "::"。
 */
const SEP = '::';

export const dragId = {
  project: (projectId: string) => `project${SEP}${projectId}`,
  category: (projectId: string, categoryId: string) =>
    `category${SEP}${projectId}${SEP}${categoryId}`,
  plan: (planId: string) => `plan${SEP}${planId}`,
  planColumn: (categoryId: string) => `planColumn${SEP}${categoryId}`,
};

export type DragKind = 'project' | 'category' | 'plan' | 'planColumn';

export interface ParsedDragId {
  kind: DragKind;
  /** project: [projectId] · category: [projectId, categoryId] · plan: [planId] · planColumn: [categoryId] */
  parts: string[];
}

/** 不是复合 id（比如待办用的裸 id）时返回 null */
export function parseDragId(raw: string): ParsedDragId | null {
  const [kind, ...parts] = raw.split(SEP);
  if (parts.length === 0) return null;
  if (kind === 'project' || kind === 'category' || kind === 'plan' || kind === 'planColumn') {
    return { kind, parts };
  }
  return null;
}
