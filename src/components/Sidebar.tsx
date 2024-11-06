import React, { useEffect, useState } from 'react';
import { WordGroup } from '../types';
import {
  BookOpen,
  Brain,
  Loader2,
  Trash2,
  Plus,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  getDeckHistory,
  createDeck,
  generateDefinition,
  saveFlashcard,
  deleteDeck,
} from '../utils/supabaseClient';
import { FlashcardViewer } from './FlashcardViewer';
import { CreateDeckModal } from './CreateDeckModal';
import { findExamplesInText } from '../utils/textAnalysis';
import { cn } from '../utils/cn';
import { GenerationProgress } from './GenerationProgress';

interface SidebarProps {
  wordGroups: WordGroup[];
  onGroupToggle: (groupId: string) => void;
  onCreateFlashcards: (groupId: string) => void;
  onWordClick: (word: string) => void;
  text: string;
}

interface Deck {
  id: string;
  name: string;
  created_at: string;
  card_count: number;
}

interface GenerationStatus {
  word: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export function Sidebar({
  wordGroups,
  onGroupToggle,
  onCreateFlashcards,
  onWordClick,
  text,
}: SidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'groups' | 'flashcards'>(
    'groups'
  );
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationStatus[]>([]);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    const deckHistory = await getDeckHistory();
    setDecks(deckHistory);
  };

  const handleCreateFlashcardsClick = () => {
    const defaultName = generateDefaultDeckName();
    setShowCreateModal(true);
    return defaultName;
  };

  const generateDefaultDeckName = () => {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const wordCount = Array.from(selectedWords).length;
    return `Deck ${date} (${wordCount} words)`;
  };

  const handleWordSelect = (word: string) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(word)) {
      newSelected.delete(word);
    } else {
      newSelected.add(word);
    }
    setSelectedWords(newSelected);
  };

  const handleGroupSelect = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    const group = wordGroups.find((g) => g.id === groupId);
    let newWords = new Set(selectedWords);

    if (!group) return;

    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
      group.words.forEach((word) => {
        newWords.delete(word);
      });
    } else {
      newSelected.add(groupId);
      group.words.forEach((word) => {
        newWords.add(word);
      });
    }

    setSelectedWords(newWords);
    setSelectedGroups(newSelected);
  };

  const handleGroupCollapse = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const handleSelectAll = () => {
    const allGroups = new Set(wordGroups.map((g) => g.id));
    const allWords = new Set(wordGroups.flatMap((g) => Array.from(g.words)));

    if (selectedGroups.size === wordGroups.length) {
      setSelectedGroups(new Set());
      setSelectedWords(new Set());
      wordGroups.forEach((group) => {
        if (group.isSelected) {
          onGroupToggle(group.id);
        }
      });
    } else {
      setSelectedGroups(allGroups);
      setSelectedWords(allWords);
      wordGroups.forEach((group) => {
        if (!group.isSelected) {
          onGroupToggle(group.id);
        }
      });
    }
  };

  const handleCreateDeck = async (deckName: string) => {
    setShowCreateModal(false);
    setIsCreatingDeck(true);
    setActiveTab('flashcards');

    const selectedWordsArray = Array.from(selectedWords);
    setGenerationProgress(
      selectedWordsArray.map(word => ({
        word,
        status: 'pending'
      }))
    );

    const deckId = await createDeck(deckName);
    if (!deckId) {
      setIsCreatingDeck(false);
      return;
    }

    for (let i = 0; i < selectedWordsArray.length; i++) {
      const word = selectedWordsArray[i];
      setGenerationProgress(prev => 
        prev.map(item => 
          item.word === word 
            ? { ...item, status: 'processing' }
            : item
        )
      );

      try {
        const examples = findExamplesInText(word, text);
        const context = text.slice(0, 300);
        const definition = await generateDefinition(word, context, examples);
        await saveFlashcard(deckId, word, definition, examples);
        
        setGenerationProgress(prev => 
          prev.map(item => 
            item.word === word 
              ? { ...item, status: 'completed' }
              : item
          )
        );
      } catch (error) {
        setGenerationProgress(prev => 
          prev.map(item => 
            item.word === word 
              ? { ...item, status: 'error', error: error.message }
              : item
          )
        );
      }
    }

    await loadDecks();
    setIsCreatingDeck(false);
    setSelectedWords(new Set());
    setSelectedGroups(new Set());
    setGenerationProgress([]);
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this deck? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(deckId);
    await deleteDeck(deckId);
    await loadDecks();
    setIsDeleting(null);

    if (selectedDeck === deckId) {
      setSelectedDeck(null);
    }
  };

  return (
    <div className="sticky top-4 h-[calc(100vh-8rem)] overflow-y-scroll flex flex-col bg-white rounded-lg shadow-sm">
      <div className="flex border-b">
        <button
          className={`flex-1 p-4 flex items-center justify-center gap-2 ${
            activeTab === 'groups' ? 'border-b-2 border-blue-500' : ''
          }`}
          onClick={() => setActiveTab('groups')}
        >
          <BookOpen className="w-4 h-4" />
          Word Groups
        </button>
        <button
          className={`flex-1 p-4 flex items-center justify-center gap-2 ${
            activeTab === 'flashcards' ? 'border-b-2 border-blue-500' : ''
          }`}
          onClick={() => setActiveTab('flashcards')}
        >
          <Brain className="w-4 h-4" />
          Flashcards
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'groups' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedGroups.size === wordGroups.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
              <button
                onClick={handleCreateFlashcardsClick}
                disabled={selectedWords.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Create Flashcards ({selectedWords.size})
              </button>
            </div>

            {wordGroups.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGroupSelect(group.id)}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        selectedGroups.has(group.id)
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <h3 className="font-medium">{group.name}</h3>
                    <span className="text-sm text-gray-500">
                      ({group.words.size} words)
                    </span>
                    <button
                      onClick={() => handleGroupCollapse(group.id)}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      {collapsedGroups.has(group.id) ? (
                        <ChevronRight className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={group.isSelected}
                        onChange={() => onGroupToggle(group.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                {!collapsedGroups.has(group.id) && (
                  <div className="flex flex-wrap gap-2">
                    {Array.from(group.words).map((word) => (
                      <button
                        key={word}
                        onClick={() => handleWordSelect(word)}
                        className={cn(
                          'px-2 py-1 text-sm rounded transition-all duration-200',
                          'hover:ring-2 hover:ring-blue-300',
                          selectedWords.has(word) && 'ring-2 ring-blue-500'
                        )}
                        style={{ backgroundColor: `${group.color}` }}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {isCreatingDeck && generationProgress.length > 0 && (
              <GenerationProgress progress={generationProgress} />
            )}
            {!isCreatingDeck && decks.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                No flashcard decks yet. Create one from a word group!
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  {decks.map((deck) => (
                    <div
                      key={deck.id}
                      className="p-4 rounded-lg border hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedDeck(deck.id)}
                          className="flex-1 text-left"
                        >
                          <h3 className="font-medium">{deck.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500">
                              Created:{' '}
                              {new Date(deck.created_at).toLocaleDateString()}
                            </p>
                            <span className="text-sm text-blue-600 font-medium">
                              {deck.card_count} cards
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors duration-200"
                          disabled={isDeleting === deck.id}
                        >
                          {isDeleting === deck.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedDeck && (
                  <FlashcardViewer
                    deckId={selectedDeck}
                    onClose={() => setSelectedDeck(null)}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDeckModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDeck}
          defaultName={generateDefaultDeckName()}
        />
      )}
    </div>
  );
}