import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2] || 'default'; // 'js', 'wasm', or fallback to 'default'

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');

  const imagesFolder = path.join(__dirname, '../images');
  const imageFiles = fs.readdirSync(imagesFolder)
  .filter(file => file.endsWith('.bmp'))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const times = [];

  for (const imageFile of imageFiles) {
    const imagePath = path.join(imagesFolder, imageFile);

    // Upload image with input
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(imagePath);

    // Wait until #elapsed-value will become wisible and get the value
    await page.waitForSelector('#elapsed-value', { visible: true });

    const elapsedTime = await page.$eval('#elapsed-value', el => parseFloat(el.textContent));

    console.log(`Image ${imageFile} processed by ${mode} in ${elapsedTime} ms`);
    times.push({ file: imageFile, time: elapsedTime });
  }

  // Calculate avg and standard deviation
  const rawTimes = times.map(t => t.time);
  const mean = rawTimes.reduce((sum, t) => sum + t, 0) / rawTimes.length;
  const stdDev = Math.sqrt(rawTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / rawTimes.length);

  // Exclude only values that are greater than mean + 2 * stdDev
  const filtered = times.filter(({ time }) => time <= mean + 2 * stdDev);
  const excluded = times.filter(({ time }) => time > mean + 2 * stdDev);

  for (const { file, time } of excluded) {
    console.log(`⚠️  Excluding outlier: ${file} (${time.toFixed(2)} ms)`);
  }

  const averageFilteredTime = filtered.reduce((sum, t) => sum + t.time, 0) / filtered.length;
  
  console.log('');
  console.log(`Average processing time (excluding outliers): ${averageFilteredTime.toFixed(2)} ms`);
  console.log('');

  await browser.close();
})();
