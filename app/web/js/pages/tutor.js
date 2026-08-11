/* AI Tutor — 沉浸式主舞台：全屏居中 + 问候置顶 + 无框沉底输入 */
UI.register('tutor', async (slot) => {
  slot.innerHTML = `
    <div class="tutor-stage" style="display:flex;flex-direction:column;height:100%;min-width:0">

      <!-- 零状态：问候置顶 -->
      <div class="tutor-zero" id="tutorZero">
        <div class="tutor-wrap">
          <div style="font-size:30px;font-weight:700;letter-spacing:-0.02em;color:var(--text-primary);line-height:1.4">${T('tut.hero')}</div>
          <div style="font-size:13.5px;color:var(--text-tertiary);margin-top:12px">${T('tut.heroSub')}</div>
        </div>
      </div>

      <!-- 对话流 -->
      <div class="tutor-msgs" id="tutorMsgs" style="display:none">
        <div class="tutor-wrap" id="tutorMsgInner"></div>
      </div>

      <!-- 上下文胶囊（随上下文变化） -->
      <div class="tutor-ctxline" id="tutorCtxLine" style="display:none">
        <div class="tutor-wrap" style="display:flex;align-items:center;justify-content:center">
          <span class="ctx-dropdown" id="ctxDropdown" onclick="UI.togglePopover('context', this)" style="font-size:11.5px">
            <span id="ctxLabel">${T('tut.globalKB')}</span>
            <span style="opacity:0.6;font-size:9px">▾</span>
          </span>
        </div>
      </div>

      <!-- 毛玻璃无框输入区（沉底） -->
      <div class="tutor-inputbar">
        <div class="tutor-wrap">
          <div class="tutor-tools">
            <div class="tutor-chips">
              <span class="chip-pill" onclick="UI.tutorChip('${T('tut.chipSimplify')}')">${T('tut.chipSimplify')}</span>
              <span class="chip-pill" onclick="UI.tutorChip('${T('tut.chipExample')}')">${T('tut.chipExample')}</span>
              <span class="chip-pill" onclick="UI.tutorChip('${T('tut.chipQuiz')}')">${T('tut.chipQuiz')}</span>
              <span class="chip-pill" onclick="UI.tutorChip('${T('tut.chipAnalogy')}')">${T('tut.chipAnalogy')}</span>
            </div>
          </div>
          <div class="tutor-input-row" style="display:flex;align-items:flex-end;gap:10px">
            <button class="tutor-send" onclick="UI.tutorAttachImage()" title="${T('chat.attachImage')}" style="width:38px;height:38px;flex-shrink:0">${UI.icon('image', 16)}</button>
            <div style="flex:1;min-width:0">
              <div id="tutorImgPreview" style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap"></div>
              <input class="tutor-input" id="tutorInput" placeholder="${T('tut.placeholder')}" autocomplete="off" style="width:100%"
                onkeydown="if(event.key==='Enter')UI.tutorSend()">
            </div>
            <button class="tutor-send" onclick="UI.tutorSend()" title="Send" style="width:38px;height:38px;flex-shrink:0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  UI.tutorState = { sessionId: null, courseId: null, lectureId: null, started: false, images: [] };
  UI.loadSessions();
});

/* 上下文标签更新 */
UI.loadCtxLabel = async function() {
  const label = UI.$('#ctxLabel');
  if (!label) return;
  const cid = UI.tutorState ? UI.tutorState.courseId : null;
  if (!cid) { label.textContent = T('tut.globalKB'); return; }
  try {
    const r = await eel.api_list_courses()();
    const c = (r.success ? r.courses : []).find(x => x.id === cid);
    label.textContent = c ? T('tut.courseLabel', { name: c.name }) : T('tut.courseLabel', { name: '#' + cid });
  } catch (e) {
    label.textContent = T('tut.courseLabel', { name: '#' + cid });
  }
};

/* 双态切换：问候融入消息流 */
UI.tutorEnterConversation = function() {
  if (UI.tutorState.started) return;
  UI.tutorState.started = true;

  const zero = UI.$('#tutorZero');
  const msgs = UI.$('#tutorMsgs');
  const ctxline = UI.$('#tutorCtxLine');
  const inner = UI.$('#tutorMsgInner');

  if (zero) {
    const greeting = zero.querySelector('.tutor-wrap');
    if (greeting && inner) {
      inner.insertAdjacentHTML('afterbegin', `
        <div style="display:flex;justify-content:center;margin-bottom:28px">
          <div style="text-align:center;font-size:15px;font-weight:600;color:var(--text-secondary)">${greeting.innerHTML}</div>
        </div>`);
    }
    zero.remove();
  }
  if (msgs) { msgs.style.display = 'flex'; msgs.style.flex = '1'; msgs.style.minHeight = '0'; }
  if (ctxline) ctxline.style.display = 'block';
  setTimeout(() => { const i = UI.$('#tutorInput'); if (i) i.focus(); }, 300);
};

UI.newTutorSession = async function() {
  const r = await eel.api_create_chat_session(UI.tutorState.courseId, UI.tutorState.lectureId)();
  if (r.success) {
    UI.tutorState.sessionId = r.session.id;
    UI.tutorState.started = false;
    UI.tutorState.images = [];
    const inner = UI.$('#tutorMsgInner');
    const msgs = UI.$('#tutorMsgs');
    const ctxline = UI.$('#tutorCtxLine');
    if (inner) inner.innerHTML = '';
    if (msgs) msgs.style.display = 'none';
    if (ctxline) ctxline.style.display = 'none';
    UI.loadSessions();
  }
};

UI.openTutorSession = async function(sid) {
  UI.tutorState.sessionId = sid;
  try {
    const r = await eel.api_get_chat_messages(sid)();
    const el = UI.$('#tutorMsgInner');
    if (!r.success || !r.messages) return;
    if (r.messages.length > 0) UI.tutorEnterConversation();
    el.innerHTML = r.messages.map(m => {
      const isUser = m.role === 'user';
      return `<div style="display:flex;justify-content:${isUser ? 'flex-end' : 'flex-start'};margin-bottom:16px">
        <div style="max-width:85%;padding:10px 14px;border-radius:16px;background:${isUser ? 'var(--bg-card)' : 'var(--accent-muted)'};border:1px solid ${isUser ? 'var(--border-subtle)' : 'rgba(124,140,255,0.18)'};font-size:13px;line-height:1.6;white-space:pre-wrap">${UI.esc(m.content)}</div>
      </div>`;
    }).join('');
    UI.$('#tutorMsgs').scrollTop = UI.$('#tutorMsgs').scrollHeight;
    UI.loadSessions();
  } catch (e) {}
};

UI.tutorChip = function(text) {
  UI.$('#tutorInput').value = text;
  UI.tutorSend();
};

/* ── 图片附件 ── */
UI.tutorAttachImage = async function() {
  if ((UI.tutorState.images || []).length >= 3) { alert(T('chat.imageLimit')); return; }
  const r = await eel.api_select_image_file()();
  if (!r.success) return;
  UI.tutorState.images.push(r.data_url);
  const box = UI.$('#tutorImgPreview');
  if (box) {
    box.innerHTML = UI.tutorState.images.map((img, i) =>
      `<span style="position:relative;display:inline-block">
        <img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--border-subtle)">
        <button onclick="UI.tutorRemoveImage(${i})" style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;line-height:16px;text-align:center">×</button>
      </span>`).join('');
  }
};

UI.tutorRemoveImage = function(i) {
  UI.tutorState.images.splice(i, 1);
  const box = UI.$('#tutorImgPreview');
  if (box) box.innerHTML = UI.tutorState.images.map((img, j) =>
    `<span style="position:relative;display:inline-block">
      <img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--border-subtle)">
      <button onclick="UI.tutorRemoveImage(${j})" style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;line-height:16px;text-align:center">×</button>
    </span>`).join('');
};

UI.tutorSend = async function() {
  const input = UI.$('#tutorInput');
  if (!input.value.trim() && UI.tutorState.images.length === 0) return;
  UI.tutorEnterConversation();
  const state = UI.tutorState;
  await UI.sendChatMessage(state, input, UI.$('#tutorMsgInner'), UI.$('#tutorMsgs'), state.images);
  state.images = [];
  const box = UI.$('#tutorImgPreview');
  if (box) box.innerHTML = '';
  UI.loadSessions();
};
