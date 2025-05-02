const ModuleReady = new Promise(resolve => {
  Module.onRuntimeInitialized = () => resolve(Module);
});

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

  // === WASM Code (process image) ===
  const Module = await ModuleReady;
  const ptr = Module._malloc(bmpBytes.length);
  Module.HEAPU8.set(bmpBytes, ptr);

  // Analyze image and print some data
  Module.ccall('analyze_image', null, ['number', 'number'], [ptr, bmpBytes.length]);

  // Invert colors of image
  Module.ccall('invert_colors', null, ['number'], [ptr]);

  // Get inverted image bytes back
  const invertedBytes = Module.HEAPU8.slice(ptr, ptr + bmpBytes.length);

  Module._free(ptr);
  // === WASM Code End ===

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