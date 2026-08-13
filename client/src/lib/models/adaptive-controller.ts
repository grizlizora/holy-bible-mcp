import { detectHardwareSpecs, HardwareProfile, HardwareSpecs } from '@/lib/hardware-engine';
import { detectReasoningCapability } from './capabilities';

export interface ModelMetadata {
  name: string;
  architecture: string;
  parameterSize: number | null; // Size in billions (e.g. 7.2 for 7.2B)
  quantization: string | null;   // e.g. "Q4_K_M", "Q8_0", "FP16"
  nativeContextSize: number;     // Native context window limit from Ollama metadata
  supportsVision: boolean;
  supportsReasoning: boolean;
  template: string;
  modelfile: string;
  rawDetails?: any;
  rawModelInfo?: Record<string, any>;
}

export interface LatencyRecord {
  promptTokens: number;
  completionTokens: number;
  prefillTimeMs: number;     // Time to process prompt / TTFB
  generationTimeMs: number;  // Time generating tokens
  totalTimeMs: number;
  ttfbMs: number;             // Time To First Token
  timestamp: number;
}

export interface ModelPerformanceProfile {
  avgPrefillMsPerToken: number;
  avgGenerationTps: number;
  avgTtfbMs: number;
  samplesCount: number;
  lastCalibratedAt: number;
}

export interface AdaptedModelConfig {
  modelName: string;
  numCtx: number;                // Self-calibrated optimal context size
  prefillTimeoutMs: number;      // Dynamic prefill timeout in ms
  isReasoningModel: boolean;     // Dynamic reasoning model detection
  supportsVision: boolean;       // Multimodal capability
  parameterSize: number | null;  // Size in Billions
  isSmallModel: boolean;         // <= 8B
  recommendedTemperature: number;
  recommendedTopP: number;
  recommendedThreads: number;    // Dynamic multi-core CPU thread count
  compressionNeeded: boolean;    // Recommend prompt compression for small models
  architecture: string;
  estimatedPrefillMs: number;
}

const METADATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const EMA_ALPHA = 0.3; // Exponential Moving Average smoothing factor

class SmartAdaptiveControllerClass {
  private metadataCache = new Map<string, { metadata: ModelMetadata; expiresAt: number }>();
  private latencyMap = new Map<string, LatencyRecord[]>();
  private profileCache = new Map<string, ModelPerformanceProfile>();

  /**
   * 🔍 Inspects an Ollama model dynamically by querying `/api/show`.
   * Reads architecture, native context size, parameter count, quantization, and template tags.
   */
  public async inspectModel(modelName: string, customBaseUrl?: string): Promise<ModelMetadata> {
    const normalized = (modelName || '').toLowerCase().trim();
    const cached = this.metadataCache.get(normalized);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.metadata;
    }

    const defaultBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434/api';
    const baseUrl = (customBaseUrl || defaultBaseUrl).replace(/\/+$/, '');
    const showUrl = baseUrl.endsWith('/api') ? `${baseUrl}/show` : `${baseUrl}/api/show`;

    try {
      const res = await fetch(showUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(3000)
      });

