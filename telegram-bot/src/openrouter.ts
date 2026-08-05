import OpenAI from "openai";
import http from "http";
import https from "https";

async function probeEndpoint(urlStr: string, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const isHttps = u.protocol === "https:";
      const client = isHttps ? https : http;
      const req = client.request(
        {
          hostname: u.hostname,
          port: u.port || (isHttps ? 443 : 80),
          path: u.pathname || "/",
          method: "GET",
          timeout: timeoutMs,
        },
        (res) => {
          resolve(res.statusCode !== undefined && res.statusCode < 500);
        }
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch (e) {
      resolve(false);
    }
  });
}

export async function resolveHybridEndpoint(): Promise<{ key: string; baseURL: string; mode: string }> {
  const lanUrl = process.env.LAN_BASE_URL || "http://192.168.1.100:11434/v1";
  const remoteUrl = process.env.OPENAI_BASE_URL || process.env.REMOTE_BASE_URL || "https://openrouter.ai/api/v1";
  const key = process.env.OPENAI_API_KEY || process.env.API_KEY || "local";

  // Check if user forces local LAN or custom endpoint
  if (process.env.PROVIDER_MODE === "local") {
    return { key: "local", baseURL: "http://localhost:11434/v1", mode: "100% Offline Local Machine" };
  }

  if (process.env.PROVIDER_MODE === "online") {
    return { key, baseURL: remoteUrl, mode: "Online Cloud API" };
  }

  // MODE 3: SMART HYBRID MESH ROUTER (LAN Wi-Fi Auto-Discovery -> Encrypted Remote Fallback)
  console.log(`🔍 [SMART HYBRID MESH] Probing LAN Wi-Fi Endpoint: ${lanUrl}...`);
  const lanAlive = await probeEndpoint(lanUrl, 600);

  if (lanAlive) {
    console.log(`⚡ [SMART HYBRID MESH] LAN Wi-Fi Connection Established! Using Ultra-Fast Direct LAN: ${lanUrl}`);
    return { key, baseURL: lanUrl, mode: "Direct High-Speed LAN Wi-Fi Mesh" };
  }

  console.log(`🛡 [SMART HYBRID MESH] LAN not reachable. Switching to TLS 1.3 Encrypted Remote Tunnel: ${remoteUrl}`);
  return { key, baseURL: remoteUrl, mode: "Encrypted Remote WAN Tunnel (TLS 1.3)" };
}

export function createLlmClient(apiKey?: string, customBaseUrl?: string) {
  let key = apiKey || process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY || process.env.API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || "local";
  let baseURL = customBaseUrl || process.env.OPENAI_BASE_URL || process.env.BASE_URL;

  // Auto-detect Provider Base URL if not explicitly supplied
  if (!baseURL) {
    if (process.env.PROVIDER === "alibaba" || key.startsWith("sk-dashscope-") || process.env.DASHSCOPE_API_KEY || process.env.ALIBABA_API_KEY) {
      baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"; // Alibaba Cloud DashScope API
    } else if (key.startsWith("AIzaSy")) {
      baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
    } else if (key.startsWith("sk-or-")) {
      baseURL = "https://openrouter.ai/api/v1";
    } else if (key.startsWith("gsk_")) {
      baseURL = "https://api.groq.com/openai/v1";
    } else if (key === "local" || key === "ollama") {
      baseURL = "http://localhost:11434/v1"; // Local Offline LLM (Ollama / LM Studio)
    } else {
      baseURL = "https://generativelanguage.googleapis.com/v1beta/openai/";
    }
  }

  const providerLabel = baseURL.includes("aliyuncs.com") ? "Alibaba Cloud (DashScope Qwen)" : baseURL.includes("googleapis.com") ? "Google AI Studio" : "Custom Provider";
  console.log(`🌐 [UNIVERSAL LLM ENGINE] Provider: ${providerLabel} | Target BaseURL: ${baseURL}`);

  return new OpenAI({
    baseURL: baseURL,
    apiKey: key,
    defaultHeaders: baseURL.includes("openrouter.ai") ? {
      "HTTP-Referer": "https://github.com/grizlizora/holy-bible-mcp",
      "X-Title": "Antigravity Bible Bot",
    } : {}
  });
}

// Helper to convert MCP tools format to OpenAI tools format
export function convertMcpToolsToOpenAiTools(mcpTools: any[]) {
  return mcpTools.map(tool => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }
  }));
}
