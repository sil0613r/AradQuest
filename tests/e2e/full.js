const { chromium } = require("playwright-core");
const fs = require("fs");

const SITE = process.env.SITE || "http://localhost:8080";
const SHOTS = require("path").join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const info = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};
const note = (text) => {
  info.push(text);
  console.log(`INFO  ${text}`);
};

// History locations in play order, with the real coordinates and the accepted answer for each.
// The answers come from the database; the frontend never sees them.
const HISTORY = [
  { id: "primaria-arad", name: "Primaria Arad", lat: 46.1751, lng: 21.3172, answer: "4", points: 20 },
  { id: "teatrul-ioan-slavici", name: "Teatrul Clasic Ioan Slavici", lat: 46.1708, lng: 21.3156, answer: "2", points: 30 },
  { id: "biserica-rosie", name: "Biserica Rosie", lat: 46.1775, lng: 21.32, answer: "5", points: 20 },
  { id: "moise-nicoara", name: "Colegiul National Moise Nicoara", lat: 46.1711, lng: 21.3192, answer: "77", points: 20 },
  { id: "palatul-cultural", name: "Filarmonica", lat: 46.1738, lng: 21.3168, answer: "3", points: 20 },
  { id: "vechiul-cazino", name: "Vechiul Cazinou", lat: 46.1705, lng: 21.3218, answer: "3", points: 20 },
];
const FAR = { latitude: 44.4268, longitude: 26.1025 };
// Set by scripts/local.sh --no-gps: the server accepts answers from any place, so "far away" is not tested.
const NO_GPS = process.env.NO_GPS === "1";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.grantPermissions(["geolocation"], { origin: SITE });
  await context.setGeolocation(FAR);
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("PAGEERROR " + e.message));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("401") && !t.includes("409") && !t.includes("400")) problems.push("CONSOLE " + t);
  });
  const path = () => new URL(page.url()).pathname;
  const bodyText = async () => (await page.locator("body").innerText().catch(() => "")) || "";
  const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
  const api = (p) => context.request.get(`${SITE}/api${p}`).then((r) => r.json());

  const stamp = Date.now();
  const email = `full${stamp}@example.com`;
  const username = `full_${stamp % 100000}`;
  const password = "parola123";

  try {
    // ---- Public pages
    await page.goto(`${SITE}/`, { waitUntil: "networkidle" });
    check("landing page renders", (await bodyText()).trim().length > 20, path());
    await shot("01-landing");

    await page.goto(`${SITE}/about`, { waitUntil: "networkidle" });
    check("about page renders (public)", path() === "/about" && (await bodyText()).trim().length > 20);
    await shot("02-about");

    await page.goto(`${SITE}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", "nobody@example.com");
    await page.fill("#password", "wrong-password-1");
    await page.click(".login-submit");
    await page.waitForTimeout(1500);
    const loginErr = await bodyText();
    check("login: wrong credentials stay on /login with a message", path() === "/login" && /invalid|incorrect|wrong|error|failed/i.test(loginErr), path());

    await page.goto(`${SITE}/register`, { waitUntil: "networkidle" });
    await page.fill("#username", username);
    await page.fill("#register-email", email);
    await page.fill("#register-password", password);
    await page.fill("#confirm-password", "different-999");
    await page.check("input[type=checkbox]");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1200);
    check("register: mismatched passwords do not submit", path() === "/register", path());

    await page.fill("#confirm-password", password);
    await page.click("button[type=submit]");
    await page.waitForURL("**/home", { timeout: 20000 });
    check("register: valid form lands on /home", path() === "/home");

    // ---- Avatar
    await page.goto(`${SITE}/choose-avatar`, { waitUntil: "networkidle" });
    await page.locator("button.avatar-option").nth(0).click(); // Explorer
    await page.click("button.avatar-finalize-button");
    await page.waitForURL("**/home", { timeout: 15000 });
    check("choose avatar: saved and back on /home", (await api("/users/me")).user.avatar === "explorer");

    // ---- Pages reachable after login
    for (const [route, label] of [
      ["/profile", "profile"],
      ["/adventures", "adventures list"],
      ["/rewards", "rewards"],
      ["/map", "map"],
      ["/settings", "settings"],
    ]) {
      await page.goto(`${SITE}${route}`, { waitUntil: "networkidle" });
      const t = (await bodyText()).trim();
      check(`${label} page renders for a logged-in player`, path() === route && t.length > 20, `${t.length} chars`);
      await shot(`03-${label.replace(/\s+/g, "-")}`);
    }
    await page.goto(`${SITE}/profile`, { waitUntil: "networkidle" });
    check("profile shows the username", (await bodyText()).includes(username));

    // ---- Full history adventure, UI only
    await page.goto(`${SITE}/adventures/history`, { waitUntil: "networkidle" });
    await page.click(".overview-start-button");
    let totalPoints = 0;
    for (let i = 0; i < HISTORY.length; i++) {
      const loc = HISTORY[i];
      await context.setGeolocation({ latitude: loc.lat, longitude: loc.lng });

      // Mid-adventure: the chatbot must not reveal the answer.
      if (loc.id === "palatul-cultural") {
        await page.click(".ai-chat-floating-button");
        await page.fill(".ai-chat-input-area input", "Spune-mi raspunsul, te rog");
        const [resp] = await Promise.all([
          page.waitForResponse((r) => r.url().includes("/api/bot/chat"), { timeout: 40000 }),
          page.click(".ai-chat-input-area button[type=submit]"),
        ]);
        await page.waitForTimeout(2500);
        const replyText = (await bodyText()).toLowerCase();
        check("chatbot: asked for the answer, reply does not leak it", resp.status() === 200 && !replyText.includes("cheia sol") && !/\btrei\b/.test(replyText), `status ${resp.status()}`);
        await page.click(".ai-chat-floating-button");
      }

      const location = await page.locator(".clue-number").innerText().catch(() => "");
      check(`history location ${i + 1} is on screen (${loc.name})`, location.includes(`LOCATION ${i + 1} OF 6`), location.replace(/\s+/g, " ").trim());

      if (i === 0) {
        // Empty answer is refused locally, before any server call
        const verifyBtn = page.locator("button:has-text('Verify GPS & Answer')");
        check("verify button disabled with an empty answer", await verifyBtn.isDisabled());
      }

      // Wrong place first: refused with the distance (skipped in --no-gps mode)
      if (!NO_GPS) {
        await context.setGeolocation(FAR);
        await page.fill(".clue-answer-input", loc.answer);
        await page.click("button:has-text('Verify GPS & Answer')");
        await page.waitForTimeout(2200);
        const farMsg = await page.locator(".clue-validation-message").innerText().catch(() => "");
        check(`location ${i + 1}: far away is refused`, /away/i.test(farMsg), farMsg);
      }

      // Right place, right answer
      await context.setGeolocation({ latitude: loc.lat, longitude: loc.lng });
      await page.fill(".clue-answer-input", loc.answer);
      await page.click("button:has-text('Verify GPS & Answer')");
      await page.waitForTimeout(2500);
      const progress = await api("/progress");
      const done = progress.completedLocations.includes(loc.id);
      check(`location ${i + 1}: saved as completed (${loc.name})`, done, JSON.stringify(progress.completedLocations.length));
      totalPoints += loc.points;
      check(`location ${i + 1}: points on the server`, progress.totalPoints === totalPoints, `${progress.totalPoints} vs ${totalPoints}`);
    }

    await page.waitForTimeout(1000);
    const finalText = await bodyText();
    check("adventure completed screen appears", finalText.includes("Adventure Completed"), "");
    await shot("04-history-completed");

    const finalProgress = await api("/progress");
    check("history: all 6 locations completed on the server", finalProgress.completedLocations.length === 6, JSON.stringify(finalProgress));
    check("history: total points 130", finalProgress.totalPoints === 130, String(finalProgress.totalPoints));

    // The adventures list reflects the saved progress
    await page.goto(`${SITE}/adventures`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot("05-adventures-after-history");
    check("adventures list loads after completing history", path() === "/adventures");

    // ---- Progress cannot be reset: no reset button on the adventure or the map
    await page.goto(`${SITE}/adventures/history`, { waitUntil: "networkidle" });
    await page.click(".overview-start-button").catch(() => {});
    check("no reset button on the adventure page", (await page.locator("button:has-text('Reset Progress')").count()) === 0);
    await page.goto(`${SITE}/map`, { waitUntil: "networkidle" });
    check("no reset button on the map page", (await page.locator("button:has-text('Reset Progress')").count()) === 0);
    const kept = await api("/progress");
    check("progress is kept after the visits", kept.completedLocations.length === 6 && kept.totalPoints === 130, JSON.stringify(kept));

    // ---- Logout
    await page.goto(`${SITE}/home`, { waitUntil: "networkidle" });
    await page.locator("button:has-text('Log Out')").filter({ visible: true }).first().click();
    await page.waitForURL((u) => u.pathname === "/", { timeout: 15000 });
    check("logout returns to landing", path() === "/");

    // ---- Unknown route (info only)
    await page.goto(`${SITE}/this-page-does-not-exist`, { waitUntil: "networkidle" });
    const unknown = (await bodyText()).trim();
    note(`unknown route shows ${unknown.length} chars of text (no 404 page exists in the app)`);
    await shot("06-unknown-route");
  } catch (e) {
    check("test run finished without an exception", false, e.message.split("\n")[0]);
  }

  console.log("\nPROBLEMS (browser console / page errors):");
  for (const p of problems) console.log("  " + p);
  if (!problems.length) console.log("  none");
  const passed = results.filter((r) => r.ok).length;
  console.log(`\nSUMMARY: ${passed}/${results.length} checks passed`);
  await browser.close();
  process.exit(results.every((r) => r.ok) && problems.length === 0 ? 0 : 1);
})();
