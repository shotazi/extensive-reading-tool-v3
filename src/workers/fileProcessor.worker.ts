import * as PDFJS from 'pdfjs-dist';
import JSZip from 'jszip';
import PDFWorker from 'pdfjs-dist/build/pdf.worker.min?url';

PDFJS.GlobalWorkerOptions.workerSrc = PDFWorker;

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

async function processTxtChunks(chunks: ArrayBuffer[]): Promise<string> {
  const decoder = new TextDecoder();
  let text = '';
  
  for (const chunk of chunks) {
    text += decoder.decode(chunk, { stream: true });
    // Report progress after each chunk
    self.postMessage({ type: 'progress', data: chunks.indexOf(chunk) / chunks.length });
  }
  
  return text;
}

async function processPdfDocument(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const textContent: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => item.str)
      .join(' ');
    textContent.push(pageText);

    // Report progress after each page
    self.postMessage({ type: 'progress', data: i / numPages });
  }

  return textContent.join('\n\n');
}

async function processEpubDocument(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = new JSZip();
  const epub = await zip.loadAsync(arrayBuffer);
  const textContent: string[] = [];
  const files = Object.keys(epub.files);
  let processedFiles = 0;

  // Process container.xml first
  const containerXml = await epub.file('META-INF/container.xml')?.async('text');
  if (!containerXml) {
    throw new Error('Invalid EPUB: Missing container.xml');
  }

  const opfPath = containerXml.match(/full-path="([^"]+)"/)?.[1];
  if (!opfPath) {
    throw new Error('Invalid EPUB: Cannot find OPF file path');
  }

  // Process HTML files in chunks
  const htmlFiles = files.filter(path => path.endsWith('.html') || path.endsWith('.xhtml'));
  const chunkSize = 5; // Process 5 files at a time
  
  for (let i = 0; i < htmlFiles.length; i += chunkSize) {
    const chunk = htmlFiles.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (path) => {
      const file = epub.files[path];
      const content = await file.async('text');
      return content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    });

    const chunkResults = await Promise.all(chunkPromises);
    textContent.push(...chunkResults.filter(Boolean));
    
    processedFiles += chunk.length;
    self.postMessage({ 
      type: 'progress', 
      data: processedFiles / htmlFiles.length 
    });
  }

  return textContent.join('\n\n');
}

self.onmessage = async (e: MessageEvent) => {
  try {
    const { type, buffer, chunks } = e.data;
    let result: string;

    switch (type) {
      case 'txt':
        result = await processTxtChunks(chunks);
        break;
      case 'pdf':
        result = await processPdfDocument(buffer);
        break;
      case 'epub':
        result = await processEpubDocument(buffer);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    self.postMessage({ type: 'complete', data: result });
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      data: error.message || 'Error processing file' 
    });
  }
};