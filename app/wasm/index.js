let ModuleInstance = null;

const ModuleReady = new Promise((resolve) => {
  Module.onRuntimeInitialized = () => {
    ModuleInstance = Module;
    resolve(Module);
  };
});

const getModule = async () => {
  if (ModuleInstance) return ModuleInstance;
  return await ModuleReady;
};

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

  // === WASM Code (process image) ===
  const Module = await getModule();
  const ptr = Module._malloc(bmpBytes.length);
  Module.HEAPU8.set(bmpBytes, ptr);

  // Analyze image and print some data
  Module.ccall('analyze_image', null, ['number', 'number'], [ptr, bmpBytes.length]);

  // Invert colors of image
  Module.ccall('invert_colors', null, ['number', 'string'], [ptr, fileName]);

  // Get inverted image bytes back
  const invertedBytes = Module.HEAPU8.slice(ptr, ptr + bmpBytes.length);

  Module._free(ptr);
  // === WASM Code End ===

  // Stop timer
  const endTime = performance.now();

  hideLoader();
  showInverted(invertedBytes, fileName);
  showElapsed(startTime, endTime);
});

document.getElementById('button').addEventListener('click', async () => {
  // Initial setup (reset image and elapsed data)
  resetData();
  hideElapsed();

  // Show loader
  showLoader();

  const imageList = await getImagesList();

  // Start Timer
  const startTime = performance.now();

  // === WASM Code (process images) ===

  const Module = await getModule();
  
  for (const fileName of imageList) {
    const imageFile = await fetch(`/images/${fileName}`);
    const image = await imageFile.blob();

    // Read bytes of image as arrayBuffer
    const arrayBuffer = await image.arrayBuffer();
    const bmpBytes = new Uint8Array(arrayBuffer);

    const ptr = Module._malloc(bmpBytes.length);
    Module.HEAPU8.set(bmpBytes, ptr);

    showOriginal(image, fileName);

    // Analyze image and print some data
    Module.ccall('analyze_image', null, ['number', 'number'], [ptr, bmpBytes.length]);

    // Invert colors of image
    Module.ccall('invert_colors', null, ['number', 'string'], [ptr, fileName]);

    // Get inverted image bytes back
    const invertedBytes = Module.HEAPU8.slice(ptr, ptr + bmpBytes.length);

    Module._free(ptr);

    showInverted(invertedBytes, fileName);
  }

  // === WASM Code End ===

  // Stop timer
  const endTime = performance.now();

  hideLoader();
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

const getImagesList = async () => {
  const response = await fetch('/api/images');
  const imageList = await response.json();

  return imageList;
};
