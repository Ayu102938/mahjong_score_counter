// script.js - Hand Builder UI Interaction and Event Handling

// Define tiles for the picker
const TILES = {
    manzu: ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m'],
    pinzu: ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'],
    souzu: ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'],
    jihai: ['1z', '2z', '3z', '4z', '5z', '6z', '7z']
};

const TILE_SYMBOLS = {
    '1m': '一', '2m': '二', '3m': '三', '4m': '四', '5m': '五', '6m': '六', '7m': '七', '8m': '八', '9m': '九',
    '1p': '①', '2p': '②', '3p': '③', '4p': '④', '5p': '⑤', '6p': '⑥', '7p': '⑦', '8p': '⑧', '9p': '⑨',
    '1s': '1', '2s': '2', '3s': '3', '4s': '4', '5s': '5', '6s': '6', '7s': '7', '8s': '8', '9s': '9',
    '1z': '東', '2z': '南', '3z': '西', '4z': '北', '5z': '白', '6z': '發', '7z': '中'
};

const SUIT_CHARS = {
    'm': '萬', 'p': '筒', 's': '索', 'z': ''
};

const MAX_HAND_SIZE = 14;
let currentHand = []; // Array of tile IDs (e.g. ['1m', '2p', '1z'])

document.addEventListener('DOMContentLoaded', () => {
    initHandBuilderUI();
    attachEventListeners();
    updateHandDisplay();
});

function initHandBuilderUI() {
    const tilePicker = document.getElementById('tile-picker');
    tilePicker.innerHTML = '';

    // Create rows for each suit
    Object.entries(TILES).forEach(([suitName, tiles]) => {
        const row = document.createElement('div');
        row.className = 'suit-row';

        tiles.forEach(tileId => {
            const tileEl = createTileElement(tileId, suitName);
            // Click to add to hand
            tileEl.addEventListener('click', () => addTileToHand(tileId));
            row.appendChild(tileEl);
        });

        tilePicker.appendChild(row);
    });
}

function createTileElement(tileId, suitName) {
    const el = document.createElement('div');
    el.className = `tile ${suitName}`;
    el.dataset.id = tileId;

    const symbol = TILE_SYMBOLS[tileId];
    const suitType = tileId.charAt(1);

    el.innerHTML = `
        <span>${symbol}</span>
        ${suitName !== 'jihai' ? `<span class="suit-char">${SUIT_CHARS[suitType]}</span>` : ''}
    `;
    return el;
}

function addTileToHand(tileId) {
    // A specific identical tile can only exist 4 times in mahjong
    const countInHand = currentHand.filter(t => t === tileId).length;
    if (countInHand >= 4) {
        alert("同じ牌は4枚までしか選べません。");
        return;
    }

    if (currentHand.length < MAX_HAND_SIZE) {
        currentHand.push(tileId);
        // Sort hand for better UX: Manzu -> Pinzu -> Souzu -> Jihai, then by number
        currentHand.sort((a, b) => {
            const suitOrder = { 'm': 1, 'p': 2, 's': 3, 'z': 4 };
            const orderA = suitOrder[a[1]] * 100 + parseInt(a[0]);
            const orderB = suitOrder[b[1]] * 100 + parseInt(b[0]);
            return orderA - orderB;
        });
        updateHandDisplay();
    } else {
        alert("手牌は最大14枚までです。");
    }
}

function removeTileFromHand(index) {
    currentHand.splice(index, 1);
    updateHandDisplay();
}

function updateHandDisplay() {
    const handContainer = document.getElementById('hand-container');
    const handCount = document.getElementById('hand-count');

    handContainer.innerHTML = '';

    // Render current tiles
    currentHand.forEach((tileId, index) => {
        const suitType = tileId.charAt(1);
        const suitName = suitType === 'm' ? 'manzu' : suitType === 'p' ? 'pinzu' : suitType === 's' ? 'souzu' : 'jihai';

        const slotEl = document.createElement('div');
        slotEl.className = 'hand-slot filled';

        const tileEl = createTileElement(tileId, suitName);
        // Click to remove
        tileEl.addEventListener('click', () => removeTileFromHand(index));

        slotEl.appendChild(tileEl);
        handContainer.appendChild(slotEl);
    });

    // Render empty slots
    const emptySlots = MAX_HAND_SIZE - currentHand.length;
    for (let i = 0; i < emptySlots; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'hand-slot';
        handContainer.appendChild(slotEl);
    }

    handCount.textContent = `${currentHand.length} / ${MAX_HAND_SIZE}`;

    if (currentHand.length === MAX_HAND_SIZE) {
        handCount.style.color = 'var(--accent-color)';
    } else {
        handCount.style.color = 'var(--accent-gold)';
    }
}

