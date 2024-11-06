import { FileProcessor } from './FileProcessor';

export const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

export async function processFile(
  file: File,
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<string> {
  const processor = new FileProcessor();

  try {
    return await processor.processFile(file, onProgress, signal);
  } finally {
    processor.terminate();
  }
}
