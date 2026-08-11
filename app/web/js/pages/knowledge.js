/* 知识库 — 数据表格 + 语义搜索 + 右上角主按钮上传 */
UI.register('knowledge', async (slot) => {
  slot.innerHTML = `
    <div class="spine" style="max-width:1200px">
      <div class="page-head rise" style="align-items:center;flex-wrap:wrap">
        <div>
          <h1>${T('kb.title')}</h1>
          <p>${T('kb.subtitle')}</p>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <select class="select" id="kbCourseSelect" onchange="UI.kbLoadDocs(this.value)" style="width:200px"><option value="">${T('kb.allCourses')}</option></select>
          <button class="btn btn-primary" onclick="UI.kbSelectFile()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${T('kb.upload')}
          </button>
        </div>
      </div>

      <div class="card rise" style="padding:0;overflow:hidden">
        <!-- 搜索栏 -->
        <div class="kb-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:16px;height:16px;opacity:0.5;flex-shrink:0"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="kbSearch" placeholder="${T('kb.search')}" oninput="UI.kbSearch()">
          <span style="font-size:10.5px;color:var(--text-tertiary);background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:6px;border:1px solid var(--border-subtle);flex-shrink:0">/</span>
        </div>
        <!-- 表格头 -->
        <div class="kb-tr kb-th">
          <span style="flex:2.2;min-width:0">${T('kb.colFilename')}</span>
          <span style="flex:1.2">${T('kb.colCourse')}</span>
          <span style="flex:1">${T('kb.colTime')}</span>
          <span style="width:64px;text-align:right">${T('kb.colSize')}</span>
          <span style="width:64px;text-align:center">${T('kb.colIndex')}</span>
          <span style="width:124px;text-align:right">${T('kb.colActions')}</span>
        </div>
        <div id="kbTableBody" style="min-height:200px"></div>
      </div>

      <!-- 上传/操作状态条 -->
      <div id="kbStatus" class="hidden" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg-card-lift);border:1px solid var(--border-default);border-radius:14px;padding:12px 20px;font-size:13px;box-shadow:var(--shadow-lg);z-index:120"></div>
    </div>`;

  UI.kbState = { courses: [], filePath: null };

  // 加载课程列表
  try {
    const r = await eel.api_list_courses()();
    if (r.success && r.courses.length > 0) {
      UI.kbState.courses = r.courses;
      const s = UI.$('#kbCourseSelect');
      s.innerHTML = `<option value="">${T('kb.allCourses')}</option>` + r.courses.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  } catch (e) {}
  await UI.kbLoadDocs(UI.$('#kbCourseSelect').value);
});

/* '/' 聚焦搜索（知识库页内） */
document.addEventListener('keydown', (e) => {
  if (UI.current === 'knowledge' && e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    const s = UI.$('#kbSearch');
    if (s) s.focus();
  }
});

/* ── 加载文档（带语义搜索） ── */
UI.kbLoadDocs = async function(courseId) {
  const q = UI.$('#kbSearch').value.trim();
  try {
    const r = await eel.api_search_documents(courseId || null, q)();
    UI.kbRenderTable(r.success ? r.results : []);
  } catch (e) { console.error(e); }
};

UI.kbSearch = function() {
  clearTimeout(UI._kbDebounce);
  UI._kbDebounce = setTimeout(() => {
    UI.kbLoadDocs(UI.$('#kbCourseSelect').value);
  }, 300);
};

/* ── 渲染数据表格 ── */
UI.kbRenderTable = function(docs) {
  const body = UI.$('#kbTableBody');
  if (!docs || docs.length === 0) {
    body.innerHTML = `
      <div class="kb-empty">
        <div style="font-size:34px;opacity:0.25;margin-bottom:12px">📂</div>
        ${T('kb.emptyTitle')}<br>
        <span style="font-size:12px;opacity:0.7">${T('kb.emptySub')}</span>
      </div>`;
    return;
  }
  body.innerHTML = docs.map(d => {
    const course = UI.kbState.courses.find(c => c.id === d.course_id);
    const cname = course ? course.name : '—';
    const isImg = ['.jpg', '.jpeg', '.png', '.webp'].indexOf(d.file_type) >= 0;
    const icon = d.file_type === '.pdf' ? '📄' : (d.file_type === '.pptx' || d.file_type === '.ppt') ? '📊' : isImg ? '📷' : '📝';
    const indexed = d.chunk_count > 0;
    const matchBadge = d.match === 'semantic'
      ? `<span class="kb-badge kb-badge-sem">${T('kb.semHit')}</span>`
      : d.match === 'filename'
        ? `<span class="kb-badge kb-badge-fn">${T('kb.fnHit')}</span>` : '';
    const snippets = (d.snippets || []).slice(0, 2).map(s =>
      `<div class="kb-snippet">… ${UI.esc(s)} …</div>`).join('');

    return `
      <div class="kb-tr kb-row" data-id="${d.id}">
        <span style="flex:2.2;min-width:0;display:flex;align-items:center;gap:8px">
          <span style="font-size:15px">${icon}</span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(d.filename)}</span>
          ${matchBadge}
        </span>
        <span style="flex:1.2;font-size:12.5px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(cname)}</span>
        <span style="flex:1;font-size:12px;color:var(--text-tertiary)">${d.created_at}</span>
        <span style="width:64px;text-align:right;font-size:12px;color:var(--text-tertiary);font-variant-numeric:tabular-nums">${d.size_mb ? d.size_mb + ' MB' : '—'}</span>
        <span style="width:64px;text-align:center">${indexed
          ? `<span class="kb-dot kb-dot-ok" title="${T('kb.indexed', { count: d.chunk_count })}"></span>`
          : `<span class="kb-dot kb-dot-wait" title="${T('kb.notIndexed')}"></span>`}</span>
        <span style="width:124px;text-align:right;display:flex;gap:6px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" onclick="UI.kbReindex(${d.id})">${T('kb.reindexBtn')}</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" onclick="UI.kbDelete(${d.id})">${T('crs.delete')}</button>
        </span>
      </div>
      ${snippets ? `<div class="kb-snip-row">${snippets}</div>` : ''}`;
  }).join('');
};

/* ── 上传流程（右上角主按钮） ── */
UI.kbSelectFile = async function() {
  const r = await eel.api_select_document_file()();
  if (!r.success) return;

  // 未选课程时先让用户选择
  let cid = UI.$('#kbCourseSelect').value;
  if (!cid) {
    const pick = await UI.kbPickCourse();
    if (!pick) return;
    cid = pick;
  }

  const isImg = ['.jpg', '.jpeg', '.png', '.webp'].indexOf((r.info.format || '').toLowerCase()) >= 0;
  UI.kbStatus(T('kb.uploading', { name: r.info.filename }));
  const ur = await eel.api_upload_document(r.path, parseInt(cid))();
  if (ur.success) {
    UI.kbStatus(isImg ? T('kb.visionExtracting') : T('kb.uploadOk'), 'ok');
    setTimeout(() => UI.kbStatus(null), 2500);
    UI.kbLoadDocs(UI.$('#kbCourseSelect').value);
  } else {
    UI.kbStatus(T('kb.uploadErr', { err: ur.error }), 'err');
    setTimeout(() => UI.kbStatus(null), 4000);
  }
};

/* 上传前选择课程（轻量浮层） */
UI.kbPickCourse = function() {
  return new Promise((resolve) => {
    if (UI.kbState.courses.length === 0) { alert(T('kb.pickFirst')); resolve(null); return; }
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.45);backdrop-filter:blur(10px);display:grid;place-items:center';
    ov.innerHTML = `
      <div style="background:var(--bg-card-lift);border:1px solid var(--border-default);border-radius:16px;padding:20px;width:340px;box-shadow:var(--shadow-lg)">
        <div style="font-size:14px;font-weight:600;margin-bottom:14px">${T('kb.pickTitle')}</div>
        ${UI.kbState.courses.map(c => `<div class="pv-item" onclick="UI.kbResolveCourse(${c.id})">📚 ${UI.esc(c.name)}</div>`).join('')}
        <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:10px;color:var(--text-tertiary)" onclick="UI.kbCancelPick()">${T('kb.cancel')}</button>
      </div>`;
    document.body.appendChild(ov);
    UI._kbOv = ov;
    UI._kbResolve = resolve;
    ov.addEventListener('click', (e) => { if (e.target === ov) UI.kbCancelPick(); });
  });
};

