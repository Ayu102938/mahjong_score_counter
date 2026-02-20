// logic.js - Core Mahjong Scoring Logic

/**
 * Calculates the total Han based on selected Yaku, Naki status, and Dora count.
 * @param {Array<{name: string, han: number, isMenzenOnly: boolean, kuisaGari: boolean}>} selectedYaku 
 * @param {boolean} isNaki 
 * @param {number} doraCount 
 * @returns {number} Total Han
 */
function calculateHan(selectedYaku, isNaki, doraCount) {
    let totalHan = 0;
    for (const yaku of selectedYaku) {
        if (isNaki && yaku.isMenzenOnly) {
            continue; // Ignore Menzen-only yaku when Naki is true
        }

        let hanToAdd = yaku.han;
        if (isNaki && yaku.kuisaGari) {
            hanToAdd -= 1; // Kuisa-gari: -1 Han if Naki is true
        }

        totalHan += hanToAdd;
    }
    return totalHan + doraCount;
}

/**
 * Calculates the Base Fu.
 * @param {Array<{name: string, han: number, isMenzenOnly: boolean, kuisaGari: boolean}>} selectedYaku 
 * @param {boolean} isNaki 
 * @param {boolean} isTsumo 
 * @returns {number} Base Fu
 */
function calculateFu(selectedYaku, isNaki, isTsumo) {
    const hasChiitoitsu = selectedYaku.some(yaku => yaku.name === '七対子');
    if (hasChiitoitsu) {
        return 25;
    }

    const hasPinfu = selectedYaku.some(yaku => yaku.name === '平和');
    if (!isNaki && hasPinfu && isTsumo) {
        return 20;
    }

    return 30;
}

/**
 * Calculates the final score.
 * @param {boolean} isOya 
 * @param {boolean} isTsumo 
 * @param {number} han 
 * @param {number} fu 
 * @returns {Object} Score details
 */
function calculateScore(isOya, isTsumo, han, fu) {
    if (han === 0) return { main: 0, additional: 0 };

    // Mangan and above fixed scores
    let manganMultiplier = 0;

    // Exception: 4 Han 30 Fu is treated as Mangan
    if (han >= 13) {
        manganMultiplier = 4; // Yakuman
    } else if (han >= 11) {
        manganMultiplier = 3; // Sanbaiman
    } else if (han >= 8) {
        manganMultiplier = 2; // Baiman
    } else if (han >= 6) {
        manganMultiplier = 1.5; // Haneman
    } else if (han >= 5 || (han === 4 && fu === 30)) {
        manganMultiplier = 1; // Mangan
    }

    if (manganMultiplier > 0) {
        const baseMangan = 8000;
        if (isOya) {
            if (isTsumo) {
                return { main: 4000 * manganMultiplier, additional: 0 }; // 4000 ALL * mult
            } else {
                return { main: 12000 * manganMultiplier, additional: 0 };
            }
        } else {
            if (isTsumo) {
                return { main: 4000 * manganMultiplier, additional: 2000 * manganMultiplier }; // Result object: {main: oya payment, additional: ko payment}
            } else {
                return { main: 8000 * manganMultiplier, additional: 0 };
            }
        }
    }

    // 1-4 Han calculation from tables in specification.md
    // We'll use a lookup approach since it's a fixed small set
    // table[ko/oya][tsumo/ron][fu][han]
    // tsumo ko format: { main: oya_pays, additional: ko_pays } -> wait, usually we say '2000, 4000'. 
    // Let's standardise our return: 
    //   If Ron: main = total score, additional = 0
    //   If Oya Tsumo: main = score from each, additional = 0
    //   If Ko Tsumo: main = ko pays, additional = oya pays

    // specification.md table (adjusted to our return format)
    const scoreTable = {
        ko: {
            ron: {
                20: { 1: 0, 2: 0, 3: 0, 4: 0 }, // No 20 fu ron in the simplified spec (pinfu tsumo only is 20)
                25: { 1: 0, 2: 1600, 3: 3200, 4: 6400 },
                30: { 1: 1000, 2: 2000, 3: 3900, 4: 8000 } // 4han 30fu is Mangan, caught above
            },
            tsumo: {
                20: { 1: 0, 2: { main: 700, additional: 400 }, 3: { main: 1300, additional: 700 }, 4: { main: 2600, additional: 1300 } },
                25: { 1: 0, 2: null, 3: { main: 1600, additional: 800 }, 4: { main: 3200, additional: 1600 } }, // 2han25fu tsumo practically impossible without ron so maybe not in spec? spec says - for 2han25fu tsumo
                30: { 1: { main: 500, additional: 300 }, 2: { main: 1000, additional: 500 }, 3: { main: 2000, additional: 1000 }, 4: { main: 4000, additional: 2000 } }
            }
        },
        oya: {
            ron: {
                20: { 1: 0, 2: 0, 3: 0, 4: 0 },
                25: { 1: 0, 2: 2400, 3: 4800, 4: 9600 },
                30: { 1: 1500, 2: 2900, 3: 5800, 4: 12000 }
            },
            tsumo: {
                20: { 1: 0, 2: 700, 3: 1300, 4: 2600 },
                25: { 1: 0, 2: null, 3: 1600, 4: 3200 },
                30: { 1: 500, 2: 1000, 3: 2000, 4: 4000 }
            }
        }
    };

    const role = isOya ? 'oya' : 'ko';
    const method = isTsumo ? 'tsumo' : 'ron';
    const points = scoreTable[role][method][fu][han];

    if (!points) return { main: 0, additional: 0 }; // Handle missing entries safely

    if (typeof points === 'object') {
        return { main: points.main, additional: points.additional };
    } else {
        return { main: points, additional: 0 };
    }
}

module.exports = {
    calculateHan,
    calculateFu,
    calculateScore
};
