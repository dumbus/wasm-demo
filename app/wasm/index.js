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

let images = [];

document.getElementById('invert-button').addEventListener('click', async () => {
	// Reset state
	images = [];
	hideImages();
	hideButtons();
	hideElapsed();
	showLoader();

	const imageList = await getImagesList();

	// Start Timer
	const startTime = performance.now();

	// === WASM Code (process images) ===

  const Module = await getModule();

	for (let i = 0; i < imageList.length; i++) {
		updateLoaderStatus(`Inverting file ${i + 1}/${imageList.length}`);

		const fileName = imageList[i];
		const image = await fetchImage(fileName);
		const arrayBuffer = await image.arrayBuffer();
		const bmpBytes = new Uint8Array(arrayBuffer);

    const ptr = Module._malloc(bmpBytes.length);
    Module.HEAPU8.set(bmpBytes, ptr);
	
    // Analyze image and print some data
    Module.ccall('analyze_image', null, ['number', 'number'], [ptr, bmpBytes.length]);

    // Invert colors of image
    Module.ccall('invert_colors', null, ['number', 'string'], [ptr, fileName]);

    const invertedBytes = Module.HEAPU8.slice(ptr, ptr + bmpBytes.length);

    Module._free(ptr);
	
		saveImage(fileName, bmpBytes, invertedBytes);
	}

	// === WASM Code End ===

	// Stop timer
	const endTime = performance.now();

	hideLoader();
	showElapsed(startTime, endTime);
	showButtons();

	// show first image
	showImages(images[0]);
});

const getImagesList = async () => {
	const response = await fetch('/api/images');
	return await response.json();
};

const fetchImage = async (fileName) => {
	const response = await fetch(`/images/${fileName}`);
	return await response.blob();
};

const saveImage = (fileName, originalBytes, invertedBytes) => {
	const originalBlob = new Blob([originalBytes], { type: 'image/bmp' });
	const invertedBlob = new Blob([invertedBytes], { type: 'image/bmp' });

	images.push({
		fileName,
		originalUrl: URL.createObjectURL(originalBlob),
		invertedUrl: URL.createObjectURL(invertedBlob),
	});
};

const showImages = ({ fileName, originalUrl, invertedUrl }) => {
	const originalBox = document.getElementById('original');
	const invertedBox = document.getElementById('inverted');

	originalBox.innerHTML = '';
	invertedBox.innerHTML = '';

	const originalImg = document.createElement('img');
	originalImg.src = originalUrl;
	originalImg.classList.add('image');

	const invertedImg = document.createElement('img');
	invertedImg.src = invertedUrl;
	invertedImg.classList.add('image');

	originalBox.appendChild(originalImg);
	invertedBox.appendChild(invertedImg);

	const originalTitle = document.getElementById('original-title');
	const invertedTitle = document.getElementById('inverted-title');

	originalTitle.textContent = fileName;
	invertedTitle.textContent = fileName;
};

const hideImages = () => {
	document.getElementById('original').innerHTML = '';
	document.getElementById('inverted').innerHTML = '';
};

const showButtons = () => {
	const container = document.getElementById('buttons');

	images.forEach((img, index) => {
		const btn = document.createElement('button');

		btn.textContent = String(index + 1);
		btn.classList.add('pagination-button');
		btn.addEventListener('click', () => showImages(img));

		container.appendChild(btn);
	});
};

const hideButtons = () => {
	const container = document.getElementById('buttons');
	container.innerHTML = '';
};

const showLoader = () => {
	const loader = document.getElementById('loader');
	loader.style.display = 'flex';
};

const hideLoader = () => {
	const loader = document.getElementById('loader');
	loader.style.display = 'none';
};

const updateLoaderStatus = (text) => {
	const status = document.getElementById('loader-status');
	status.textContent = text;
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
