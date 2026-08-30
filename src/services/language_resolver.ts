import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadLocalEnvFiles(): void {
  const candidateEnvFiles = [
    path.resolve(process.cwd(), "server.env"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../server.env"),
    path.resolve(__dirname, "../../.env")
  ];
  for (const envFile of candidateEnvFiles) {
    if (fs.existsSync(envFile)) {
      try {
        const content = fs.readFileSync(envFile, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
          const [k, ...rest] = trimmed.split("=");
          const key = k.trim();
          const val = rest.join("=").trim().replace(/^["']|["']$/g, "");
          if (key && process.env[key] === undefined) {
            process.env[key] = val;
          }
        }
      } catch (_) {}
    }
  }
}

export function parseInitialConfig() {
  loadLocalEnvFiles();
  let warmth = 80;
  let mode = "auto";
  let showMetrics = true;

  // 1. Check environment variables
  const envWarmth = process.env.DEFAULT_WARMTH || process.env.MCP_WARMTH;
  if (envWarmth) {
    const raw = String(envWarmth).toLowerCase().trim();
    if (raw === "off" || raw === "none" || raw === "disabled" || raw === "false") {
      warmth = 0;
    } else {
      const parsed = parseInt(envWarmth, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) warmth = parsed;
    }
  }

  const envMode = process.env.DEFAULT_MODE || process.env.MCP_MODE;
  if (envMode) {
    const rawMode = String(envMode).toLowerCase().trim();
    if (['auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep', 'off', 'none', 'disabled'].includes(rawMode)) {
      mode = (rawMode === 'off' || rawMode === 'none' || rawMode === 'disabled') ? 'off' : rawMode;
    }
  }

  const envMetrics = process.env.SHOW_METRICS || process.env.DEFAULT_SHOW_METRICS || process.env.MCP_SHOW_METRICS;
  if (envMetrics) {
    const norm = String(envMetrics).toLowerCase().trim();
    if (norm === 'false' || norm === 'off' || norm === '0' || norm === 'no' || norm === 'none' || norm === 'disabled') {
      showMetrics = false;
    } else if (norm === 'true' || norm === 'on' || norm === '1' || norm === 'yes') {
      showMetrics = true;
    }
  }

  // 2. Check CLI flags
  const args = process.argv.slice(2);
  for (const arg of args) {
    if (arg.startsWith('--warmth=')) {
      const val = arg.split('=')[1].toLowerCase().trim();
      if (val === 'off' || val === 'none' || val === 'disabled') {
        warmth = 0;
      } else {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) warmth = parsed;
      }
    } else if (arg.startsWith('--mode=')) {
      const rawMode = arg.split('=')[1].toLowerCase().trim();
      if (['auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep', 'off', 'none', 'disabled'].includes(rawMode)) {
        mode = (rawMode === 'off' || rawMode === 'none' || rawMode === 'disabled') ? 'off' : rawMode;
      }
    } else if (arg.startsWith('--show-metrics=')) {
      const val = arg.split('=')[1].toLowerCase().trim();
      showMetrics = !(val === 'off' || val === 'false' || val === '0' || val === 'no' || val === 'none' || val === 'disabled');
    }
  }

  return { warmth, mode, showMetrics };
}

const initialConfig = parseInitialConfig();
let currentSensitivityScore = initialConfig.warmth;
let currentModeKey = initialConfig.mode;
let currentShowMetrics = initialConfig.showMetrics;

export function getGlobalConfig() {
  return {
    warmth: currentSensitivityScore,
    mode: currentModeKey,
    showMetrics: currentShowMetrics
  };
}

export function setGlobalWarmth(score: number) {
  currentSensitivityScore = score;
}

export function setGlobalMode(mode: string) {
  currentModeKey = mode;
}

export function setGlobalShowMetrics(show: boolean) {
  currentShowMetrics = show;
}

/**
 * 🌍 Universal 800+ ISO-639 Language Code Resolver.
 */
export function resolveLanguageCode(inputLang?: string, sampleText?: string): string {
  const norm = (inputLang || '').toLowerCase().trim();
  
  if (norm.length === 3 && norm !== 'auto') {
    return norm;
  }

  const ISO_2_TO_3: Record<string, string> = {
    uk: 'ukr', ua: 'ukr', en: 'eng', es: 'spa', de: 'deu', fr: 'fra', pl: 'pol', it: 'ita',
    pt: 'por', ru: 'rus', ro: 'ron', cs: 'ces', hu: 'hun', da: 'dan', sv: 'swe', no: 'nor',
    fi: 'fin', el: 'grc', he: 'heb', ar: 'ara', hi: 'hin', zh: 'zho', ja: 'jpn', ko: 'kor',
    tr: 'tur', nl: 'nld', bg: 'bul', sr: 'srp', hr: 'hrv', sk: 'slk', sl: 'slv', lt: 'lit',
    lv: 'lav', et: 'est', vi: 'vie', th: 'tha', id: 'ind'
  };

  if (ISO_2_TO_3[norm]) {
    return ISO_2_TO_3[norm];
  }

  const str = sampleText || '';
  if (/[\u0400-\u04FF]/u.test(str)) {
    if (/[єіїґ]/i.test(str)) return 'ukr';
    if (/[ыэъё]/i.test(str)) return 'rus';
    if (/[ў]/i.test(str)) return 'bel';
    if (/[ђјљњћџ]/i.test(str)) return 'srp';
    if (/[ѓќѕ]/i.test(str)) return 'mkd';
    return 'ukr';
  }
  if (/[\u0590-\u05FF]/u.test(str)) return 'heb';
  if (/[\u0600-\u06FF]/u.test(str)) return 'ara';
  if (/[\u0370-\u03FF]/u.test(str)) return 'grc';
  if (/[\u4E00-\u9FFF]/u.test(str)) return 'zho';
  if (/[\u3040-\u309F\u30A0-\u30FF]/u.test(str)) return 'jpn';
  if (/[\uAC00-\uD7AF]/u.test(str)) return 'kor';
  if (/[\u0900-\u097F]/u.test(str)) return 'hin';
  if (/[\u0E00-\u0E7F]/u.test(str)) return 'tha';

  if (/[ąćęłńóśźż]/i.test(str) || /\b(jest|miłość|wiara|łaska|bóg|jezus|według|świętego)\b/i.test(str)) return 'pol';
  if (/[äöüß]/i.test(str) || /\b(der|die|das|und|nicht|ist|sagt|über|glaube|hoffnung|gnade|gott)\b/i.test(str)) return 'deu';
  if (/[èêëàâîïôûùçœæ]/i.test(str) || /qu['’]|l['’]|d['’]/i.test(str) || /\b(les|des|dans|avec|pour|dieu|grâce|selon|est-ce)\b/i.test(str)) return 'fra';
  if (/[¿¡ñ]/i.test(str) || /\b(dios|jesús|gracia|dice|verdadera|según|biblia)\b/i.test(str) || (/[áíóú]/i.test(str) && /\b(el|los|las|del|por|para|con|sobre|fe)\b/i.test(str))) return 'spa';
  if (/[àèéìíîòóùú]/i.test(str) || /\b(il|lo|i|gli|per|dio|gesù|amore|fede|grazia|bibbia)\b/i.test(str)) return 'ita';
  if (/[ãõáéíóúâêôç]/i.test(str) || /\b(os|as|do|da|dos|das|com|para|deus|jesus|fé|graça)\b/i.test(str)) return 'por';
  if (/\b(the|and|is|in|of|to|that|for|with|god|jesus|love|faith|grace|bible)\b/i.test(str)) return 'eng';

  return 'ukr';



}

export function extractBiblicalSearchKeywords(question: string): string[] {
  const clean = question.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, " ").toLowerCase();
  const stopWords = new Set([
    // Ukrainian interrogatives, pronouns, auxiliaries, demonstratives
    "що", "як", "чому", "де", "коли", "хто", "який", "яка", "яке", "які", "якого", "якому", "яким", "яких", "якій", "якою",
    "про", "для", "від", "до", "на", "в", "у", "з", "із", "зі", "по", "за", "під", "над", "перед", "через", "при", "після",
    "це", "той", "та", "те", "ті", "цей", "ця", "ці", "цього", "цьому", "цим", "цих", "цій", "цією",
    "таке", "такий", "така", "такі", "такого", "такому", "таким", "таких", "такої", "такою",
    "свій", "своя", "своє", "свої", "він", "вона", "воно", "вони", "ми", "ви", "я", "ти", "мене", "тебе", "його", "її", "нас", "вас", "їх",
    "біблія", "біблії", "писання", "писанні", "слово", "боже", "говорить", "говориться", "скажи", "скажіть",
    "розкажи", "розкажіть", "поясни", "поясніть", "напиши", "дай", "знайди", "будь", "ласка", "чи", "або", "але", "хоча",
    "якщо", "тому", "щоб", "так", "ні", "є", "був", "була", "було", "були", "буде", "будуть", "означає", "значення", "сенс", "сутність",
    // Russian
    "что", "как", "почему", "где", "когда", "кто", "какой", "какая", "какое", "какие", "такое", "такой", "такая", "такие",
    "это", "этот", "эта", "эти", "этого", "этому", "этим", "этих", "расскажи", "объясни", "скажи", "библия", "библии",
    // English
    "what", "how", "why", "where", "when", "who", "which", "whom", "whose", "about", "for", "from", "to", "in", "on", "at", "by", "with",
    "the", "a", "an", "this", "that", "these", "those", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "bible", "scripture", "scriptures", "meaning", "mean", "definition", "define", "explain", "tell", "says", "say"
  ]);

  const words = clean
    .split(/\s+/)
    .filter(w => w.length >= 3 && !stopWords.has(w))
    .sort((a, b) => b.length - a.length); // Prioritize longer, domain-specific semantic keywords first

  return Array.from(new Set(words));
}
