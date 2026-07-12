// ページが読み込まれたら、予定一覧を取得して表示する
async function loadSchedules() {
    const response = await fetch('/schedules');
    const schedules = await response.json();

    const listElement = document.querySelector('.schedule-list');
    listElement.innerHTML = ''; // 一旦空にする（固定表示だった太郎さんのカードを消す）

    // 予定が1件もない場合のメッセージ
    if (schedules.length === 0) {
        listElement.innerHTML = '<p class="empty-message">まだ帰省予定が登録されていません</p>';
        return;
    }

    // 予定を1件ずつカードとして組み立てる
    for (const schedule of schedules) {
        const card = await createScheduleCard(schedule);
        listElement.appendChild(card);
    }
}

// 1件分の予定データから、カードのHTML要素を組み立てる
async function createScheduleCard(schedule) {
    const card = document.createElement('div');
    card.className = 'schedule-card';

    // この予定に対する送迎回答も取得する
    const responsesRes = await fetch(`/schedules/${schedule.id}/responses`);
    const responses = await responsesRes.json();

    // 回答一覧をタグ形式のHTMLに変換
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

        // 本来は名前を入力してもらう部分ですが、まずは簡易的にpromptで確認
        const name = prompt('あなたの名前を入力してください');
        if (!name) return;

        await fetch(`/schedules/${scheduleId}/responses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ responderName: name, status: '行けるよ' })
        });

        loadSchedules(); // 一覧を再取得して画面を更新
    }
});

// ページが開かれたら実行
loadSchedules();