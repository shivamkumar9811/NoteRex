// Gemini AI Configuration via Emergent Gateway
import OpenAI from 'openai';

// Use OpenAI SDK configured for Emergent gateway
// This allows us to use Gemini models through the Emergent universal key
const geminiClient = new OpenAI({
  apiKey: process.env.EMERGENT_LLM_KEY,
  baseURL: 'https://api.emergent.sh/v1',
});

export default geminiClient;