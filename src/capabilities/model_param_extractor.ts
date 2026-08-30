/**
 * 🧠 ModelParamExtractor (model_param_extractor.ts)
 * 
 * Dynamically resolves parameter size (in Billions) for ANY local or cloud LLM
 * using metadata inspection, numeric regex extraction, architecture descriptors, and context heuristics.
 */

export function extractModelParamSizeB(modelName: string, details?: any): number {
  // Layer 1: Direct Numeric Metadata Inspection
  const rawParams = details?.parameter_count || details?.num_params || details?.metadata?.parameter_count;
  if (typeof rawParams === 'number' && rawParams > 0) {
    return Math.round((rawParams / 1e9) * 10) / 10;
  }

  const strParams = details?.parameter_size || details?.parameterSizeB;
  if (typeof strParams === 'number' && strParams > 0) {
    return strParams;
  }
  if (typeof strParams === 'string' && strParams) {
    const parsed = parseFloat(strParams);
    if (!isNaN(parsed) && parsed > 0) {
      return strParams.toLowerCase().includes('m') ? Math.round((parsed / 1000) * 100) / 100 : parsed;
    }
  }

  const name = (modelName || '').toLowerCase().trim();
  if (!name) return 14.0;

  // Layer 2A: MoE (Mixture-of-Experts) Architecture Resolver (e.g., "8x7b", "16x3.5b", "8x22b")
  const moeMatch = name.match(/(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*[bB]\b/);
  if (moeMatch) {
    const experts = parseInt(moeMatch[1], 10);
    const sizePerExpert = parseFloat(moeMatch[2]);
    if (!isNaN(experts) && !isNaN(sizePerExpert)) {
      return Math.round(experts * sizePerExpert * 10) / 10;
    }
  }

  // Layer 2B: Explicit Parameter Pattern Regex in Model Identifier
  const allMatches = Array.from(name.matchAll(/(?:^|[\s\-_/:])(\d+(?:\.\d+)?)\s*[bB](?:[\s\-_/:.]|$)/g));
  if (allMatches.length > 0) {
    const values = allMatches.map(m => parseFloat(m[1])).filter(v => !isNaN(v) && v > 0);
    if (values.length > 0) {
      return Math.max(...values);
    }
  }

  // Layer 2C: Million Parameter Suffix (e.g. "350m", "500m")
  const mMatch = name.match(/(?:^|[\s\-_/:])(\d+(?:\.\d+)?)\s*[mM](?:[\s\-_/:.]|$)/);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    if (!isNaN(val) && val > 0) return Math.round((val / 1000) * 100) / 100;
  }

  // Layer 3: Known Architecture & Cloud Flagship Slugs
  if (
    name.includes('deepseek-r1') || 
    name.includes('deepseek-v3') || 
    name.includes('deepseek/deepseek-chat') || 
    name.includes('deepseek-chat') || 
    name === 'r1' ||
    name === 'v3'
  ) {
    // If it's a distilled variant, resolve actual distilled size
    if (name.includes('70b')) return 70.0;
    if (name.includes('32b')) return 32.0;
    if (name.includes('14b')) return 14.0;
    if (name.includes('8b')) return 8.0;
    if (name.includes('7b')) return 7.0;
    if (name.includes('1.5b')) return 1.5;
    return 671.0;
  }

  if (
    name.includes('gpt-4o') || 
    name.includes('o1') || 
    name.includes('o3') || 
    name.includes('claude-3-7') || 
    name.includes('claude-3.7') || 
    name.includes('claude-3-5-sonnet') || 
    name.includes('claude-3.5-sonnet') || 
    name.includes('claude-3-opus') || 
    name.includes('gemini-2.0-pro') || 
    name.includes('gemini-1.5-pro') ||
    name.includes('command-r-plus') ||
    name.includes('command-r+')
  ) {
    return 200.0;
  }

  if (
    name.includes('gpt-4o-mini') || 
    name.includes('gemini-2.0-flash') || 
    name.includes('gemini-1.5-flash') || 
    name.includes('claude-3-haiku') ||
    name.includes('claude-3.5-haiku') ||
    name.includes('codestral')
  ) {
    return 32.0;
  }

  if (name.includes('qwen2.5-coder') || name.includes('qwen2.5') || name.includes('qwen-2.5')) {
    if (name.includes('72b')) return 72.0;
    if (name.includes('32b')) return 32.0;
    if (name.includes('14b')) return 14.0;
    if (name.includes('7b')) return 7.0;
    if (name.includes('3b')) return 3.0;
    if (name.includes('1.5b')) return 1.5;
    if (name.includes('0.5b')) return 0.5;
    return 14.0;
  }

  if (name.includes('llama-3.3') || name.includes('llama3.3')) return 70.0;
  if (name.includes('llama-3.2') || name.includes('llama3.2')) {
    if (name.includes('3b')) return 3.0;
    if (name.includes('1b')) return 1.0;
    return 3.0;
  }
  if (name.includes('llama-3.1') || name.includes('llama3.1') || name.includes('llama-3') || name.includes('llama3')) {
    if (name.includes('405b')) return 405.0;
    if (name.includes('70b')) return 70.0;
    if (name.includes('8b')) return 8.0;
    if (name.includes('1b')) return 1.0;
    if (name.includes('3b')) return 3.0;
    return 8.0;
  }

  if (name.includes('mistral-large')) return 123.0;
  if (name.includes('mistral-small') || name.includes('mistral-nemo')) return 12.0;
  if (name.includes('mistral') || name.includes('mixtral')) return 7.0;
  if (name.includes('phi-4') || name.includes('phi4')) return 14.0;
  if (name.includes('phi-3.5') || name.includes('phi3.5') || name.includes('phi-3') || name.includes('phi3')) return 3.8;
  if (name.includes('gemma-2') || name.includes('gemma2')) {
    if (name.includes('27b')) return 27.0;
    if (name.includes('9b')) return 9.0;
    if (name.includes('2b')) return 2.6;
    return 9.0;
  }
  if (name.includes('smollm2') || name.includes('smollm')) {
    if (name.includes('1.7b')) return 1.7;
    if (name.includes('360m')) return 0.36;
    if (name.includes('135m')) return 0.135;
    return 1.7;
  }

  // Layer 4: Mathematical Context & KV-Cache Heuristic Estimation
  const contextLength = details?.context_length || details?.num_ctx || details?.context_window;
  if (typeof contextLength === 'number' && contextLength >= 65536) {
    return 32.0;
  }

  return 14.0;
}
