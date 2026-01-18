import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import ytdl from 'ytdl-core';
import openai from '@/lib/openai';

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

/**
 * Extract audio from YouTube video and transcribe it
 * This is CRITICAL - YouTube URLs MUST be extracted and transcribed before sending to AI
 */
async function extractAndTranscribeYouTube(youtubeUrl) {
  try {
    // Validate YouTube URL
    if (!ytdl.validateURL(youtubeUrl)) {
      throw new Error('Invalid YouTube URL');
    }

    console.log(`Extracting audio from YouTube: ${youtubeUrl}`);
    
    // Get video info
    const info = await ytdl.getInfo(youtubeUrl);
    const title = info.videoDetails.title;
    const videoId = extractYouTubeVideoId(youtubeUrl);

    console.log(`Video title: ${title}, Video ID: ${videoId}`);

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

    console.log(`Audio extracted: ${audioBuffer.length} bytes, transcribing...`);

    // Transcribe audio using Whisper
    const file = new File([audioBuffer], 'youtube-audio.mp3', { type: 'audio/mpeg' });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    const transcript = transcription.text;
    console.log(`✅ YouTube transcription complete: ${transcript.length} characters`);

    return { transcript, title, videoId, youtubeUrl };
  } catch (error) {
    console.error('YouTube extraction/transcription error:', error);
    throw new Error(`YouTube processing failed: ${error.message}`);
  }
}

/**
 * Extract text from PDF base64 buffer
 * This is critical - PDFs must be extracted before sending to AI
 */
