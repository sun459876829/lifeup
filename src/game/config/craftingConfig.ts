export type CraftingRecipe = {
  id: string;
  name: string;
  inputs: Record<string, number>;
  outputs: Record<string, number>;
  description?: string;
};

export const CRAFTING_RECIPES: Record<string, CraftingRecipe> = {
  "rope-basic": {
    id: "rope-basic",
    name: "简易绳索",
    inputs: { fiber: 3 },
    outputs: { rope: 1 },
    description: "用纤维合成基础绳索",
  },
};
