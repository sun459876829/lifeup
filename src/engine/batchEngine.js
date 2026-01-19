const DEFAULT_BATCH_SIZE = 3;
const DEFAULT_BONUS_RATE = 0.1;

export function getBatchRecommendation({
  completedTask,
  taskConfig,
  activeTasks = [],
  batchSize = DEFAULT_BATCH_SIZE,
  bonusRate = DEFAULT_BONUS_RATE,
}) {
  if (!completedTask || !taskConfig) return null;
  if (!completedTask.category) return null;

  const activeTemplateIds = new Set(
    activeTasks.map((task) => task?.templateId).filter(Boolean)
  );

  const candidates = Object.values(taskConfig)
    .filter((template) => template.category === completedTask.category)
    .filter(
      (template) =>
        template.templateId !== completedTask.templateId &&
        !activeTemplateIds.has(template.templateId)
    );

  if (candidates.length < batchSize) return null;

  return {
    tasks: candidates.slice(0, batchSize),
    bonus: bonusRate,
  };
}
