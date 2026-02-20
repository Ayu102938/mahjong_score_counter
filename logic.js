// logic.js - Core mahjong calculating dummy function to establish the interface

/**
 * calculateMahjongScore
 * @param {Object} payload
 * {
 *   hand: string[],    // e.g. ["1m", "2m", "3m", "2p", "2p", "2p", ...] (14 tiles)
 *   isOya: boolean,
 *   isTsumo: boolean,
 *   isNaki: boolean,
 *   doraCount: number
 * }
 * @returns {Object} result
 * {
 *   han: number,
 *   fu: number,
 *   score: { main: number, additional: number }, // 'additional' is used for Ko Tsumo
 *   yaku: string[]
 * }
 */
function calculateMahjongScore(payload) {
    console.log("Called calculateMahjongScore with payload:", payload);

    const options = {
        isTsumo: payload.isTsumo,
        isNaki: payload.isNaki,
        doraCount: payload.doraCount,
        kans: payload.kans || [],
        isRiichi: payload.isRiichi || false,
        isIppatsu: payload.isIppatsu || false,
        isDoubleRiichi: payload.isDoubleRiichi || false,
        // Assuming some defaults for features not yet in UI
        isRyamen: true,
        oyaKaze: '東',
        jikaze: payload.isOya ? '東' : '南'
    };

    // The winning tile is generally the last tile added, or we can just pick the last tile in the hand array
    const winTile = payload.hand[payload.hand.length - 1];

    const result = evaluateHand(payload.hand, winTile, options, payload.isOya);

    if (!result) {
        return {
            han: 0,
            fu: 0,
            score: { main: 0, additional: 0 },
            yaku: []
        };
    }

    return {
        han: result.han,
        fu: result.fu,
        score: result.highestScore,
        yaku: result.yakuList.map(y => y.name)
    };
}

// -------------------------------------------------------------
// Auto-Yaku Detector Integration
// -------------------------------------------------------------
const parser = require('./logic.parser');
const yakuEngine = require('./logic.yaku');

function calculateHan(yakuDataList, isNaki, doraCount) {
    let totalHan = 0;
    yakuDataList.forEach(yaku => {
        if (isNaki && yaku.isMenzenOnly) return;
        let currentHan = yaku.han;
        if (isNaki && yaku.kuisaGari) currentHan -= 1;
        totalHan += currentHan;
    });
    return totalHan + doraCount;
}

function calculateFu(yakuDataList, isNaki, isTsumo) {
    let isChiitoitsu = yakuDataList.some(y => y.name === '七対子');
    let isPinfu = yakuDataList.some(y => y.name === '平和');
    if (isChiitoitsu) return 25;
    if (!isNaki && isTsumo && isPinfu) return 20;
    return 30; // base fu for MVP
}

function calculateScore(isOya, isTsumo, han, fu) {
    let isFixed = false;
    let baseRef = 0;

    if (han >= 13) { isFixed = true; baseRef = 8000; } // 役満
    else if (han >= 11) { isFixed = true; baseRef = 6000; } // 三倍満
    else if (han >= 8) { isFixed = true; baseRef = 4000; } // 倍満
    else if (han >= 6) { isFixed = true; baseRef = 3000; } // 跳満
    else if (han >= 5 || (han === 4 && fu >= 30) || (han === 3 && fu >= 60)) {
        isFixed = true; baseRef = 2000; // 満貫
    }

    if (!isFixed) {
        baseRef = fu * Math.pow(2, 2 + han);
    }

    let main = 0;
    let additional = 0;

    if (isTsumo) {
        if (isOya) {
            main = Math.ceil((baseRef * 2) / 100) * 100;
        } else {
            main = Math.ceil(baseRef / 100) * 100; // child pays
            additional = Math.ceil((baseRef * 2) / 100) * 100; // parent pays
        }
    } else {
        if (isOya) {
            main = Math.ceil((baseRef * 6) / 100) * 100;
        } else {
            main = Math.ceil((baseRef * 4) / 100) * 100;
        }
    }

    return { main, additional };
}

/**
 * Automagically parses a hand and evaluates the maximum possible score.
 * @param {string[]} handTiles 
 * @param {string} winTile 
 * @param {Object} options 
 * @param {boolean} isOya 
 * @returns {Object} 
 */
function evaluateHand(handTiles, winTile, options, isOya) {
    const validCombos = parser.parseHand(handTiles, options.kans || []);
    if (!validCombos || validCombos.length === 0) {
        return null;
    }

    let bestResult = null;
    let maxMainScore = -1;

    for (const combo of validCombos) {
        // Find effective menzen state for this combo
        const hasMinkan = combo.some(m => m.kanType === 'minkan');
        const effectiveNaki = options.isNaki || hasMinkan;

        const yakuList = yakuEngine.evaluateYaku(combo, winTile, options);

        if (options.isRiichi && !effectiveNaki) yakuList.push({ name: 'リーチ', han: 1, isMenzenOnly: true, kuisaGari: false });
        if (options.isIppatsu && !effectiveNaki) yakuList.push({ name: '一発', han: 1, isMenzenOnly: true, kuisaGari: false });
        if (options.isDoubleRiichi && !effectiveNaki) yakuList.push({ name: 'ダブルリーチ', han: 2, isMenzenOnly: true, kuisaGari: false });

        let han = calculateHan(yakuList, effectiveNaki, options.doraCount || 0);

        if (han > 0) {
            const actualFu = calculateFu(yakuList, effectiveNaki, options.isTsumo);

            const score = calculateScore(isOya, options.isTsumo, han, actualFu);

            if (score.main > maxMainScore) {
                maxMainScore = score.main;
                bestResult = {
                    highestScore: score,
                    bestCombo: combo,
                    yakuList: yakuList,
                    han: han,
                    fu: actualFu
                };
            }
        }
    }

    return bestResult;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateMahjongScore, // Keep the original dummy function
        calculateHan,
        calculateFu,
        calculateScore,
        evaluateHand
    };
}
