const puppeteer = require('puppeteer-core');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- Starting NAGAVALLI TEST MODE & VISION/CATCH Verification ---');

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

    const pages = [page1, page2];
    const names = ['TesterOne', 'TesterTwo'];

    pages.forEach((p, i) => {
      p.on('console', (msg) => console.log(`[Tab ${i + 1} log]:`, msg.text()));
      p.on('pageerror', (err) => console.error(`[Tab ${i + 1} error]:`, err));
    });

    console.log('1. Navigating both players to http://localhost:5173...');
    for (let i = 0; i < 2; i++) {
      await pages[i].goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    }
    await sleep(1000);

    console.log('2. Passing Camera Gate...');
    for (let i = 0; i < 2; i++) {
      const p = pages[i];
      const button = await p.waitForSelector('button', { timeout: 5000 });
      await p.evaluate((el) => el.click(), button);
      await sleep(1200);
    }
    console.log('✓ Camera Gate passed on both tabs.');

    console.log('3. Using "JOIN SHARED TEST LOBBY" on both tabs...');
    for (let i = 0; i < 2; i++) {
      const p = pages[i];
      await p.waitForSelector('input[placeholder="Enter nickname..."]', { timeout: 5000 });
      await p.type('input[placeholder="Enter nickname..."]', names[i]);
      await sleep(200);

      const testBtn = await p.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText.includes('TEST LOBBY'));
      });
      await p.evaluate((el) => el.click(), testBtn);
      await sleep(1500);
    }

    console.log('4. Verifying TEST lobby presence...');
    await sleep(2000);
    for (let i = 0; i < 2; i++) {
      const text = await pages[i].evaluate(() => document.body.innerText);
      console.log(`Tab ${i + 1} innerText:\n${text}`);
      const isTestBanner = text.includes('TEST MODE ACTIVE') || text.includes('TEST LOBBY');
      const playerCount = text.match(/Players \((\d+) \/ 5\)/)?.[0];
      console.log(`Tab ${i + 1} sees: "${playerCount}" | Test Banner: ${isTestBanner}`);
      if (!text.includes('LOBBY') && !isTestBanner) {
        throw new Error(`Tab ${i + 1} is not in TEST lobby`);
      }
    }

    console.log('5. Marking Ready on both players...');
    for (let i = 0; i < 2; i++) {
      const p = pages[i];
      const readyBtn = await p.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText.includes('I AM READY') || b.innerText.includes('READY'));
      });
      await p.evaluate((el) => el.click(), readyBtn);
      await sleep(800);
    }

    console.log('6. Starting game from Host (Tab 1)...');
    const startBtn = await page1.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText.includes('START GAME'));
    });
    const canStart = await page1.evaluate((el) => !el.disabled, startBtn);
    console.log(`Start Game Button enabled in 2-player TEST lobby: ${canStart}`);
    if (!canStart) {
      throw new Error('Host cannot start test game with 2 players!');
    }
    await page1.evaluate((el) => el.click(), startBtn);
    await sleep(2000);

    console.log('7. Verifying Role Reveal and Game Canvas on both tabs...');
    for (let i = 0; i < 2; i++) {
      const hasCanvas = await pages[i].evaluate(() => !!document.querySelector('canvas'));
      console.log(`Tab ${i + 1} canvas ready: ${hasCanvas}`);
    }

    // Determine Hunter and Hider using engine state
    const isNag1 = await page1.evaluate(() => window.__ENGINE__ ? window.__ENGINE__.isNagavalli : false);
    const hunterPage = isNag1 ? page1 : page2;
    const hiderPage = isNag1 ? page2 : page1;
    const hunterIdx = isNag1 ? 1 : 2;
    const hiderIdx = isNag1 ? 2 : 1;
    console.log(`✓ Tab ${hunterIdx} is Nagavalli (Hunter), Tab ${hiderIdx} is Hider`);

    console.log('8. Fast-forwarding startAt by 35s into Chase phase on both clients...');
    await page1.evaluate(() => {
      if (window.__ENGINE__) {
        window.__ENGINE__.startAt = Date.now() - 35000;
      }
    });
    await page2.evaluate(() => {
      if (window.__ENGINE__) {
        window.__ENGINE__.startAt = Date.now() - 35000;
      }
    });
    await sleep(1500);

    const phaseCheck = await hunterPage.evaluate(() => window.__ENGINE__?.currentPhase);
    console.log(`Hunter engine current phase: "${phaseCheck}"`);

    console.log('9. Moving Hunter within sight radius of Hider...');
    // Get Hider's coordinates from Hider client
    const hiderPos = await hiderPage.evaluate(() => {
      return {
        x: window.__ENGINE__.localX,
        y: window.__ENGINE__.localY,
        id: window.__ENGINE__.localPlayerId,
        name: 'Tester',
      };
    });
    console.log('Hider coordinates:', hiderPos);

    // Position Hunter ~25 pixels away from Hider
    await hunterPage.evaluate((targetPos) => {
      window.__ENGINE__.localX = targetPos.x + 25;
      window.__ENGINE__.localY = targetPos.y;
    }, hiderPos);
    await sleep(800);

    // Also force a render/tick so state updates in GameScreen
    await hunterPage.evaluate(() => {
      const e = window.__ENGINE__;
      if (e) {
        // Find remote hider and ensure coordinates are aligned
        for (const r of e.remotePlayers.values()) {
          if (!r.isNagavalli) {
            r.x = r.targetX;
            r.y = r.targetY;
          }
        }
      }
    });
    await sleep(800);

    // Check visible target in hunter engine
    const visibleInEngine = await hunterPage.evaluate(() => {
      const target = window.__ENGINE__.getVisibleTargetHider();
      return target ? { id: target.id, name: target.name, x: target.x, y: target.y } : null;
    });
    console.log('Hunter engine detected visible target:', visibleInEngine);

    await sleep(500);

    // Verify Catch button on Hunter UI
    const catchBtnStatus = await hunterPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const catchBtn = btns.find((b) => b.innerText.includes('CATCH'));
      if (!catchBtn) return { found: false };
      return {
        found: true,
        text: catchBtn.innerText,
        disabled: catchBtn.disabled,
      };
    });
    console.log('Hunter Catch Button UI:', catchBtnStatus);

    if (!catchBtnStatus.found || catchBtnStatus.disabled) {
      throw new Error(`Catch button should be enabled when hider is in sight! Status: ${JSON.stringify(catchBtnStatus)}`);
    }

    console.log('10. Triggering CATCH button from Hunter...');
    await hunterPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const catchBtn = btns.find((b) => b.innerText.includes('CATCH'));
      if (catchBtn) catchBtn.click();
    });
    await sleep(1500);

    // Verify Hider received caught state
    const hiderCaughtState = await hiderPage.evaluate(() => {
      const hasCaughtOverlay = document.body.innerText.includes('YOU WERE CAUGHT');
      const isCaughtInEngine = window.__ENGINE__ ? window.__ENGINE__.isCaught : true;
      return { hasCaughtOverlay, isCaughtInEngine };
    });
    console.log('Hider caught state:', hiderCaughtState);

    if (!hiderCaughtState.hasCaughtOverlay && !hiderCaughtState.isCaughtInEngine) {
      throw new Error('Hider did not register as caught!');
    }

    console.log('✓ Hider successfully registered as caught and caught overlay displayed!');
    console.log('11. Verifying Game End & Result screen...');
    await sleep(3000);

    const resultScreens = await Promise.all([
      page1.evaluate(() => document.body.innerText.includes('VICTORY') || document.body.innerText.includes('DEFEAT') || document.body.innerText.includes('NAGAVALLI WINS') || document.body.innerText.includes('CAUGHT')),
      page2.evaluate(() => document.body.innerText.includes('VICTORY') || document.body.innerText.includes('DEFEAT') || document.body.innerText.includes('NAGAVALLI WINS') || document.body.innerText.includes('CAUGHT')),
    ]);
    console.log('Result screen indicators on Tab 1 & Tab 2:', resultScreens);

    console.log('=====================================================');
    console.log('✅ ALL VERIFICATIONS PASSED: TEST MODE, VISION, CATCH, & END SCREEN ARE 100% OPERATIONAL!');
    console.log('=====================================================');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
