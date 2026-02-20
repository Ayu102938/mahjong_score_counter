// logic.yaku.js - Evaluates Yaku from a parsed Mahjong Hand

/**
 * Evaluates valid Yaku based on a single parsed combination of a hand.
 * @param {Array<{type: string, tiles: string[]}>} combination A parsed valid hand (e.g. 4 melds + 1 pair)
 * @param {string} winTile The tile that completes the hand (e.g. 'm1')
 * @param {Object} options Options like {isTsumo, isNaki, oyaKaze, jikaze, riichi, ippatsu, etc.}
 * @returns {Array<{name: string, han: number, isMenzenOnly: boolean, kuisaGari: boolean}>} List of matched Yaku
 */
function evaluateYaku(combination, winTile, options) {
    const yakuList = [];

    // Basic Menzen Tsumo
    if (options.isTsumo && !options.isNaki) {
        yakuList.push({ name: '門前清自摸和', han: 1, isMenzenOnly: true, kuisaGari: false });
    }

    // Tanyao (All Simples)
    const isTanyao = combination.every(meld => {
        return meld.tiles.every(tile => {
            const suit = tile.charAt(0);
            const rank = parseInt(tile.charAt(1), 10);
            return suit !== 'z' && rank >= 2 && rank <= 8;
        });
    });

    if (isTanyao) {
        yakuList.push({ name: '断幺九', han: 1, isMenzenOnly: false, kuisaGari: false });
    }

    // Chiitoitsu (Seven Pairs)
    const isChiitoitsu = combination.length === 7 && combination.every(meld => meld.type === 'toitsu');
    if (isChiitoitsu) {
        yakuList.push({ name: '七対子', han: 2, isMenzenOnly: true, kuisaGari: false });
    }

    // Pinfu
    // Conditions: Menzen, 4 Shuntsu, Pair is NOT value tile (yakuhai), wait is Ryamen.
    if (!options.isNaki && !isChiitoitsu) {
        const shuntsuCount = combination.filter(m => m.type === 'shuntsu').length;
        const pairMeld = combination.find(m => m.type === 'toitsu');

        let isYakuhaiPair = false;
        if (pairMeld) {
            const pairTile = pairMeld.tiles[0];
            // Value tiles usually: Dragons (z5, z6, z7), Prevalent Wind, Seat Wind.
            // For simplicity in this logic scope, let's assume options provides them or we check z5-z7 and matching winds.
            // If z5, z6, z7 (Haku, Hatsu, Chun) it's yakuhai. If it matches oyaKaze/jikaze, it's yakuhai.
            const winds = { '東': 'z1', '南': 'z2', '西': 'z3', '北': 'z4' };
            const yakuhaiTiles = ['z5', 'z6', 'z7'];
            if (options.oyaKaze && winds[options.oyaKaze]) yakuhaiTiles.push(winds[options.oyaKaze]);
            if (options.jikaze && winds[options.jikaze]) yakuhaiTiles.push(winds[options.jikaze]);

            if (yakuhaiTiles.includes(pairTile)) {
                isYakuhaiPair = true;
            }
        }

        if (shuntsuCount === 4 && !isYakuhaiPair && options.isRyamen) {
            yakuList.push({ name: '平和', han: 1, isMenzenOnly: true, kuisaGari: false });
        }
    }

    // Yakuhai (Value Tiles: Dragons, Prevalent Wind, Seat Wind)
    const winds = { '東': 'z1', '南': 'z2', '西': 'z3', '北': 'z4' };
    combination.forEach(meld => {
        if (meld.type === 'koutsu' || meld.type === 'kantsu') {
            const tile = meld.tiles[0];
            // Dragons
            if (['z5', 'z6', 'z7'].includes(tile)) {
                yakuList.push({ name: '役牌（白・發・中・自風・場風）', han: 1, isMenzenOnly: false, kuisaGari: false });
            }
            // Prevalent Wind (Oya Kaze)
            if (options.oyaKaze && tile === winds[options.oyaKaze]) {
                yakuList.push({ name: '役牌（白・發・中・自風・場風）', han: 1, isMenzenOnly: false, kuisaGari: false });
            }
            // Seat Wind (Jikaze)
            if (options.jikaze && tile === winds[options.jikaze]) {
                yakuList.push({ name: '役牌（白・發・中・自風・場風）', han: 1, isMenzenOnly: false, kuisaGari: false });
            }
        }
    });

    // Sanshoku Doujun (Three Color Straight)
    const shuntsuList = combination.filter(m => m.type === 'shuntsu');
    if (shuntsuList.length >= 3) {
        // Group shuntsu by starting rank
        const rankMap = {};
        shuntsuList.forEach(s => {
            const rank = parseInt(s.tiles[0].charAt(1), 10);
            const suit = s.tiles[0].charAt(0);
            if (!rankMap[rank]) rankMap[rank] = new Set();
            rankMap[rank].add(suit);
        });

        // If any rank has all three suits (m, p, s), we have a Sanshoku
        for (const rank in rankMap) {
            if (rankMap[rank].size === 3 && rankMap[rank].has('m') && rankMap[rank].has('p') && rankMap[rank].has('s')) {
                yakuList.push({ name: '三色同順', han: 2, isMenzenOnly: false, kuisaGari: true });
                break; // only count once
            }
        }
    }

    // Ittsu (Straight)
    if (shuntsuList.length >= 3) {
        // Find if we have 123, 456, 789 of the SAME suit
        const ittsuSuits = ['m', 'p', 's'];
        for (const suit of ittsuSuits) {
            const has123 = shuntsuList.some(s => s.tiles[0] === suit + '1');
            const has456 = shuntsuList.some(s => s.tiles[0] === suit + '4');
            const has789 = shuntsuList.some(s => s.tiles[0] === suit + '7');

            if (has123 && has456 && has789) {
                yakuList.push({ name: '一気通貫', han: 2, isMenzenOnly: false, kuisaGari: true });
                break;
            }
        }
    }

    // Honitsu (Half Flush) & Chinitsu (Full Flush)
    let hasManzu = false;
    let hasPinzu = false;
    let hasSouzu = false;
    let hasJihai = false;

    combination.forEach(meld => {
        meld.tiles.forEach(tile => {
            const suit = tile.charAt(0);
            if (suit === 'm') hasManzu = true;
            else if (suit === 'p') hasPinzu = true;
            else if (suit === 's') hasSouzu = true;
            else if (suit === 'z') hasJihai = true;
        });
    });

    const suitCount = [hasManzu, hasPinzu, hasSouzu].filter(Boolean).length;

    if (suitCount === 1) {
        if (hasJihai) {
            yakuList.push({ name: '混一色', han: 3, isMenzenOnly: false, kuisaGari: true });
        } else {
            yakuList.push({ name: '清一色', han: 6, isMenzenOnly: false, kuisaGari: true });
        }
    }

    return yakuList;
}

module.exports = {
    evaluateYaku
};
