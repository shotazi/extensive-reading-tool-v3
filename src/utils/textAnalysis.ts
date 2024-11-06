import { WordFrequencyEn } from '../data/en';

export const frequencyGroups = [
  { id: 't1', name: 'Top 1000', color: '#FFFFFF' },
  { id: 't2', name: 'Top 2000', color: '#21c45d20' },
  { id: 't3', name: 'Top 3000', color: '#21c45d30' },
  { id: 't4', name: 'Top 4000', color: '#21c45d40' },
  { id: 't5', name: 'Top 5000', color: '#21c45d50' },
  { id: 't6', name: 'Top 6000', color: '#21c45d60' },
  { id: 't7', name: 'Top 7000', color: '#21c45d70' },
  { id: 't8', name: 'Top 8000', color: '#21c45d75' },
  { id: 't9', name: 'Top 9000', color: '#21c45d80' },
  { id: 't10', name: 'Top 10000', color: '#21c45d85' },
  { id: 't15', name: 'Top 15000', color: '#21c45d90' },
  { id: 't20', name: 'Top 20000', color: '#21c45d95' },
  { id: 't30', name: 'Top 30000', color: '#21c45d' },
  { id: 'rest', name: 'Rest', color: '#21c45d' },
];

export const frequencyColor = {
  t1: '#21c45d15',
  t2: '#21c45d20',
  t3: '#21c45d30',
  t4: '#21c45d40',
  t5: '#21c45d50',
  t6: '#21c45d60',
  t7: '#21c45d70',
  t8: '#21c45d75',
  t9: '#21c45d80',
  t10: '#21c45d85',
  t15: '#21c45d90',
  t20: '#21c45d95',
  t30: '#21c45d',
  rest: '#21c45d', // Or #bbf7d0 if you want "rest" to be different
};

// Mock word frequency data - in a real app, this would come from a proper word frequency database
// const mockWordFrequency = new Map([
//   ['the', 't1'],
//   ['be', 't1'],
//   ['to', 't1'],
//   ['of', 't1'],
//   ['also', 't1'],
//   ['two', 't1'],
//   ['comprehension', 't2'],
//   ['involved', 't2'],
//   ['analysis', 't2'],
//   ['data', 't2'],
//   ['system', 't2'],
//   ['research', 't3'],
//   ['test', 't3'],
//   ['example', 't3'],
//   ['methodology', 'rest'],
// ]);

export function findExamplesInText(word: string, text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const examples = sentences
    .filter((sentence) => new RegExp(`\\b${word}\\b`, 'i').test(sentence))
    .map((sentence) => sentence.trim());

  return examples;
}

export function analyzeText(text: string) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);

  console.log('text from analyze text', text);

  const wordGroups = frequencyGroups.map((group) => ({
    ...group,
    words: new Set<string>(),
    isSelected: true,
  }));

  const wordData = new Map();

  uniqueWords.forEach((word) => {
    const groupId = WordFrequencyEn.get(word) || 'rest';
    const group = wordGroups.find((g) => g.id === groupId);
    if (group) {
      group.words.add(word);
      const examples = findExamplesInText(word, text);
      wordData.set(word, {
        word,
        groupId,
        examples,
      });
    }
  });

  return {
    wordGroups,
    wordData,
  };
}
