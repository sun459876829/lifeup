# LifeUP 任务 DSL 说明

## 任务 DSL 格式

任务名：
分类：
难度：
可重复：
步骤：

## 示例输入

任务名：吸尘10分钟
分类：cleaning
难度：small
可重复：是
步骤：打开吸尘器、吸10分钟、关闭机器

## 转换规则

Codex 需要将 DSL 自动转换为 `custom.json` 的 JSON 格式：

- 任务 ID 为唯一 key（建议使用英文短语 + 时间戳或 UUID）。
- 字段映射：
  - `任务名` → `name`
  - `分类` → `category`
  - `难度` → `difficulty`
  - `可重复` → `repeatable`（是/否 转换为 true/false）
  - `步骤` → `subtasks`（用中文逗号拆分数组）
- 若缺字段，自动补齐：
  - `repeatable` 默认 `true`
  - `subtasks` 默认空数组 `[]`
- 不能破坏 `core.json`，只追加/更新 `custom.json`。
