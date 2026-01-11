// Gemini AI Configuration
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EMERGENT_LLM_KEY);

export default genAI;