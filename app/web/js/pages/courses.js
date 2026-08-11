/* 课程列表 — 卡片网格 + 删除（自定义确认弹层） */
UI.register('courses', async (slot) => {
  slot.innerHTML = `
    <div class="spine">
      <div class="page-head rise">
        <div>
          <h1>${T('nav.courses')}</h1>
          <p>${T('crs.subtitle')}</p>
        </div>
        <button class="btn btn-primary" onclick="UI.promptNewCourse()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${T('crs.newCourse')}
        </button>
      </div>
      <div id="courseGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--gap);margin-bottom:var(--gap)">
        <div style="text-align:center;padding:48px 0;color:var(--text-tertiary);grid-column:1/-1">${T('crs.loading')}</div>
      </div>
    </div>`;

  try {
    const r = await eel.api_list_courses()();
    const grid = UI.$('#courseGrid');
    if (!r.success || r.courses.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:80px 0">
          <div style="font-size:40px;opacity:0.3;margin-bottom:16px">📚</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:6px">${T('crs.emptyTitle')}</div>
          <div style="font-size:13px;color:var(--text-tertiary);margin-bottom:24px">${T('crs.emptySub')}</div>
          <button class="btn btn-primary" onclick="UI.promptNewCourse()">${T('crs.create')}</button>
        </div>`;
      return;
    }

    grid.innerHTML = r.courses.map(c => `
      <div class="card hoverable rise" style="cursor:pointer;gap:12px;position:relative" onclick="UI.navigate('course',{courseId:${c.id}})">
        <div style="height:72px;border-radius:12px;background:linear-gradient(135deg,rgba(124,140,255,0.18),rgba(34,211,238,0.10));display:grid;place-items:center;position:relative;overflow:hidden">
          <span style="font-size:26px;opacity:0.75">📖</span>
          <span style="position:absolute;right:12px;bottom:8px;font-size:28px;font-weight:700;color:rgba(255,255,255,0.06)">${UI.esc(c.name.charAt(0).toUpperCase())}</span>
        </div>
        <div style="font-size:15px;font-weight:600;color:var(--text-primary)">${UI.esc(c.name)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:12px;color:var(--text-tertiary)">${T('crs.createdAt', { time: c.created_at })}</span>
          <span class="badge badge-plain">${T('crs.enter')}</span>
        </div>
        <button class="btn btn-ghost btn-sm" style="position:absolute;top:10px;right:10px;width:28px;height:28px;padding:0;border-radius:8px;color:var(--text-tertiary);background:rgba(0,0,0,0.25);z-index:2"
          onclick="event.stopPropagation();UI.courseMenu(event,${c.id})" title="${T('crs.more')}">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
        </button>
      </div>`).join('');
  } catch (e) {
    console.error('Courses load error:', e);
    UI.$('#courseGrid').innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text-tertiary)">${T('crs.loading')}</div>`;
  }
});

/* ── 新建课程 ── */
UI.promptNewCourse = async function() {
  const name = prompt(T('crs.namePrompt'));
  if (!name || !name.trim()) return;
  const r = await eel.api_create_course(name.trim())();
  if (r.success) {
    UI.navigate('courses');
  } else {
    alert(r.error || T('crs.createFail'));
  }
};

/* ── 删除课程（自定义确认弹层，不依赖浏览器原生 confirm） ── */
UI.deleteCourse = async function(cid) {
  // 先查课程名
  let name = '该课程';
  try {
    const cr = await eel.api_get_course(cid)();
    if (cr.success) name = cr.course.name;
  } catch (e) {}

  UI.confirmModal({
    title: T('crs.deleteTitle'),
    message: T('crs.deleteMsg', { name }),
    danger: true,
    confirmText: T('crs.deleteBtn'),
    onConfirm: async () => {
      try {
        const r = await eel.api_delete_course(cid)();
        if (r.success) {
          UI.navigate('courses');
        } else {
          alert(r.error || T('crs.createFail'));
        }
      } catch (e) {
        alert(T('crs.deleteErr', { err: e.message }));
      }
    }
  });
};

/* ── 通用确认弹层（全站复用） ── */
UI.confirmModal = function(opts) {
  // 移除已有弹层
  const old = UI.$('#confirmModal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'confirmModal';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:500;display:grid;place-items:center;
    background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);
    animation:fadeIn 0.15s var(--ease-out);
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    width:380px;max-width:90vw;background:var(--bg-card-lift);
    border:1px solid var(--border-default);border-radius:16px;
    padding:24px;box-shadow:var(--shadow-lg);
    animation:scaleIn 0.18s var(--ease-spring);
  `;

  const dangerColor = opts.danger ? 'var(--red)' : 'var(--accent)';

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
      <span style="width:34px;height:34px;border-radius:10px;background:${opts.danger ? 'var(--red-muted)' : 'var(--accent-muted)'};display:grid;place-items:center;font-size:16px;flex-shrink:0">${opts.danger ? '🗑' : '⚠️'}</span>
      <div style="font-size:15px;font-weight:600;color:var(--text-primary)">${UI.esc(opts.title || T('crs.confirm'))}</div>
    </div>
    <div style="font-size:13px;line-height:1.7;color:var(--text-secondary);white-space:pre-line;margin-bottom:20px">${UI.esc(opts.message || '')}</div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-sm" id="confirmCancel" style="min-width:80px">${T('kb.cancel')}</button>
      <button class="btn btn-sm btn-primary" id="confirmOk" style="min-width:80px;background:${dangerColor};box-shadow:none">${UI.esc(opts.confirmText || T('crs.confirm'))}</button>
    </div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 取消：点击遮罩 / 取消按钮 / ESC
  const close = () => overlay.remove();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  panel.querySelector('#confirmCancel').addEventListener('click', close);
  panel.querySelector('#confirmOk').addEventListener('click', () => {
    close();
    if (opts.onConfirm) opts.onConfirm();
  });
  const onKey = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } };
  document.addEventListener('keydown', onKey);
};

/* ── 课程卡片 ··· 菜单（重命名/设置/归档/删除） ── */
UI.courseMenu = function(e, cid) {
  e.stopPropagation();
  UI.dropdownMenu(e.currentTarget, [
    { label: T('crs.rename'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>', onClick: () => UI.renameCourse(cid) },
    { label: T('crs.menuSettings'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>', onClick: () => alert(T('crs.comingSoon')) },
    { label: T('crs.archive'), icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>', onClick: () => UI.archiveCourse(cid) },
    { divider: true },
    { label: T('crs.delete'), danger: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', onClick: () => UI.deleteCourse(cid) },
  ]);
};

/* ── 重命名课程 ── */
UI.renameCourse = async function(cid) {
  const cr = await eel.api_get_course(cid)();
  if (!cr.success) return;
  const oldName = cr.course.name;
  const name = prompt(T('crs.renamePrompt'), oldName);
  if (!name || !name.trim() || name.trim() === oldName) return;
  const r = await eel.api_rename_course(cid, name.trim())();
  if (r.success) UI.navigate('courses');
  else alert(r.error || T('crs.renameFail'));
};

/* ── 归档课程 ── */
UI.archiveCourse = async function(cid) {
  UI.confirmModal({
    title: T('crs.archiveTitle'),
    message: T('crs.archiveMsg'),
    confirmText: T('crs.archiveBtn'),
    onConfirm: async () => {
      const r = await eel.api_archive_course(cid)();
      if (r.success) UI.navigate('courses');
      else alert(r.error || T('crs.createFail'));
    }
  });
};
