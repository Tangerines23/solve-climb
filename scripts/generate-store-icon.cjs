const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function generateStoreIcon() {
  const sourcePath = path.join(__dirname, '..', 'public', 'SolveClimb.webp');
  const outputDir = path.join(__dirname, '..', 'reports', 'playstore-screenshots');
  const targetPath = path.join(outputDir, 'app_icon_512.png');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  await sharp(sourcePath)
    .resize(512, 512)
    .png()
    .toFile(targetPath);

  console.log(`Successfully generated 512x512 Play Store App Icon at ${targetPath}`);
}

generateStoreIcon().catch(err => {
  console.error(err);
  process.exit(1);
});
