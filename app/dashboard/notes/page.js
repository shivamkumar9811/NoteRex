'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Search, Trash2, Download, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import Link from 'next/link';

export default function NotesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated]);

  const fetchNotes = async (search = '') => {
    try {
      setLoadingNotes(true);
      // Use MongoDB endpoint instead of Firestore
      const url = search 
        ? `/api/notes-mongodb?search=${encodeURIComponent(search)}` 
        : '/api/notes-mongodb';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data || []);
      } else {
        toast.error(data.error || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Fetch notes error:', error);
      toast.error('Failed to fetch notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    fetchNotes(query);
  };

  const deleteNote = async (noteId) => {
    try {
      const response = await fetch(`/api/notes-mongodb?id=${noteId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Note deleted');
        fetchNotes(searchQuery);
      } else {
        toast.error(data.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Delete note error:', error);
      toast.error('Failed to delete note');
    }
  };

  const downloadNote = (note) => {
    try {
      // Create a JSON file with note data
      const noteData = {
        title: note.title || 'Untitled Note',
        sourceType: note.sourceType || 'text',
        createdAt: note.createdAt || new Date().toISOString(),
        transcript: note.transcript || '',
        summaries: note.summaries || {},
      };

      const blob = new Blob([JSON.stringify(noteData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'note'}_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Note downloaded');
    } catch (error) {
      toast.error('Failed to download note');
    }
  };

  const viewNoteDetails = (note) => {
    // Extract data with new format support
    const summaryFormats = note.summaryFormats || {
      bulletNotes: [],
      topicWise: [],
      keyTakeaways: [],
    };
    // STRICT: revisionQA is NEVER extracted or used
    const hasSummaries = summaryFormats.bulletNotes?.length > 0 || 
                        summaryFormats.topicWise?.length > 0 || 
                        summaryFormats.keyTakeaways?.length > 0;
    
    // Check if summaries exist - if not, show processing failed message
    if (!hasSummaries) {
      toast.error('Note processing incomplete: Summaries not generated');
      return;
    }
    
    // Create HTML with tabs for Summary & Q&A
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${note.title || 'Note Details'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #1a1a1a;
              color: #fff;
              padding: 20px;
            }
            .container { max-width: 900px; margin: 0 auto; }
            h1 { margin-bottom: 10px; color: #a855f7; }
            .meta { color: #9ca3af; margin-bottom: 20px; font-size: 14px; }
            .tabs { display: flex; gap: 10px; border-bottom: 2px solid #374151; margin-bottom: 20px; }
            .tab {
              padding: 10px 20px;
              cursor: pointer;
              border: none;
              background: transparent;
              color: #9ca3af;
              font-size: 16px;
              border-bottom: 2px solid transparent;
              margin-bottom: -2px;
            }
            .tab.active { color: #a855f7; border-bottom-color: #a855f7; }
            .tab-content { display: none; }
            .tab-content.active { display: block; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #a855f7; margin-bottom: 15px; font-size: 18px; }
            ul { list-style: none; padding-left: 0; }
            li { padding: 8px 0; border-bottom: 1px solid #374151; color: #e5e7eb; }
            .qa-item { margin-bottom: 20px; padding: 15px; background: #1f2937; border-radius: 8px; }
            .qa-question { color: #60a5fa; font-weight: 600; margin-bottom: 8px; }
            .qa-answer { color: #d1d5db; }
            .empty { color: #6b7280; font-style: italic; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${note.title || 'Untitled Note'}</h1>
            <div class="meta">
              Type: ${note.sourceType || 'text'} | 
              Created: ${note.createdAt ? new Date(note.createdAt).toLocaleString() : 'No date'}
            </div>
            
            <div class="tabs">
              <button class="tab active" onclick="showTab('summary')">Summary</button>
              <!-- STRICT: Q&A tab removed - revisionQA is NEVER rendered -->
              <button class="tab" onclick="showTab('transcript')">Transcript</button>
            </div>
            
            <div id="summary" class="tab-content active">
              ${hasSummaries ? `
                ${summaryFormats.bulletNotes?.length > 0 ? `
                  <div class="section">
                    <h3>Bullet Notes</h3>
                    <ul>
                      ${summaryFormats.bulletNotes.map(point => `<li>• ${point}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${summaryFormats.topicWise?.length > 0 ? `
                  <div class="section">
                    <h3>Topic-Wise Structure</h3>
                    <ul>
                      ${summaryFormats.topicWise.map(topic => `<li>• ${topic}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${summaryFormats.keyTakeaways?.length > 0 ? `
                  <div class="section">
                    <h3>Key Takeaways</h3>
                    <ul>
                      ${summaryFormats.keyTakeaways.map(takeaway => `<li>• ${takeaway}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              ` : '<div class="empty">No summaries available. Processing may have failed.</div>'}
            </div>
            
            <!-- STRICT: Q&A section removed - revisionQA is NEVER rendered -->
            
            <div id="transcript" class="tab-content">
              <div class="section">
                <p style="white-space: pre-wrap; line-height: 1.6; color: #d1d5db;">
                  ${note.transcript || 'No transcript available'}
                </p>
              </div>
            </div>
          </div>
          
          <script>
            function showTab(tabName) {
              document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
              document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
              document.getElementById(tabName).classList.add('active');
              event.target.classList.add('active');
            }
          </script>
        </body>
      </html>
    `;
    
    // Open in new window
    const newWindow = window.open('', '_blank', 'width=1000,height=700');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
  };

  return (
    <>
      {/* Top Section */}
      <section className="container mx-auto px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center space-y-4 max-w-3xl mx-auto"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            My Notes
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
            All your saved notes in one place
          </p>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-12"
            >
              <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-400">Loading...</p>
            </motion.div>
          ) : !isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            >
              <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl shadow-2xl max-w-2xl mx-auto">
                <CardContent className="p-12 text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-purple-500/50">
                    <FileText className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">
                      Sign in to view your notes
                    </h2>
                    <p className="text-gray-400">
                      Access your saved notes and AI-powered study materials
                    </p>
                  </div>
                  <div className="pt-4">
                    <Link href="/login">
                      <Button
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="space-y-8"
            >
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10 bg-purple-950/50 border-purple-500/30 text-white placeholder:text-gray-500 focus:border-purple-400"
                />
              </div>

              {/* Notes Grid */}
              {loadingNotes ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="mt-4 text-gray-400">Loading notes...</p>
                </div>
              ) : notes.length === 0 ? (
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 backdrop-blur-xl">
                  <CardContent className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600/50 to-fuchsia-600/50 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No notes yet</h3>
                    <p className="text-gray-400">
                      {searchQuery ? 'No notes match your search.' : 'Create your first note to get started!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {notes.map((note) => (
                    <Card
                      key={note.firestoreId || note.id}
                      className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg line-clamp-1">
                              {note.title || 'Untitled Note'}
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                              {note.createdAt 
                                ? new Date(note.createdAt).toLocaleDateString()
                                : 'No date'}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNote(note.firestoreId || note.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {note.sourceType && (
                          <Badge variant="outline" className="w-fit border-purple-500/30 text-purple-300">
                            {note.sourceType}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32 w-full mb-4">
                          <p className="text-sm text-gray-300 line-clamp-4">
                            {note.transcript?.substring(0, 200) || 'No content available'}...
                          </p>
                        </ScrollArea>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-purple-500/20">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewNoteDetails(note)}
                            className="flex-1 text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadNote(note)}
                            className="flex-1 text-purple-300 hover:text-purple-200 hover:bg-purple-900/20"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

