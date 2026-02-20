/**
 * Betting Edge Engine
 * Pure mathematical functions for odds normalization and probability analysis.
 * Target: Node.js (CommonJS)
 */

const BettingEngine = {
    /**
     * Converts American Odds (+150, -110) to Decimal (2.5, 1.91)
     * @param {number} american
     * @returns {number}
     */
    americanToDecimal(american) {
        if (american >= 100) {
            return (american / 100) + 1;
        } else if (american <= -100) {
            return (100 / Math.abs(american)) + 1;
        }
        return 1.0;
    },

    /**
     * Calculates implied probability from decimal odds.
     * @param {number} decimal
     * @returns {number}
     */
    calculateImpliedProbability(decimal) {
        if (decimal <= 1) return 0;
        return 1 / decimal;
    },

    /**
     * Detects the "Value" or "Edge"
     * @param {number} marketOdds - The best odds available from platforms
     * @param {number} modelProb - Our AI's estimated probability (0.0 - 1.0)
     * @returns {number} Percentage edge
     */
    calculateEdge(marketOdds, modelProb) {
        if (marketOdds <= 1 || modelProb <= 0) return 0;
        const expectedValue = marketOdds * modelProb;
        return expectedValue - 1;
    }
};

module.exports = { BettingEngine };
