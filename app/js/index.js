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

	// === JavaScript Code (process images) ===

	for (let i = 0; i < imageList.length; i++) {
		updateLoaderStatus(`Inverting file ${i + 1}/${imageList.length}`);

		const fileName = imageList[i];
		const image = await fetchImage(fileName);
		const arrayBuffer = await image.arrayBuffer();
		const bmpBytes = new Uint8Array(arrayBuffer);
	
		analyzeImage(bmpBytes);
		const invertedBytes = invertColors(bmpBytes, fileName);
	
		saveImage(fileName, bmpBytes, invertedBytes);
	}

	// === JavaScript Code End ===

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

const invertColors = (bmpBytes, fileName) => {
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
