document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Initial setup (reset image and elapsed data)
  resetData();
  hideElapsed();

  // Show original image and loader
  showOriginal(file);
  showLoader();

  // Read bytes of image as arrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const bmpBytes = new Uint8Array(arrayBuffer);

  // Start Timer
  const startTime = performance.now();

  // === JavaScript Code (process image) ===
  analyzeImage(bmpBytes)

  const invertedBytes = invertColors(bmpBytes);

  // === JavaScript Code End ===

  // Stop timer
  const endTime = performance.now();

  hideLoader();
  showInverted(invertedBytes);
  showElapsed(startTime, endTime);
});

const resetData = () => {
  const originalImage = document.getElementById('original');
  const invertedImage = document.getElementById('inverted');

  originalImage.style.backgroundImage = '';
  invertedImage.style.backgroundImage = '';
}

const showLoader = () => {
  const loader = document.getElementById('loader');
  loader.style.display = 'flex';
};

const hideLoader = () => {
  const loader = document.getElementById('loader');
  loader.style.display = 'none';
};

const showElapsed = (startTime, endTime) => {
  const elapsedContainer = document.getElementById('elapsed-container');
  elapsedContainer.style.display = 'block';

  const elapsedTimeText = document.getElementById('elapsed-value');
  const elapsedTime = (endTime - startTime).toFixed(2);
  elapsedTimeText.textContent = String(elapsedTime);
};

const hideElapsed = () => {
  const elapsedContainer = document.getElementById('elapsed-container');
  elapsedContainer.style.display = 'none';
};

const showOriginal = (file) => {
  const originalImage = document.getElementById('original');

  const originalUrl = URL.createObjectURL(file);
  originalImage.style.backgroundImage = `url(${originalUrl})`;
};

const showInverted = (invertedBytes) => {
  const invertedImage = document.getElementById('inverted');

  const blob = new Blob([invertedBytes], { type: 'image/bmp' });
  const invertedUrl = URL.createObjectURL(blob);
  invertedImage.style.backgroundImage = `url(${invertedUrl})`;
};

const analyzeImage = (bmpBytes) => {
  console.log(`Received image with ${bmpBytes.length} bytes`);

  // Signature check
  const signature = (bmpBytes[0]) | (bmpBytes[1] << 8);
  if (signature !== 0x4D42) {
    console.log('Not a valid BMP file');
    return;
  }

  // read width with little-endian
  const width = bmpBytes[18] | (bmpBytes[19] << 8) | (bmpBytes[20] << 16) | (bmpBytes[21] << 24);
  // read height with little-endian
  const height = bmpBytes[22] | (bmpBytes[23] << 8) | (bmpBytes[24] << 16) | (bmpBytes[25] << 24);
  // read bits per pixel with little-endian
  const bitsPerPixel = bmpBytes[28] | (bmpBytes[29] << 8);
  // read dataOffset with little-endian
  const dataOffset = bmpBytes[10] | (bmpBytes[11] << 8) | (bmpBytes[12] << 16) | (bmpBytes[13] << 24);

  if (bitsPerPixel !== 24) {
    console.log('Only 24-bit BMP files are supported');
    return;
  }

  console.log('BMP File Info:');
  console.log(`Width: ${width} pixels`);
  console.log(`Height: ${height} pixels`);
  console.log(`Bits per pixel: ${bitsPerPixel}`);
  console.log(`Data starts at offset: ${dataOffset} bytes`);
  console.log('');
}

function invertColors(bmpBytes) {
  const dataOffset = bmpBytes[10] | (bmpBytes[11] << 8) | (bmpBytes[12] << 16) | (bmpBytes[13] << 24);
  const width = bmpBytes[18] | (bmpBytes[19] << 8) | (bmpBytes[20] << 16) | (bmpBytes[21] << 24);
  const height = bmpBytes[22] | (bmpBytes[23] << 8) | (bmpBytes[24] << 16) | (bmpBytes[25] << 24);

  const rowSize = (width * 3 + 3) & (~3); // row padding to multiple of 4 bytes
  const invertedBmp = new Uint8Array(bmpBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = dataOffset + y * rowSize;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + x * 3;
      invertedBmp[pixelOffset] = 255 - bmpBytes[pixelOffset];         // Blue
      invertedBmp[pixelOffset + 1] = 255 - bmpBytes[pixelOffset + 1]; // Green
      invertedBmp[pixelOffset + 2] = 255 - bmpBytes[pixelOffset + 2]; // Red
    }
  }

  return invertedBmp;
};
