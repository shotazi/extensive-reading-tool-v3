import React, { useState } from 'react';
import { YoutubeIcon, Loader2, AlertCircle } from 'lucide-react';
import { getTranscript } from '../utils/youtubeTranscript';
import { cn } from '../utils/cn';

interface YoutubeImportProps {
  onTranscriptImport: (transcript: string) => void;
}

export function YoutubeImport({ onTranscriptImport }: YoutubeImportProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const videoId = extractVideoId(url);
    if (!videoId) {
      setError('Invalid YouTube URL. Please check the URL and try again.');
      setIsLoading(false);
      return;
    }

    try {
      const transcript = await getTranscript(videoId);
      onTranscriptImport(transcript);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transcript');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-600">
        <YoutubeIcon className="w-5 h-5 text-red-600" />
        <h3 className="font-medium">Import from YouTube</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className={cn(
                "w-full px-4 py-2 pr-12 border rounded-lg",
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "placeholder-gray-400",
                error && "border-red-500 focus:ring-red-500"
              )}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!url.trim() || isLoading}
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2",
                "px-3 py-1 rounded-md text-sm font-medium",
                "transition-colors duration-200",
                url.trim() && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Import'
              )}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}