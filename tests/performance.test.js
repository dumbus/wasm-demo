import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mode = process.argv[2] || 'default'; // 'js', 'wasm', or fallback to 'default'

(async () => {
  // Count .bmp files in images folder
  const imagesDir = path.join(__dirname, '../', 'app', 'images');
  const allFiles = fs.readdirSync(imagesDir);
  const bmpFiles = allFiles.filter(file => file.endsWith('.bmp'));
  const imagesCount = bmpFiles.length;

  // Start headless browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Subscribe to console messages and print messages that contain "bmp was inverted" to show progress
  page.on('console', msg => {
    const text = msg.text();

    if (text.includes('bmp was inverted')) {
      console.log(text);
    }
  });

  await page.goto('http://localhost:3000');

  await page.click('#invert-button');

  // Wait until #elapsed-value will become wisible and get the value
  await page.waitForSelector('#elapsed-value', { visible: true });
  const elapsedTime = await page.$eval('#elapsed-value', el => el.textContent.trim());

  console.log(`${imagesCount} images were processed by ${mode} in ${elapsedTime} ms`);

  await browser.close();
})();
