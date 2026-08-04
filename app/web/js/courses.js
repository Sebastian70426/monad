/* ══════════ 课程列表 ══════════ */
(async function initCourses() {
  UI.shell('courses.html');
  UI.cmdPanel.init();
  const $ = UI.$, t = UI.t;
  $$('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
  const grid = $('#courseGrid');
  grid.innerHTML = UI.skeleton(4);

  const modal = $('#modalOverlay');
  const openModal = () => { modal.classList.remove('hidden'); setTimeout(() => $('#courseName').focus(), 60); };
  const closeModal = () => modal.classList.add('hidden');
  $('#btnAddCourse').addEventListener('click', openModal);
  $('#btnCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  $('#btnConfirm').addEventListener('click', async () => {
    const name = $('#courseName').value.trim();
    if (!name) { UI.toast(t('course.placeholder'), 'error'); return; }
    $('#btnConfirm').disabled = true;
    const res = await API.createCourse(name).catch(() => null);
    $('#btnConfirm').disabled = false;
    if (res && res.success) { UI.toast(t('common.saved'), 'success'); location.href = 'course.html?id=' + res.course.id; }
    else UI.toast((res && res.error) || t('common.error'), 'error');
  });
  $('#courseName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#btnConfirm').click(); });

  try {
    const res = await API.listCourses();
    const courses = res.courses || [];
    if (!courses.length) {
      grid.innerHTML = `<div style="grid-column:1/-1" class="card"><div class="empty">
        <div class="empty-ic">${UI.icon('book', 22)}</div><h4>${t('course.empty.title')}</h4><p>${t('course.empty.desc')}</p>
        <button class="btn btn-primary" id="emptyAdd">＋ ${t('course.create')}</button></div></div>`;
      $('#emptyAdd').addEventListener('click', openModal);
      return;
    }
    const cards = await Promise.all(courses.map(async (c) => {
      let lectures = [], docs = [];
      try {
        const [lr, dr] = await Promise.all([API.getLectures(c.id).catch(() => ({ lectures: [] })), API.getDocuments(c.id).catch(() => ({ documents: [] }))]);
        lectures = lr.lectures || []; docs = dr.documents || [];
      } catch (e) {}
      const noted = lectures.filter(l => l.note && l.note.trim()).length;
      return `
        <div class="course-card" data-id="${c.id}">
          <div class="course-cover">
            <span class="cc-letter">${UI.esc((c.name || '?')[0].toUpperCase())}</span>
            <span class="cc-icon">${UI.icon(UI.matchIcon(c.name), 26)}</span>
            <span class="cc-badge">${noted ? '<span class="badge badge-green">📝 ' + noted + '</span>' : '<span class="badge badge-plain">新课程</span>'}</span>
          </div>
          <div class="course-body">
            <h3>${UI.esc(c.name)}</h3>
            <p>${UI.esc((c.created_at || '').slice(0, 10))}</p>
            <div class="course-meta">
              <span>${UI.icon('mic', 13)} ${lectures.length} ${t('course.lectures')}</span>
              <span>${UI.icon('doc', 13)} ${noted} ${t('course.notes')}</span>
              <span>${UI.icon('layers', 13)} ${docs.length} ${t('course.docs')}</span>
            </div>
          </div>
        </div>`;
    }));
    grid.innerHTML = cards.join('');
    $$('.course-card', grid).forEach(el => el.addEventListener('click', () => UI.navigate('course.html?id=' + el.dataset.id)));
  } catch (err) {
    console.error('[courses]', err);
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><p>${UI.esc(String(err))}</p></div>`;
  }
})();
