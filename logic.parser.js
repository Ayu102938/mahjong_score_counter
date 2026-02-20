// logic.parser.js - Mahjong Hand Parser

/**
 * Parses a 14-tile hand array and returns all valid combinations of Melds (Sets) and a Pair.
 * A returned combination array contains standard objects: { type: 'shuntsu'|'koutsu'|'toitsu', tiles: string[] }
 * @param {string[]} handTiles Array of 14 tiles (e.g., ['m1', 'm2', 'm3', ...])
 * @returns {Array<Array<{type: string, tiles: string[]}>>} Array of possible valid hand structures
 */
function parseHand(handTiles) {
    if (handTiles.length !== 14) return [];

    const tileCounts = {};
    for (const tile of handTiles) {
        tileCounts[tile] = (tileCounts[tile] || 0) + 1;
    }

    const uniqueTiles = Object.keys(tileCounts);
    const results = [];

    // Check for Seven Pairs (Chiitoitsu)
    let isChiitoitsu = true;
    for (const tile of uniqueTiles) {
        if (tileCounts[tile] !== 2) {
            isChiitoitsu = false;
            break;
        }
    }

    if (uniqueTiles.length === 7 && isChiitoitsu) {
        const chiitoitsuMeld = uniqueTiles.map(tile => ({
            type: 'toitsu',
            tiles: [tile, tile]
        }));
        results.push(chiitoitsuMeld);
    }

    // Check for standard hand (4 melds + 1 pair)
    // Convert counts to an array format suitable for easily extracting melds
    // Tiles are assumed to be 2 chars: suit + rank (e.g. m1, p9, z3)

    const suits = ['m', 'p', 's', 'z'];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // Helper: Build a consistent array of available tiles count [suit][rank]
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

    function addToitsu(s, r) {
        tileMap[s][r] += 2;
    }

    function removeKoutsu(s, r) {
        if (tileMap[s][r] >= 3) {
            tileMap[s][r] -= 3;
            return { type: 'koutsu', tiles: [s + r, s + r, s + r] };
        }
        return null;
    }

    function addKoutsu(s, r) {
        tileMap[s][r] += 3;
    }

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

    // Backtracking function to find all sets of melds
    function findMelds(meldCount, currentCombo) {
        if (meldCount === 4) {
            // Found a valid 4-meld + 1-pair combo
            results.push([...currentCombo]);
            return;
        }

        // Search for the next available tile to form a meld
        for (let s of suits) {
            for (let r = 1; r <= 9; r++) {
                if (tileMap[s][r] > 0) {

                    // Try Koutsu
                    const koutsu = removeKoutsu(s, r);
                    if (koutsu) {
                        currentCombo.push(koutsu);
                        findMelds(meldCount + 1, currentCombo);
                        currentCombo.pop();
                        addKoutsu(s, r);
                    }

                    // Try Shuntsu
                    const shuntsu = removeShuntsu(s, r);
                    if (shuntsu) {
                        currentCombo.push(shuntsu);
                        findMelds(meldCount + 1, currentCombo);
                        currentCombo.pop();
                        addShuntsu(s, r);
                    }

                    // Once we find the first tile, we MUST use it in a meld, otherwise this path is invalid.
                    // Returning here ensures we don't skip over remaining tiles.
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
                // If pair removed, search for 4 melds
                findMelds(0, [toitsu]);
                addToitsu(s, r);
            }
        }
    }

    return results;
}

module.exports = {
    parseHand
};
