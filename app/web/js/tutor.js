/* ══════════ AI Tutor 独立页 ══════════ */
(async function initTutor() {
  UI.shell('tutor.html');
  UI.cmdPanel.init();
  const $ = UI.$, t = UI.t;
  $$('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
  $$('[data-i18n-ph]').forEach(el => el.placeholder = t(el.getAttribute('data-i18n-ph')));

  const state = {
    courses: [], lectures: {},
    selectedCourse: null, selectedLecture: null,
    sessions: [], activeSession: null, aiBubble: null,
  };

  /* 流式回调 → 渲染 */
  UI.on('tutor:start', (sources) => {
    if (!state.aiBubble) return;
    if (sources && sources.length) {
      const box = document.createElement('div');
      box.className = 'msg-sources';
      box.innerHTML = `<div class="text-tertiary" style="font-size:11px;margin-bottom:4px">${t('tutor.sources')}</div>` +
        sources.slice(0, 3).map((s, i) => {
          const txt = typeof s === 'string' ? s : (s.text || s.content || s.filename || '');
          return `<div class="src-card"><span class="src-idx">${i + 1}</span><span class="src-txt">${UI.esc(String(txt).slice(0, 70))}</span></div>`;
        }).join('');
      state.aiBubble.appendChild(box);
    }
  });
  UI.on('tutor:chunk', (chunk) => {
    if (!state.aiBubble) return;
    const b = state.aiBubble.querySelector('.msg-bubble');
    b.dataset.buf += chunk;
    b.innerHTML = `<div class="md">${UI.md(b.dataset.buf)}</div>`;
    scrollBottom();
  });
  UI.on('tutor:end', () => { state.aiBubble = null; });

  const scrollBottom = () => { const m = $('#tutorMsgs'); if (m) m.scrollTop = m.scrollHeight; };

  function renderMessages(messages) {
    const box = $('#tutorMsgs');
    if (!messages || !messages.length) {
      box.innerHTML = `<div class="empty"><div class="empty-ic">${UI.icon('spark', 22)}</div><p>${t('tutor.empty')}</p></div>`;
      return;
    }
    box.innerHTML = messages.map(m => {
      if (m.role === 'user') return `<div class="msg user"><span class="msg-avatar me">S</span><div class="msg-body"><div class="msg-bubble">${UI.esc(m.content || '')}</div></div></div>`;
      let src = '';
      try {
        const arr = typeof m.sources === 'string' ? JSON.parse(m.sources) : m.sources;
        if (arr && arr.length) src = `<div class="msg-sources"><div class="text-tertiary" style="font-size:11px;margin-bottom:4px">${t('tutor.sources')}</div>` +
          arr.slice(0, 3).map((s, i) => `<div class="src-card"><span class="src-idx">${i + 1}</span><span class="src-txt">${UI.esc(String(typeof s === 'string' ? s : (s.text || s.filename || '')).slice(0, 70))}</span></div>`).join('') + `</div>`;
      } catch (e) {}
      return `<div class="msg"><span class="msg-avatar ai">M</span><div class="msg-body"><div class="msg-bubble"><div class="md">${UI.md(m.content || '')}</div></div>${src}</div></div>`;
    }).join('');
    scrollBottom();
  }

  async function loadSessions() {
    const res = await API.getChatSessions().catch(() => ({ sessions: [] }));
    state.sessions = res.sessions || [];
    const box = $('#sessionList');
    if (!state.sessions.length) {
      box.innerHTML = `<div class="empty" style="padding:28px 12px"><p style="font-size:12px">${t('tutor.newSession')}</p></div>`;
      return;
    }
    box.innerHTML = state.sessions.map(s => `
      <div class="session-item ${state.activeSession && state.activeSession.id === s.id ? 'active' : ''}" data-id="${s.id}">
        <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(s.title || s.course_name || '对话')}</div>
        <small>${UI.esc((s.updated_at || s.created_at || '').slice(0, 16))}</small>
      </div>`).join('');
    $$('.session-item', box).forEach(el => el.addEventListener('click', async () => {
      const id = parseInt(el.dataset.id);
      const s = state.sessions.find(x => x.id === id);
      if (!s) return;
      state.activeSession = s;
      if (s.course_id) { state.selectedCourse = s.course_id; renderCtx(); }
      loadSessionMessages(id);
      renderSessionsActive();
    }));
  }
  function renderSessionsActive() {
    $$('#sessionList .session-item').forEach(el => el.classList.toggle('active', state.activeSession && parseInt(el.dataset.id) === state.activeSession.id));
  }
  async function loadSessionMessages(id) {
    const res = await API.getChatMessages(id).catch(() => ({ messages: [] }));
    renderMessages(res.messages || []);
  }

  async function loadCourses() {
    const res = await API.listCourses().catch(() => ({ courses: [] }));
    state.courses = res.courses || [];
    renderCtx();
  }
  function renderCtx() {
    const cc = $('#ctxCourses');
    cc.innerHTML = state.courses.map(c => `
      <div class="ctx-course ${state.selectedCourse === c.id ? 'active' : ''}" data-id="${c.id}">
        <b>${UI.esc(c.name)}</b><small>${UI.icon('book', 11)}</small>
      </div>`).join('') || `<p class="text-tertiary" style="font-size:12px">${t('course.empty.title')}</p>`;
    $$('.ctx-course', cc).forEach(el => el.addEventListener('click', async () => {
      state.selectedCourse = parseInt(el.dataset.id);
      state.selectedLecture = null;
      renderCtx();
      const r = await API.getLectures(state.selectedCourse).catch(() => ({ lectures: [] }));
      state.lectures[state.selectedCourse] = r.lectures || [];
      renderLectures();
      const course = state.courses.find(c => c.id === state.selectedCourse);
      $('#ctxSummary').textContent = course ? course.name : '';
    }));
  }
  function renderLectures() {
    const box = $('#ctxLectures');
    const list = state.selectedCourse ? (state.lectures[state.selectedCourse] || []) : [];
    box.innerHTML = list.length
      ? list.map(l => `<div class="ctx-lecture ${state.selectedLecture === l.id ? 'active' : ''}" data-id="${l.id}">${UI.esc(l.title)}${l.note && l.note.trim() ? ' · 📝' : ''}</div>`).join('')
      : `<p class="text-tertiary" style="font-size:12px">—</p>`;
    $$('.ctx-lecture', box).forEach(el => el.addEventListener('click', () => {
      state.selectedLecture = parseInt(el.dataset.id);
      renderLectures();
    }));
  }

  const send = async (raw) => {
    const text = (raw || '').trim();
    if (!text || state.aiBubble) return;
    const box = $('#tutorMsgs');
    const empty = box.querySelector('.empty'); if (empty) empty.remove();
    box.insertAdjacentHTML('beforeend', `<div class="msg user"><span class="msg-avatar me">S</span><div class="msg-body"><div class="msg-bubble">${UI.esc(text)}</div></div></div>`);
    box.insertAdjacentHTML('beforeend', `<div class="msg"><span class="msg-avatar ai">M</span><div class="msg-body"><div class="msg-bubble" data-buf=""><div class="md"></div></div></div></div>`);
    const aiEl = box.lastElementChild;
    state.aiBubble = aiEl;
    aiEl.querySelector('.msg-bubble').innerHTML = `<span class="thinking-bar">${UI.orb(26)}<span>${t('tutor.thinking')}</span><span class="think-dots"><i></i><i></i><i></i></span></span>`;
    scrollBottom();
    try {
      let session = state.activeSession;
      if (!session) {
        const s = await API.createChatSession(state.selectedCourse, state.selectedLecture);
        if (!s.success) throw new Error(s.error || t('common.error'));
        session = s.session; state.activeSession = session; loadSessions();
      }
      await API.tutorChat(session.id, text);
      const m = await API.getChatMessages(session.id);
      renderMessages(m.messages || []);
      state.aiBubble = null;
      loadSessions();
    } catch (err) {
      if (state.aiBubble) state.aiBubble.querySelector('.msg-bubble').innerHTML = `<div class="md"><p style="color:var(--red)">⚠ ${UI.esc(String(err.message || err))}</p></div>`;
      state.aiBubble = null;
    }
  };

  $('#tutorSend').addEventListener('click', () => { const i = $('#tutorInput'); send(i.value); i.value = ''; });
  $('#tutorInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#tutorSend').click(); });
  $$('#tutorChips .chip').forEach(c => c.addEventListener('click', () => send(c.dataset.chip)));
  $('#btnNewChat').addEventListener('click', () => {
    state.activeSession = null; state.aiBubble = null;
    $('#tutorMsgs').innerHTML = `<div class="empty"><div class="empty-ic">${UI.icon('spark', 22)}</div><p>${t('tutor.empty')}</p></div>`;
    renderSessionsActive();
  });

  loadCourses();
  loadSessions();
})();
