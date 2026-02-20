const assert = require('assert');
const { parseHand } = require('./logic.parser');

function runTests() {
    console.log("Running Mahjong Parser Tests...");
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (error) {
            console.error(`❌ FAIL: ${name}`);
            console.error(error);
            failed++;
        }
    }

    test('parseHand: returns empty array for invalid 14 tiles hand', () => {
        const hand = ['m1', 'm2', 'm4', 'm5', 'm7', 'm8', 'p1', 'p2', 'p4', 'p5', 's1', 's2', 'z1', 'z2'];
        const results = parseHand(hand);
        assert.strictEqual(results.length, 0);
    });

    test('parseHand: correctly parses Seven Pairs (Chiitoitsu)', () => {
        const hand = ['m1', 'm1', 'm2', 'm2', 'm3', 'm3', 'p4', 'p4', 'p5', 'p5', 's6', 's6', 'z1', 'z1'];
        const results = parseHand(hand);
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].length, 7);
        assert.strictEqual(results[0].every(meld => meld.type === 'toitsu'), true);
    });

    test('parseHand: correctly parses a standard winning hand (4 melds, 1 pair)', () => {
        const hand = ['m1', 'm2', 'm3', 'p4', 'p5', 'p6', 's7', 's8', 's9', 's1', 's2', 's3', 'z1', 'z1'];
        const results = parseHand(hand);
        assert.strictEqual(results.length > 0, true, 'Should find at least one valid combination');

        // Find the expected combination
        const expectedCombo = results.find(combo =>
            combo.length === 5 &&
            combo.filter(m => m.type === 'shuntsu').length === 4 &&
            combo.filter(m => m.type === 'toitsu').length === 1
        );
        assert.notStrictEqual(expectedCombo, undefined, 'Should have 4 shuntsu and 1 toitsu');
    });

    test('parseHand: handles hands with multiple interpretations (e.g. 222333444)', () => {
        // This hand can be interpreted as 3 Koutsu (222, 333, 444) + Toitsu + Shuntsu
        // Or 3 Shuntsu (234, 234, 234) + Toitsu + Koutsu
        const hand = ['m2', 'm2', 'm2', 'm3', 'm3', 'm3', 'm4', 'm4', 'm4', 'p5', 'p5', 'p5', 'z1', 'z1'];
        const results = parseHand(hand);

        // It must find at least one valid combination
        assert.strictEqual(results.length > 0, true);

        // Can we find the Koutsu interpretation?
        const hasKoutsuInterp = results.some(combo =>
            combo.filter(m => m.type === 'koutsu').length >= 3 // (222, 333, 444, 555)
        );

        // Can we find the Shuntsu interpretation?
        const hasShuntsuInterp = results.some(combo =>
            combo.filter(m => m.type === 'shuntsu').length >= 3 // (234, 234, 234)
        );

        assert.strictEqual(hasKoutsuInterp, true, 'Should find Koutsu interpretation');
        assert.strictEqual(hasShuntsuInterp, true, 'Should find Shuntsu interpretation');
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();
