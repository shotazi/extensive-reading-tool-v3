import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = 'https://siadmiaedvscibnfxrmm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYWRtaWFlZHZzY2libmZ4cm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgzMjk1OTEsImV4cCI6MjA0MzkwNTU5MX0.7zfz4FPXe01lnXaQaM4iNx7g_LcTTTqpPAu9hQShmuI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateDefinition(
  word: string,
  context: string,
  examples: string[]
): Promise<string> {
  try {
    const response = await axios.post('/api/generate-definition', {
      word,
      context,
      examples
    });
    return response.data.definition;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || 'Failed to generate definition');
    }
    throw error;
  }
}

export async function createDeck(name: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('decks')
    .insert({ name })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating deck:', error);
    return null;
  }

  return data.id;
}

export async function deleteDeck(deckId: string): Promise<void> {
  const { error: flashcardsError } = await supabase
    .from('flashcards')
    .delete()
    .eq('deck_id', deckId);

  if (flashcardsError) {
    console.error('Error deleting flashcards:', flashcardsError);
    return;
  }

  const { error: deckError } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);

  if (deckError) {
    console.error('Error deleting deck:', deckError);
  }
}

export async function saveFlashcard(
  deckId: string,
  front: string,
  back: string,
  examples: string[]
): Promise<void> {
  const { error } = await supabase.from('flashcards').insert({
    deck_id: deckId,
    front,
    back,
    examples: examples,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Error saving flashcard:', error);
  }
}

export async function getDeckHistory(): Promise<any[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching deck history:', error);
    return [];
  }

  return data;
}

export async function getFlashcardsForDeck(deckId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching flashcards:', error);
    return [];
  }

  return data;
}