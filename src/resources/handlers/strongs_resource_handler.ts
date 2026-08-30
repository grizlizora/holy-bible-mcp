import { StrongsEtymologyService } from "../../morphology/strongs_etymology_service.js";
import { ParsedBibleUri } from "../resource_uri_parser.js";

export class StrongsResourceHandler {
  public static async handle(uri: string, parsed: ParsedBibleUri) {
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

