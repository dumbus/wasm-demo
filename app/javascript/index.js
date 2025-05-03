document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  const fileName = file.name;
  if (!file) return;

  // Initial setup (reset image and elapsed data)
  resetData();
  hideElapsed();

  // Show original image and loader
  showOriginal(file, fileName);
  showLoader();

  // Read bytes of image as arrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const bmpBytes = new Uint8Array(arrayBuffer);

  // Start Timer
  const startTime = performance.now();

  // === JavaScript Code (process image) ===
  analyzeImage(bmpBytes)

  const invertedBytes = invertColors(bmpBytes, fileName);

  // === JavaScript Code End ===

  // Stop timer
  const endTime = performance.now();

  hideLoader();
  showInverted(invertedBytes, fileName);
  showElapsed(startTime, endTime);
});

document.getElementById('button').addEventListener('click', async () => {
  // Initial setup (reset image and elapsed data)
  resetData();
  hideGallery();
  hideElapsed();

  // Show loader
  showLoader();

  const imageList = await getImagesList();

  console.log(imageList);

  // Start Timer
  const startTime = performance.now();

  // === JavaScript Code (process images) ===
  
  for (const fileName of imageList) {
    const imageFile = await fetch(`/images/${fileName}`);
    const image = await imageFile.blob();

    // Read bytes of image as arrayBuffer
    const arrayBuffer = await image.arrayBuffer();
    const bmpBytes = new Uint8Array(arrayBuffer);

    showOriginal(image, fileName);

    analyzeImage(bmpBytes)
    const invertedBytes = invertColors(bmpBytes, fileName);

    showInverted(invertedBytes, fileName);
  }

  // === JavaScript Code End ===

  // Stop timer
  const endTime = performance.now();

  hideLoader();
  showGallery();
  showElapsed(startTime, endTime);
});

const resetData = () => {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
};

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

const showOriginal = (file, fileId) => {
  const originalUrl = URL.createObjectURL(file);

  const container = document.createElement('div');
  container.className = 'image-container';

  const title = document.createElement('h2');
  title.className = 'image-title';
  title.textContent = `Original Image ${fileId}`;
  
  const originalImage = document.createElement('div');
  originalImage.className = 'image-box';
  originalImage.style.backgroundImage = `url(${originalUrl})`;

  container.appendChild(title);
  container.appendChild(originalImage);

  document.getElementById('gallery').appendChild(container);
};

const showInverted = (invertedBytes, fileId) => {
  const blob = new Blob([invertedBytes], { type: 'image/bmp' });
  const invertedUrl = URL.createObjectURL(blob);
  
  const container = document.createElement('div');
  container.className = 'image-container';

  const title = document.createElement('h2');
  title.className = 'image-title';
  title.textContent = `Inverted Image ${fileId}`;
  
  const invertedImage = document.createElement('div');
  invertedImage.className = 'image-box';
  invertedImage.style.backgroundImage = `url(${invertedUrl})`;

  container.appendChild(title);
  container.appendChild(invertedImage);

  document.getElementById('gallery').appendChild(container);
};

const showGallery = () => {
  const gallery = document.getElementById('gallery');
  gallery.style.display = 'grid';
};

const hideGallery = () => {
  const gallery = document.getElementById('gallery');
  gallery.style.display = 'none';
};

const getImagesList = async () => {
  const response = await fetch('/api/images');
  const imageList = await response.json();

  return imageList;
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
}

function invertColors(bmpBytes, fileName) {
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

  console.log(`Image ${fileName} was inverted`);
  console.log('');

  return invertedBmp;
};