function attachEventListeners() {
    const btnCalculate = document.getElementById('calculate-btn');
    const clearBtn = document.getElementById('clear-hand-btn');
    const doraMinus = document.getElementById('dora-minus');
    const doraPlus = document.getElementById('dora-plus');
    const doraCount = document.getElementById('dora-count');

    clearBtn.addEventListener('click', () => {
        currentHand = [];
        updateHandDisplay();
    });

    doraMinus.addEventListener('click', () => {
        let val = parseInt(doraCount.value);
        if (val > 0) doraCount.value = val - 1;
    });

    doraPlus.addEventListener('click', () => {
        let val = parseInt(doraCount.value);
        if (val < 13) doraCount.value = val + 1;
    });

    btnCalculate.addEventListener('click', performCalculation);
}

function performCalculation() {
    const isOya = document.getElementById('role-oya').checked;
    const isTsumo = document.getElementById('win-tsumo').checked;
    const isNaki = document.getElementById('naki-toggle').checked;
    const doraCount = parseInt(document.getElementById('dora-count').value);

    if (currentHand.length !== 14) {
        alert("手牌を14枚（和了牌含む）完成させてください。");
        return;
    }

    // Call logic.js to determine yaku and score
    // Prepare payload
    const payload = {
        hand: currentHand,
        isOya: isOya,
        isTsumo: isTsumo,
        isNaki: isNaki,
        doraCount: doraCount
    };

    try {
        if (typeof calculateMahjongScore === 'function') {
            const result = calculateMahjongScore(payload);
            displayResult(result, isOya, isTsumo);
        } else {
            console.error("calculateMahjongScore function not found in logic.js");
            // Fallback display if logic.js is not fully implemented yet
            displayResult({
                han: 0,
                fu: 0,
                score: { main: 0, additional: 0 },
                yaku: []
            }, isOya, isTsumo);
        }
    } catch (e) {
        console.error("Error during calculation", e);
        alert("計算中にエラーが発生しました。");
    }
}

function displayResult(result, isOya, isTsumo) {
    const resultContainer = document.getElementById('result-container');
    const finalScoreDisplay = document.getElementById('final-score');
    const hanFuDisplay = document.getElementById('han-fu-display');
    const detailDisplay = document.getElementById('detail-display');

    if (!result || result.han === 0 || result.score.main === 0) {
        finalScoreDisplay.textContent = "0";
        hanFuDisplay.textContent = "役がありません（または判定未実装）";
        detailDisplay.textContent = "条件を満たしていません";
        resultContainer.classList.remove('hidden');
        resultContainer.classList.add('active');
        return;
    }

    let scoreTitle = "";
    if (result.han >= 13) scoreTitle = "役満";
    else if (result.han >= 11) scoreTitle = "三倍満";
    else if (result.han >= 8) scoreTitle = "倍満";
    else if (result.han >= 6) scoreTitle = "跳満";
    else if (result.han >= 5 || (result.han === 4 && result.fu === 30)) scoreTitle = "満貫";

    const titleStr = scoreTitle ? ` (${scoreTitle})` : '';
    hanFuDisplay.textContent = `${result.han}翻 ${result.fu}符${titleStr}`;

    if (isTsumo) {
        if (isOya) {
            finalScoreDisplay.textContent = `${result.score.main.toLocaleString()} ALL`;
            detailDisplay.textContent = `親のツモあがり`;
        } else {
            finalScoreDisplay.textContent = `${result.score.main.toLocaleString()} / ${result.score.additional.toLocaleString()}`;
            detailDisplay.textContent = `子のツモあがり (親払い ${result.score.additional.toLocaleString()}点 / 子払い ${result.score.main.toLocaleString()}点)`;
        }
    } else {
        finalScoreDisplay.textContent = result.score.main.toLocaleString();
        detailDisplay.textContent = `${isOya ? '親' : '子'}のロンあがり`;
    }

    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('active');

    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
}
