import { CHUNK_SIZE } from './fileProcessing';

export class FileProcessor {
  private worker: Worker;
  private abortController: AbortController;

  constructor() {
    this.worker = new Worker(
      new URL('../workers/fileProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );
    this.abortController = new AbortController();
  }

  async processFile(
    file: File,
    onProgress: (progress: number) => void,
    signal: AbortSignal
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Handle abort signal
      signal.addEventListener('abort', () => {
        this.terminate();
        reject(new Error('Processing aborted'));
      });

      // Handle worker messages
      this.worker.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case 'progress':
            onProgress(data);
            break;
          case 'complete':
            resolve(data);
            break;
          case 'error':
            reject(new Error(data));
            break;
        }
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        reject(new Error('Worker error: ' + error.message));
      };

      // Process file based on type
      this.processFileByType(file).catch(reject);
    });
  }

  private async processFileByType(file: File): Promise<void> {
    switch (file.type) {
      case 'text/plain':
        await this.processTxtFile(file);
        break;
      case 'application/pdf':
        await this.processPdfFile(file);
        break;
      case 'application/epub+zip':
        await this.processEpubFile(file);
        break;
      default:
        throw new Error('Unsupported file type');
    }
  }

  private async processTxtFile(file: File): Promise<void> {
    const chunks: ArrayBuffer[] = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await chunk.arrayBuffer();
      chunks.push(buffer);
      offset += CHUNK_SIZE;
    }

    this.worker.postMessage({
      type: 'txt',
      chunks
    }, chunks);
  }

  private async processPdfFile(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    this.worker.postMessage({
      type: 'pdf',
      buffer
    }, [buffer]);
  }

  private async processEpubFile(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    this.worker.postMessage({
      type: 'epub',
      buffer
    }, [buffer]);
  }

  terminate(): void {
    this.worker.terminate();
    this.abortController.abort();
  }
}
