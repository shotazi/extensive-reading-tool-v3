import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CreateDeckModalProps {
  onClose: () => void;
  onSubmit: (name: string) => void;
  defaultName: string;
}

export function CreateDeckModal({ onClose, onSubmit, defaultName }: CreateDeckModalProps) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Create New Flashcard Deck</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
              Deck Name
            </label>
            <input
              type="text"
              id="deckName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter deck name..."
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Deck
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}