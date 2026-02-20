// script.js - UI Interaction and Event Handling

// Use logic.js functions assuming they are loaded in global scope or accessible

const yakuData = [
    { name: 'リーチ', han: 1, isMenzenOnly: true, kuisaGari: false, category: '1翻' },
    { name: '一発', han: 1, isMenzenOnly: true, kuisaGari: false, category: '1翻' },
    { name: '門前清自摸和', han: 1, isMenzenOnly: true, kuisaGari: false, category: '1翻' },
    { name: '断幺九', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '平和', han: 1, isMenzenOnly: true, kuisaGari: false, category: '1翻' },
    { name: '一盃口', han: 1, isMenzenOnly: true, kuisaGari: false, category: '1翻' },
    { name: '役牌（白）', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '役牌（發）', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '役牌（中）', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '役牌（自風）', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '役牌（場風）', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '嶺上開花', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '槍槓', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },
    { name: '海底摸月・河底撈魚', han: 1, isMenzenOnly: false, kuisaGari: false, category: '1翻' },

    { name: '三色同順', han: 2, isMenzenOnly: false, kuisaGari: true, category: '2翻' },
    { name: '一気通貫', han: 2, isMenzenOnly: false, kuisaGari: true, category: '2翻' },
    { name: 'チャンタ', han: 2, isMenzenOnly: false, kuisaGari: true, category: '2翻' },
    { name: '七対子', han: 2, isMenzenOnly: true, kuisaGari: false, category: '2翻' },
    { name: '対々和', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: '三暗刻', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: '三色同刻', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: '三槓子', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: '小三元', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: '混老頭', han: 2, isMenzenOnly: false, kuisaGari: false, category: '2翻' },
    { name: 'ダブルリーチ', han: 2, isMenzenOnly: true, kuisaGari: false, category: '2翻' },

    { name: '混一色', han: 3, isMenzenOnly: false, kuisaGari: true, category: '3翻' },
    { name: '純チャン', han: 3, isMenzenOnly: false, kuisaGari: true, category: '3翻' },
    { name: '二盃口', han: 3, isMenzenOnly: true, kuisaGari: false, category: '3翻' },

    { name: '清一色', han: 6, isMenzenOnly: false, kuisaGari: true, category: '6翻' },

    { name: '役満', han: 13, isMenzenOnly: false, kuisaGari: false, category: '役満' }
];

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    attachEventListeners();
    updateYakuStatus();
});

function initUI() {
    const container = document.getElementById('yaku-container');
    container.innerHTML = ''; // clear existing

    const categories = ['1翻', '2翻', '3翻', '6翻', '役満'];

    categories.forEach(category => {
        const catYaku = yakuData.filter(y => y.category === category);
        if (catYaku.length === 0) return;

        const catDiv = document.createElement('div');
        catDiv.className = 'yaku-category';

        const title = document.createElement('div');
        title.className = 'yaku-category-title';
        title.textContent = category;
        catDiv.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'yaku-grid';

        catYaku.forEach(yaku => {
            const index = yakuData.indexOf(yaku);
            const label = document.createElement('label');
            label.className = 'yaku-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = index;
            checkbox.className = 'yaku-checkbox';

            const span = document.createElement('span');
            span.textContent = yaku.name;

            if (yaku.isMenzenOnly) {
                const tag = document.createElement('span');
                tag.className = 'tag menzen-tag';
                tag.textContent = '門前のみ';
                tag.style.marginLeft = '8px';
                tag.style.fontSize = '0.7em';
                span.appendChild(tag);
            }
            if (yaku.kuisaGari) {
                const tag = document.createElement('span');
                tag.className = 'tag kuisa-tag';
                tag.textContent = '食下り';
                tag.style.marginLeft = '8px';
                tag.style.fontSize = '0.7em';
                span.appendChild(tag);
            }

            label.appendChild(checkbox);
            label.appendChild(span);
            grid.appendChild(label);
        });

        catDiv.appendChild(grid);
        container.appendChild(catDiv);
    });
}

