import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import openai from '@/lib/openai';
import geminiClient from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import Busboy from 'busboy';
import pdf from 'pdf-parse';
import ytdl from 'ytdl-core';
import { Readable } from 'stream';

// Helper function to parse multipart form data
const parseFormData = async (request) => {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: Object.fromEntries(request.headers) });
    const fields = {};
    const files = [];

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, encoding, mimeType } = info;
      const chunks = [];

      file.on('data', (chunk) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        files.push({
          fieldname,
          filename,
          mimeType,
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', reject);

    request.body.pipe(busboy);
  });
};

// Transcribe audio/video using Whisper
const transcribeAudio = async (audioBuffer, filename) => {
  try {
    // Create a File-like object from buffer
    const file = new File([audioBuffer], filename, { 
      type: filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav' 
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
};

// Extract text from PDF
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
};

// Extract audio from YouTube video
const extractAudioFromYouTube = async (youtubeUrl) => {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    // Get video info
    const info = await ytdl.getInfo(youtubeUrl);
    const title = info.videoDetails.title;

    // Download audio in-memory
    const audioStream = ytdl(youtubeUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
    });

    // Convert stream to buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return { audioBuffer, title };
  } catch (error) {
    console.error('YouTube extraction error:', error);
    throw new Error(`YouTube audio extraction failed: ${error.message}`);
  }
};

// Generate AI summaries using Gemini via Emergent Gateway
const generateSummaries = async (text) => {
  try {
    // Use OpenAI chat completions format with Gemini model through Emergent gateway
    const completion = await geminiClient.chat.completions.create({
      model: 'gemini-2.0-flash-exp',
      messages: [
        {
          role: 'system',
          content: 'You are an expert note-taking assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: `Analyze the following text and provide 4 different types of summaries.

Provide ONLY a valid JSON response (no markdown, no code blocks) in this exact format:
{
  "bulletPoints": "string with bullet points",
  "topics": "string with topic-wise organization",
  "keyTakeaways": "string with key insights",
  "qa": "string with Q&A pairs"
}

Text to analyze:
${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const summaryText = completion.choices[0].message.content;

    // Parse JSON response
    let summaries;
    try {
      summaries = JSON.parse(summaryText);
      
      // Validate that all required fields are present
      if (!summaries.bulletPoints || !summaries.topics || !summaries.keyTakeaways || !summaries.qa) {
        throw new Error('Missing required fields in summary');
      }
    } catch (parseError) {
      console.error('Failed to parse summary JSON:', parseError);
      // Fallback: create structured format from text
      summaries = {
        bulletPoints: summaryText,
        topics: summaryText,
        keyTakeaways: summaryText,
        qa: summaryText,
      };
    }

    return summaries;
  } catch (error) {
    console.error('Gemini summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
};

// API Routes Handler
export async function POST(request) {
  const pathname = new URL(request.url).pathname;

  try {
    // POST /api/process - Process file and generate summaries
    if (pathname === '/api/process') {
      const contentType = request.headers.get('content-type');

      // Handle YouTube URL and text input
      if (contentType?.includes('application/json')) {
        const { youtubeUrl, text, sourceType } = await request.json();

        if (youtubeUrl) {
          // Process YouTube video
          const { audioBuffer, title } = await extractAudioFromYouTube(youtubeUrl);
          
          // Transcribe audio using Whisper
          const transcript = await transcribeAudio(audioBuffer, 'youtube-audio.mp3');
          
          // Generate summaries
          const summaries = await generateSummaries(transcript);

          return NextResponse.json({
            success: true,
            data: {
              title,
              sourceType: 'youtube',
              transcript,
              summaries,
            },
          });
        }

        // Handle direct text input
        if (text && sourceType === 'text') {
          const summaries = await generateSummaries(text);
          const title = text.substring(0, 50) + '...';

          return NextResponse.json({
            success: true,
            data: {
              title,
              sourceType: 'text',
              transcript: text,
              summaries,
            },
          });
        }
      }

      // Handle file upload
      if (contentType?.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file');
        const sourceType = formData.get('sourceType');

        if (!file) {
          return NextResponse.json(
            { error: 'No file provided' },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let transcript = '';
        let title = file.name;

        // Process based on file type
        if (sourceType === 'audio' || sourceType === 'video') {
          transcript = await transcribeAudio(buffer, file.name);
        } else if (sourceType === 'pdf') {
          transcript = await extractTextFromPDF(buffer);
        } else if (sourceType === 'text') {
          transcript = buffer.toString('utf-8');
        }

        // Generate summaries
        const summaries = await generateSummaries(transcript);

        return NextResponse.json({
          success: true,
          data: {
            title,
            sourceType,
            transcript,
            summaries,
          },
        });
      }

      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // POST /api/notes - Save note to Firestore
    if (pathname === '/api/notes') {
      const { title, sourceType, transcript, summaries } = await request.json();

      const noteData = {
        id: uuidv4(),
        title,
        sourceType,
        transcript,
        summaries,
        searchableText: `${title} ${transcript}`.toLowerCase(),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, 'notes'), noteData);

      return NextResponse.json({
        success: true,
        data: { ...noteData, firestoreId: docRef.id },
      });
    }

    return NextResponse.json(
      { error: 'Route not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/notes - Fetch all notes or search
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const searchQuery = searchParams.get('search');

  try {
    const notesRef = collection(db, 'notes');
    let q;

    if (searchQuery) {
      // Simple search implementation
      q = query(notesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const notes = snapshot.docs
        .map(doc => ({ firestoreId: doc.id, ...doc.data() }))
        .filter(note => 
          note.searchableText?.includes(searchQuery.toLowerCase())
        );
      
      return NextResponse.json({ success: true, data: notes });
    }

    q = query(notesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const notes = snapshot.docs.map(doc => ({
      firestoreId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, data: notes });
  } catch (error) {
    console.error('Fetch notes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/:id
export async function DELETE(request) {
  const pathname = new URL(request.url).pathname;
  const firestoreId = pathname.split('/').pop();

  try {
    await deleteDoc(doc(db, 'notes', firestoreId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete note' },
      { status: 500 }
    );
  }
}