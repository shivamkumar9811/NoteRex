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
  const [processingStage, setProcessingStage] = useState(''); // 'transcribing' or 'summarizing'
  const [currentResult, setCurrentResult] = useState(null);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeView, setActiveView] = useState('landing'); // landing, upload, result, notes
  const [uploadMode, setUploadMode] = useState('video'); // video or notes
  const [activeTab, setActiveTab] = useState('upload'); // for tabs when not on landing
  const [resultTab, setResultTab] = useState('video'); // video, transcript, notes, qa

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
        setActiveView('result');
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
        setActiveView('result');
      } else {
        toast.error(data.error || 'Processing failed');
      }
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const processYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeUrl, sourceType: 'youtube' }),
      });

      const data = await response.json();

      if (data.success) {
        setCurrentResult(data.data);
        toast.success('YouTube video processed successfully!');
        setActiveView('result');
      } else {
        toast.error(data.error || 'YouTube processing failed');
      }
    } catch (error) {
      toast.error('YouTube processing failed: ' + error.message);
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
        setActiveView('notes');
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

  const handleUploadClick = (mode) => {
    setUploadMode(mode);
    setActiveView('upload');
  };

  // Landing Page View
  if (activeView === 'landing') {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950 to-black opacity-90"></div>
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black"></div>
        
        {/* Animated Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#4f4f4f12_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f12_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="relative z-10">
          {/* Header */}
          <header className="border-b border-purple-900/20 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/50">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                      NoteForge AI
                    </h1>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveView('notes')}
                  className="text-purple-300 hover:text-white hover:bg-purple-900/30"
                >
                  My Notes
                </Button>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="container mx-auto px-4 pt-20 pb-32">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-950/50 border border-purple-500/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-purple-300 font-medium">Powered by Whisper + Gemini 2.0 Flash</span>
              </div>

              {/* Heading */}
              <div className="space-y-6">
                <h2 className="text-6xl md:text-7xl lg:text-8xl font-black leading-tight">
                  <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                    Transform Content
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                    Into Smart Notes
                  </span>
                </h2>
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  AI-powered transcription and summarization for audio, video, and documents. 
                  Get instant bullet points, key takeaways, and Q&A.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button 
                  size="lg"
                  onClick={() => handleUploadClick('video')}
                  className="text-lg px-8 py-7 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 transition-all duration-300 hover:scale-105 group"
                >
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Upload Video
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg"
                  onClick={() => handleUploadClick('notes')}
                  variant="outline"
                  className="text-lg px-8 py-7 bg-white/5 border-2 border-purple-500/50 hover:border-purple-400 text-white backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 group"
                >
                  <FileUp className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Upload Notes
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">4</div>
                  <div className="text-sm text-gray-500">Summary Formats</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">AI</div>
                  <div className="text-sm text-gray-500">Powered Analysis</div>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">∞</div>
                  <div className="text-sm text-gray-500">Free Storage</div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="container mx-auto px-4 pb-32">
            <div className="max-w-6xl mx-auto space-y-16">
              {/* Section Header */}
              <div className="text-center space-y-4">
                <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                  Powerful Features
                </h3>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Everything you need to transform content into actionable insights
                </p>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Feature 1 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/50">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">AI Transcription</CardTitle>
                    <CardDescription className="text-gray-400">
                      OpenAI Whisper converts audio/video to accurate text transcripts in seconds
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 2 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-fuchsia-500/50">
                      <ListChecks className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">Smart Summaries</CardTitle>
                    <CardDescription className="text-gray-400">
                      4 AI-generated formats: bullet points, topics, takeaways, and Q&A
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 3 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/50">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">Lightning Fast</CardTitle>
                    <CardDescription className="text-gray-400">
                      Process hours of content in minutes with Gemini 2.0 Flash
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 4 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/50">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">Multi-Format</CardTitle>
                    <CardDescription className="text-gray-400">
                      Support for audio, video, PDF, and text files - all in one place
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 5 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/50">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">Privacy First</CardTitle>
                    <CardDescription className="text-gray-400">
                      Files processed in-memory only, deleted immediately after transcription
                    </CardDescription>
                  </CardHeader>
                </Card>

                {/* Feature 6 */}
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/50">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-white text-xl">Study Ready</CardTitle>
                    <CardDescription className="text-gray-400">
                      Generate Q&A pairs perfect for exam preparation and revision
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="container mx-auto px-4 pb-20">
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-purple-900/50 via-fuchsia-900/50 to-purple-900/50 border-purple-500/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.3),rgba(120,0,255,0))]"></div>
              <CardContent className="pt-12 pb-12 relative z-10">
                <div className="text-center space-y-6">
                  <h3 className="text-3xl md:text-4xl font-bold text-white">
                    Ready to Transform Your Content?
                  </h3>
                  <p className="text-lg text-purple-200 max-w-2xl mx-auto">
                    Start creating smart notes with AI-powered transcription and summarization
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <Button 
                      size="lg"
                      onClick={() => handleUploadClick('video')}
                      className="text-lg px-8 py-6 bg-white text-purple-900 hover:bg-purple-50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      Get Started Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <footer className="border-t border-purple-900/20 bg-black/40 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">© 2025 NoteForge AI. Built with Whisper + Gemini.</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>Privacy First</span>
                  <span>•</span>
                  <span>No Storage Costs</span>
                  <span>•</span>
                  <span>AI Powered</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Rest of the app (upload, results, notes views)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setActiveView('landing')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  NoteForge AI
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Note Generation</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-xs">
                Powered by Whisper + Gemini 2.0
              </Badge>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveView('notes')}
              >
                My Notes
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeView === 'upload' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {uploadMode === 'video' ? 'Process Video/Audio' : 'Upload Notes/Documents'}
              </CardTitle>
              <CardDescription>
                {uploadMode === 'video' 
                  ? 'Paste a YouTube URL or upload audio/video files for AI transcription and summarization'
                  : 'Upload PDFs or paste text to generate smart summaries'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              {uploadMode === 'video' && (
                <div className="space-y-6">
                  {/* YouTube URL Input */}
                  <div className="space-y-3">
                    <Label htmlFor="youtube">YouTube Video URL</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Youtube className="absolute left-3 top-3 w-5 h-5 text-red-500" />
                        <Input
                          id="youtube"
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                          className="pl-11"
                        />
                      </div>
                    </div>
                    {youtubeUrl && (
                      <Button onClick={processYouTube} disabled={processing} className="w-full">
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Extracting & Transcribing...
                          </>
                        ) : (
                          <>
                            <Youtube className="w-4 h-4 mr-2" />
                            Process YouTube Video
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or upload file</span>
                    </div>
                  </div>

                  {/* Audio/Video File Upload */}
                  <div className="space-y-3">
                    <Label>Upload Audio/Video File</Label>
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
                    </div>
                    {file && (
                      <>
                        <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-900">{file.name}</span>
                        </div>
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
                      </>
                    )}
                  </div>
                </div>
              )}

              {uploadMode === 'notes' && (
                <>
                  {/* PDF Upload */}
                  <div className="space-y-3">
                    <Label>Upload PDF Document</Label>
                    <Card className="border-2 border-dashed hover:border-pink-500 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <label className="cursor-pointer flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-pink-600" />
                          <span className="text-sm font-medium">Select PDF</span>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </label>
                      </CardContent>
                    </Card>
                    {file && (
                      <>
                        <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                          <Upload className="w-4 h-4 text-pink-600" />
                          <span className="text-sm font-medium text-pink-900">{file.name}</span>
                        </div>
                        <Button onClick={processFile} disabled={processing} className="w-full">
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Process PDF
                            </>
                          )}
                        </Button>
                      </>
                    )}
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
                      rows={8}
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
                </>
              )}

              <Button 
                variant="outline" 
                onClick={() => setActiveView('landing')}
                className="w-full"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        )}

        {activeView === 'result' && (
          <div className="space-y-6">
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
          </div>
        )}

        {activeView === 'notes' && (
          <div className="space-y-6">
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
          </div>
        )}
      </main>
    </div>
  );
}