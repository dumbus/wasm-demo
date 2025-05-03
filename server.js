import express from 'express';
import path from 'path';

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3000;

const mode = process.argv[2]; // 'js' or 'wasm'

// Check if mode argument is valid
if (!['js', 'wasm'].includes(mode)) {
  console.error('App mode can be only js or wasm');
  console.error('Example: node ./app/server.js js');
  process.exit(1);
}

const staticDir = path.join(__dirname, mode);

// Static files from ./js or ./wasm
app.use('/', express.static(staticDir));

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Serving static files from: ./${mode}`);
});