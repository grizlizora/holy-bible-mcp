import { NextResponse } from 'next/server';
import { BibleMcpClient } from '@/lib/mcp/mcp-client';
import { extractCleanVerseText } from '@/lib/mcp/mcp-manager';

let globalMcpClient: BibleMcpClient | null = null;
async function getMcpClient() {
  if (!globalMcpClient) {
    globalMcpClient = new BibleMcpClient();
    await globalMcpClient.connect();
  }
  return globalMcpClient;
}

function extractVerseText(verseRes: any): string | null {
  return extractCleanVerseText(verseRes);
}

const BOOK_ALIASES: Record<string, string> = {
  'GEN': 'GEN', 'GN': 'GEN', 'GE': 'GEN', 'GENESIS': 'GEN', 'БТ': 'GEN', 'БУТ': 'GEN', 'БУТТЯ': 'GEN', 'БЫТ': 'GEN',
  'БЫТИЕ': 'GEN', 'GÉN': 'GEN', 'GÉNESIS': 'GEN', '1MO': 'GEN', '1MOSE': 'GEN', 'RDZ': 'GEN', 'RODZAJU': 'GEN', 'RODZ': 'GEN',
  'EXO': 'EXO', 'EX': 'EXO', 'EXOD': 'EXO', 'EXODUS': 'EXO', 'ВИХ': 'EXO', 'ВИХІД': 'EXO', 'ИСХ': 'EXO', 'ИСХОД': 'EXO',
  'ÉX': 'EXO', 'ÉXOD': 'EXO', 'EXODO': 'EXO', 'ÉXODO': 'EXO', '2MO': 'EXO', '2MOSE': 'EXO', 'WJ': 'EXO', 'WYJŚCIA': 'EXO',
  'WYJSCIA': 'EXO', 'WYJ': 'EXO', 'LEV': 'LEV', 'LV': 'LEV', 'LEVITICUS': 'LEV', 'ЛВ': 'LEV', 'ЛЕВ': 'LEV', 'ЛЕВІТ': 'LEV',
  'ЛЕВИТ': 'LEV', 'LÉV': 'LEV', 'LÉVITIQUE': 'LEV', 'LEVITIQUE': 'LEV', 'LEVITICO': 'LEV', '3MO': 'LEV', '3MOSE': 'LEV', 'LEVITIKUS': 'LEV',
  'KPŁ': 'LEV', 'KPL': 'LEV', 'KAPLAŃSKA': 'LEV', 'KAPLANSKA': 'LEV', 'NUM': 'NUM', 'NM': 'NUM', 'NU': 'NUM', 'NUMBERS': 'NUM',
  'ЧИС': 'NUM', 'ЧЛ': 'NUM', 'ЧИСЛА': 'NUM', 'NÚM': 'NUM', 'NUMEROS': 'NUM', '4MO': 'NUM', '4MOSE': 'NUM', 'NUMERI': 'NUM',
  'NOM': 'NUM', 'NB': 'NUM', 'NOMBRES': 'NUM', 'LB': 'NUM', 'LICZB': 'NUM', 'DEU': 'DEU', 'DT': 'DEU', 'DEUT': 'DEU',
  'DEUTERONOMY': 'DEU', 'ПВТ': 'DEU', 'ПВ': 'DEU', 'ПВТР': 'DEU', 'ПОВТОРЕННЯ': 'DEU', 'ПОВТОРЕННЯЗАКОНУ': 'DEU', 'ВТ': 'DEU', 'ВТОР': 'DEU',
  'ВТОРОЗАКОНИЕ': 'DEU', 'DEUTERONOMIO': 'DEU', '5MO': 'DEU', '5MOSE': 'DEU', 'DEUTERONOMIUM': 'DEU', 'DTN': 'DEU', 'DEUTERONOME': 'DEU', 'DEUTERONÔME': 'DEU',
  'PWT': 'DEU', 'POWTÓRZONEGOPRAWA': 'DEU', 'POWTORZONEGOPRAWA': 'DEU', 'POWT': 'DEU', 'JOS': 'JOS', 'JS': 'JOS', 'JOSH': 'JOS', 'JOSHUA': 'JOS',
  'ІСНАВ': 'JOS', 'НАВ': 'JOS', 'ІСУСНАВИН': 'JOS', 'ІСУСАНАВИНА': 'JOS', 'ИИН': 'JOS', 'ИИНАВ': 'JOS', 'ИИСУСНАВИН': 'JOS', 'ИСНАВ': 'JOS', 'JOSUE': 'JOS',
  'JOSUÉ': 'JOS', 'JOSUA': 'JOS', 'JOZ': 'JOS', 'JOZUEGO': 'JOS', 'JDG': 'JDG', 'JG': 'JDG', 'JUDG': 'JDG', 'JUDGES': 'JDG',
  'СУД': 'JDG', 'СУДДІ': 'JDG', 'СУДДІВ': 'JDG', 'СУДЬИ': 'JDG', 'JUEZ': 'JDG', 'JUE': 'JDG', 'JCZ': 'JDG', 'JUECES': 'JDG',
  'RI': 'JDG', 'RICHTER': 'JDG', 'JUG': 'JDG', 'JUGES': 'JDG', 'SDZ': 'JDG', 'SĘDZIÓW': 'JDG', 'SEDZIOW': 'JDG', 'SĘDZ': 'JDG',
  'RUT': 'RUT', 'RT': 'RUT', 'RUTH': 'RUT', 'РУТ': 'RUT', 'РУФ': 'RUT', 'РУФІ': 'RUT', 'РУФЬ': 'RUT', 'RU': 'RUT',
  '1SA': '1SA', '1S': '1SA', '1SAM': '1SA', '1SAMUEL': '1SA', '1САМ': '1SA', '1САМУЇЛА': '1SA', '1ЦАР': '1SA', '1ЦАРСТВ': '1SA',
  '1SM': '1SA', '1SAMUELA': '1SA', '1SG': '1SA', '2SA': '2SA', '2S': '2SA', '2SAM': '2SA', '2SAMUEL': '2SA', '2САМ': '2SA', '2САМУЇЛА': '2SA',
  '2ЦАР': '2SA', '2ЦАРСТВ': '2SA', '2SM': '2SA', '2SAMUELA': '2SA', '2SG': '2SA', '1KI': '1KI', '1K': '1KI', '1KGS': '1KI', '1KINGS': '1KI',
  '1ЦАРІВ': '1KI', '1ЦР': '1KI', '3ЦАР': '1KI', '3ЦАРСТВ': '1KI', '3ЦР': '1KI', '1R': '1KI', '1RE': '1KI', '1REYES': '1KI', '1KÖN': '1KI',
  '1KON': '1KI', '1KÖNIGE': '1KI', '1KONIGE': '1KI', '1ROIS': '1KI', '1KRL': '1KI', '1KROL': '1KI', '1KRÓLEWSKA': '1KI', '1KROLEWSKA': '1KI',
  '2KI': '2KI', '2K': '2KI', '2KGS': '2KI', '2KINGS': '2KI', '2ЦАРІВ': '2KI', '2ЦР': '2KI', '4ЦАР': '2KI', '4ЦАРСТВ': '2KI', '4ЦР': '2KI',
  '2R': '2KI', '2RE': '2KI', '2REYES': '2KI', '2KÖN': '2KI', '2KON': '2KI', '2KÖNIGE': '2KI', '2KONIGE': '2KI', '2ROIS': '2KI',
  '2KRL': '2KI', '2KROL': '2KI', '2KRÓLEWSKA': '2KI', '2KROLEWSKA': '2KI', '1CH': '1CH', '1C': '1CH', '1CHR': '1CH', '1CHRON': '1CH',
  '1CHRONICLES': '1CH', '1ХР': '1CH', '1ХРОНІК': '1CH', '1ПАР': '1CH', '1ПАРАЛИПОМЕНОН': '1CH', '1CR': '1CH', '1CRON': '1CH', '1CRONICAS': '1CH',
  '1CRÓNICAS': '1CH', '1CHRONIK': '1CH', '1CHRONIQUES': '1CH', '1KRN': '1CH', '1KRONIK': '1CH', '2CH': '2CH', '2C': '2CH', '2CHR': '2CH',
  '2CHRON': '2CH', '2CHRONICLES': '2CH', '2ХР': '2CH', '2ХРОНІК': '2CH', '2ПАР': '2CH', '2ПАРАЛИПОМЕНОН': '2CH', '2CR': '2CH', '2CRON': '2CH',
  '2CRONICAS': '2CH', '2CRÓNICAS': '2CH', '2CHRONIK': '2CH', '2CHRONIQUES': '2CH', '2KRN': '2CH', '2KRONIK': '2CH', 'EZR': 'EZR', 'EZ': 'EZR',
  'EZRA': 'EZR', 'ЕЗД': 'EZR', 'ЕЗДРИ': 'EZR', 'ЕЗДРА': 'EZR', 'EZD': 'EZR', 'EZDR': 'EZR', 'ESD': 'EZR', 'ESDRAS': 'EZR', 'ESR': 'EZR', 'ESRA': 'EZR',
  'EZDRASZA': 'EZR', 'NEH': 'NEH', 'NE': 'NEH', 'NEHEMIAH': 'NEH', 'НЕЄМ': 'NEH', 'НЕЕМ': 'NEH', 'НЕЄМІЇ': 'NEH', 'НЕЕМИЯ': 'NEH',
  'NÉH': 'NEH', 'NEHEMIE': 'NEH', 'NÉHÉMIE': 'NEH', 'NEHEMIAS': 'NEH', 'NEHEMÍAS': 'NEH', 'NEHEMIA': 'NEH', 'NEHEMIASZA': 'NEH', 'EST': 'EST',
  'ES': 'EST', 'ESTH': 'EST', 'ESTHER': 'EST', 'ЕСТ': 'EST', 'ЕСТЕР': 'EST', 'ЕСФ': 'EST', 'ЕСФИРЬ': 'EST', 'ESTER': 'EST',
  'ESTERY': 'EST', 'JOB': 'JOB', 'JB': 'JOB', 'ЙОВ': 'JOB', 'ЙОВА': 'JOB', 'ІОВ': 'JOB', 'ИОВ': 'JOB', 'ИВ': 'JOB',
  'HI': 'JOB', 'HIOB': 'JOB', 'HIOBA': 'JOB', 'PSA': 'PSA', 'PS': 'PSA', 'PSALM': 'PSA', 'PSALMS': 'PSA', 'ПС': 'PSA',
  'ПСЛ': 'PSA', 'ПСАЛ': 'PSA', 'ПСАЛОМ': 'PSA', 'ПСАЛМИ': 'PSA', 'ПСАЛЬМИ': 'PSA', 'ПСАЛТИР': 'PSA', 'ПСАЛТИРЬ': 'PSA', 'SAL': 'PSA',
  'SALMO': 'PSA', 'SALMOS': 'PSA', 'PSAUME': 'PSA', 'PSAUMES': 'PSA', 'PSALMEN': 'PSA', 'PSALMY': 'PSA', 'PSALMÓW': 'PSA', 'PSALMOW': 'PSA',
  'PRO': 'PRO', 'PR': 'PRO', 'PROV': 'PRO', 'PROVERBS': 'PRO', 'ПР': 'PRO', 'ПРИП': 'PRO', 'ПРТ': 'PRO', 'ПРИПОВІСТІ': 'PRO',
  'ПРИПОВІСТЕЙ': 'PRO', 'ПРИТЧІ': 'PRO', 'ПРИТЧИ': 'PRO', 'ПРИТ': 'PRO', 'PRV': 'PRO', 'PROVERBIOS': 'PRO', 'PROVERBES': 'PRO', 'SPR': 'PRO',
  'SPRÜCHE': 'PRO', 'SPRUCHE': 'PRO', 'PRZ': 'PRO', 'PRZYSŁÓW': 'PRO', 'PRZYSLOW': 'PRO', 'ECC': 'ECC', 'EC': 'ECC', 'ECCL': 'ECC',
  'ECCLES': 'ECC', 'ECCLESIASTES': 'ECC', 'ЕКК': 'ECC', 'ЕКЛ': 'ECC', 'ЕККЛЕЗІЯСТ': 'ECC', 'ЕККЛЕСІАСТ': 'ECC', 'ЕККЛЕСИАСТ': 'ECC', 'ПРОПОВІДНИК': 'ECC',
  'ECL': 'ECC', 'ECLESIASTES': 'ECC', 'ECLESIASTÉS': 'ECC', 'ECCLÉSIASTE': 'ECC', 'KOH': 'ECC', 'KOHELET': 'ECC', 'PRD': 'ECC', 'PREDIGER': 'ECC',
  'KAZN': 'ECC', 'KOHELETA': 'ECC', 'SNG': 'SNG', 'SS': 'SNG', 'SONG': 'SNG', 'SOLOMON': 'SNG', 'SONGOFSONGS': 'SNG', 'SONGOFSOLOMON': 'SNG',
  'ПІСН': 'SNG', 'ПІСНЯ': 'SNG', 'ПІСЕНЬ': 'SNG', 'ПІСНЯПІСНЕЙ': 'SNG', 'ПП': 'SNG', 'ПЕСНЬ': 'SNG', 'ПЕСН': 'SNG', 'ПЕСНЬПЕСНЕЙ': 'SNG',
  'CANT': 'SNG', 'CANTA': 'SNG', 'CNT': 'SNG', 'CANTARES': 'SNG', 'CANTIQUE': 'SNG', 'CT': 'SNG', 'HLD': 'SNG', 'HOHELIED': 'SNG',
  'PNP': 'SNG', 'PIEŚŃNADPIEŚNIAMI': 'SNG', 'PIESNNADPIESNIAMI': 'SNG', 'ISA': 'ISA', 'IS': 'ISA', 'ISAIAH': 'ISA', 'ІС': 'ISA', 'ІСАЇ': 'ISA',
  'ІСАЯ': 'ISA', 'ИС': 'ISA', 'ИСАИЯ': 'ISA', 'ИСАИИ': 'ISA', 'ISAIAS': 'ISA', 'ISAÍAS': 'ISA', 'ÉSA': 'ISA', 'ESA': 'ISA',
  'ÉSAÏE': 'ISA', 'ESAIE': 'ISA', 'JES': 'ISA', 'JESAJA': 'ISA', 'IZ': 'ISA', 'IZAJ': 'ISA', 'IZAJASZA': 'ISA', 'JER': 'JER',
  'JR': 'JER', 'JEREMIAH': 'JER', 'ЄР': 'JER', 'ЄРЕМІЇ': 'JER', 'ЄРЕМІЯ': 'JER', 'ИЕР': 'JER', 'ИЕРЕМИЯ': 'JER', 'ИЕРЕМИИ': 'JER',
  'JEREMIAS': 'JER', 'JEREMÍAS': 'JER', 'JÉR': 'JER', 'JÉRÉMIE': 'JER', 'JEREMIE': 'JER', 'JEREMIA': 'JER', 'JEREMIASZA': 'JER', 'LAM': 'LAM',
  'LM': 'LAM', 'LAMENTATIONS': 'LAM', 'ПЛ': 'LAM', 'ПЛАЧ': 'LAM', 'ПЛЄР': 'LAM', 'ПЛАЧЄРЕМІЇ': 'LAM', 'LAMENTACIONES': 'LAM', 'KLGL': 'LAM',
  'KLAGELIEDER': 'LAM', 'LAMENTACJE': 'LAM', 'EZK': 'EZK', 'EK': 'EZK', 'EZEK': 'EZK', 'EZEKIEL': 'EZK', 'ЄЗ': 'EZK', 'ЄЗЕКІЇЛЯ': 'EZK',
  'ЄЗЕКІЇЛЬ': 'EZK', 'ИЕЗ': 'EZK', 'ИЕЗЕКИИЛЬ': 'EZK', 'EZEQUIEL': 'EZK', 'ÉZ': 'EZK', 'ÉZÉCHIEL': 'EZK', 'EZECHIEL': 'EZK', 'HES': 'EZK',
  'HESEKIEL': 'EZK', 'EZECH': 'EZK', 'EZECHIELA': 'EZK', 'EZEQ': 'EZK', 'DAN': 'DAN', 'DN': 'DAN', 'DANIEL': 'DAN', 'ДАН': 'DAN', 'ДН': 'DAN',
  'ДАНИЇЛА': 'DAN', 'ДАНИЇЛ': 'DAN', 'ДАНИИЛ': 'DAN', 'DANIELA': 'DAN', 'HOS': 'HOS', 'HS': 'HOS', 'HOSEA': 'HOS', 'ОС': 'HOS',
  'ОСІЇ': 'HOS', 'ОСІЯ': 'HOS', 'ОСИЯ': 'HOS', 'OSEAS': 'HOS', 'OSÉE': 'HOS', 'OSEE': 'HOS', 'OZ': 'HOS', 'OSZ': 'HOS',
  'OZEASZA': 'HOS', 'JOL': 'JOL', 'JL': 'JOL', 'JOEL': 'JOL', 'ЙОІЛ': 'JOL', 'ЙОЇЛ': 'JOL', 'ЙОІЛА': 'JOL', 'ЙОЇЛА': 'JOL',
  'ЙЛ': 'JOL', 'ИОИЛЬ': 'JOL', 'ИИЛ': 'JOL', 'JOËL': 'JOL', 'JOELA': 'JOL', 'AMO': 'AMO', 'AM': 'AMO', 'AMOS': 'AMO',
  'АМ': 'AMO', 'АМОС': 'AMO', 'АМОСА': 'AMO', 'AMÓS': 'AMO', 'AMOSA': 'AMO', 'OBA': 'OBA', 'OB': 'OBA', 'OBAD': 'OBA',
  'OBADIAH': 'OBA', 'ОВ': 'OBA', 'ОВД': 'OBA', 'ОВДІЙ': 'OBA', 'ОВДІЯ': 'OBA', 'АВД': 'OBA', 'АВДИЙ': 'OBA', 'ABD': 'OBA',
  'ABDÍAS': 'OBA', 'ABDIAS': 'OBA', 'OBADJA': 'OBA', 'ABDIASZA': 'OBA', 'JON': 'JON', 'JH': 'JON', 'JNH': 'JON', 'JONAH': 'JON',
  'ЙОН': 'JON', 'ЙОНА': 'JON', 'ЙОНИ': 'JON', 'ИОНА': 'JON', 'ИОН': 'JON', 'JONÁS': 'JON', 'JONAS': 'JON', 'JONA': 'JON',
  'JONASZA': 'JON', 'JNA': 'JON', 'MIC': 'MIC', 'MICAH': 'MIC', 'МИХ': 'MIC', 'МИХЕЙ': 'MIC', 'МИХЕЯ': 'MIC', 'MIQ': 'MIC',
  'MI': 'MIC', 'MIQUEAS': 'MIC', 'MICHÉE': 'MIC', 'MICHEE': 'MIC', 'MICHA': 'MIC', 'MICH': 'MIC', 'MICHEASZA': 'MIC', 'NAM': 'NAM',
  'NA': 'NAM', 'NAH': 'NAM', 'NAHUM': 'NAM', 'НАМ': 'NAM', 'НАУМ': 'NAM', 'НАУМА': 'NAM', 'NAHÚM': 'NAM', 'NAHUMA': 'NAM',
  'HAB': 'HAB', 'HK': 'HAB', 'HABAKKUK': 'HAB', 'АВ': 'HAB', 'АВК': 'HAB', 'АВАКУМ': 'HAB', 'АВАКУМА': 'HAB', 'АВВАКУМ': 'HAB',
  'АВВ': 'HAB', 'HABACUC': 'HAB', 'HA': 'HAB', 'HABAKUK': 'HAB', 'HABAKUKA': 'HAB', 'ZEP': 'ZEP', 'ZP': 'ZEP', 'ZEPH': 'ZEP',
  'ZEPHANIAH': 'ZEP', 'СОФ': 'ZEP', 'СОФОНІЯ': 'ZEP', 'СОФОНІЇ': 'ZEP', 'СОФОНИЯ': 'ZEP', 'SOF': 'ZEP', 'SOFONÍAS': 'ZEP', 'SOFONIAS': 'ZEP',
  'SO': 'ZEP', 'SOPHONIE': 'ZEP', 'ZEFANJA': 'ZEP', 'SOFONIASZA': 'ZEP', 'HAG': 'HAG', 'HG': 'HAG', 'HAGGAI': 'HAG', 'ОГ': 'HAG',
  'АГ': 'HAG', 'АГЕЙ': 'HAG', 'АГЕЯ': 'HAG', 'АГГЕЙ': 'HAG', 'АГГ': 'HAG', 'AGG': 'HAG', 'HAGEO': 'HAG', 'AG': 'HAG', 'AGGÉE': 'HAG',
  'AGGEE': 'HAG', 'AGGEUSZA': 'HAG', 'ZEC': 'ZEC', 'ZC': 'ZEC', 'ZECH': 'ZEC', 'ZECHARIAH': 'ZEC', 'ЗАХ': 'ZEC', 'ЗАХАРІЯ': 'ZEC',
  'ЗАХАРІЇ': 'ZEC', 'ЗАХАРИЯ': 'ZEC', 'ZAC': 'ZEC', 'ZACARÍAS': 'ZEC', 'ZACARIAS': 'ZEC', 'ZA': 'ZEC', 'ZACHARIE': 'ZEC', 'SACH': 'ZEC',
  'SACHARJA': 'ZEC', 'ZACH': 'ZEC', 'ZACHARIASZA': 'ZEC', 'MAL': 'MAL', 'ML': 'MAL', 'MALACHI': 'MAL', 'МАЛ': 'MAL', 'МАЛАХІЯ': 'MAL',
  'МАЛАХІЇ': 'MAL', 'МАЛАХИЯ': 'MAL', 'MALAQUÍAS': 'MAL', 'MALAQUIAS': 'MAL', 'MALACHIE': 'MAL', 'MALEACHI': 'MAL', 'MALACHIASZA': 'MAL', 'TOB': 'TOB',
  'TOBIT': 'TOB', 'ТОВ': 'TOB', 'ТОВИТ': 'TOB', 'JDT': 'JDT', 'JUDITH': 'JDT', 'ЮДТ': 'JDT', 'ЮДИТ': 'JDT', 'ИУДИФЬ': 'JDT',
  'WIS': 'WIS', 'WISDOM': 'WIS', 'ПРЕМ': 'WIS', 'ПРЕМУДРОСТІ': 'WIS', 'SIR': 'SIR', 'SIRACH': 'SIR', 'СИР': 'SIR', 'СИРАХ': 'SIR',
  'BAR': 'BAR', 'BARUCH': 'BAR', 'ВАР': 'BAR', 'ВАРУХ': 'BAR', 'LJE': 'LJE', 'LETTEROFJEREMIAH': 'LJE', '1MA': '1MA', '1MACCABEES': '1MA',
  '1МАК': '1MA', '2MA': '2MA', '2MACCABEES': '2MA', '2МАК': '2MA', '3MA': '3MA', '3MACCABEES': '3MA', '3МАК': '3MA', '4MA': '4MA',
  '4MACCABEES': '4MA', '4МАК': '4MA', '1ES': '1ES', '1ESDRAS': '1ES', '2ЕЗД': '1ES', '2ES': '2ES', '2ESDRAS': '2ES', '3ЕЗД': '2ES',
  'MAN': 'MAN', 'MANASSEH': 'MAN', 'МАН': 'MAN', 'PS151': 'PS151', 'ПС151': 'PS151', 'SUS': 'SUS', 'SUSANNA': 'SUS', 'СУС': 'SUS',
  'BEL': 'BEL', 'BELANDDRAGON': 'BEL', 'БЕЛ': 'BEL', 'ВІЛ': 'BEL', 'S3Y': 'S3Y', 'SONGOFTHREEYOUTHS': 'S3Y', 'LAO': 'LAO', 'LAODICEANS': 'LAO',
  'ЛАО': 'LAO', 'ENO': 'ENO', 'ENOCH': 'ENO', 'ЕНОХ': 'ENO', 'MAT': 'MAT', 'MT': 'MAT', 'MATT': 'MAT', 'MATTHEW': 'MAT',
  'МТ': 'MAT', 'МФ': 'MAT', 'МАТВІЯ': 'MAT', 'МАТВІЙ': 'MAT', 'МАТФЕЯ': 'MAT', 'МАТФЕЙ': 'MAT', 'MATEO': 'MAT', 'MATTHIEU': 'MAT',
  'MATTHÄUS': 'MAT', 'MATTHAUS': 'MAT', 'MATTH': 'MAT', 'MATEUSZA': 'MAT', 'MRK': 'MRK', 'MK': 'MRK', 'MR': 'MRK', 'MARK': 'MRK',
  'МК': 'MRK', 'МР': 'MRK', 'МАРКА': 'MRK', 'МАРКО': 'MRK', 'МАРК': 'MRK', 'MAR': 'MRK', 'MARCOS': 'MRK', 'MARC': 'MRK',
  'MARKUS': 'MRK', 'MARKA': 'MRK', 'MC': 'MRK', 'LUK': 'LUK', 'LK': 'LUK', 'LUKE': 'LUK', 'ЛК': 'LUK', 'ЛУКИ': 'LUK', 'ЛУКА': 'LUK',
  'LUC': 'LUK', 'LC': 'LUK', 'LUCAS': 'LUK', 'LUKAS': 'LUK', 'ŁK': 'LUK', 'ŁUKASZA': 'LUK', 'LUKASZA': 'LUK', 'JHN': 'JHN',
  'JN': 'JHN', 'JOH': 'JHN', 'JOHN': 'JHN', 'ІВ': 'JHN', 'ІН': 'JHN', 'ЙОА': 'JHN', 'ЙОАН': 'JHN', 'ЙВ': 'JHN', 'ЙВН': 'JHN',
  'ІВАНА': 'JHN', 'ІВАН': 'JHN', 'ИН': 'JHN', 'ИОАНН': 'JHN', 'ИОАННА': 'JHN', 'JUAN': 'JHN', 'JEAN': 'JHN', 'JOHANNES': 'JHN',
  'J': 'JHN', 'JANA': 'JHN', 'ACT': 'ACT', 'AC': 'ACT', 'ACTS': 'ACT', 'ДІЇ': 'ACT', 'ДІЙ': 'ACT', 'ДІЯН': 'ACT', 'ДІЯННЯ': 'ACT',
  'ДК': 'ACT', 'ДЕЯН': 'ACT', 'ДЕЯНИЯ': 'ACT', 'HCH': 'ACT', 'HECHOS': 'ACT', 'ACTES': 'ACT', 'APG': 'ACT', 'APOSTELGESCHICHTE': 'ACT',
  'DZ': 'ACT', 'DZIEJE': 'ACT', 'ROM': 'ROM', 'RM': 'ROM', 'RO': 'ROM', 'ROMANS': 'ROM', 'РИМ': 'ROM', 'РМ': 'ROM',
  'РМЛ': 'ROM', 'РИМЛЯНАМ': 'ROM', 'РОМ': 'ROM', 'РОМЛ': 'ROM', 'РОМЛЯНАМ': 'ROM', 'ROMANOS': 'ROM', 'ROMAINS': 'ROM', 'RÖM': 'ROM', 'RÖMER': 'ROM', 'ROMER': 'ROM', 'RZ': 'ROM',
  'RZYMIAN': 'ROM', '1CO': '1CO', '1COR': '1CO', '1CORINTHIANS': '1CO', '1КОР': '1CO', '1КО': '1CO', '1КОРИНФЯНАМ': '1CO', '1КОРИНТЯНАМ': '1CO',
  '1CORINTIOS': '1CO', '1CORINTHIENS': '1CO', '1KOR': '1CO', '1KORINTHER': '1CO', 'KORYNTIAN': '1CO', '2CO': '2CO', '2COR': '2CO', '2CORINTHIANS': '2CO',
  '2КОР': '2CO', '2КО': '2CO', '2КОРИНФЯНАМ': '2CO', '2КОРИНТЯНАМ': '2CO', '2CORINTIOS': '2CO', '2CORINTHIENS': '2CO', '2KOR': '2CO', '2KORINTHER': '2CO',
  'GAL': 'GAL', 'GL': 'GAL', 'GALATIANS': 'GAL', 'ГАЛ': 'GAL', 'ГЛ': 'GAL', 'ГАЛАТІВ': 'GAL', 'ГАЛАТАМ': 'GAL', 'GÁL': 'GAL',
  'GA': 'GAL', 'GALATAS': 'GAL', 'GÁLATAS': 'GAL', 'GALATES': 'GAL', 'GALATER': 'GAL', 'GALATÓW': 'GAL', 'GALATOW': 'GAL', 'EPH': 'EPH',
  'EP': 'EPH', 'EPHESIANS': 'EPH', 'ЕФ': 'EPH', 'ЄФ': 'EPH', 'ЕП': 'EPH', 'ЕФЕСЯН': 'EPH', 'ЄФЕСЯН': 'EPH', 'ЕФЕСЯНАМ': 'EPH',
  'EF': 'EPH', 'EFESIOS': 'EPH', 'ÉPH': 'EPH', 'ÉPHÉSIENS': 'EPH', 'EPHESIENS': 'EPH', 'EPHESER': 'EPH', 'EFEZJAN': 'EPH', 'PHP': 'PHP',
  'PP': 'PHP', 'PHIL': 'PHP', 'PHI': 'PHP', 'PHILIPPIANS': 'PHP', 'ФИЛ': 'PHP', 'ФЛП': 'PHP', 'ФИЛИПЯН': 'PHP', 'ФИЛИПІЯНАМ': 'PHP',
  'ЯНАМ': 'PHP', 'ФИЛИППИЙЦАМ': 'PHP', 'FIL': 'PHP', 'FLP': 'PHP', 'FILIPENSES': 'PHP', 'PH': 'PHP', 'PHILIPPIENS': 'PHP', 'PHILIPPER': 'PHP',
  'FILIPIAN': 'PHP', 'COL': 'COL', 'CL': 'COL', 'COLOSSIANS': 'COL', 'КОЛ': 'COL', 'КЛ': 'COL', 'КОЛОССЯН': 'COL', 'КОЛОССЯНАМ': 'COL',
  'COLOSENSES': 'COL', 'COLOSSIENS': 'COL', 'KOL': 'COL', 'KOLOSSER': 'COL', 'KOLOSAN': 'COL', '1TH': '1TH', '1TS': '1TH', '1THESS': '1TH',
  '1THESSALONIANS': '1TH', '1СОЛ': '1TH', '1ФЕС': '1TH', '1САЛ': '1TH', '1СОЛУНЯНАМ': '1TH', '1ФЕСАЛОНІКІЙЦЯМ': '1TH', '1ФЕССАЛОНИКИЙЦАМ': '1TH', '1TES': '1TH',
  '1TESALONICENSES': '1TH', '1THESSALONICIENS': '1TH', '1THESSALONICHER': '1TH', 'TESALONICZAN': '1TH', '2TH': '2TH', '2TS': '2TH', '2THESS': '2TH', '2THESSALONIANS': '2TH',
  '2СОЛ': '2TH', '2ФЕС': '2TH', '2САЛ': '2TH', '2СОЛУНЯНАМ': '2TH', '2ФЕСАЛОНІКІЙЦЯМ': '2TH', '2ФЕССАЛОНИКИЙЦАМ': '2TH', '2TES': '2TH', '2TESALONICENSES': '2TH',
  '2THESSALONICIENS': '2TH', '2THESSALONICHER': '2TH', '1TI': '1TI', '1TM': '1TI', '1TIM': '1TI', '1TIMOTHY': '1TI', '1ТИМ': '1TI', '1ТМ': '1TI',
  '1ТИМОФІЮ': '1TI', '1ТИМОФІЯ': '1TI', '1ТИМОФЕЮ': '1TI', '1TIMOTEO': '1TI', '1TIMOTHÉE': '1TI', '1TIMOTHEE': '1TI', '1TIMOTHEUS': '1TI', '1TYM': '1TI', 'TYMOTEUSZA': '1TI', 'TYM': '1TI',
  '2TI': '2TI', '2TM': '2TI', '2TIM': '2TI', '2TIMOTHY': '2TI', '2ТИМ': '2TI', '2ТМ': '2TI', '2ТИМОФІЮ': '2TI', '2ТИМОФІЯ': '2TI',
  '2ТИМОФЕЮ': '2TI', '2TIMOTEO': '2TI', '2TIMOTHÉE': '2TI', '2TIMOTHEE': '2TI', '2TIMOTHEUS': '2TI', '2TYM': '2TI', 'TIT': 'TIT', 'TITUS': 'TIT', 'ТИТ': 'TIT',
  'ТИТА': 'TIT', 'ТИТУ': 'TIT', 'TITO': 'TIT', 'TITE': 'TIT', 'TYT': 'TIT', 'TYTUSA': 'TIT', 'PHM': 'PHM', 'PM': 'PHM',
  'PHILEM': 'PHM', 'PHILEMON': 'PHM', 'ФЛМ': 'PHM', 'ФЛМН': 'PHM', 'ФИЛИМОНА': 'PHM', 'ФИЛИМОНУ': 'PHM', 'FLM': 'PHM', 'FILEMÓN': 'PHM',
  'FILEMON': 'PHM', 'PHILÉMON': 'PHM', 'PHLM': 'PHM', 'FILEMONA': 'PHM', 'HEB': 'HEB', 'HB': 'HEB', 'HEBREWS': 'HEB', 'ЄВР': 'HEB',
  'ЕВР': 'HEB', 'ЄВРН': 'HEB', 'ЄВРЕЇВ': 'HEB', 'ЄВРЕЯМ': 'HEB', 'ЕВРЕЯМ': 'HEB', 'HEBREOS': 'HEB', 'HÉB': 'HEB', 'HÉBREUX': 'HEB',
  'HEBREUX': 'HEB', 'HEBR': 'HEB', 'HEBRÄER': 'HEB', 'HEBRAER': 'HEB', 'HBR': 'HEB', 'HEBRAJCZYKÓW': 'HEB', 'HEBRAJCZYKOW': 'HEB', 'JAS': 'JAS',
  'JM': 'JAS', 'JAM': 'JAS', 'JAMES': 'JAS', 'ЯК': 'JAS', 'ЯКОВА': 'JAS', 'ЯКІВ': 'JAS', 'ИАК': 'JAS', 'ИАКОВА': 'JAS',
  'ИАКОВ': 'JAS', 'STG': 'JAS', 'SANT': 'JAS', 'SANTIAGO': 'JAS', 'JC': 'JAS', 'JACQ': 'JAS', 'JACQUES': 'JAS', 'JAK': 'JAS',
  'JAKOBUS': 'JAS', 'JK': 'JAS', 'JAKUBA': 'JAS', '1PE': '1PE', '1PT': '1PE', '1PTR': '1PE', '1PET': '1PE', '1PETER': '1PE',
  '1ПЕТ': '1PE', '1ПТР': '1PE', '1ПТ': '1PE', '1ПЕТРА': '1PE', '1ПЕТРО': '1PE', '1PED': '1PE', '1P': '1PE', '1PEDRO': '1PE',
  '1PIERRE': '1PE', '1PETR': '1PE', '1PETRUS': '1PE', 'PIOTRA': '1PE', '2PE': '2PE', '2PT': '2PE', '2PTR': '2PE', '2PET': '2PE',
  '2PETER': '2PE', '2ПЕТ': '2PE', '2ПТР': '2PE', '2ПТ': '2PE', '2ПЕТРА': '2PE', '2ПЕТРО': '2PE', '2PED': '2PE', '2P': '2PE',
  '2PEDRO': '2PE', '2PIERRE': '2PE', '2PETR': '2PE', '2PETRUS': '2PE', '1JN': '1JN', '1JO': '1JN', '1JOH': '1JN', '1JOHN': '1JN',
  '1ІВ': '1JN', '1ІН': '1JN', '1ЙОА': '1JN', '1ІВАНА': '1JN', '1ІВАН': '1JN', '1ИН': '1JN', '1ИОАН': '1JN', '1ИОАННА': '1JN',
  '1JUAN': '1JN', '1JEAN': '1JN', '1JOHANNES': '1JN', '1J': '1JN', '2JN': '2JN', '2JO': '2JN', '2JOH': '2JN', '2JOHN': '2JN',
  '2ІВ': '2JN', '2ІН': '2JN', '2ЙОА': '2JN', '2ІВАНА': '2JN', '2ІВАН': '2JN', '2ИН': '2JN', '2ИОАН': '2JN', '2ИОАННА': '2JN',
  '2JUAN': '2JN', '2JEAN': '2JN', '2JOHANNES': '2JN', '2J': '2JN', '3JN': '3JN', '3JO': '3JN', '3JOH': '3JN', '3JOHN': '3JN',
  '3ІВ': '3JN', '3ІН': '3JN', '3ЙОА': '3JN', '3ІВАНА': '3JN', '3ІВАН': '3JN', '3ИН': '3JN', '3ИОАН': '3JN', '3ИОАННА': '3JN',
  '3JUAN': '3JN', '3JEAN': '3JN', '3JOHANNES': '3JN', '3J': '3JN', 'JUD': 'JUD', 'JD': 'JUD', 'JOD': 'JUD', 'JUDE': 'JUD',
  'ЮД': 'JUD', 'ЮДА': 'JUD', 'ЮДИ': 'JUD', 'ІУД': 'JUD', 'ІУДА': 'JUD', 'ІУДИ': 'JUD', 'ИУД': 'JUD', 'ИУДА': 'JUD',
  'ИУДЫ': 'JUD', 'JUDAS': 'JUD', 'JUDY': 'JUD', 'REV': 'REV', 'RE': 'REV', 'REVELATION': 'REV', 'ОБ': 'REV', 'ОБЯВЛЕННЯ': 'REV',
  'ЯВЛЕННЯ': 'REV', 'ОДКРОВЕННЯ': 'REV', 'ВІДКРИТТЯ': 'REV', 'ОТК': 'REV', 'ОТКРОВЕНИЕ': 'REV', 'APOC': 'REV', 'AP': 'REV', 'APOCALIPSIS': 'REV',
  'APOCALYPSE': 'REV', 'OFFB': 'REV', 'OFF': 'REV', 'OFFENBARUNG': 'REV', 'APOK': 'REV', 'APOKALIPSA': 'REV'
};

