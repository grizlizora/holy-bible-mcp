import { StrongsEtymologyService } from "../../morphology/strongs_etymology_service.js";
export class StrongsResourceHandler {
    static async handle(uri, parsed) {
        const { strongsId = "G26" } = parsed;
        const normalizedId = strongsId.toUpperCase();
        const etymology = await StrongsEtymologyService.getEtymology(normalizedId);
        return {
            contents: [
                {
                    uri,
                    mimeType: "application/json",
                    text: JSON.stringify(etymology, null, 2)
                }
            ]
        };
    }
}
