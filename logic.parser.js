// logic.parser.js - Mahjong Hand Parser

function normalizeTile(t) {
    if (t.length === 2 && ['m', 'p', 's', 'z'].includes(t[1])) {
        return t[1] + t[0];
    }
    return t;
}

/**
 * Parses a 14-18 tile hand array and returns all valid combinations of Melds (Sets) and a Pair.
 * @param {string[]} handTiles Array of tiles (e.g., ['m1', 'm2', 'm3', ...] or ['1m', '2m', ...])
 * @param {Array<{id: string, type: string}>} kans Array of declared kans (e.g., [{id: '1m', type: 'ankan'}])
 * @returns {Array<Array<{type: string, kanType?: string, tiles: string[]}>>}
 */
function parseHand(handTiles, kans = []) {
    if (handTiles.length < 14 || handTiles.length > 18) return [];

    const normHand = handTiles.map(normalizeTile);
    const tileCounts = {};
    for (const tile of normHand) {
        tileCounts[tile] = (tileCounts[tile] || 0) + 1;
    }

    const declaredKantsu = [];
    for (const kan of kans) {
        let kanTile = normalizeTile(kan.id);
        if (tileCounts[kanTile] >= 4) {
            tileCounts[kanTile] -= 4;
            declaredKantsu.push({ type: 'kantsu', kanType: kan.type, tiles: [kanTile, kanTile, kanTile, kanTile] });
        }
    }

    const uniqueTiles = Object.keys(tileCounts).filter(t => tileCounts[t] > 0);
    const results = [];

    // Chiitoitsu (Seven Pairs) - only valid for 14 tile un-kanned hands mathematically but explicitly checked
    let isChiitoitsu = true;
    for (const tile of uniqueTiles) {
        if (tileCounts[tile] !== 2) {
            isChiitoitsu = false;
            break;
        }
    }

    if (normHand.length === 14 && uniqueTiles.length === 7 && isChiitoitsu && kans.length === 0) {
        const chiitoitsuMeld = uniqueTiles.map(tile => ({
            type: 'toitsu',
            tiles: [tile, tile]
        }));
        results.push(chiitoitsuMeld);
    }

    const suits = ['m', 'p', 's', 'z'];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Build available tiles count
    const tileMap = { m: [], p: [], s: [], z: [] };
    for (let s of suits) {
        for (let r = 1; r <= 9; r++) {
            tileMap[s][r] = tileCounts[s + r] || 0;
        }
    }

    function removeToitsu(s, r) {
        if (tileMap[s][r] >= 2) {
            tileMap[s][r] -= 2;
            return { type: 'toitsu', tiles: [s + r, s + r] };
        }
        return null;
    }

    function addToitsu(s, r) { tileMap[s][r] += 2; }

    function removeKantsu(s, r) {
        if (tileMap[s][r] >= 4) {
            tileMap[s][r] -= 4;
            return { type: 'kantsu', kanType: 'ankan', tiles: [s + r, s + r, s + r, s + r] };
        }
        return null;
    }

    function addKantsu(s, r) { tileMap[s][r] += 4; }

    function removeKoutsu(s, r) {
        if (tileMap[s][r] >= 3) {
            tileMap[s][r] -= 3;
            return { type: 'koutsu', tiles: [s + r, s + r, s + r] };
        }
        return null;
    }

    function addKoutsu(s, r) { tileMap[s][r] += 3; }

    function removeShuntsu(s, r) {
        if (s !== 'z' && r <= 7 && tileMap[s][r] >= 1 && tileMap[s][r + 1] >= 1 && tileMap[s][r + 2] >= 1) {
            tileMap[s][r]--;
            tileMap[s][r + 1]--;
            tileMap[s][r + 2]--;
            return { type: 'shuntsu', tiles: [s + r, s + (r + 1), s + (r + 2)] };
        }
        return null;
    }

    function addShuntsu(s, r) {
        tileMap[s][r]++;
        tileMap[s][r + 1]++;
        tileMap[s][r + 2]++;
    }

    function findMelds(meldCount, currentCombo) {
        if (meldCount === 4) {
            let tilesUsed = 0;
            for (const item of currentCombo) {
                tilesUsed += item.tiles.length;
            }
            if (tilesUsed === normHand.length) {
                results.push([...currentCombo]);
            }
            return;
        }

        for (let s of suits) {
            for (let r = 1; r <= 9; r++) {
                if (tileMap[s][r] > 0) {
                    const shuntsu = removeShuntsu(s, r);
                    if (shuntsu) {
                        currentCombo.push(shuntsu);
                        findMelds(meldCount + 1, currentCombo);
                        currentCombo.pop();
                        addShuntsu(s, r);
                    }

                    const koutsu = removeKoutsu(s, r);
                    if (koutsu) {
                        currentCombo.push(koutsu);
                        findMelds(meldCount + 1, currentCombo);
                        currentCombo.pop();
                        addKoutsu(s, r);
                    }

                    const kantsu = removeKantsu(s, r);
                    if (kantsu) {
                        currentCombo.push(kantsu);
                        findMelds(meldCount + 1, currentCombo);
                        currentCombo.pop();
                        addKantsu(s, r);
                    }

                    return;
                }
            }
        }
    }

    // Try all possible Toitsu (Pairs)
    for (let s of suits) {
        for (let r = 1; r <= 9; r++) {
            const toitsu = removeToitsu(s, r);
            if (toitsu) {
                findMelds(declaredKantsu.length, [toitsu, ...declaredKantsu]);
                addToitsu(s, r);
            }
        }
    }

    return results;
}

module.exports = {
    parseHand
};
