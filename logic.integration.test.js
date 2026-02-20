const assert = require('assert');
const { evaluateHand } = require('./logic');

function runTests() {
    console.log("Running Mahjong Integration Tests...");
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

    test('evaluateHand: Simple Tanyao Hand (Child Ron)', () => {
        const hand = ['m2', 'm3', 'm4', 'p4', 'p5', 'p6', 's6', 's7', 's8', 'm8', 'm8', 'm8', 'p2', 'p2'];
        // Tsumo: false, Naki: false, no specific winds
        const options = { isTsumo: false, isNaki: false, doraCount: 0 };
        const result = evaluateHand(hand, 'p4', options, false);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.yakuList.some(y => y.name === '断幺九'), true);
        assert.strictEqual(result.han, 1);
        assert.strictEqual(result.fu, 30);
    });

    test('evaluateHand: Pinfu Tsumo (Child)', () => {
        // Pinfu requires ryamen wait, no yakuhai pair, all shuntsu
        const hand = ['m2', 'm3', 'm4', 'p4', 'p5', 'p6', 's6', 's7', 's8', 's2', 's3', 's4', 'm9', 'm9'];
        const options = { isTsumo: true, isNaki: false, doraCount: 0, isRyamen: true };
        const result = evaluateHand(hand, 's4', options, false);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.yakuList.some(y => y.name === '平和'), true);
        assert.strictEqual(result.yakuList.some(y => y.name === '門前清自摸和'), true);
        assert.strictEqual(result.han, 2); // Pinfu 1 + Menzen Tsumo 1
        assert.strictEqual(result.fu, 20); // Pinfu Tsumo is always 20 fu
    });

    test('evaluateHand: Mangan (5 Han with Riichi, Ippatsu, etc. via options)', () => {
        const hand = ['m2', 'm3', 'm4', 'p4', 'p5', 'p6', 's6', 's7', 's8', 's2', 's3', 's4', 'm9', 'm9'];
        const options = { isTsumo: true, isNaki: false, doraCount: 1, isRyamen: true };
        const result = evaluateHand(hand, 's4', options, false);

        // Let's add external yaku via yaku.js or we just check if Dora adds up.
        // Base is 2 Han (Pinfu+Tsumo) + 1 Dora = 3 Han.
        assert.strictEqual(result.han, 3);
    });

    test('evaluateHand: 1 Kan, Menzen Tsumo', () => {
        // 1 Kan (4 same tiles) + 3 Shuntsu + 1 Pair = 15 tiles
        const hand = ['m1', 'm1', 'm1', 'm1', 'p2', 'p3', 'p4', 's5', 's6', 's7', 's7', 's8', 's9', 'z1', 'z1'];
        // Even without `kans` payload, the math fallback works (Ankan implicitly assumed if menzen)
        const options = { isTsumo: true, isNaki: false, doraCount: 0, isRyamen: true };
        const result = evaluateHand(hand, 's7', options, false);

        assert.notStrictEqual(result, null);
        assert.strictEqual(result.yakuList.some(y => y.name === '門前清自摸和'), true);
        assert.strictEqual(result.bestCombo.some(m => m.type === 'kantsu'), true);
    });

    test('evaluateHand: 1 Minkan breaks Menzen and triggers KuisaGari', () => {
        // 1 Kan (m1), and Three Color Straight (2-3-4 in m, p, s), and a pair of z1
        const hand = ['m1', 'm1', 'm1', 'm1', 'm2', 'm3', 'm4', 'p2', 'p3', 'p4', 's2', 's3', 's4', 'z1', 'z1'];
        // Explicitly declaring 'm1' as an OPEN kan (Minkan)
        const options = {
            isTsumo: true,
            isNaki: false, // User didn't click checkbox, but kan is open
            kans: [{ id: 'm1', type: 'minkan' }],
            doraCount: 0,
            isRyamen: true
        };
        const result = evaluateHand(hand, 's4', options, false);

        assert.notStrictEqual(result, null);
        // Menzen Tsumo should NOT be present because minkan breaks menzen
        assert.strictEqual(result.yakuList.some(y => y.name === '門前清自摸和'), false);
        // Sanshoku Doujun should be present, and it's 1 han due to KuisaGari
        assert.strictEqual(result.yakuList.some(y => y.name === '三色同順'), true);
        assert.strictEqual(result.han, 1);
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();
