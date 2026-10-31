import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Setup pdf.js worker with local bundled worker and CDN fallback
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorker ||
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Loads a File object into an HTML Image element
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file. Please upload a valid PNG, JPG, or WebP.'));
    };
    img.src = url;
  });
}

/**
 * Preprocesses an image or canvas for optimal OCR accuracy:
 * - Resizes large camera photos to optimal OCR dimensions (1400px - 2200px)
 * - Converts to grayscale
 * - Normalizes luminance and increases contrast so dark text stands out sharply against background
 */
function preprocessImage(imageSource, originalWidth, originalHeight) {
  const width = originalWidth || imageSource.naturalWidth || imageSource.width || 1200;
  const height = originalHeight || imageSource.naturalHeight || imageSource.height || 1600;

  let targetWidth = width;
  let targetHeight = height;
  const maxDim = 2200;
  const minDim = 1200;

  if (targetWidth > maxDim || targetHeight > maxDim) {
    const ratio = Math.min(maxDim / targetWidth, maxDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  } else if (targetWidth < minDim && targetHeight < minDim) {
    const ratio = Math.max(minDim / targetWidth, minDim / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Fill white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(imageSource, 0, 0, targetWidth, targetHeight);

  // Grayscale & contrast enhancement to remove camera shadows and paper discolouration
  try {
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;

    let minLum = 255;
    let maxLum = 0;
    const lums = new Uint8Array(data.length / 4);

    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lums[j] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    const lumRange = Math.max(maxLum - minLum, 1);

    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      let norm = ((lums[j] - minLum) / lumRange) * 255;

      // Darken text glyphs, lighten shadows/background
      if (norm < 130) {
        norm = Math.max(0, norm * 0.7);
      } else {
        norm = Math.min(255, norm * 1.25);
      }

      data[i] = norm;
      data[i + 1] = norm;
      data[i + 2] = norm;
    }

    ctx.putImageData(imgData, 0, 0);
  } catch (err) {
    console.warn('Canvas pixel processing warning:', err);
  }

  return canvas;
}

/**
 * Cleans raw OCR text output to filter out stray symbol noise
 */
function cleanOcrText(text) {
  if (!text) return '';

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      // Strip lines that are pure non-alphanumeric noise (e.g. "| = - _ ~ ` @")
      const alphaCount = (line.match(/[a-zA-Z0-9]/g) || []).length;
      return alphaCount >= 2 || line.length <= 3;
    })
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from an uploaded file (PDF, Image, or plain text)
 * @param {File} file
 * @param {Function} onProgress (optional progress callback 0-100)
 * @returns {Promise<string>}
 */
export async function extractTextFromFile(file, onProgress = () => {}) {
  const fileType = file.type || '';
  const fileName = file.name || '';

  // 1. Plain text / Markdown
  if (fileType.includes('text') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    onProgress(50);
    const text = await file.text();
    onProgress(100);
    return text.trim();
  }

  // 2. PDF Document
  if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
    onProgress(10);
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY;
      let pageText = '';
      for (const item of textContent.items) {
        if (!item.str) continue;
        if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n';
        } else if (pageText && !pageText.endsWith(' ') && !pageText.endsWith('\n')) {
          pageText += ' ';
        }
        pageText += item.str;
        lastY = item.transform[5];
      }

      if (pageText.trim()) {
        fullText += `\n--- Page ${pageNum} ---\n` + pageText.trim();
      }
      onProgress(Math.round(10 + (pageNum / numPages) * 70));
    }

    // If PDF had selectable text, return it
    if (fullText.trim().length > 30) {
      onProgress(100);
      return fullText.trim();
    }

    // Scanned PDF fallback: render each page to canvas and OCR with Tesseract
    const maxScanPages = Math.min(numPages, 10);
    let ocrWorker = null;
    try {
      ocrWorker = await createWorker('eng');
      for (let pageNum = 1; pageNum <= maxScanPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        await page.render({ canvasContext: ctx, viewport }).promise;

        const processed = preprocessImage(canvas, viewport.width, viewport.height);
        const ret = await ocrWorker.recognize(processed);
        const pageText = cleanOcrText(ret.data?.text || '');
        if (pageText) {
          fullText += `\n--- Page ${pageNum} (Scanned) ---\n` + pageText;
        }
        onProgress(Math.round(20 + (pageNum / maxScanPages) * 75));
      }
    } finally {
      if (ocrWorker) {
        await ocrWorker.terminate();
      }
    }

    onProgress(100);
    if (fullText.trim().length > 20) {
      return fullText.trim();
    }
    throw new Error('Could not extract readable text from this PDF. Please paste syllabus text manually.');
  }

  // 3. Image OCR (PNG, JPG, JPEG, WEBP, etc.)
  if (
    fileType.startsWith('image/') ||
    /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(fileName)
  ) {
    let worker = null;
    try {
      onProgress(20);
      const img = await loadImageFromFile(file);
      onProgress(35);

      const processedCanvas = preprocessImage(img);
      onProgress(50);

      worker = await createWorker('eng');
      onProgress(70);

      const ret = await worker.recognize(processedCanvas);
      onProgress(95);

      const cleaned = cleanOcrText(ret.data?.text || '');
      onProgress(100);

      if (!cleaned || cleaned.length < 15) {
        throw new Error(
          'Could not extract readable text from this image. Please upload a clearer syllabus photo or paste the text directly.'
        );
      }
      return cleaned;
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }

  throw new Error('Unsupported file format. Please upload a PDF, image (PNG/JPG), or text file.');
}
