export function getBatchSuggestion(templateId: string, templates: Record<string, any> = {}) {
  const current = templates?.[templateId];
  if (!current) return null;
  const sameCategory = Object.values(templates).filter(
    (task: any) => task?.category === current.category && task.id !== templateId
  );
  if (sameCategory.length < 2) return null;
  const picked = [current, ...sameCategory.slice(0, 2)];
  return {
    templates: picked,
    bonusMultiplier: 1.1,
    message: `完成后将获得小幅连做奖励（${current.category} 类任务）`,
  };
}
