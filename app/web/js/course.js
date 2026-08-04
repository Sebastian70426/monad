/* ══════════ 课程空间（三栏） ══════════ */
(async function initCourseSpace() {
  UI.shell('courses.html');
  UI.cmdPanel.init();
  const $ = UI.$, t = UI.t;
  $$('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
  $$('[data-i18n-ph]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-ph')));

  const params = new URLSearchParams(location.search);
  const courseId = parseInt(params.get('id')) || 0;
  const prefLectureId = parseInt(params.get('lecture')) || null;

  const state = {
    course: null, lectures: [], docs: [], current: null,
    sessions: {}, noteBuf: '', generating: false,
    quizzes: [], quizAnswered: false, aiBubble: null,
  };

  /* ── 流式：笔记 ── */
  UI.on('note:start', () => { state.noteBuf = ''; });
  UI.on('note:chunk', (chunk) => {
    state.noteBuf += chunk;
    const paper = $('#notePaper');
    if (paper && state.current && paper.dataset.mode === 'stream') {
      paper.innerHTML = `<div class="md">${UI.md(state.noteBuf)}</div>`;
      paper.scrollTop = paper.scrollHeight;
    }
  });
  UI.on('note:end', async () => {
    const paper = $('#notePaper');
    if (paper && paper.dataset.mode === 'stream') {
      paper.dataset.mode = 'done';
      UI.toast(t('common.saved'), 'success');
      state.generating = false;
      $('#btnGenNote').innerHTML = '✨ ' + t('course.genNote');
      $('#btnGenNote').disabled = false;
      await refreshLecture(state.current.id);
    }
  });

  /* ── 流式：Tutor ── */
  UI.on('tutor:start', (sources) => {
    if (!state.aiBubble) return;
    if (sources && sources.length) {
      const box = document.createElement('div');
      box.className = 'msg-sources';
      box.innerHTML = `<div class="text-tertiary" style="font-size:11px;margin-bottom:4px">${t('tutor.sources')}</div>` +
        sources.slice(0, 3).map((s, i) => {
          const txt = typeof s === 'string' ? s : (s.text || s.content || s.filename || '');
          return `<div class="src-card"><span class="src-idx">${i + 1}</span><span class="src-txt">${UI.esc(String(txt).slice(0, 60))}</span></div>`;
        }).join('');
      state.aiBubble.appendChild(box);
    }
  });
  UI.on('tutor:chunk', (chunk) => {
    if (!state.aiBubble) return;
    const b = state.aiBubble.querySelector('.msg-bubble');
    b.dataset.buf += chunk;
    b.innerHTML = `<div class="md">${UI.md(b.dataset.buf)}</div>`;
    scrollTutor();
  });
  UI.on('tutor:end', () => { state.aiBubble = null; });

  const scrollTutor = () => { const m = $('#tutorMsgs'); if (m) m.scrollTop = m.scrollHeight; };

  /* ── 初始化 ── */
  try {
    const cRes = await API.getCourse(courseId);
    if (!cRes.success) { UI.toast(cRes.error || t('common.error'), 'error'); return; }
    state.course = cRes.course;
    $('#crumbCourse').textContent = state.course.name;
    $('#ctxCourse').textContent = state.course.name;
    document.title = state.course.name + ' — Monad';

    const [lRes, dRes] = await Promise.all([
      API.getLectures(courseId).catch(() => ({ lectures: [] })),
      API.getDocuments(courseId).catch(() => ({ documents: [] })),
    ]);
    state.lectures = lRes.lectures || [];
    state.docs = dRes.documents || [];
    renderRail(); renderDocs();

    const target = state.lectures.find(l => l.id === prefLectureId) || state.lectures[state.lectures.length - 1];
    if (target) await selectLecture(target.id);
    else {
      $('#lectureTitle').textContent = t('course.noLecture');
      $('#lectureMeta').textContent = t('course.noLecture.desc');
    }
  } catch (err) { console.error('[course]', err); UI.toast(String(err), 'error'); }

  function renderRail() {
    const list = $('#lectureList');
    if (!state.lectures.length) {
      list.innerHTML = `<div class="empty" style="padding:20px 8px"><p style="font-size:12px">${t('course.noLecture')}<br><span class="text-tertiary">${t('course.noLecture.desc')}</span></p><a class="btn btn-sm btn-primary" style="margin-top:10px" data-go="upload.html">＋ ${t('cmd.record')}</a></div>`;
      const go = list.querySelector('[data-go]');
      if (go) go.addEventListener('click', () => UI.navigate('upload.html'));
      return;
    }
    list.innerHTML = state.lectures.map(l => {
      const hasNote = l.note && l.note.trim();
      const active = state.current && state.current.id === l.id ? ' active' : '';
      return `<div class="lecture-item${active}" data-id="${l.id}">
        <span class="li-ic">${UI.icon('mic', 14)}</span>
        <div class="grow"><b>${UI.esc(l.title)}</b><small>${hasNote ? t('course.tabNote') : t('course.tabTranscript')} · ${UI.esc((l.created_at || '').slice(5, 16))}</small></div>
        ${hasNote ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-plain">—</span>'}</div>`;
    }).join('');
    $$('.lecture-item', list).forEach(el => el.addEventListener('click', () => selectLecture(parseInt(el.dataset.id))));
  }

  function renderDocs() {
    const box = $('#docList');
    box.innerHTML = state.docs.length
      ? state.docs.map(d => `<div class="flex" style="padding:8px 10px;font-size:12.5px;color:var(--text-secondary)">
          <span>${UI.icon('doc', 14)}</span><span class="grow">${UI.esc(d.filename || '')}</span>
          ${d.chunk_count ? `<span class="badge badge-accent">${d.chunk_count}</span>` : '<span class="badge badge-amber">…</span>'}</div>`).join('')
      : `<p class="text-tertiary" style="font-size:12px;padding:4px 10px">${t('course.nodocs')}</p>`;
  }

  async function refreshLecture(id) {
    const r = await API.getLecture(id).catch(() => null);
    if (r && r.success) {
      const idx = state.lectures.findIndex(l => l.id === id);
      if (idx >= 0) state.lectures[idx] = r.lecture;
      renderRail();
    }
  }

  async function selectLecture(id) {
    const r = await API.getLecture(id);
    if (!r.success) return;
    state.current = r.lecture;
    renderRail();
    $('#lectureTitle').textContent = state.current.title;
    $('#lectureMeta').textContent = (state.current.created_at || '').slice(0, 16) + ' · ' + state.course.name;
    $('#ctxLecture').textContent = state.current.title;
    $('#transcriptBox').textContent = state.current.transcript || '';
    $('#notePaper').dataset.mode = 'done';
    const hasNote = state.current.note && state.current.note.trim();
    $('#notePaper').innerHTML = hasNote ? `<div class="md">${UI.md(state.current.note)}</div>` : `<div class="empty"><div class="empty-ic">✨</div><p>${t('course.noNote')}</p></div>`;
    $('#btnGenNote').innerHTML = '✨ ' + t('course.genNote');
    $('#btnGenNote').disabled = false;
    state.quizzes = []; state.quizAnswered = false;
    $('#quizBox').innerHTML = `<div class="empty"><p>🎯</p><button class="btn btn-primary btn-sm" id="btnGenQuiz">🎯 ${t('course.genQuiz')}</button></div>`;
    const gq = $('#btnGenQuiz'); if (gq) gq.addEventListener('click', generateQuiz);
    $('#tutorMsgs').innerHTML = `<div class="empty"><p>${t('course.tutorTitle')} · ${t('tutor.empty')}</p></div>`;
  }

  /* ── 笔记生成 ── */
  $('#btnGenNote').addEventListener('click', async () => {
    if (!state.current || state.generating) return;
    state.generating = true;
    const btn = $('#btnGenNote'); btn.disabled = true; btn.innerHTML = '✨ …';
    const paper = $('#notePaper'); paper.dataset.mode = 'stream';
    paper.innerHTML = `<div class="flex" style="padding:8px 0">${UI.orb(30)}<span style="font-size:13px;color:var(--text-tertiary)">${t('common.loading')}</span></div>`;
    const res = await API.generateNote(state.current.id).catch(() => ({ success: false, error: t('common.error') }));
    if (!res.success) {
      state.generating = false; btn.disabled = false; btn.innerHTML = '✨ ' + t('course.genNote');
      paper.dataset.mode = 'done';
      paper.innerHTML = `<div class="empty"><p>${UI.esc(res.error || t('common.error'))}</p></div>`;
      UI.toast(res.error || t('common.error'), 'error');
    }
  });

  /* ── 测验 ── */
  async function generateQuiz() {
    const box = $('#quizBox');
    box.innerHTML = `<div class="flex" style="padding:16px 0">${UI.orb(30)}<span>…</span></div>`;
    const res = await API.generateQuizzes(courseId, state.current.id).catch(() => null);
    if (!res || !res.quizzes || !res.quizzes.length) {
      box.innerHTML = `<div class="empty"><p>${UI.esc((res && res.error) || t('common.error'))}</p></div>`;
      return;
    }
    state.quizzes = res.quizzes; renderQuiz();
  }

  function renderQuiz() {
    const box = $('#quizBox');
    const q = state.quizzes[0];
    if (!q) { box.innerHTML = `<div class="empty"><p>${t('common.empty')}</p></div>`; return; }
    const letters = ['A', 'B', 'C', 'D', 'E'];
    box.innerHTML = `<div class="quiz-card">
      <h4>${UI.esc(q.question)}</h4>
      ${(q.options || []).map((opt, i) => `<div class="quiz-opt" data-i="${i}"><span class="q-letter">${letters[i]}</span>${UI.esc(opt)}</div>`).join('')}
      <div id="quizFeedback"></div>
      <div class="flex" style="margin-top:16px;justify-content:space-between">
        <button class="btn btn-ghost btn-sm" id="quizPrev" disabled>‹</button>
        <button class="btn btn-primary btn-sm" id="quizNext" ${state.quizzes.length > 1 ? '' : 'disabled'}>›</button>
      </div></div>`;
    $$('.quiz-opt', box).forEach(opt => opt.addEventListener('click', () => {
      if (state.quizAnswered) return;
      state.quizAnswered = true;
      const i = parseInt(opt.dataset.i);
      opt.classList.add(String(q.options[i]) === q.answer ? 'correct' : 'wrong');
      if (String(q.options[i]) !== q.answer) {
        const idx = q.options.indexOf(q.answer);
        if (idx >= 0) $$('.quiz-opt', box)[idx].classList.add('correct');
      }
      $('#quizFeedback').innerHTML = `<div class="fc-exp"><strong>答案：${UI.esc(q.answer)}</strong>${q.explanation ? '<br>' + UI.md(q.explanation) : ''}</div>`;
      $('#quizPrev').disabled = false;
    }));
    $('#quizPrev').addEventListener('click', () => { state.quizzes.unshift(state.quizzes.pop()); state.quizAnswered = false; renderQuiz(); });
    $('#quizNext').addEventListener('click', () => { state.quizzes.push(state.quizzes.shift()); state.quizAnswered = false; renderQuiz(); });
  }

  /* ── Tabs ── */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    tab.classList.add('active');
    $('#tabNote').classList.toggle('hidden', tab.dataset.tab !== 'note');
    $('#tabTranscript').classList.toggle('hidden', tab.dataset.tab !== 'transcript');
    $('#tabQuiz').classList.toggle('hidden', tab.dataset.tab !== 'quiz');
  }));

  /* ── 内嵌 Tutor ── */
  const sendTutor = async (text) => {
    text = (text || '').trim();
    if (!text || !state.current || state.aiBubble) return;
    const msgs = $('#tutorMsgs');
    const empty = msgs.querySelector('.empty'); if (empty) empty.remove();
    msgs.insertAdjacentHTML('beforeend', `<div class="msg user"><span class="msg-avatar me">S</span><div class="msg-body"><div class="msg-bubble">${UI.esc(text)}</div></div></div>`);
    msgs.insertAdjacentHTML('beforeend', `<div class="msg"><span class="msg-avatar ai">M</span><div class="msg-body"><div class="msg-bubble" data-buf=""><div class="md"></div></div></div></div>`);
    const aiEl = msgs.lastElementChild;
    state.aiBubble = aiEl;
    aiEl.querySelector('.msg-bubble').innerHTML = `<span class="thinking-bar">${UI.orb(26)}<span>${t('tutor.thinking')}</span><span class="think-dots"><i></i><i></i><i></i></span></span>`;
    scrollTutor();
    try {
      let sessionId = state.sessions[state.current.id];
      if (!sessionId) {
        const s = await API.createChatSession(courseId, state.current.id);
        if (!s.success) throw new Error(s.error || t('common.error'));
        sessionId = s.session.id; state.sessions[state.current.id] = sessionId;
      }
      await API.tutorChat(sessionId, text);
    } catch (err) {
      if (state.aiBubble) state.aiBubble.querySelector('.msg-bubble').innerHTML = `<div class="md"><p style="color:var(--red)">⚠ ${UI.esc(String(err.message || err))}</p></div>`;
      state.aiBubble = null;
    }
  };
  $('#tutorSend').addEventListener('click', () => { const i = $('#tutorInput'); sendTutor(i.value); i.value = ''; });
  $('#tutorInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#tutorSend').click(); });
  $$('#tutorChips .chip').forEach(c => c.addEventListener('click', () => sendTutor(c.dataset.chip)));
  document.querySelector('[data-go="courses.html"]').addEventListener('click', () => UI.navigate('courses.html'));
})();
