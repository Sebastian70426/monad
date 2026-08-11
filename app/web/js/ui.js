/* Monad UI 核心 — 母子菜单 / Popover / 命令中枢 / i18n */
const T = (k, p) => I18N.t(k, p);
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
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  },

  /* 全局导航（第一级） */
  GNAV: [
    { sec: 'nav.study', items: [{ page: 'dashboard', ic: 'home', key: 'nav.dashboard' }, { page: 'courses', ic: 'book', key: 'nav.courses' }] },
    { sec: 'nav.ai', items: [{ page: 'tutor', ic: 'spark', key: 'nav.tutor' }, { page: 'knowledge', ic: 'brain', key: 'nav.knowledge' }, { page: 'review', ic: 'refresh', key: 'nav.review' }] },
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
    // 顶栏标题（settings 不在 GNAV 列表，单独处理）
    const t = this.GNAV.flatMap(g => g.items).find(i => i.page === page) || (page === 'settings' ? { key: 'nav.settings' } : null);
    if (t && this.$('#tbTitle')) this.$('#tbTitle').textContent = T(t.key);
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
      let html = `<div class="gnav-logo"><span class="logo-mini">M</span><div><b>Monad</b><small>${T('nav.tagline')}</small></div></div>`;
      for (const g of this.GNAV) {
        html += `<div class="gnav-sec">${T(g.sec)}</div>`;
        for (const it of g.items) {
          html += `<div class="gnav-item" data-page="${it.page}">${this.icon(it.ic)}<span>${T(it.key)}</span></div>`;
        }
      }
      html += `<div class="gnav-foot"><div class="gnav-item" data-page="settings">${this.icon('gear')}<span>${T('nav.settings')}</span></div>
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
        <div class="aisub-icon new" onclick="UI.newGlobalChat()" title="${T('aisub.newChat')}">
          ${this.icon('plus')}<span class="tip">${T('aisub.newChat')}</span>
        </div>
        <div class="aisub-icon" id="aisubHistory" onclick="UI.togglePopover('history', this)" title="${T('aisub.history')}">
          ${this.icon('clock')}<span class="tip">${T('aisub.history')}</span>
        </div>
        <div class="aisub-icon" id="aisubCtx" onclick="UI.togglePopover('context', this)" title="${T('aisub.context')}">
          ${this.icon('layers')}<span class="tip">${T('aisub.context')}</span>
        </div>`;
      ai.classList.add('collapsed');
    }

    // 顶栏
    const tb = this.$('#topbar');
    if (tb && !tb.dataset.built) {
      tb.dataset.built = '1';
      tb.innerHTML = `
        <span class="tb-title" id="tbTitle">${T('nav.dashboard')}</span>
        <span class="status-pill" id="modelPill"><span class="pulse"></span>${T('topbar.modelReady', { provider: this.providerLabel() })}</span>
        <div class="tb-actions">
          <button class="tb-icon" id="cmdBtn" title="命令面板">${this.icon('search')}<span class="kbd">⌘K</span></button>
        </div>`;
      this.$('#cmdBtn').addEventListener('click', () => this.cmdPanel.toggle());
      // 异步同步后端设置的提供商，更新徽章
      try {
        eel.api_get_setting('llm_provider')().then(r => {
          if (r && r.success && r.value) {
            localStorage.setItem('llm_provider', r.value);
            const pill = UI.$('#modelPill');
            if (pill) pill.innerHTML = `<span class="pulse"></span>${T('topbar.modelReady', { provider: UI.providerLabel() })}`;
          }
        }).catch(() => {});
      } catch (e) {}
    }
  },

  /* 当前模型提供商的显示名（对应字典 st.p* 键） */
  providerLabel() {
    const p = localStorage.getItem('llm_provider') || 'deepseek';
    const key = 'st.p' + p.charAt(0).toUpperCase() + p.slice(1);
    return T(key);
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
    pv.innerHTML = `<div class="popover-title">${T('pop.historyTitle')}</div><div id="pvSessions">${T('pop.loading')}</div>`;
    try {
      eel.api_get_chat_sessions(null)().then(r => {
        const el = UI.$('#pvSessions');
        if (!r.success || !r.sessions || r.sessions.length === 0) {
          el.innerHTML = `<div class="pv-empty">${T('pop.noSessions')}</div>`; return;
        }
        el.innerHTML = r.sessions.slice(0, 30).map(s => `
          <div class="pv-item" onclick="UI.openSessionFromPopover(${s.id})">
            <span>💬</span>
            <div style="min-width:0"><b>${UI.esc(s.title || T('pop.chatNo', { id: s.id }))}</b><small>${s.updated_at}</small></div>
          </div>`).join('');
      }).catch(() => {});
    } catch (e) {}
  },

  renderPopoverContext(pv) {
    pv.innerHTML = `<div class="popover-title">${T('pop.contextTitle')}</div><div id="pvCourses">${T('pop.loading')}</div>`;
    try {
      eel.api_list_courses()().then(r => {
        const el = UI.$('#pvCourses');
        if (!r.success || !r.courses || r.courses.length === 0) {
          el.innerHTML = `<div class="pv-empty">${T('pop.noCourses')}</div>`; return;
        }
        const cur = UI.tutorState ? UI.tutorState.courseId : null;
        let h = `<div class="pv-item${cur === null ? ' active' : ''}" onclick="UI.pickCtx(null)">${T('pop.globalKB')}</div>`;
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
        { sec: 'cmd.section', list: [
          { label: T('cmd.upload'), hint: T('cmd.uploadHint'), go: 'dashboard' },
          { label: T('cmd.wake'), hint: T('cmd.wakeHint'), go: 'tutor' },
          { label: T('cmd.review'), hint: T('cmd.reviewHint'), go: 'review' },
          { label: T('cmd.courses'), hint: T('cmd.coursesHint'), go: 'courses' },
          { label: T('cmd.dashboard'), hint: T('cmd.dashboardHint'), go: 'dashboard' },
          { label: T('cmd.settings'), hint: T('cmd.settingsHint'), go: 'settings' },
        ]},
      ];
      const list = UI.$('#cmdList');
      if (!f) {
        list.innerHTML = items.map(g => `
          <div class="cmd-sec">${T(g.sec)}</div>` +
          g.list.map(c => `<div class="cmd-item" onclick="UI.cmdPanel.pick('${c.go}')">${UI.icon(c.go === 'dashboard' ? 'home' : c.go === 'courses' ? 'book' : c.go === 'tutor' ? 'spark' : c.go === 'review' ? 'refresh' : 'gear')}<div><b>${UI.esc(c.label)}</b><small>${UI.esc(c.hint)}</small></div></div>`).join('')
        ).join('');
      } else {
        const matched = items.flatMap(g => g.list).filter(c => (c.label + c.hint).toLowerCase().indexOf(f) >= 0);
        list.innerHTML = matched.length
          ? matched.map(c => `<div class="cmd-item" onclick="UI.cmdPanel.pick('${c.go}')">${UI.icon(c.go === 'dashboard' ? 'home' : c.go === 'courses' ? 'book' : c.go === 'tutor' ? 'spark' : c.go === 'review' ? 'refresh' : 'gear')}<div><b>${UI.esc(c.label)}</b><small>${UI.esc(c.hint)}</small></div></div>`).join('')
          : `<div class="cmd-empty">${T('cmd.noMatch')}</div>`;
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


/* ── AI Tutor 会话列表（侧边栏） ── */
UI.loadSessions = async function() {
  try {
    const r = await eel.api_get_chat_sessions(UI.tutorState ? UI.tutorState.courseId : null)();
    if (!r.success) return;
    const list = UI.$('#tutorSessionList');
    if (!list) return;
    const current = UI.tutorState ? UI.tutorState.sessionId : null;
    list.innerHTML = r.sessions.map(s => ''
      + '<div class="session-item' + (s.id === current ? ' active' : '') + '"'
      + ' onclick="UI.openTutorSession(' + s.id + ')"'
      + ' style="padding:8px 12px;cursor:pointer;font-size:12px;border-radius:8px;'
      + (s.id === current ? 'background:var(--accent-muted);' : '')
      + 'display:flex;justify-content:space-between;align-items:center">'
      + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">' + UI.esc(s.title || T('tut.newChat')) + '</span>'
      + '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();UI.deleteTutorSession(' + s.id + ')"'
      + ' style="padding:2px 6px;font-size:10px;opacity:0.5">×</button>'
      + '</div>'
    ).join('') || `<div style="padding:12px;text-align:center;font-size:11px;color:var(--text-tertiary)">${T('tut.noSessions')}</div>`;
  } catch (e) {}
};

UI.deleteTutorSession = async function(sid) {
  await eel.api_delete_chat_session(sid)();
  if (UI.tutorState && UI.tutorState.sessionId === sid) {
    UI.tutorState.sessionId = null;
    UI.tutorState.started = false;
    const inner = UI.$('#tutorMsgInner');
    const msgs = UI.$('#tutorMsgs');
    const ctxline = UI.$('#tutorCtxLine');
    if (inner) inner.innerHTML = '';
    if (msgs) msgs.style.display = 'none';
    if (ctxline) ctxline.style.display = 'none';
  }
  UI.loadSessions();
};


/* ── Eel 流式回调（供 Python 调用） ── */
/* 注意：eel 在 init 时用静态语法解析 eel.expose 调用注册；
   必须用「先定义函数、再按引用暴露」的写法，且注释里不能出现 eel.expose 加括号，
   否则静态扫描会被注释内容截断。 */

function start_tutor_stream(sources) {
  /* Python 推送来源信息时可在此处理 */
}
eel.expose(start_tutor_stream, 'start_tutor_stream');

function update_tutor_stream(chunk) {
  if (UI.updateStream) UI.updateStream(chunk);
}
eel.expose(update_tutor_stream, 'update_tutor_stream');

function end_tutor_stream() {
  /* Python 通知流式结束时调用 */
}
eel.expose(end_tutor_stream, 'end_tutor_stream');

function start_note_stream() {}
eel.expose(start_note_stream, 'start_note_stream');

function update_note_stream(chunk) {
  /* 笔记流式输出（当前 UI 等待整体完成后刷新，此处预留实时预览） */
}
eel.expose(update_note_stream, 'update_note_stream');

function end_note_stream() {}
eel.expose(end_note_stream, 'end_note_stream');

/* 文档索引进度回调（Python 后台索引线程推送） */
function update_index_progress(did, status, count) {
  UI.indexStatus(did, status, count);
}
eel.expose(update_index_progress, 'update_index_progress');

/* 文档索引状态：知识库页状态条 + 完成后刷新列表（其他页面时静默） */
UI.indexStatus = function(did, status, count) {
  const kbStatus = UI.$('#kbStatus');
  if (!kbStatus) return;
  const show = (text, type) => {
    kbStatus.classList.remove('hidden');
    kbStatus.style.color = type === 'ok' ? 'var(--green)' : type === 'err' ? 'var(--red)' : 'var(--text-primary)';
    kbStatus.textContent = text;
    if (type) setTimeout(() => kbStatus.classList.add('hidden'), 3000);
  };
  if (status === 'indexing') show(T('idx.indexing'));
  else if (status === 'done') show(T('idx.done', { count }), 'ok');
  else if (status === 'no_key') show(T('idx.noKey'), 'err');
  else show(T('idx.fail', { err: count || status }), 'err');
  if (typeof UI.kbLoadDocs === 'function') {
    const sel = UI.$('#kbCourseSelect');
    UI.kbLoadDocs(sel ? sel.value : null);
  }
};

/* 统一的聊天发送：创建会话 → 渲染气泡 → 流式接收（course 页与 tutor 页共用）
   images: 可选图片 data URL 数组（多模态，最多 3 张） */
UI.sendChatMessage = async function(state, inputEl, msgsEl, scrollEl, images) {
  const msg = inputEl.value.trim();
  if (!msg && !(images && images.length)) return;
  // 先确保会话存在，失败则中止（避免用 null sessionId 调后端）
  if (!state.sessionId) {
    try {
      const r = await eel.api_create_chat_session(state.courseId, state.lectureId)();
      if (!r.success) { alert(T('chat.createFail', { err: r.error || T('chat.unknown') })); return; }
      state.sessionId = r.session.id;
    } catch (e) { alert(T('chat.createFail', { err: e.message })); return; }
  }
  inputEl.value = '';
  const imgTag = images && images.length ? `<div style="font-size:11px;color:var(--text-tertiary);margin-top:6px">${T('chat.imageTag')} ×${images.length}</div>` : '';
  msgsEl.insertAdjacentHTML('beforeend', `<div style="display:flex;justify-content:flex-end;margin-bottom:14px"><div style="max-width:85%;padding:10px 14px;border-radius:14px 14px 4px 14px;background:var(--bg-card);border:1px solid var(--border-subtle);font-size:13px;line-height:1.6">${UI.esc(msg)}${imgTag}</div></div>`);
  scrollEl.scrollTop = scrollEl.scrollHeight;

  const aiBubble = document.createElement('div');
  aiBubble.style.cssText = 'display:flex;justify-content:flex-start;margin-bottom:14px';
  aiBubble.innerHTML = `<div style="max-width:85%;padding:10px 14px;border-radius:14px 14px 14px 4px;background:var(--accent-muted);border:1px solid rgba(124,140,255,0.18);font-size:13px;line-height:1.6;white-space:pre-wrap">${T('chat.thinking')}</div>`;
  msgsEl.appendChild(aiBubble);
  scrollEl.scrollTop = scrollEl.scrollHeight;

  try {
    let buffer = '';
    const bubble = aiBubble.querySelector('div');
    UI.updateStream = (chunk) => { buffer += chunk; bubble.textContent = buffer; scrollEl.scrollTop = scrollEl.scrollHeight; };
    await eel.api_tutor_chat(state.sessionId, msg, images || [])();
    bubble.textContent = buffer || T('chat.noReply');
  } catch (e) {
    bubble.textContent = '❌ ' + e.message;
  }
};
