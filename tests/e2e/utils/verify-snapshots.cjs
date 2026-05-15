const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

/**
 * Compares two directories of snapshots and reports differences.
 * Usage: node tests/e2e/utils/verify-snapshots.js <dir1> <dir2>
 */

async function compareImages(path1, path2) {
  const img1 = await loadImage(path1);
  const img2 = await loadImage(path2);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return { identical: false, reason: `Dimensions mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}` };
  }

  const canvas = createCanvas(img1.width, img1.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(img1, 0, 0);
  const data1 = ctx.getImageData(0, 0, img1.width, img1.height).data;

  ctx.clearRect(0, 0, img1.width, img1.height);
  ctx.drawImage(img2, 0, 0);
  const data2 = ctx.getImageData(0, 0, img2.width, img2.height).data;

  let diffCount = 0;
  for (let i = 0; i < data1.length; i++) {
    if (data1[i] !== data2[i]) {
      diffCount++;
    }
  }

  return {
    identical: diffCount === 0,
    diffPixels: diffCount / 4, // 4 values per pixel (RGBA)
    totalPixels: img1.width * img1.height,
    diffRatio: (diffCount / 4) / (img1.width * img1.height)
  };
}

async function run() {
  const [,, dir1, dir2] = process.argv;

  if (!dir1 || !dir2) {
    console.error('Usage: node verify-snapshots.js <dir1> <dir2>');
    process.exit(1);
  }

  if (!fs.existsSync(dir1) || !fs.existsSync(dir2)) {
    console.error('One or both directories do not exist.');
    process.exit(1);
  }

  const files1 = fs.readdirSync(dir1).filter(f => f.endsWith('.png'));
  const files2 = fs.readdirSync(dir2).filter(f => f.endsWith('.png'));

  const commonFiles = files1.filter(f => files2.includes(f));

  console.log(`Comparing ${commonFiles.length} common files...`);

  let failures = 0;
  for (const file of commonFiles) {
    const res = await compareImages(path.join(dir1, file), path.join(dir2, file));
    if (!res.identical) {
      console.log(`❌ ${file}: Diff ratio ${res.diffRatio.toFixed(4)} (${res.diffPixels} pixels)`);
      failures++;
    } else {
      console.log(`✅ ${file}: Identical`);
    }
  }

  if (failures > 0) {
    console.log(`\nFound ${failures} differences.`);
    process.exit(1);
  } else {
    console.log('\nAll common snapshots are identical!');
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
