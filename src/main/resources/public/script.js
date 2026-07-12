// ===== 家族の名前リスト（ここを実際の名前に書き換えてください） =====
const FAMILY_MEMBERS = ['陽輝', '亮真', '優月', '大真', '陽子'];

// "2026-08-13" と "15:30:00" を "2026-08/13-15:30" の形式に変換する
function formatArrivalDateTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-');
    const [hour, minute] = timeStr.split(':');
    return `${year}-${month}/${day}-${hour}:${minute}`;
}

// ページが読み込まれたら、予定一覧を取得して表示する
async function loadSchedules() {
    const response = await fetch('/schedules');
    const schedules = await response.json();

    const listElement = document.querySelector('.schedule-list');
    listElement.innerHTML = '';

    if (schedules.length === 0) {
        listElement.innerHTML = '<p class="empty-message">まだ帰省予定が登録されていません</p>';
        return;
    }

    for (const schedule of schedules) {
        const card = await createScheduleCard(schedule);
        listElement.appendChild(card);
    }
}

// 1件分の予定データから、カードのHTML要素を組み立てる
async function createScheduleCard(schedule) {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    const responsesRes = await fetch(`/schedules/${schedule.id}/responses`);
    const responses = await responsesRes.json();

    const responseTags = responses.map(r =>
        `<span class="response-tag">
            ${r.responderName}：${r.status}
            <button class="delete-response-button" data-response-id="${r.id}">×</button>
        </span>`
    ).join('');

    const memberOptions = FAMILY_MEMBERS.map(name =>
        `<option value="${name}">${name}</option>`
    ).join('');

    card.innerHTML = `
        <div class="schedule-header">
            <span class="member-name">${schedule.memberName}さん</span>
            <span class="arrival-info">${formatArrivalDateTime(schedule.arrivalDate, schedule.arrivalTime)}</span>
        </div>
        <div class="station">🧭 ${schedule.station}</div>
        ${schedule.dinnerStatus ? `<div class="dinner-status"> ${schedule.dinnerStatus}</div>` : ''}
        <div class="memo">${schedule.memo ?? ''}</div>

        <div class="pickup-section">
            <div class="response-list">${responseTags}</div>

            <!-- ① 通常表示：名前選択＋2択ボタン -->
            <div class="pickup-select-form" data-schedule-id="${schedule.id}">
                <select class="pickup-select">
                    <option value="" disabled selected>だれか迎えに行けそう？</option>
                    ${memberOptions}
                </select>
                <div class="pickup-action-buttons">
                    <button type="button" class="pickup-yes-button">迎えに行ける🚗</button>
                    <button type="button" class="pickup-no-button">迎えに行けない</button>
                </div>
            </div>

            <!-- ② 確認表示（最初は非表示） -->
            <div class="pickup-confirm-panel hidden" data-schedule-id="${schedule.id}">
                <p class="pickup-confirm-message"></p>
                <button type="button" class="pickup-confirm-button">帰省の予定確認したよ</button>
            </div>

            <!-- ③ 登録完了表示（最初は非表示） -->
            <div class="pickup-thanks hidden" data-schedule-id="${schedule.id}">
                <p class="pickup-thanks-message">✅ 回答を登録しました</p>
            </div>
        </div>
    `;

    return card;
}

// ① 「迎えに行ける」「迎えに行けない」ボタン → まだ登録せず、確認表示に切り替える
document.addEventListener('click', (event) => {
    const isYes = event.target.classList.contains('pickup-yes-button');
    const isNo = event.target.classList.contains('pickup-no-button');

    if (isYes || isNo) {
        const selectForm = event.target.closest('.pickup-select-form');
        const scheduleId = selectForm.dataset.scheduleId;
        const select = selectForm.querySelector('.pickup-select');
        const name = select.value;

        if (!name) {
            alert('お名前を選択してください');
            return;
        }

        const status = isYes ? '迎えに行ける' : '迎えに行けない';

        // 選んだ内容を、確認パネルに一時的に覚えさせておく
        const confirmPanel = document.querySelector(`.pickup-confirm-panel[data-schedule-id="${scheduleId}"]`);
        confirmPanel.dataset.responderName = name;
        confirmPanel.dataset.status = status;
        confirmPanel.querySelector('.pickup-confirm-message').textContent =
            `\n\n${name}さん：「${status}」で登録します\n\n`;

        selectForm.classList.add('hidden');
        confirmPanel.classList.remove('hidden');
    }
});

