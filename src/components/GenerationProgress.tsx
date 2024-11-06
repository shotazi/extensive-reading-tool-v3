import React from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface GenerationStatus {
  word: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface GenerationProgressProps {
  progress: GenerationStatus[];
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  const completed = progress.filter(p => p.status === 'completed').length;
  const total = progress.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Generating Flashcards</h3>
        <span className="text-sm text-gray-500">
          {completed} of {total} completed
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {progress.map(({ word, status, error }) => (
          <div
            key={word}
            className={cn(
              "flex items-center justify-between p-2 rounded",
              status === 'processing' && "bg-blue-50",
              status === 'completed' && "bg-green-50",
              status === 'error' && "bg-red-50"
            )}
          >
            <div className="flex items-center gap-2">
              {status === 'pending' && (
                <div className="w-4 h-4 rounded-full bg-gray-200" />
              )}
              {status === 'processing' && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              {status === 'completed' && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm",
                status === 'processing' && "text-blue-700",
                status === 'completed' && "text-green-700",
                status === 'error' && "text-red-700"
              )}>
                {word}
              </span>
            </div>
            {error && (
              <span className="text-xs text-red-600">{error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}