
import publicRules from './rules/publicRules.json';
import domainRules from './rules/domainRules.json';

export const PDAE_STATUS = {
    VALID: "valid",
    IMPOSSIBLE: "impossible",
    IMPLAUSIBLE: "implausible",
    RARE: "rare"
};

/**
 * Public Data Alignment Engine
 * This engine NEVER corrects values.
 * It only flags, explains, and suggests.
 */
export function runPDAE({
    row,
    column,
    value,
    domain = null,
    sourceTrust = "medium"
}) {
    const issues = [];
    const normalizedCol = column.toLowerCase().trim();

    // ---------------------------
    // 1. AGE VALIDATION
    // ---------------------------
    if (normalizedCol === "age" && typeof value === "number") {
        const ageRules = publicRules.age;

        if (value < ageRules.min || value > ageRules.max) {
            issues.push(buildIssue({
                status: PDAE_STATUS.IMPOSSIBLE,
                reason: "Age violates basic human age constraints",
                confidence: 0.95
            }));
        } else {
            // Check for implausible ranges
            for (const range of ageRules.implausibleRanges) {
                if (value >= range.min && value <= range.max) {
                    issues.push(buildIssue({
                        status: PDAE_STATUS.IMPLAUSIBLE,
                        reason: "Age is statistically uncommon in public population patterns",
                        confidence: range.confidence
                    }));
                }
            }
        }
    }

    // ---------------------------------
    // 2. OCCUPATION ↔ AGE PLAUSIBILITY
    // ---------------------------------
    if (row.occupation && normalizedCol === "age") {
        const rule = publicRules.occupationAgeRules.find(
            r => r.occupation.toLowerCase() === row.occupation.toString().toLowerCase()
        );

        if (rule) {
            if (rule.minAge && value < rule.minAge) {
                issues.push(buildIssue({
                    status: PDAE_STATUS.IMPLAUSIBLE,
                    reason: `Age does not align with typical age for occupation "${row.occupation}"`,
                    confidence: 0.85
                }));
            }
            if (rule.maxAge && value > rule.maxAge) {
                issues.push(buildIssue({
                    status: PDAE_STATUS.IMPLAUSIBLE,
                    reason: `Age is unusually high for typical "${row.occupation}"`,
                    confidence: 0.80
                }));
            }
        }
    }

    // ---------------------------
    // 3. DOMAIN HARD RULES
    // ---------------------------
    if (domain && domainRules[domain]) {
        // Find matching key in domain rules (e.g. "systolic_bp" matches "systolic")
        const domainRuleKey = Object.keys(domainRules[domain]).find(k => normalizedCol.includes(k));

        if (domainRuleKey) {
            const rule = domainRules[domain][domainRuleKey];
            if (value < rule.min || value > rule.max) {
                issues.push(buildIssue({
                    status: PDAE_STATUS.IMPOSSIBLE,
                    reason: `Violates ${domain} domain constraints for ${domainRuleKey}`,
                    confidence: 0.9
                }));
            }
        }
    }

    // ---------------------------
    // 4. SOURCE TRUST ADJUSTMENT
    // ---------------------------
    issues.forEach(issue => {
        if (sourceTrust === "low") issue.confidence += 0.05;
        if (sourceTrust === "high") issue.confidence -= 0.05;
    });

    return issues.map(issue => ({
        ...issue,
        suggestedActions: buildSuggestions(issue.status)
    }));
}

// ---------------------------
// HELPERS
// ---------------------------
function buildIssue({ status, reason, confidence }) {
    return {
        status,
        reason,
        confidence: Math.min(Math.max(confidence, 0), 1),
        label: "AI Validation Insight"
    };
}

function buildSuggestions(status) {
    switch (status) {
        case PDAE_STATUS.IMPOSSIBLE:
            return [
                "Mark value as missing",
                "Exclude from analysis"
            ];
        case PDAE_STATUS.IMPLAUSIBLE:
            return [
                "Review manually",
                "Replace using dataset median",
                "Exclude from analysis"
            ];
        default:
            return [];
    }
}

/**
 * Generates a full report for the dataset
 */
export const generatePDAEReport = (data, columns, domain = 'general') => {
    const report = {
        totalRecords: data.length,
        flaggedCount: 0,
        flags: []
    };

    data.forEach((row, rowIndex) => {
        columns.forEach(col => {
            const val = row[col];
            // Simple numeric conversion for validation
            const numVal = parseFloat(val);
            const valueToCheck = isNaN(numVal) ? val : numVal;

            if (valueToCheck === null || valueToCheck === undefined || valueToCheck === '') return;

            // Run core engine
            const pdaeResults = runPDAE({
                row,
                column: col,
                value: valueToCheck,
                domain: domain,
                sourceTrust: "medium"
            });

            if (pdaeResults.length > 0) {
                // Push each issue found
                pdaeResults.forEach(result => {
                    report.flaggedCount++;
                    report.flags.push({
                        row: rowIndex,
                        column: col,
                        value: val,
                        ...result
                    });
                });
            }
        });
    });

    const errorRate = report.flaggedCount / (data.length * columns.length);
    report.trustScore = Math.max(0, Math.round(100 - (errorRate * 500)));

    return report;
};
