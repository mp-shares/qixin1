/* 班级口令门 + 接口助手（看板 / 公示 / 微岗位 共用）
   用法：<script src="banfei.config.js"></script><script src="gate.js"></script>
         await QX.ready();                    // 没口令就弹输入框，验证通过才继续
         const r = await QX.api('summary');   // POST {action, ckey}，口令错了自动清掉并重新弹门
*/
window.QX = (function () {
  var API = (window.BANFEI_API || '').trim(), KEY = 'qx-class-key';
  function getKey() { try { return localStorage.getItem(KEY) || ''; } catch (_) { return ''; } }
  function setKey(k) { try { k ? localStorage.setItem(KEY, k) : localStorage.removeItem(KEY); } catch (_) {} }
  function post(body) {
    return fetch(API, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  var gateP = null;
  function showGate(msg) {
    if (gateP) return gateP;
    gateP = new Promise(function (resolve) {
      var css = '#qx-gate{position:fixed;inset:0;z-index:999;display:grid;place-items:center;background:var(--bg,#f3f4f7);color:var(--ink,var(--fg,#1b2130));font-family:system-ui,-apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;padding:24px}' +
        '#qx-gate .box{width:min(360px,100%);background:var(--card,var(--paper,#fff));border:1px solid var(--line,#dde1e8);border-radius:16px;padding:26px 24px;display:grid;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.12)}' +
        '#qx-gate .eb{font-size:12px;letter-spacing:.14em;color:var(--muted,var(--fg-2,#6a7284));text-transform:uppercase}' +
        '#qx-gate h1{font-family:"Noto Serif SC","Songti SC",serif;font-size:24px;margin:0 0 4px;font-weight:700}' +
        '#qx-gate p{margin:0;font-size:13.5px;color:var(--muted,var(--fg-2,#6a7284));line-height:1.5}' +
        '#qx-gate input{font:inherit;font-size:18px;letter-spacing:.08em;padding:11px 12px;border:1px solid var(--line,#dde1e8);border-radius:10px;background:transparent;color:inherit;width:100%}' +
        '#qx-gate button{font:inherit;font-size:15px;font-weight:600;padding:11px;border:0;border-radius:10px;background:var(--accent,#36479f);color:var(--accent-ink,#fff);cursor:pointer}' +
        '#qx-gate button:disabled{opacity:.6}#qx-gate .err{font-size:13px;color:#b6412b;min-height:1.2em}' +
        '#qx-gate input:focus-visible,#qx-gate button:focus-visible{outline:2px solid var(--accent,#36479f);outline-offset:2px}';
      var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
      var el = document.createElement('div'); el.id = 'qx-gate';
      el.innerHTML = '<form class="box"><div class="eb">MindfulPeace · 栖心一班</div><h1>班级口令</h1><p>本页仅供栖心一班同学查看。输入班委发的班级口令，本机会记住。</p>' +
        '<input type="password" id="qx-key" autocomplete="current-password" placeholder="班级口令" autofocus><div class="err" id="qx-err">' + (msg || '') + '</div><button type="submit" id="qx-go">进入</button></form>';
      document.body.appendChild(el);
      var inp = el.querySelector('#qx-key'), err = el.querySelector('#qx-err'), btn = el.querySelector('#qx-go');
      setTimeout(function () { inp.focus(); }, 50);
      el.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var k = inp.value.trim(); if (!k) { err.textContent = '请输入口令'; return; }
        btn.disabled = true; btn.textContent = '验证中…'; err.textContent = '';
        post({ action: 'class_ping', ckey: k }).then(function (r) {
          if (r && r.ok && r.auth) { setKey(k); el.remove(); st.remove(); gateP = null; resolve(true); }
          else { err.textContent = '口令不对，请再试一次'; btn.disabled = false; btn.textContent = '进入'; inp.select(); }
        }).catch(function () { err.textContent = '连不上服务器，请稍后再试'; btn.disabled = false; btn.textContent = '进入'; });
      });
    });
    return gateP;
  }
  function api(action, extra) {
    var body = Object.assign({ action: action, ckey: getKey() }, extra || {});
    return post(body).then(function (r) {
      if (r && !r.ok && /口令/.test(r.error || '')) { setKey(''); return showGate('口令已失效，请重新输入').then(function () { return api(action, extra); }); }
      return r;
    });
  }
  function ready() {
    if (!API) return Promise.resolve(false);
    if (getKey()) return Promise.resolve(true);
    return showGate();
  }
  function logout() { setKey(''); location.reload(); }
  return { api: api, ready: ready, getKey: getKey, logout: logout, hasApi: !!API };
})();
