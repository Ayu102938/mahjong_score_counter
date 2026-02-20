const assert = require('assert');
const { calculateHan, calculateFu, calculateScore } = require('./logic');

function runTests() {
    console.log("Running Mahjong Logic Tests...");
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        } catch (error) {
            console.error(`❌ FAIL: ${name}`);
            console.error(`   Expected: ${error.expected}`);
            console.error(`   Actual:   ${error.actual}`);
            failed++;
        }
    }

    // --- calculateHan Tests ---
    test('calculateHan: simple sum of Yaku (no naki)', () => {
        const selectedYaku = [
            { name: 'リーチ', han: 1, isMenzenOnly: true, kuisaGari: false },
            { name: 'ツモ', han: 1, isMenzenOnly: true, kuisaGari: false }
        ];
        assert.strictEqual(calculateHan(selectedYaku, false, 0), 2);
    });

    test('calculateHan: ignores MenzenOnly Yaku when isNaki = true', () => {
        const selectedYaku = [
            { name: 'リーチ', han: 1, isMenzenOnly: true, kuisaGari: false }, // should be ignored
            { name: '役牌', han: 1, isMenzenOnly: false, kuisaGari: false }
        ];
        assert.strictEqual(calculateHan(selectedYaku, true, 0), 1);
    });

    test('calculateHan: applies kuisaGari (-1 Han) when isNaki = true', () => {
        const selectedYaku = [
            { name: '三色同順', han: 2, isMenzenOnly: false, kuisaGari: true }, // 2 -> 1
            { name: '役牌', han: 1, isMenzenOnly: false, kuisaGari: false } // 1
        ];
        assert.strictEqual(calculateHan(selectedYaku, true, 0), 2);
        assert.strictEqual(calculateHan(selectedYaku, false, 0), 3); // 2 + 1
    });

    test('calculateHan: adds doraCount', () => {
        const selectedYaku = [
            { name: '平和', han: 1, isMenzenOnly: true, kuisaGari: false }
        ];
        assert.strictEqual(calculateHan(selectedYaku, false, 3), 4);
    });

    // --- calculateFu Tests ---
    test('calculateFu: Default base is 30 Fu', () => {
        const selectedYaku = [
            { name: 'リーチ', han: 1, isMenzenOnly: true, kuisaGari: false }
        ];
        assert.strictEqual(calculateFu(selectedYaku, false, false), 30);
    });

    test('calculateFu: Seven Pairs (七対子) is always 25 Fu', () => {
        const selectedYaku = [
            { name: '七対子', han: 2, isMenzenOnly: true, kuisaGari: false }
        ];
        assert.strictEqual(calculateFu(selectedYaku, false, false), 25);
        assert.strictEqual(calculateFu(selectedYaku, false, true), 25);
    });

    test('calculateFu: Pinfu (平和) Tsumo without Naki is 20 Fu', () => {
        const selectedYaku = [
            { name: '平和', han: 1, isMenzenOnly: true, kuisaGari: false }
        ];
        assert.strictEqual(calculateFu(selectedYaku, false, true), 20); // Menzen, Tsumo -> 20
        assert.strictEqual(calculateFu(selectedYaku, false, false), 30); // Menzen, Ron -> 30
    });

    // --- calculateScore Tests ---
    // Child Ron/Tsumo basic cases
    test('calculateScore: Child Ron 1 Han 30 Fu -> 1000', () => {
        const result = calculateScore(false, false, 1, 30);
        assert.strictEqual(result.main, 1000, `Expected 1000 but got ${result.main}`);
        assert.strictEqual(result.additional, 0);
    });

    test('calculateScore: Child Tsumo 1 Han 30 Fu -> 300, 500', () => {
        const result = calculateScore(false, true, 1, 30);
        assert.strictEqual(result.main, 500, `Expected 500 but got ${result.main}`);
        assert.strictEqual(result.additional, 300, `Expected 300 but got ${result.additional}`);
    });

    test('calculateScore: Child Ron 4 Han 30 Fu -> 8000 (Mangan)', () => {
        const result = calculateScore(false, false, 4, 30);
        assert.strictEqual(result.main, 8000);
    });

    // Parent Ron/Tsumo basic cases
    test('calculateScore: Parent Ron 3 Han 30 Fu -> 5800', () => {
        const result = calculateScore(true, false, 3, 30);
        assert.strictEqual(result.main, 5800);
    });

    test('calculateScore: Parent Tsumo 3 Han 30 Fu -> 2000 all', () => {
        const result = calculateScore(true, true, 3, 30);
        assert.strictEqual(result.main, 2000);
        assert.strictEqual(result.additional, 0); // Oya tsumo only has one payout value (all paid the same)
    });

    // Fixed points cases
    test('calculateScore: Child Ron 5 Han (Mangan) -> 8000', () => {
        const result = calculateScore(false, false, 5, 20); // fu shouldn't matter
        assert.strictEqual(result.main, 8000);
    });

    test('calculateScore: Parent Tsumo 6 Han (Haneman) -> 6000 all', () => {
        const result = calculateScore(true, true, 6, 25);
        assert.strictEqual(result.main, 6000);
    });

    test('calculateScore: Parent Ron 8 Han (Baiman) -> 24000', () => {
        const result = calculateScore(true, false, 8, 30);
        assert.strictEqual(result.main, 24000);
    });

    test('calculateScore: Child Tsumo 12 Han (Sanbaiman) -> 6000, 12000', () => {
        const result = calculateScore(false, true, 12, 30);
        assert.strictEqual(result.main, 12000);
        assert.strictEqual(result.additional, 6000);
    });

    test('calculateScore: Child Ron 13+ Han (Yakuman) -> 32000', () => {
        const result = calculateScore(false, false, 13, 20);
        assert.strictEqual(result.main, 32000);
        assert.strictEqual(calculateScore(false, false, 20, 30).main, 32000);
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();
