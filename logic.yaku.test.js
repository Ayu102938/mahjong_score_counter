const assert = require('assert');
const { evaluateYaku } = require('./logic.yaku');

function runTests() {
    console.log("Running Mahjong Yaku Tests...");
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

    test('evaluateYaku: Menzen Tsumo', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'shuntsu', tiles: ['p4', 'p5', 'p6'] },
            { type: 'shuntsu', tiles: ['s7', 's8', 's9'] },
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'toitsu', tiles: ['z2', 'z2'] }
        ];
        const result = evaluateYaku(combo, 'z1', { isTsumo: true, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '門前清自摸和'), true);
    });

    test('evaluateYaku: Tanyao (All Simples)', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['p4', 'p5', 'p6'] },
            { type: 'shuntsu', tiles: ['s6', 's7', 's8'] },
            { type: 'koutsu', tiles: ['m8', 'm8', 'm8'] },
            { type: 'toitsu', tiles: ['p2', 'p2'] }
        ];
        const result = evaluateYaku(combo, 'p4', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '断幺九'), true);
    });

    test('evaluateYaku: Chiitoitsu (Seven Pairs)', () => {
        const combo = [
            { type: 'toitsu', tiles: ['m1', 'm1'] },
            { type: 'toitsu', tiles: ['m2', 'm2'] },
            { type: 'toitsu', tiles: ['p4', 'p4'] },
            { type: 'toitsu', tiles: ['p5', 'p5'] },
            { type: 'toitsu', tiles: ['s6', 's6'] },
            { type: 'toitsu', tiles: ['s7', 's7'] },
            { type: 'toitsu', tiles: ['z1', 'z1'] }
        ];
        const result = evaluateYaku(combo, 'z1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '七対子'), true);
    });

    test('evaluateYaku: Pinfu (平和)', () => {
        // All Shuntsu, winning on a two-sided wait (ryamen), pair is not value tile
        const combo = [
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['p4', 'p5', 'p6'] },
            { type: 'shuntsu', tiles: ['s6', 's7', 's8'] },
            { type: 'shuntsu', tiles: ['s2', 's3', 's4'] },
            { type: 'toitsu', tiles: ['m9', 'm9'] }
        ];
        // Waiting on s2 or s5 (we'll say winTile is s4 to simulate a ryamen wait internally for now)
        // Note: Full wait calculation is very complex, so for Pinfu we check basic structural conditions first
        const result = evaluateYaku(combo, 's4', { isTsumo: false, isNaki: false, isRyamen: true });
        assert.strictEqual(result.some(y => y.name === '平和'), true);
    });

    test('evaluateYaku: Yakuhai (Value Tiles: Dragons, Prevalent Wind, Seat Wind)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['z5', 'z5', 'z5'] }, // Haku (White Dragon) -> 1 han
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] }, // East Wind -> given OyaKaze=East, Jikaze=South, this is +1 han
            { type: 'koutsu', tiles: ['z2', 'z2', 'z2'] }, // South Wind -> Jikaze, +1 han
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'toitsu', tiles: ['p2', 'p2'] }
        ];
        // Total should be 3 Yakuhai Yaku: Yakuhai(z5), Prevalent Wind(z1), Seat Wind(z2)
        // Let's assume name '役牌（白・發・中・自風・場風）' for all or distinct. Based on specification: name is '役牌（白・發・中・自風・場風）' (count multiple times).
        // Since we need to count them distinctly, the evaluator should add multiple entries or a multiplier. Let's add multiple.
        const result = evaluateYaku(combo, 'z2', { isTsumo: false, isNaki: true, oyaKaze: '東', jikaze: '南' });

        const yakuhaiMatches = result.filter(y => y.name.includes('役牌'));
        assert.strictEqual(yakuhaiMatches.length, 3, `Expected 3 Yakuhai matches, got ${yakuhaiMatches.length}`);
    });

    test('evaluateYaku: Sanshoku Doujun (Three Color Straight) with Kuisa-gari', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['p2', 'p3', 'p4'] },
            { type: 'shuntsu', tiles: ['s2', 's3', 's4'] },
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'toitsu', tiles: ['p8', 'p8'] }
        ];
        const resultMenzen = evaluateYaku(combo, 's4', { isTsumo: true, isNaki: false });
        assert.strictEqual(resultMenzen.some(y => y.name === '三色同順'), true);

        // Technically kuisa-gari applies at the calculator level, evaluator just returns the base object.
        // But let's verify it's returned even and Naki is true.
        const resultNaki = evaluateYaku(combo, 's4', { isTsumo: false, isNaki: true });
        assert.strictEqual(resultNaki.some(y => y.name === '三色同順'), true);
    });

    test('evaluateYaku: Ittsu (Straight) with Kuisa-gari', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'shuntsu', tiles: ['m4', 'm5', 'm6'] },
            { type: 'shuntsu', tiles: ['m7', 'm8', 'm9'] },
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'toitsu', tiles: ['p8', 'p8'] }
        ];
        const result = evaluateYaku(combo, 'm5', { isTsumo: true, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '一気通貫'), true);
    });

    test('evaluateYaku: Honitsu (Half Flush) and Chinitsu (Full Flush)', () => {
        const honitsuCombo = [
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'koutsu', tiles: ['m4', 'm4', 'm4'] },
            { type: 'koutsu', tiles: ['m7', 'm7', 'm7'] },
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'toitsu', tiles: ['m9', 'm9'] }
        ];
        const resHonitsu = evaluateYaku(honitsuCombo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(resHonitsu.some(y => y.name === '混一色'), true);
        assert.strictEqual(resHonitsu.some(y => y.name === '清一色'), false);

        const chinitsuCombo = [
            { type: 'shuntsu', tiles: ['s1', 's2', 's3'] },
            { type: 'shuntsu', tiles: ['s4', 's5', 's6'] },
            { type: 'koutsu', tiles: ['s7', 's7', 's7'] },
            { type: 'koutsu', tiles: ['s8', 's8', 's8'] },
            { type: 'toitsu', tiles: ['s9', 's9'] }
        ];
        const resChinitsu = evaluateYaku(chinitsuCombo, 's1', { isTsumo: false, isNaki: false });
        assert.strictEqual(resChinitsu.some(y => y.name === '清一色'), true);
        assert.strictEqual(resChinitsu.some(y => y.name === '混一色'), false);
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();
