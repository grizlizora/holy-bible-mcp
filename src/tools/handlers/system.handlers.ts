import { BIBLE_DB_MAGNET_URI } from "../../database.js";
import { getSensitivityDirective, resolveEffectiveMode } from "../../archetypes.js";
import { computeAdaptiveModelBudget } from "../../capabilities.js";
import { extractVectorContext } from "../../vector_context.js";
import { sanitizeMarkdownText } from "../../formatting.js";
import { DirectiveStore } from "../../directives/directive_store.js";
import {
  getGlobalConfig,
  setGlobalWarmth,
  setGlobalMode,
  setGlobalShowMetrics
} from "../../services/language_resolver.js";

export async function handleSetRelevanceSensitivity(args: any) {
  const score = Math.max(0, Math.min(100, Number(args?.score || 80)));
  setGlobalWarmth(score);
  const sensInfo = getSensitivityDirective(score);
  return {
    content: [{ type: "text", text: `[MCP CONFIRMATION] Relevance sensitivity updated to ${score}/100 (${sensInfo.label}).` }]
  };
}

export async function handleSetResponseMode(args: any) {
  const mode = String(args?.mode || "auto").toLowerCase();
  setGlobalMode(mode);
  return {
    content: [{ type: "text", text: `[MCP CONFIRMATION] Active response mode updated to '${mode}'.` }]
  };
}

export async function handleSetShowMetrics(args: any) {
  let show = true;
  if (typeof args?.enabled === "boolean") {
    show = args.enabled;
  } else if (typeof args?.status === "string") {
    const val = String(args.status).toLowerCase().trim();
    show = !(val === "off" || val === "false" || val === "0" || val === "no");
  }
  setGlobalShowMetrics(show);
  return {
    content: [{ type: "text", text: `[MCP CONFIRMATION] End-of-response metrics footer updated to ${show ? 'ON (Visible)' : 'OFF (Suppressed)'}.` }]
  };
}

export async function handleGetP2pSwarmStatus() {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        server: "holy-bible-mcp",
        protocol: "WebTorrent / BitTorrent P2P Mesh Engine",
        status: "active",
        magnetUri: BIBLE_DB_MAGNET_URI,
        databaseSize: "5.88 GB (11,907,047 verses, 800+ languages)",
        trackers: [
          "udp://tracker.opentrackr.org:1337/announce",
          "udp://tracker.openbittorrent.com:6969/announce",
          "wss://tracker.webtorrent.dev"
        ],
        p2pSeeding: "Active Decentralized Mesh Swarm"
      }, null, 2)
    }]
  };
}

export async function handleGetMcpCapabilities(args: any) {
  const config = getGlobalConfig();
  const clientHost = String(args?.client_host || args?.client_name || "external-mcp-host");
  const sensInfo = getSensitivityDirective(config.warmth);
  const effectiveMode = resolveEffectiveMode(config.mode, config.warmth);
  const store = DirectiveStore.getInstance();
  const serverInfo = store.getServerInfo();
  const warmthMeta = store.getSettingsMetadata("warmth");
  const modeMeta = store.getSettingsMetadata("modeKey");
  const metricsMeta = store.getSettingsMetadata("showMetrics");

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        server: serverInfo.server || "holy-bible-mcp",
        name: serverInfo.name,
        description: serverInfo.description,
        version: serverInfo.version || "1.0.1",
        status: "online",
        clientHost,
        autoMode: config.mode === "auto",
        defaultWarmth: config.warmth,
        activeMode: config.mode,
        resolvedEffectiveMode: effectiveMode,
        showMetrics: config.showMetrics,
        sensitivityProfile: sensInfo,
        isPrimary: true,
        hasWarmth: true,
        hasModes: true,
        settings: [
          {
            id: "warmth",
            type: "slider",
            min: 0,
            max: 100,
            defaultValue: config.warmth,
            iconName: "Flame",
            label: warmthMeta?.label,
            description: warmthMeta?.description,
            minLabel: warmthMeta?.minLabel,
            maxLabel: warmthMeta?.maxLabel,
            options: store.getAllWarmthRanges().map((w: any) => ({
              value: w.minScore,
              iconName: w.iconName,
              label: w.labels
            }))
          },
          {
            id: "modeKey",
            type: "select",
            defaultValue: config.mode,
            iconName: "Sliders",
            label: modeMeta?.label,
            description: modeMeta?.description,
            options: [
              {
                value: "auto",
                iconName: "Brain",
                label: { uk: "Авто", en: "Auto", ru: "Авто" },
                description: { uk: "Автоматичний підбір", en: "Auto complexity selection", ru: "Автоматический выбор" }
              },
              ...store.getAllModes().map((m: any) => ({
                value: m.modeKey || m.mode,
                iconName: m.iconName,
                label: (m as any).displayNames || { uk: m.labelUk, en: m.labelEn, ru: m.labelRu },
                description: (m as any).descriptions || { uk: m.description, en: m.description, ru: m.description }
              }))
            ]
          },
          {
            id: "showMetrics",
            type: "toggle",
            defaultValue: config.showMetrics,
            iconName: "Activity",
            label: metricsMeta?.label,
            description: metricsMeta?.description
          }
        ]
      }, null, 2)
    }]
  };
}

export async function handleGetModelRecommendations(args: any) {
  const modelName = String(args?.model_name || "qwen3:14b");
  const paramSizeB = typeof args?.parameter_size_b === "number" ? args.parameter_size_b : undefined;
  const userMessage = String(args?.user_message || "що таке любов");
  const warmth = typeof args?.warmth === "number" ? args.warmth : 80;

  const budget = computeAdaptiveModelBudget({
    modelName,
    userMessage,
    details: paramSizeB ? { parameter_count: paramSizeB * 1e9 } : undefined,
    warmth
  });

  return {
    content: [{ type: "text", text: JSON.stringify(budget, null, 2) }]
  };
}

export async function handleExtractVectorContext(args: any) {
  const query = String(args?.query || "");
  const fullText = String(args?.full_text || "");
  const maxTokens = typeof args?.max_tokens === "number" ? args.max_tokens : 8000;
  const filename = String(args?.filename || "attachment");

  const vectorText = await extractVectorContext(query, fullText, maxTokens, filename);
  return {
    content: [{ type: "text", text: vectorText }]
  };
}

export async function handleSanitizeScriptureMarkdown(args: any) {
  const text = String(args?.markdown_text || "");
  const sanitized = sanitizeMarkdownText(text);
  return {
    content: [{ type: "text", text: sanitized }]
  };
}
