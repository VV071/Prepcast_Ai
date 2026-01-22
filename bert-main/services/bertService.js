import * as tf from "@tensorflow/tfjs";
import * as use from "@tensorflow-models/universal-sentence-encoder";
import { domainPatterns, cosineSimilarity, tokenize } from './sharedUtils';

/* =====================================================
   BERT MODEL LOADER
===================================================== */

let bertModel = null;

export async function loadBERT() {
    if (!bertModel) {
        try {
            console.log("Loading BERT model...");
            bertModel = await use.load();
            console.log("BERT model loaded successfully");
        } catch (error) {
            console.error("Error loading BERT model:", error);
            throw error;
        }
    }
    return bertModel;
}

/* =====================================================
   DOMAIN DETECTION
===================================================== */

export async function detectDomainBERT(columns, rawData) {
    try {
        const model = await loadBERT();

        // Prepare text from columns and sample data (limit sample to avoid huge processing)
        const sampleLimit = rawData.slice(0, 5);
        const text =
            columns.join(" ") +
            " " +
            sampleLimit.map((r) => Object.values(r).join(" ")).join(" ");

        const patterns = JSON.parse(JSON.stringify(domainPatterns));
        Object.values(patterns).forEach((p) => (p.confidence = 0));

        const inputEmb = await model.embed([text]);
        const inputVec = (await inputEmb.array())[0];

        for (const [d, p] of Object.entries(patterns)) {
            if (d === "general") continue;
            const desc =
                p.description +
                " " +
                p.keywords.join(" ") +
                " " +
                p.semanticTerms.join(" ");
            const emb = await model.embed([desc]);
            p.confidence += cosineSimilarity(inputVec, (await emb.array())[0]) * 15;
        }

        const tokens = tokenize(text);
        for (const [d, p] of Object.entries(patterns)) {
            if (d === "general") continue;

            if (p.keywords) {
                p.keywords.forEach(
                    (k) => (p.confidence += tokens.filter((t) => t === k).length * 2)
                );
            }

            if (p.contextPatterns) {
                p.contextPatterns.forEach(
                    (r) => (p.confidence += (text.match(new RegExp(r, "gi")) || []).length)
                );
            }
        }

        const bestMatch = Object.entries(patterns).reduce(
            (a, b) => (b[1].confidence > a[1].confidence ? b : a),
            ["general", patterns.general]
        );

        console.log("BERT Domain Detection Results:", {
            bestMatch: bestMatch[0],
            confidence: bestMatch[1].confidence,
            allScores: Object.fromEntries(Object.entries(patterns).map(([k, v]) => [k, v.confidence]))
        });

        // Determine if confidence is sufficient for "general" fallback logic if implied
        // The snippet returns the best match key.
        return bestMatch[0]; // Returns domain string e.g. "healthcare"
    } catch (err) {
        console.error("BERT detection failed", err);
        return null; // Signal failure to fallback
    }
}