async function extractPDFText(base64Data) {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    const data = await pdf(buffer);
    const extractedText = data.text?.trim() || '';
    
    if (!extractedText || extractedText.length === 0) {
      throw new Error('PDF text extraction returned empty content');
    }
    
    // Check for Gemini fallback messages and reject them
    const fallbackPatterns = [
      /don't have the capability to directly process or view PDF files/i,
      /I don't have the capability/i,
      /cannot directly.*PDF/i,
    ];
    
    for (const pattern of fallbackPatterns) {
      if (pattern.test(extractedText)) {
        throw new Error('PDF extraction failed - received fallback message instead of extracted text');
      }
    }
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

/**
 * API Route: Call On-Demand AI Chat API
 * POST /api/agents
 * Body: { agentId: string, payload: object }
 * 
 * Note: On-Demand AI uses Chat API with sessions, not direct agent endpoints
 * Agent IDs are used as pluginIds in the chat query
 */
export async function POST(request) {
  try {
    const { agentId, payload } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Payload is required' },
        { status: 400 }
      );
    }

    // Get on-demand.io API key from environment
    const apiKey = process.env.ON_DEMAND_API_KEY || process.env.ONDEMAND_API_KEY;
    if (!apiKey) {
      console.error('ON_DEMAND_API_KEY or ONDEMAND_API_KEY not found in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error: API key missing' },
        { status: 500 }
      );
    }

    const apiUrl = process.env.ONDEMAND_API_URL || process.env.ON_DEMAND_API_URL || 'https://api.on-demand.io';

    // Step 1: Always create a new chat session via OnDemand API
    // OnDemand API requires session IDs created through their endpoint, not custom IDs
    let sessionId;
    
    try {
      const extractedUserId = payload.userId || payload.externalUserId || payload.user_id || `user_${Date.now()}`;
      const sessionRequestBody = { externalUserId: extractedUserId };

      console.log(`Creating new chat session via ${apiUrl}/chat/v1/sessions`);
      
      // Add timeout handling for session creation (30 seconds)
      const sessionController = new AbortController();
      const sessionTimeoutId = setTimeout(() => sessionController.abort(), 30000);
      
      let sessionResponse;
      try {
        sessionResponse = await fetch(`${apiUrl}/chat/v1/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey, // Use apikey header, NOT Authorization Bearer
          },
          body: JSON.stringify(sessionRequestBody), // Include externalUserId
          signal: sessionController.signal, // Add timeout signal
        });
        clearTimeout(sessionTimeoutId);
      } catch (fetchError) {
        clearTimeout(sessionTimeoutId);
        
        // Handle connection timeout specifically (10s default from undici)
        if (fetchError.code === 'UND_ERR_CONNECT_TIMEOUT' || 
            (fetchError.cause && fetchError.cause.code === 'UND_ERR_CONNECT_TIMEOUT')) {
          const timeoutError = new Error('Connection timeout: Unable to connect to OnDemand AI servers within 10 seconds. This usually indicates a network connectivity issue, firewall blocking, or DNS resolution problem.');
          timeoutError.code = 'UND_ERR_CONNECT_TIMEOUT';
          throw timeoutError;
        }
        
        if (fetchError.name === 'AbortError') {
          const abortError = new Error('Request timeout: OnDemand AI request exceeded 30 seconds. The server may be slow or unresponsive.');
          abortError.name = 'AbortError';
          throw abortError;
        }
        
        throw fetchError;
      }

      const sessionResponseStatus = sessionResponse.status;
      const sessionResponseText = await sessionResponse.text();
      let sessionResponseData;
      try { sessionResponseData = JSON.parse(sessionResponseText); } catch { sessionResponseData = { raw: sessionResponseText }; }

      if (!sessionResponse.ok) {
        let errorData = sessionResponseData;
        console.error('Session creation failed:', {
          status: sessionResponse.status,
          error: errorData,
        });
        
        throw new Error(
          errorData.message || `Failed to create session: HTTP ${sessionResponse.status}`
        );
      }

      const sessionData = sessionResponseData;
      
      // Extract sessionId from response (could be in data.sessionId or directly sessionId)
      sessionId = sessionData.data?.sessionId || 
                  sessionData.data?.id || 
                  sessionData.sessionId || 
                  sessionData.id;
      
      if (!sessionId) {
        console.error('Session creation response:', sessionData);
        throw new Error('Session ID not found in session creation response');
      }
      
      console.log(`✅ Created new chat session: ${sessionId}`);
    } catch (error) {
      console.error('Session creation error:', error);
      
      // Provide specific error messages based on error type
      let errorMessage = error.message || 'Failed to create chat session';
      let suggestion = 'Check your API key and network connectivity';
      
      if (error.code === 'UND_ERR_CONNECT_TIMEOUT') {
        errorMessage = 'Network connection timeout: Unable to reach OnDemand AI servers';
        suggestion = 'Check your internet connection, firewall settings, or try again later. The API server may be temporarily unavailable.';
      } else if (error.name === 'AbortError') {
        errorMessage = 'Request timeout: OnDemand AI request took too long';
        suggestion = 'The request exceeded the timeout limit. Try again or check if the API service is experiencing delays.';
      } else if (error.message?.includes('fetch failed')) {
        errorMessage = 'Network error: Could not connect to OnDemand AI';
        suggestion = 'Please verify your internet connection and that api.on-demand.io is accessible from your network.';
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          error_code: error.code || error.name || 'SESSION_CREATION_FAILED',
          details: {
            suggestion,
            originalError: process.env.NODE_ENV === 'development' ? error.message : undefined,
          }
        },
        { status: 500 }
      );
    }

    // Step 2a: Extract and transcribe YouTube if needed (CRITICAL - must extract before AI)
    // YouTube URLs MUST be extracted and transcribed BEFORE sending to agents
    // This ensures transcript is available for all subsequent agents (3, 4, 5, 6)
    if ((payload.inputType === 'youtube' || payload.inputType === 'video') && 
        (payload.youtubeUrl || payload.sourceUrl) && 
        !payload.transcript && !payload.textContent) {
      try {
        const youtubeUrl = payload.youtubeUrl || payload.sourceUrl;
        console.log(`Extracting and transcribing YouTube video: ${youtubeUrl}`);
        
        const { transcript, title, videoId } = await extractAndTranscribeYouTube(youtubeUrl);
        
        if (!transcript || transcript.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'YouTube transcription failed: No transcript content generated',
              error_code: 'YOUTUBE_TRANSCRIPTION_FAILED',
            },
            { status: 400 }
          );
        }
        
        // Update payload with extracted transcript and metadata
        // CRITICAL: This transcript will be passed to all subsequent agents
        payload.transcript = transcript;
        payload.textContent = transcript;
        payload.title = payload.title || title;
        payload.videoId = videoId;
        payload.youtubeUrl = youtubeUrl;
        
        console.log(`✅ YouTube transcript extracted: ${transcript.length} characters`);
      } catch (error) {
        console.error('YouTube extraction error in agent route:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'YouTube extraction/transcription failed',
            error_code: 'YOUTUBE_EXTRACTION_FAILED',
          },
          { status: 400 }
        );
      }
    }

    // Step 2b: Extract PDF text if needed (CRITICAL - must extract before AI)
    // PDF files MUST be extracted before sending to Gemini/AI
    if (payload.inputType === 'pdf' && payload.fileData && !payload.transcript && !payload.textContent) {
      try {
        console.log(`Extracting text from PDF: ${payload.fileName || 'file'}`);
        const extractedText = await extractPDFText(payload.fileData);
        
        if (!extractedText || extractedText.trim().length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'PDF extraction failed: No text content found in PDF',
              error_code: 'PDF_EXTRACTION_FAILED',
            },
            { status: 400 }
          );
        }
        
        // Update payload with extracted text
        payload.transcript = extractedText;
        payload.textContent = extractedText;
        
        console.log(`✅ PDF text extracted: ${extractedText.length} characters`);
      } catch (error) {
        console.error('PDF extraction error in agent route:', error);
        return NextResponse.json(
          {
            success: false,
            error: error.message || 'PDF extraction failed',
            error_code: 'PDF_EXTRACTION_FAILED',
          },
          { status: 400 }
        );
      }
    }

    // Step 3: Construct query from payload
    // On-Demand uses /chat/v1/sessions/:id/query (invoke/run equivalent)
    let query = '';
    
    // For Notes Generator (Agent 5) - use strict JSON prompt for structured output
    const NOTES_GENERATOR_ID = '696a7c31c7d6dfdf7e337d33';
    if (agentId === NOTES_GENERATOR_ID && (payload.transcript || payload.textContent)) {
      const content = payload.transcript || payload.textContent || '';
      query = `Generate structured study notes from the following content. Return ONLY valid JSON, no markdown or explanations.

{
  "summaryFormats": {
    "bulletNotes": ["bullet point 1", "bullet point 2"],
    "topicWise": ["topic 1", "topic 2"],
    "keyTakeaways": ["takeaway 1", "takeaway 2"]
  },
  "revisionQA": [
    { "question": "Question 1", "answer": "Answer 1" },
    { "question": "Question 2", "answer": "Answer 2" }
  ]
}

Content to analyze:
${content.substring(0, 8000)}`;
    } else if (payload.query) {
      query = payload.query;
    } else if (payload.textContent || payload.transcript) {
      query = payload.textContent || payload.transcript;
    } else if (payload.sourceUrl) {
      query = `Process this ${payload.inputType || 'content'}: ${payload.sourceUrl}`;
    } else if (payload.fileData && payload.inputType !== 'pdf') {
      // For non-PDF files, mention file processing
      query = `Process this ${payload.inputType || 'file'}: ${payload.fileName || 'file'}`;
    } else {
      // Fallback: convert payload to query string
      query = JSON.stringify(payload);
    }

    // Submit query to On-Demand Chat API (invoke/run: /chat/v1/sessions/:id/query)
    const queryUrl = `${apiUrl}/chat/v1/sessions/${sessionId}/query`;
    const queryRequestBody = {
      endpointId: 'predefined-openai-gpt4.1-nano',
      query,
      responseMode: 'sync',
    };
    
    console.log(`Submitting query to session ${sessionId}, agent ${agentId}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for AI processing

    let response;
    try {
      response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey, // Use apikey header, NOT Authorization Bearer
        },
        body: JSON.stringify(queryRequestBody),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError' || fetchError.code === 'UND_ERR_CONNECT_TIMEOUT') {
        console.error(`Connection timeout for agent ${agentId}`);
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout: The AI processing took too long. Please try again.',
            details: { agentId, sessionId },
          },
          { status: 504 }
        );
      }
      
      console.error(`Fetch error for agent ${agentId}:`, fetchError);
      return NextResponse.json(
        {
          success: false,
          error: `Network error: ${fetchError.message}`,
          details: { agentId, sessionId },
        },
        { status: 500 }
      );
    }

    // Step 4: Handle response based on HTTP status codes per OnDemand AI documentation
    
    // Success codes (2xx) - 200 OK, 201 Created
    if (response.status >= 200 && response.status < 300) {
      const responseData = await response.json();
      const answer = responseData.data?.answer || responseData.answer || '';
      const messageId = responseData.data?.messageId || responseData.messageId;
      const status = responseData.data?.status || responseData.status;

      console.log(`✅ Agent ${agentId} completed successfully (${response.status})`);

      // Return structured response that can be used by next agent
      return NextResponse.json({
        success: true,
        data: {
          answer,
          messageId,
          sessionId,
          status,
          // Include original payload data for chaining
          ...payload,
          // Add agent output
          [`agent_${agentId}_output`]: answer,
        },
      });
    }

    // Client errors (4xx) - parse error response body
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || `HTTP ${response.status}` };
    }
    
    console.error(`Agent ${agentId} Error (${response.status}):`, {
      url: queryUrl,
      status: response.status,
      error: errorData,
    });

    // 400 Bad Request - malformed request
    if (response.status === 400) {
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Invalid request format or missing required parameters',
          error_code: errorData.error_code || 'BAD_REQUEST',
          details: {
            status: response.status,
            agentId,
            sessionId,
            error: errorData,
          }
        },
        { status: 400 }
      );
    }

    // 401 Unauthorized - authentication failed
    if (response.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Authentication failed. The API key is missing, invalid, or expired.',
          error_code: errorData.error_code || 'UNAUTHORIZED',
          details: {
            status: response.status,
            agentId,
            sessionId,
            suggestion: 'Check your ONDEMAND_API_KEY in environment variables',
          }
        },
        { status: 401 }
      );
    }

    // 403 Forbidden - permission denied
    if (response.status === 403) {
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Permission denied. Your API key does not have permission for this action or plan limitations apply.',
          error_code: errorData.error_code || 'FORBIDDEN',
          details: {
            status: response.status,
            agentId,
            sessionId,
            error: errorData,
          }
        },
        { status: 403 }
      );
    }

    // 404 Not Found - resource not found
    if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Resource not found. Invalid session ID, agent ID, or endpoint.',
          error_code: errorData.error_code || 'NOT_FOUND',
          details: {
            status: response.status,
            agentId,
            sessionId,
            error: errorData,
          }
        },
        { status: 404 }
      );
    }

    // 429 Too Many Requests - rate limit exceeded
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || 'Rate limit exceeded. Your application has sent too many requests.',
          error_code: errorData.error_code || 'RATE_LIMIT_EXCEEDED',
          retry_after: retryAfter || null,
          details: {
            status: response.status,
            agentId,
            sessionId,
            suggestion: retryAfter ? `Retry after ${retryAfter} seconds` : 'Please retry later',
          }
        },
        { status: 429 }
      );
    }

    // Other 4xx client errors
    if (response.status >= 400 && response.status < 500) {
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || errorData.error || `Client error: ${response.status}`,
          error_code: errorData.error_code || `CLIENT_ERROR_${response.status}`,
          details: {
            status: response.status,
            agentId,
            sessionId,
            error: errorData,
          }
        },
        { status: response.status }
      );
    }

    // Server errors (5xx) - 500 Internal Server Error, 503 Service Unavailable
    if (response.status >= 500) {
      let serverErrorMessage = errorData.message || 'Server error occurred';
      
      if (response.status === 500) {
        serverErrorMessage = errorData.message || 'Internal server error. Something went wrong on OnDemand AI servers.';
      } else if (response.status === 503) {
        serverErrorMessage = errorData.message || 'Service unavailable. The server is temporarily unable to handle the request.';
      }
      
      return NextResponse.json(
        {
          success: false,
          error: serverErrorMessage,
          error_code: errorData.error_code || `SERVER_ERROR_${response.status}`,
          details: {
            status: response.status,
            agentId,
            sessionId,
            suggestion: 'Please try again later or check OnDemand AI status page',
            error: errorData,
          }
        },
        { status: response.status }
      );
    }

  } catch (error) {
    console.error('Agent route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to call agent',
      },
      { status: 500 }
    );
  }
}
