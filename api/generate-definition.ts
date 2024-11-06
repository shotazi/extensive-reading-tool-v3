import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBd562lnDOg-xQAWwQwS3AGWQidAQY_Xe0';
const genAI = new GoogleGenerativeAI(API_KEY);

function extractHTML(geminiResponse: string) {
  const match = geminiResponse.match(/```html(.*?)```/s);
  if (match) {
    return match[1].trim();
  }
  return geminiResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
}