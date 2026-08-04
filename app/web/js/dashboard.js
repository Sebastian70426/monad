/* ══════════ 仪表盘：今天该学什么 ══════════ */
(async function initDashboard() {
  UI.splash();
  UI.shell('index.html');
  UI.cmdPanel.init();
  const $ = UI.$, $$ = UI.$$, t = UI.t;

  $$('[data-i18n]').forEach(el => el.textContent = t(el.getAttribute('data-i18n')));
  const sub = $('#greetingSub');

  /* ── 动态问候（时间 + 回归检测） ── */
  (function greet(){
    const h = new Date().getHours();
    const last = localStorage.getItem('monad_last_visit');
    const daysAway = last ? Math.floor((Date.now() - +last) / 86400000) : 0;
    localStorage.setItem('monad_last_visit', Date.now());
    const text = daysAway > 2 ? (UI.lang() === 'zh' ? '欢迎回来，Sebastian。AI Tutor 已经为你整理好了最新的知识点。' : 'Welcome back, Sebastian. AI Tutor has prepared the latest insights.')
      : h < 6 ? (UI.lang() === 'zh' ? '夜深了，Sebastian。明天还有新的知识在等你。' : 'Late night, Sebastian. New knowledge awaits tomorrow.')
      : h < 12 ? (UI.lang() === 'zh' ? '早安，Sebastian。准备好开启今天的学习了吗？' : 'Good morning, Sebastian. Ready to learn today?')
      : h < 18 ? (UI.lang() === 'zh' ? '下午好，Sebastian。保持这个节奏，稳步向前。' : 'Good afternoon, Sebastian. Keep the pace.')
      : (UI.lang() === 'zh' ? '晚上好，Sebastian。今天想攻克哪个知识点？' : 'Good evening, Sebastian. What shall we tackle today?');
    $('#greetingText').textContent = text;
  })();

  $('#stIc1').innerHTML = UI.icon('target'); $('#stIc2').innerHTML = UI.icon('clock'); $('#stIc3').innerHTML = UI.icon('spark');
  $('#stLab1').textContent = t('dash.progress'); $('#stLab2').textContent = t('dash.review'); $('#stLab3').textContent = t('dash.ai');

  try {
    const [coursesRes, reviewsRes] = await Promise.all([
      API.listCourses().catch(() => ({ courses: [] })),
      API.getDueReviews().catch(() => ({ reviews: [] })),
    ]);
    const courses = coursesRes.courses || [];
    const dueReviews = reviewsRes.reviews || [];

    const courseData = [];
    for (const c of courses) {
      try {
        const [lr, dr] = await Promise.all([API.getLectures(c.id).catch(() => ({ lectures: [] })), API.getDocuments(c.id).catch(() => ({ documents: [] }))]);
        courseData.push({ ...c, lectures: lr.lectures || [], docs: dr.documents || [], noted: (lr.lectures || []).filter(l => l.note && l.note.trim()).length });
      } catch (e) { courseData.push({ ...c, lectures: [], docs: [], noted: 0 }); }
    }
    const totalLectures = courseData.reduce((s, c) => s + c.lectures.length, 0);
    const totalNotes = courseData.reduce((s, c) => s + c.noted, 0);
    const progressPct = totalLectures ? Math.round((totalNotes / totalLectures) * 100) : 0;

    $('#stVal1').textContent = totalLectures ? progressPct + '%' : '—';
    $('#stTrend1').textContent = totalLectures ? (UI.lang() === 'zh' ? '共 ' + totalNotes + ' 篇笔记' : totalNotes + ' notes') : '';
    $('#stVal2').textContent = dueReviews.length;
    $('#stTrend2').textContent = dueReviews.length ? (UI.lang() === 'zh' ? 'SM-2 到期' : 'due') : '';
    $('#stTrend3').textContent = '';
    const recText = dueReviews.length ? dueReviews.length + ' ' + t('dash.review') : (courseData.some(c => c.lectures.some(l => !(l.note && l.note.trim()))) ? (UI.lang() === 'zh' ? '待补笔记' : 'notes') : (UI.lang() === 'zh' ? '继续学习' : 'continue'));
    $('#stVal3').textContent = recText.split(' ')[0];

    $('#statProgress').addEventListener('click', () => UI.navigate('courses.html'));
    $('#statReview').addEventListener('click', () => UI.navigate('review.html'));
    $('#statAI').addEventListener('click', () => UI.navigate('tutor.html'));

    /* ── 继续学习 ── */
    const cc = $('#continueCard');
    if (!courseData.length) {
      cc.innerHTML = `<div class="empty"><div class="empty-ic">${UI.icon('book', 22)}</div><h4>${t('dash.noData')}</h4><button class="btn btn-primary" id="goCourses">${t('course.create')}</button></div>`;
      $('#goCourses').addEventListener('click', () => UI.navigate('courses.html'));
    } else {
      const active = courseData.find(c => c.lectures.length) || courseData[0];
      const last = active.lectures[active.lectures.length - 1];
      const pct = active.lectures.length ? Math.round((active.noted / active.lectures.length) * 100) : 0;
      cc.innerHTML = `
        <div class="cc-top">
          <span class="cc-course-ic" id="ccIcon"></span>
          <div>
            <div class="cc-title">${UI.esc(active.name)}</div>
            <div class="cc-sub">${active.lectures.length} ${t('course.lectures')} · ${active.noted} ${t('course.notes')}</div>
          </div>
          <span class="cc-badge">${t('dash.continue')}</span>
        </div>
        <div class="cc-lecture">${last ? UI.esc(last.title) : '—'}</div>
        <div class="cc-meta">${last ? UI.timeAgo(last.created_at) : ''}</div>
        <div class="cc-foot">
          <div class="progress"><i style="width:${pct}%"></i></div>
          <span class="pct">${pct}%</span>
          <span class="text-link" id="ccGo">${t('dash.continueBtn')}</span>
        </div>`;
      UI.bindIconPicker($('#ccIcon'), UI.matchIcon(active.name), '#7C8CFF');
      $('#ccGo').addEventListener('click', (e) => { e.stopPropagation(); UI.navigate('course.html?id=' + active.id); });
      cc.addEventListener('click', () => UI.navigate('course.html?id=' + active.id));
    }

    /* ── 今日 AI 计划 ── */
    const plan = [];
    if (dueReviews.length) plan.push({ label: UI.lang() === 'zh' ? `复习 ${dueReviews.length} 道到期题目` : `Review ${dueReviews.length} due items`, sub: 'SM-2 · 巩固长期记忆', go: 'review.html' });
    const noNote = courseData.flatMap(c => c.lectures.filter(l => !(l.note && l.note.trim())).map(l => ({ ...l, cname: c.name })));
    if (noNote.length) plan.push({ label: UI.lang() === 'zh' ? `为《${noNote[0].title}》生成笔记` : `Generate note for ${noNote[0].title}`, sub: noNote[0].cname, go: 'course.html?id=' + (courseData.find(c => c.name === noNote[0].cname) || {}).id });
    if (totalLectures && !plan.length) plan.push({ label: UI.lang() === 'zh' ? `继续学习《${courseData[0].name}》` : `Continue ${courseData[0].name}`, sub: '保持学习节奏', go: 'course.html?id=' + courseData[0].id });
    if (!plan.length) plan.push({ label: UI.lang() === 'zh' ? '开始你的第一节课堂录音' : 'Analyze your first lecture', sub: '语音转文字 → AI 笔记', go: 'upload.html' });
    $('#planList').innerHTML = plan.map(p => `
      <div class="plan-item" data-go="${p.go}">
        <span class="pi-bullet"></span>
        <div><b>${UI.esc(p.label)}</b><small>${UI.esc(p.sub)}</small></div>
      </div>`).join('');
    $$('#planList .plan-item').forEach(el => el.addEventListener('click', () => UI.navigate(el.dataset.go)));

    /* ── 学习记忆 ── */
    const memories = courseData.flatMap(c => c.lectures.filter(l => l.note && l.note.trim()).map(l => ({ ...l, cname: c.name })))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4);
    $('#memoryList').innerHTML = memories.length
      ? memories.map(m => `
        <div class="memory-row" data-go="note.html?id=${m.id}">
          <span class="mr-ic">${UI.icon('doc', 15)}</span>
          <div class="grow"><b>${UI.esc(m.title)}</b><small>${UI.esc(m.cname)} · ${UI.timeAgo(m.created_at)}</small></div>
          <span class="badge badge-green">${t('course.tabNote')}</span>
        </div>`).join('')
      : `<div class="empty"><p>${t('dash.memoryEmpty')}</p></div>`;
    $$('#memoryList .memory-row').forEach(el => el.addEventListener('click', () => UI.navigate(el.dataset.go)));

    sub.textContent = `${dueReviews.length} ${t('dash.review')} · AI Tutor ${t('status.ready')}`;
  } catch (err) {
    console.error('[dashboard]', err);
    $('#continueCard').innerHTML = `<div class="empty"><p>${UI.esc(String(err))}</p></div>`;
  }

  /* ── 近 14 天折线图 ── */
  (function chart(){
    let N = 14, data = [], seed = 42;
    let rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    let v = 30;
    for (let i = 0; i < N; i++) { v = Math.min(96, Math.max(8, v + (rnd() - 0.42) * 26)); data.push(Math.round(v)); }
    const W = 900, H = 110, pad = 14, max = 100;
    const pts = data.map((val, i) => [pad + i * (W - pad * 2) / (N - 1), H - pad - (val / max) * (H - pad * 2)]);
    const smooth = (p) => {
      let d = 'M' + p[0][0] + ',' + p[0][1];
      for (let i = 0; i < p.length - 1; i++) {
        const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)];
        d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
             (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0] + ',' + p2[1];
      }
      return d;
    };
    const line = smooth(pts);
    const area = line + ' L' + pts[N - 1][0] + ',' + (H - 2) + ' L' + pts[0][0] + ',' + (H - 2) + ' Z';
    const dots = pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === N - 1 ? 3.5 : 2.2}" fill="${i === N - 1 ? '#9AA6FF' : '#16181D'}" stroke="#7C8CFF" stroke-width="1.5"/>`).join('');
    $('#lineChart').innerHTML =
      '<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C8CFF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>' +
      '<linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C8CFF" stop-opacity=".16"/><stop offset="1" stop-color="#7C8CFF" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + area + '" fill="url(#ag)"/>' +
      '<path d="' + line + '" fill="none" stroke="url(#lg)" stroke-width="2" stroke-linecap="round"/>' + dots;
    const labels = [], d = new Date();
    for (let i = N - 1; i >= 0; i--) { const dd = new Date(d.getTime() - i * 86400000); labels.push((dd.getMonth() + 1) + '/' + dd.getDate()); }
    $('#chartLabels').innerHTML = labels.map((l, i) => `<span class="${i === N - 1 ? 'today' : ''}">${l}</span>`).join('');
  })();
})();
