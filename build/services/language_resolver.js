export function parseInitialConfig() {
    let warmth = 80;
    let mode = "auto";
    let showMetrics = true;
    // 1. Check environment variables
    const envWarmth = process.env.DEFAULT_WARMTH || process.env.MCP_WARMTH;
    if (envWarmth) {
        const parsed = parseInt(envWarmth, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100)
            warmth = parsed;
    }
    const envMode = process.env.DEFAULT_MODE || process.env.MCP_MODE;
    if (envMode) {
        const rawMode = String(envMode).toLowerCase().trim();
        if (['auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep'].includes(rawMode)) {
            mode = rawMode;
        }
    }
    const envMetrics = process.env.SHOW_METRICS || process.env.DEFAULT_SHOW_METRICS || process.env.MCP_SHOW_METRICS;
    if (envMetrics) {
        const norm = String(envMetrics).toLowerCase().trim();
        if (norm === 'false' || norm === 'off' || norm === '0' || norm === 'no') {
            showMetrics = false;
        }
        else if (norm === 'true' || norm === 'on' || norm === '1' || norm === 'yes') {
            showMetrics = true;
        }
    }
    // 2. Check CLI flags
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (arg.startsWith('--warmth=')) {
            const parsed = parseInt(arg.split('=')[1], 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100)
                warmth = parsed;
        }
        else if (arg.startsWith('--mode=')) {
            const rawMode = arg.split('=')[1].toLowerCase().trim();
            if (['auto', 'verses_only', 'minimal', 'short', 'medium', 'detailed', 'deep'].includes(rawMode)) {
                mode = rawMode;
            }
        }
        else if (arg.startsWith('--show-metrics=')) {
            const val = arg.split('=')[1].toLowerCase().trim();
            showMetrics = !(val === 'off' || val === 'false' || val === '0' || val === 'no');
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
export function setGlobalWarmth(score) {
    currentSensitivityScore = score;
}
export function setGlobalMode(mode) {
    currentModeKey = mode;
}
export function setGlobalShowMetrics(show) {
    currentShowMetrics = show;
}
/**
 * 🌍 Universal 800+ ISO-639 Language Code Resolver.
 */
export function resolveLanguageCode(inputLang, sampleText) {
    const norm = (inputLang || '').toLowerCase().trim();
    if (norm.length === 3 && norm !== 'auto') {
        return norm;
    }
    const ISO_2_TO_3 = {
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
        if (/[єіїґ]/i.test(str))
            return 'ukr';
        if (/[ыэъё]/i.test(str))
            return 'rus';
        if (/[ў]/i.test(str))
            return 'bel';
        if (/[ђјљњћџ]/i.test(str))
            return 'srp';
        if (/[ѓќѕ]/i.test(str))
            return 'mkd';
        return 'ukr';
    }
    if (/[\u0590-\u05FF]/u.test(str))
        return 'heb';
    if (/[\u0600-\u06FF]/u.test(str))
        return 'ara';
    if (/[\u0370-\u03FF]/u.test(str))
        return 'grc';
    if (/[\u4E00-\u9FFF]/u.test(str))
        return 'zho';
    if (/[\u3040-\u309F\u30A0-\u30FF]/u.test(str))
        return 'jpn';
    if (/[\uAC00-\uD7AF]/u.test(str))
        return 'kor';
    if (/[\u0900-\u097F]/u.test(str))
        return 'hin';
    if (/[\u0E00-\u0E7F]/u.test(str))
        return 'tha';
    if (/[ąćęłńóśźż]/i.test(str))
        return 'pol';
    if (/[áéíóúüñ¿¡]/i.test(str))
        return 'spa';
    if (/[äöüß]/i.test(str))
        return 'deu';
    if (/[éèêëàâîïôûùç]/i.test(str))
        return 'fra';
    if (/[àèéìíîòóùú]/i.test(str))
        return 'ita';
    if (/[ãõáéíóúâêôç]/i.test(str))
        return 'por';
    return 'ukr';
}
export function extractBiblicalSearchKeywords(question) {
    const clean = question.replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, " ").toLowerCase();
    const stopWords = new Set([
        "що", "як", "чому", "де", "коли", "хто", "який", "яка", "яке", "які", "про", "для", "від", "до",
        "на", "в", "у", "з", "із", "зі", "по", "за", "під", "над", "перед", "через", "при", "після",
        "це", "той", "та", "те", "ті", "цей", "ця", "ці", "свій", "своя", "своє", "свої", "він", "вона",
        "воно", "вони", "ми", "ви", "я", "ти", "мене", "тебе", "його", "її", "нас", "вас", "їх",
        "біблія", "біблії", "писання", "писанні", "слово", "боже", "говорить", "говориться", "скажи",
        "розкажи", "поясни", "напиши", "дай", "знайди", "будь", "ласка", "чи", "або", "але", "хоча",
        "якщо", "тому", "що", "щоб", "так", "ні", "є", "був", "була", "було", "були", "буде", "будуть",
        "what", "how", "why", "where", "when", "who", "which", "about", "for", "from", "to", "in", "on",
        "bible", "scripture", "god", "says", "tell", "explain", "find", "is", "are", "was", "were"
    ]);
    const words = clean.split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));
    return Array.from(new Set(words));
}
