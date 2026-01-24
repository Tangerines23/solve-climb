import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

/**
 * 이미지 최적화 함수
 */
async function optimizeImages() {
    console.log('🖼️  [Asset Guardian] 이미지 최적화 시작...');

    const files = fs.readdirSync(PUBLIC_DIR);
    const imageFiles = files.filter(file => /\.(png|jpg|jpeg)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log('✅ 최적화할 이미지가 없습니다.');
        return;
    }

    for (const file of imageFiles) {
        const inputPath = path.join(PUBLIC_DIR, file);
        const fileName = path.parse(file).name;
        const outputPath = path.join(PUBLIC_DIR, `${fileName}.webp`);

        // 이미 webp 파일이 있고, 원본보다 최신이면 건너뜀
        if (fs.existsSync(outputPath)) {
            const inputStats = fs.statSync(inputPath);
            const outputStats = fs.statSync(outputPath);
            if (outputStats.mtime > inputStats.mtime) {
                continue;
            }
        }

        try {
            await sharp(inputPath)
                .webp({ quality: 80 }) // 80% 품질로 WebP 변환
                .toFile(outputPath);

            const inputSize = (fs.statSync(inputPath).size / 1024).toFixed(2);
            const outputSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
            const savings = (100 - (parseFloat(outputSize) / parseFloat(inputSize)) * 100).toFixed(1);

            console.log(`✅ ${file}: ${inputSize}KB -> ${outputSize}KB (${savings}% 절감)`);
        } catch (error) {
            console.error(`❌ ${file} 처리 중 오류 발생:`, error);
        }
    }

    console.log('✅ 이미지 최적화 완료.');
}

optimizeImages();
