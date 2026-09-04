/**
 * 🔗 ThematicChainTracer (thematic_chain_tracer.ts)
 *
 * Traces progressive revelation covenant chains across Old and New Testaments.
 */
import { DirectiveStore } from "../directives/directive_store.js";
import { formatBiblicalDisplayTitle } from "../osis_engine.js";
export class ThematicChainTracer {
    static traceChain(theme = "living_water", startingVerse = "GEN.3.15") {
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
        let chain = (rawChain || []).map((node, idx) => ({
            step: node.step || node.step_number || idx + 1,
            osis: node.ref || node.osis || "",
            displayTitle: formatBiblicalDisplayTitle(node.ref || node.osis || "", 'ukr'),
            epoch: node.covenantStage || node.covenant_epoch || 'Біблійний етап',
            textSnippet: node.textSnippet || node.text || node.verse_text || `Вірш ${node.ref || node.osis}`,
            theologicalLink: node.significance || node.theological_link || 'Прогресивне богословське розкриття теми'
        }));
        if (startingVerse && chain.length > 0) {
            const normStart = startingVerse.trim().toUpperCase();
            const startIndex = chain.findIndex(n => n.osis.toUpperCase() === normStart);
            if (startIndex > 0) {
                chain = chain.slice(startIndex);
            }
        }
        return chain;
    }
}
