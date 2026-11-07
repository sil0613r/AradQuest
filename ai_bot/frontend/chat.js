/* ARAD QUEST chatbot widget. Plain JavaScript, no dependencies.
   AradBot.init({ apiBase: "https://YOUR-BACKEND/api/bot" });  // once, on page load
   AradBot.setMission("primaria");                              // when a mission screen opens
   AradBot.clearMission();                                      // when the player leaves it */
(function () {
  // All text shown to the player. Edit here to translate or reword.
  const TEXT = {
    open: "Ajutor", title: "Povestitorul", close: "Închide",
    placeholder: "Cere un indiciu sau pune o întrebare…", send: "Trimite",
    greeting: (t) => `Salut, călătorule! Dacă te încurci la „${t}”, întreabă-mă.`,
    thinking: "…",
    expired: "Sesiunea a expirat. Trimite din nou mesajul.",
    busy: "Prea multe mesaje. Așteaptă puțin și încearcă din nou.",
    error: "Ceața s-a lăsat peste conexiune. Încearcă din nou.",
  };

  let cfg = { apiBase: "", useMock: false };
  let missionId = null, sessionId = null, starting = null, busy = false, el = null;

  function build() {
    const root = document.createElement("div");
    root.className = "aq-bot";
    root.innerHTML = `
      <button class="aq-bot__launcher" type="button" hidden>${TEXT.open}</button>
      <section class="aq-bot__panel" aria-label="${TEXT.title}" hidden>
        <div class="aq-bot__head"><strong>${TEXT.title}</strong>
          <button class="aq-bot__close" type="button" aria-label="${TEXT.close}">×</button></div>
        <div class="aq-bot__log" aria-live="polite"></div>
        <form class="aq-bot__form">
          <input maxlength="500" autocomplete="off" placeholder="${TEXT.placeholder}">
          <button type="submit">${TEXT.send}</button>
        </form>
      </section>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    el = { launcher: q(".aq-bot__launcher"), panel: q(".aq-bot__panel"), log: q(".aq-bot__log"),
           form: q(".aq-bot__form"), input: q("input"), send: q(".aq-bot__form button") };
    el.launcher.addEventListener("click", open);
    q(".aq-bot__close").addEventListener("click", close);
    el.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = el.input.value.trim();
      if (!text || busy) return;
      el.input.value = "";
      send(text);
    });
  }

  function addMsg(who, text, wait) {
    const p = document.createElement("p");
    p.className = "aq-msg aq-msg--" + who + (wait ? " aq-msg--wait" : "");
    p.textContent = text;                       // textContent, never innerHTML: replies are untrusted text
    el.log.appendChild(p);
    el.log.scrollTop = el.log.scrollHeight;
    return p;
  }

  async function api(path, body) {
    if (cfg.useMock) return mock(path, body);
    const res = await fetch(cfg.apiBase + path, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!res.ok) throw Object.assign(new Error("HTTP " + res.status), { status: res.status });
    return res.json();
  }

  // Fake backend for testing the UI without a server (init({ useMock: true })).
  function mock(path, body) {
    return new Promise((done) => setTimeout(() => {
      if (path === "/start") return done({ session_id: "mock", title: body.mission_id });
      const short = body.message.trim().split(/\s+/).length <= 2;
      done({ reply: short
        ? "Răspunsurile se scriu în câmpul de răspuns, nu aici, călătorule."
        : "Privește cu atenție în jur… (răspuns de test: backend-ul nu e conectat)." });
    }, 600));
  }

  async function start() {
    const d = await api("/start", { mission_id: missionId });
    sessionId = d.session_id;
    addMsg("bot", TEXT.greeting(d.title));
  }
  const ensureSession = () => sessionId ? Promise.resolve() : (starting ||= start().finally(() => (starting = null)));

  function setBusy(v) { busy = v; el.send.disabled = v; }

  async function send(text) {
    addMsg("user", text);
    setBusy(true);
    const wait = addMsg("bot", TEXT.thinking, true);
    try {
      await ensureSession();
      const d = await api("/chat", { session_id: sessionId, message: text });
      wait.textContent = d.reply;
      wait.classList.remove("aq-msg--wait");
    } catch (e) {
      if (e.status === 404) sessionId = null;   // session lost on the server: next message starts a new one
      wait.textContent = e.status === 404 ? TEXT.expired : e.status === 429 ? TEXT.busy : TEXT.error;
    }
    setBusy(false);
    el.log.scrollTop = el.log.scrollHeight;
  }

  function open() {
    if (!missionId) return;
    el.panel.hidden = false;
    el.input.focus();
    ensureSession().catch(() => addMsg("bot", TEXT.error));
  }
  function close() { el.panel.hidden = true; }

  function reset(id) {
    missionId = id; sessionId = null; el.log.textContent = "";
    el.panel.hidden = true; el.launcher.hidden = !id;
  }

  window.AradBot = {
    init(options) { Object.assign(cfg, options); if (!el) build(); },
    setMission(id) { if (!el) throw new Error("Call AradBot.init() first"); if (id !== missionId) reset(id); },
    clearMission() { if (el) reset(null); },
    open, close,
  };
})();
