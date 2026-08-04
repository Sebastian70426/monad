/* 仪表盘 — 今天该学什么 */
UI.register('dashboard', async (slot) => {
  const h = new Date().getHours();
  const greet = h < 6 ? '夜深了，Sebastian。' : h < 12 ? '早安，Sebastian。' : h < 18 ? '下午好，Sebastian。' : '晚上好，Sebastian。';

  slot.innerHTML = `
    <div class="greeting rise">
      <h1 class="hero-title">${greet} 准备好开启今天的学习了吗？</h1>
      <p class="hero-sub">今日 AI 学习节奏已为你整理好</p>
    </div>
    <div class="spine">
      <div class="stats-row rise">
        <div class="stat-card hoverable">
          <span class="stat-ic ic-indigo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 6.1L20.5 8l-5.1 4.1L17 18l-5-3.2L7 18l1.6-5.9L3.5 8l6.1.1z"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="dashProgress">--</span><span class="stat-label" id="dashProgressUnit">学习进度</span></div>
          <span class="stat-trend">--</span>
        </div>
        <div class="stat-card hoverable">
          <span class="stat-ic ic-amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="dashReview">--</span><span class="stat-label" id="dashReviewUnit">今日待复习</span></div>
          <span class="stat-trend">SM-2</span>
        </div>
        <div class="stat-card hoverable">
          <span class="stat-ic ic-cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.1 5.4L19.5 10.5l-5.4 2.1L12 18l-2.1-5.4L4.5 10.5l5.4-2.1z"/></svg></span>
          <div class="stat-main"><span class="stat-num tabular" id="dashAI">--</span><span class="stat-label" id="dashAIUnit">AI 推荐任务</span></div>
          <span class="stat-trend">智能</span>
        </div>
      </div>
      <div class="dash-grid">
        <div class="col">
          <div class="card hoverable rise">
            <div class="card-title"><span class="stat-ic ic-indigo" style="width:26px;height:26px;border-radius:8px">${UI.icon('book', 14)}</span><span>继续学习</span></div>
            <div id="dashContinue" style="color:var(--text-tertiary);font-size:13px;">正在加载...</div>
          </div>
        </div>
        <div class="col">
          <div class="card card--lift hoverable rise">
            <div class="card-title"><span class="stat-ic ic-cyan" style="width:26px;height:26px;border-radius:8px">${UI.icon('spark', 14)}</span><span>今日 AI 计划</span></div>
            <div id="dashPlan" style="color:var(--text-tertiary);font-size:13px;">正在加载...</div>
          </div>
          <div class="card card--lift hoverable rise">
            <div class="card-title"><span class="stat-ic ic-green" style="width:26px;height:26px;border-radius:8px">${UI.icon('brain', 14)}</span><span>学习记忆</span></div>
            <div id="dashMemory" style="color:var(--text-tertiary);font-size:13px;">正在加载...</div>
          </div>
        </div>
      </div>
    </div>`;

  // 加载数据
  try {
    const cr = await eel.api_list_courses()();
    const stats = await eel.api_get_review_stats(null)();
    document.getElementById('dashProgress').textContent = cr.courses.length;
    document.getElementById('dashProgressUnit').textContent = '门课程在学';
    document.getElementById('dashReview').textContent = stats.success ? stats.stats.due_today : 0;
    document.getElementById('dashReviewUnit').textContent = '道题待复习';
    document.getElementById('dashAI').textContent = stats.success ? stats.stats.due_today : 0;
    document.getElementById('dashAIUnit').textContent = '项智能推荐';

    const cont = document.getElementById('dashContinue');
    if (cr.success && cr.courses.length > 0) {
      cont.innerHTML = cr.courses.slice(0, 3).map(c =>
        `<div style="padding:10px 0;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:12px;cursor:pointer" onclick="UI.navigate('course',{courseId:${c.id}})">
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:500;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(c.name)}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">创建于 ${c.created_at}</div>
          </div>
          <span style="color:var(--accent);opacity:0.7;flex-shrink:0">→</span>
        </div>`).join('') || '<div style="padding:12px;text-align:center">还没有课程，去创建第一门吧</div>';
    } else {
      cont.innerHTML = '<div style="padding:12px;text-align:center">还没有课程，去创建第一门吧</div>';
    }
    document.getElementById('dashPlan').innerHTML = '<div style="padding:12px;text-align:center">完成课程与测验后，AI 会为你生成个性化计划</div>';
    document.getElementById('dashMemory').innerHTML = '<div style="padding:12px;text-align:center">还没有知识沉淀，去分析第一节课堂录音吧</div>';
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
});
