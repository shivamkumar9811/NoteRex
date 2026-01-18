import { NextResponse } from 'next/server';
import openai from '@/lib/openai';
import pdf from 'pdf-parse';
import ytdl from 'ytdl-core';

const BAD_PDF_PATTERNS = [
  /don't have the capability to directly process or view PDF files/i,
  /I don't have the capability/i,
  /cannot directly.*PDF/i,
];

// Transcribe audio/video using Whisper with retry logic
const transcribeAudio = async (audioBuffer, filename) => {
  const maxRetries = 3;
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const file = new File([audioBuffer], filename, {
        type: filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav',
      });
      const t = await openai.audio.transcriptions.create({ file, model: 'whisper-1', language: 'en' });
      return t.text;
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries && (e.message?.includes('ECONNRESET') || e.message?.includes('Connection error'))) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }
      break;
    }
  }
  throw new Error(`Transcription failed: ${lastError?.message || 'Unknown'}`);
};

// Extract text from PDF; reject fallback/AI messages
const extractTextFromPDF = async (pdfBuffer) => {
  const data = await pdf(pdfBuffer);
  const text = (data.text || '').trim();
  if (!text) throw new Error('PDF text extraction returned empty content');
  for (const p of BAD_PDF_PATTERNS) {
    if (p.test(text)) throw new Error('PDF extraction failed - received fallback message instead of extracted text');
  }
  return text;
};

function extractYouTubeVideoId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/) || url.match(/youtube\.com\/watch\?.*v=([^&\n?#]+)/);
  return m?.[1] || null;
}

async function extractAudioFromYouTube(youtubeUrl) {
  if (!ytdl.validateURL(youtubeUrl)) throw new Error('Invalid YouTube URL');
  const info = await ytdl.getInfo(youtubeUrl);
  const audioStream = ytdl(youtubeUrl, { quality: 'highestaudio', filter: 'audioonly' });
  const chunks = [];
  for await (const c of audioStream) chunks.push(c);
  const audioBuffer = Buffer.concat(chunks);
  return { audioBuffer, title: info.videoDetails.title, videoId: extractYouTubeVideoId(youtubeUrl), youtubeUrl };
}

// Build summaryFormats and revisionQA from GPT response
function toSummaryFormatsAndQA(summaries) {
  const asArray = (v) => (Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/\n/).filter(Boolean) : []));
  const summaryFormats = {
    bulletNotes: asArray(summaries.bulletPoints),
    topicWise: asArray(summaries.topics),
    keyTakeaways: asArray(summaries.keyTakeaways),
  };
  let revisionQA = [];
  if (summaries.qa) {
    try {
      const q = typeof summaries.qa === 'string' ? JSON.parse(summaries.qa) : summaries.qa;
      revisionQA = Array.isArray(q) ? q.filter((i) => i && (i.question || i.q)) : [];
    } catch {
      revisionQA = [];
    }
  }
  return { summaryFormats, revisionQA };
}

const generateSummaries = async (text) => {
  const prompt = `Analyze the following text and provide 4 types of summaries. Return ONLY valid JSON (no markdown):
{
  "bulletPoints": "Bullet-point summary",
  "topics": "Topic-wise breakdown",
  "keyTakeaways": "Key insights",
  "qa": [{"question":"Q1","answer":"A1"}]
}

Text:
${text}`;

  const res = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a study assistant. Respond with valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  let raw = res.choices[0]?.message?.content || '{}';
  raw = raw.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
  let summaries;
  try {
    summaries = JSON.parse(raw);
  } catch {
    summaries = { bulletPoints: raw, topics: raw, keyTakeaways: raw, qa: [] };
  }
  if (!summaries.bulletPoints) summaries.bulletPoints = '';
  if (!summaries.topics) summaries.topics = '';
  if (!summaries.keyTakeaways) summaries.keyTakeaways = '';
  if (!summaries.qa) summaries.qa = [];
  return summaries;
};

// POST: only /api/process
export async function POST(request) {
  const pathname = new URL(request.url).pathname;
  if (pathname !== '/api/process') {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const { youtubeUrl, text, sourceType } = await request.json();

      if (youtubeUrl) {
        const { audioBuffer, title, videoId, youtubeUrl: url } = await extractAudioFromYouTube(youtubeUrl);
        const transcript = await transcribeAudio(audioBuffer, 'youtube-audio.mp3');
        const summaries = await generateSummaries(transcript);
        const { summaryFormats, revisionQA } = toSummaryFormatsAndQA(summaries);
        return NextResponse.json({
          success: true,
          data: { title, sourceType: 'youtube', youtubeUrl: url, videoId, transcript, summaries, summaryFormats, revisionQA },
        });
      }

      if (text && sourceType === 'text') {
        const summaries = await generateSummaries(text);
        const { summaryFormats, revisionQA } = toSummaryFormatsAndQA(summaries);
        return NextResponse.json({
          success: true,
          data: { title: text.substring(0, 50) + '...', sourceType: 'text', transcript: text, summaries, summaryFormats, revisionQA },
        });
      }
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const sourceType = formData.get('sourceType') || 'text';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      let transcript = '';
      const title = file.name || 'file';

      if (sourceType === 'audio' || sourceType === 'video') {
        transcript = await transcribeAudio(buffer, file.name);
      } else if (sourceType === 'pdf') {
        transcript = await extractTextFromPDF(buffer);
      } else {
        transcript = buffer.toString('utf-8');
      }

      const summaries = await generateSummaries(transcript);
      const { summaryFormats, revisionQA } = toSummaryFormatsAndQA(summaries);
      return NextResponse.json({
        success: true,
        data: { title, sourceType, transcript, summaries, summaryFormats, revisionQA },
      });
    }

    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
  } catch (err) {
    console.error('API /api/process Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

// GET/DELETE: not used; notes are in /api/notes-mongodb
export async function GET() {
  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}
