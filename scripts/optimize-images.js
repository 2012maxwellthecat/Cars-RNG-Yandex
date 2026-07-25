#!/usr/bin/env node
/**
 * Конвертирует все изображения машин в WebP 600px width, quality 85.
 * Запуск: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR  = path.join(__dirname, '..', 'assets', 'cars');
const OUTPUT_DIR = path.join(__dirname, '..', 'yandex-game', 'public', 'assets', 'cars');
const TARGET_WIDTH = 600;
const WEBP_QUALITY = 85;

const SUPPORTED = /\.(jpg|jpeg|JPG|JPEG|png|PNG|webp|WEBP)$/;

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => SUPPORTED.test(f));
  console.log(`Найдено ${files.length} изображений → конвертация в WebP ${TARGET_WIDTH}px quality ${WEBP_QUALITY}\n`);

  let ok = 0, fail = 0;
  const results = [];

  for (const file of files) {
    const inputPath  = path.join(INPUT_DIR, file);
    const baseName   = path.basename(file, path.extname(file)).toLowerCase();
    const outputPath = path.join(OUTPUT_DIR, baseName + '.webp');

    try {
      const meta = await sharp(inputPath).metadata();
      const beforeSize = fs.statSync(inputPath).size;

      // Ресайз только если картинка шире TARGET_WIDTH, иначе оставляем размер
      const pipeline = sharp(inputPath).rotate(); // auto-rotate по EXIF
      if (meta.width > TARGET_WIDTH) {
        pipeline.resize(TARGET_WIDTH, null, { withoutEnlargement: true });
      }
      await pipeline.webp({ quality: WEBP_QUALITY }).toFile(outputPath);

      const afterSize = fs.statSync(outputPath).size;
      const ratio = ((1 - afterSize / beforeSize) * 100).toFixed(0);
      results.push({ file, beforeSize, afterSize, ratio });
      ok++;
    } catch (err) {
      console.error(`  ОШИБКА ${file}: ${err.message}`);
      fail++;
    }
  }

  // Итог
  console.log('\n── Результат ──────────────────────────────────────────');
  let totalBefore = 0, totalAfter = 0;
  for (const r of results) {
    const b = (r.beforeSize / 1024).toFixed(0).padStart(5);
    const a = (r.afterSize  / 1024).toFixed(0).padStart(5);
    const arrow = r.ratio > 0 ? `↓${r.ratio}%` : `↑${Math.abs(r.ratio)}%`;
    console.log(`  ${r.file.padEnd(45)} ${b}KB → ${a}KB  ${arrow}`);
    totalBefore += r.beforeSize;
    totalAfter  += r.afterSize;
  }

  const totalRatio = ((1 - totalAfter / totalBefore) * 100).toFixed(1);
  console.log('────────────────────────────────────────────────────────');
  console.log(`  Итого: ${(totalBefore/1024/1024).toFixed(1)}MB → ${(totalAfter/1024/1024).toFixed(1)}MB  (−${totalRatio}%)`);
  console.log(`  OK: ${ok}  Ошибки: ${fail}`);
  console.log(`\nФайлы записаны в: ${OUTPUT_DIR}`);
}

main();
