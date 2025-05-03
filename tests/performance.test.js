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
  const imageFiles = fs.readdirSync(imagesFolder).filter(file => file.endsWith('.bmp'));

  let totalTime = 0;
  let imageCount = 0;

  for (const imageFile of imageFiles) {
    const imagePath = path.join(imagesFolder, imageFile);

    // Upload image with input
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(imagePath);

    // Wait until #elapsed-value will become wisible and get the value
    await page.waitForSelector('#elapsed-value', { visible: true });

    const elapsedTime = await page.$eval('#elapsed-value', el => parseFloat(el.textContent));

    console.log(`Image ${imageFile} processed by ${mode} in ${elapsedTime} ms`);

    totalTime += elapsedTime;
    imageCount++;
  }

  // Count average processing time
  const averageTime = totalTime / imageCount;
  console.log(`Average processing time: ${averageTime.toFixed(2)} ms`);

  await browser.close();
})();
