/* 课程空间 — 全局 Header + 6/4 黄金分割（左内容 / 右 AI） */
UI.register('course', async (slot, params) => {
  const cid = params.courseId;
  if (!cid) { UI.navigate('courses'); return; }

  slot.innerHTML = `
    <div class="course-wrap">

      <!-- 全局 Header：主标题左上，操作右上 -->
      <header class="course-head">
        <div>
          <h1 id="courseName">${T('crs.loading')}</h1>
          <div class="sub" id="courseMeta">${T('cr.meta')}</div>
        </div>
        <div class="course-head-actions">
          <button class="btn btn-ghost btn-sm" onclick="UI.courseMenuTop()" style="color:var(--text-tertiary)">···</button>
        </div>
      </header>

      <!-- 6/4 黄金分割主体 -->
      <div class="course-body">

        <!-- 左 60%：课堂记录 + 课程资料（便当盒） -->
        <div class="course-left">
          <div class="bento">
            <div class="bento-title">
              <span>${T('cr.lectures')}</span>
              <button class="btn btn-ghost btn-sm" onclick="UI.promptUpload(${cid})" style="padding:4px 10px">${T('cr.upload')}</button>
            </div>
            <div id="courseLectures"><div class="bento-empty">${T('crs.loading')}</div></div>
          </div>

          <div class="bento">
            <div class="bento-title"><span>${T('cr.docs')}</span></div>
            <div id="courseDocs"><div class="bento-empty">${T('crs.loading')}</div></div>
          </div>
        </div>

        <!-- 右 40%：AI Tutor（拉满高度） -->
        <div class="course-right">
          <div style="padding:18px 18px 12px;border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0">
            <div style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600">
              <span style="color:var(--accent)">✦</span> AI Tutor
              <span style="font-size:11px;font-weight:400;color:var(--text-tertiary)">${T('cr.tutorHint')}</span>
            </div>
            <div id="tutorCtx" style="margin-top:6px;font-size:11.5px;color:var(--text-tertiary)">${T('cr.tutorPlaceholder')}</div>
          </div>
          <div id="tutorMsgs" style="flex:1;overflow-y:auto;padding:18px 18px;min-height:0"></div>
          <div style="padding:12px 16px 16px;border-top:1px solid rgba(255,255,255,0.05);flex-shrink:0;display:flex;gap:10px;align-items:flex-end">
            <button class="tutor-send" onclick="UI.courseAttachImage()" title="${T('chat.attachImage')}" style="width:38px;height:38px;flex-shrink:0">${UI.icon('image', 16)}</button>
            <div style="flex:1;min-width:0">
              <div id="courseImgPreview" style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap"></div>
              <input class="input" id="courseTutorInput" placeholder="${T('cr.inputPlaceholder')}" style="width:100%"
                onkeydown="if(event.key==='Enter')UI.courseTutorSend()">
            </div>
            <button class="tutor-send" onclick="UI.courseTutorSend()" style="width:38px;height:38px;flex-shrink:0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>

      </div>
    </div>`;

  UI.courseState = { courseId: cid, lectureId: null, sessionId: null, images: [] };

  try {
    const cr = await eel.api_get_course(cid)();
    if (cr.success) {
      UI.$('#courseName').textContent = cr.course.name;
      UI.$('#courseMeta').textContent = T('cr.meta');
    }
    await UI.loadCourseLectures(cid);
    await UI.loadCourseDocs(cid);
  } catch (e) { console.error(e); }
});