// ② 「帰省の予定確認したよ」ボタン → ここで実際にDBへ登録する
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('pickup-confirm-button')) {
        playDecisionSound();
        const confirmPanel = event.target.closest('.pickup-confirm-panel');
        const scheduleId = confirmPanel.dataset.scheduleId;
        const name = confirmPanel.dataset.responderName;
        const status = confirmPanel.dataset.status;

        await fetch(`/schedules/${scheduleId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responderName: name, status: status })
        });

        // ③ 登録完了メッセージを表示
        const thanksPanel = document.querySelector(`.pickup-thanks[data-schedule-id="${scheduleId}"]`);
        confirmPanel.classList.add('hidden');
        thanksPanel.classList.remove('hidden');

        // 少し表示してから、一覧を再取得して通常表示に戻す
        setTimeout(() => {
            loadSchedules();
        }, 1000);
    }
});

// 「×」ボタンで送迎回答を取り消す
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('delete-response-button')) {
        const responseId = event.target.dataset.responseId;

        const confirmed = confirm('この回答を取り消しますか？');
        if (!confirmed) return;

        await fetch(`/responses/${responseId}`, {
            method: 'DELETE'
        });

        loadSchedules();
    }
});

// ===== 新規予定登録フォーム関連の要素取得 =====
const addButton = document.getElementById('add-button');
const scheduleForm = document.getElementById('schedule-form');
const cancelButton = document.getElementById('cancel-button');
const memberNameSelect = document.getElementById('input-member-name');
const stationSelect = document.getElementById('input-station-select');
const stationOtherInput = document.getElementById('input-station-other');

// お名前プルダウンの選択肢を、リストから自動で作る
function populateMemberNameOptions() {
    for (const name of FAMILY_MEMBERS) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        memberNameSelect.appendChild(option);
    }
}
populateMemberNameOptions();

// 「駅・場所」で「その他」を選んだ時だけ、自由入力欄を表示する
stationSelect.addEventListener('change', () => {
    if (stationSelect.value === 'その他') {
        stationOtherInput.classList.remove('hidden');
        stationOtherInput.required = true;
    } else {
        stationOtherInput.classList.add('hidden');
        stationOtherInput.required = false;
        stationOtherInput.value = '';
    }
});

// フォームの表示・非表示を切り替える
addButton.addEventListener('click', () => {
    playSelectSound();
    scheduleForm.classList.remove('hidden');
    addButton.classList.add('hidden');
});

cancelButton.addEventListener('click', () => {
    scheduleForm.classList.add('hidden');
    addButton.classList.remove('hidden');
    scheduleForm.reset();
    stationOtherInput.classList.add('hidden');
});

// フォーム送信時の処理
scheduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    playDecisionSound();

    const station = stationSelect.value === 'その他'
        ? stationOtherInput.value
        : stationSelect.value;

    const dinnerRadio = document.querySelector('input[name="dinner-status"]:checked');
    const dinnerStatus = dinnerRadio ? dinnerRadio.value : null;

    const newSchedule = {
        memberName: memberNameSelect.value,
        arrivalDate: document.getElementById('input-arrival-date').value,
        arrivalTime: document.getElementById('input-arrival-time').value,
        station: station,
        memo: document.getElementById('input-memo').value,
        dinnerStatus: dinnerStatus
    };

    await fetch('/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
    });

    // フォームを隠して、完了メッセージを表示する
    const registeredPanel = document.getElementById('schedule-registered-panel');
    scheduleForm.classList.add('hidden');
    registeredPanel.classList.remove('hidden');
    scheduleForm.reset();
    stationOtherInput.classList.add('hidden');

    // 少し表示してから、一覧を再取得して通常表示に戻す
    setTimeout(() => {
        registeredPanel.classList.add('hidden');
        addButton.classList.remove('hidden');
        loadSchedules();
    }, 1000);
});

// ページが開かれたら実行
loadSchedules();

// ===== BGM再生 =====
const bgm = document.getElementById('bgm');
bgm.volume = 0.3;
bgm.muted = false;

const startOverlay = document.getElementById('start-overlay');
const startButton = document.getElementById('start-button');

startButton.addEventListener('click', () => {
    bgm.play().catch((error) => {
        console.log('BGM再生に失敗しました:', error);
    });
    startOverlay.classList.add('hidden');
});

// 決定音を鳴らす関数
const decisionSound = document.getElementById('decision');
function playDecisionSound() {
    decisionSound.currentTime = 0; // 連続で押されても最初から鳴らし直す
    decisionSound.play().catch((error) => {
        console.log('効果音の再生に失敗しました:', error);
    });
}

// 選択音を鳴らす関数
const selectSound = document.getElementById('select');
function playSelectSound() {
    selectSound.currentTime = 0;
    selectSound.play().catch((error) => {
        console.log('効果音の再生に失敗しました:', error);
    });
}

// 音量アイコンのボタンで、手動でもミュート切り替えできるようにする
const bgmToggleButton = document.getElementById('bgm-toggle');
bgmToggleButton.addEventListener('click', () => {
    bgm.muted = !bgm.muted;
    bgmToggleButton.textContent = bgm.muted ? '🔇' : '🔊';
    if (!bgm.muted) {
        bgm.play();
    }
});