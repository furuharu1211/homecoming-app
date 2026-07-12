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
        `<span class="response-tag">${r.responderName}：${r.status}</span>`
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

// フォームの表示・非表示を切り替える
const addButton = document.getElementById('add-button');
const scheduleForm = document.getElementById('schedule-form');
const cancelButton = document.getElementById('cancel-button');

addButton.addEventListener('click', () => {
    scheduleForm.classList.remove('hidden');
    addButton.classList.add('hidden');
});

cancelButton.addEventListener('click', () => {
    scheduleForm.classList.add('hidden');
    addButton.classList.remove('hidden');
    scheduleForm.reset();
});

// フォーム送信時の処理
scheduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const newSchedule = {
        memberName: document.getElementById('input-member-name').value,
        arrivalDate: document.getElementById('input-arrival-date').value,
        arrivalTime: document.getElementById('input-arrival-time').value,
        station: document.getElementById('input-station').value,
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
    loadSchedules();
});

// ページが開かれたら実行
loadSchedules();