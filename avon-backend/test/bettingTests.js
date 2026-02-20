const { BettingEngine } = require('../lib/betting/engine');

function runTests() {
    console.log("🧪 Running Betting Engine Unit Tests...");

    try {
        // Test 1: American to Decimal (+150)
        const dec1 = BettingEngine.americanToDecimal(150);
        if (dec1 !== 2.5) throw new Error(`Test 1 Failed: Expected 2.5, got ${dec1}`);

        // Test 2: American to Decimal (-110)
        const dec2 = BettingEngine.americanToDecimal(-110);
        if (Math.abs(dec2 - 1.909) > 0.01) throw new Error(`Test 2 Failed: Expected ~1.91, got ${dec2}`);

        // Test 3: Implied Probability
        const prob = BettingEngine.calculateImpliedProbability(2.0);
        if (prob !== 0.5) throw new Error(`Test 3 Failed: Expected 0.5, got ${prob}`);

        // Test 4: Edge Calculation
        const edge = BettingEngine.calculateEdge(2.0, 0.6);
        if (Math.abs(edge - 0.2) > 0.001) throw new Error(`Test 4 Failed: Expected 0.2 edge, got ${edge}`);

        console.log("✅ All Betting Math Tests Passed.");
    } catch (err) {
        console.error(`❌ Unit test failed: ${err.message}`);
        process.exit(1);
    }
}

runTests();
