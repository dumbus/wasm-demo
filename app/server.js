import express from 'express';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

// Static files from ./javascript
app.use('/', express.static(path.join(__dirname, 'javascript')));

// Раздача изображений из ./images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Эндпоинт для получения списка .bmp изображений
app.get('/api/images', (req, res) => {
  const imagesDir = path.join(__dirname, 'images');

  fs.readdir(imagesDir, (err, files) => {
    const bmpImages = files
      .filter(file => file.toLowerCase().endsWith('.bmp'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    res.json(bmpImages);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
