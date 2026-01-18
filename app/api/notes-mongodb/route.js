import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'NoteRex';
const COLLECTION_NAME = 'notes';

// Never surface these in API responses
const BAD_PATTERNS = [
  /I can't process PDFs/i,
  /don't have the capability to directly process or view PDF files/i,
  /I don't have the capability/i,
  /cannot directly.*PDF/i,
  /The provided link is a YouTube video/i,
  /Please specify what information you need/i,
];

function sanitizeText(t) {
  if (typeof t !== 'string') return t || '';
  for (const p of BAD_PATTERNS) if (p.test(t)) return '';
  return t;
}

function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((s) => {
    const v = typeof s === 'string' ? s : String(s || '');
    for (const p of BAD_PATTERNS) if (p.test(v)) return false;
    return v.length > 0;
  });
}

// POST /api/notes-mongodb - Save note to MongoDB
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, sourceType, transcript, summaries, summaryFormats, revisionQA, userId } = body;

    if (!title && !transcript) {
      return NextResponse.json(
        { success: false, error: 'Title or transcript is required' },
        { status: 400 }
      );
    }

    const client = await connectMongo();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Support both new format (summaryFormats, revisionQA) and old format (summaries)
    // New format takes precedence
    let finalSummaryFormats = summaryFormats || {
      bulletNotes: [],
      topicWise: [],
      keyTakeaways: [],
    };
    
    // If old summaries format provided, migrate to new format
    if (summaries && !summaryFormats) {
      if (summaries.bulletPoints) {
        finalSummaryFormats.bulletNotes = Array.isArray(summaries.bulletPoints)
          ? summaries.bulletPoints
          : summaries.bulletPoints.split('\n').filter(Boolean);
      }
      if (summaries.topics) {
        finalSummaryFormats.topicWise = Array.isArray(summaries.topics)
          ? summaries.topics
          : summaries.topics.split('\n').filter(Boolean);
      }
      if (summaries.keyTakeaways) {
        finalSummaryFormats.keyTakeaways = Array.isArray(summaries.keyTakeaways)
          ? summaries.keyTakeaways
          : summaries.keyTakeaways.split('\n').filter(Boolean);
      }
    }

    let finalRevisionQA = Array.isArray(revisionQA) ? revisionQA.filter((i) => i && (i.question || i.q)) : [];
    if (finalRevisionQA.length === 0 && summaries?.qa) {
      try {
        const qa = typeof summaries.qa === 'string' ? JSON.parse(summaries.qa) : summaries.qa;
        finalRevisionQA = Array.isArray(qa) ? qa.filter((i) => i && (i.question || i.q)) : [];
      } catch {
        finalRevisionQA = [];
      }
    }

    const noteData = {
      id: uuidv4(),
      title: title || `Note ${new Date().toLocaleDateString()}`,
      sourceType: sourceType || 'text',
      transcript: transcript || '',
      summaryFormats: finalSummaryFormats,
      revisionQA: finalRevisionQA,
      summaries: summaries || {},
      userId: userId || 'anonymous',
      searchableText: `${title || ''} ${transcript || ''}`.toLowerCase(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(noteData);

    return NextResponse.json({
      success: true,
      data: {
        ...noteData,
        _id: result.insertedId,
        createdAt: noteData.createdAt.toISOString(),
        updatedAt: noteData.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('MongoDB save error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save note',
      },
      { status: 500 }
    );
  }
}

// GET /api/notes-mongodb - Fetch all notes or search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const userId = searchParams.get('userId');

    const client = await connectMongo();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Build query
    const query = {};
    if (userId && userId !== 'anonymous') {
      query.userId = userId;
    }

    let notes;
    if (searchQuery) {
      // Text search (simple contains search)
      notes = await collection
        .find({
          ...query,
          searchableText: { $regex: searchQuery.toLowerCase(), $options: 'i' },
        })
        .sort({ createdAt: -1 })
        .toArray();
    } else {
      notes = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .toArray();
    }

    const formattedNotes = notes.map((note) => {
      const sf = note.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] };
      return {
        id: note.id,
        _id: note._id.toString(),
        title: note.title,
        sourceType: note.sourceType,
        transcript: sanitizeText(note.transcript),
        summaryFormats: {
          bulletNotes: sanitizeArray(sf.bulletNotes),
          topicWise: sanitizeArray(sf.topicWise),
          keyTakeaways: sanitizeArray(sf.keyTakeaways),
        },
        revisionQA: Array.isArray(note.revisionQA) ? note.revisionQA.filter((i) => i && (i.question || i.q)) : [],
        summaries: note.summaries || {},
        userId: note.userId,
        createdAt: note.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: note.updatedAt?.toISOString() || new Date().toISOString(),
        firestoreId: note._id.toString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedNotes,
    });
  } catch (error) {
    console.error('MongoDB fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notes',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/notes-mongodb/:id - Delete a note
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('id');

    if (!noteId) {
      return NextResponse.json(
        { success: false, error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const client = await connectMongo();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Try to delete by _id (MongoDB ObjectId) or by custom id
    const { ObjectId } = await import('mongodb');
    let deleteResult;
    
    try {
      // Try as MongoDB ObjectId first
      deleteResult = await collection.deleteOne({ _id: new ObjectId(noteId) });
    } catch {
      // If that fails, try as custom id
      deleteResult = await collection.deleteOne({ id: noteId });
    }

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MongoDB delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete note',
      },
      { status: 500 }
    );
  }
}

