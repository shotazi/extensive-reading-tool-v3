import React, { useState, useEffect, useMemo } from 'react';
import { WordData } from '../types';
import { cn } from '../utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { frequencyColor } from '../utils/textAnalysis';

interface TextEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  wordData: Map<string, WordData>;
  selectedGroups: Set<string>;
  onWordClick: (word: string) => void;
}

const WORDS_PER_PAGE = 700;

export function TextEditor({
  text,
  wordData,
  selectedGroups,
  onWordClick,
}: TextEditorProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Split text into pages
  const pages = useMemo(() => {
    if (!text) return [];
    const words = text.split(/(\s+)/);
    const pages = [];
    for (let i = 0; i < words.length; i += WORDS_PER_PAGE) {
      pages.push(words.slice(i, i + WORDS_PER_PAGE));
    }
    return pages;
  }, [text]);

  // Reset to first page when text changes
  useEffect(() => {
    setCurrentPage(1);
  }, [text]);

  const renderHighlightedText = (words: string[]) => {
    if (!words.length) return null;

    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const data = wordData.get(cleanWord);

      if (data && selectedGroups.has(data.groupId)) {
        return (
          <span
            key={index}
            className={cn(
              'cursor-pointer transition-colors duration-200',
              'hover:ring-2 hover:ring-blue-300 rounded'
            )}
            style={{ backgroundColor: `${frequencyColor[data.groupId]}` }}
            onClick={() => onWordClick(cleanWord)}
          >
            {word}
          </span>
        );
      }
      return <span key={index}>{word}</span>;
    });
  };

  const totalPages = pages.length;
  const currentPageWords = pages[currentPage - 1] || [];

  return (
    <div className="h-[calc(90vh-8rem)] flex flex-col gap-4">
      <div className="flex-1 p-4 bg-white rounded-lg shadow-sm overflow-y-auto">
        <div className="prose prose-base max-w-none">
          {renderHighlightedText(currentPageWords)}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-lg">
          <button
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
