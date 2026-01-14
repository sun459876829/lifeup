import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

// 统一创建 client，但如果没 key 就先别用
const client = apiKey
  ? new OpenAI({
      apiKey,
    })
  : null;

// GET /api/ai → 用来测试接口是否活着
export async function GET() {
  if (!apiKey) {
    return jsonError("缺少 OPENAI_API_KEY，请在 .env.local 里配置", 500);
  }
  return jsonOk({ message: "AI API is alive" });
}

// POST /api/ai → 真正给前端用
export async function POST(req) {
  try {
    if (!apiKey || !client) {
      return jsonError("服务器未配置 OPENAI_API_KEY，无法调用 GPT", 500);
    }

    const body = await req.json().catch(() => ({}));
    const { type, payload } = body || {};

    // 一个小工具：给 OpenAI 调用套一个超时（15 秒）
    const withTimeout = (promise, ms = 120000) =>
      Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("OpenAI 请求超时")), ms)
        ),
      ]);

    // 1）拆解任务
    if (type === "splitTask") {
      const { taskText } = payload || {};

      const completion = await withTimeout(
        client.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "你是一个帮 ADHD 用户拆任务的教练。所有任务要拆成非常小的颗粒，每个子任务控制在 5-20 分钟能完成，越具体越好。",
            },
            {
              role: "user",
              content: `请把这个任务拆成 3-7 个非常具体的小步骤，只返回 JSON：{ "steps": ["xxx","yyy"] }。\n任务：${taskText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "Steps",
              schema: {
                type: "object",
                properties: {
                  steps: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["steps"],
              },
            },
          },
        })
      );

      const data = completion.output[0].content[0].json;
      return jsonOk({ data });
    }

    // 2）评估难度
    if (type === "estimateDifficulty") {
      const { taskText } = payload || {};

      const completion = await withTimeout(
        client.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "你是一个帮用户评估任务难度的助手。输出难度等级和推荐金币奖励，适合把人生游戏化。",
            },
            {
              role: "user",
              content: `请根据这个任务的预估难度，给出 JSON：{ "difficulty": "easy|medium|hard|nightmare", "reward": number, "label": "中文难度说明" }。任务内容：${taskText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "Difficulty",
              schema: {
                type: "object",
                properties: {
                  difficulty: { type: "string" },
                  reward: { type: "number" },
                  label: { type: "string" },
                },
                required: ["difficulty", "reward", "label"],
              },
            },
          },
        })
      );

      const data = completion.output[0].content[0].json;
      return jsonOk({ data });
    }

    // 3）灵感任务
    if (type === "ideaTasks") {
      const { context, energy } = payload || {};

      const completion = await withTimeout(
        client.responses.create({
          model: "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content:
                "你是一个帮用户设计游戏化人生任务的助手。用户有 ADHD，需要任务非常小、可执行、不吓人。",
            },
            {
              role: "user",
              content: `请基于这些长期项目，生成 5-10 个非常小、3-10 分钟可完成的任务。每个任务一句话。用 JSON：{ "tasks": ["xxx","yyy"] } 返回。\n长期项目：${context}\n当前精力水平：${energy}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "IdeaTasks",
              schema: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["tasks"],
              },
            },
          },
        })
      );

      const data = completion.output[0].content[0].json;
      return jsonOk({ data });
    }

    // 未知 type
    return jsonError("unknown type", 400);
  } catch (e) {
    console.error("API /api/ai 错误：", e);
    return jsonError(e.message || "internal error", 500);
  }
}

/** ===== 小工具：统一返回 JSON ===== */

function jsonOk(obj, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...obj }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
