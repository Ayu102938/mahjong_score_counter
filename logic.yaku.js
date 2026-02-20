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

    // Evaluate effective Menzen state
    const hasMinkan = combination.some(m => m.kanType === 'minkan');
    const isMenzen = !options.isNaki && !hasMinkan;

    // Kokushi Musou is a special form - skip ALL standard yaku evaluation
    if (combination.length === 1 && combination[0].type === 'kokushi') {
        yakuList.push({ name: '国士無双', han: 13, isMenzenOnly: true, kuisaGari: false });
        return yakuList;
    }

    // Basic Menzen Tsumo
    if (options.isTsumo && isMenzen) {
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
    if (isMenzen && !isChiitoitsu) {
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

    // Iipeikou (Two Identical Sequences) and Ryanpeikou (Two Pairs of Identical Sequences)
    if (isMenzen && !isChiitoitsu) {
        const shuntsuKeys = combination
            .filter(m => m.type === 'shuntsu')
            .map(m => m.tiles[0]); // Use the first tile as the key, e.g. 'm2'
        const duplicateCounts = {};
        shuntsuKeys.forEach(k => duplicateCounts[k] = (duplicateCounts[k] || 0) + 1);
        const pairs = Object.values(duplicateCounts).filter(c => c >= 2).length;
        if (pairs >= 2) {
            yakuList.push({ name: '二盃口', han: 3, isMenzenOnly: true, kuisaGari: false });
        } else if (pairs === 1) {
            yakuList.push({ name: '一盃口', han: 1, isMenzenOnly: true, kuisaGari: false });
        }
    }

    // Toitoi (All Triplets)
    const tripletMelds = combination.filter(m => m.type === 'koutsu' || m.type === 'kantsu');
    if (tripletMelds.length === 4) {
        yakuList.push({ name: '対々和', han: 2, isMenzenOnly: false, kuisaGari: false });
    }

    // Sanankou (Three Concealed Triplets)
    // Triplets that are formed without naki (anko), includes kantsu of type ankan
    if (!isChiitoitsu) {
        const ankoCount = combination.filter(m =>
            (m.type === 'koutsu' || (m.type === 'kantsu' && m.kanType !== 'minkan'))
        ).length;
        if (ankoCount >= 3 && !options.isNaki) {
            yakuList.push({ name: '三暗刻', han: 2, isMenzenOnly: false, kuisaGari: false });
        }
    }

    // Chanta (Half Terminals/Honors - every meld contains a terminal or honor)
    // Every group has at least one 1/9/jihai tile
    const isTerminalOrHonor = tile => {
        const suit = tile.charAt(0);
        const rank = parseInt(tile.charAt(1), 10);
        return suit === 'z' || rank === 1 || rank === 9;
    };
    const hasShuntsu = combination.some(m => m.type === 'shuntsu');
    const allGroupsHaveTerminal = combination.every(meld =>
        meld.tiles.some(isTerminalOrHonor)
    );
    if (allGroupsHaveTerminal && hasShuntsu) {
        // Check if Junchan (no honors) or Chanta (with honors)
        const hasHonors = combination.some(meld => meld.tiles.some(t => t.charAt(0) === 'z'));
        if (!hasHonors) {
            yakuList.push({ name: '純チャン', han: 3, isMenzenOnly: false, kuisaGari: true });
        } else {
            yakuList.push({ name: 'チャンタ', han: 2, isMenzenOnly: false, kuisaGari: true });
        }
    }

    // Honroutou (All Terminals and Honors)
    // Every tile in every set must be a terminal (1 or 9) or honor (字牌)
    // Not applicable to Kokushi Musou (handled separately as Yakuman)
    const isKokushiCombo = combination.length === 1 && combination[0].type === 'kokushi';
    const isHonroutou = !isKokushiCombo && combination.every(meld =>
        meld.tiles.every(tile => {
            const suit = tile.charAt(0);
            const rank = parseInt(tile.charAt(1), 10);
            return suit === 'z' || rank === 1 || rank === 9;
        })
    ) && !hasShuntsu;
    if (isHonroutou) {
        yakuList.push({ name: '混老頭', han: 2, isMenzenOnly: false, kuisaGari: false });
    }

    // Sanshoku Doukou (Three Color Triplets)
    const koutsuList = combination.filter(m => m.type === 'koutsu' || m.type === 'kantsu');
    if (koutsuList.length >= 3) {
        const koutsuRankMap = {};
        koutsuList.forEach(m => {
            const tile = m.tiles[0];
            const suit = tile.charAt(0);
            const rank = tile.charAt(1);
            if (suit !== 'z') {
                if (!koutsuRankMap[rank]) koutsuRankMap[rank] = new Set();
                koutsuRankMap[rank].add(suit);
            }
        });
        for (const rank in koutsuRankMap) {
            if (koutsuRankMap[rank].size === 3) {
                yakuList.push({ name: '三色同刻', han: 2, isMenzenOnly: false, kuisaGari: false });
                break;
            }
        }
    }

    // Shosangen (Small Three Dragons)
    // Two dragon triplets + one dragon pair
    const dragonTiles = ['z5', 'z6', 'z7'];
    const dragonTriplets = combination.filter(
        m => (m.type === 'koutsu' || m.type === 'kantsu') && dragonTiles.includes(m.tiles[0])
    ).length;
    const dragonPair = combination.some(
        m => m.type === 'toitsu' && dragonTiles.includes(m.tiles[0])
    );
    if (dragonTriplets === 2 && dragonPair) {
        yakuList.push({ name: '小三元', han: 2, isMenzenOnly: false, kuisaGari: false });
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

    // Kantsu counts
    const kantsuCount = combination.filter(m => m.type === 'kantsu').length;
    if (kantsuCount === 3) {
        yakuList.push({ name: '三槓子', han: 2, isMenzenOnly: false, kuisaGari: false });
    } else if (kantsuCount === 4) {
        yakuList.push({ name: '四槓子', han: 13, isMenzenOnly: false, kuisaGari: false }); // treated as yakuman
    }

    // Situational Yaku passed via options
    if (options.isRinshan && options.isTsumo) {
        yakuList.push({ name: '嶺上開花', han: 1, isMenzenOnly: false, kuisaGari: false });
    }
    if (options.isChankan && !options.isTsumo) {
        yakuList.push({ name: '槍槓', han: 1, isMenzenOnly: false, kuisaGari: false });
    }
    if (options.isHaitei && options.isTsumo) {
        yakuList.push({ name: '海底摸月', han: 1, isMenzenOnly: false, kuisaGari: false });
    }
    if (options.isHoutei && !options.isTsumo) {
        yakuList.push({ name: '河底撈魚', han: 1, isMenzenOnly: false, kuisaGari: false });
    }
    if (options.isTenhou && options.isTsumo && isMenzen) {
        yakuList.push({ name: '天和', han: 13, isMenzenOnly: true, kuisaGari: false });
    }
    if (options.isChiihou && options.isTsumo && isMenzen) {
        yakuList.push({ name: '地和', han: 13, isMenzenOnly: true, kuisaGari: false });
    }

    // ================================================================
    // YAKUMAN DETECTION
    // ================================================================

    // Suuankou (四暗刻) - All four groups are concealed triplets
    if (!isChiitoitsu && !options.isNaki) {
        const ankoMelds4 = combination.filter(m =>
            m.type === 'koutsu' || (m.type === 'kantsu' && m.kanType !== 'minkan')
        );
        if (ankoMelds4.length === 4) {
            yakuList.push({ name: '四暗刻', han: 13, isMenzenOnly: false, kuisaGari: false });
        }
    }

    // Daisangen (大三元) - All three dragons as triplets
    const dragonMelds3 = combination.filter(
        m => (m.type === 'koutsu' || m.type === 'kantsu') && ['z5', 'z6', 'z7'].includes(m.tiles[0])
    );
    if (dragonMelds3.length === 3) {
        yakuList.push({ name: '大三元', han: 13, isMenzenOnly: false, kuisaGari: false });
    }

    // Tsuuiisou (字一色) - All Honors
    const allJihai = combination.every(meld => meld.tiles.every(t => t.charAt(0) === 'z'));
    if (allJihai) {
        yakuList.push({ name: '字一色', han: 13, isMenzenOnly: false, kuisaGari: false });
    }

    // Chinroutou (清老頭) - All Terminals (only 1 and 9, no honors)
    const allTerminals = combination.every(meld => meld.tiles.every(t => {
        const suit = t.charAt(0);
        const rank = parseInt(t.charAt(1), 10);
        return suit !== 'z' && (rank === 1 || rank === 9);
    }));
    if (allTerminals && !allJihai) {
        yakuList.push({ name: '清老頭', han: 13, isMenzenOnly: false, kuisaGari: false });
    }

    // Ryuuiisou (緑一色) - All Green (s2,s3,s4,s6,s8 + z6 Hatsu only)
    const greenSet = new Set(['s2', 's3', 's4', 's6', 's8', 'z6']);
    const allGreen = combination.every(meld => meld.tiles.every(t => greenSet.has(t)));
    if (allGreen) {
        yakuList.push({ name: '緑一色', han: 13, isMenzenOnly: false, kuisaGari: false });
    }

    // Kokushi Musou (国士無双) - detected via special combo type from parser
    if (combination.length === 1 && combination[0].type === 'kokushi') {
        yakuList.push({ name: '国士無双', han: 13, isMenzenOnly: true, kuisaGari: false });
    }

    // Shousushi / Daisushi (wind yakuman)
    const windSet = ['z1', 'z2', 'z3', 'z4'];
    const windTripletCount = combination.filter(
        m => (m.type === 'koutsu' || m.type === 'kantsu') && windSet.includes(m.tiles[0])
    ).length;
    const windPairExists = combination.some(
        m => m.type === 'toitsu' && windSet.includes(m.tiles[0])
    );
    if (windTripletCount === 4) {
        yakuList.push({ name: '大四喜', han: 26, isMenzenOnly: false, kuisaGari: false }); // Double yakuman
    } else if (windTripletCount === 3 && windPairExists) {
        yakuList.push({ name: '小四喜', han: 13, isMenzenOnly: false, kuisaGari: false });
    }

    // Chuurenpoutou (九蓮宝燈) - Nine Gates
    if (isMenzen && !isChiitoitsu) {
        let cSuit = null; let cOnly = true;
        const cRanks = [];
        combination.forEach(meld => meld.tiles.forEach(tile => {
            const s = tile.charAt(0);
            if (s === 'z') { cOnly = false; return; }
            if (!cSuit) cSuit = s; else if (s !== cSuit) cOnly = false;
            cRanks.push(parseInt(tile.charAt(1), 10));
        }));
        if (cOnly && cSuit) {
            const sorted = cRanks.sort((a, b) => a - b);
            const required = [1, 1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9];
            const rem = [...sorted];
            let ok = true;
            for (const r of required) {
                const idx = rem.indexOf(r);
                if (idx === -1) { ok = false; break; }
                rem.splice(idx, 1);
            }
            if (ok && rem.length === 1) {
                yakuList.push({ name: '九蓮宝燈', han: 13, isMenzenOnly: true, kuisaGari: false });
            }
        }
    }

    return yakuList;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluateYaku };
}
