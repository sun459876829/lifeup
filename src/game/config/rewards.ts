import { RESOURCES } from "./resources";

export type RewardEntry = {
  resource: string;
  amount: number;
};

export function computeReward(task: any): RewardEntry[] {
  // 占位实现：暂时固定给一点金币
  return [
    {
      resource: RESOURCES.coin.id,
      amount: 10,
    },
  ];
}

export function estimateRewardRange(task: any): {
  min: number;
  max: number;
  resource: string;
} {
  return {
    min: 5,
    max: 20,
    resource: RESOURCES.coin.id,
  };
}
