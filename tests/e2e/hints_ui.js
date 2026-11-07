const { chromium } = require("playwright-core");
const fs = require("fs");

const SITE = process.env.SITE || "http://localhost:8080";
const SHOTS = require("path").join(__dirname, "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
};
const note = (text) => console.log(`INFO  ${text}`);

// Primaria Arad is the first history location. Its answer is "4" and it gives 20 points.
const AT_PRIMARIA = { latitude: 46.1751, longitude: 21.3172 };
const TEATRUL = "teatrul-ioan-slavici";

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.grantPermissions(["geolocation"], { origin: SITE });
  await context.setGeolocation(AT_PRIMARIA);
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("PAGEERROR " + e.message));
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && !t.includes("401") && !t.includes("409") && !t.includes("400")) problems.push("CONSOLE " + t);
  });

  const stamp = Date.now();
  const password = "parola123";
  const points = async () => (await (await context.request.get(`${SITE}/api/progress`)).json()).totalPoints;
  const hintItems = () => page.locator(".hint-message li").count();
  const hintButton = () => page.locator("button.hint-button");
  const validation = () => page.locator(".clue-validation-message").innerText().catch(() => "");

  try {
    // 1. Player account, logged in through the API (same cookie as the browser)
    const email = `hintui${stamp}@example.com`;
    const reg = await context.request.post(`${SITE}/api/auth/register`, {
      data: { username: `hintui_${stamp % 100000}`, email, parola: password },
    });
    check("player registered", reg.status() === 200, `status ${reg.status()}`);
    const login = await context.request.post(`${SITE}/api/auth/login`, { data: { email, parola: password } });
    check("player logged in", login.status() === 200, `status ${login.status()}`);

    // 2. Earn 20 points by answering Primaria Arad through the API
    const earned = await context.request.post(`${SITE}/api/validare-nivel`, {
      data: { locationId: "primaria-arad", answer: "4", ...AT_PRIMARIA },
    });
    check("primaria answered (20 points)", earned.status() === 200 && (await points()) === 20, `status ${earned.status()}`);

    // 3. Open the history adventure: location 2 (Teatrul) is active
    await page.goto(`${SITE}/adventures/history`, { waitUntil: "networkidle" });
    await page.click(".overview-start-button");
    await page.waitForSelector(".clue-card p", { timeout: 15000 });
    const location = await page.locator(".clue-number").innerText();
    check("location 2 is on screen", location.replace(/\s+/g, " ").includes("LOCATION 2 OF 6"), location.replace(/\s+/g, " ").trim());
    check("riddle comes from the server (not empty)", (await page.locator(".clue-card p").innerText()).trim().length > 20);

    // 4. The button says what the hint costs, and no hint is open yet
    const label = (await hintButton().innerText()).replace(/\s+/g, " ");
    check("button shows the 10 point cost", label.includes("-10 points"), label);
    check("no hint is open before the player asks", (await hintItems()) === 0);

    // 5. Open the first hint: 10 points taken, hint shown
    await hintButton().click();
    await page.waitForSelector(".hint-message li", { timeout: 15000 });
    check("first hint is shown", (await hintItems()) === 1);
    check("10 points were taken (20 -> 10)", (await points()) === 10, `points ${await points()}`);
    await page.screenshot({ path: `${SHOTS}/hint-ui-first-hint.png`, fullPage: true });

    // 6. Reload: the hint the player paid for is still open
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".overview-start-button");
    await page.waitForSelector(".hint-message li", { timeout: 15000 });
    check("after reload the paid hint is still shown", (await hintItems()) === 1);

    // 7. Second hint: 10 more points taken, the points are now 0
    await hintButton().click();
    await page.waitForFunction(() => document.querySelectorAll(".hint-message li").length === 2, null, { timeout: 15000 });
    check("second hint is shown, in order", (await hintItems()) === 2);
    check("points are now 0", (await points()) === 0, `points ${await points()}`);

    // 8. No points left: the server refuses, and nothing is opened
    const mission = await (await context.request.get(`${SITE}/api/locations/${TEATRUL}/mission`)).json();
    note(`teatrul has ${mission.clueCount} hints in missions.json`);
    if (mission.clueCount > 2 && (await hintButton().count()) > 0) {
      await hintButton().click();
      await page.waitForFunction(() => document.querySelector(".clue-validation-message")?.innerText.includes("You need 10 points"), null, { timeout: 15000 });
      check("third hint refused without points", (await validation()).includes("You need 10 points"), await validation());
      check("refused hint is not shown", (await hintItems()) === 2);
    } else {
      note("third-hint refusal not tested: the location has no third hint or the button is gone");
    }

    // 9. No reset button; the paid hints stay open after a reload
    check("no reset button on the adventure page", (await page.locator("button:has-text('Reset Progress')").count()) === 0);
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".overview-start-button");
    await page.waitForSelector(".hint-message li", { timeout: 15000 });
    check("paid hints still open after the visit", (await hintItems()) === 2);
    check("points still 0 (nothing refunded)", (await points()) === 0, `points ${await points()}`);
  } catch (error) {
    check("unexpected error", false, error.message.split("\n")[0]);
  }

  check("no page or console errors", problems.length === 0, problems.join(" | ") || "none");
  await browser.close();

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\nSUMMARY: ${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