/* ── Header 右上 ··· 菜单 ── */
UI.courseMenuTop = function() {
  const cid = UI.courseState.courseId;
  const btn = UI.$('.course-head-actions .btn');
  UI.dropdownMenu(btn, [
    { label: T('crs.rename'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', onClick: () => UI.renameCourse(cid) },
    { label: T('crs.archive'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>', onClick: () => UI.archiveCourse(cid) },
    { divider: true },
    { label: T('crs.delete'), danger: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', onClick: () => UI.deleteCourse(cid) },
  ]);
};

/* ── 课堂记录（便当盒） ── */
UI.loadCourseLectures = async function(cid) {
  try {
    const r = await eel.api_get_lectures(cid)();
    const el = UI.$('#courseLectures');
    if (!r.success || !r.lectures || r.lectures.length === 0) {
      el.innerHTML = `<div class="bento-empty">${T('cr.noLectures')}</div>`;
      return;
    }
    el.innerHTML = r.lectures.map(l => `
      <div class="bento-item" data-lid="${l.id}" onclick="UI.selectLecture(${l.id})">
        <span class="bi-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
        </span>
        <div class="bi-main">
          <b>${UI.esc(l.title)}</b>
          <small>${l.created_at}${l.has_note ? ` · ${T('cr.hasNote')}` : ''}</small>
        </div>
        ${l.has_note ? `<span class="badge badge-green">${T('cr.note')}</span>` : ''}
      </div>`).join('');
  } catch (e) { console.error(e); }
};

/* ── 课程资料（便当盒） ── */
UI.loadCourseDocs = async function(cid) {
  try {
    const r = await eel.api_get_documents(cid)();
    const el = UI.$('#courseDocs');
    if (!r.success || !r.documents || r.documents.length === 0) {
      el.innerHTML = `<div class="bento-empty">${T('cr.noDocs')}</div>`;
      return;
    }
    el.innerHTML = r.documents.map(d => `
      <div class="bento-item" style="cursor:default">
        <span class="bi-icon" style="font-size:15px">${d.file_type === '.pdf' ? '📄' : d.file_type === '.pptx' ? '📊' : d.file_type in ['.jpg', '.jpeg', '.png', '.webp'] ? '📷' : '📝'}</span>
        <div class="bi-main">
          <b>${UI.esc(d.filename)}</b>
          <small>${d.created_at}${d.chunk_count > 0 ? ` · ${d.chunk_count} chunks` : ` · ${T('kb.notIndexed')}`}</small>
        </div>
      </div>`).join('');
  } catch (e) { console.error(e); }
};

/* ── 选择课堂 → 右侧展示笔记/转录 ── */
UI.selectLecture = async function(lid) {
  UI.courseState.lectureId = lid;
  UI.$$('#courseLectures .bento-item').forEach(el => el.classList.remove('active'));
  const item = UI.$('#courseLectures [data-lid="' + lid + '"]');
  if (item) item.classList.add('active');

  try {
    const r = await eel.api_get_lecture(lid)();
    if (!r.success) return;
    const lec = r.lecture;
    UI.$('#tutorCtx').textContent = T('cr.currentLecture', { title: lec.title });

    if (lec.note) {
      // 在课堂记录下方插入笔记卡片
      const noteBento = document.createElement('div');
      noteBento.className = 'bento';
      noteBento.id = 'noteBento';
      noteBento.innerHTML = `
        <div class="bento-title">
          <span>${T('cr.note')}</span>
          <button class="btn btn-ghost btn-sm" onclick="UI.exportNote()">${T('cr.export')}</button>
        </div>
        <div style="line-height:1.8;color:var(--text-secondary);font-size:13px;white-space:pre-wrap;max-height:320px;overflow-y:auto">${UI.esc(lec.note)}</div>
        ${lec.transcript ? `<div style="margin-top:12px;font-size:11px;color:var(--text-tertiary);cursor:pointer" onclick="UI.toggleTranscript(this)">▸ ${T('cr.transcript')}</div>
        <div style="display:none;margin-top:8px;padding:14px;background:var(--bg-input);border-radius:10px;max-height:240px;overflow-y:auto;font-size:12px;color:var(--text-tertiary);line-height:1.7">${UI.esc(lec.transcript)}</div>` : ''}
      `;
      const old = UI.$('#noteBento');
      if (old) old.remove();
      UI.$('.course-left').insertBefore(noteBento, UI.$('.course-left').firstChild.nextSibling);
    } else {
      const noteBento = document.createElement('div');
      noteBento.className = 'bento';
      noteBento.id = 'noteBento';
      noteBento.innerHTML = `
        <div class="bento-title"><span>${T('cr.note')}</span></div>
        <div style="text-align:center;padding:12px">
          <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:12px">${T('cr.noNote')}</div>
          <button class="btn btn-primary btn-sm" onclick="UI.genNote(${lid}, event)">${T('cr.genNote')}</button>
        </div>`;
      const old = UI.$('#noteBento');
      if (old) old.remove();
      UI.$('.course-left').insertBefore(noteBento, UI.$('.course-left').firstChild.nextSibling);
    }
  } catch (e) { console.error(e); }
};

UI.toggleTranscript = function(el) {
  const body = el.nextElementSibling;
  const hidden = body.style.display === 'none';
  body.style.display = hidden ? 'block' : 'none';
  el.textContent = (hidden ? '▾' : '▸') + ' ' + T('cr.transcript');
};

UI.exportNote = function() {
  const note = UI.$('#noteBento pre, #noteBento [style*="white-space"]');
  if (!note) return;
  const blob = new Blob([note.textContent], {type: 'text/markdown'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'note_' + new Date().toISOString().slice(0,10) + '.md'; a.click();
  URL.revokeObjectURL(url);
};

UI.genNote = async function(lid, ev) {
  const btn = ev ? ev.target : null;
  if (btn) { btn.disabled = true; btn.textContent = T('cr.generating'); }
  const r = await eel.api_generate_note(lid)();
  if (r.success) { UI.selectLecture(lid); UI.loadCourseLectures(UI.courseState.courseId); }
  else { alert(r.error); if (btn) { btn.disabled = false; btn.textContent = T('cr.genNote'); } }
};

/* ── 上传录音 ── */
UI.promptUpload = async function(cid) {
  const r = await eel.api_select_audio_file()();
  if (!r.success) return;
  const copy = await eel.api_copy_audio(r.path, cid)();
  const tr = await eel.api_transcribe_audio(copy.path, cid)();
  if (tr.success) {
    UI.loadCourseLectures(cid);
    UI.selectLecture(tr.lecture_id);
  } else alert(T('cr.transcribeFail', { err: tr.error }));
};

/* ── 课程内 AI Tutor：图片附件 ── */
UI.courseAttachImage = async function() {
  if ((UI.courseState.images || []).length >= 3) { alert(T('chat.imageLimit')); return; }
  const r = await eel.api_select_image_file()();
  if (!r.success) return;
  UI.courseState.images.push(r.data_url);
  const box = UI.$('#courseImgPreview');
  if (box) {
    box.innerHTML = UI.courseState.images.map((img, i) =>
      `<span style="position:relative;display:inline-block">
        <img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--border-subtle)">
        <button onclick="UI.courseRemoveImage(${i})" style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;line-height:16px;text-align:center">×</button>
      </span>`).join('');
  }
};

UI.courseRemoveImage = function(i) {
  UI.courseState.images.splice(i, 1);
  const box = UI.$('#courseImgPreview');
  if (box) box.innerHTML = UI.courseState.images.map((img, j) =>
    `<span style="position:relative;display:inline-block">
      <img src="${img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px;border:1px solid var(--border-subtle)">
      <button onclick="UI.courseRemoveImage(${j})" style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:var(--red);color:#fff;font-size:10px;line-height:16px;text-align:center">×</button>
    </span>`).join('');
};

/* ── 课程内 AI Tutor（复用 UI.sendChatMessage，与 Tutor 页共用流式逻辑） ── */
UI.courseTutorSend = function() {
  const state = UI.courseState;
  UI.sendChatMessage(state, UI.$('#courseTutorInput'), UI.$('#tutorMsgs'), UI.$('#tutorMsgs'), state.images);
  state.images = [];
  const box = UI.$('#courseImgPreview');
  if (box) box.innerHTML = '';
};
