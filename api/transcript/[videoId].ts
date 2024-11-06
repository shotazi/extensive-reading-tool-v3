import { VercelRequest, VercelResponse } from '@vercel/node';
import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoId } = req.query;

    if (typeof videoId !== 'string') {
      return res.status(400).json({ error: 'Video ID must be a string' });
    }

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
}