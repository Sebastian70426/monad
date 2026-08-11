/* 设置 — 模型提供商 + API Key + 语言 */
const ST_PROVIDERS = [
  { id: 'deepseek', labelKey: 'st.pDeepseek', keySetting: 'deepseek_key', keyLabelKey: 'st.keyDeepseek' },
  { id: 'openai',   labelKey: 'st.pOpenai',   keySetting: 'openai_key',   keyLabelKey: 'st.keyOpenai' },
  { id: 'groq',     labelKey: 'st.pGroq',     keySetting: 'groq_key',     keyLabelKey: 'st.keyGroq' },
  { id: 'gemini',   labelKey: 'st.pGemini',   keySetting: 'gemini_key',   keyLabelKey: 'st.keyGemini' },
];

UI.register('settings', async (slot) => {
  slot.innerHTML = `
    <div class="wrap" style="padding-top:30px">
      <div class="page-head rise">
        <div>
          <h1>${T('st.title')}</h1>
          <p>${T('st.subtitle')}</p>
        </div>
      </div>

      <!-- 模型提供商 -->
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">${T('st.llmCard')}</div>
        <div class="field">
          <label>${T('st.providerLabel')}</label>
          <select class="select" id="stProvider" onchange="UI.stProviderChanged()" style="width:100%">
            ${ST_PROVIDERS.map(p => `<option value="${p.id}">${T(p.labelKey)}</option>`).join('')}
          </select>
          <div style="font-size:11.5px;color:var(--text-tertiary);margin-top:6px">${T('st.visionNote')}</div>
        </div>
        <div class="field">
          <label id="stKeyLabel"></label>
          <div style="display:flex;gap:8px">
            <input class="input" type="password" id="stKey" placeholder="${T('st.keyPlaceholder')}" style="flex:1">
            <button class="btn btn-sm" onclick="UI.stTestProvider()">${T('st.test')}</button>
          </div>
          <div id="stKeyStatus" style="margin-top:8px;font-size:12px"></div>
        </div>
      </div>

      <!-- 语音转录 -->
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">${T('st.transcribeCard')}</div>
        <div class="field">
          <label>${T('st.keyGroq')}</label>
          <div style="display:flex;gap:8px">
            <input class="input" type="password" id="stGroq" placeholder="gsk_..." style="flex:1">
            <button class="btn btn-sm" onclick="UI.stTestGroq()">${T('st.test')}</button>
          </div>
          <div id="stGroqStatus" style="margin-top:8px;font-size:12px"></div>
          <div style="font-size:11.5px;color:var(--text-tertiary);margin-top:6px">${T('st.groqNote')}</div>
        </div>
      </div>

      <!-- 界面语言 -->
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">Appearance</div>
        <div class="field">
          <label>${T('st.langLabel')}</label>
          <select class="select" id="stLang" onchange="I18N.setLang(this.value)" style="width:100%">
            <option value="zh">${T('st.zh')}</option>
            <option value="en">${T('st.en')}</option>
            <option value="ja">${T('st.ja')}</option>
          </select>
        </div>
      </div>

      <button class="btn btn-primary rise" onclick="UI.stSave()" style="max-width:600px;width:100%">${T('st.save')}</button>
      <div id="stSaveStatus" style="max-width:600px;margin-top:8px;font-size:12px"></div>
    </div>`;

  // 加载当前值
  try {
    const prov = await eel.api_get_setting('llm_provider')();
    const cur = (prov.success && prov.value) ? prov.value : 'deepseek';
    UI.$('#stProvider').value = cur;
    const def = ST_PROVIDERS.find(p => p.id === cur) || ST_PROVIDERS[0];
    UI.$('#stKeyLabel').textContent = T(def.keyLabelKey);
    const k = await eel.api_get_setting(def.keySetting)();
    if (k.success && k.value) UI.$('#stKey').value = k.value;
    const gk = await eel.api_get_setting('groq_key')();
    if (gk.success && gk.value) UI.$('#stGroq').value = gk.value;
    UI.$('#stLang').value = I18N.lang;
  } catch (e) {}
});

/* 切换提供商：更新 Key 输入框的标签与已保存值 */
UI.stProviderChanged = async function() {
  const p = ST_PROVIDERS.find(x => x.id === UI.$('#stProvider').value) || ST_PROVIDERS[0];
  UI.$('#stKeyLabel').textContent = T(p.keyLabelKey);
  UI.$('#stKey').value = '';
  UI.$('#stKeyStatus').textContent = '';
  try {
    const r = await eel.api_get_setting(p.keySetting)();
    if (r.success && r.value) UI.$('#stKey').value = r.value;
  } catch (e) {}
};

UI.stTestProvider = async function() {
  const p = ST_PROVIDERS.find(x => x.id === UI.$('#stProvider').value) || ST_PROVIDERS[0];
  const k = UI.$('#stKey').value.trim();
  if (!k) return;
  const el = UI.$('#stKeyStatus');
  el.textContent = T('st.testing'); el.style.color = 'var(--text-secondary)';
  const r = await eel.api_test_key(p.id, k)();
  if (r.success) { el.textContent = T('st.connected'); el.style.color = 'var(--green)'; }
  else { el.textContent = T('st.failed') + (r.error ? ' — ' + r.error : ''); el.style.color = 'var(--red)'; }
};

UI.stTestGroq = async function() {
  const k = UI.$('#stGroq').value.trim();
  if (!k) return;
  const el = UI.$('#stGroqStatus');
  el.textContent = T('st.testing'); el.style.color = 'var(--text-secondary)';
  const r = await eel.api_test_key('groq', k)();
  if (r.success) { el.textContent = T('st.connected'); el.style.color = 'var(--green)'; }
  else { el.textContent = T('st.failed') + (r.error ? ' — ' + r.error : ''); el.style.color = 'var(--red)'; }
};

UI.stSave = async function() {
  const provider = UI.$('#stProvider').value;
  const p = ST_PROVIDERS.find(x => x.id === provider) || ST_PROVIDERS[0];
  try {
    await eel.api_save_setting('llm_provider', provider)();
    const key = UI.$('#stKey').value.trim();
    if (key) await eel.api_save_setting(p.keySetting, key)();
    const gk = UI.$('#stGroq').value.trim();
    if (gk) await eel.api_save_setting('groq_key', gk)();
    localStorage.setItem('llm_provider', provider);
    const el = UI.$('#stSaveStatus');
    el.textContent = T('st.saved'); el.style.color = 'var(--green)';
    setTimeout(() => el.textContent = '', 2000);
  } catch (e) {
    const el = UI.$('#stSaveStatus');
    el.textContent = '❌ ' + e.message; el.style.color = 'var(--red)';
  }
};
