/* 复习 — SM-2 闪卡 */
UI.register('review', async (slot) => {
  slot.innerHTML = `
    <div class="wrap" style="padding-top:30px">
      <div class="page-head rise">
        <div>
          <h1>${T('rv.title')}</h1>
          <p>${T('rv.subtitle')}</p>
        </div>
      </div>
      <div class="stats-row rise">
        <div class="stat-card">
          <span class="stat-ic ic-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="rvDue">0</span><span class="stat-label">${T('rv.dueToday')}</span></div>
        </div>
        <div class="stat-card">
          <span class="stat-ic ic-indigo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="rvTotal">0</span><span class="stat-label">${T('rv.totalBank')}</span></div>
        </div>
        <div class="stat-card">
          <span class="stat-ic ic-green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="rvMastered">--</span><span class="stat-label">${T('rv.mastery')}</span></div>
        </div>
      </div>
      <div class="card rise" style="margin-bottom:var(--gap)">
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <select class="select" id="rvCourseSelect" style="flex:1"><option value="">${T('rv.selectCourse')}</option></select>
          <button class="btn" onclick="UI.rvGenerate()">${T('rv.genQuiz')}</button>
          <button class="btn btn-primary" onclick="UI.rvStart()">${T('rv.startReview')}</button>
        </div>
        <div id="rvStatus" style="font-size:12px;margin-bottom:16px"></div>
        <div id="rvArea"></div>
      </div>
    </div>`;

  UI.rvState = { queue: [], index: 0, answers: {} };
  try {
    const r = await eel.api_list_courses()();
    const s = UI.$('#rvCourseSelect');
    if (r.success) {
      s.innerHTML = `<option value="">${T('rv.selectCourse')}</option>` + r.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    await UI.rvRefreshStats();
  } catch (e) {}
});

UI.rvRefreshStats = async function() {
  try {
    const cid = UI.$('#rvCourseSelect').value || null;
    const r = await eel.api_get_review_stats(cid)();
    if (r.success) {
      UI.$('#rvDue').textContent = r.stats.due_today;
      UI.$('#rvTotal').textContent = r.stats.total;
    }
  } catch (e) {}
};

UI.rvGenerate = async function() {
  const cid = UI.$('#rvCourseSelect').value;
  if (!cid) return alert(T('rv.pickFirst'));
  UI.$('#rvStatus').textContent = T('rv.generating');
  const r = await eel.api_generate_quizzes(parseInt(cid))();
  if (r.success) {
    UI.$('#rvStatus').textContent = T('rv.generated', { count: r.count });
    UI.$('#rvStatus').style.color = 'var(--green)';
  } else {
    UI.$('#rvStatus').textContent = r.error;
    UI.$('#rvStatus').style.color = 'var(--red)';
  }
  UI.rvRefreshStats();
};

UI.rvStart = async function() {
  const cid = UI.$('#rvCourseSelect').value || null;
  const r = await eel.api_get_due_reviews(cid)();
  if (!r.success || !r.reviews || r.reviews.length === 0) {
    UI.$('#rvStatus').textContent = T('rv.noneDue');
    UI.$('#rvStatus').style.color = 'var(--text-tertiary)';
    UI.$('#rvArea').innerHTML = '';
    return;
  }
  UI.rvState = { queue: r.reviews, index: 0, answers: {} };
  UI.$('#rvStatus').textContent = '';
  UI.rvRender();
};

UI.rvRender = function() {
  const s = UI.rvState;
  if (s.index >= s.queue.length) return UI.rvSummary();
  const q = s.queue[s.index];
  const area = UI.$('#rvArea');
  let h = `<div class="card card--lift">
    <div style="display:flex;justify-content:space-between;margin-bottom:16px">
      <span style="font-size:12px;color:var(--text-tertiary)">${T('rv.questionNo', { i: s.index + 1, n: s.queue.length })}</span>
      <span class="badge badge-accent">${q.difficulty}</span>
    </div>
    <div style="font-size:16px;font-weight:600;margin-bottom:20px">${UI.esc(q.question)}</div>`;
  if (q.options) {
    for (let i = 0; i < q.options.length; i++) {
      h += `<div style="padding:12px 16px;border-radius:12px;background:var(--bg-input);border:1px solid var(--border-subtle);margin-bottom:8px;cursor:pointer;transition:all 0.15s"
        onmouseover="this.style.borderColor='var(--border-strong)'" onmouseout="this.style.borderColor='var(--border-subtle)'"
        onclick="UI.rvSelect(${i})"><span style="font-weight:600;color:var(--accent)">${String.fromCharCode(65+i)}</span> ${UI.esc(q.options[i])}</div>`;
    }
  } else {
    h += `<input class="input" id="rvFill" placeholder="${T('rv.fillPlaceholder')}" onkeydown="if(event.key==='Enter')UI.rvSubmitFill()">
      <button class="btn btn-sm" style="margin-top:12px" onclick="UI.rvSubmitFill()">${T('rv.submit')}</button>`;
  }
  h += `<div id="rvFeedback" style="margin-top:20px"></div></div>`;
  area.innerHTML = h;
};

UI.rvSelect = function(idx) {
  const q = UI.rvState.queue[UI.rvState.index];
  const correct = String.fromCharCode(65 + idx) === q.answer;
  UI.rvState.answers[UI.rvState.index] = correct;
  UI.rvFeedback(correct, q);
};

UI.rvSubmitFill = function() {
  const q = UI.rvState.queue[UI.rvState.index];
  const val = UI.$('#rvFill').value.trim();
  const correct = val === q.answer;
  UI.rvState.answers[UI.rvState.index] = correct;
  UI.rvFeedback(correct, q);
};

UI.rvFeedback = function(correct, q) {
  const fb = UI.$('#rvFeedback');
  fb.innerHTML = `
    <div style="padding:16px;border-radius:12px;background:${correct ? 'var(--green-muted)' : 'var(--red-muted)'}">
      <div style="font-weight:600;color:${correct ? 'var(--green)' : 'var(--red)'};margin-bottom:8px">${correct ? T('rv.correct') : T('rv.wrong')}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${T('rv.answer', { ans: q.answer })}</div>
      ${q.explanation ? `<div style="font-size:12px;color:var(--text-tertiary)">${UI.esc(q.explanation)}</div>` : ''}
      <div style="font-size:12px;color:var(--text-tertiary);margin-top:16px">${T('rv.rateLabel')}</div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-sm" onclick="UI.rvRate(0)">${T('rv.forget')}</button>
        <button class="btn btn-sm" onclick="UI.rvRate(3)">${T('rv.fuzzy')}</button>
        <button class="btn btn-primary btn-sm" onclick="UI.rvRate(5)">${T('rv.remember')}</button>
      </div>
    </div>`;
};

UI.rvRate = async function(quality) {
  const quiz = UI.rvState.queue[UI.rvState.index];
  await eel.api_submit_review(quiz.review_id, quality)();
  UI.rvState.index++;
  UI.rvRender();
  UI.rvRefreshStats();
};

UI.rvSummary = function() {
  let c = 0;
  for (let k in UI.rvState.answers) if (UI.rvState.answers[k]) c++;
  const pct = Math.round(c / UI.rvState.queue.length * 100);
  UI.$('#rvArea').innerHTML = `
    <div class="card card--lift" style="text-align:center">
      <div style="font-size:48px;margin-bottom:16px">${pct >= 80 ? '🎉' : '💪'}</div>
      <div style="font-size:24px;font-weight:700;font-variant-numeric:tabular-nums">${T('rv.summaryCorrect', { c, n: UI.rvState.queue.length })}</div>
      <div style="font-size:13px;color:var(--text-tertiary);margin-top:8px">${T('rv.summaryRate', { pct })}</div>
    </div>`;
};
