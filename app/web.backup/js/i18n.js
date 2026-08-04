const i18n = {
  _currentLang: 'en',
  _loaded: false,

  _data: {
    en: {
      "app": {"titlebar": "Monad"},
      "sidebar": {
        "logo": "Monad",
        "sections": {"study":"Study","ai":"AI","system":"System"},
        "dashboard":"Dashboard","courses":"Courses","lectureAnalysis":"Lecture Analysis",
        "aiTutor":"AI Tutor","knowledgeBase":"Knowledge Base","settings":"Settings",
        "user":"Sebastian"
      },
      "dashboard": {
        "greeting_morning":"Good morning","greeting_afternoon":"Good afternoon","greeting_evening":"Good evening",
        "greeting_name":"{greeting}, Sebastian","subtitle":"{count} courses to review today","subtitle_none":"Start your learning journey",
        "quickActions":{"newRecording":"New Recording","newRecordingDesc":"Upload a lecture recording","aiQuestion":"Ask AI","aiQuestionDesc":"Ask the AI a question","quickNote":"Quick Note","quickNoteDesc":"Jot down an idea"},
        "recentCourses":"Recent Courses","weeklyStats":"This Week","recentNotes":"Recent Notes",
        "stats_empty":"0 recordings · 0 notes · 0 questions",
        "empty":{"noCourses":"No courses yet","noNotes":"No notes yet. Go to Lecture Analysis to create your first one.","emptyNotesHint":"Upload a lecture recording to generate your first set of AI-powered notes"}
      },
      "courses":{"title":"Courses","subtitle":"Manage all your courses","subtitle_count":"{count} courses","createdAt":"Created {date}","addCourse":"Add Course","newCourse":"New Course","courseNamePlaceholder":"Course name, e.g. Engineering Mechanics","confirm":"Confirm","cancel":"Cancel","createCourse":"Create Course","empty":{"title":"No courses yet","desc":"Create your first course to get started"}},
      "courseDetail":{"back":"Back to courses","loading":"Loading...","detail":"Course Details","tabs":{"lectures":"Lectures","files":"Course Files","ai":"AI Q&A"},"filesPlaceholder":"Course Files will be available in V2","aiPlaceholder":"AI Q&A will be available in V2","lectureCount":"{count} lectures","empty":{"title":"No lectures yet","desc":"Go to Lecture Analysis to analyze your first lecture","action":"Start Analysis"},"badge":{"hasNote":"Notes ready","noNote":"Transcribed"}},
      "note":{"back":"Back","loading":"Loading...","sections":{"summary":"Summary","keyConcepts":"Key Concepts","equations":"Important Equations","examFocus":"Exam Focus","terminology":"Terminology","notes":"Notes"},"copyNote":"Copy Note","copied":"Copied","exportMd":"Export Markdown","transcript":"Transcript","empty":{"title":"No notes generated","desc":"Notes have not been generated for this lecture"}},
      "upload":{"title":"Lecture Analysis","stepSelectCourse":"Select Course","stepSelectFile":"Select Audio File","uploadZone":"Click to select an audio file","uploadHint":"MP3 / M4A / WAV / FLAC · Max 200MB","removeFile":"Remove","btnStartDisabled":"Select a course and file to begin","btnStart":"Start Analysis","btnProcessing":"Processing...","btnDone":"Analysis complete","btnFailed":"Analysis failed","progress":{"transcribing":"Transcribing audio","transcribingActive":"Transcribing audio...","transcribingDone":"Transcription complete","transcribingFailed":"Transcription failed","generating":"Generating notes","generatingActive":"Generating notes...","generatingDone":"Notes generated","generatingFailed":"Note generation failed"},"noteBoxTitle":"Lecture Notes (Saved)","viewFullNote":"View full note","selectPlaceholder":"-- Select course --","selectNoCourses":"-- Please create a course in Courses first --"},
      "settings":{"title":"Settings","api":{"label":"DeepSeek API Key","placeholder":"sk-..."},"language":{"label":"Language","description":"Choose your interface language"},"test":"Test","testing":"Testing...","testSuccess":"Connection successful","testFailed":"Connection failed","save":"Save Settings","saved":"Saved"},
      "statusbar":{"ready":"Model Ready","model":"DeepSeek V4"},
      "common":{"loading":"Loading...","back":"Back","cancel":"Cancel","confirm":"Confirm","delete":"Delete","export":"Export","copy":"Copy","viewAll":"View All","noData":"No data"}
    },
    zh: {
      "app": {"titlebar": "Monad"},
      "sidebar": {
        "logo": "Monad",
        "sections": {"study":"学习","ai":"智能","system":"系统"},
        "dashboard":"仪表盘","courses":"课程","lectureAnalysis":"录音分析",
        "aiTutor":"AI Tutor","knowledgeBase":"知识库","settings":"设置",
        "user":"Sebastian"
      },
      "dashboard": {
        "greeting_morning":"早上好","greeting_afternoon":"下午好","greeting_evening":"晚上好",
        "greeting_name":"{greeting}，Sebastian","subtitle":"今天有 {count} 门课程需要复习","subtitle_none":"开始你的学习之旅",
        "quickActions":{"newRecording":"新录音","newRecordingDesc":"上传课堂录音","aiQuestion":"AI 提问","aiQuestionDesc":"向 AI 提问","quickNote":"快速笔记","quickNoteDesc":"手动记录想法"},
        "recentCourses":"最近课程","weeklyStats":"本周统计","recentNotes":"最近笔记",
        "stats_empty":"录音 0 节 · 笔记 0 篇 · 提问 0 次",
        "empty":{"noCourses":"还没有课程","noNotes":"还没有笔记。去 录音分析 创建第一篇吧。","emptyNotesHint":"上传课堂录音，生成你的第一篇 AI 笔记"}
      },
      "courses":{"title":"课程","subtitle":"管理你的所有课程","subtitle_count":"{count} 门课程","createdAt":"创建于 {date}","addCourse":"添加课程","newCourse":"新建课程","courseNamePlaceholder":"课程名称，如：工程力学","confirm":"确认","cancel":"取消","createCourse":"创建课程","empty":{"title":"还没有课程","desc":"创建你的第一门课程开始学习"}},
      "courseDetail":{"back":"返回课程列表","loading":"加载中...","detail":"课程详情","tabs":{"lectures":"课堂记录","files":"课程文件","ai":"AI 问答"},"filesPlaceholder":"课程文件功能将于 V2 上线","aiPlaceholder":"AI 问答功能将于 V2 上线","lectureCount":"{count} 节课堂记录","empty":{"title":"还没有课堂记录","desc":"去 录音分析 分析你的第一节课堂录音","action":"开始录音分析"},"badge":{"hasNote":"已有笔记","noNote":"转录完成"}},
      "note":{"back":"返回","loading":"加载中...","sections":{"summary":"Summary","keyConcepts":"Key Concepts","equations":"Important Equations","examFocus":"Exam Focus","terminology":"Terminology","notes":"Notes"},"copyNote":"复制笔记","copied":"已复制","exportMd":"导出 Markdown","transcript":"原始转录文字","empty":{"title":"尚未生成笔记","desc":"该课堂记录还没有生成笔记"}},
      "upload":{"title":"录音分析","stepSelectCourse":"选择课程","stepSelectFile":"选择录音文件","uploadZone":"点击选择音频文件","uploadHint":"MP3 / M4A / WAV / FLAC · 最大 200MB","removeFile":"移除","btnStartDisabled":"选择课程和文件后开始","btnStart":"开始分析","btnProcessing":"处理中...","btnDone":"分析完成","btnFailed":"分析失败","progress":{"transcribing":"语音转文字","transcribingActive":"语音转文字中...","transcribingDone":"语音转文字完成","transcribingFailed":"转录失败","generating":"生成课堂笔记","generatingActive":"生成课堂笔记中...","generatingDone":"课堂笔记生成完成","generatingFailed":"笔记生成失败"},"noteBoxTitle":"课堂笔记（已保存）","viewFullNote":"在新页面查看完整笔记","selectPlaceholder":"-- 选择课程 --","selectNoCourses":"-- 请先在课程页创建课程 --"},
      "settings":{"title":"设置","api":{"label":"DeepSeek API Key","placeholder":"sk-..."},"language":{"label":"语言","description":"选择界面语言"},"test":"测试","testing":"测试中...","testSuccess":"连接成功","testFailed":"连接失败","save":"保存设置","saved":"已保存"},
      "statusbar":{"ready":"模型就绪","model":"DeepSeek V4"},
      "common":{"loading":"加载中...","back":"返回","cancel":"取消","confirm":"确认","delete":"删除","export":"导出","copy":"复制","viewAll":"查看全部","noData":"暂无数据"}
    }
  },

  async init() {
    let saved = localStorage.getItem('language');
    if (saved === 'zh' || saved === 'en') {
      this._currentLang = saved;
    } else {
      try {
        let backend = await eel.api_get_setting('language')();
        if (backend === 'zh' || backend === 'en') this._currentLang = backend;
        else this._currentLang = this._detectSystem();
      } catch (e) {
        this._currentLang = this._detectSystem();
      }
    }
    localStorage.setItem('language', this._currentLang);
    try { await eel.api_save_setting('language', this._currentLang)(); } catch (e) {}
    this._loaded = true;
    this.applyTranslations();
  },

  _detectSystem() {
    let lang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return lang.startsWith('zh') ? 'zh' : 'en';
  },

  t(key, vars) {
    vars = vars || {};
    let val = this._getValue(this._data[this._currentLang], key);
    if (val == null) val = this._getValue(this._data['en'], key);
    if (val == null) return key;
    if (typeof val === 'string') {
      for (let [k, v] of Object.entries(vars)) {
        val = val.replace(new RegExp('\\{'+k+'\\}', 'g'), v);
      }
    }
    return val;
  },

  _getValue(obj, key) {
    let parts = key.split('.'), cur = obj;
    for (let p of parts) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = cur[p];
    }
    return cur;
  },

  applyTranslations() {
    if (!this._loaded) return;
    let els = document.querySelectorAll('[data-i18n]');
    for (let el of els) {
      let key = el.dataset.i18n; if (!key) continue;
      if (el.tagName === 'SELECT') continue;
      let vars = {};
      try { if (el.dataset.i18nVars) vars = JSON.parse(el.dataset.i18nVars); } catch (e) {}
      let text = this.t(key, vars);
      let hasComplex = false;
      for (let child of el.children) {
        if (child.tagName === 'SVG' || child.tagName === 'BUTTON' || child.tagName === 'INPUT' || child.tagName === 'DIV') {
          hasComplex = true; break;
        }
      }
      if (!hasComplex) el.textContent = text;
    }
    let opts = document.querySelectorAll('option[data-i18n]');
    for (let opt of opts) { opt.textContent = this.t(opt.dataset.i18n); }
    let phs = document.querySelectorAll('[data-i18n-placeholder]');
    for (let el of phs) { el.placeholder = this.t(el.dataset.i18nPlaceholder); }
  },

  async setLanguage(lang) {
    if (lang !== 'en' && lang !== 'zh') return;
    this._currentLang = lang;
    try { await eel.api_save_setting('language', lang)(); } catch (e) {}
    this._loaded = true;
    this.applyTranslations();
  },

  getLanguage() { return this._currentLang; }
};