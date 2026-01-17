/**
 * Agent Pipeline Orchestrator
 * Executes 6 on-demand.io agents sequentially
 */

const AGENT_IDS = {
  INPUT_VALIDATOR: '696a628eac9b040cc2f754ef',
  CONTENT_EXTRACTOR: '696a7678c7d6dfdf7e337d1a',
  CONTENT_FUSION: '696a780cb2795e4f7116f70f',
  TERM_ANALYZER: '696a7bf9c7d6dfdf7e337d31',
  NOTES_GENERATOR: '696a7c31c7d6dfdf7e337d33',
  SAVE_DELIVERY: '696a7ce8ac9b040cc2f75526',
};

const AGENT_NAMES = {
  INPUT_VALIDATOR: 'Validating input…',
  CONTENT_EXTRACTOR: 'Extracting content…',
  CONTENT_FUSION: 'Processing extracted data…',
  TERM_ANALYZER: 'Validating processed data…',
  NOTES_GENERATOR: 'Refining with notes & topics…',
  SAVE_DELIVERY: 'Generating final output…',
};

/**
 * Call a single on-demand.io agent
 * @param {string} agentId - The agent ID
 * @param {object} payload - The input payload for the agent
 * @returns {Promise<object>} - The agent's response
 */
async function callAgent(agentId, payload) {
  try {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId,
        payload,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `Agent ${agentId} failed`);
    }

    return data.data;
  } catch (error) {
    console.error(`Agent ${agentId} error:`, error);
    throw error;
  }
}

/**
 * Start the complete 6-agent pipeline
 * @param {object} inputPayload - Initial input (file, url, text, etc.)
 * @param {function} onProgress - Callback for progress updates (stage, message)
 * @returns {Promise<object>} - Final result from Agent 6
 */
