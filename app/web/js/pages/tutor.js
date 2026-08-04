/* AI Tutor — 沉浸式主舞台：全屏居中 + 问候置顶 + 无框沉底输入 */
UI.register('tutor', async (slot) => {
  slot.innerHTML = `
    <div class="tutor-stage" style="display:flex;flex-direction:column;height:100%;min-width:0">

      <!-- 零状态：问候置顶 -->
      <div class="tutor-zero" id="tutorZero">
        <div class="tutor-wrap">
          <div style="font-size:30px;font-weight:700;letter-spacing:-0.02em;color:var(--text-primary);line-height:1.4">今天想探索什么？</div>
          <div style="font-size:13.5px;color:var(--text-tertiary);margin-top:12px">从一门课程、一个概念，或一道题开始 —— 你的 AI 助教随时待命</div>
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
            <span id="ctxLabel">🌍 全局知识库</span>
            <span style="opacity:0.6;font-size:9px">▾</span>
          </span>
        </div>
      </div>

      <!-- 毛玻璃无框输入区（沉底） -->
      <div class="tutor-inputbar">
        <div class="tutor-wrap">
          <div class="tutor-tools">
            <div class="tutor-chips">
              <span class="chip-pill" onclick="UI.tutorChip('简化一下')">简化</span>
              <span class="chip-pill" onclick="UI.tutorChip('出一个例题')">例题</span>
              <span class="chip-pill" onclick="UI.tutorChip('出一道测验题')">出题</span>
              <span class="chip-pill" onclick="UI.tutorChip('用类比解释')">类比</span>
            </div>
          </div>
          <div class="tutor-input-row">
            <input class="tutor-input" id="tutorInput" placeholder="输入你的问题..." autocomplete="off"
              onkeydown="if(event.key==='Enter')UI.tutorSend()">
            <button class="tutor-send" onclick="UI.tutorSend()" title="发送">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  UI.tutorState = { sessionId: null, courseId: null, lectureId: null, started: false };
  UI.loadSessions();
});

/* 上下文标签更新 */
UI.loadCtxLabel = function() {
  const label = UI.$('#ctxLabel');
  if (!label) return;
  const cid = UI.tutorState ? UI.tutorState.courseId : null;
  label.textContent = cid ? '📚 课程 #' + cid : '🌍 全局知识库';
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

UI.tutorSend = async function() {
  const input = UI.$('#tutorInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  UI.tutorEnterConversation();
  const msgs = UI.$('#tutorMsgInner');
  if (!UI.tutorState.sessionId) {
    const r = await eel.api_create_chat_session(UI.tutorState.courseId, UI.tutorState.lectureId)();
    if (r.success) UI.tutorState.sessionId = r.session.id;
  }
  msgs.insertAdjacentHTML('beforeend', `<div style="display:flex;justify-content:flex-end;margin-bottom:16px"><div style="max-width:85%;padding:10px 14px;border-radius:16px 16px 4px 16px;background:var(--bg-card);border:1px solid var(--border-subtle);font-size:13px;line-height:1.6">${UI.esc(msg)}</div></div>`);
  const ai = document.createElement('div');
  ai.style.cssText = 'display:flex;justify-content:flex-start;margin-bottom:16px';
  ai.innerHTML = `<div style="max-width:85%;padding:10px 14px;border-radius:16px 16px 16px 4px;background:var(--accent-muted);border:1px solid rgba(124,140,255,0.18);font-size:13px;line-height:1.6;white-space:pre-wrap">✦ AI 正在思考...</div>`;
  msgs.appendChild(ai);
  UI.$('#tutorMsgs').scrollTop = UI.$('#tutorMsgs').scrollHeight;
  try {
    let buffer = '';
    const bubble = ai.querySelector('div');
    UI.updateStream = (c) => { buffer += c; bubble.textContent = buffer; UI.$('#tutorMsgs').scrollTop = UI.$('#tutorMsgs').scrollHeight; };
    await eel.api_agent_tutor(UI.tutorState.sessionId, msg)();
    bubble.textContent = buffer || '（无回复）';
    UI.loadSessions();
  } catch (e) {
    ai.querySelector('div').textContent = '❌ ' + e.message;
  }
};
