/* 设置 — API Key + 语言 */
UI.register('settings', async (slot) => {
  slot.innerHTML = `
    <div class="wrap" style="padding-top:30px">
      <div class="page-head rise">
        <div>
          <h1>设置</h1>
          <p>API Key · 语言 · 模型状态</p>
        </div>
      </div>
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">AI Service · DeepSeek</div>
        <div class="field">
          <label>DeepSeek API Key</label>
          <div style="display:flex;gap:8px">
            <input class="input" type="password" id="stDeepseek" placeholder="sk-...">
            <button class="btn btn-sm" onclick="UI.stTestDeepseek()">测试</button>
          </div>
          <div id="stDeepseekStatus" style="margin-top:8px;font-size:12px"></div>
        </div>
      </div>
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">Speech-to-Text · Groq</div>
        <div class="field">
          <label>Groq API Key</label>
          <div style="display:flex;gap:8px">
            <input class="input" type="password" id="stGroq" placeholder="gsk_...">
            <button class="btn btn-sm" onclick="UI.stTestGroq()">测试</button>
          </div>
          <div id="stGroqStatus" style="margin-top:8px;font-size:12px"></div>
        </div>
      </div>
      <div class="card rise" style="max-width:600px;margin-bottom:var(--gap)">
        <div class="card-title">Appearance</div>
        <div class="field">
          <label>界面语言</label>
          <select class="select" id="stLang" onchange="UI.stSwitchLang(this.value)">
            <option value="zh">简体中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary rise" onclick="UI.stSave()" style="max-width:600px;width:100%">保存设置</button>
      <div id="stSaveStatus" style="max-width:600px;margin-top:8px;font-size:12px"></div>
    </div>`;

  // 加载当前值
  try {
    const k = await eel.api_get_setting('deepseek_key')();
    if (k) UI.$('#stDeepseek').value = k;
    const gk = await eel.api_get_setting('groq_key')();
    if (gk) UI.$('#stGroq').value = gk;
    UI.$('#stLang').value = localStorage.getItem('language') || 'zh';
  } catch (e) {}
});

UI.stTestDeepseek = async function() {
  const k = UI.$('#stDeepseek').value.trim();
  if (!k) return;
  const el = UI.$('#stDeepseekStatus');
  el.textContent = '测试中...'; el.style.color = 'var(--text-secondary)';
  const r = await eel.api_test_key('deepseek', k)();
  if (r.success) { el.textContent = '✅ 连接成功'; el.style.color = 'var(--green)'; }
  else { el.textContent = '❌ 连接失败'; el.style.color = 'var(--red)'; }
};

UI.stTestGroq = async function() {
  const k = UI.$('#stGroq').value.trim();
  if (!k) return;
  const el = UI.$('#stGroqStatus');
  el.textContent = '测试中...'; el.style.color = 'var(--text-secondary)';
  const r = await eel.api_test_key('groq', k)();
  if (r.success) { el.textContent = '✅ 连接成功'; el.style.color = 'var(--green)'; }
  else { el.textContent = '❌ 连接失败'; el.style.color = 'var(--red)'; }
};

UI.stSave = async function() {
  const k = UI.$('#stDeepseek').value.trim();
  if (k) await eel.api_save_setting('deepseek_key', k)();
  const gk = UI.$('#stGroq').value.trim();
  if (gk) await eel.api_save_setting('groq_key', gk)();
  const el = UI.$('#stSaveStatus');
  el.textContent = '✅ 已保存'; el.style.color = 'var(--green)';
  setTimeout(() => el.textContent = '', 2000);
};

UI.stSwitchLang = function(lang) {
  localStorage.setItem('language', lang);
  try { eel.api_save_setting('language', lang)(); } catch (e) {}
  location.reload();
};
