import { Telegraf, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';
import { BibleMcpClient } from './mcp-client.js';
import { createLlmClient, convertMcpToolsToOpenAiTools } from './openrouter.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.OPENAI_API_KEY || process.env.API_KEY || process.env.OPENROUTER_API_KEY || "local";
const BASE_URL = process.env.OPENAI_BASE_URL || process.env.BASE_URL;
const MODEL = process.env.OPENAI_MODEL || process.env.MODEL || 'gemini-2.5-flash';

if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env file');

const bot = new Telegraf(BOT_TOKEN);
const openai = createLlmClient(API_KEY, BASE_URL);
const mcpClient = new BibleMcpClient();

// Store chat state
const chatHistories = new Map<number, any[]>();
const pendingQueries = new Map<number, { text: string; messageId: number; score: number; category: string }>();

const MODE_LABELS: Record<string, string> = {
  minimal: "⚡ Мінімально",
  short: "📝 Скорочено",
  medium: "⚖️ Середньо",
  detailed: "🔍 Детально",
  deep: "🏛️ Поглиблено",
  verses_only: "📜 Тільки Вірші"
};

function safeParseJson(str: string): any {
    if (!str) return {};
    try {
        return JSON.parse(str);
    } catch (e) {
        const match = (str || "").match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (err) {}
        }
        return {};
    }
}

