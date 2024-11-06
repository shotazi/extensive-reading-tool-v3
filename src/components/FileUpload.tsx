import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Book, File, X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { processFile } from '../utils/fileProcessing';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_TYPES = ['text/plain', 'application/pdf', 'application/epub+zip'];

interface FileUploadProps {
  onFileContent: (content: string) => void;
}

export function FileUpload({ onFileContent }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortController = useRef<AbortController | null>(null);

  const resetState = () => {
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    abortController.current = null;
  };

  const validateFile = (file: File): string | null => {
    if (!VALID_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a TXT, PDF, or EPUB file.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum size is 50MB.';
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);
    abortController.current = new AbortController();

    try {
      const content = await processFile(file, (progress) => {
        setProgress(Math.round(progress * 100));
      }, abortController.current.signal);
      
      onFileContent(content);
      resetState();
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Upload cancelled');
      } else {
        setError('Error processing file. Please try again.');
        console.error('File processing error:', err);
      }
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, []);

  const cancelUpload = () => {
    if (abortController.current) {
      abortController.current.abort();
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8",
          "transition-colors duration-200",
          "flex flex-col items-center justify-center gap-4",
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300",
          isProcessing ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          className="hidden"
          accept=".txt,.pdf,.epub"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
        <Upload className="w-12 h-12 text-gray-400" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700">
            Drop your file here or click to upload
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Maximum file size: 50MB
          </p>
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="w-4 h-4" /> TXT
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <File className="w-4 h-4" /> PDF
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Book className="w-4 h-4" /> EPUB
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Processing file...</span>
            </div>
            <button
              onClick={cancelUpload}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {progress}% complete
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded-full transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}