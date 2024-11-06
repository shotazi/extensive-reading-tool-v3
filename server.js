import express from 'express';
import cors from 'cors';
import { createServer } from 'vite';
import { YoutubeTranscript } from 'youtube-transcript';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'AIzaSyBd562lnDOg-xQAWwQwS3AGWQidAQY_Xe0';
const genAI = new GoogleGenerativeAI(API_KEY);

// Endpoint to fetch YouTube transcript
app.get('/api/transcript/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });

    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ')
      .replace(/\[.*?\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcript) {
      return res.status(404).json({ error: 'No transcript content found' });
    }

    res.json({ transcript });
  } catch (error) {
    console.error('Transcript error:', error);
    if (error.message?.includes('Could not get transcripts')) {
      return res.status(404).json({
        error: 'No transcript available for this video. The video might be private, unavailable, or transcripts are disabled.'
      });
    }
    res.status(500).json({ error: 'Failed to fetch transcript. Please check the URL and try again.' });
  }
});

// New endpoint for generating definitions
app.post('/api/generate-definition', async (req, res) => {
  try {
    const { word, context, examples } = req.body;

    if (!word || !context) {
      return res.status(400).json({ error: 'Word and context are required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });

    const prompt = `
      Word: "${word}"
      Context: "${context}"
      Real examples from text: ${examples[0]}

      Please provide a comprehensive flashcard definition in Georgian language with the following structure:

      <div class="flashcard-content">
        <div class="word">
          <h2>${word} <span>[IPA transcription]</span></h2>
        </div>
        
        <div class="definition">
          <h3>განმარტება:</h3>
          <p>[Georgian definition]</p>
        </div>
        
        <div class="context">
          <h3>კონტექსტი:</h3>
          <p>[How the word is used in the given context]</p>
        </div>
      </div>
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const html = extractHTML(text);

    res.json({ definition: html });
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate definition' });
  }
});

function extractHTML(geminiResponse) {
  const match = geminiResponse.match(/```html(.*?)```/s);
  if (match) {
    return match[1].trim();
  }
  return geminiResponse;
}

// Create Vite server
const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'spa',
});

// Use Vite's middleware
app.use(vite.middlewares);

const port = 5173;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});