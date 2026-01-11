// OpenAI Client Configuration for Whisper via Emergent Gateway
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://api.emergent.sh/v1',
});

export default openai;