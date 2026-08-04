/* Monad UI 核心 — 母子菜单 / Popover / 命令中枢 */
const UI = {
  $: (s, r = document) => r.querySelector(s),
  $$: (s, r = document) => [...r.querySelectorAll(s)],
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),

  ICONS: {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04A2.5 2.5 0 0 0 14.5 2z"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>'
  },

  /* 全局导航（第一级） */
  GNAV: [
    { sec: '学习', items: [{ page: 'dashboard', ic: 'home', label: '仪表盘' }, { page: 'courses', ic: 'book', label: '课程' }] },
    { sec: '智能', items: [{ page: 'tutor', ic: 'spark', label: 'AI Tutor' }, { page: 'knowledge', ic: 'brain', label: '知识库' }, { page: 'review', ic: 'refresh', label: '复习' }] },
  ],
  PAGES: {},
  current: null,

  icon(name, size) {
    const s = size ? ` style="width:${size}px;height:${size}px"` : '';
    return this.ICONS[name] ? this.ICONS[name].replace('<svg', `<svg${s}`) : this.ICONS.book;
  },

  register(page, fn) { this.PAGES[page] = fn; },

  navigate(page, params) {
    if (!this.PAGES[page]) { console.error('Unknown page:', page); return; }
    this.current = page;
    const slot = this.$('#page');
    const old = slot.querySelector('.page-view');
    const doRender = () => {
      slot.innerHTML = `<div class="page-view" data-page="${page}"></div>`;
      this.renderPage(page, params);
    };
    if (old) {
      old.classList.add('page-leaving');
      setTimeout(doRender, 120);
    } else doRender();

    // 全局导航高亮
    this.$$('#gnav .gnav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    // AI 副栏：仅 Tutor 页显示
    const aisub = this.$('#aisub');
    if (aisub) aisub.classList.toggle('collapsed', page !== 'tutor');
    // 关闭 Popover
    this.hidePopover();
    // 顶栏标题
    const t = this.GNAV.flatMap(g => g.items).find(i => i.page === page);
    if (t && this.$('#tbTitle')) this.$('#tbTitle').textContent = t.label;
  },

  renderPage(page, params) {
    const fn = this.PAGES[page];
    if (fn) fn(this.$('.page-view'), params || {});
  },

  splash() {
    const el = this.$('#splash');
    if (!el) { document.body.classList.add('ready'); return; }
    if (sessionStorage.getItem('monad_splash') === '1') { el.remove(); document.body.classList.add('ready'); return; }
    sessionStorage.setItem('monad_splash', '1');
    const steps = this.$$('.s-step', el);
    const welcome = this.$('.splash-welcome', el);
    steps.forEach((s, i) => setTimeout(() => s.classList.add('on'), 500 + i * 220));
    setTimeout(() => welcome && welcome.classList.add('on'), 500 + steps.length * 220 + 200);
    setTimeout(() => {
      el.classList.add('out');
      document.body.classList.add('ready');
      setTimeout(() => el.remove(), 550);
    }, 500 + steps.length * 220 + 200 + 800);
  },

  /* ═══ 外壳：全局导航 + AI 副栏 + 顶栏 ═══ */
  shell() {
    // 第一级：全局导航
    const gn = this.$('#gnav');
    if (gn && !gn.dataset.built) {
      gn.dataset.built = '1';
      let html = `<div class="gnav-logo"><span class="logo-mini">M</span><div><b>Monad</b><small>AI 学习伙伴</small></div></div>`;
      for (const g of this.GNAV) {
        html += `<div class="gnav-sec">${g.sec}</div>`;
        for (const it of g.items) {
          html += `<div class="gnav-item" data-page="${it.page}">${this.icon(it.ic)}<span>${it.label}</span></div>`;
        }
      }
      html += `<div class="gnav-foot"><div class="gnav-item" data-page="settings">${this.icon('gear')}<span>设置</span></div>
        <div class="gnav-user"><span class="avatar">S</span><b>Sebastian</b><span class="dot"></span></div></div>`;
      gn.innerHTML = html;
      this.$$('.gnav-item', gn).forEach(el => {
        el.addEventListener('click', () => this.navigate(el.dataset.page));
      });
    }

    // 第二级：AI 专属图标副栏
    const ai = this.$('#aisub');
    if (ai && !ai.dataset.built) {
      ai.dataset.built = '1';
      ai.innerHTML = `
        <div class="aisub-icon new" onclick="UI.newGlobalChat()" title="新对话">
          ${this.icon('plus')}<span class="tip">新对话</span>
        </div>
        <div class="aisub-icon" id="aisubHistory" onclick="UI.togglePopover('history', this)" title="历史记录">
          ${this.icon('clock')}<span class="tip">历史记录</span>
        </div>
        <div class="aisub-icon" id="aisubCtx" onclick="UI.togglePopover('context', this)" title="上下文/课程">
          ${this.icon('layers')}<span class="tip">上下文</span>
        </div>`;
      ai.classList.add('collapsed');
    }

    // 顶栏
    const tb = this.$('#topbar');
    if (tb && !tb.dataset.built) {
      tb.dataset.built = '1';
      tb.innerHTML = `
        <span class="tb-title" id="tbTitle">仪表盘</span>
        <span class="status-pill"><span class="pulse"></span>模型就绪 · DeepSeek V4</span>
        <div class="tb-actions">
          <button class="tb-icon" id="cmdBtn" title="命令面板">${this.icon('search')}<span class="kbd">⌘K</span></button>
          <button class="lang-toggle" id="langToggle">EN</button>
        </div>`;
      this.$('#cmdBtn').addEventListener('click', () => this.cmdPanel.toggle());
      this.$('#langToggle').addEventListener('click', () => {
        const next = localStorage.getItem('language') === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', next);
        location.reload();
      });
    }
  },

  /* ═══ Popover 悬浮面板 ═══ */
  togglePopover(type, anchor) {
    const pv = this.$('#popover');
    if (!pv) return;
    if (pv.dataset.type === type && !pv.classList.contains('hidden')) {
      this.hidePopover();
      return;
    }
    pv.dataset.type = type;
    const rect = anchor.getBoundingClientRect();
    pv.style.left = (rect.right + 10) + 'px';
    pv.style.top = (rect.top - 10) + 'px';

    if (type === 'history') this.renderPopoverHistory(pv);
    else if (type === 'context') this.renderPopoverContext(pv);

    pv.classList.remove('hidden');
  },

  hidePopover() {
    const pv = this.$('#popover');
    if (pv) pv.classList.add('hidden');
  },

  renderPopoverHistory(pv) {
    pv.innerHTML = '<div class="popover-title">历史对话</div><div id="pvSessions">加载中...</div>';
    try {
      eel.api_get_chat_sessions(null)().then(r => {
        const el = UI.$('#pvSessions');
        if (!r.success || !r.sessions || r.sessions.length === 0) {
          el.innerHTML = '<div class="pv-empty">暂无历史对话</div>'; return;
        }
        el.innerHTML = r.sessions.slice(0, 30).map(s => `
          <div class="pv-item" onclick="UI.openSessionFromPopover(${s.id})">
            <span>💬</span>
            <div style="min-width:0"><b>${UI.esc(s.title || '对话 #' + s.id)}</b><small>${s.updated_at}</small></div>
          </div>`).join('');
      }).catch(() => {});
    } catch (e) {}
  },

  renderPopoverContext(pv) {
    pv.innerHTML = '<div class="popover-title">选择提问范围</div><div id="pvCourses">加载中...</div>';
    try {
      eel.api_list_courses()().then(r => {
        const el = UI.$('#pvCourses');
        if (!r.success || !r.courses || r.courses.length === 0) {
          el.innerHTML = '<div class="pv-empty">还没有课程</div>'; return;
        }
        const cur = UI.tutorState ? UI.tutorState.courseId : null;
        let h = `<div class="pv-item${cur === null ? ' active' : ''}" onclick="UI.pickCtx(null)">🌍 全局知识库</div>`;
        r.courses.forEach(c => {
          h += `<div class="pv-item${cur === c.id ? ' active' : ''}" onclick="UI.pickCtx(${c.id})">📚 ${UI.esc(c.name)}</div>`;
        });
        el.innerHTML = h;
      }).catch(() => {});
    } catch (e) {}
  },

  openSessionFromPopover(sid) {
    this.hidePopover();
    this.navigate('tutor');
    setTimeout(() => {
      if (UI.tutorState) UI.tutorState.sessionId = sid;
      if (typeof UI.openTutorSession === 'function') UI.openTutorSession(sid);
    }, 250);
  },

  pickCtx(cid) {
    if (UI.tutorState) { UI.tutorState.courseId = cid; UI.tutorState.lectureId = null; }
    this.hidePopover();
    if (typeof UI.loadCtxLabel === 'function') UI.loadCtxLabel();
  },

  newGlobalChat() {
    this.hidePopover();
    this.navigate('tutor');
    setTimeout(() => { if (typeof UI.newTutorSession === 'function') UI.newTutorSession(); }, 250);
  },

  /* ═══ 命令中枢 ⌘K ═══ */
  cmdPanel: {
    toggle() {
      const o = UI.$('#cmdOverlay');
      if (!o) return;
      o.classList.toggle('hidden');
      if (!o.classList.contains('hidden')) {
        UI.$('#cmdInput').value = '';
        UI.cmdPanel.render('');
        setTimeout(() => UI.$('#cmdInput').focus(), 60);
      }
    },
    render(filter) {
      const f = (filter || '').trim().toLowerCase();
      const items = [
        { sec: '操作', list: [
          { label: '上传新录音', hint: '语音转文字 → AI 笔记', go: 'dashboard' },
          { label: '唤醒 AI Tutor', hint: '基于课程与知识库问答', go: 'tutor' },
          { label: '开始复习', hint: 'SM-2 间隔复习', go: 'review' },
          { label: '打开课程', hint: '课程列表', go: 'courses' },
          { label: '返回仪表盘', hint: '今日概览', go: 'dashboard' },
          { label: '打开设置', hint: 'API Key 与语言', go: 'settings' },
        ]},
      ];
      const list = UI.$('#cmdList');
      if (!f) {
        list.innerHTML = items.map(g => `
          <div class="cmd-sec">${g.sec}</div>` +
          g.list.map(c => `<div class="cmd-item" onclick="UI.cmdPanel.pick('${c.go}')">${UI.icon(c.go === 'dashboard' ? 'home' : c.go === 'courses' ? 'book' : c.go === 'tutor' ? 'spark' : c.go === 'review' ? 'refresh' : 'gear')}<div><b>${UI.esc(c.label)}</b><small>${UI.esc(c.hint)}</small></div></div>`).join('')
        ).join('');
      } else {
        const matched = items.flatMap(g => g.list).filter(c => (c.label + c.hint).toLowerCase().indexOf(f) >= 0);
        list.innerHTML = matched.length
          ? matched.map(c => `<div class="cmd-item" onclick="UI.cmdPanel.pick('${c.go}')">${UI.icon(c.go === 'dashboard' ? 'home' : c.go === 'courses' ? 'book' : c.go === 'tutor' ? 'spark' : c.go === 'review' ? 'refresh' : 'gear')}<div><b>${UI.esc(c.label)}</b><small>${UI.esc(c.hint)}</small></div></div>`).join('')
          : '<div class="cmd-empty">没有匹配的命令</div>';
      }
    },
    pick(page) {
      this.toggle();
      UI.navigate(page);
    }
  }
};