function attachEventListeners() {
    const btnCalculate = document.getElementById('calculate-btn');
    const nakiToggle = document.getElementById('naki-toggle');
    const doraMinus = document.getElementById('dora-minus');
    const doraPlus = document.getElementById('dora-plus');
    const doraCount = document.getElementById('dora-count');

    nakiToggle.addEventListener('change', () => {
        updateYakuStatus();
    });

    const winRadios = document.querySelectorAll('input[name="win_method"]');
    winRadios.forEach(r => r.addEventListener('change', updateYakuStatus));

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

function updateYakuStatus() {
    const isNaki = document.getElementById('naki-toggle').checked;
    const winMethod = document.querySelector('input[name="win_method"]:checked').value;

    document.querySelectorAll('.yaku-checkbox').forEach(cb => {
        const yaku = yakuData[cb.value];
        const label = cb.parentElement;

        let disabled = false;

        if (isNaki && yaku.isMenzenOnly) {
            disabled = true;
        }

        // Prevent 'Menzen Tsumo' if Ron or Naki
        if (yaku.name === '門前清自摸和') {
            if (winMethod === 'ron' || isNaki) {
                disabled = true;
                cb.checked = false; // Ensure it's unchecked if disabled
            } else {
                // Auto-check Menzen Tsumo if Tsumo and Menzen (not Naki)
                cb.checked = true;
            }
        }

        if (disabled) {
            cb.disabled = true;
            label.classList.add('disabled-yaku');
        } else {
            cb.disabled = false;
            label.classList.remove('disabled-yaku');
        }
    });
}

function performCalculation() {
    const isOya = document.getElementById('role-oya').checked;
    const isTsumo = document.getElementById('win-tsumo').checked;
    const isNaki = document.getElementById('naki-toggle').checked;
    const doraCount = parseInt(document.getElementById('dora-count').value);

    const selectedYaku = [];
    document.querySelectorAll('.yaku-checkbox:checked').forEach(cb => {
        selectedYaku.push(yakuData[cb.value]);
    });

    if (selectedYaku.length === 0) {
        alert("役を選択してください。");
        return;
    }

    // Call logic.js (must be included before script.js)
    const han = calculateHan(selectedYaku, isNaki, doraCount);
    const fu = calculateFu(selectedYaku, isNaki, isTsumo);
    const score = calculateScore(isOya, isTsumo, han, fu);

    displayResult(han, fu, score, isOya, isTsumo);
}

function displayResult(han, fu, score, isOya, isTsumo) {
    const resultContainer = document.getElementById('result-container');
    const finalScoreDisplay = document.getElementById('final-score');
    const hanFuDisplay = document.getElementById('han-fu-display');
    const detailDisplay = document.getElementById('detail-display');

    if (han === 0 || score.main === 0) {
        finalScoreDisplay.textContent = "0";
        hanFuDisplay.textContent = "役がありません";
        detailDisplay.textContent = "エラー";
        resultContainer.classList.remove('hidden');
        return;
    }

    let scoreTitle = "";
    if (han >= 13) scoreTitle = "役満";
    else if (han >= 11) scoreTitle = "三倍満";
    else if (han >= 8) scoreTitle = "倍満";
    else if (han >= 6) scoreTitle = "跳満";
    else if (han >= 5 || (han === 4 && fu === 30)) scoreTitle = "満貫";

    const titleStr = scoreTitle ? ` (${scoreTitle})` : '';
    hanFuDisplay.textContent = `${han}翻 ${fu}符${titleStr}`;

    if (isTsumo) {
        if (isOya) {
            finalScoreDisplay.textContent = `${score.main.toLocaleString()} ALL`;
            detailDisplay.textContent = `親のツモあがり`;
        } else {
            finalScoreDisplay.textContent = `${score.main.toLocaleString()} / ${score.additional.toLocaleString()}`;
            detailDisplay.textContent = `子のツモあがり (親払い ${score.additional.toLocaleString()}点 / 子払い ${score.main.toLocaleString()}点)`;
        }
    } else {
        finalScoreDisplay.textContent = score.main.toLocaleString();
        detailDisplay.textContent = `${isOya ? '親' : '子'}のロンあがり`;
    }

    resultContainer.classList.remove('hidden');
    resultContainer.classList.add('active');

    setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 50);
}
