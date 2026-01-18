// OpenAI Client Configuration for Whisper API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-build-placeholder',
  timeout: 120000,
});


export default openai;