export interface WordGroup {
  id: string;
  name: string;
  color: string;
  words: Set<string>;
  isSelected: boolean;
}

export interface WordData {
  word: string;
  groupId: string;
  examples: string[];
}

export interface Flashcard {
  word: string;
  examples: string[];
}