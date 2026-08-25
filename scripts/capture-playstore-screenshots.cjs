const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function captureScreenshots() {
  const outputDir = path.join(__dirname, '..', 'reports', 'playstore-screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean out any old/extraneous screenshot files
  const existingFiles = fs.readdirSync(outputDir);
  for (const f of existingFiles) {
    if (f.startsWith('1_') || f.startsWith('2_') || f.startsWith('3_') || f.startsWith('4_') || f.includes('screach') || f.includes('gym')) {
      fs.unlinkSync(path.join(outputDir, f));
      console.log(`Removed old file: ${f}`);
    }
  }

  console.log('Starting preview dev server for screenshot capture...');
  const viteServer = spawn('npx', ['vite', '--port', '4173'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'ignore'
  });

  await new Promise(r => setTimeout(r, 4000));

  console.log('Launching browser in mobile 360x740 viewport...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 740 },
    deviceScaleFactor: 2, // 720x1480 px (360x740 aspect ratio @ 2x)
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  // Pre-seed local storage with dummy profile
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const deviceId = 'device_demo_12345';
    const profile = {
      profileId: 'profile_demo_12345',
      nickname: '클라이머',
      avatar: '🧗‍♂️',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem('solve-climb-device-id', JSON.stringify(deviceId));
    localStorage.setItem(`solve-climb-profiles-${deviceId}`, JSON.stringify([profile]));
    localStorage.setItem(`solve-climb-active-profile-id-${deviceId}`, JSON.stringify(profile.profileId));
    localStorage.setItem('solve-climb-active-profile', JSON.stringify(profile));
  });

  const routes = [
    { name: '1_home_screen.png', url: 'http://localhost:4173/' },
    { 
      name: '2_climbing_game.png', 
      url: 'http://localhost:4173/quiz?mountain=math&world=World1&category=%EA%B8%B0%EC%B4%88&level=1&mode=time-attack' 
    },
    { name: '3_ranking.png', url: 'http://localhost:4173/ranking' },
    { name: '4_my_profile.png', url: 'http://localhost:4173/my-page' }
  ];

  for (const r of routes) {
    console.log(`Capturing ${r.name} from ${r.url}...`);
    try {
      await page.goto(r.url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    }

    if (r.name === '2_climbing_game.png') {
      await new Promise(res => setTimeout(res, 1200));

      // Click '시작하기' inside tip modal if visible
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const startBtn = btns.find(b => b.innerText.includes('시작하기') || b.innerText.includes('등반하기') || b.innerText.includes('시작'));
        if (startBtn) startBtn.click();
      });
      await new Promise(res => setTimeout(res, 2000));
    } else {
      await new Promise(res => setTimeout(res, 2000));
    }

    const targetPath = path.join(outputDir, r.name);
    await page.screenshot({ path: targetPath, fullPage: false });
    console.log(`Saved screenshot to ${targetPath}`);
  }

  await browser.close();
  viteServer.kill();
  console.log('SUCCESS! All 3 Play Store screenshots captured (Home, Basic Ridge In-game, My Profile).');
}

captureScreenshots().catch(err => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
