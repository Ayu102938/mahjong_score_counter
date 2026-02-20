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

const MAX_BASE_HAND_SIZE = 14;
let currentHand = []; // Array of tile objects: { id: '1m', isKan: false, kanType: null }
let kanCount = 0; // Number of kans in hand

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
    const tilesOfSameId = currentHand.filter(t => t.id === tileId);
    if (tilesOfSameId.length >= 4) {
        alert("同じ牌は4枚までしか選べません。");
        return;
    }

    const currentMaxHandSize = MAX_BASE_HAND_SIZE + kanCount;

    if (currentHand.length < currentMaxHandSize) {
        currentHand.push({ id: tileId, isKan: false, kanType: null });
        sortHand();
        updateHandDisplay();

        setTimeout(() => checkAndPromptKan(tileId), 50);
    } else {
        alert(`現在の手牌は最大${currentMaxHandSize}枚までです。`);
    }
}

function sortHand() {
    currentHand.sort((a, b) => {
        const suitOrder = { 'm': 1, 'p': 2, 's': 3, 'z': 4 };
        const orderA = suitOrder[a.id[1]] * 100 + parseInt(a.id[0]);
        const orderB = suitOrder[b.id[1]] * 100 + parseInt(b.id[0]);
        return orderA - orderB;
    });
}

function checkAndPromptKan(tileId) {
    const tilesOfSameId = currentHand.filter(t => t.id === tileId);
    if (tilesOfSameId.length === 4 && !tilesOfSameId[0].isKan) {
        const confirmKan = confirm(`「${TILE_SYMBOLS[tileId]}」が4枚揃いました。カン（槓）扱いにしますか？\nOK: 暗槓/明槓にする\nキャンセル: カンしない（そのまま4枚持ち）`);
        if (confirmKan) {
            const isAnkan = confirm(`暗槓（アンカン）ですか？\nOK: 暗槓\nキャンセル: 明槓（ミンカン）`);

            // Mark all 4 as Kan part
            currentHand.forEach(t => {
                if (t.id === tileId) {
                    t.isKan = true;
                    t.kanType = isAnkan ? 'ankan' : 'minkan';
                }
            });
            kanCount++;
            updateHandDisplay();
        }
    }
}

function removeTileFromHand(index) {
    const tileToRemove = currentHand[index];

    if (tileToRemove.isKan) {
        kanCount--;
        currentHand.forEach(t => {
            if (t.id === tileToRemove.id && t.isKan) {
                t.isKan = false;
                t.kanType = null;
            }
        });
    }

    currentHand.splice(index, 1);
    updateHandDisplay();
}

function updateHandDisplay() {
    const handContainer = document.getElementById('hand-container');
    const handCountEl = document.getElementById('hand-count');

    handContainer.innerHTML = '';

    let prevKanGroup = null;
    let kanGroupDiv = null;

    currentHand.forEach((tileObj, index) => {
        const tileId = tileObj.id;
        const suitType = tileId.charAt(1);
        const suitName = suitType === 'm' ? 'manzu' : suitType === 'p' ? 'pinzu' : suitType === 's' ? 'souzu' : 'jihai';

        const tileEl = createTileElement(tileId, suitName);
        tileEl.addEventListener('click', () => removeTileFromHand(index));

        if (tileObj.isKan) {
            if (prevKanGroup !== tileId) {
                kanGroupDiv = document.createElement('div');
                kanGroupDiv.className = `kan-group ${tileObj.kanType}`;
                handContainer.appendChild(kanGroupDiv);
                prevKanGroup = tileId;
            }

            if (tileObj.kanType === 'ankan' && (kanGroupDiv.childNodes.length === 0 || kanGroupDiv.childNodes.length === 3)) {
                tileEl.innerHTML = '';
                tileEl.classList.add('face-down');
                tileEl.className = 'tile face-down';
            }

            kanGroupDiv.appendChild(tileEl);
        } else {
            prevKanGroup = null;
            const slotEl = document.createElement('div');
            slotEl.className = 'hand-slot filled';
            slotEl.appendChild(tileEl);
            handContainer.appendChild(slotEl);
        }
    });

    const currentMaxHandSize = MAX_BASE_HAND_SIZE + kanCount;
    const maxVisibleSlots = MAX_BASE_HAND_SIZE + kanCount;

    const emptySlots = maxVisibleSlots - currentHand.length;
    for (let i = 0; i < emptySlots; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'hand-slot';
        handContainer.appendChild(slotEl);
    }

    handCountEl.textContent = `${currentHand.length} / ${currentMaxHandSize}`;

    if (currentHand.length === currentMaxHandSize) {
        handCountEl.style.color = 'var(--accent-color)';
    } else {
        handCountEl.style.color = 'var(--accent-gold)';
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
        kanCount = 0;
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

    const nakiToggle = document.getElementById('naki-toggle');
    const optRiichi = document.getElementById('opt-riichi');
    const optIppatsu = document.getElementById('opt-ippatsu');
    const optDoubleRiichi = document.getElementById('opt-double-riichi');

    nakiToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            optRiichi.checked = false;
            optIppatsu.checked = false;
            optDoubleRiichi.checked = false;
            optRiichi.disabled = true;
            optIppatsu.disabled = true;
            optDoubleRiichi.disabled = true;
        } else {
            optRiichi.disabled = false;
            optIppatsu.disabled = false;
            optDoubleRiichi.disabled = false;
        }
    });

    btnCalculate.addEventListener('click', performCalculation);
}

