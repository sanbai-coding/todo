import { usePlanStore } from '../../../store/planStore';
import { useUIStore } from '../../../store/uiStore';
import type { Project } from '../../../types';

/**
 * 月度规划里有哪些项目，项目规划就有哪些面板 —— 不需要单独建看板。
 * 一次只聚焦一个项目；没选过、或者选中的项目被删掉了，就回落到第一个。
 */
export function useActiveBoardProject(): { projects: Project[]; activeProject: Project | null } {
  const projects = usePlanStore(state => state.projects);
  const boardProjectId = useUIStore(state => state.boardProjectId);

  const activeProject =
    projects.find(p => p.id === boardProjectId) ?? projects[0] ?? null;

  return { projects, activeProject };
}