/* 全局键盘 */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    UI.cmdPanel.toggle();
  }
  if (e.key === 'Escape') {
    const o = UI.$('#cmdOverlay');
    if (o && !o.classList.contains('hidden')) o.classList.add('hidden');
    else UI.hidePopover();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('cmdInput');
  if (input) input.addEventListener('input', () => UI.cmdPanel.render(input.value));
});

/* 点击空白关闭 Popover */
document.addEventListener('click', (e) => {
  if (!e.target.closest('.aisub-icon') && !e.target.closest('#popover')) {
    UI.hidePopover();
  }
});

/* 全局启动 */
UI.splash();
UI.shell();
setTimeout(() => UI.navigate('dashboard'), 60);

/* ═══ 追加：悬浮下拉菜单（挂载到 UI 对象） ═══ */
UI.dropdownMenu = function(anchor, items) {
  UI.closeMenu();
  const menu = document.createElement('div');
  menu.className = 'dropdown-menu';
  menu.id = 'uiDropdown';
  items.forEach(it => {
    if (it.divider) {
      const d = document.createElement('div');
      d.className = 'dm-divider';
      menu.appendChild(d);
      return;
    }
    const el = document.createElement('div');
    el.className = 'dm-item' + (it.danger ? ' danger' : '');
    el.innerHTML = `${it.icon || ''}<span>${UI.esc(it.label)}</span>`;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      UI.closeMenu();
      if (it.onClick) it.onClick();
    });
    menu.appendChild(el);
  });
  document.body.appendChild(menu);

  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth || 200;
  let left = r.right - mw;
  if (left < 8) left = 8;
  let top = r.bottom + 6;
  if (top + (menu.offsetHeight || 200) > window.innerHeight - 8) {
    top = r.top - (menu.offsetHeight || 200) - 6;
  }
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  setTimeout(() => {
    document.addEventListener('click', UI._menuCloseHandler = () => UI.closeMenu(), { once: true });
  }, 0);
};

UI.closeMenu = function() {
  const m = UI.$('#uiDropdown');
  if (m) m.remove();
  if (UI._menuCloseHandler) {
    document.removeEventListener('click', UI._menuCloseHandler);
    UI._menuCloseHandler = null;
  }
};
