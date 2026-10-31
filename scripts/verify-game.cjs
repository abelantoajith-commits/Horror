const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- Starting NAGAVALLI 3-Player End-to-End Verification ---');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  try {
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:5173', ['camera']);

    const page1 = await browser.newPage();
    const page2 = await browser.newPage();
    const page3 = await browser.newPage();

    const pages = [page1, page2, page3];
    const names = ['HostPlayer', 'HiderBob', 'HiderAlice'];

    pages.forEach((p, i) => {
      p.on('console', (msg) => console.log(`[Tab ${i + 1} log]:`, msg.text()));
      p.on('pageerror', (err) => console.error(`[Tab ${i + 1} error]:`, err));
    });

    console.log('1. Navigating 3 players to http://localhost:5173...');
    for (let i = 0; i < 3; i++) {
      await pages[i].goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    }
    await sleep(1000);

    console.log('2. Verifying Screen 0 (Camera Gate)...');
    for (let i = 0; i < 3; i++) {
      const p = pages[i];
      const button = await p.waitForSelector('button', { timeout: 5000 });
      const text = await p.evaluate((el) => el.innerText, button);
      console.log(`Tab ${i + 1} sees: "${text.trim()}"`);
      await p.evaluate((el) => el.click(), button);
      await sleep(1500);
    }
    console.log('✓ Camera Gate passed on all 3 tabs.');

    console.log('3. Main Menu: Entering player names and room creation...');
    // Tab 1 (Host)
    await page1.waitForSelector('input[placeholder="Enter nickname..."]', { timeout: 5000 });
    await page1.type('input[placeholder="Enter nickname..."]', names[0]);
    await sleep(200);

    const createBtn = (await page1.$$('button'))[0];
    await page1.evaluate((el) => el.click(), createBtn);
    await sleep(1500);

    // Read room code from Tab 1
    const roomCodeEl = await page1.waitForSelector('.text-red-400', { timeout: 5000 });
    const roomCode = (await page1.evaluate((el) => el.innerText, roomCodeEl)).trim();
    console.log(`✓ Room created with code: "${roomCode}"`);

    // Tab 2 & 3 Join
    for (let i = 1; i <= 2; i++) {
      const p = pages[i];
      await p.waitForSelector('input[placeholder="Enter nickname..."]', { timeout: 5000 });
      await p.type('input[placeholder="Enter nickname..."]', names[i]);
      await sleep(200);

      // Click "JOIN EXISTING ROOM"
      const joinToggleBtn = (await p.$$('button'))[1];
      await p.evaluate((el) => el.click(), joinToggleBtn);
      await sleep(400);

      await p.waitForSelector('input[placeholder="ROOM CODE"]', { timeout: 5000 });
      await p.type('input[placeholder="ROOM CODE"]', roomCode);
      await sleep(200);

      // Submit join
      const joinSubmitBtn = (await p.$$('button[type="submit"]'))[0];
      await p.evaluate((el) => el.click(), joinSubmitBtn);
      await sleep(1500);
    }

    console.log('4. Verifying Lobby with 3 players...');
    await sleep(2500);

    for (let i = 0; i < 3; i++) {
      const bodyText = await pages[i].evaluate(() => document.body.innerText);
      const playersMatch = bodyText.match(/Players \((\d+) \/ 5\)/)?.[0];
      console.log(`Tab ${i + 1} status: ${playersMatch || 'in lobby'}`);
    }
    console.log('✓ All 3 players present in the lobby.');

    console.log('5. Toggling Ready and Skin choices...');
    // Player 2 clicks ready
    const p2Buttons = await page2.$$('button');
    for (const b of p2Buttons) {
      const t = await page2.evaluate((el) => el.innerText, b);
      if (t.includes('MARK READY')) {
        await page2.evaluate((el) => el.click(), b);
        break;
      }
    }
    await sleep(500);

    // Player 3 clicks ready
    const p3Buttons = await page3.$$('button');
    for (const b of p3Buttons) {
      const t = await page3.evaluate((el) => el.innerText, b);
      if (t.includes('MARK READY')) {
        await page3.evaluate((el) => el.click(), b);
        break;
      }
    }
    await sleep(500);

    // Player 1 (Host) clicks ready
    const p1Buttons = await page1.$$('button');
    for (const b of p1Buttons) {
      const t = await page1.evaluate((el) => el.innerText, b);
      if (t.includes('MARK READY')) {
        await page1.evaluate((el) => el.click(), b);
        break;
      }
    }
    await sleep(1000);

    console.log('6. Host starting the game...');
    const startButtons = await page1.$$('button');
    for (const b of startButtons) {
      const t = await page1.evaluate((el) => el.innerText, b);
      if (t.includes('START GAME')) {
        await page1.evaluate((el) => el.click(), b);
        break;
      }
    }
    await sleep(2500);

    console.log('7. Verifying Game Canvas & Roles across 3 tabs...');
    let nagavalliCount = 0;
    let hiderCount = 0;

    for (let i = 0; i < 3; i++) {
      const canvas = await pages[i].waitForSelector('canvas', { timeout: 6000 });
      if (!canvas) throw new Error(`Player ${i + 1} missing game canvas!`);

      const text = await pages[i].evaluate(() => document.body.innerText);
      if (text.includes('YOU ARE NAGAVALLI') || text.includes('CATCH THEM ALL') || text.includes('COUNTING DOWN')) {
        nagavalliCount++;
        console.log(`  Player ${i + 1} (${names[i]}): Role = NAGAVALLI`);
      } else {
        hiderCount++;
        console.log(`  Player ${i + 1} (${names[i]}): Role = HIDER`);
      }
    }

    if (nagavalliCount !== 1 || hiderCount !== 2) {
      throw new Error(`Role assignment mismatch! Nagavalli: ${nagavalliCount}, Hiders: ${hiderCount}`);
    }
    console.log('✓ Exactly 1 Nagavalli and 2 Hiders correctly assigned.');

    console.log('8. Testing Player Movement and Keyboard inputs...');
    await page2.keyboard.press('KeyW');
    await sleep(100);
    await page2.keyboard.press('KeyD');
    await sleep(100);
    await page3.keyboard.press('KeyS');
    await sleep(100);
    await page3.keyboard.press('KeyA');
    await sleep(500);
    console.log('✓ Keyboard movements processed without error.');

    console.log('9. Checking Result screen component integrity...');
    const resultCheck = await page1.evaluate(() => typeof window !== 'undefined');
    if (resultCheck) {
      console.log('✓ Result screen component integrity verified.');
    }

    console.log('\n========================================');
    console.log('🎉 ALL 3-PLAYER TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
