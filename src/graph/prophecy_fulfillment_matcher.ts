/**
 * 📜 ProphecyFulfillmentMatcher (prophecy_fulfillment_matcher.ts)
 * 
 * Matches Messianic prophecies and their New Testament fulfillments
 * using verified SQLite directive records with theological significance ranking.
 */

import { DirectiveStore } from "../directives/directive_store.js";
import { formatBiblicalDisplayTitle } from "../osis_engine.js";

export interface ProphecyFulfillmentPair {
  topic: string;
  topicTitle: string;
  prophecy: {
    osis: string;
    displayTitle: string;
    text: string;
    epochBCE: string;
  };
  fulfillment: {
    osis: string;
    displayTitle: string;
    text: string;
    epochCE: string;
  };
  timeGapYears: number;
  theologicalSignificance: string;
}

export class ProphecyFulfillmentMatcher {
  public static findMatchForOsis(sourceOsis: string, lang = 'ukr') {
    const prophecies = DirectiveStore.getInstance().getMessianicProphecies();
    const matchedProphecy = prophecies.find(p => 
      (p.prophecy?.osis && p.prophecy.osis.includes(sourceOsis)) || 
      (p.fulfillment?.osis && p.fulfillment.osis.includes(sourceOsis)) ||
      (p.prophecy_ref && p.prophecy_ref.includes(sourceOsis)) ||
      (p.fulfillment_ref && p.fulfillment_ref.includes(sourceOsis))
    );

    if (!matchedProphecy) return null;

    const isProphecySource = (matchedProphecy.prophecy?.osis || matchedProphecy.prophecy_ref || '').includes(sourceOsis);
    const targetOsis = isProphecySource 
      ? (matchedProphecy.fulfillment?.osis || matchedProphecy.fulfillment_ref || 'LUK.2.1')
      : (matchedProphecy.prophecy?.osis || matchedProphecy.prophecy_ref || 'MIC.5.2');
    
    const targetDisplay = formatBiblicalDisplayTitle(targetOsis, lang);
    const text = isProphecySource 
      ? (matchedProphecy.fulfillment?.text || matchedProphecy.theological_focus || '')
      : (matchedProphecy.prophecy?.text || matchedProphecy.context_description || '');

    return {
      targetOsis,
      targetDisplayTitle: targetDisplay,
      targetText: text,
      category: 'messianic_prophecy' as const,
      categoryLabel: lang === 'ukr' ? '📜 Месіанське пророцтво' : '📜 Messianic Prophecy',
      compositeScore: 0.98,
      theologicalSignificance: matchedProphecy.theologicalSignificance || matchedProphecy.theological_focus
    };
  }
}
