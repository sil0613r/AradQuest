const { chromium } = require("playwright-core");

const SITE = process.env.SITE || "http://localhost:8080";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  -> " + detail : ""}`);
  if (!ok) throw new Error("step failed: " + name);
};

// Places used for GPS checks
const FAR_FROM_MICALACA = { latitude: 44.4268, longitude: 26.1025 }; // Bucharest
const AT_MICALACA = { latitude: 46.1678101, longitude: 21.3421142 }; // Parcul Micalaca - Zona 300

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.grantPermissions(["geolocation"], { origin: SITE });
  await context.setGeolocation(FAR_FROM_MICALACA);
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (e) => problems.push("PAGEERROR " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("401") && !m.text().includes("409")) problems.push("CONSOLE " + m.text());
  });
  const path = () => new URL(page.url()).pathname;

  const stamp = Date.now();
  const email = `e2e${stamp}@example.com`;
  const username = `e2e_${stamp % 100000}`;
  const usernameNew = `e2e_b${stamp % 100000}`;
  const otherName = `e2e_o${stamp % 100000}`;
  const otherEmail = `e2eo${stamp}@example.com`;
  const password = "parola123";

  // A second player, to test the "username already taken" path
  const other = await browser.newContext();
  const otherReg = await other.request.post(`${SITE}/api/auth/register`, {
    data: { username: otherName, email: otherEmail, parola: password },
  });
  check("second player registered for conflict test", otherReg.status() === 200, `status ${otherReg.status()}`);
  await other.close();

  try {
    // 1. Register through the form
    await page.goto(`${SITE}/register`, { waitUntil: "networkidle" });
    await page.fill("#username", username);
    await page.fill("#register-email", email);
    await page.fill("#register-password", password);
    await page.fill("#confirm-password", password);
    await page.check("input[type=checkbox]");
    await page.click("button[type=submit]");
    await page.waitForURL("**/home", { timeout: 20000 });
    check("register lands on /home", path() === "/home");

    // 2. Avatar is saved on the server
    await page.goto(`${SITE}/choose-avatar`, { waitUntil: "networkidle" });
    await page.locator("button.avatar-option").nth(2).click(); // Champion
    await page.click("button.avatar-finalize-button");
    await page.waitForURL("**/home", { timeout: 15000 });
    const meAvatar = await (await context.request.get(`${SITE}/api/users/me`)).json();
    check("avatar saved to the server", meAvatar.user.avatar === "champion", meAvatar.user.avatar);
    await page.waitForSelector("img[alt='Champion avatar']", { timeout: 10000 });
    check("home shows the saved avatar", true);

    // 3. Settings: change name, toggle a switch, save, reload, check it stuck
    await page.goto(`${SITE}/settings`, { waitUntil: "networkidle" });
    await page.fill("#settings-username", otherName);
    await page.click(".settings-save-button");
    await page.waitForSelector(".settings-error", { timeout: 10000 });
    const conflictText = await page.textContent(".settings-error");
    check("taken username shows an error", conflictText.includes("already taken"), conflictText);

    await page.fill("#settings-username", usernameNew);
    await page.locator("input[type=checkbox]").nth(2).evaluate((el) => el.click()); // announcements on (switch is visually hidden)
    await page.click(".settings-save-button");
    await page.waitForSelector(".settings-success", { timeout: 10000 });
    check("settings save succeeds", true);

    await page.reload({ waitUntil: "networkidle" });
    check("saved username shown after reload", (await page.inputValue("#settings-username")) === usernameNew);
    check("saved switch shown after reload", await page.locator("input[type=checkbox]").nth(2).isChecked());
    const stored = await (await context.request.get(`${SITE}/api/users/me/settings`)).json();
    check("settings stored on the server", stored.settings.announcements === true, JSON.stringify(stored.settings));

    await page.goto(`${SITE}/home`, { waitUntil: "networkidle" });
    check("home greets the new username", (await page.locator("body").innerText()).includes(usernameNew));

    // 4. Play the nature adventure: chat, then the GPS + answer check
    await page.goto(`${SITE}/adventures/nature`, { waitUntil: "networkidle" });
    await page.click(".overview-start-button");
    await page.click(".ai-chat-floating-button");
    await page.fill(".ai-chat-input-area input", "Ce pot găsi aici?");
    const [chatResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/bot/chat"), { timeout: 40000 }),
      page.click(".ai-chat-input-area button[type=submit]"),
    ]);
    check("chatbot still answers (HTTP 200)", chatResponse.status() === 200, `status ${chatResponse.status()}`);
    await page.click(".ai-chat-floating-button"); // close the chat

    const verify = async (answer) => {
      await page.fill(".clue-answer-input", answer);
      await page.click("button:has-text('Verify GPS & Answer')");
      await page.waitForTimeout(2500); // the GPS lookup and the API call finish well within this
      return page.locator(".clue-validation-message").innerText().catch(() => "");
    };

    // 4a. Far away: refused, nothing saved
    let message = await verify("10");
    check("far from the place: refused with distance", message.toLowerCase().includes("away"), message);
    let progress = await (await context.request.get(`${SITE}/api/progress`)).json();
    check("nothing saved when far away", progress.completedLocations.length === 0, JSON.stringify(progress));

    // 4b. At the place, wrong answer
    await context.setGeolocation(AT_MICALACA);
    message = await verify("nope");
    check("right place, wrong answer: refused", message.toLowerCase().includes("wrong"), message);

    // 4c. At the place, right answer (with a space and different case to test normalization)
    // Once completed, the screen switches to its finished view, so check the saved result instead of a message.
    await verify(" 10 ");
    progress = await (await context.request.get(`${SITE}/api/progress`)).json();
    check("right place, right answer: saved as completed with points", progress.completedLocations.includes("nature-location-1") && progress.totalPoints === 20, JSON.stringify(progress));

    // 4d. Reload: still completed, answer box hidden
    await page.reload({ waitUntil: "networkidle" });
    await page.click(".overview-start-button").catch(() => {});
    const answerBoxCount = await page.locator(".clue-answer-input").count();
    check("after reload the completed location stays completed", answerBoxCount === 0, `answer boxes: ${answerBoxCount}`);

    // 5. No reset: the completed location and its points stay after the visit
    await page.goto(`${SITE}/adventures/nature`, { waitUntil: "networkidle" });
    await page.click(".overview-start-button").catch(() => {});
    check("no reset button on the adventure page", (await page.locator("button:has-text('Reset Progress')").count()) === 0);
    progress = await (await context.request.get(`${SITE}/api/progress`)).json();
    check("progress kept: completed location and 20 points", progress.completedLocations.includes("nature-location-1") && progress.totalPoints === 20, JSON.stringify(progress));

    // 6. Logout, protected pages redirect, login again
    await page.goto(`${SITE}/home`, { waitUntil: "networkidle" });
    await page.locator("button:has-text('Log Out')").filter({ visible: true }).first().click();
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15000 });
    check("logout returns to landing", path() === "/");

    for (const p of ["/home", "/settings", "/adventures/nature"]) {
      await page.goto(`${SITE}${p}`, { waitUntil: "networkidle" });
      check(`logged-out visit to ${p} redirects to /login`, path() === "/login", path());
    }

    await page.goto(`${SITE}/login`, { waitUntil: "networkidle" });
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click(".login-submit");
    await page.waitForURL("**/home", { timeout: 15000 });
    check("login again works, saved username kept", (await page.locator("body").innerText()).includes(usernameNew));
  } catch (e) {
    console.log("STOPPED:", e.message);
  }

  console.log("\nPROBLEMS:", JSON.stringify(problems, null, 1));
  const passed = results.filter((r) => r.ok).length;
  console.log(`\nSUMMARY: ${passed}/${results.length} checks passed`);
  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