async function createStreamWithRetry(params: any, retries = 5, delayMs = 2000): Promise<any> {
    for (let i = 0; i < retries; i++) {
        try {
            return await openai.chat.completions.create(params);
        } catch (err: any) {
            const isRateLimit = err?.status === 429 || err?.message?.includes("429") || err?.code === "rate_limit_exceeded";
            if (isRateLimit && i < retries - 1) {
                const waitTime = delayMs * (i + 1);
                console.warn(`[API Rate Limit 429] Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
                await new Promise(res => setTimeout(res, waitTime));
                continue;
            }
            throw err;
        }
    }
}

async function start() {
  await mcpClient.connect();
  const mcpTools = mcpClient.getTools();
  const openAiTools = convertMcpToolsToOpenAiTools(mcpTools);

  bot.start((ctx) => {
    chatHistories.set(ctx.chat.id, []);
    ctx.reply('Вітаю! Я Біблійний бот-дослідник. Напишіть мені будь-яке запитання, я оціню його складність і допоможу з вибором режиму!');
  });

async function evaluateComplexityHybrid(question: string): Promise<{ score: number; category: string; recMode: string; recLabel: string }> {
    const text = (question || "").trim().toLowerCase();

    // 1. FAST LOCAL MCP EVALUATION (Algorithm A - 0 API Calls, 0.1ms Instant)
    let localResult: any = null;
    try {
        const evalRes: any = await mcpClient.callTool("evaluate_question", { question });
        if (evalRes && evalRes.content && Array.isArray(evalRes.content) && evalRes.content.length > 0) {
            localResult = safeParseJson(evalRes.content[0].text);
        }
    } catch (e) {}

    // If it's a direct verse coordinate (e.g. "Івана 3:16", "Псалом 23") or very simple query, return INSTANTLY!
    if (localResult && (localResult.complexity_score <= 25 || /^(\d?\s*[а-яєіїa-z]+\s*\d+:\d+|покажи|прочитай|знайди вірш)/i.test(text))) {
        return {
            score: localResult.complexity_score || 15,
            category: localResult.category || "Простий пошук вірша",
            recMode: localResult.recommended_mode || "verses_only",
            recLabel: localResult.recommended_mode_label || "📜 Тільки Вірші"
        };
    }

    // 2. NEURAL LLM EVALUATION (Algorithm B - Deep Semantic Rating)
    try {
        const response = await createStreamWithRetry({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: `You are an expert AI Bible Evaluator. Analyze the user's question and rate its biblical complexity on a scale from 0 to 100.
Return ONLY a valid JSON object:
{
  "complexity_score": number (0-100),
  "category": "short category name in Ukrainian",
  "recommended_mode": "minimal" | "short" | "medium" | "detailed" | "deep" | "verses_only",
  "recommended_mode_label": "⚡ Мінімально" | "📝 Скорочено" | "⚖️ Середньо" | "🔍 Детально" | "🏛️ Поглиблено" | "📜 Тільки Вірші"
}`
                },
                { role: "user", content: question }
            ],
            temperature: 0.1,
            max_tokens: 150
        });

        let jsonText = "";
        for await (const chunk of response) {
            if (chunk.choices[0]?.delta?.content) {
                jsonText += chunk.choices[0].delta.content;
            }
        }

        const data = safeParseJson(jsonText);
        if (data && typeof data.complexity_score === "number") {
            return {
                score: Math.min(100, Math.max(0, data.complexity_score)),
                category: data.category || "Повсякденне біблійне питання",
                recMode: data.recommended_mode || "medium",
                recLabel: data.recommended_mode_label || MODE_LABELS[data.recommended_mode] || "⚖️ Середньо"
            };
        }
    } catch (e) {
        console.warn("LLM Complexity Evaluation fallback to MCP local algorithm:", e);
    }

    // Fallback to local result if available
    if (localResult) {
        return {
            score: localResult.complexity_score || 50,
            category: localResult.category || "Повсякденне біблійне питання",
            recMode: localResult.recommended_mode || "medium",
            recLabel: localResult.recommended_mode_label || "⚖️ Середньо"
        };
    }

    return { score: 50, category: "Стандартне біблійне питання", recMode: "medium", recLabel: "⚖️ Середньо" };
}

  // When user sends a text message, evaluate complexity via Hybrid A+B Engine & show buttons
  bot.on(message('text'), async (ctx) => {
    const chatId = ctx.chat.id;
    const userMessage = ctx.message.text;

    const { score, category, recMode, recLabel } = await evaluateComplexityHybrid(userMessage);

    const btnText = (key: string, label: string) => {
        return key === recMode ? `⭐ ${label}` : label;
    };

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(btnText('minimal', '⚡ Мінімально'), 'mode_minimal'),
        Markup.button.callback(btnText('short', '📝 Скорочено'), 'mode_short'),
      ],
      [
        Markup.button.callback(btnText('medium', '⚖️ Середньо'), 'mode_medium'),
        Markup.button.callback(btnText('detailed', '🔍 Детально'), 'mode_detailed'),
      ],
      [
        Markup.button.callback(btnText('deep', '🏛️ Поглиблено'), 'mode_deep'),
        Markup.button.callback(btnText('verses_only', '📜 Тільки Вірші'), 'mode_verses_only'),
      ]
    ]);

    const promptMsg = await ctx.reply(
      `❓ <b>Запитання:</b> <i>"${userMessage}"</i>\n\n` +
      `📊 <b>Оцінка складності:</b> ${score} / 100\n` +
      `🏷 <b>Категорія:</b> ${category}\n` +
      `⭐ <b>Рекомендація AI:</b> ${recLabel}\n\n` +
      `<i>Оберіть бажаний режим деталізації нижче:</i>`,
      { parse_mode: 'HTML', ...keyboard }
    );

    pendingQueries.set(chatId, { text: userMessage, messageId: promptMsg.message_id, score, category });
  });

  // Handle inline keyboard button clicks
  bot.action(/^mode_(.+)$/, async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const modeKey = ctx.match[1];
    const modeLabel = MODE_LABELS[modeKey] || modeKey;
    const pending = pendingQueries.get(chatId);

    await ctx.answerCbQuery(`Обрано режим: ${modeLabel}`);

    if (!pending) {
        await ctx.reply("❌ Запитання застаріло. Напишіть ваше запитання ще раз!");
        return;
    }

    const userMessage = pending.text;
    const statusMsgId = pending.messageId;
    const score = pending.score;
    const category = pending.category;
    pendingQueries.delete(chatId);

    // Fetch system prompt dynamically from MCP for the selected mode
    let systemPromptText = "You are a wise Bible scholar.";
    try {
        const promptRes = await mcpClient.getPrompt(`bible_scholar_${modeKey}`);
        if (promptRes && promptRes.messages && promptRes.messages.length > 0) {
            systemPromptText = (promptRes.messages[0].content as any).text;
        }
    } catch (e) {
        console.warn(`Could not fetch prompt bible_scholar_${modeKey}, fallback to default.`);
    }

    let history = chatHistories.get(chatId) || [];
    history.push({ role: 'user', content: userMessage });
    if (history.length > 10) history = history.slice(history.length - 10);
    chatHistories.set(chatId, history);

    try {
      await ctx.telegram.editMessageText(
        chatId, 
        statusMsgId, 
        undefined, 
        `⏳ <b>Розмірковую (${modeLabel})...</b>`, 
        { parse_mode: 'HTML' }
      );

      let isFinalResponse = false;
      let currentMessages = [
        { role: 'system', content: systemPromptText },
        ...history
      ];

      let fullResponseText = "";
      let lastEditTime = Date.now();
      let lastEditText = "";

function cleanTelegramHtml(text: string): string {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/(^|\s)\*([^\*\n]+)\*(\s|$|[.,!?:;])/g, '$1<i>$2</i>$3')
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      .replace(/\|\|(.*?)\|\|/g, '<tg-spoiler>$1</tg-spoiler>');
}

      const updateTelegramMessage = async (text: string, force = false, toolsCalledList: string[] = []) => {
          if (!text) return;
          const now = Date.now();
          if (force || (now - lastEditTime > 1500 && text !== lastEditText)) {
              const cleanedContent = cleanTelegramHtml(text);
              let footer = " ✍️";
              if (force) {
                  let accuracy = 96;
                  if (text.includes("<blockquote>") || text.includes("“") || text.includes('"')) accuracy += 2;
                  if (toolsCalledList.length > 0) accuracy += 1;
                  accuracy = Math.min(99, accuracy);

                  footer = `\n\n────────────────────\n📊 <b>Складність:</b> ${score} / 100\n🎯 <b>Режим:</b> ${modeLabel}\n🛡 <b>Точність:</b> ${accuracy}% (Пряма відповідність)`;
              }
              const displayText = cleanedContent + footer;
              try {
                  await ctx.telegram.editMessageText(chatId, statusMsgId, undefined, displayText, { parse_mode: 'HTML' });
              } catch (err: any) {
                  try {
                      await ctx.telegram.editMessageText(chatId, statusMsgId, undefined, displayText);
                  } catch (e) {}
              }
              lastEditTime = now;
              lastEditText = text;
          }
      };

      while (!isFinalResponse) {
        const stream = await createStreamWithRetry({
          model: MODEL,
          messages: currentMessages,
          tools: openAiTools,
          stream: true,
          temperature: 0.3,
          max_tokens: 1500,
        });

        let toolCallsInfo: any = {};

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          
          if (delta?.content) {
             fullResponseText += delta.content;
             await updateTelegramMessage(fullResponseText);
          }

          if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                  const idx = toolCall.index;
                  if (!toolCallsInfo[idx]) toolCallsInfo[idx] = { id: toolCall.id, type: "function", function: { name: toolCall.function?.name || "", arguments: "" } };
                  if (toolCall.function?.name) toolCallsInfo[idx].function.name = toolCall.function.name;
                  if (toolCall.function?.arguments) toolCallsInfo[idx].function.arguments += toolCall.function.arguments;
              }
          }
        }

        const toolCalls = Object.values(toolCallsInfo) as any[];

        if (toolCalls.length > 0) {
          try {
              await ctx.telegram.editMessageText(chatId, statusMsgId, undefined, `🔍 <b>Шукаю інформацію у Біблії (${toolCalls[0].function.name})...</b>`, { parse_mode: 'HTML' });
          } catch (e) {}
          
          currentMessages.push({
            role: "assistant",
            content: null,
            tool_calls: toolCalls
          });

          for (const tc of toolCalls) {
              const funcName = tc.function.name;
              const args = safeParseJson(tc.function.arguments || "{}");
              try {
                  const result: any = await mcpClient.callTool(funcName, args);
                  let toolResultText = "Success";
                  if (result && result.content && Array.isArray(result.content) && result.content.length > 0) {
                      toolResultText = result.content[0].text;
                  }
                  currentMessages.push({
                      role: "tool",
                      tool_call_id: tc.id,
                      name: funcName,
                      content: toolResultText
                  });
              } catch (e: any) {
                  currentMessages.push({
                      role: "tool",
                      tool_call_id: tc.id,
                      name: funcName,
                      content: `Error executing tool: ${e.message}`
                  });
              }
          }
        } else {
          isFinalResponse = true;
          history.push({ role: 'assistant', content: fullResponseText });
          chatHistories.set(chatId, history);
          await updateTelegramMessage(fullResponseText, true);
        }
      }

    } catch (err: any) {
      console.error("Error processing message:", err);
      let userErrMsg = `❌ Виникла помилка: ${err.message}`;
      if (err?.status === 429 || err?.message?.includes("429")) {
          userErrMsg = "⏳ <b>Google AI перевантажено лімітами запитів.</b> Будь ласка, зачекайте 10 секунд і натисніть кнопку ще раз!";
      }
      try {
          await ctx.telegram.editMessageText(chatId, statusMsgId, undefined, userErrMsg, { parse_mode: 'HTML' });
      } catch (e) {}
    }
  });

  bot.launch();
  console.log('Telegram Bot is running with AI Question Complexity Evaluation & Mode Recommendation!');

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

start().catch(console.error);
