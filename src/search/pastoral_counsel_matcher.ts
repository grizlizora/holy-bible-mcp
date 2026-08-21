export class PastoralCounselMatcher {
  public static matchEmotion(situationDescription: string, emotion = "auto"): string {
    if (emotion !== "auto") return emotion;
    const lower = situationDescription.toLowerCase();

    if (lower.includes("страх") || lower.includes("тривог") || lower.includes("боюсь") || lower.includes("fear") || lower.includes("anxiety")) {
      return "anxiety_fear";
    } else if (lower.includes("сум") || lower.includes("втрат") || lower.includes("депрес") || lower.includes("grief") || lower.includes("sadness")) {
      return "grief_sorrow";
    } else if (lower.includes("самотн") || lower.includes("один") || lower.includes("lonely") || lower.includes("alone")) {
      return "loneliness";
    } else if (lower.includes("гнів") || lower.includes("образ") || lower.includes("пробач") || lower.includes("anger") || lower.includes("forgive")) {
      return "anger_forgiveness";
    }
    return "anxiety";
  }

  public static generatePastoralText(detectedEmotion: string, language = "ukr"): string {
    const isUkr = language === "ukr" || language === "uk";
    return isUkr
      ? "У часи " + (detectedEmotion === "anxiety_fear" ? "тривоги та невизначеності" : "духовних випробувань") + " Господь закликає нас спиратися на Його вірність: «Не бійся, бо Я з тобою!» (Ісая 41:10). Покладіть свій тягар на Христа у молитві з вірою."
      : "In moments of " + detectedEmotion + ", scripture anchors our soul in God's sovereign care: \"Cast your cares on the Lord and He will sustain you\" (Psalm 55:22).";
  }
}
