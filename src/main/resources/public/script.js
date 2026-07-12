// ===== 家族の名前リスト（ここを実際の名前に書き換えてください） =====
const FAMILY_MEMBERS = ['大真', '陽子', '陽輝', '亮真', '優月'];

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

    card.innerHTML = `
        <div class="schedule-header">
            <span class="member-name">${schedule.memberName}さん</span>
            <span class="arrival-info">${schedule.arrivalDate} ${schedule.arrivalTime}</span>
        </div>
        <div class="station">📍 ${schedule.station}</div>
        <div class="memo">${schedule.memo ?? ''}</div>

        <div class="pickup-section">
            <div class="response-list">${responseTags}</div>
            <button class="pickup-button" data-schedule-id="${schedule.id}">迎えに行けるよ</button>
        </div>
    `;

    return card;
}

// 「迎えに行けるよ」ボタンが押されたときの処理
document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('pickup-button')) {
        const scheduleId = event.target.dataset.scheduleId;

        const name = prompt('あなたの名前を入力してください');
        if (!name) return;

        await fetch(`/schedules/${scheduleId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responderName: name, status: '行けるよ' })
        });

        loadSchedules();
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

// ===== フォーム関連の要素取得 =====
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

    // 「駅・場所」は、プルダウンが「その他」ならその自由入力欄の値を使う
    const station = stationSelect.value === 'その他'
        ? stationOtherInput.value
        : stationSelect.value;

    const newSchedule = {
        memberName: memberNameSelect.value,
        arrivalDate: document.getElementById('input-arrival-date').value,
        arrivalTime: document.getElementById('input-arrival-time').value,
        station: station,
        memo: document.getElementById('input-memo').value
    };

    await fetch('/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
    });

    scheduleForm.classList.add('hidden');
    addButton.classList.remove('hidden');
    scheduleForm.reset();
    stationOtherInput.classList.add('hidden');
    loadSchedules();
});

// ページが開かれたら実行
loadSchedules();