const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const sourceImage = path.join(__dirname, '..', 'public', 'SolveClimb.webp');
  const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

  const densities = [
    { name: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { name: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { name: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { name: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { name: 'mipmap-xxxhdpi', size: 192, fgSize: 432 }
  ];

  console.log('Generating Android app launcher icons from', sourceImage);

  for (const density of densities) {
    const targetFolder = path.join(resDir, density.name);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 1. Standard ic_launcher.png
    await sharp(sourceImage)
      .resize(density.size, density.size)
      .toFormat('png')
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // 2. Round ic_launcher_round.png
    await sharp(sourceImage)
      .resize(density.size, density.size)
      .toFormat('png')
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // 3. Foreground ic_launcher_foreground.png (padded inside 108dp canvas for Android adaptive icon safe zone)
    const innerSize = Math.round(density.fgSize * 0.65);
    const innerBuffer = await sharp(sourceImage)
      .resize(innerSize, innerSize)
      .toBuffer();

    await sharp({
      create: {
        width: density.fgSize,
        height: density.fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: innerBuffer, top: Math.round((density.fgSize - innerSize) / 2), left: Math.round((density.fgSize - innerSize) / 2) }])
      .toFormat('png')
      .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${density.name} (${density.size}x${density.size} & fg ${density.fgSize}x${density.fgSize})`);
  }

  console.log('SUCCESS! All Android launcher icons updated with SolveClimb logo.');
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
