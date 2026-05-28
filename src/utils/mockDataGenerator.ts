import { usePlanStore } from '../store/planStore';
import { useTodoStore } from '../store/todoStore';
import { dateToStr } from './dateUtils';
import type { TodoStatus, Quadrant } from '../types';

export const generateAIPMData = () => {
  const planStore = usePlanStore.getState();
  const todoStore = useTodoStore.getState();
  
  // Clear existing data for a clean slate
  usePlanStore.setState({ projects: [], categories: [], plans: [], tags: [] });
  useTodoStore.setState({ todos: [], globalTags: [] });

  const today = new Date();
  const getDate = (offsetDays: number) => dateToStr(new Date(today.getTime() + offsetDays * 86400000));
  
  // Create Projects & Categories using planStore methods so tags are generated
  
  // 1. Project: 待办工具V1.0研发
  planStore.addProject('待办工具V1.0研发', 'teal');
  const proj1 = usePlanStore.getState().projects.find(p => p.name === '待办工具V1.0研发')!;
  
  planStore.addCategory(proj1.id, '需求分析');
  planStore.addCategory(proj1.id, '产品设计');
  planStore.addCategory(proj1.id, '开发跟进');
  planStore.addCategory(proj1.id, '测试验收');
  
  // 2. Project: 竞品与市场分析
  planStore.addProject('竞品与市场分析', 'rust');
  const proj2 = usePlanStore.getState().projects.find(p => p.name === '竞品与市场分析')!;
  
  planStore.addCategory(proj2.id, '竞品调研');
  planStore.addCategory(proj2.id, '用户访谈');
  
  // 3. Project: 运营与增长
  planStore.addProject('运营与增长', 'ochre');
  const proj3 = usePlanStore.getState().projects.find(p => p.name === '运营与增长')!;
  
  planStore.addCategory(proj3.id, '种子用户招募');
  planStore.addCategory(proj3.id, '内容营销');

  const getCatId = (projId: string, name: string) => {
    return usePlanStore.getState().categories.find(c => c.projectId === projId && c.name === name)!.id;
  };

  // Create Plans & link to Todos
  const createTodoAndPlan = (
    title: string, 
    projId: string, 
    catName: string, 
    status: TodoStatus, 
    priority: 'low' | 'medium' | 'high', 
    quadrant: Quadrant, 
    dayOffset: number
  ) => {
    const catId = getCatId(projId, catName);
    
    // Add Plan
    planStore.addPlan(projId, catId, title);
    const plan = usePlanStore.getState().plans.find(p => p.title === title)!;
    
    // Add Todo
    const todoId = todoStore.addTodo({
      title,
      status,
      priority,
      quadrant,
      dueDate: getDate(dayOffset),
      tags: [projId, catId],
      sortOrder: 0
    });
    
    // Link them
    planStore.linkTodoToPlan(plan.id, todoId);
  };

  // Generate Data for 待办工具V1.0研发
  createTodoAndPlan('收集竞品(TickTick, Todoist)的优缺点', proj1.id, '需求分析', 'done', 'high', 'important_urgent', -10);
  createTodoAndPlan('撰写核心功能PRD：标签与看板机制', proj1.id, '需求分析', 'done', 'high', 'important_urgent', -8);
  createTodoAndPlan('与研发团队过PRD并确认排期', proj1.id, '需求分析', 'done', 'high', 'important_urgent', -7);
  
  createTodoAndPlan('输出低保真原型图', proj1.id, '产品设计', 'done', 'medium', 'important_not_urgent', -6);
  createTodoAndPlan('UI视觉评审（主打暖中性调性）', proj1.id, '产品设计', 'done', 'medium', 'important_not_urgent', -4);
  createTodoAndPlan('跟进设计资源切图与标注', proj1.id, '产品设计', 'done', 'medium', 'not_important_urgent', -2);

  createTodoAndPlan('跟进前端Zustand状态管理联调', proj1.id, '开发跟进', 'in_progress', 'high', 'important_urgent', -1);
  createTodoAndPlan('梳理本地存储与云端同步的边界逻辑', proj1.id, '开发跟进', 'todo', 'high', 'important_urgent', 0);
  createTodoAndPlan('跟进月度规划看板的横向滚动效果实现', proj1.id, '开发跟进', 'todo', 'high', 'important_urgent', 0);
  createTodoAndPlan('跟进飞书妙搭的线上部署', proj1.id, '开发跟进', 'todo', 'medium', 'important_not_urgent', 1);
  
  createTodoAndPlan('制定V1.0内部测试用例', proj1.id, '测试验收', 'todo', 'medium', 'important_not_urgent', 3);
  createTodoAndPlan('组织内部Dogfooding', proj1.id, '测试验收', 'todo', 'high', 'important_urgent', 5);
  createTodoAndPlan('收集反馈并排期修复Bug', proj1.id, '测试验收', 'todo', 'medium', 'important_not_urgent', 7);

  // Generate Data for 竞品与市场分析
  createTodoAndPlan('体验市面上的AI日程助手并输出体验报告', proj2.id, '竞品调研', 'done', 'medium', 'important_not_urgent', -12);
  createTodoAndPlan('分析竞品的商业化变现模式', proj2.id, '竞品调研', 'todo', 'low', 'not_important_not_urgent', 2);
  
  createTodoAndPlan('邀请5位重度待办用户进行深度访谈', proj2.id, '用户访谈', 'todo', 'high', 'important_urgent', -1); // overdue
  createTodoAndPlan('整理用户访谈录音及核心洞察', proj2.id, '用户访谈', 'todo', 'medium', 'important_not_urgent', 1);

  // Generate Data for 运营与增长
  createTodoAndPlan('建立种子用户内测微信群', proj3.id, '种子用户招募', 'todo', 'high', 'important_urgent', 10);
  createTodoAndPlan('在V2EX发布产品冷启动邀请帖', proj3.id, '种子用户招募', 'todo', 'medium', 'important_not_urgent', 11);
  
  createTodoAndPlan('撰写小红书/即刻首发冷启动图文', proj3.id, '内容营销', 'todo', 'medium', 'important_not_urgent', 12);
  createTodoAndPlan('准备产品演示短视频', proj3.id, '内容营销', 'todo', 'medium', 'important_not_urgent', 14);

  // Add some standalone plans without todos to show pure plans
  const catDesignId = getCatId(proj1.id, '产品设计');
  planStore.addPlan(proj1.id, catDesignId, '收集优质UI灵感库');
  
  const catMarketingId = getCatId(proj3.id, '内容营销');
  planStore.addPlan(proj3.id, catMarketingId, '规划上线第一个月的社媒日历');

  // Trigger sync if needed
  useTodoStore.getState().syncToCloud();
  usePlanStore.getState().syncToCloud();
};
