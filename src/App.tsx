import React, { useState } from 'react';
import { TextEditor } from './components/TextEditor';
import { Sidebar } from './components/Sidebar';
import { WordModal } from './components/WordModal';
import { FileUpload } from './components/FileUpload';
import { YoutubeImport } from './components/YoutubeImport';
import { analyzeText } from './utils/textAnalysis';
import { WordGroup, WordData } from './types';
import { Plus } from 'lucide-react';

export default function App() {
  const [text, setText] = useState('');
  const [wordGroups, setWordGroups] = useState<WordGroup[]>([]);
  const [wordData, setWordData] = useState<Map<string, WordData>>(new Map());
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(true);

  const handleTextChange = (newText: string) => {
    setText(newText);
    const { wordGroups: newGroups, wordData: newData } = analyzeText(newText);
    setWordGroups(newGroups);
    setWordData(newData);
    setShowFileUpload(false);
  };

  const handleGroupToggle = (groupId: string) => {
    setWordGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? { ...group, isSelected: !group.isSelected }
          : group
      )
    );
  };

  const handleCreateFlashcards = (groupId: string) => {
    const group = wordGroups.find((g) => g.id === groupId);
    if (!group) return;
    console.log('Creating flashcards for words:', Array.from(group.words));
  };

  const selectedGroups = new Set(
    wordGroups.filter((group) => group.isSelected).map((group) => group.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Text Analysis Tool
          </h1>
          <p className="text-gray-600">
            Analyze vocabulary and create flashcards
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {showFileUpload ? (
              <div className="space-y-8">
                <FileUpload onFileContent={handleTextChange} />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-gray-50 px-3 text-sm text-gray-500">or</span>
                  </div>
                </div>
                <YoutubeImport onTranscriptImport={handleTextChange} />
                <textarea
                  className="w-full h-64 p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Paste your text here..."
                />
              </div>
            ) : (
              <button
                onClick={() => setShowFileUpload(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Add New Text
              </button>
            )}
            {(!showFileUpload || text) && (
              <TextEditor
                text={text}
                onTextChange={handleTextChange}
                wordData={wordData}
                selectedGroups={selectedGroups}
                onWordClick={setSelectedWord}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <Sidebar
              wordGroups={wordGroups}
              onGroupToggle={handleGroupToggle}
              onCreateFlashcards={handleCreateFlashcards}
              onWordClick={setSelectedWord}
              text={text}
            />
          </div>
        </div>
      </div>

      {selectedWord && wordData.get(selectedWord) && (
        <WordModal
          word={selectedWord}
          data={wordData.get(selectedWord)!}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </div>
  );
}