export async function startNotesPipeline(inputPayload, onProgress) {
  let currentPayload = { ...inputPayload };
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Agent 1: Input Validator
    onProgress?.(1, AGENT_NAMES.INPUT_VALIDATOR);
    const validatedInput = await callAgent(AGENT_IDS.INPUT_VALIDATOR, {
      ...currentPayload,
      sessionId,
    });
    currentPayload = { ...currentPayload, ...validatedInput };

    // Agent 2: Content Extractor
    onProgress?.(2, AGENT_NAMES.CONTENT_EXTRACTOR);
    const extractedContent = await callAgent(AGENT_IDS.CONTENT_EXTRACTOR, {
      ...currentPayload,
      sessionId,
    });
    currentPayload = { ...currentPayload, ...extractedContent };

    // Agent 3: Content Fusion
    onProgress?.(3, AGENT_NAMES.CONTENT_FUSION);
    const fusedContent = await callAgent(AGENT_IDS.CONTENT_FUSION, {
      ...currentPayload,
      sessionId,
    });
    currentPayload = { ...currentPayload, ...fusedContent };

    // Agent 4: Term Analyzer
    onProgress?.(4, AGENT_NAMES.TERM_ANALYZER);
    const analyzedTerms = await callAgent(AGENT_IDS.TERM_ANALYZER, {
      ...currentPayload,
      sessionId,
    });
    currentPayload = { ...currentPayload, ...analyzedTerms };

    // Agent 5: Notes + Q&A Generator
    onProgress?.(5, AGENT_NAMES.NOTES_GENERATOR);
    const generatedNotes = await callAgent(AGENT_IDS.NOTES_GENERATOR, {
      ...currentPayload,
      sessionId,
    });
    currentPayload = { ...currentPayload, ...generatedNotes };

    // Agent 6: Save & Delivery (saves to MongoDB)
    onProgress?.(6, AGENT_NAMES.SAVE_DELIVERY);
    const savedNote = await callAgent(AGENT_IDS.SAVE_DELIVERY, {
      ...currentPayload,
      sessionId,
    });

    // Normalize and extract note data from agent response
    // This function normalizes the data structure before saving
    const normalizeNoteData = () => {
      // 1. Detect input type correctly (do NOT default to 'youtube' or 'text')
      let sourceType = currentPayload.inputType || currentPayload.sourceType;
      if (!sourceType || sourceType === 'youtube') {
        // Only set youtube if explicitly provided, otherwise infer from payload
        if (currentPayload.youtubeUrl) {
          sourceType = 'youtube';
        } else if (currentPayload.fileName) {
          // Infer from file extension
          const ext = currentPayload.fileName.split('.').pop()?.toLowerCase();
          if (ext === 'pdf') sourceType = 'pdf';
          else if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) sourceType = 'video';
          else if (['mp3', 'wav', 'aac', 'm4a'].includes(ext)) sourceType = 'audio';
          else sourceType = 'text';
        } else if (currentPayload.textContent) {
          sourceType = 'text';
        } else {
          sourceType = 'text'; // Last resort default
        }
      }

      // 2. Generate title - NEVER save "Untitled Note"
      // For YouTube: Use extracted title from YouTube extraction
      let title = currentPayload.title || currentPayload.fileName || '';
      if (!title || title === 'Untitled Note') {
        // For YouTube: Title should have been extracted during YouTube processing
        if (currentPayload.youtubeUrl && currentPayload.title) {
          title = currentPayload.title; // Use title extracted from YouTube
        } else if (currentPayload.fileName) {
          // Generate from filename (remove extension)
          title = currentPayload.fileName.replace(/\.[^/.]+$/, '');
        } else if (currentPayload.textContent) {
          // Use first line or first 50 chars as title
          const firstLine = currentPayload.textContent.split('\n')[0].trim();
          title = firstLine.substring(0, 50) || 'Generated Note';
        } else {
          title = `Note ${new Date().toLocaleDateString()}`;
        }
      }

      // 3. Extract transcript and remove YouTube/Gemini fallback text
      let transcript = currentPayload.transcript || currentPayload.textContent || savedNote.answer || '';
      
      // BLOCK Gemini/YouTube fallback messages - if found, transcript extraction failed
      const fallbackPatterns = [
        /don't have the capability to directly process or view PDF files/i,
        /I don't have the capability/i,
        /cannot directly.*PDF/i,
        /The provided link is a YouTube video/i,
        /Please specify what information you need/i,
      ];
      
      let hasFallbackMessage = false;
      for (const pattern of fallbackPatterns) {
        if (pattern.test(transcript)) {
          hasFallbackMessage = true;
          console.error('❌ BLOCKED: Fallback message detected in transcript:', transcript.substring(0, 200));
          break;
        }
      }
      
      // If fallback message found, clear transcript (extraction failed)
      if (hasFallbackMessage) {
        transcript = '';
        console.error('Pipeline stopped: PDF extraction failed - fallback message received');
      } else if (sourceType !== 'youtube' && transcript) {
        // Remove any remaining YouTube fallback text
        transcript = transcript.replace(/The provided link is a YouTube video[^.]*\./gi, '').trim();
        transcript = transcript.replace(/Please specify what information you need[^.]*\./gi, '').trim();
      }
      
      // Validate transcript is not empty (especially for PDFs)
      if (sourceType === 'pdf' && (!transcript || transcript.trim().length === 0)) {
        throw new Error('PDF transcript is empty - PDF extraction may have failed');
      }

      // 4. Parse agent responses to extract structured summaries
      // Collect data from all agents in the pipeline
      // STRICT: Only extract summaryFormats, NEVER revisionQA
      let summaryFormats = {
        bulletNotes: [],
        topicWise: [],
        keyTakeaways: [],
      };

      // Try to extract from Agent 5 (Notes Generator) output
      const notesOutput = currentPayload[`agent_${AGENT_IDS.NOTES_GENERATOR}_output`] || 
                         currentPayload.answer || 
                         savedNote.answer || 
                         '';

      // Try to parse JSON from agent responses
      const tryParseJSON = (text) => {
        if (!text) return null;
        try {
          // Try direct JSON parse
          return JSON.parse(text);
        } catch {
          // Try extracting JSON from markdown code blocks
          const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
          if (jsonMatch) {
            try {
              return JSON.parse(jsonMatch[1]);
            } catch {}
          }
          return null;
        }
      };

      // Parse structured data from agent outputs
      const parsedData = tryParseJSON(notesOutput) || tryParseJSON(savedNote.answer);
      
      if (parsedData) {
        // Extract summaryFormats structure
        if (parsedData.summaryFormats) {
          summaryFormats = {
            bulletNotes: Array.isArray(parsedData.summaryFormats.bulletNotes) 
              ? parsedData.summaryFormats.bulletNotes 
              : [],
            topicWise: Array.isArray(parsedData.summaryFormats.topicWise) 
              ? parsedData.summaryFormats.topicWise 
              : [],
            keyTakeaways: Array.isArray(parsedData.summaryFormats.keyTakeaways) 
              ? parsedData.summaryFormats.keyTakeaways 
              : [],
          };
        }
        
        // STRICT: revisionQA is NEVER extracted or saved
      }

      // Fallback: Try to extract from old summaries format if new format not found
      if (summaryFormats.bulletNotes.length === 0 && currentPayload.summaries) {
        const summaries = currentPayload.summaries;
        if (summaries.bulletPoints) {
          summaryFormats.bulletNotes = Array.isArray(summaries.bulletPoints) 
            ? summaries.bulletPoints 
            : summaries.bulletPoints.split('\n').filter(Boolean);
        }
        if (summaries.topics) {
          summaryFormats.topicWise = Array.isArray(summaries.topics) 
            ? summaries.topics 
            : summaries.topics.split('\n').filter(Boolean);
        }
        if (summaries.keyTakeaways) {
          summaryFormats.keyTakeaways = Array.isArray(summaries.keyTakeaways) 
            ? summaries.keyTakeaways 
            : summaries.keyTakeaways.split('\n').filter(Boolean);
        }
        // STRICT: revisionQA is NEVER extracted, even from old summaries format
      }

      // 5. Validate that summaries were generated (don't save empty summaries)
      if (summaryFormats.bulletNotes.length === 0 && 
          summaryFormats.topicWise.length === 0 && 
          summaryFormats.keyTakeaways.length === 0) {
        console.warn('⚠️ Warning: No summaries generated - saving with empty structure');
      }

      // STRICT: Return ONLY summaryFormats, NEVER revisionQA
      // Include YouTube-specific metadata if present
      const result = {
        title,
        sourceType,
        transcript,
        summaryFormats,
        // revisionQA is NEVER included
        userId: currentPayload.userId || 'anonymous',
      };
      
      // Preserve YouTube metadata if present
      if (currentPayload.videoId) {
        result.videoId = currentPayload.videoId;
      }
      if (currentPayload.youtubeUrl) {
        result.youtubeUrl = currentPayload.youtubeUrl;
      }
      
      return result;
    };

    const noteData = normalizeNoteData();
    
    // Validate note data before saving - ensure transcript exists for PDFs
    if (noteData.sourceType === 'pdf' && (!noteData.transcript || noteData.transcript.trim().length === 0)) {
      console.error('❌ Pipeline error: PDF transcript is empty after normalization');
      return {
        success: false,
        error: 'PDF extraction failed: No text content extracted from PDF. Please ensure the PDF contains readable text.',
        sessionId,
      };
    }

    // Save to MongoDB
    try {
      const saveResponse = await fetch('/api/notes-mongodb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      });

      const saveResult = await saveResponse.json();
      
      if (saveResult.success) {
        return {
          success: true,
          data: saveResult.data,
          noteId: saveResult.data._id || saveResult.data.id,
          sessionId,
        };
      } else {
        console.error('Failed to save note to MongoDB:', saveResult.error);
        // Still return success but with warning
        return {
          success: true,
          data: noteData,
          noteId: null,
          sessionId,
          warning: 'Note processed but save to database failed',
        };
      }
    } catch (saveError) {
      console.error('Error saving note to MongoDB:', saveError);
      // Still return success but with warning
      return {
        success: true,
        data: noteData,
        noteId: null,
        sessionId,
        warning: 'Note processed but save to database failed',
      };
    }
  } catch (error) {
    console.error('Pipeline error:', error);
    return {
      success: false,
      error: error.message || 'Pipeline execution failed',
      sessionId,
    };
  }
}

/**
 * Get progress stage name by number
 */
export function getProgressStageName(stage) {
  const stages = Object.values(AGENT_NAMES);
  return stages[stage - 1] || 'Processing…';
}

