import axios from 'axios';

export async function getTranscript(videoId: string): Promise<string> {
  try {
    const response = await axios.get(`/api/transcript/${videoId}`);


    return response.data.transcript;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.error || 'Failed to fetch transcript';
      throw new Error(message);
    }
    throw error;
  }
}
