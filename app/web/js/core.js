/* Monad core.js — 语言/词典 · 图标库 · 命令面板 · 启动动画 · 应用外壳 */
const UI = (() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const T = {
    zh: {
      'app.tagline':'AI 学习伙伴',
      'nav.learn':'学习','nav.ai':'智能','nav.system':'系统',
      'nav.home':'仪表盘','nav.courses':'课程','nav.tutor':'AI Tutor',
      'nav.knowledge':'知识库','nav.review':'复习','nav.settings':'设置',
      'status.ready':'模型就绪','lang.toggle':'EN',
      'cmd.placeholder':'输入命令或搜索…','cmd.empty':'没有匹配的命令',
      'cmd.record':'上传新录音','cmd.record.hint':'语音转文字 → AI 笔记',
      'cmd.tutor':'唤醒 AI Tutor','cmd.tutor.hint':'基于课程与知识库问答',
      'cmd.review':'开始复习','cmd.review.hint':'SM-2 间隔复习',
      'cmd.courses':'打开课程','cmd.courses.hint':'课程列表与学习空间',
      'cmd.home':'返回仪表盘','cmd.home.hint':'今日概览',
      'cmd.settings':'打开设置','cmd.settings.hint':'API Key 与语言',
      'common.loading':'加载中...','common.empty':'暂无数据','common.error':'出错了',
      'common.save':'保存','common.saved':'已保存','common.cancel':'取消',
      'common.confirm':'确认','common.delete':'删除','common.back':'返回',
      'dash.sub':'今日 AI 学习节奏已为你整理好',
      'dash.progress':'学习进度','dash.review':'今日待复习','dash.ai':'AI 推荐任务',
      'dash.continue':'继续学习','dash.continueBtn':'继续 →',
      'dash.plan':'今日 AI 计划','dash.memory':'学习记忆',
      'dash.noData':'还没有课程，去创建第一门课吧','dash.memoryEmpty':'还没有知识沉淀，去分析第一节课堂录音吧',
      'dash.week':'近 14 天学习投入',
      'course.title':'课程','course.subtitle':'管理你的所有课程',
      'course.create':'新建课程','course.placeholder':'课程名称，如：工程力学',
      'course.empty.title':'还没有课程','course.empty.desc':'创建你的第一门课程，开始学习之旅',
      'course.lectures':'节课堂','course.notes':'篇笔记','course.docs':'份资料',
      'course.detail':'课程空间','course.lecturesTitle':'课堂记录','course.filesTitle':'课程资料',
      'course.tabNote':'笔记','course.tabTranscript':'转录','course.tabQuiz':'测验',
      'course.genNote':'生成笔记','course.genQuiz':'生成测验','course.noNote':'这篇课堂记录还没有笔记，点击生成',
      'course.aiPlaceholder':'围绕当前课程与课时提问...','course.tutorTitle':'AI Tutor',
      'course.noLecture':'还没有课堂记录','course.noLecture.desc':'去「新录音」分析第一节',
      'course.nodocs':'暂无资料',
      'tutor.subtitle':'懂你的课程，也懂你的知识库',
      'tutor.newSession':'新对话','tutor.sessions':'对话','tutor.ctxCourse':'上下文 · 课程','tutor.ctxLecture':'课时',
      'tutor.placeholder':'输入你的问题，例如：解释伯努利方程...',
      'tutor.chip.simpler':'简化','tutor.chip.example':'例题','tutor.chip.quiz':'出题','tutor.chip.visual':'类比',
      'tutor.thinking':'AI 正在思考','tutor.sources':'引用来源',
      'tutor.empty':'选一个课程或课时，向 AI 提问',
      'kb.subtitle':'课程资料 + RAG 向量索引','kb.upload':'上传资料','kb.drop':'点击选择 PDF / PPT / TXT / MD 文件',
      'kb.empty':'还没有资料，上传后 AI 回答将引用这些内容',
      'kb.indexing':'索引中','kb.indexed':'已索引','kb.chunks':'分块','kb.delete':'删除',
      'review.subtitle':'SM-2 间隔复习 · 让知识进入长期记忆',
      'review.due':'今日待复习','review.done':'已完成','review.mastery':'掌握率',
      'review.empty':'今天没有待复习的题目','review.empty.desc':'去课程空间生成测验，AI 会自动安排复习计划',
      'review.remember':'记住了','review.fuzzy':'有点模糊','review.forgot':'忘了',
      'settings.subtitle':'API Key · 语言 · 模型状态',
      'settings.model':'模型状态','settings.deepseek':'DeepSeek API Key','settings.deepseekDesc':'用于 AI 笔记生成、AI Tutor 与测验',
      'settings.groq':'Groq API Key','settings.groqDesc':'用于 Whisper 语音转录',
      'settings.test':'测试','settings.testing':'测试中...','settings.testOk':'连接成功','settings.testFail':'连接失败',
      'settings.lang':'界面语言','settings.langDesc':'选择界面语言',
      'upload.subtitle':'语音转文字 → AI 生成课堂笔记',
      'upload.step1':'选择课程','upload.step2':'选择录音','upload.step3':'开始分析',
      'upload.chooseFile':'选择音频文件','upload.hint':'MP3 / M4A / WAV / FLAC · 最大 200MB',
      'upload.start':'开始分析','upload.transcribing':'语音转文字 (Whisper)','upload.generating':'AI 生成课堂笔记',
      'upload.viewNote':'查看笔记','upload.again':'再来一次',
      'upload.done':'分析完成','upload.done.desc':'笔记已保存到课程空间',
      'note.copy':'复制','note.copied':'已复制','note.export':'导出 Markdown','note.transcript':'原始转录',
      'note.noNote':'这篇课堂记录还没有笔记','note.goGen':'去生成',
      'tutor.context':'上下文',
    },
    en: {
      'app.tagline':'AI Study Companion',
      'nav.learn':'Study','nav.ai':'Intelligence','nav.system':'System',
      'nav.home':'Dashboard','nav.courses':'Courses','nav.tutor':'AI Tutor',
      'nav.knowledge':'Knowledge','nav.review':'Review','nav.settings':'Settings',
      'status.ready':'Model Ready','lang.toggle':'中',
      'cmd.placeholder':'Type a command or search…','cmd.empty':'No matching command',
      'cmd.record':'Upload Recording','cmd.record.hint':'Speech to text → AI notes',
      'cmd.tutor':'Ask AI Tutor','cmd.tutor.hint':'Q&A grounded in your knowledge base',
      'cmd.review':'Start Review','cmd.review.hint':'SM-2 spaced repetition',
      'cmd.courses':'Open Courses','cmd.courses.hint':'Course list & spaces',
      'cmd.home':'Back to Dashboard','cmd.home.hint':'Today overview',
      'cmd.settings':'Open Settings','cmd.settings.hint':'API keys & language',
      'common.loading':'Loading...','common.empty':'No data','common.error':'Something went wrong',
      'common.save':'Save','common.saved':'Saved','common.cancel':'Cancel',
      'common.confirm':'Confirm','common.delete':'Delete','common.back':'Back',
      'dash.sub':'Your AI learning rhythm, ready for today',
      'dash.progress':'Progress','dash.review':'To review','dash.ai':'AI picks',
      'dash.continue':'Continue Learning','dash.continueBtn':'Continue →',
      'dash.plan':"Today's AI Plan",'dash.memory':'Learning Memory',
      'dash.noData':'No courses yet — create your first one','dash.memoryEmpty':'No knowledge yet — analyze your first lecture',
      'dash.week':'Last 14 days',
      'course.title':'Courses','course.subtitle':'Manage all your courses',
      'course.create':'New Course','course.placeholder':'Course name, e.g. Fluid Mechanics',
      'course.empty.title':'No courses yet','course.empty.desc':'Create your first course and start learning',
      'course.lectures':'lectures','course.notes':'notes','course.docs':'docs',
      'course.detail':'Course Space','course.lecturesTitle':'Lectures','course.filesTitle':'Materials',
      'course.tabNote':'Note','course.tabTranscript':'Transcript','course.tabQuiz':'Quiz',
      'course.genNote':'Generate Note','course.genQuiz':'Generate Quiz','course.noNote':'No note yet — generate one',
      'course.aiPlaceholder':'Ask about this course & lecture...','course.tutorTitle':'AI Tutor',
      'course.noLecture':'No lectures yet','course.noLecture.desc':'Analyze your first recording',
      'course.nodocs':'No materials',
      'tutor.subtitle':'Knows your courses, knows your knowledge base',
      'tutor.newSession':'New Chat','tutor.sessions':'Chats','tutor.ctxCourse':'Context · Course','tutor.ctxLecture':'Lecture',
      'tutor.placeholder':'Ask anything, e.g. explain Bernoulli equation...',
      'tutor.chip.simpler':'Simpler','tutor.chip.example':'Example','tutor.chip.quiz':'Quiz','tutor.chip.visual':'Visualize',
      'tutor.thinking':'AI is thinking','tutor.sources':'Sources',
      'tutor.empty':'Pick a course or lecture and ask AI',
      'kb.subtitle':'Course materials + RAG vector index','kb.upload':'Upload','kb.drop':'Select PDF / PPT / TXT / MD files',
      'kb.empty':'No materials yet — upload to ground AI answers',
      'kb.indexing':'Indexing','kb.indexed':'Indexed','kb.chunks':'chunks','kb.delete':'Delete',
      'review.subtitle':'SM-2 spaced repetition · knowledge into long-term memory',
      'review.due':'Due today','review.done':'Completed','review.mastery':'Mastery',
      'review.empty':'Nothing due today','review.empty.desc':'Generate quizzes in a course and AI will schedule reviews',
      'review.remember':'Remembered','review.fuzzy':'Fuzzy','review.forgot':'Forgot',
      'settings.subtitle':'API Keys · Language · Model',
      'settings.model':'Model Status','settings.deepseek':'DeepSeek API Key','settings.deepseekDesc':'Notes, AI Tutor & quizzes',
      'settings.groq':'Groq API Key','settings.groqDesc':'Whisper speech transcription',
      'settings.test':'Test','settings.testing':'Testing...','settings.testOk':'Connected','settings.testFail':'Failed',
      'settings.lang':'Language','settings.langDesc':'Choose interface language',
      'upload.subtitle':'Speech to text → AI notes',
      'upload.step1':'Choose course','upload.step2':'Choose audio','upload.step3':'Analyze',
      'upload.chooseFile':'Choose audio file','upload.hint':'MP3 / M4A / WAV / FLAC · up to 200MB',
      'upload.start':'Start Analysis','upload.transcribing':'Transcribing (Whisper)','upload.generating':'Generating notes with AI',
      'upload.viewNote':'View Note','upload.again':'Again',
      'upload.done':'Analysis complete','upload.done.desc':'Note saved to course space',
      'note.copy':'Copy','note.copied':'Copied','note.export':'Export Markdown','note.transcript':'Transcript',
      'note.noNote':'No note yet for this lecture','note.goGen':'Generate',
      'tutor.context':'Context',
    }
  };

  const lang = () => (localStorage.getItem('language') === 'en' ? 'en' : 'zh');
  const t = (key, vars) => {
    let v = T[lang()];
    for (const k of String(key).split('.')) v = v ? v[k] : undefined;
    if (v === undefined) v = key;
    if (vars) for (const k in vars) v = v.replace('{' + k + '}', vars[k]);
    return v;
  };

  const bus = {};
  const on = (name, fn) => { (bus[name] = bus[name] || []).push(fn); };
  const emit = (name, data) => (bus[name] || []).forEach(fn => { try { fn(data); } catch (e) {} });
  window.start_note_stream     = () => emit('note:start');
  window.update_note_stream    = (chunk) => emit('note:chunk', chunk);
  window.end_note_stream       = () => emit('note:end');
  window.start_tutor_stream    = (sources) => emit('tutor:start', sources);
  window.update_tutor_stream   = (chunk) => emit('tutor:chunk', chunk);
  window.end_tutor_stream      = () => emit('tutor:end');
  window.update_index_progress = (did, status, count) => emit('doc:index', { did, status, count });

  let toastTimer = null;
  const toast = (msg, type = '') => {
    const old = $('.toast'); if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = (type === 'error' ? '⚠ ' : type === 'success' ? '✓ ' : '') + msg;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 2400);
  };

  const inline = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
  const md = (src) => {
    src = String(src || '');
    let html = '', inUl = false, inP = false;
    const closeP = () => { if (inP) { html += '</p>'; inP = false; } };
    const closeUl = () => { if (inUl) { html += '</ul>'; inUl = false; } };
    for (const raw of src.split('\n')) {
      const l = raw.trimEnd();
      const h = l.match(/^(#{1,4})\s+(.*)/);
      if (h) { closeP(); closeUl(); html += `<h${Math.min(h[1].length + 1, 5)}>${inline(h[2])}</h${Math.min(h[1].length + 1, 5)}>`; continue; }
      if (/^[-*]\s+/.test(l)) { closeP(); if (!inUl) { html += '<ul>'; inUl = true; } html += `<li>${inline(l.replace(/^[-*]\s+/, ''))}</li>`; continue; }
      if (/^\d+\.\s+/.test(l)) { closeP(); closeUl(); html += `<ol><li>${inline(l.replace(/^\d+\.\s+/, ''))}</li></ol>`; continue; }
      if (/^\s*$/.test(l)) { closeP(); closeUl(); continue; }
      closeUl();
      if (!inP) { html += '<p>'; inP = true; }
      html += (inP && html.slice(-4) !== '<p>' ? '<br>' : '') + inline(l);
    }
    closeP(); closeUl();
    return html;
  };

  const todayStr = () => new Date().toLocaleDateString(lang() === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', day: 'numeric', weekday: 'long' });
  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return lang() === 'zh' ? '刚刚' : 'just now';
    if (diff < 3600) return lang() === 'zh' ? Math.floor(diff / 60) + ' 分钟前' : Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return lang() === 'zh' ? Math.floor(diff / 3600) + ' 小时前' : Math.floor(diff / 3600) + 'h ago';
    return new Date(ts).toLocaleDateString();
  };

  const I = {
    home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    book:'<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h14"/>',
    spark:'<path d="M12 3l2.1 5.4L19.5 10.5l-5.4 2.1L12 18l-2.1-5.4L4.5 10.5l5.4-2.1z"/>',
    brain:'<circle cx="12" cy="5" r="2.4"/><circle cx="5" cy="10" r="2.4"/><circle cx="19" cy="10" r="2.4"/><circle cx="9" cy="18" r="2.4"/><circle cx="15" cy="18" r="2.4"/><path d="M11.5 7.2 9.7 15.8M13 7.2l1.8 8.6M6.9 11.2l3.1 4.9M17.1 11.2l-3.1 4.9"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 15.6-6.1L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.6 6.1L3 16"/><path d="M3 21v-5h5"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v5"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    trash:'<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    send:'<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
    check:'<path d="M4 12.5 9.5 18 20 6.5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
    layers:'<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download:'<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    chat:'<path d="M21 12a8 8 0 0 1-8 8H4l2.3-2.9A8 8 0 1 1 21 12z"/>',
    bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.4 1.5 2.6h4c0-1.2.7-2 1.5-2.6A6 6 0 0 0 12 3z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',
    pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trend:'<path d="m3 17 6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
    atom:'<circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2-2 .1-7.4-4.5-11.9C11.2 3.8 5.8 1.7 3.8 3.7c-2 2-.1 7.4 4.5 11.9 4.6 4.5 9.9 6.6 11.9 4.6z"/><path d="M15.7 15.7c4.5-4.6 6.6-9.9 4.6-11.9-2-2-7.4-.1-11.9 4.5C3.9 12.9 1.8 18.2 3.8 20.2c2 2 7.4.1 11.9-4.5z"/>',
    flame:'<path d="M12 3c.5 3 2.5 4.5 2.5 7.5a2.5 2.5 0 0 1-5 0C9.5 8 11 6 12 3z"/><path d="M8.5 15a3.5 3.5 0 1 0 7 0c0-1.5-.8-2.6-1.8-3.8"/>',
    flask:'<path d="M10 2v6L4.5 17.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3.5L14 8V2"/><path d="M8.5 2h7"/><path d="M7 15h10"/>',
    dna:'<path d="M5 4c4 2 4 14 0 16M19 4c-4 2-4 14 0 16M5 8h14M5 16h14"/>',
    calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    code:'<path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/>',
    lang:'<path d="M5 8h14M12 3v5M8 8c.5 5 3 8 4 10M16 8c-.5 5-3 8-4 10M10 14h4"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    palette:'<path d="M12 2a10 10 0 1 0 0 20 3 3 0 0 0 3-3v-.5a2.5 2.5 0 0 1 2.5-2.5H20a2 2 0 0 0 2-2 10 10 0 0 0-10-10z"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="10" r="1"/>',
    activity:'<path d="M3 12h4l2 6 4-14 2 8h6"/>',
  };
  const icon = (name, size = 17) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px">${I[name] || I.doc}</svg>`;

  const ICON_NAMES = ['gear','atom','flame','flask','dna','calc','code','trend','book','lang','music','palette','activity','pencil'];
  const ICON_LABEL = {gear:'机械/力学',atom:'物理',flame:'热力/能源',flask:'化学',dna:'生物',calc:'数学',code:'编程',trend:'经济/金融',book:'人文/哲学',lang:'语言',music:'音乐',palette:'艺术',activity:'医学',pencil:'写作'};
  const RULES = [
    [/物理|量子|电磁|光学/,'atom'],[/热力|热学|能源/,'flame'],[/化学|化工/,'flask'],
    [/生物|基因|医学/,'dna'],[/数学|统计|微积分|高数/,'calc'],[/编程|计算机|算法|软件/,'code'],
    [/经济|金融|管理/,'trend'],[/哲学|历史|文学|政治|法学|人文|中文/,'book'],[/英语|语言|外语|日语/,'lang'],
    [/音乐/,'music'],[/美术|设计|艺术/,'palette'],[/力学|机械|工程|自动化/,'gear'],[/写作|论文|语文/,'pencil']
  ];
  const matchIcon = (name) => { for (const [re, id] of RULES) if (re.test(name)) return id; return 'book'; };

  const bindIconPicker = (btnEl, initialIcon, initialColor, onPick) => {
    let cur = initialIcon, color = initialColor;
    let picker = document.createElement('div');
    picker.className = 'icon-picker';
    picker.innerHTML = `
      <div class="ip-head"><b>课程图标</b><span class="ip-tag"></span></div>
      <div class="ip-grid">${ICON_NAMES.map(id => `<div class="ip-cell" data-id="${id}" title="${ICON_LABEL[id]}">${icon(id, 17)}</div>`).join('')}</div>
      <div class="ip-colors">
        ${['#7C8CFF','#22D3EE','#34D399','#FBBF24','#F87171','#A78BFA'].map((c, i) => `<i data-c="${c}" class="${i === 0 ? 'on' : ''}" style="background:${c}"></i>`).join('')}
      </div>
      <div class="ip-note">点击图标替换 · 点击空白处关闭</div>`;
    document.body.appendChild(picker);
    const apply = () => {
      btnEl.innerHTML = icon(cur, 20);
      btnEl.style.color = color;
      btnEl.style.borderColor = color + '88';
      picker.querySelector('.ip-tag').textContent = '已匹配: ' + (ICON_LABEL[cur] || cur);
      if (onPick) onPick(cur, color);
    };
    apply();
    picker.querySelectorAll('.ip-cell').forEach(cell => cell.addEventListener('click', (e) => {
      e.stopPropagation(); cur = cell.dataset.id; apply(); picker.classList.remove('show');
    }));
    picker.querySelectorAll('.ip-colors i').forEach(sw => sw.addEventListener('click', (e) => {
      e.stopPropagation();
      color = sw.dataset.c;
      picker.querySelectorAll('.ip-colors i').forEach(x => x.classList.remove('on'));
      sw.classList.add('on'); apply();
    }));
    btnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const r = btnEl.getBoundingClientRect();
      picker.style.left = Math.min(r.left, window.innerWidth - 320) + 'px';
      picker.style.top = (r.bottom + 10) + 'px';
      picker.classList.toggle('show');
    });
    document.addEventListener('click', () => picker.classList.remove('show'));
    return { apply, set: (ic, c) => { cur = ic; color = c; apply(); } };
  };

  const skeleton = (rows = 3) => `<div class="skeleton" style="height:14px;margin:10px 0"></div>`.repeat(rows);
  const orb = (size = 30) => `
    <span class="ai-orb" style="width:${size}px;height:${size}px">
      <span class="orb-ring"></span><span class="orb-ring2"></span><span class="orb-core"></span>
    </span>`;

  const navigate = (page) => {
    const main = $('.page') || document.body;
    main.classList.add('page-leaving');
    setTimeout(() => { location.href = page; }, 170);
  };

  const splash = () => {
    const el = $('#splash');
    if (!el) { document.body.classList.add('ready'); return; }
    if (sessionStorage.getItem('monad_splash') === '1') { el.remove(); document.body.classList.add('ready'); return; }
    sessionStorage.setItem('monad_splash', '1');
    const steps = $$('.s-step', el);
    const welcome = $('.splash-welcome', el);
    steps.forEach((s, i) => setTimeout(() => s.classList.add('on'), 600 + i * 260));
    setTimeout(() => welcome && welcome.classList.add('on'), 600 + steps.length * 260 + 240);
    setTimeout(() => {
      el.classList.add('out');
      document.body.classList.add('ready');
      setTimeout(() => el.remove(), 650);
    }, 600 + steps.length * 260 + 240 + 950);
  };

  const PAGE_TITLES = {
    'index.html': t('nav.home'), 'courses.html': t('nav.courses'),
    'course.html': t('course.detail'), 'tutor.html': t('nav.tutor'),
    'knowledge.html': t('nav.knowledge'), 'review.html': t('nav.review'),
    'settings.html': t('nav.settings'), 'upload.html': t('cmd.record'), 'note.html': t('course.tabNote'),
  };
  const NAV = [
    { sec: 'nav.learn', items: [{ page: 'index.html', ic: 'home', label: 'nav.home' }, { page: 'courses.html', ic: 'book', label: 'nav.courses' }] },
    { sec: 'nav.ai', items: [{ page: 'tutor.html', ic: 'spark', label: 'nav.tutor' }, { page: 'knowledge.html', ic: 'brain', label: 'nav.knowledge' }, { page: 'review.html', ic: 'refresh', label: 'nav.review' }] },
    { sec: 'nav.system', items: [{ page: 'settings.html', ic: 'gear', label: 'nav.settings' }] },
  ];

  const shell = (activePage) => {
    const sb = $('#sidebar');
    if (sb) {
      let html = `
        <div class="sidebar-logo">
          <span class="logo-mini">M</span>
          <div><b>Monad</b><small>${t('app.tagline')}</small></div>
        </div>`;
      for (const g of NAV) {
        html += `<div class="nav-sec">${t(g.sec)}</div>`;
        for (const it of g.items) {
          html += `<a class="nav-item${it.page === activePage ? ' active' : ''}" data-page="${it.page}">${icon(it.ic)}<span>${t(it.label)}</span></a>`;
        }
      }
      html += `<div class="sidebar-foot"><div class="sidebar-user"><span class="avatar">S</span><b>Sebastian</b><span class="dot"></span></div></div>`;
      sb.innerHTML = html;
      $$('[data-page]', sb).forEach(a => a.addEventListener('click', (e) => {
        e.preventDefault();
        const p = a.getAttribute('data-page');
        if (p !== activePage) navigate(p);
      }));
    }

    const tb = $('#topbar');
    if (tb && !tb.dataset.built) {
      tb.dataset.built = '1';
      const title = PAGE_TITLES[location.pathname.split('/').pop()] || t('nav.home');
      tb.innerHTML = `
        <span class="tb-title">${esc(title)}</span>
        <span class="status-pill"><span class="pulse"></span>${t('status.ready')} · DeepSeek V4</span>
        <div class="tb-actions">
          <button class="tb-icon" id="cmdBtn" title="命令面板">${icon('search', 16)}<span class="kbd">⌘K</span></button>
          <button class="tb-icon" id="micBtn" title="${t('cmd.record')}">${icon('mic', 16)}</button>
          <button class="lang-toggle" id="langToggle">${t('lang.toggle')}</button>
        </div>`;
      $('#langToggle').addEventListener('click', () => {
        const next = lang() === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', next);
        try { API.saveSetting('language', next); } catch (e) {}
        location.reload();
      });
      $('#micBtn').addEventListener('click', () => navigate('upload.html'));
      $('#cmdBtn').addEventListener('click', () => cmdPanel.open());
    }
  };

  const cmdPanel = (() => {
    let overlay, input, list;
    const COMMANDS = () => [
      { ic: 'mic', label: t('cmd.record'), hint: t('cmd.record.hint'), go: 'upload.html' },
      { ic: 'spark', label: t('cmd.tutor'), hint: t('cmd.tutor.hint'), go: 'tutor.html' },
      { ic: 'refresh', label: t('cmd.review'), hint: t('cmd.review.hint'), go: 'review.html' },
      { ic: 'book', label: t('cmd.courses'), hint: t('cmd.courses.hint'), go: 'courses.html' },
      { ic: 'home', label: t('cmd.home'), hint: t('cmd.home.hint'), go: 'index.html' },
      { ic: 'gear', label: t('cmd.settings'), hint: t('cmd.settings.hint'), go: 'settings.html' },
    ];
    const render = (filter) => {
      const f = (filter || '').trim();
      const items = COMMANDS().filter(c => !f || (c.label + c.hint).indexOf(f) >= 0);
      list.innerHTML = items.length
        ? items.map(c => `<div class="cmd-item" data-go="${c.go}"><span class="cmd-ic">${icon(c.ic, 15)}</span><div><b>${esc(c.label)}</b><small>${esc(c.hint)}</small></div></div>`).join('')
        : `<div class="cmd-empty">${t('cmd.empty')}</div>`;
      $$('.cmd-item', list).forEach(el => el.addEventListener('click', () => { close(); navigate(el.dataset.go); }));
    };
    const open = () => { if (!overlay) return; overlay.classList.add('show'); input.value = ''; render(''); setTimeout(() => input.focus(), 60); };
    const close = () => overlay && overlay.classList.remove('show');
    const init = () => {
      if (document.getElementById('cmdOverlay')) return;
      overlay = document.createElement('div');
      overlay.className = 'cmd-overlay';
      overlay.id = 'cmdOverlay';
      overlay.innerHTML = `
        <div class="cmd-panel">
          <div class="cmd-input-wrap">${icon('search', 17)}
            <input id="cmdInput" placeholder="${t('cmd.placeholder')}"><kbd>Esc</kbd>
          </div>
          <div class="cmd-list"></div>
        </div>`;
      document.body.appendChild(overlay);
      input = overlay.querySelector('#cmdInput');
      list = overlay.querySelector('.cmd-list');
      input.addEventListener('input', () => render(input.value));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
      document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.classList.contains('show') ? close() : open(); }
        if (e.key === 'Escape') close();
      });
    };
    return { init, open, close };
  })();

  return { $, $$, esc, t, lang, on, emit, toast, md, icon, matchIcon, ICON_NAMES, ICON_LABEL, bindIconPicker,
           skeleton, orb, splash, shell, cmdPanel, navigate, todayStr, timeAgo };
})();