UI.kbResolveCourse = function(cid) {
  if (UI._kbOv) UI._kbOv.remove();
  const r = UI._kbResolve; UI._kbResolve = null;
  if (r) r(cid);
};

UI.kbCancelPick = function() {
  if (UI._kbOv) UI._kbOv.remove();
  const r = UI._kbResolve; UI._kbResolve = null;
  if (r) r(null);
};

/* ── 操作 ── */
UI.kbDelete = async function(docId) {
  if (!confirm(T('kb.deleteConfirm'))) return;
  const r = await eel.api_delete_document(docId)();
  if (r.success) UI.kbLoadDocs(UI.$('#kbCourseSelect').value);
  else alert(r.error || T('crs.createFail'));
};

UI.kbReindex = async function(docId) {
  UI.kbStatus(T('kb.reindexing'));
  const r = await eel.api_reindex_document(docId)();
  if (r.success) {
    UI.kbStatus(T('kb.reindexDone', { count: r.chunk_count }), 'ok');
    setTimeout(() => UI.kbStatus(null), 2500);
  } else {
    UI.kbStatus(T('kb.reindexFail', { err: r.error }), 'err');
    setTimeout(() => UI.kbStatus(null), 3000);
  }
  UI.kbLoadDocs(UI.$('#kbCourseSelect').value);
};

UI.kbStatus = function(text, type) {
  const el = UI.$('#kbStatus');
  if (!el) return;
  if (!text) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  el.style.color = type === 'ok' ? 'var(--green)' : type === 'err' ? 'var(--red)' : 'var(--text-primary)';
  el.textContent = text;
};