      if (res.ok) {
        const data = await res.json();
        const details = data?.details || {};
        const modelInfo = data?.model_info || {};
        const template = data?.template || data?.modelfile || '';
        const modelfile = data?.modelfile || '';

        // 1. Architecture Detection
        const architecture = modelInfo['general.architecture'] || details.family || 'unknown';

        // 2. Native Context Size Extraction from model_info or parameters
        let nativeContextSize = 4096;
        
        // Search model_info for <arch>.context_length or general.context_length
        for (const [key, value] of Object.entries(modelInfo)) {
          if (key.endsWith('.context_length') || key.endsWith('.max_position_embeddings')) {
            if (typeof value === 'number' && value > 0) {
              nativeContextSize = value;
              break;
            }
          }
        }

        // Fallback: parse parameter string in modelfile for `num_ctx <val>`
        if (nativeContextSize === 4096 && modelfile) {
          const numCtxMatch = modelfile.match(/PARAMETER\s+num_ctx\s+(\d+)/i);
          if (numCtxMatch) {
            nativeContextSize = parseInt(numCtxMatch[1], 10);
          }
        }

        // 3. Parameter Size Extraction
        let parameterSize: number | null = null;
        if (details.parameter_size) {
          const parsed = parseFloat(String(details.parameter_size).replace(/B/i, ''));
          if (!isNaN(parsed) && parsed > 0) parameterSize = parsed;
        }

        if (!parameterSize && modelInfo['general.parameter_count']) {
          const count = Number(modelInfo['general.parameter_count']);
          if (!isNaN(count) && count > 0) {
            parameterSize = Math.round((count / 1e9) * 10) / 10;
          }
        }

        if (!parameterSize) {
          const match = normalized.match(/(?:^|[^a-z0-9])(\d+(?:\.\d+)?)b(?:$|[^a-z0-9])/i);
          if (match) parameterSize = parseFloat(match[1]);
        }

        // 4. Quantization Level
        const quantization = details.quantization_level || null;

        // 5. Reasoning Capability Detection
        const isReasoning = this.detectReasoning(normalized, template, modelfile);

        // 6. Vision Capability Detection
        const isVision = this.detectVision(normalized, details, modelInfo);

        const metadata: ModelMetadata = {
          name: modelName,
          architecture,
          parameterSize,
          quantization,
          nativeContextSize,
          supportsVision: isVision,
          supportsReasoning: isReasoning,
          template,
          modelfile,
          rawDetails: details,
          rawModelInfo: modelInfo
        };

        this.metadataCache.set(normalized, {
          metadata,
          expiresAt: Date.now() + METADATA_CACHE_TTL
        });

        return metadata;
      }
    } catch (err) {
      console.warn(`[ADAPTIVE-CONTROLLER] Failed to inspect model ${modelName}:`, err);
    }

    // Heuristic Fallback Profile
    const isReasoningFallback = this.detectReasoning(normalized);
    const isVisionFallback = normalized.includes('vision') || normalized.includes('-vl') || normalized.includes('llava');
    const paramMatch = normalized.match(/(?:^|[^a-z0-9])(\d+(?:\.\d+)?)b(?:$|[^a-z0-9])/i);
    
    const fallbackMeta: ModelMetadata = {
      name: modelName,
      architecture: 'unknown',
      parameterSize: paramMatch ? parseFloat(paramMatch[1]) : null,
      quantization: null,
      nativeContextSize: 4096,
      supportsVision: isVisionFallback,
      supportsReasoning: isReasoningFallback,
      template: '',
      modelfile: ''
    };

    this.metadataCache.set(normalized, { metadata: fallbackMeta, expiresAt: Date.now() + METADATA_CACHE_TTL });
    return fallbackMeta;
  }

  /**
   * ⏱️ Measures & Records Latency Metrics (TTFB, Prefill Time, Tokens/Sec).
   * Updates dynamic latency profile per model using Exponential Moving Average.
   */
  public recordLatency(modelName: string, record: Partial<LatencyRecord>): void {
    if (!modelName) return;
    const normalized = modelName.toLowerCase().trim();

    const entry: LatencyRecord = {
      promptTokens: record.promptTokens || 100,
      completionTokens: record.completionTokens || 50,
      prefillTimeMs: record.prefillTimeMs || 500,
      generationTimeMs: record.generationTimeMs || 1000,
      totalTimeMs: record.totalTimeMs || 1500,
      ttfbMs: record.ttfbMs || record.prefillTimeMs || 500,
      timestamp: Date.now()
    };

    const history = this.latencyMap.get(normalized) || [];
    history.push(entry);
    if (history.length > 20) history.shift(); // Keep 20 recent samples
    this.latencyMap.set(normalized, history);

    // Update Profile via EMA
    const prevProfile = this.profileCache.get(normalized);
    const currentPrefillRate = entry.promptTokens > 0 ? entry.prefillTimeMs / entry.promptTokens : 2.0;
    const currentTps = entry.generationTimeMs > 0 ? (entry.completionTokens / (entry.generationTimeMs / 1000)) : 15;

    if (!prevProfile) {
      this.profileCache.set(normalized, {
        avgPrefillMsPerToken: currentPrefillRate,
        avgGenerationTps: currentTps,
        avgTtfbMs: entry.ttfbMs,
        samplesCount: 1,
        lastCalibratedAt: Date.now()
      });
    } else {
      const updatedPrefill = EMA_ALPHA * currentPrefillRate + (1 - EMA_ALPHA) * prevProfile.avgPrefillMsPerToken;
      const updatedTps = EMA_ALPHA * currentTps + (1 - EMA_ALPHA) * prevProfile.avgGenerationTps;
      const updatedTtfb = EMA_ALPHA * entry.ttfbMs + (1 - EMA_ALPHA) * prevProfile.avgTtfbMs;

      this.profileCache.set(normalized, {
        avgPrefillMsPerToken: updatedPrefill,
        avgGenerationTps: updatedTps,
        avgTtfbMs: updatedTtfb,
        samplesCount: prevProfile.samplesCount + 1,
        lastCalibratedAt: Date.now()
      });
    }
  }

  /**
   * ⚙️ Dynamic Self-Calibrating Configuration Calculator.
   * Auto-adapts Context Size (`numCtx`), Prefill Timeouts, and Reasoning/Sampling parameters.
   */
  public async getAdaptedConfig(
    modelName: string,
    promptTextOrLength: string | number,
    hardwareInput?: HardwareSpecs | HardwareProfile | string,
    channelType: 'local' | 'api' = 'local',
    warmthInput?: number
  ): Promise<AdaptedModelConfig> {
    const metadata = await this.inspectModel(modelName);
    const promptLength = typeof promptTextOrLength === 'number' 
      ? promptTextOrLength 
      : this.estimateTokens(promptTextOrLength);

    const hwSpecs = typeof hardwareInput === 'object' && hardwareInput !== null && 'profile' in hardwareInput
      ? hardwareInput
      : detectHardwareSpecs();

    const paramSize = metadata.parameterSize;
    const isSmallModel = paramSize ? paramSize <= 12.5 : false;

    // 1. Calculate Self-Calibrated Context Size (numCtx)
    const numCtx = this.autoAdaptContextSize(metadata, promptLength, hwSpecs, channelType);

    // 2. Calculate Self-Calibrated Prefill Timeout
    const prefillTimeoutMs = this.autoAdaptPrefillTimeout(modelName, metadata, promptLength, hwSpecs);

    // 3. Recommended Temperature & TopP
    const warmth = typeof warmthInput === 'number' ? Math.max(0, Math.min(100, warmthInput)) : 80;
    const temperature = metadata.supportsReasoning 
      ? 0.25 + (warmth / 100) * 0.20
      : isSmallModel 
        ? 0.10 + (warmth / 100) * 0.25
        : 0.15 + (warmth / 100) * 0.55;

    const topP = metadata.supportsReasoning ? 0.85 : isSmallModel ? 0.85 : 0.90;

    const profile = this.profileCache.get(modelName.toLowerCase());
    const prefillRate = profile?.avgPrefillMsPerToken || (isSmallModel ? 1.0 : 4.0);
    const estimatedPrefillMs = Math.round(promptLength * prefillRate + (profile?.avgTtfbMs || 500));

    const recommendedThreads = this.calculateOptimalThreads(hwSpecs, isSmallModel, paramSize);

    return {
      modelName,
      numCtx,
      prefillTimeoutMs,
      isReasoningModel: metadata.supportsReasoning,
      supportsVision: metadata.supportsVision,
      parameterSize: paramSize,
      isSmallModel,
      recommendedTemperature: temperature,
      recommendedTopP: topP,
      recommendedThreads,
      compressionNeeded: isSmallModel || promptLength > (numCtx * 0.8),
      architecture: metadata.architecture,
      estimatedPrefillMs
    };
  }

  /**
   * 🧠 Smart Adaptive Multi-Core & Multi-Threading Governor
   * Dynamically calculates optimal CPU thread count based on physical cores, GPU architecture, and thermal profile.
   */
  public calculateOptimalThreads(hwSpecs: HardwareSpecs, isSmallModel: boolean, paramSize?: number | null): number {
    const logicalCores = hwSpecs.cpuCores || 8;
    const profile = hwSpecs.profile || 'high';

    // Heuristic for physical cores on hyperthreaded x86 systems vs Apple Silicon unified cores
    const physicalCores = hwSpecs.isAppleSilicon 
      ? logicalCores 
      : Math.max(2, Math.floor(logicalCores / 2));

    if (profile === 'eco') {
      return Math.max(2, Math.floor(physicalCores * 0.5));
    }
    if (profile === 'medium') {
      return Math.max(2, Math.floor(physicalCores * 0.75));
    }

    // Small models (<=8B)
    if (isSmallModel || (paramSize && paramSize <= 8)) {
      return Math.min(physicalCores, 6);
    }

    // Mid-size models (8B - 16B)
    if (paramSize && paramSize <= 16) {
      return Math.min(physicalCores, 6);
    }

    // Large & Ultra-Large models (>16B, e.g. 32B, 70B)
    return Math.min(physicalCores, 8);
  }

  /**
   * 🧠 Dynamic Reasoning Detection Logic
   */
  private detectReasoning(normalizedName: string, template: string = '', modelfile: string = ''): boolean {
    return detectReasoningCapability(normalizedName, template + ' ' + modelfile);
  }

  /**
   * 👁️ Dynamic Vision Capability Detection Logic
   */
  private detectVision(normalizedName: string, details: any = {}, modelInfo: Record<string, any> = {}): boolean {
    const family = (details.family || '').toLowerCase();
    const families: string[] = (details.families || []).map((f: string) => f.toLowerCase());
    const visionFamilies = ['clip', 'vision', 'mllama', 'qwen2vl', 'qwen2_5_vl', 'qwen3vl', 'paligemma', 'llava', 'minicpmv', 'phi3v'];

    const hasVisionFamily = visionFamilies.some(f => family.includes(f) || families.some(fam => fam.includes(f)));
    const hasVisionProjector = Object.keys(modelInfo).some(key => key.includes('projector') || key.includes('vision') || key.includes('mmproj'));

    return hasVisionFamily || hasVisionProjector || normalizedName.includes('vision') || normalizedName.includes('-vl') || normalizedName.includes('llava');
  }

  /**
   * 📐 Self-Calibrates Context Window (`numCtx`) based on native model architecture, GGUF metadata, and RAM/GPU limits.
   */
  private autoAdaptContextSize(
    metadata: ModelMetadata,
    promptTokens: number,
    hwSpecs: HardwareSpecs,
    channelType: string
  ): number {
    if (channelType === 'api') return 100_000_000;

    const nativeCtx = metadata.nativeContextSize || 32768;
    const targetCtx = Math.max(8192, promptTokens + 4096);
    const paramSize = metadata.parameterSize || 7;
    const ramGB = hwSpecs.ramGB || 16;

    let maxSafeCtx = 32768;
    if (paramSize >= 14) {
      maxSafeCtx = ramGB >= 32 ? 32768 : 16384;
    } else if (paramSize > 8) {
      maxSafeCtx = ramGB >= 16 ? 32768 : 16384;
    }

    return Math.min(nativeCtx, maxSafeCtx, targetCtx);
  }

  /**
   * ⏱️ Self-Calibrates Prefill Timeouts dynamically based on prompt length, model size, and latency.
   */
  private autoAdaptPrefillTimeout(
    modelName: string,
    metadata: ModelMetadata,
    promptTokens: number,
    hwSpecs: HardwareSpecs
  ): number {
    const perfProfile = this.profileCache.get(modelName.toLowerCase());
    const paramSize = metadata.parameterSize || 7;

    // Estimate processing time per token (ms)
    let msPerToken = perfProfile?.avgPrefillMsPerToken;
    if (!msPerToken) {
      if (hwSpecs.isDiscreteGPU || hwSpecs.isAppleSilicon) {
        msPerToken = paramSize <= 8 ? 2.5 : paramSize <= 32 ? 5.0 : 12.0;
      } else {
        msPerToken = paramSize <= 8 ? 8.0 : paramSize <= 32 ? 25.0 : 45.0;
      }
    }

    const estimatedPrefillMs = promptTokens * msPerToken;
    const coldStartBuffer = 20000; // 20s Cold load buffer for GGUF VRAM mapping & model weights load
    const reasoningMultiplier = metadata.supportsReasoning ? 1.5 : 1.0;

    const calculatedTimeout = Math.round((coldStartBuffer + estimatedPrefillMs) * reasoningMultiplier);

    // Baseline minimum prefill timeout for local models: 90,000ms (90 seconds), max 5 minutes (300,000ms)
    return Math.min(300000, Math.max(90000, calculatedTimeout));
  }

  /**
   * 🔤 Token Estimator for multi-byte Ukrainian / UTF-8 text
   */
  public estimateTokens(text: string): number {
    if (!text) return 0;
    const nonAsciiCount = (text.match(/[^\x00-\x7F]/g) || []).length;
    const asciiCount = text.length - nonAsciiCount;
    return Math.ceil(asciiCount * 0.28 + nonAsciiCount * 1.2) + 20;
  }

  public getPerformanceProfile(modelName: string): ModelPerformanceProfile | null {
    return this.profileCache.get((modelName || '').toLowerCase().trim()) || null;
  }

  public clearCache(): void {
    this.metadataCache.clear();
    this.latencyMap.clear();
    this.profileCache.clear();
  }
}

export const adaptiveController = new SmartAdaptiveControllerClass();
