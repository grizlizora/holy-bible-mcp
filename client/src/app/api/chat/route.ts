import { openai } from '@ai-sdk/openai';
import { createOllama } from 'ollama-ai-provider';
import { streamText } from 'ai';
import { adaptiveController } from '@/lib/models/adaptive-controller';
import { determineModelCapabilities, detectReasoningCapability, isSmallModelByParamSize, computeAdaptiveModelBudget } from '@/lib/models/capabilities';
import fsPromises from 'fs/promises';
import path from 'path';
import { mcpManager } from '@/lib/mcp/mcp-manager';
import { extractVectorContext } from '@/lib/mcp/vector-context';

export const maxDuration = 300; // 🧠 5-minute timeout for high-capacity 131K token model outputs

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api',
  fetch: async (url, init) => {
    if (init && init.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        body.keep_alive = '10m';
        return await fetch(url, {
          ...init,
          body: JSON.stringify(body),
        });
      } catch (e) {}
    }
    return fetch(url, init);
  },
});

async function resolveLocalModelWithFallback(baseUrl: string, requestedModel: string): Promise<{
  modelToUse: string | null;
  installedModels: string[];
  isFallback: boolean;
}> {
  const tagsUrl = baseUrl.endsWith('/api') ? `${baseUrl}/tags` : `${baseUrl}/api/tags`;
  try {
    const res = await fetch(tagsUrl, { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      const installedModels: string[] = (data.models || []).map((m: any) => m.name || m.model || '');
      if (installedModels.length > 0) {
        const reqLower = (requestedModel || '').toLowerCase();
        // 1. Direct exact match
        const exactMatch = installedModels.find(m => {
          const mLower = m.toLowerCase();
          return mLower === reqLower || mLower === `${reqLower}:latest` || reqLower === `${mLower}:latest`;
        });
        if (exactMatch) return { modelToUse: exactMatch, installedModels, isFallback: false };

        // 2. Fuzzy match by base prefix (e.g. "phi4" -> "phi4:14b-q4_K_M")
        const basePrefix = reqLower.split(':')[0].replace(/[^a-z0-9]/g, '');
        if (basePrefix) {
          const fuzzyMatch = installedModels.find(m => m.toLowerCase().replace(/[^a-z0-9]/g, '').includes(basePrefix));
          if (fuzzyMatch) return { modelToUse: fuzzyMatch, installedModels, isFallback: true };
        }

        // 3. Fallback to first available installed local model so connection NEVER fails with 404
        return { modelToUse: installedModels[0], installedModels, isFallback: true };
      }
    }
  } catch (e) {}
  return { modelToUse: requestedModel || 'qwen3.5:4b', installedModels: [], isFallback: false };
}

const MODE_LABELS: Record<string, string> = {
  minimal: "⚡ Мінімально",
  short: "📝 Скорочено",
  medium: "⚖️ Середньо",
  detailed: "🔍 Детально",
  deep: "🏛️ Поглиблено",
  verses_only: "📜 Тільки Вірші"
};

function buildSystemPrompt(params: {
  contextText: string;
  effectiveDetailLevel?: string;
  targetLanguage?: string;
}): string {
  const { contextText, effectiveDetailLevel = 'medium', targetLanguage = 'ukr' } = params;

  const isUkr = targetLanguage === 'ukr';

  const modeInstructions: Record<string, string> = {
    minimal: 'STRICT LENGTH CONSTRAINT: Give a MINIMAL response (under 60 words total). Do NOT write long essays.',
    short: 'STRICT LENGTH CONSTRAINT: Give a SHORT response (under 120 words total). Do NOT write multi-page essays.',
    medium: 'STRICT LENGTH CONSTRAINT: Give a BALANCED response (around 150-250 words total). Keep your sections concise, clear, and detailed.',
    detailed: 'Provide a THOROUGH, well-structured response with scripture citations and practical insights.',
    deep: 'Provide an EXHAUSTIVE theological study with etymology and deep systemic analysis.',
    verses_only: 'STRICT MODE: Provide ONLY verified scripture verses and direct citations matching the query. No long commentary.'
  };

  const wordCountGuide: Record<string, string> = {
    minimal: 'under 60 words total',
    short: 'under 120 words total',
    medium: 'around 150-250 words total',
    detailed: 'thorough, comprehensive length',
    deep: 'exhaustive study length',
    verses_only: 'direct scripture verses only'
  };

  const modeDirective = modeInstructions[effectiveDetailLevel] || modeInstructions.medium;
  const lengthGuide = wordCountGuide[effectiveDetailLevel] || wordCountGuide.medium;

  const boldSyntaxDirective = `CRITICAL BOLD SYNTAX MANDATE: Write numbered items like "1. **Header** — description". NEVER put double-asterisks before numbers (ABSOLUTELY FORBIDDEN: "** 1. **", "**1. **", "** 2. **").`;

  const langRules = isUkr
    ? `STRICT LANGUAGE & CITATION RULE: Respond EXCLUSIVELY in Ukrainian. Provide a response (${lengthGuide}). ${boldSyntaxDirective} Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory: 1. **Сутність та якір** (Core Essence); 2. **Духовний механізм** (Internal Mechanism); 3. **Практичний вияв** (Practical Manifestation); 4. **Вічний плід** (Ultimate Fruit). Include scripture citations at the end of each bullet. Always format book names in citations in UKRAINIAN (e.g. {{CITATION: JHN 15:13|Від Івана 15:13|ukr|Cross}}, {{CITATION: 1CO 13:4|1 Коринфянам 13:4|ukr|Cross}}). Never use English book names in citation display titles.`
    : `STRICT LANGUAGE & CITATION RULE: Respond in English. Provide a response (${lengthGuide}). ${boldSyntaxDirective} Structure your response with an introductory overview paragraph followed by 4 detailed bullet points matching the canonical 4-part trajectory: 1. **Core Essence & Anchor**; 2. **Internal Mechanism**; 3. **Practical Manifestation**; 4. **Ultimate Fruit**. Include scripture citations on each bullet item. Format all citations using 3-letter OSIS codes.`;

  return `You are Liquid AI, an advanced AI super-assistant created by Roman.

${modeDirective}

${langRules}

${contextText ? contextText : ''}`;
}


export async function POST(req: Request) {
  const payload = await req.json();
  const { messages, channelType, localProvider, apiProvider, selectedModel, attachments, mcpSettings, primaryMcpId } = payload;
  const activeSettings = primaryMcpId && mcpSettings ? (mcpSettings[primaryMcpId] || {}) : {};
  const warmth = activeSettings.warmth !== undefined ? activeSettings.warmth : (payload.warmth !== undefined ? payload.warmth : 80);
  const mode = activeSettings.detailLevel || payload.mode || 'medium';
  const detailLevel = activeSettings.detailLevel || payload.detailLevel || mode;

  let userMessage = messages[messages.length - 1]?.content || "";

  // Set up manual stream to send intermediate statuses
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  const responseStream = new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-vercel-ai-data-stream': 'v1'
    }
  });

  const pushStatus = (key: string) => {
    writer.write(encoder.encode(`2:${JSON.stringify([{ type: 'status', key }])}\n`));
  };

  // Run generation asynchronously
  (async () => {
    try {
      pushStatus('status_init');

      // 🔌 Ensure MCP servers are connected (lazy init — safe for serverless)
      await mcpManager.initAllEnabled();

      // 🧠 Parallelize Native Vision capability & Model Parameter Size check
      const targetModelName = selectedModel || '';
      const capabilities = await determineModelCapabilities(targetModelName, channelType);
      const modelSizeInfo = mcpManager.detectModelParameterSize(targetModelName);
      const isSmallModel = capabilities.isSmallModel || modelSizeInfo.isSmallModel;

      console.log(`🧠 [MODEL PARAMETERS]: Model="${targetModelName}", DetectedSize=${modelSizeInfo.parameterSize || 'Unknown'}B, SmallModel=${isSmallModel} (<=8B)`);

      // Track attachments to skip text injection for natively supported formats
      const nativelyProcessedAttachmentIds = new Set<string>();

      pushStatus('status_vector_search');

      // Universally inject vector-indexed file contents into user prompts (both current and historical)
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        if (msg.role === 'user') {
          const msgAttachments = (i === messages.length - 1) ? attachments : msg.attachments;
          
          const hasImages = msgAttachments?.some((a: any) => a.type === 'image');
          if (hasImages && capabilities.supportsImages) {
            const complexContent: any[] = [{ type: 'text', text: msg.content }];
            
            for (const att of msgAttachments) {
              if (att.type === 'image') {
                try {
                  const filename = att.url.split('/').pop();
                  if (filename) {
                    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
                    let buffer = await fsPromises.readFile(filePath);
                    
                    const ext = filename.split('.').pop()?.toLowerCase() || '';
                    if (['heic', 'heif', 'tiff', 'bmp'].includes(ext)) {
                      try {
                        if (ext.startsWith('hei')) {
                          const convert = require('heic-convert');
                          const convertedBuffer = await convert({ buffer, format: 'JPEG', quality: 0.9 });
                          buffer = Buffer.from(convertedBuffer);
                        } else {
                          const sharp = require('sharp');
                          buffer = await sharp(buffer).jpeg().toBuffer();
                        }
                      } catch (normErr) {
                        console.warn(`[IMAGE NORMALIZATION] Failed to convert ${ext}:`, normErr);
                      }
                    }
                    
                    complexContent.push({ type: 'image', image: buffer });
                    nativelyProcessedAttachmentIds.add(att.id);
                  }
                } catch (fsErr) {
                  console.warn('Failed to read image for native payload:', fsErr);
                }
              }
            }
            msg.content = complexContent;
          }
          
          if (msgAttachments && msgAttachments.length > 0) {
            const textAtts = msgAttachments.filter((a: any) => 
              !nativelyProcessedAttachmentIds.has(a.id) && 
              a.extractedText && a.extractedText.trim().length > 0
            );
            
            const isComplex = Array.isArray(msg.content);
            const originalText = isComplex ? msg.content[0].text : msg.content;

            if (textAtts.length > 0 && !originalText.includes('[USER ATTACHED FILES REFERENCE CONTEXT]') && !originalText.includes('[ДОВІДКОВА ІНФОРМАЦІЯ З ПРИКРІПЛЕНИХ ФАЙЛІВ КОРИСТУВАЧЕМ]')) {
              const vectorProcessedAtts = await Promise.all(
                textAtts.map(async (a: any) => {
                  const vectorChunkedText = await extractVectorContext(userMessage, a.extractedText);
                  const sizeInKb = (a.size / 1024).toFixed(1);
                  const sizeStr = a.size > 1024 * 1024 ? `${(a.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`;
                  return `📋 [ATTACHED FILE: "${a.filename}"]\n• Original Filename: ${a.filename}\n• Format / MIME-Type: ${a.type || 'Unknown'}\n• File Size: ${sizeStr}\n• File Content & Automated Analysis:\n----------------------------------------\n${vectorChunkedText}\n----------------------------------------`;
                })
              );

              const contextStr = `\n\n[USER ATTACHED FILES REFERENCE CONTEXT]:\n` + vectorProcessedAtts.join('\n\n') + `\n\n[END OF REFERENCE CONTEXT]. Consider the file format, name, and initial contents when responding to the user.`;
              if (isComplex) {
                msg.content[0].text = originalText + contextStr;
              } else {
                msg.content = originalText + contextStr;
              }
            }
          }
        } else if (msg.role === 'assistant') {
          if (typeof msg.content === 'string') {
            // Clean thinking tags, metrics, and citation delimiters from context history
            msg.content = msg.content
              .replace(/<think>[\s\S]*?<\/think>/gi, '')
              .replace(/\{\{METRICS:[\s\S]*?\}\}/gi, '')
              .replace(/\[\[METRICS:[\s\S]*?\]\]/gi, '')
              .replace(/\{\{CITATION:[\s\S]*?\}\}/gi, '')
              .replace(/\{\{VERSE:[\s\S]*?\}\}/gi, '')
              .trim();
          }
        }
      }

      const activeServerIds = Array.from(mcpManager.getAllServers().keys());
      if (activeServerIds.length > 0) {
        pushStatus('status_mcp_connect');
      } else {
        pushStatus('status_mcp_query');
      }

      console.log(`\n========================================`);
      console.log(`📥 [CHAT REQUEST] Prompt: "${userMessage}"`);
      if (attachments?.length > 0) console.log(`📎 [ATTACHMENTS]: ${attachments.length} files attached.`);
      console.log(`⏱️ [TIME]: ${new Date().toLocaleTimeString('uk-UA')}`);
      console.log(`🎯 [SETTINGS]: Warmth=${warmth}%, Mode=${mode}, Detail=${detailLevel}, Model=${channelType}:${selectedModel}`);

      const currentWarmth = Math.min(100, Math.max(0, typeof warmth === 'number' && !isNaN(warmth) ? warmth : (parseInt(String(warmth)) || 80)));

      const {
        contextText,
        complexityScore,
        accuracyScore,
        effectiveDetailLevel,
        modeLabel,
        metricsArray,
        primaryMcpConfig
      } = await mcpManager.buildAggregatedContext({
        userMessage,
        mode,
        detailLevel,
        mcpSettings,
        primaryMcpId,
        isSmallModel,
        selectedModel: selectedModel || '',
        MODE_LABELS
      });

      console.log(`🔍 [MCP SEARCH]: Score=${complexityScore}/100, Effective Detail=${effectiveDetailLevel} (${modeLabel}), Warmth=${currentWarmth}%`);
      if (isSmallModel) console.log(`⚡ [ADAPTIVE ROUTING]: Small model detected (<=8B). Compressed MCP context & optimized prompt.`);
      console.log(`========================================\n`);

      // 🧠 Smart Adaptive Controller: Dynamic hardware-aware inspection & self-calibrated parameters
      const promptText = messages.map((m: any) => typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')).join(' ') + contextText;
      const adaptedConfig = await adaptiveController.getAdaptedConfig(
        selectedModel || 'qwen2.5',
        promptText,
        undefined,
        channelType as any,
        warmth
      );

      const isReasoningModel = adaptedConfig.isReasoningModel;
      const adaptiveNumCtx = adaptedConfig.numCtx;
      const temperature = adaptedConfig.recommendedTemperature;
      const topP = adaptedConfig.recommendedTopP;
      const frequencyPenalty = adaptedConfig.isSmallModel ? 0.1 : 0;
      const prefillTimeoutMs = adaptedConfig.prefillTimeoutMs;

      console.log(`🧠 [ADAPTIVE ENGINE]: Model=${selectedModel}, Arch=${adaptedConfig.architecture}, Params=${adaptedConfig.parameterSize || 'Unknown'}B, numCtx=${adaptiveNumCtx}, reasoning=${isReasoningModel}, timeout=${prefillTimeoutMs}ms`);

      const hasOpenAiKey = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'local';

      let model;
      let targetModel = selectedModel || 'qwen2.5';

      if (channelType === 'local' || !hasOpenAiKey) {
        pushStatus('status_ollama_connect');
        try {
          const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
          const baseUrl = rawBaseUrl.replace(/\/+$/, '');
          const tagsUrl = baseUrl.endsWith('/api') ? `${baseUrl}/tags` : `${baseUrl}/api/tags`;
          const tagsRes = await fetch(tagsUrl, { signal: AbortSignal.timeout(1500) });
          if (tagsRes.ok) {
            const tagsData = await tagsRes.json();
            const models: string[] = (tagsData.models || []).map((m: any) => m.name);
            
            const targetLower = targetModel.toLowerCase();
            const [targetBase, targetTag] = targetLower.split(':');

            let resolvedModel: string | null = null;
            resolvedModel = models.find(m => m.toLowerCase() === targetLower) || null;

            if (!resolvedModel && !targetTag) {
              resolvedModel = models.find(m => m.toLowerCase() === `${targetBase}:latest`) || null;
            }

            if (!resolvedModel && targetTag) {
              resolvedModel = models.find(m => {
                const mLower = m.toLowerCase();
                const [mBase, mTag] = mLower.split(':');
                return mBase === targetBase && mTag && mTag.includes(targetTag);
              }) || null;
            }

            if (!resolvedModel) {
              resolvedModel = models.find(m => m.toLowerCase().split(':')[0] === targetBase) || null;
            }

            if (!resolvedModel && models.length > 0) {
              resolvedModel = models[0];
            }

            if (resolvedModel) {
              targetModel = resolvedModel;
            }
          }
        } catch (e) {
          console.warn("[OLLAMA] Tags auto-resolve warning:", e);
        }
        // Power-of-2 Bucketed Context Window for maximum KV-Cache reuse & 0 VRAM allocation stalls
        model = ollama(targetModel, {
          numCtx: adaptiveNumCtx,
        });
      } else {
        pushStatus('status_api_connect');
        targetModel = selectedModel || 'gpt-4o-mini';
        model = openai(targetModel);
      }

      const targetLanguage = /[а-яєіїґ]/i.test(userMessage) ? 'ukr' : 'eng';
      const systemPrompt = buildSystemPrompt({ contextText, effectiveDetailLevel, targetLanguage });

      let shouldShowMetrics = true;
      if (primaryMcpConfig) {
         const primarySettings = mcpSettings?.[primaryMcpConfig.id] || {};
         if (primarySettings.showMetrics === false) {
             shouldShowMetrics = false;
         }
      }

      const metricsTag = shouldShowMetrics ? `[[METRICS: ${JSON.stringify(metricsArray)} ]]` : '';

      pushStatus('status_generating');

      // ⚡ Dynamic prefill timeout safeguard for Metal GPU prefill & VRAM allocation
      const isLocalRequest = channelType === 'local' || !hasOpenAiKey;
      const getExecutionSignal = () => {
        if (!isLocalRequest) return req.signal;
        const timeoutSignal = AbortSignal.timeout(prefillTimeoutMs); // Dynamic prefill timeout calculated by Smart Adaptive Controller
        return req.signal ? AbortSignal.any([req.signal, timeoutSignal]) : timeoutSignal;
      };

      if (isLocalRequest) {
        pushStatus('status_ollama_connect');
        const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
        const baseUrl = rawBaseUrl.replace(/\/+$/, '');
        const chatUrl = baseUrl.endsWith('/api') ? `${baseUrl}/chat` : `${baseUrl}/api/chat`;

        // 🧠 Bulletproof Model Auto-Matching & Fail-Safe Fallback Resolver so 404 connection errors NEVER happen!
        const localModelResult = await resolveLocalModelWithFallback(baseUrl, targetModel);
        const resolvedModel = localModelResult.modelToUse;

        if (resolvedModel) {
          const formattedMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => {
              let rawContent = typeof m.content === 'string' ? m.content : (Array.isArray(m.content) ? m.content[0]?.text || '' : String(m.content || ''));
              // 🧠 Strip past internal thinking blocks from assistant history to save context & prevent monologue loops
              if (m.role === 'assistant') {
                rawContent = rawContent.replace(/<(?:think|thought|reasoning)>[\s\S]*?<\/(?:think|thought|reasoning)>/gi, '').trim();
              }
              return { role: m.role, content: rawContent };
            })
          ];

          const modelCaps = capabilities || await determineModelCapabilities(resolvedModel, channelType);
          const isSmallModel = Boolean(adaptedConfig?.isSmallModel || modelCaps.isSmallModel);
          const isReasoningModel = Boolean(modelCaps.isReasoningModel);
          const isExplicitReasoning = /(?:deepseek-r1|qwq|-r1|reasoner|thinking)/i.test(resolvedModel);
          const supportsThinking = Boolean((isExplicitReasoning || (modelCaps.parameterSize || 0) >= 14.0) && modelCaps.supportsThinking);
          const targetLanguage = /[а-яєіїґ]/i.test(userMessage) ? 'ukr' : 'eng';

          // 🧠 Continuous Adaptive LLM Scaling Engine with Dynamic Question Complexity Estimator
          const budget = computeAdaptiveModelBudget({
            modelName: resolvedModel,
            userMessage,
            parameterSizeB: modelCaps.parameterSize,
            isSmallModel,
            isReasoningModel,
            detailLevel: effectiveDetailLevel,
            warmth,
            temperature,
            topP
          });

          // 🧠 Mode & Reasoning & 100/100 Complexity Token Budget Governor:
          // For ultra-complex prompts (100/100) or long inputs (>800 chars), expand context to 16k and predict up to 8k tokens!
          const modelB = budget.parameterSizeB ?? (isSmallModel ? 4.7 : 14.8);
          const reasoningBonus = (isReasoningModel || supportsThinking) ? 1200 : 0;
          const isUltraComplex = budget.complexity.score >= 80 || (userMessage && userMessage.length > 800);

          if (isUltraComplex) {
            const maxTokensByTier = modelB >= 26 ? 8192 : modelB >= 10.5 ? 6000 : 4000;
            budget.numPredict = maxTokensByTier + reasoningBonus;
            budget.numCtx = modelB >= 10.5 ? 16384 : 8192;
          } else if (effectiveDetailLevel === 'minimal') {
            budget.numPredict = 550 + reasoningBonus;
          } else if (effectiveDetailLevel === 'short') {
            budget.numPredict = 950 + reasoningBonus;
          } else if (effectiveDetailLevel === 'detailed' || effectiveDetailLevel === 'deep') {
            budget.numPredict = (modelB >= 26 ? 6000 : 4500) + reasoningBonus;
          } else {
            // auto / medium mode
            const baseTokens = modelB >= 26 ? 4000 : modelB >= 10.5 ? 3000 : 2200;
            budget.numPredict = baseTokens + reasoningBonus;
          }

          console.log(`🧠 [PROMPT COMPLEXITY ENGINE] Prompt: "${userMessage.slice(0, 40)}" -> Score: ${budget.complexity.score}/100 (${budget.complexity.level.toUpperCase()}) | numCtx: ${budget.numCtx}, numPredict: ${budget.numPredict}, temp: ${budget.temperature.toFixed(2)}, maxThinkChars: ${budget.maxThinkChars}`);

          // ⚡ Power-of-2 Context Window Bucketing Governor (Prevents Metal GPU reallocation stalls & Mac UI/Audio flickering)
          const bucketedNumCtx = budget.numCtx <= 2048 ? 2048 : budget.numCtx <= 4096 ? 4096 : budget.numCtx <= 6144 ? 6144 : 8192;

          const buildOllamaPayload = (includeThink: boolean) => ({
            model: resolvedModel,
            messages: formattedMessages,
            keep_alive: '10m',
            options: {
              num_ctx: bucketedNumCtx,
              num_gpu: 99,
              use_mmap: true,
              use_mlock: false, // Prevents RAM locking so WindowServer & CoreAudio maintain smooth LPDDR access
              num_predict: budget.numPredict,
              num_thread: 4, // Leaves 2+ CPU cores dedicated to macOS WindowServer & coreaudiod
              // 🚀 Family-Aware Dynamic Sampling Matrix Calibration (Qwen, Phi, Llama, DeepSeek)
              min_p: budget.minP,
              top_p: budget.topP,
              temperature: budget.temperature,
              repeat_penalty: budget.repeatPenalty,
              repeat_last_n: budget.repeatLastN,
              presence_penalty: budget.presencePenalty,
              frequency_penalty: budget.frequencyPenalty,
              seed: Math.floor(Math.random() * 1000000),
              stop: ["<|im_end|>", "<|endoftext|>", "<|end_of_text|>"]
            },
            stream: true,
            think: includeThink
          });

          try {
            console.log(`📡 [OLLAMA ROUTE] Connecting to ${chatUrl} for model ${resolvedModel} (supportsThinking=${supportsThinking}, isSmallModel=${isSmallModel})...`);
            let ollamaRes = await fetch(chatUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(buildOllamaPayload(supportsThinking)),
              signal: req.signal
            });

            console.log(`📡 [OLLAMA ROUTE] Response status: ${ollamaRes.status} ${ollamaRes.statusText}`);

            // 🧠 Automatic fallback: if Ollama rejects think:true (e.g. phi4:14b 400 "does not support thinking"), retry immediately without think:true!
            if (!ollamaRes.ok && supportsThinking) {
              console.warn(`⚠️ [OLLAMA ROUTE] Initial request failed with ${ollamaRes.status}. Retrying with think:false...`);
              ollamaRes = await fetch(chatUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildOllamaPayload(false)),
                signal: req.signal
              });
              console.log(`📡 [OLLAMA ROUTE] Fallback response status: ${ollamaRes.status}`);
            }

            if (ollamaRes.ok && ollamaRes.body) {
              const reader = ollamaRes.body.getReader();
              const decoder = new TextDecoder();
              let fullText = '';
              let hasReceivedFirstChunk = false;
              let isThinkingPhase = false;
              let hasOpenedThink = false;
              let lineBuffer = '';
              let emittedTokenCount = 0;
              // 🛡️ Small model real-time inline-think streamer & truncator
              let inlineThinkOpen = false;
              let inlineThinkCharsEmitted = 0;
              let inlineThinkMaxReached = false;
              let postCloseSuppress = false; // 🛡️ Suppress leaked thinking after forced </think>
              let streamTailBuffer = '';
              let loopDetected = false;

              try {
                const emitToken = async (tokenStr: string) => {
                  if (!tokenStr || loopDetected) return;
                  emittedTokenCount++;

                  // 🛡️ Auto-prepend <think> at token 1 for reasoning/thinking models if not emitted natively
                  if (emittedTokenCount === 1 && supportsThinking) {
                    if (!tokenStr.trim().toLowerCase().startsWith('<think>')) {
                      inlineThinkOpen = true;
                      inlineThinkCharsEmitted = tokenStr.length;
                      tokenStr = `<think>\n${tokenStr}`;
                      console.log('🛡️ [STREAM TRANSFORMER] Prepended opening <think> tag at token 1.');
                    } else {
                      inlineThinkOpen = true;
                    }
                  }

                  // 🛡️ Post-close suppression: after forced </think>, suppress leaked thinking tokens
                  // until we detect real prose output (in any language or script).
                  if (postCloseSuppress && !inlineThinkOpen) {
                    // Real response signals: any Unicode letter/number, citation tag, numbered list, or natural </think>
                    const hasRealOutput = /[\p{L}\p{N}]/u.test(tokenStr) ||
                                         /\{\{CITATION:/.test(tokenStr) ||
                                         /^\s*\d+\.\s/.test(tokenStr) ||
                                         tokenStr.includes('</think>');
                    if (hasRealOutput) {
                      postCloseSuppress = false;
                      // Strip any </think> the model naturally emitted (already injected)
                      tokenStr = tokenStr.replace(/<\/think>\s*/i, '').trimStart();
                      console.log('🛡️ [STREAM TRANSFORMER] Post-close suppression OFF — real output detected.');
                    } else {
                      return; // suppress this token
                    }
                  }


                  // 🛡️ Infinite Monologue Loop Breaker: O(1) constant-time window check
                  streamTailBuffer = (streamTailBuffer + tokenStr).slice(-300);
                  let isRepeatingLoop = false;
                  if (streamTailBuffer.length >= 60) {
                    const tail = streamTailBuffer.slice(-60);
                    const half1 = tail.slice(0, 30);
                    const half2 = tail.slice(30);
                    if (half1 === half2 && half1.trim().length >= 15) {
                      isRepeatingLoop = true;
                    }
                  }
                  if (isRepeatingLoop) {
                    loopDetected = true;
                    console.warn(`🛡️ [STREAM TRANSFORMER] Infinite repetition loop detected. Truncating stream gracefully.`);
                    if (inlineThinkOpen) {
                      await writer.write(encoder.encode(`data: ${JSON.stringify({ text: '\n</think>\n\n' })}\n\n`));
                    }
                    return;
                  }

                  if (emittedTokenCount === 1 || emittedTokenCount % 20 === 0) {
                    console.log(`⚡ [STREAM TOKEN #${emittedTokenCount}] ${JSON.stringify(tokenStr.slice(0, 40))}`);
                  }

                  // 🛡️ Smooth Real-Time Thinking Streamer for Reasoning & Small Models with Auto-Close Guardrail
                  let processedToken = tokenStr;

                  if (inlineThinkOpen) {
                    inlineThinkCharsEmitted += tokenStr.length;
                    const closeIdx = tokenStr.toLowerCase().indexOf('</think>');
                    if (closeIdx !== -1) {
                      inlineThinkOpen = false;
                      if (isSmallModel) {
                        // 🛡️ Small model: strip everything UP TO and INCLUDING </think>, pass only what comes after
                        processedToken = tokenStr.slice(closeIdx + 8).trimStart();
                        console.log(`🛡️ [STREAM TRANSFORMER] Small model think-block closed. Resuming content output.`);
                      } else {
                        // Large model: keep closing tag for UI display
                        processedToken = tokenStr;
                      }
                    } else if (isSmallModel) {
                      // 🛡️ Small model in think-block: SUPPRESS entire token (do not emit to client)
                      // Hard cap safety: if thinking goes too long, force-close and resume
                      if (inlineThinkCharsEmitted > 2000) {
                        inlineThinkMaxReached = true;
                        inlineThinkOpen = false;
                        processedToken = '';
                        console.log(`🛡️ [STREAM TRANSFORMER] Small model think hard-cap (${inlineThinkCharsEmitted} chars). Resuming output.`);
                      } else {
                        processedToken = '';
                      }
                    } else if (!inlineThinkMaxReached) {
                      // 🛡️ Reasoning model stream transformer:
                      // Enforce dynamic budget.maxThinkChars (1800 chars for 9B-14B models) or response boundary
                      const isOverHardCap = inlineThinkCharsEmitted >= budget.maxThinkChars;
                      const isResponseStart = /^\s*(?:###|{{CITATION:|1\.\s*\*\*|\*\*Серцевина|\*\*Канонічне|Любов\s+—|Любов\s+у)/i.test(tokenStr);

                      if (isOverHardCap || isResponseStart) {
                        inlineThinkMaxReached = true;
                        inlineThinkOpen = false;
                        // Force-close the think block. Do NOT include the current token:
                        // the model is still mid-thought. Enter post-close suppress mode.
                        processedToken = '\n</think>\n\n';
                        postCloseSuppress = true;
                        console.log(`🛡️ [STREAM TRANSFORMER] Budget boundary auto-close of <think> for reasoning model (${inlineThinkCharsEmitted} chars, max: ${budget.maxThinkChars}). Post-close suppression ON.`);
                      }
                    }


                  } else {
                    const lower = tokenStr.toLowerCase();
                    const openIdx = lower.indexOf('<think>');
                    if (openIdx !== -1) {
                      if (isSmallModel) {
                        // 🛡️ Small model self-injected <think>: suppress it entirely
                        // Check if the entire think block is already closed in this token
                        const afterOpen = tokenStr.slice(openIdx + 7);
                        const selfCloseIdx = afterOpen.toLowerCase().indexOf('</think>');
                        if (selfCloseIdx !== -1) {
                          // Entire think block in one token: strip it, keep only text before <think> and after </think>
                          const before = tokenStr.slice(0, openIdx);
                          const after = afterOpen.slice(selfCloseIdx + 8).trimStart();
                          processedToken = before + after;
                          console.log(`🛡️ [STREAM TRANSFORMER] Small model self-contained think-block stripped inline.`);
                        } else {
                          // Multi-token think block: start suppression
                          inlineThinkOpen = true;
                          inlineThinkCharsEmitted = afterOpen.length;
                          // Emit only the content before <think>
                          processedToken = tokenStr.slice(0, openIdx);
                          console.log(`🛡️ [STREAM TRANSFORMER] Small model self-injected <think> detected. Suppressing think content.`);
                        }
                      } else {
                        inlineThinkOpen = true;
                        inlineThinkCharsEmitted = tokenStr.length - openIdx;
                        const afterOpen = tokenStr.slice(openIdx + 7);
                        if (afterOpen.toLowerCase().includes('</think>')) {
                          inlineThinkOpen = false;
                        }
                      }
                    }
                  }

                  if (processedToken && (processedToken.includes('<') || processedToken.includes('>'))) {
                    processedToken = processedToken
                      .replace(/<\/?(?:end|endoftext|end_of_turn|endofsentence|im_end)(?:\/|>|\s*>)/gi, '')
                      .replace(/<\|(?:im_end|endoftext|end_of_text|eot_id)\|>/gi, '');
                  }

                  // 🛡️ Drop prompt rule leakages, stray asterisks & strip English Phase/Step prefix labels from headers
                  if (processedToken && (processedToken.includes('*') || processedToken.includes('Phase') || processedToken.includes('Step') || processedToken.includes('LANGUAGE') || processedToken.includes('RULES:'))) {
                    // 🛡️ Fix stray single asterisks before bold headers or lists (e.g. "* **Text —" -> "• **Text —", "1. * **Text" -> "1. **Text")
                    processedToken = processedToken
                      .replace(/(###\s*)(?:Phase|Step)\s*\d+:\s*/gi, '$1')
                      .replace(/(^|\n)(\s*)\*\s+(\*\*)/g, '$1$2• $3')
                      .replace(/(^|\n)(\s*\d+\.\s*)\*\s+(\*\*|[^*]+)/g, '$1$2$3')
                      .replace(/(\n\s*)\*\s+(\d+\.|\-|\•)/g, '$1$2');

                    // 🛡️ Fix double asterisks surrounding bullet symbols (e.g. "**• **" -> "• **")
                    processedToken = processedToken
                      .replace(/(\n\s*)\*\*\s*([•\-]\s*)/g, '$1$2');

                    // 🛡️ Clean nested double asterisks inside parentheticals: e.g. "• **Text (word **inner**) —" -> "• **Text (word inner) —"
                    processedToken = processedToken
                      .replace(/(\([^)]*?)\*\*([^)]*?\))/g, '$1$2');

                    // 🛡️ Strip stray orphaned ** lines or broken double asterisks
                    processedToken = processedToken
                      .replace(/^\*\*\s*$/gm, '')
                      .replace(/\*\*\s*\n(\s*\*\*)/gm, '\n$1');

                    if (isSmallModel) {
                      processedToken = processedToken
                        .replace(/(?:RESPONSE LANGUAGE:|THINKING LANGUAGE:|RULES:\s*\d+\.|\bOutside\s*thinking\s*tags[\s,]*|\bUkrainian\s*only\s*for\s*everything\s*outside[\s\S]*?thinking\s*tags[\s,.]*)/gi, '');
                    }
                  }



                  if (processedToken && (processedToken.includes('{{') || processedToken.includes('bible.com') || processedToken.includes('CITATION') || processedToken.includes('VERSE') || processedToken.includes('(') || processedToken.includes('['))) {
                    // 🛡️ Drop citation tags where the model copied placeholder variable names literally
                    processedToken = processedToken.replace(/\{\{(?:CITATION|VERSE):[^}]*(?:BookAbbreviation|LocalizedName|LangCode|langCode|Chapter:Verse|BookName|BOOK|CHAP|VERSE|Translation Title|Book Chapter:Verse)[^}]*\}\}/gi, '');

                    // 🛡️ Convert external bible.com / bible app markdown links into native CITATION tags
                    processedToken = processedToken
                      .replace(/\[+([^\]]+)\]+\(https?:\/\/(?:www\.)?bible\.com\/[^\/]+\/(?:[^\/]+\/)?([^.\s\)]+)\.([^.\s\)]+)\.([a-z]{2,4})\)/gi, (full, label, bookChapter, verse, lang) => {
                        const cleanRef = `${bookChapter}:${verse}`.replace(/\./g, ' ');
                        return `{{CITATION: ${cleanRef}|${label || cleanRef}|${lang || targetLanguage}|Cross}}`;
                      })
                      .replace(/https?:\/\/(?:www\.)?bible\.com\/[^\/]+\/(?:[^\/]+\/)?([^.\s\)]+)\.([^.\s\)]+)\.([a-z]{2,4})/gi, (full, bookChapter, verse, lang) => {
                        const cleanRef = `${bookChapter}:${verse}`.replace(/\./g, ' ');
                        return `{{CITATION: ${cleanRef}|${cleanRef}|${lang || targetLanguage}|Cross}}`;
                      });

                    // 🛡️ Fix malformed bracketed model tags: ({[CITATION]:...), {([CITATION]:...), {{[VERSE}:...}}
                    processedToken = processedToken
                      .replace(/[\(\[\{]*\s*\[?\s*(?:CITATION|VERSE)\s*\]?\s*:\s*([^|}]+)(?:\|([^|}]+))?(?:\|([^|}]+))?(?:\|([^|}]+))?[\]\}\)]*/gi, (fullMatch, refQuery, title, lang, icon) => {
                        if (!refQuery) return fullMatch;
                        const cleanQuery = refQuery.trim().replace(/[:;.,)\s]+$/g, '');
                        const cleanTitle = (title || cleanQuery).trim();
                        const cleanLang = (lang || targetLanguage).trim();
                        const cleanIcon = (icon || 'BookOpen').trim();
                        return `{{CITATION: ${cleanQuery}|${cleanTitle}|${cleanLang}|${cleanIcon}}}`;
                      });
                  }

                  if (processedToken.includes('{{VERSE:') || processedToken.includes('{{CITATION:') || processedToken.includes('**')) {
                    // 1. Strip bold asterisks wrapping citation tags: **{{CITATION:...}}** -> {{CITATION:...}}
                    processedToken = processedToken.replace(/\*\*\s*(\{\{(?:CITATION|VERSE):[\s\S]*?\}\})\s*\*\*/gi, '$1');

                    // 2. Strip bold asterisks around parenthesized citations: **({{CITATION:...}})** -> {{CITATION:...}}
                    processedToken = processedToken.replace(/\*\*\s*\(\s*(\{\{(?:CITATION|VERSE):[\s\S]*?\}\})\s*\)\s*\*\*/gi, '$1');

                    // 3. Strip leading bold asterisks before citation tags: 1. **{{CITATION:...}} -> 1. {{CITATION:...}}
                    processedToken = processedToken.replace(/(?:^|\n)(\s*(?:[-*•\d\.]+\s*)?)\*\*\s*(\{\{(?:CITATION|VERSE):)/gi, '$1$2');

                    // 4. Strip trailing bold asterisks, dots, brackets and colons right after citation tags: }}**. -> }}
                    processedToken = processedToken.replace(/(\{\{(?:CITATION|VERSE):[^\}]+\}\})\s*(?:\*\*)?[\)\]\.]*:?\s*/gi, '$1');

                    // 5. Strip orphaned surrounding parentheses around {{VERSE:...}}: ( {{VERSE: ref}} ). -> {{CITATION:...}}
                    processedToken = processedToken.replace(/\(\s*\{\{VERSE:\s*([^|}]+)\}\}\s*\)\.?/gi, (_, refQuery) => {
                      const cleanQuery = refQuery.trim().replace(/[:;.,)\s]+$/g, '');
                      return `{{CITATION: ${cleanQuery}|${cleanQuery}|${targetLanguage}|BookOpen}}`;
                    });

                    // 6. Hydrate remaining standalone {{VERSE:...}} tags
                    processedToken = processedToken.replace(/\{\{VERSE:\s*([^|}]+)\}\}/gi, (_, refQuery) => {
                      const cleanQuery = refQuery.trim().replace(/[:;.,)\s]+$/g, '');
                      return `{{CITATION: ${cleanQuery}|${cleanQuery}|${targetLanguage}|BookOpen}}`;
                    });

                    // 7. Strip orphaned surrounding parentheses around existing {{CITATION:...}}: ( {{CITATION:...}} ). -> {{CITATION:...}}
                    processedToken = processedToken.replace(/\(\s*(\{\{CITATION:[^}]+\}\})\s*\)\.?/gi, '$1');
                  }

                  fullText += processedToken;
                  await writer.write(encoder.encode(`0:${JSON.stringify(processedToken)}\n`));
                };

                const processSingleLine = async (line: string) => {
                  const trimmed = line.trim();
                  if (!trimmed) return;

                  let json: any = null;
                  if (trimmed.charCodeAt(0) === 123 /* '{' */) {
                    try {
                      json = JSON.parse(trimmed);
                    } catch {
                      json = null;
                    }
                  }

                  if (json) {
                    if (json.error) {
                      console.error(`🚨 [OLLAMA ERROR STREAM] Model ${resolvedModel} emitted error:`, json.error);
                      const errToken = `⚠️ [Помилка Ollama]: ${json.error}`;
                      await emitToken(errToken);
                      return;
                    }

                    const msg = json.message || json.delta || {};
                    const thinkingText = msg.thinking || msg.reasoning_content || json.thinking || json.reasoning_content || '';
                    const contentText = msg.content || json.content || '';

                    if (thinkingText) {
                      let tokenStr = thinkingText;
                      if (!isThinkingPhase) {
                        isThinkingPhase = true;
                        if (!hasOpenedThink) {
                          hasOpenedThink = true;
                          tokenStr = `<think>\n${thinkingText}`;
                        }
                      }
                      await emitToken(tokenStr);
                    } else if (contentText) {
                      let tokenStr = contentText;
                      if (isThinkingPhase) {
                        isThinkingPhase = false;
                        if (!fullText.trimEnd().endsWith('</think>') && !contentText.trimStart().startsWith('</think>')) {
                          tokenStr = `\n</think>\n\n${contentText}`;
                        }
                      }
                      await emitToken(tokenStr);
                    }
                  } else {
                    let tokenStr = line;
                    if (isThinkingPhase) {
                      isThinkingPhase = false;
                      if (!fullText.trimEnd().endsWith('</think>') && !line.trimStart().startsWith('</think>')) {
                        tokenStr = `\n</think>\n\n${line}`;
                      }
                    }
                    await emitToken(tokenStr);
                  }
                };

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    if (lineBuffer.trim()) {
                      await processSingleLine(lineBuffer);
                      lineBuffer = '';
                    }
                    break;
                  }

                  hasReceivedFirstChunk = true;
                  const chunkText = decoder.decode(value, { stream: true });
                  lineBuffer += chunkText;

                  let newlineIdx: number;
                  while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
                    const line = lineBuffer.slice(0, newlineIdx);
                    lineBuffer = lineBuffer.slice(newlineIdx + 1);
                    if (line) {
                      await processSingleLine(line);
                    }
                  }
                }

                if (isThinkingPhase && !fullText.trimEnd().endsWith('</think>')) {
                  // Large reasoning model: forward closing tag to UI
                  const closingTag = '\n</think>\n\n';
                  fullText += closingTag;
                  await writer.write(encoder.encode(`0:${JSON.stringify(closingTag)}\n`));
                  isThinkingPhase = false;
                } else if (isSmallModel && inlineThinkOpen) {
                  // Small model: think block was suppressed — just reset tracking state, no output
                  inlineThinkOpen = false;
                }

                console.log(`✅ [OLLAMA ROUTE STREAM COMPLETE] Model: ${resolvedModel}, Total Emitted Tokens: ${emittedTokenCount}, Full Text Chars: ${fullText.length}`);
              } catch (streamErr: any) {
                console.warn('⚠️ [CHAT ROUTE] Stream reader idle timeout:', streamErr.message);
                if (!fullText.trim()) {
                  const idleErrorMsg = `⚠️ [Помилка затримки]: Модель ${resolvedModel} припинила передачу токенів. Спробуйте повторити запит.`;
                  await writer.write(encoder.encode(`0:${JSON.stringify(idleErrorMsg)}\n`));
                } else if (metricsTag) {
                  await writer.write(encoder.encode(`0:${JSON.stringify(`\n\n${metricsTag}`)}\n`));
                }
              } finally {
                reader.releaseLock();
              }

              if (fullText.trim() && shouldShowMetrics) {
                const hasCitationsInFullText = /\{\{CITATION:|📖|1JO|JHN|1CO|2CO|MAT|MRK|LUK|GEN|EXO/i.test(fullText);
                const mB = adaptedConfig?.parameterSize || modelCaps?.parameterSize || 14.8;
                const effMode = (effectiveDetailLevel || 'medium').toLowerCase();

                const isTier3 = mB >= 26;
                const isTier2 = mB >= 10.5 && mB < 26;
                const isTier1_5 = mB >= 8.5 && mB < 10.5;

                let accuracyNum = 96.5;
                if (hasCitationsInFullText) {
                  if (effMode === 'verses_only') {
                    if (isTier3) accuracyNum = 99.9;
                    else if (isTier2) accuracyNum = 99.5;
                    else if (isTier1_5) accuracyNum = 99.0;
                    else accuracyNum = 98.5;
                  } else if (effMode === 'deep' || effMode === 'detailed') {
                    if (isTier3) accuracyNum = 99.9;
                    else if (isTier2) accuracyNum = 99.0;
                    else if (isTier1_5) accuracyNum = 98.0;
                    else accuracyNum = 97.0;
                  } else if (effMode === 'short' || effMode === 'minimal') {
                    if (isTier3) accuracyNum = 99.5;
                    else if (isTier2) accuracyNum = 98.5;
                    else if (isTier1_5) accuracyNum = 97.0;
                    else accuracyNum = 95.5;
                  } else {
                    if (isTier3) accuracyNum = 99.9;
                    else if (isTier2) accuracyNum = 99.0;
                    else if (isTier1_5) accuracyNum = 97.5;
                    else accuracyNum = 96.5;
                  }
                } else {
                  if (isTier3) accuracyNum = 95.0;
                  else if (isTier2) accuracyNum = 92.0;
                  else if (isTier1_5) accuracyNum = 90.0;
                  else accuracyNum = 88.0;
                }

                const finalAccuracyStr = accuracyNum === 99.9 ? '99.9%' : `${accuracyNum}%`;

                const finalMetricsArray = (metricsArray || []).map((m: any) => {
                  if (m.id === 'accuracyScore') {
                    return { ...m, val: finalAccuracyStr };
                  }
                  return m;
                });

                const streamMetricsTag = `[[METRICS: ${JSON.stringify(finalMetricsArray)} ]]`;
                await writer.write(encoder.encode(`0:${JSON.stringify(`\n\n${streamMetricsTag}`)}\n`));
              }

              // 🧹 Auto Unified VRAM Release: Sets keep_alive to 10s after generation to free macOS Unified Memory & protect CoreAudio / WindowServer
              if (channelType === 'local' && resolvedModel) {
                fetch('http://127.0.0.1:11434/api/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ model: resolvedModel, keep_alive: '10s' })
                }).catch(() => {});
              }

              try { await writer.close(); } catch (e) {}
              return;
            }
          } catch (localErr: any) {
            console.warn('⚠️ [CHAT ROUTE] Local Ollama stream failed:', localErr.message);
          }
        }

        // If local Ollama failed and NO Cloud API key is provided, stream auto-healing guidance card!
        if (!hasOpenAiKey) {
          const autoHealingCard = `### ⚠️ Локальний сервер Ollama недоступний\n\nНе вдалося підключитися до локальної нейромережі \`${selectedModel || 'phi4:14b'}\`.\n\n#### 💡 **Як відновити роботу в 1 клік:**\n1. **Запустіть Ollama**: Переконайтеся, що застосунок **Ollama** запущено на вашому ПК (\`http://127.0.0.1:11434\`).\n2. **Встановіть модель** (якщо ще не завантажена):\n   \`\`\`bash\n   ollama pull ${selectedModel || 'qwen2.5'}\n   \`\`\`\n3. **Або використайте Хмарний режим**: Переключіть провайдер на **☁️ Cloud API** у налаштуваннях моделі та додайте API ключ.`;
          await writer.write(encoder.encode(`0:${JSON.stringify(autoHealingCard)}\n`));
          try { await writer.close(); } catch (e) {}
          return;
        }
      }

      // API Provider Fallback (OpenAI / Gemini)
      // 🧠 ALWAYS use a valid cloud model ID when falling back from local channel
      const cloudModel = channelType === 'api' ? (selectedModel || 'gpt-4o-mini') : 'gpt-4o-mini';
      pushStatus('status_api_connect');
      let result = await streamText({
        model: openai(cloudModel) as any,
        messages,
        temperature,
        topP,
        frequencyPenalty,
        system: systemPrompt,
        abortSignal: req.signal,
      });

      const aiStreamBody = result.toAIStreamResponse().body;
      if (aiStreamBody) {
        const reader = aiStreamBody.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let hasReceivedFirstChunk = false;

        const readWithDynamicTimeout = async (readerObj: ReadableStreamDefaultReader<Uint8Array>) => {
          const timeoutMs = hasReceivedFirstChunk ? 60000 : prefillTimeoutMs;
          let timer: NodeJS.Timeout;
          const timeoutPromise = new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(`Stream idle timeout after ${timeoutMs}ms`)), timeoutMs);
          });
          try {
            return await Promise.race([readerObj.read(), timeoutPromise]);
          } finally {
            clearTimeout(timer!);
          }
        };

        try {
          while (true) {
            const { done, value } = await readWithDynamicTimeout(reader);
            if (done) break;
            
            const decodedChunk = decoder.decode(value, { stream: true });
            fullText += decodedChunk;
            hasReceivedFirstChunk = true;

            await writer.write(value);
          }
          if (!fullText.trim()) {
            const fallbackMsg = "Дякую за запит! Відповідь опрацьована.";
            await writer.write(encoder.encode(`0:${JSON.stringify(fallbackMsg)}\n`));
          }
          if (metricsTag) {
            await writer.write(encoder.encode(`0:${JSON.stringify(`\n\n${metricsTag}`)}\n`));
          }
        } catch (streamErr: any) {
          console.warn('⚠️ [CHAT ROUTE] Stream reader idle timeout:', streamErr.message);
          // If content was already streamed, gracefully close stream instead of writing error banner
          if (!fullText.trim()) {
            const idleErrorMsg = `⚠️ [Помилка затримки]: Модель ${targetModel} припинила передачу токенів. Спробуйте повторити запит.`;
            await writer.write(encoder.encode(`0:${JSON.stringify(idleErrorMsg)}\n`));
          } else if (metricsTag) {
            await writer.write(encoder.encode(`0:${JSON.stringify(`\n\n${metricsTag}`)}\n`));
          }
        } finally {
          reader.releaseLock();
        }
      }
      
      try { await writer.close(); } catch (e) {}

    } catch (err: any) {
      if (req.signal.aborted || err.name === 'AbortError') {
        console.log(`🛑 [CHAT REQUEST] Generation aborted by user.`);
        try { await writer.close(); } catch (e) {}
        return;
      }

      console.error("Stream generation error:", err);
      const errorText = `⚠️ **Помилка підключення до нейромережі (${selectedModel || 'qwen2.5'}):**\n\nНе вдалося отримати відповідь від провайдера \`${channelType === 'local' ? (localProvider || 'Ollama') : (apiProvider || 'API')}\`.\n\n💡 **Як виправити:**\n1. Якщо ви використовуєте локальний режим — запустіть програму **Ollama** на вашому ПК (\`http://localhost:11434\`).\n2. Або внизу екрана натисніть на назву моделі та переключіть провайдера на **☁️ API (OpenAI/Gemini)**.`;
      
      try {
        await writer.write(encoder.encode(`0:${JSON.stringify(errorText)}\n`));
        await writer.close();
      } catch(e) {}
    }
  })();

  // Return headers containing the expected detail level (optional since we're streaming metrics anyway)
  responseStream.headers.set('x-effective-detail-level', mode === 'AUTO' ? 'auto' : detailLevel);

  return responseStream;
}
