/**
 * 🔗 ThematicChainTracer (thematic_chain_tracer.ts)
 * 
 * Traces progressive revelation covenant chains across Old and New Testaments.
 */

import { DirectiveStore } from "../directives/directive_store.js";
import { formatBiblicalDisplayTitle } from "../osis_engine.js";

export interface ThematicChainNode {
  step: number;
  osis: string;
  displayTitle: string;
  epoch: string;
  textSnippet: string;
  theologicalLink: string;
}

export class ThematicChainTracer {
  public static traceChain(theme = "living_water", startingVerse = "GEN.3.15"): ThematicChainNode[] {
    const rawChain = DirectiveStore.getInstance().getThematicChain(theme);

    if (!rawChain || rawChain.length === 0) {
      return [
        { step: 1, osis: "GEN.2.10", displayTitle: "Буття 2:10", epoch: "Едемський заповіт", textSnippet: "І річка виходила з Едему...", theologicalLink: "Початок джерела благодаті" },
        { step: 2, osis: "EXO.17.6", displayTitle: "Вихід 17:6", epoch: "Заповіт Мойсея", textSnippet: "І вдариш у скелю, і піде з неї вода...", theologicalLink: "Христос як розбита скеля" },
        { step: 3, osis: "JHN.4.14", displayTitle: "Івана 4:14", epoch: "Новий Заповіт", textSnippet: "Вода, що Я йому дам, стане в нім джерелом води, що тече в життя вічне.", theologicalLink: "Благодать Духа Святого" },
        { step: 4, osis: "JHN.7.38", displayTitle: "Івана 7:38", epoch: "Новий Заповіт", textSnippet: "Ріки живої води потечуть із утроби його.", theologicalLink: "Переповнення віруючого Святим Духом" },
        { step: 5, osis: "REV.22.1", displayTitle: "Об'явлення 22:1", epoch: "Вічне Царство", textSnippet: "І показав він мені чисту ріку живої води...", theologicalLink: "Остаточне звершення та вічне життя" }
      ];
    }

    return rawChain.map((node: any) => ({
      step: node.step,
      osis: node.ref,
      displayTitle: formatBiblicalDisplayTitle(node.ref, 'ukr'),
      epoch: node.covenantStage || 'Біблійний етап',
      textSnippet: `[Вірш ${node.ref}]`,
      theologicalLink: node.significance || 'Прогресивне богословське розкриття теми'
    }));
  }
}
