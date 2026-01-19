import type { GameState, TaskTemplate } from "@/state/GameStateContext";

export type BatchSuggestion = {
  templates: TaskTemplate[];
  bonusMultiplier: number;
  message: string;
};

const BATCH_DIFFICULTIES = new Set(["small", "medium"]);

function canSpawnTemplate(template: TaskTemplate, gameState: GameState) {
  const active = gameState.tasks.active || [];
  if (template.repeatable) {
    return !active.some(
      (item) =>
        item.templateId === template.id &&
        (item.status === "pending" || item.status === "active")
    );
  }
  const maxInstances = template.maxInstances ?? 1;
  const existingCount = active.filter((item) => item.templateId === template.id).length;
  return existingCount < maxInstances;
}

function pickRandomTemplates(templates: TaskTemplate[]) {
  const shuffled = [...templates];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const count = Math.min(shuffled.length, Math.random() > 0.55 ? 2 : 1);
  return shuffled.slice(0, count);
}

export function getBatchSuggestion(
  lastTemplateId: string,
  tasksTemplates: Record<string, TaskTemplate>,
  gameState: GameState
): BatchSuggestion | null {
  if (!lastTemplateId || !tasksTemplates || !gameState) return null;
  const lastTemplate = tasksTemplates[lastTemplateId];
  if (!lastTemplate) return null;

  const candidates = Object.values(tasksTemplates).filter(
    (template) =>
      template.id !== lastTemplateId &&
      template.category === lastTemplate.category &&
      BATCH_DIFFICULTIES.has(template.difficulty) &&
      canSpawnTemplate(template, gameState)
  );

  if (candidates.length === 0) return null;

  const picked = pickRandomTemplates(candidates);
  if (picked.length === 0) return null;

  const bonusMultiplier = 1.1;
  const titles = picked.map((template) => template.title).join("、");
  const message = `乘热打铁，再完成「${titles}」可获得额外奖励！`;

  return {
    templates: picked,
    bonusMultiplier,
    message,
  };
}