function performCalculation() {
    const isOya = document.getElementById('role-oya').checked;
    const isTsumo = document.getElementById('win-tsumo').checked;
    const isNaki = document.getElementById('naki-toggle').checked;
    const doraCount = parseInt(document.getElementById('dora-count').value);
    const isRiichi = document.getElementById('opt-riichi').checked;
    const isIppatsu = document.getElementById('opt-ippatsu').checked;
    const isDoubleRiichi = document.getElementById('opt-double-riichi').checked;
    const isRinshan = document.getElementById('opt-rinshan').checked;
    const isChankan = document.getElementById('opt-chankan').checked;
    const haiteiEl = document.getElementById('opt-haitei');
    const isHaitei = haiteiEl.checked && isTsumo;
    const isHoutei = haiteiEl.checked && !isTsumo;
    const tenhouEl = document.getElementById('opt-tenhou');
    const isTenhou = tenhouEl.checked && isOya && isTsumo;
    const isChiihou = tenhouEl.checked && !isOya && isTsumo;
    const oyaKaze = document.getElementById('select-bakaze').value;
    const jikaze = document.getElementById('select-jikaze').value;

    const currentMaxHandSize = MAX_BASE_HAND_SIZE + kanCount;

    if (currentHand.length !== currentMaxHandSize) {
        alert(`手牌を${currentMaxHandSize}枚（和了牌含む）完成させてください。`);
        return;
    }

    const handStrArray = currentHand.map(t => t.id);
    const kans = currentHand.filter(t => t.isKan).reduce((acc, curr) => {
        if (!acc.some(k => k.id === curr.id)) {
            acc.push({ id: curr.id, type: curr.kanType });
        }
        return acc;
    }, []);

    const payload = {
        hand: handStrArray,
        kans: kans,
        isOya: isOya,
        isTsumo: isTsumo,
        isNaki: isNaki,
        doraCount: doraCount,
        isRiichi: isRiichi,
        isIppatsu: isIppatsu,
        isDoubleRiichi: isDoubleRiichi,
        isRinshan: isRinshan,
        isChankan: isChankan,
        isHaitei: isHaitei,
        isHoutei: isHoutei,
        isTenhou: isTenhou,
        isChiihou: isChiihou,
        oyaKaze: oyaKaze,
        jikaze: jikaze
    };

    try {
        if (typeof calculateMahjongScore === 'function') {
            const result = calculateMahjongScore(payload);
            displayResult(result, isOya, isTsumo);
        } else {
            console.error("calculateMahjongScore function not found in logic.js");
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
    const yakuListDisplay = document.getElementById('yaku-list-display');

    // Clear previous yaku chips
    yakuListDisplay.innerHTML = '';

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

    // Render yaku chips
    if (result.yaku && result.yaku.length > 0) {
        const isYakuman = result.han >= 13;
        result.yaku.forEach(yakuName => {
            const chip = document.createElement('span');
            chip.className = 'yaku-tag' + (isYakuman ? ' yakuman' : '');
            chip.textContent = yakuName;
            yakuListDisplay.appendChild(chip);
        });
    }

    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('active');

    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
}
