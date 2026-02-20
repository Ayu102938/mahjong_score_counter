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

    test('evaluateYaku: Sankantsu (Three Kans) and Suukantsu (Four Kans)', () => {
        const sankantsuCombo = [
            { type: 'kantsu', tiles: ['m1', 'm1', 'm1', 'm1'] },
            { type: 'kantsu', tiles: ['m2', 'm2', 'm2', 'm2'] },
            { type: 'kantsu', tiles: ['m3', 'm3', 'm3', 'm3'] },
            { type: 'shuntsu', tiles: ['p4', 'p5', 'p6'] },
            { type: 'toitsu', tiles: ['s9', 's9'] }
        ];
        const resSankantsu = evaluateYaku(sankantsuCombo, 'p6', { isTsumo: true, isNaki: false });
        assert.strictEqual(resSankantsu.some(y => y.name === '三槓子'), true);
        assert.strictEqual(resSankantsu.some(y => y.name === '四槓子'), false);

        const suukantsuCombo = [
            { type: 'kantsu', tiles: ['s1', 's1', 's1', 's1'] },
            { type: 'kantsu', tiles: ['p2', 'p2', 'p2', 'p2'] },
            { type: 'kantsu', tiles: ['z3', 'z3', 'z3', 'z3'] },
            { type: 'kantsu', tiles: ['m4', 'm4', 'm4', 'm4'] },
            { type: 'toitsu', tiles: ['z7', 'z7'] }
        ];
        const resSuukantsu = evaluateYaku(suukantsuCombo, 'z7', { isTsumo: true, isNaki: false });
        assert.strictEqual(resSuukantsu.some(y => y.name === '四槓子'), true);
        assert.strictEqual(resSuukantsu.some(y => y.name === '三槓子'), false);
    });

    test('evaluateYaku: Iipeikou and Ryanpeikou', () => {
        // Iipeikou: two identical shuntsu (menzen only)
        const iiCombo = [
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['p6', 'p7', 'p8'] },
            { type: 'koutsu', tiles: ['s9', 's9', 's9'] },
            { type: 'toitsu', tiles: ['z1', 'z1'] }
        ];
        const resIi = evaluateYaku(iiCombo, 'm2', { isTsumo: false, isNaki: false });
        assert.strictEqual(resIi.some(y => y.name === '一盃口'), true);

        // Ryanpeikou: two pairs of identical shuntsu
        const ryanCombo = [
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['m2', 'm3', 'm4'] },
            { type: 'shuntsu', tiles: ['p6', 'p7', 'p8'] },
            { type: 'shuntsu', tiles: ['p6', 'p7', 'p8'] },
            { type: 'toitsu', tiles: ['s9', 's9'] }
        ];
        const resRyan = evaluateYaku(ryanCombo, 'm2', { isTsumo: false, isNaki: false });
        assert.strictEqual(resRyan.some(y => y.name === '二盃口'), true);
        // Ryanpeikou should NOT also have Iipeikou
        assert.strictEqual(resRyan.some(y => y.name === '一盃口'), false);
    });

    test('evaluateYaku: Toitoi (All Triplets)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['m1', 'm1', 'm1'] },
            { type: 'koutsu', tiles: ['m9', 'm9', 'm9'] },
            { type: 'koutsu', tiles: ['p5', 'p5', 'p5'] },
            { type: 'koutsu', tiles: ['s7', 's7', 's7'] },
            { type: 'toitsu', tiles: ['z1', 'z1'] }
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: true });
        assert.strictEqual(result.some(y => y.name === '対々和'), true);
    });

    test('evaluateYaku: Sanankou (Three Concealed Triplets)', () => {
        // 3 koutsu formed without naki, 1 shuntsu
        const combo = [
            { type: 'koutsu', tiles: ['m1', 'm1', 'm1'] },
            { type: 'koutsu', tiles: ['p5', 'p5', 'p5'] },
            { type: 'koutsu', tiles: ['s9', 's9', 's9'] },
            { type: 'shuntsu', tiles: ['m7', 'm8', 'm9'] },
            { type: 'toitsu', tiles: ['z7', 'z7'] }
        ];
        const result = evaluateYaku(combo, 'm7', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '三暗刻'), true);
    });

    test('evaluateYaku: Chanta (Half Terminals/Honors)', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'shuntsu', tiles: ['p7', 'p8', 'p9'] },
            { type: 'koutsu', tiles: ['s1', 's1', 's1'] },
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'toitsu', tiles: ['m9', 'm9'] }
        ];
        const result = evaluateYaku(combo, 'm3', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === 'チャンタ'), true);
    });

    test('evaluateYaku: Sanshoku Doukou (Three Color Triplets)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['m5', 'm5', 'm5'] },
            { type: 'koutsu', tiles: ['p5', 'p5', 'p5'] },
            { type: 'koutsu', tiles: ['s5', 's5', 's5'] },
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'toitsu', tiles: ['z7', 'z7'] }
        ];
        const result = evaluateYaku(combo, 'm5', { isTsumo: false, isNaki: true });
        assert.strictEqual(result.some(y => y.name === '三色同刻'), true);
    });

    test('evaluateYaku: Shosangen (Small Three Dragons)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['z5', 'z5', 'z5'] }, // Haku
            { type: 'koutsu', tiles: ['z6', 'z6', 'z6'] }, // Hatsu
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'shuntsu', tiles: ['p4', 'p5', 'p6'] },
            { type: 'toitsu', tiles: ['z7', 'z7'] }  // Chun as pair
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '小三元'), true);
    });

    // === YAKUMAN TESTS ===

    test('evaluateYaku: Suuankou (四暗刻)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['m1', 'm1', 'm1'] },
            { type: 'koutsu', tiles: ['p5', 'p5', 'p5'] },
            { type: 'koutsu', tiles: ['s9', 's9', 's9'] },
            { type: 'koutsu', tiles: ['z7', 'z7', 'z7'] },
            { type: 'toitsu', tiles: ['m9', 'm9'] }
        ];
        const result = evaluateYaku(combo, 'm9', { isTsumo: true, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '四暗刻'), true);
        assert.strictEqual(result.find(y => y.name === '四暗刻').han, 13);
    });

    test('evaluateYaku: Daisangen (大三元)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['z5', 'z5', 'z5'] }, // Haku
            { type: 'koutsu', tiles: ['z6', 'z6', 'z6'] }, // Hatsu
            { type: 'koutsu', tiles: ['z7', 'z7', 'z7'] }, // Chun
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'toitsu', tiles: ['p9', 'p9'] }
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '大三元'), true);
        assert.strictEqual(result.find(y => y.name === '大三元').han, 13);
    });

    test('evaluateYaku: Tsuuiisou (字一色)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'koutsu', tiles: ['z2', 'z2', 'z2'] },
            { type: 'koutsu', tiles: ['z5', 'z5', 'z5'] },
            { type: 'koutsu', tiles: ['z6', 'z6', 'z6'] },
            { type: 'toitsu', tiles: ['z7', 'z7'] }
        ];
        const result = evaluateYaku(combo, 'z1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '字一色'), true);
        assert.strictEqual(result.find(y => y.name === '字一色').han, 13);
    });

    test('evaluateYaku: Chinroutou (清老頭)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['m1', 'm1', 'm1'] },
            { type: 'koutsu', tiles: ['m9', 'm9', 'm9'] },
            { type: 'koutsu', tiles: ['p1', 'p1', 'p1'] },
            { type: 'koutsu', tiles: ['p9', 'p9', 'p9'] },
            { type: 'toitsu', tiles: ['s1', 's1'] }
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '清老頭'), true);
    });

    test('evaluateYaku: Ryuuiisou (緑一色)', () => {
        const combo = [
            { type: 'shuntsu', tiles: ['s2', 's3', 's4'] },
            { type: 'shuntsu', tiles: ['s2', 's3', 's4'] },
            { type: 'koutsu', tiles: ['s6', 's6', 's6'] },
            { type: 'koutsu', tiles: ['z6', 'z6', 'z6'] }, // Hatsu (green)
            { type: 'toitsu', tiles: ['s8', 's8'] }
        ];
        const result = evaluateYaku(combo, 's2', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '緑一色'), true);
    });

    test('evaluateYaku: Shousushi (小四喀)', () => {
        const windTiles = ['z1', 'z2', 'z3', 'z4'];
        const combo = [
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] }, // East
            { type: 'koutsu', tiles: ['z2', 'z2', 'z2'] }, // South
            { type: 'koutsu', tiles: ['z3', 'z3', 'z3'] }, // West
            { type: 'shuntsu', tiles: ['m1', 'm2', 'm3'] },
            { type: 'toitsu', tiles: ['z4', 'z4'] }         // North as pair
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '小四喜'), true);
    });

    test('evaluateYaku: Daisushi (大四喜, double yakuman)', () => {
        const combo = [
            { type: 'koutsu', tiles: ['z1', 'z1', 'z1'] },
            { type: 'koutsu', tiles: ['z2', 'z2', 'z2'] },
            { type: 'koutsu', tiles: ['z3', 'z3', 'z3'] },
            { type: 'koutsu', tiles: ['z4', 'z4', 'z4'] },
            { type: 'toitsu', tiles: ['m1', 'm1'] }
        ];
        const result = evaluateYaku(combo, 'm1', { isTsumo: false, isNaki: false });
        assert.strictEqual(result.some(y => y.name === '大四喜'), true);
        assert.strictEqual(result.find(y => y.name === '大四喜').han, 26);
    });

    console.log(`\nTest Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
}

runTests();
