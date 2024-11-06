import React from 'react';
import { X } from 'lucide-react';
import { WordData } from '../types';

interface WordModalProps {
  word: string;
  data: WordData;
  onClose: () => void;
}

export function WordModal({ word, data, onClose }: WordModalProps) {
  return (
    <div className="fixed  inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{word}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 max-h-96 overflow-y-scroll">
          <h3 className="font-medium mb-2">Example Sentences:</h3>
          <div className="space-y-2">
            {data.examples.map((example, index) => (
              <p key={index} className="text-gray-700 border-b">
                {example.split(word).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <strong>{word}</strong>}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
