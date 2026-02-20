/**
 * Betting Intelligence Data Models
 * Targets: Node.js (CommonJS)
 */

const MarketType = {
    MONEYLINE: 'moneyline',
    SPREAD: 'spread',
    TOTAL: 'total'
};

/**
 * @typedef {Object} BetMarket
 * @property {string} platform - e.g., 'FanDuel', 'DraftKings'
 * @property {number} odds - Normalized Decimal Odds (e.g. 1.91)
 * @property {number} impliedProb - Implied Probability (0.0 to 1.0)
 * @property {string} lastUpdated - ISO Timestamp
 */

/**
 * @typedef {Object} BettingEvent
 * @property {string} id - Unique Event ID
 * @property {string} sport - e.g., 'NFL', 'NBA'
 * @property {string} homeTeam - Normalized name
 * @property {string} awayTeam - Normalized name
 * @property {Object.<string, BetMarket[]>} markets - Keyed by MarketType
 */

module.exports = {
    MarketType
};