function cleanBookString(input: string): string {
  if (!input) return "";
  let str = input.trim().replace(/[\’\‘\`]/g, "'");
  str = str.replace(/\bперше\b/gi, "1")
           .replace(/\bдруге\b/gi, "2")
           .replace(/\bтретє\b/gi, "3")
           .replace(/\b1-е\b/gi, "1")
           .replace(/\b2-е\b/gi, "2")
           .replace(/\b3-є\b/gi, "3")
           .replace(/\bпервое\b/gi, "1")
           .replace(/\bвторое\b/gi, "2")
           .replace(/\bтретье\b/gi, "3")
           .replace(/\bfirst\b/gi, "1")
           .replace(/\bsecond\b/gi, "2")
           .replace(/\bthird\b/gi, "3");

  const PREFIX_REGEX = /^(євангеліє\s+від|від\s+|євангеліє|соборне\s+послання|послання\s+до|до\s+|послання|книга|gospel\s+of|epistle\s+to\s+the|epistle\s+of|book\s+of|евангелие\s+от|от\s+|послание\s+к|к\s+|послание|книга|księga\s+|ewangelia\s+wg\s+św\.\s*|ewangelia\s+wg\s+|list\s+do\s+|list\s+św\.\s*|evangelium\s+nach\s+|évangile\s+de\s+|épître\s+de\s+|épître\s+aux\s+)\s+/i;

  let prev = "";
  while (prev !== str) {
    prev = str;
    str = str.replace(PREFIX_REGEX, "");
  }
  return str.replace(/\./g, "").replace(/\s+/g, " ").trim();
}

/**
 * Normalize Unicode diacritics → ASCII equivalents.
 * Covers German (ö→o, ü→u, ä→a), French (é→e, è→e), Spanish (ñ→n),
 * Polish (ł→l), Czech/Slovak (š→s, ž→z), Portuguese (ã→a, ç→c) etc.
 */
function normalizeDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ø/g, 'O').replace(/ø/g, 'o')
    .replace(/Ł/g, 'L').replace(/ł/g, 'l')
    .replace(/Đ/g, 'D').replace(/đ/g, 'd')
    .replace(/Æ/g, 'AE').replace(/æ/g, 'ae')
    .replace(/Œ/g, 'OE').replace(/œ/g, 'oe')
    .replace(/ß/g, 'ss');
}

/** Levenshtein distance (capped at maxDist for performance). */
function levenshtein(a: string, b: string, maxDist = 4): number {
  if (Math.abs(a.length - b.length) > maxDist) return maxDist + 1;
  const m = a.length, n = b.length;
  const prev = Array.from({ length: n + 1 }, (_, j) => j);
  const curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
    }
    prev.splice(0, prev.length, ...curr);
  }
  return prev[n];
}

/**
 * 🧠 Smart Cyrillic/Latin Roman-numeral ordinal preprocessor.
 * Safely converts "І Кор" -> "1 Кор", "ІІ Кор" -> "2 Кор", "ІІІ Ів" -> "3 Ів",
 * without corrupting proper names starting with Cyrillic І (Івана, Ісаї, Ісус, Іуди, Ів).
 */
function preprocessCyrillicOrdinal(s: string): string {
  return s
    .replace(/^ІІІ\s*/ui, '3 ')
    .replace(/^ІІ\s*/ui, '2 ')
    .replace(/^III\s*/i, '3 ')
    .replace(/^II\s*/i, '2 ')
    .replace(/^IV\s*/i, '4 ')
    .replace(/^ІV\s*/ui, '4 ')
    .replace(/^(?:І|I)\s+(?=[\p{L}\p{M}])/ui, '1 ')
    .replace(/^(?:І|I)(?=КОР|COR|ПЕТ|PET|ТИМ|TIM|САМ|SAM|ЦАР|KINGS|KGS|ХР|CHRON|CHR|МАК|MACC|SOL|THESS|TH|ФЕС|САЛ|ПАР|PAR|ЕЗД|ESD|CO|PE|TI|SM|SG|KI|CH)/ui, '1');
}

const SORTED_BOOK_ALIAS_KEYS = Object.keys(BOOK_ALIASES).sort((a, b) => b.length - a.length);

/**
 * Universal multilingual book name → OSIS code resolver.
 */
function normalizeBookCode(b: string): string {
  if (!b) return 'GEN';
  const cleaned = cleanBookString(b).toUpperCase();
  const preprocessed = preprocessCyrillicOrdinal(cleaned);
  const norm = normalizeDiacritics(preprocessed).toUpperCase();

  // Step 3: exact lookup
  if (BOOK_ALIASES[preprocessed]) return BOOK_ALIASES[preprocessed];
  const noSp = preprocessed.replace(/[\s'-]/g, '');
  if (BOOK_ALIASES[noSp]) return BOOK_ALIASES[noSp];
  const noSpNorm = norm.replace(/[\s'-]/g, '');
  if (BOOK_ALIASES[noSpNorm]) return BOOK_ALIASES[noSpNorm];

  // Step 4: prefix match (≥3 chars) matching longest keys first
  for (const key of SORTED_BOOK_ALIAS_KEYS) {
    if (key.length >= 3 && (noSp === key || noSpNorm === key || noSp.startsWith(key) || noSpNorm.startsWith(key))) {
      return BOOK_ALIASES[key];
    }
  }

  // Step 5: Levenshtein fuzzy match (only for inputs >= 5 chars to prevent false positive short code matches)
  if (noSpNorm.length >= 5) {
    let bestVal = preprocessed;
    let bestDist = 3;
    for (const key of SORTED_BOOK_ALIAS_KEYS) {
      if (key.length < 4) continue;
      const dist = levenshtein(noSpNorm, key, bestDist);
      if (dist < bestDist) { bestDist = dist; bestVal = BOOK_ALIASES[key]; }
    }
    if (bestDist < 3) return bestVal;
  }
  return preprocessed;
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');
    const lang = searchParams.get('lang') || 'ukr';
    
    if (!ref) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }

    const rawClean = ref.trim().replace(/[:;.,)\s]+$/g, '');

    // 🛡️ Search for real Scripture pattern inside raw query if model included text/paraphrases
    const parts = rawClean.split('|');
    let rawQuery = parts[0].trim();
    let rawDisplay = parts[1] ? parts[1].trim() : '';

    // 🧠 Smart Book Misalignment Guard:
    // If a small model outputted an OSIS code in query (e.g. 1SA 10:5) that conflicts with the display title (e.g. Псалом 10:5),
    // prefer the display title to resolve the canonical book, because the display title reflects the actual intended passage in prose.
    let cleanRef = rawQuery;
    if (rawDisplay && /\d+/.test(rawDisplay)) {
      const displayBookMatch = rawDisplay.match(/^(.+?)\s+\d+/);
      const queryBookMatch = rawQuery.match(/^(.+?)\s+\d+/);
      if (displayBookMatch && queryBookMatch) {
        const bDisplay = normalizeBookCode(displayBookMatch[1]);
        const bQuery = normalizeBookCode(queryBookMatch[1]);
        if (bDisplay && bQuery && bDisplay !== bQuery) {
          cleanRef = rawDisplay; // Prefer display title book reference!
        }
      }
    }

    cleanRef = cleanRef.replace(/\s*\|\s*lang\s*=\s*[a-z0-9]+/gi, '');
    cleanRef = cleanRef.replace(/lang=/gi, '');
    cleanRef = cleanRef.replace(/[–—]/g, '-');
    cleanRef = cleanRef.replace(/;/g, ':');
    cleanRef = cleanRef.replace(/RМ/gi, 'RM');
    cleanRef = cleanRef.replace(/^([1-3]?[A-Za-zА-Яа-яЄєІіЇїҐґ\']+)(\d+.*)$/, '$1 $2');
    cleanRef = cleanRef
      .replace(/\b(?:глава|главы|главе|гл)\b/gi, '')
      .replace(/\bиоанновая\b/gi, 'Івана')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const embeddedRefMatch = cleanRef.match(/(?:[1-3]\s*)?[A-Za-zА-Яа-яЄєІіЇїҐґ\s']+\s+\d+\s*[:.,;\s]\s*\d+(?:\s*[-–—]\s*\d+)?/i);
    if (embeddedRefMatch) {
      cleanRef = embeddedRefMatch[0];
    }
    cleanRef = cleanBookString(cleanRef).replace(/[:;.,)\s]+$/g, '');

    // 🛡️ Guard against meta LLM strings (e.g. "Bullet 1: 42", "Step 2: 15", "Draft 1: 10")
    if (/^(bullet|section|intro|draft|total|reviewing|word|count|check|constraint|question|option|step|item|part)/i.test(cleanRef.trim())) {
      return NextResponse.json({ error: 'Meta text is not a scripture reference' }, { status: 400 });
    }

    // Matches book, chapter, and verse expression (e.g. "1 Коринфянам 13:4,7", "Псалом 103:8-12", "Юди 3")
    let match = cleanRef.match(/^(.+?)\s+(\d+)\s*[:.,;\s]\s*(.+)$/);
    let rawBook = '';
    let chapter = 1;
    let verseExpr = '';

    if (match) {
      rawBook = match[1];
      chapter = parseInt(match[2], 10);
      verseExpr = match[3];
    } else {
      // Check for single-chapter verse-only reference (e.g. "Юди 3", "2 Івана 5", "JUDE 3")
      const singleChapterMatch = cleanRef.match(/^(.+?)\s+(\d+(?:\s*[-–—]\s*\d+)?)$/);
      if (singleChapterMatch) {
        rawBook = singleChapterMatch[1];
        chapter = 1;
        verseExpr = singleChapterMatch[2];
      } else {
        return NextResponse.json({ error: 'Invalid reference format' }, { status: 400 });
      }
    }

    let engBook = normalizeBookCode(rawBook);
    if (!engBook || engBook.length < 2) {
      return NextResponse.json({ error: 'Book not recognized' }, { status: 404 });
    }

    // 🧠 Smart Jonah vs John Disambiguation Guard:
    // Jonah only has 4 chapters. If a small LLM outputted "JON 15:13" or "ЙОН 15:13",
    // it intended Gospel of John (JHN 15:13). Automatically redirect JON -> JHN when chapter > 4.
    if (engBook === 'JON' && chapter > 4) {
      engBook = 'JHN';
    }

    // 🧠 Smart Jude vs Judges Disambiguation Guard:
    // Jude only has 1 chapter. If a small LLM outputted "JUD 6:12", it intended Judges (JDG 6:12).
    if (engBook === 'JUD' && chapter > 1) {
      engBook = 'JDG';
    }

    // 🧠 Single-chapter books auto-correction: if book is single-chapter (OBA, PHM, 2JN, 3JN, JUD)
    // and user/LLM requested chapter > 1 with no colon (e.g., "JUDE 3" parsed as chapter 3),
    // automatically treat the number as verse index for chapter 1.
    const SINGLE_CHAPTER_BOOKS = new Set(['OBA', 'PHM', '2JN', '3JN', 'JUD']);
    if (SINGLE_CHAPTER_BOOKS.has(engBook) && chapter > 1 && !match) {
      verseExpr = String(chapter);
      chapter = 1;
    }


    // Parse complex verse ranges and lists: "4,7", "8-12", "4-7, 10-12", "4, 7-9"
    const verseNumbers: number[] = [];
    const verseSegments = verseExpr.split(/[,;]/);

    for (const segment of verseSegments) {
      const rangeMatch = segment.trim().match(/^(\d+)(?:\s*[-–—]\s*(\d+))?$/);
      if (rangeMatch) {
        const vStart = parseInt(rangeMatch[1], 10);
        const vEnd = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : vStart;
        for (let v = vStart; v <= vEnd; v++) {
          if (!verseNumbers.includes(v)) verseNumbers.push(v);
        }
      }
    }

    if (verseNumbers.length === 0) {
      return NextResponse.json({ error: 'Invalid verse selection' }, { status: 400 });
    }

    // 0. Primary Zero-Latency Route: Direct SQLite Database lookup
    try {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const possibleDbPaths = [
        ...(process.env.BIBLE_DB_PATH ? [path.resolve(process.env.BIBLE_DB_PATH)] : []),
        path.resolve(process.cwd(), '../data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), 'data/processed/bible_database.sqlite'),
        path.resolve(process.cwd(), '../../data/processed/bible_database.sqlite'),
        path.join(os.homedir(), '.bible-mcp', 'bible_database.sqlite')
      ];

      const dbPath = possibleDbPaths.find(p => fs.existsSync(p) && fs.statSync(p).size > 1000000);

      if (dbPath) {
        const Database = (await import('better-sqlite3')).default || await import('better-sqlite3');
        const db = new (Database as any)(dbPath, { readonly: true });

        const possibleBooks = Array.from(new Set([
          engBook,
          engBook.slice(0, 3),
          engBook.slice(0, 4),
          engBook === 'JOHN' || engBook === 'JN' ? 'JHN' : engBook,
          engBook === 'JHN' ? 'JN' : engBook,
          engBook === 'MATT' || engBook === 'MT' ? 'MAT' : engBook,
          engBook === 'MARK' || engBook === 'MK' ? 'MRK' : engBook,
          engBook === 'LUKE' || engBook === 'LK' ? 'LUK' : engBook,
          engBook === 'PHIL' ? 'PHP' : engBook,
          engBook === '1TIM' ? '1TI' : engBook,
          engBook === '2TIM' ? '2TI' : engBook,
          engBook === '1COR' ? '1CO' : engBook,
          engBook === '2COR' ? '2CO' : engBook,
          engBook === '1THESS' ? '1TH' : engBook,
          engBook === '2THESS' ? '2TH' : engBook,
          engBook === '1PET' ? '1PE' : engBook,
          engBook === '2PET' ? '2PE' : engBook,
          engBook === '1JOHN' ? '1JN' : engBook,
          engBook === '2JOHN' ? '2JN' : engBook,
          engBook === '3JOHN' ? '3JN' : engBook
        ])).map(b => b.toUpperCase());

        const bookPlaceholders = possibleBooks.map(() => '?').join(',');

        const directTexts: string[] = [];
        for (const v of verseNumbers) {
          let row = db.prepare(`SELECT text FROM verses WHERE UPPER(book) IN (${bookPlaceholders}) AND chapter = ? AND verse = ? AND language = ? LIMIT 1`).get(...possibleBooks, chapter, v, lang) as {text: string} | undefined;
          if (!row) {
            row = db.prepare(`SELECT text FROM verses WHERE UPPER(book) IN (${bookPlaceholders}) AND chapter = ? AND verse = ? LIMIT 1`).get(...possibleBooks, chapter, v) as {text: string} | undefined;
          }
          if (row && row.text) {
            directTexts.push(row.text.trim());
          }
        }
        db.close();

        if (directTexts.length > 0) {
          console.log(`📖 [DIRECT SQLITE VERSE] Ref: "${ref}" (${engBook} ${chapter}:${verseExpr}) -> extracted ${directTexts.length} verses in 1ms`);
          return NextResponse.json({ text: directTexts.join(' ') });
        }
      }
    } catch (e) {
      console.warn('[VERSE API] Direct SQLite lookup error, falling back to MCP:', e);
    }

    // 1. Secondary: Universal MCP Manager route directly calling holy-bible-mcp tool `get_verse`
    try {
      const { mcpManager } = await import('@/lib/mcp/mcp-manager');
      console.log(`🔍 [MCP VERSE FETCH] Ref: "${ref}" (lang: ${lang}) -> Querying holy-bible-mcp...`);
      const directMcpText = await mcpManager.fetchVerseTextViaMcp(`${engBook} ${chapter}:${verseExpr}`, lang);
      if (directMcpText) {
        console.log(`📖 [MCP VERSE EXTRACTED] Ref: "${ref}" -> "${directMcpText.slice(0, 75)}..." (${directMcpText.length} chars)`);
        return NextResponse.json({ text: directMcpText });
      }
    } catch (e) {}

    // 2. Secondary: Parallel BibleMcpClient fallback
    try {
      const mcpClient = await getMcpClient();

      // ⚡ Parallel MCP Verse Fetcher: Fetch all verses in range concurrently with Promise.all
      const fetchedResults = await Promise.all(
        verseNumbers.map(async (v) => {
          try {
            let verseRes: any = await mcpClient.callTool("get_verse", {
              book: engBook,
              chapter,
              verse: v,
              language: lang
            });

            let text = extractVerseText(verseRes);
            if (!text) {
              verseRes = await mcpClient.callTool("get_verse", {
                book: engBook,
                chapter,
                verse: v,
                language: ""
              });
              text = extractVerseText(verseRes);
            }
            return text;
          } catch (e) {
            console.warn(`[VERSE API] MCP Client callTool failed for verse ${v}:`, e);
            return null;
          }
        })
      );

      const verseTexts = fetchedResults.filter((t): t is string => Boolean(t));

      if (verseTexts.length > 0) {
        return NextResponse.json({ text: verseTexts.join(' ') });
      }
    } catch (e) {
      console.warn('[VERSE API] MCP Client initialization failed:', e);
    }

    return NextResponse.json({ error: 'Verse not found' }, { status: 404 });
  } catch (error) {
    console.error("Verse API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
