/* Monad i18n — 简体中文 / English / 日本語
 * 用法: T('nav.dashboard') / T('dash.greetMorning', {name:'Sebastian'})
 * 字典在 js/i18n/{zh,en,ja}.js 中以内联对象加载（同步，无 fetch 竞态）。
 */
const I18N = (() => {
  const LANGS = ['zh', 'en', 'ja'];
  let lang = 'zh';
  try { lang = localStorage.getItem('language') || 'zh'; } catch (e) {}
  if (LANGS.indexOf(lang) === -1) lang = 'zh';

  const dicts = window.I18N_DICTS || {};
  const get = (path, obj) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  return {
    lang,
    langs: LANGS,

    /* 查字典：当前语言 → 回退中文 → 回退原 key */
    t(key, params) {
      let s = get(key, dicts[lang]);
      if (s == null) s = get(key, dicts.zh);
      if (s == null) s = key;
      if (params) {
        for (const k in params) s = s.split('{' + k + '}').join(String(params[k]));
      }
      return s;
    },

    /* 静态 HTML（index.html splash）的 data-i18n 属性替换 */
    applyStatic() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        let params = null;
        try { params = JSON.parse(el.dataset.i18nParams || 'null'); } catch (e) {}
        const v = this.t(el.dataset.i18n, params);
        if (v) el.textContent = v;
      });
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
    },

    /* 切换语言：持久化到 localStorage + 后端设置，重载页面使全站生效 */
    setLang(next) {
      if (LANGS.indexOf(next) === -1) return;
      localStorage.setItem('language', next);
      try { eel.api_save_setting('language', next)(); } catch (e) {}
      location.reload();
    }
  };
})();

/* 脚本位于 body 末尾，静态节点已就绪，立即应用 */
I18N.applyStatic();
