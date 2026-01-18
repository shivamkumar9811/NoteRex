// OpenAI Client Configuration for Whisper API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 120 seconds for long audio transcriptions
});


export default openai;