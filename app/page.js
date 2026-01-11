'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileAudio, 
  FileVideo, 
  FileText, 
  Youtube, 
  Loader2, 
  Sparkles,
  Trash2,
  Search,
  Brain,
  ListChecks,
  Lightbulb,
  MessageSquareQuote,
  Zap,
  Shield,
  Target,
  ArrowRight,
  Play,
  FileUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function NoteForgeAI() {
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeView, setActiveView] = useState('landing'); // landing, upload, result, notes
  const [uploadMode, setUploadMode] = useState('video'); // video or notes

  // Fetch all notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async (search = '') => {
    try {
      setLoadingNotes(true);
      const url = search ? `/api/notes?search=${encodeURIComponent(search)}` : '/api/notes';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const getSourceType = (file) => {
    const type = file.type;
    if (type.startsWith('audio/')) return 'audio';
    if (type.startsWith('video/')) return 'video';
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('text/')) return 'text';
    return 'text';
  };

  const processFile = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceType', getSourceType(file));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setCurrentResult(data.data);
        toast.success('Processing complete!');
        setActiveTab('result');
      } else {
        toast.error(data.error || 'Processing failed');
      }
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const processText = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput, sourceType: 'text' }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentResult(data.data);
        toast.success('Processing complete!');
        setActiveTab('result');
      } else {
        toast.error(data.error || 'Processing failed');
      }
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const saveNote = async () => {
    if (!currentResult) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentResult),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Note saved successfully!');
        fetchNotes();
        setCurrentResult(null);
        setFile(null);
        setTextInput('');
        setYoutubeUrl('');
        setActiveTab('notes');
      } else {
        toast.error(data.error || 'Failed to save note');
      }
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const deleteNote = async (firestoreId) => {
    try {
      const response = await fetch(`/api/notes/${firestoreId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Note deleted');
        fetchNotes();
      } else {
        toast.error('Failed to delete note');
      }
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleSearch = () => {
    fetchNotes(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  NoteForge AI
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Note Generation</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Powered by Whisper + Gemini 2.0
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
            <TabsTrigger value="notes">My Notes</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Create Smart Notes
                </CardTitle>
                <CardDescription>
                  Upload audio, video, PDF, or text to generate AI-powered summaries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                  <Label>Upload File</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-2 border-dashed hover:border-indigo-500 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <FileAudio className="w-8 h-8 text-indigo-600" />
                          <span className="text-sm font-medium">Audio</span>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-dashed hover:border-purple-500 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <FileVideo className="w-8 h-8 text-purple-600" />
                          <span className="text-sm font-medium">Video</span>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-dashed hover:border-pink-500 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-pink-600" />
                          <span className="text-sm font-medium">PDF</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </CardContent>
                    </Card>
                    <Card className="border-2 border-dashed hover:border-teal-500 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-teal-600" />
                          <span className="text-sm font-medium">Text</span>
                          <input
                            type="file"
                            accept="text/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </CardContent>
                    </Card>
                  </div>
                  {file && (
                    <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                      <Upload className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-900">{file.name}</span>
                    </div>
                  )}
                  {file && (
                    <Button onClick={processFile} disabled={processing} className="w-full">
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Process File
                        </>
                      )}
                    </Button>
                  )}
                </div>

                <Separator />

                {/* YouTube URL */}
                <div className="space-y-3">
                  <Label htmlFor="youtube">YouTube URL</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Youtube className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="youtube"
                        placeholder="https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">YouTube processing coming soon...</p>
                </div>

                <Separator />

                {/* Text Input */}
                <div className="space-y-3">
                  <Label htmlFor="text">Or Paste Text</Label>
                  <Textarea
                    id="text"
                    placeholder="Paste your notes, articles, or any text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                  {textInput && (
                    <Button onClick={processText} disabled={processing} className="w-full">
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-6">
            {currentResult ? (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Save Button */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{currentResult.title}</h3>
                        <p className="text-sm text-muted-foreground">Source: {currentResult.sourceType}</p>
                      </div>
                      <Button onClick={saveNote}>
                        Save to Notes
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcript */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Full Transcript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full rounded-md border p-4">
                      <p className="text-sm whitespace-pre-wrap">{currentResult.transcript}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Summaries */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Bullet Points */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ListChecks className="w-5 h-5 text-indigo-600" />
                        Bullet Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full">
                        <div className="text-sm whitespace-pre-wrap">{currentResult.summaries.bulletPoints}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Topics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Topic Structure
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full">
                        <div className="text-sm whitespace-pre-wrap">{currentResult.summaries.topics}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Key Takeaways */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Key Takeaways
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full">
                        <div className="text-sm whitespace-pre-wrap">{currentResult.summaries.keyTakeaways}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Q&A */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MessageSquareQuote className="w-5 h-5 text-pink-600" />
                        Q&A for Revision
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full">
                        <div className="text-sm whitespace-pre-wrap">{currentResult.summaries.qa}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">No results yet. Process a file or text to see summaries.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6">
            {/* Search */}
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={loadingNotes}>
                    {loadingNotes ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes List */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {notes.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No notes yet. Create your first note!</p>
                  </CardContent>
                </Card>
              ) : (
                notes.map((note) => (
                  <Card key={note.firestoreId} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">{note.title}</CardTitle>
                          <CardDescription>
                            {new Date(note.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.firestoreId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        {note.sourceType}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32 w-full">
                        <p className="text-sm text-muted-foreground line-clamp-4">
                          {note.transcript?.substring(0, 200)}...
                        </p>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}