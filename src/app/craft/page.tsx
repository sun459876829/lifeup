"use client";

import { useMemo, useState } from "react";
import { useGameState } from "@/state/GameStateContext";
import { CRAFTING_RECIPES } from "@/game/config/craftingConfig";
import { RESOURCES } from "@/game/config/resources";
import { ITEMS } from "@/game/config/items";

const CATEGORY_LABELS: Record<string, string> = {
  ticket: "游戏券",
  food: "小吃券 / 消费券",
  buff: "Buff 类道具",
  upgrade: "升级道具",
};

const RESOURCE_ICONS: Record<string, string> = {
  wood: "🪵",
  stone: "🪨",
  fiber: "🧵",
  scrap: "⚙️",
  insightShard: "🔮",
  energyCrystal: "💠",
  languageRune: "📘",
  soulShard: "✨",
};

function formatItemLabel(itemId: string) {
  return ITEMS[itemId]?.name || itemId;
}

export default function CraftPage() {
  const { hydrated, resources, coins, canCraft, craft } = useGameState();
  const [message, setMessage] = useState("");

  const recipes = useMemo(() => Object.values(CRAFTING_RECIPES), []);
  const groupedRecipes = useMemo(() => {
    return recipes.reduce<Record<string, typeof recipes>>((acc, recipe) => {
      const key = recipe.category || "other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(recipe);
      return acc;
    }, {});
  }, [recipes]);

  const categories = useMemo(() => Object.keys(groupedRecipes), [groupedRecipes]);

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-xs tracking-[0.3em] uppercase text-slate-500">
            LifeUP · Survival Crafting
          </div>
          <div className="text-lg text-slate-100">正在载入制作台…</div>
        </div>
      </div>
    );
  }

  function handleCraft(recipeId: string) {
    const recipe = CRAFTING_RECIPES[recipeId];
    if (!recipe) return;
    const ok = craft(recipeId);
    if (!ok) {
      setMessage("材料或金币不足，无法合成。");
      setTimeout(() => setMessage(""), 2000);
      return;
    }
    const rewardText = Object.entries(recipe.yields || {})
      .map(([id, amount]) => `${formatItemLabel(id)} x${amount}`)
      .join("、");
    setMessage(`🎉 合成成功！获得 ${rewardText}`);
    setTimeout(() => setMessage(""), 2500);
  }

  function hasEnoughResources(recipeId: string) {
    const recipe = CRAFTING_RECIPES[recipeId];
    return Object.entries(recipe?.costs || {}).every(([id, amount]) => {
      const need = Number(amount) || 0;
      return (resources[id] || 0) >= need;
    });
  }

  function hasEnoughCoins(recipeId: string) {
    const recipe = CRAFTING_RECIPES[recipeId];
    const cost = Number(recipe?.coinsCost) || 0;
    return coins >= cost;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold bg-gradient-to-r from-violet-300 via-sky-200 to-emerald-300 bg-clip-text text-transparent">
          🛠️ 制作系统 · Crafting
        </h1>
        <p className="text-sm text-slate-400">
          使用资源与金币制造游戏券、小吃券与专注 Buff 道具。
        </p>
      </header>

      {message && (
        <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 text-sm text-emerald-100 animate-pulse">
          {message}
        </div>
      )}

      <section className="space-y-6">
        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-slate-200">
                  {CATEGORY_LABELS[category] || category}
                </div>
                <div className="text-xs text-slate-500">分类 · {category}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(groupedRecipes[category] || []).map((recipe) => {
                const craftable = canCraft(recipe.id);
                const enoughResources = hasEnoughResources(recipe.id);
                const enoughCoins = hasEnoughCoins(recipe.id);
                const buttonLabel = !enoughResources
                  ? "材料不足"
                  : !enoughCoins
                    ? "金币不足"
                    : "合成";
                return (
                  <div
                    key={recipe.id}
                    className={`rounded-xl border p-4 space-y-3 ${
                      craftable
                        ? "border-slate-700 bg-slate-950/60"
                        : "border-slate-800 bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-200">{recipe.name}</div>
                        {recipe.description && (
                          <div className="text-xs text-slate-500 mt-1">{recipe.description}</div>
                        )}
                      </div>
                      {recipe.coinsCost ? (
                        <span className="text-xs rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                          🪙 {recipe.coinsCost}
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(recipe.costs || {}).map(([id, amount]) => (
                          <span
                            key={id}
                            className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-0.5"
                          >
                            <span>{RESOURCE_ICONS[id] || "🧩"}</span>
                            <span>
                              {RESOURCES[id]?.name || id} x{amount}
                            </span>
                          </span>
                        ))}
                      </div>
                      {recipe.coinsCost ? <div>金币消耗：{recipe.coinsCost}</div> : null}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                      {Object.entries(recipe.yields || {}).map(([id, amount]) => (
                        <span
                          key={id}
                          className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5"
                        >
                          <span>{ITEMS[id]?.icon || "🎁"}</span>
                          <span>
                            {formatItemLabel(id)} x{amount}
                          </span>
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleCraft(recipe.id)}
                      disabled={!craftable}
                      className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition ${
                        craftable
                          ? "bg-violet-500/80 hover:bg-violet-500 text-white"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
