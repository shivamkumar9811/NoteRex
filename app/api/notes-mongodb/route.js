import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'noteforge';
const COLLECTION_NAME = 'notes';

// POST /api/notes-mongodb - Save note to MongoDB
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, sourceType, transcript, summaries, summaryFormats, userId } = body;
    // STRICT: revisionQA is NEVER accepted or saved

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
      // STRICT: revisionQA/qa is NEVER migrated or saved
    }

    const noteData = {
      id: uuidv4(),
      title: title || `Note ${new Date().toLocaleDateString()}`,
      sourceType: sourceType || 'text',
      transcript: transcript || '',
      summaryFormats: finalSummaryFormats,
      // STRICT: revisionQA is NEVER saved to database
      // Keep old summaries for backward compatibility
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

    // Convert MongoDB documents to JSON-friendly format
    const formattedNotes = notes.map((note) => ({
      id: note.id,
      _id: note._id.toString(),
      title: note.title,
      sourceType: note.sourceType,
      transcript: note.transcript,
      // New format (preferred)
      summaryFormats: note.summaryFormats || {
        bulletNotes: [],
        topicWise: [],
        keyTakeaways: [],
      },
      // STRICT: revisionQA is NEVER returned from database
      // Old format (for backward compatibility)
      summaries: note.summaries || {},
      userId: note.userId,
      createdAt: note.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: note.updatedAt?.toISOString() || new Date().toISOString(),
      // For compatibility with existing frontend
      firestoreId: note._id.toString(),
    }));

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

