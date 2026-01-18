'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
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
  MessageSquare,
  Zap,
  Shield,
  Target,
  ArrowRight,
  Play,
  FileUp,
  Edit3,
  RefreshCw,
  Save,
  Twitter,
  Github,
  Mail,
  HelpCircle,
  BookOpen,
  LayoutDashboard,
  LogIn,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Hero3D from '@/components/Hero3D';
import ProjectImpact from '@/components/ProjectImpact';
import AgentProgress from '@/components/AgentProgress';
import { startNotesPipeline, callOnDemandAgent } from '@/lib/services/agentPipeline';

// Configuration for video and step images
// Configuration for landing page assets
// Images should be placed in /public/images/steps/ and referenced as /images/steps/filename.jpg
// Videos should be placed in /public/videos/ and referenced as /videos/filename.mp4
const landingConfig = {
  howToVideo: {
    type: 'youtube', // 'youtube' | 'local'
    src: '', // YouTube ID (for type: 'youtube') or local video path (for type: 'local', e.g., '/videos/demo.mp4')
    // Example YouTube: src: 'dQw4w9WgXcQ'
    // Example Local: src: '/videos/demo.mp4'
  },
  steps: [
    {
      id: 1,
      title: 'Upload Your Content',
      description: 'Upload audio, video, PDF files, or paste text directly. You can also process YouTube videos by pasting the URL.',
      images: [
        // Multiple images supported: 1=centered, 2=side-by-side, 3+=auto grid
        // Images should be in /public/images/steps/ and referenced as /images/steps/filename.jpg
        { src: '/images/steps/upload-1.jpg', alt: 'Upload interface' },
        { src: '/images/steps/upload-2.jpg', alt: 'File selection' }
      ],
      color: 'purple'
    },
    {
      id: 2,
      title: 'AI Processing',
      description: 'Our AI transcribes your content using OpenAI Whisper, then generates comprehensive summaries with Gemini 2.0 Flash.',
      images: [
        { src: '/images/steps/processing.jpg', alt: 'AI processing' }
      ],
      color: 'fuchsia'
    },
    {
      id: 3,
      title: 'Review & Edit',
      description: 'Review the full transcript, make edits if needed, and regenerate summaries to perfect your notes.',
      images: [
        { src: '/images/steps/edit.jpg', alt: 'Edit interface' }
      ],
      color: 'purple'
    },
    {
      id: 4,
      title: 'Get Smart Notes',
      description: 'Receive 4 formats: bullet points, topic structure, key takeaways, and Q&A pairs. Save and organize all your notes.',
      images: [
        { src: '/images/steps/notes.jpg', alt: 'Smart notes' }
      ],
      color: 'fuchsia'
    }
  ]
};

// Animated Step Component
function StepItem({ step, index, isEven }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: '-100px' });
  const colorClass = step.color === 'purple' ? 'purple' : 'fuchsia';
  const borderColor = step.color === 'purple' ? 'border-purple-600' : 'border-fuchsia-600';
  const bgColor = step.color === 'purple' ? 'bg-purple-950/50' : 'bg-fuchsia-950/50';
  const textColor = step.color === 'purple' ? 'text-purple-300' : 'text-fuchsia-300';
  const gradientFrom = step.color === 'purple' ? 'from-purple-950/50' : 'from-fuchsia-950/50';
  const shadowColor = step.color === 'purple' ? 'shadow-purple-500/50' : 'shadow-fuchsia-500/50';

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-start gap-6 md:gap-12`}
    >
      {/* Animated Circle Marker */}
      <motion.div
        className={`absolute left-8 md:left-1/2 w-5 h-5 rounded-full bg-white ${borderColor} border-4 shadow-lg ${shadowColor} transform md:-translate-x-1/2 z-10`}
        animate={isInView ? {
          scale: [1, 1.3, 1.2],
          boxShadow: [
            `0 0 0 0 rgba(${step.color === 'purple' ? '168, 85, 247' : '236, 72, 153'}, 0.4)`,
            `0 0 0 10px rgba(${step.color === 'purple' ? '168, 85, 247' : '236, 72, 153'}, 0)`,
            `0 0 0 0 rgba(${step.color === 'purple' ? '168, 85, 247' : '236, 72, 153'}, 0)`
          ],
          y: [0, 4, 0]
        } : { scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Content */}
      <motion.div
        className={`md:w-1/2 ${isEven ? 'md:pl-12 md:text-left' : 'md:pr-12 md:text-right'} pl-20 md:pl-0`}
        initial={{ opacity: 0, x: isEven ? 30 : -30 }}
        animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isEven ? 30 : -30 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      >
        <div className="space-y-4">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${bgColor} border ${borderColor}/30`}>
            <span className={`text-sm font-semibold ${textColor}`}>Step {step.id}</span>
          </div>
          <h4 className="text-2xl md:text-3xl font-bold text-white">{step.title}</h4>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
            {step.description}
          </p>
        </div>
      </motion.div>

      {/* Images - Config-Driven with Multiple Layout Support */}
      <motion.div
        className={`md:w-1/2 ${isEven ? 'md:pr-12' : 'md:pl-12'} pl-20 md:pl-0 w-full`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      >
        {/* 1 Image: Centered */}
        {step.images.length === 1 ? (
          <motion.div
            className="w-full h-48 md:h-64 rounded-xl bg-gradient-to-br from-purple-950/50 to-black border border-purple-500/30 overflow-hidden shadow-lg relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            whileInView={{ boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
          >
            {step.images[0]?.src ? (
              <motion.img
                src={step.images[0].src}
                alt={step.images[0].alt || 'Step image'}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
                onError={(e) => {
                  // Image failed to load - show placeholder
                  e.target.style.display = 'none';
                  e.target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            {/* Empty placeholder if no image or image failed to load */}
            <div className={`absolute inset-0 flex items-center justify-center ${step.images[0]?.src ? 'hidden' : ''}`}>
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto rounded-lg bg-gradient-to-br ${bgColor} border ${borderColor}/30 flex items-center justify-center opacity-50`}></div>
                <p className={`text-xs ${textColor} opacity-50`}>Image placeholder</p>
              </div>
            </div>
          </motion.div>
        ) : step.images.length === 2 ? (
          /* 2 Images: Side-by-side */
          <div className="grid grid-cols-2 gap-4">
            {step.images.map((img, imgIndex) => (
              <motion.div
                key={imgIndex}
                className="w-full h-48 md:h-64 rounded-xl bg-gradient-to-br from-purple-950/50 to-black border border-purple-500/30 overflow-hidden shadow-lg relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.3 + (imgIndex * 0.1), ease: 'easeOut' }}
                whileInView={{ boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
              >
                {img?.src ? (
                  <motion.img
                    src={img.src}
                    alt={img.alt || `Step image ${imgIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6, delay: 0.4 + (imgIndex * 0.1), ease: 'easeOut' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${img?.src ? 'hidden' : ''}`}>
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br ${bgColor} border ${borderColor}/30 opacity-50`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : step.images.length > 2 ? (
          /* 3+ Images: Auto Grid */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {step.images.map((img, imgIndex) => (
              <motion.div
                key={imgIndex}
                className="w-full h-40 md:h-48 rounded-xl bg-gradient-to-br from-purple-950/50 to-black border border-purple-500/30 overflow-hidden shadow-lg relative"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.6, delay: 0.3 + (imgIndex * 0.1), ease: 'easeOut' }}
                whileInView={{ boxShadow: '0 20px 40px rgba(168, 85, 247, 0.3)' }}
              >
                {img?.src ? (
                  <motion.img
                    src={img.src}
                    alt={img.alt || `Step image ${imgIndex + 1}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.6, delay: 0.4 + (imgIndex * 0.1), ease: 'easeOut' }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${img?.src ? 'hidden' : ''}`}>
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${bgColor} border ${borderColor}/30 opacity-50`}></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* No images: Empty placeholder */
          <div className="w-full h-48 md:h-64 rounded-xl bg-gradient-to-br from-purple-950/50 to-black border border-purple-500/30 flex items-center justify-center shadow-lg">
            <div className="text-center space-y-2">
              <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto rounded-lg bg-gradient-to-br ${bgColor} border ${borderColor}/30 opacity-50`}></div>
              <p className={`text-xs ${textColor} opacity-50`}>No images configured</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// Features Section Component with Scroll Animations
function FeaturesSection() {
  const featuresRef = useRef(null);
  const features = [
    {
      icon: Brain,
      title: 'AI Transcription',
      description: 'OpenAI Whisper converts audio/video to accurate text transcripts in seconds',
      gradient: 'from-purple-600 to-fuchsia-600',
      shadow: 'shadow-purple-500/30',
    },
    {
      icon: ListChecks,
      title: 'Smart Summaries',
      description: '4 AI-generated formats: bullet points, topics, takeaways, and Q&A',
      gradient: 'from-fuchsia-600 to-pink-600',
      shadow: 'shadow-fuchsia-500/30',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process hours of content in minutes with Gemini 2.0 Flash',
      gradient: 'from-violet-600 to-purple-600',
      shadow: 'shadow-violet-500/30',
    },
    {
      icon: FileText,
      title: 'Multi-Format',
      description: 'Support for audio, video, PDF, and text files - all in one place',
      gradient: 'from-pink-600 to-rose-600',
      shadow: 'shadow-pink-500/30',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Files processed in-memory only, deleted immediately after transcription',
      gradient: 'from-indigo-600 to-blue-600',
      shadow: 'shadow-indigo-500/30',
    },
    {
      icon: Target,
      title: 'Study Ready',
      description: 'Generate Q&A pairs perfect for exam preparation and revision',
      gradient: 'from-cyan-600 to-teal-600',
      shadow: 'shadow-cyan-500/30',
    },
  ];

  return (
    <section ref={featuresRef} className="container mx-auto px-4 pb-40">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Section Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <h3 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Powerful Features
          </h3>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Everything you need to transform content into actionable insights
          </p>
        </motion.div>

        {/* Feature Cards with Staggered Animation */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-purple-950/50 to-black border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 backdrop-blur-sm group h-full">
                  <CardHeader className="pb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <CardTitle className="text-white text-2xl mb-3">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-300 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Step Roadmap Section Component
function StepRoadmapSection() {
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start end', 'end start']
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="container mx-auto px-4 pb-40">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Section Header */}
        <div className="text-center space-y-6">
          <h3 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            How It Works
          </h3>
          <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform your content into smart notes in just a few simple steps
          </p>
        </div>

        {/* Timeline */}
        <div className="relative" ref={timelineRef}>
          {/* Animated Vertical Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-800 transform -translate-x-1/2 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-purple-600 via-fuchsia-600 to-purple-600"
              style={{ height: lineHeight }}
            />
          </div>
          <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-600 via-fuchsia-600 to-purple-600"></div>

          {/* Steps - Config Driven */}
          <div className="space-y-20 md:space-y-24">
            {landingConfig.steps.map((step, index) => (
              <StepItem
                key={step.id}
                step={step}
                index={index}
                isEven={index % 2 === 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function NoteRexAI() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [file, setFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(''); // 'transcribing' or 'summarizing'
  const [agentProgress, setAgentProgress] = useState(0); // Current agent stage (1-6)
  const [currentResult, setCurrentResult] = useState(null);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [activeView, setActiveView] = useState('landing'); // landing, upload, result, notes
  const [uploadMode, setUploadMode] = useState('video'); // video or notes
  const [activeTab, setActiveTab] = useState('upload'); // for tabs when not on landing
  const [resultTab, setResultTab] = useState('summary'); // summary, qa, transcript, chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Fetch all notes on mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async (search = '') => {
    try {
      setLoadingNotes(true);
      let url = '/api/notes-mongodb';
      if (search) url += `?search=${encodeURIComponent(search)}`;
      if (isAuthenticated?.user?.id) url += (search ? '&' : '?') + `userId=${encodeURIComponent(isAuthenticated.user.id)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) setNotes(data.data || []);
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
    setAgentProgress(0);
    setProcessingStage('Starting pipeline…');

    try {
      // Convert file to base64 for agent pipeline
      const fileBuffer = await file.arrayBuffer();
      // Convert ArrayBuffer to base64 (browser-compatible)
      const bytes = new Uint8Array(fileBuffer);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      const base64File = btoa(binary);
      const sourceType = getSourceType(file);

      // Prepare input payload for Agent 1
      const inputPayload = {
        inputType: sourceType,
        fileName: file.name,
        fileData: base64File,
        mimeType: file.type,
        userId: isAuthenticated?.user?.id || 'anonymous',
      };

      // Start the 6-agent pipeline
      const result = await startNotesPipeline(inputPayload, (stage, message) => {
        setAgentProgress(stage);
        setProcessingStage(message);
      });

      if (result.success) {
        // Set current result with processed data
        const processedData = result.data || {};
        setCurrentResult({
          title: processedData.title || file?.name || 'Untitled Note',
          sourceType: processedData.sourceType || sourceType,
          transcript: processedData.transcript || '',
          summaryFormats: processedData.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] },
          revisionQA: Array.isArray(processedData.revisionQA) ? processedData.revisionQA : [],
          summaries: processedData.summaries || {},
          noteId: result.noteId,
        });
        
        // Set edited transcript for editing
        setEditedTranscript(processedData.transcript || '');
        
        // Reset chat messages for new result
        setChatMessages([]);
        
        // Reset processing state
        setFile(null);
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
        
        // Switch to result view with Summary tab active
        setResultTab('summary');
        setActiveView('result');
        
        toast.success('Notes generated and saved successfully!');
      } else {
        toast.error(result.error || 'Processing failed');
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
      }
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
      setProcessing(false);
      setAgentProgress(0);
      setProcessingStage('');
    }
  };

  const processText = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setProcessing(true);
    setAgentProgress(0);
    setProcessingStage('Starting pipeline…');

    try {
      // Prepare input payload for Agent 1
      const inputPayload = {
        inputType: 'text',
        textContent: textInput,
        userId: isAuthenticated?.user?.id || 'anonymous',
      };

      // Start the 6-agent pipeline
      const result = await startNotesPipeline(inputPayload, (stage, message) => {
        setAgentProgress(stage);
        setProcessingStage(message);
      });

      if (result.success) {
        // Set current result with processed data
        const processedData = result.data || {};
        setCurrentResult({
          title: processedData.title || textInput.substring(0, 50) + '...',
          sourceType: processedData.sourceType || 'text',
          transcript: processedData.transcript || textInput,
          summaryFormats: processedData.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] },
          revisionQA: Array.isArray(processedData.revisionQA) ? processedData.revisionQA : [],
          summaries: processedData.summaries || {},
          noteId: result.noteId,
        });
        
        // Set edited transcript for editing
        setEditedTranscript(processedData.transcript || textInput);
        
        // Reset processing state
        setTextInput('');
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
        
        // Switch to result view with Summary tab active
        setResultTab('summary');
        setActiveView('result');
        
        toast.success('Notes generated and saved successfully!');
      } else {
        toast.error(result.error || 'Processing failed');
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
      }
    } catch (error) {
      toast.error('Processing failed: ' + error.message);
      setProcessing(false);
      setAgentProgress(0);
      setProcessingStage('');
    }
  };

  const processYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setProcessing(true);
    setAgentProgress(0);
    setProcessingStage('Starting pipeline…');

    try {
      // Prepare input payload for Agent 1
      const inputPayload = {
        inputType: 'youtube',
        youtubeUrl: youtubeUrl.trim(),
        userId: isAuthenticated?.user?.id || 'anonymous',
      };

      // Start the 6-agent pipeline
      const result = await startNotesPipeline(inputPayload, (stage, message) => {
        setAgentProgress(stage);
        setProcessingStage(message);
      });

      if (result.success) {
        const processedData = result.data || {};
        const newCurrentResult = {
          title: processedData.title || 'YouTube Video',
          sourceType: processedData.sourceType || 'youtube',
          youtubeUrl: youtubeUrl.trim(),
          videoId: processedData.videoId || null,
          transcript: processedData.transcript || '',
          summaryFormats: processedData.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] },
          revisionQA: Array.isArray(processedData.revisionQA) ? processedData.revisionQA : [],
          summaries: processedData.summaries || {},
          noteId: result.noteId,
        };
        
        const summaryFormatsCheck = !!(newCurrentResult.summaryFormats && (newCurrentResult.summaryFormats.bulletNotes?.length > 0 || newCurrentResult.summaryFormats.topicWise?.length > 0 || newCurrentResult.summaryFormats.keyTakeaways?.length > 0));
        
        setCurrentResult(newCurrentResult);
        setEditedTranscript(processedData.transcript || '');
        setChatMessages([]);
        setYoutubeUrl('');
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
        
        let defaultTab = 'summary';
        if (!summaryFormatsCheck) defaultTab = 'transcript';
        setResultTab(defaultTab);
        setActiveView('result');
        
        toast.success('Notes generated and saved successfully!');
      } else {
        toast.error(result.error || 'YouTube processing failed');
        setProcessing(false);
        setAgentProgress(0);
        setProcessingStage('');
      }
    } catch (error) {
      toast.error('YouTube processing failed: ' + error.message);
      setProcessing(false);
      setAgentProgress(0);
      setProcessingStage('');
    }
  };

  const regenerateNotes = async () => {
    if (!editedTranscript.trim()) {
      toast.error('Transcript is empty');
      return;
    }
    setProcessing(true);
    setProcessingStage('summarizing');
    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedTranscript, sourceType: 'text' }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        const d = data.data;
        setCurrentResult({
          ...currentResult,
          transcript: editedTranscript,
          summaries: d.summaries || {},
          summaryFormats: d.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] },
          revisionQA: Array.isArray(d.revisionQA) ? d.revisionQA : [],
        });
        toast.success('Notes regenerated from edited transcript!');
        setResultTab('summary');
      } else {
        toast.error(data.error || 'Failed to regenerate notes');
      }
    } catch (error) {
      toast.error('Failed to regenerate notes: ' + error.message);
    } finally {
      setProcessing(false);
      setProcessingStage('');
    }
  };

  const saveNote = async () => {
    if (!currentResult) return;
    try {
      const response = await fetch('/api/notes-mongodb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentResult.title,
          sourceType: currentResult.sourceType,
          transcript: currentResult.transcript,
          summaryFormats: currentResult.summaryFormats || { bulletNotes: [], topicWise: [], keyTakeaways: [] },
          revisionQA: Array.isArray(currentResult.revisionQA) ? currentResult.revisionQA : [],
          userId: isAuthenticated?.user?.id || 'anonymous',
        }),
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
      const response = await fetch(`/api/notes-mongodb?id=${encodeURIComponent(firestoreId)}`, { method: 'DELETE' });

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

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !currentResult) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Add user message to chat
    setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      // Prepare context from current result
      const context = `
Title: ${currentResult.title}
Source Type: ${currentResult.sourceType}
Transcript: ${currentResult.transcript?.substring(0, 2000) || ''}
Summaries: ${JSON.stringify(currentResult.summaryFormats || {})}
// STRICT: revisionQA is NEVER included in chat context
`.trim();

      const query = `Answer this question based on the provided notes: "${userMessage}"

Notes Context:
${context}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
- Return ONLY plain text answer in 2-4 short paragraphs
- DO NOT return JSON objects or arrays
- DO NOT return summaryFormats, bulletNotes, topicWise, keyTakeaways
- DO NOT return revisionQA or Q&A arrays
- DO NOT include headings, markdown formatting, or sections like "Summary:", "Key Takeaways:", "Q&A:"
- DO NOT use bullet points (•), numbered lists, or structured formats
- Answer EXACTLY what was asked in natural, conversational plain text
- Keep response concise (2-4 paragraphs maximum)`;

      const agentData = await callOnDemandAgent('696a7c31c7d6dfdf7e337d33', {
        query,
        inputType: 'text',
        textContent: context,
        userId: isAuthenticated?.user?.id || 'anonymous',
      });

      if (agentData?.answer) {
        let answerContent = agentData.answer;
        
        // Step 1: Try to parse JSON and extract plain text from it
        try {
          const parsed = JSON.parse(answerContent);
          // If it's JSON, try to extract meaningful text
          if (typeof parsed === 'object') {
            // If it contains structured data, ignore it and use error message
            throw new Error('JSON detected, will clean as plain text');
          }
        } catch (e) {
          // Not JSON or JSON detected - continue with cleaning
        }
        
        // Step 2: Remove all markdown code blocks (JSON, code, etc.)
        answerContent = answerContent
          .replace(/```[\s\S]*?```/g, '') // Remove all code blocks
          .replace(/`[^`]+`/g, '') // Remove inline code
          .trim();
        
        // Step 3: Remove JSON-like structures (even if not valid JSON)
        answerContent = answerContent
          .replace(/\{[^}]*"summaryFormats"[^}]*\}/g, '')
          .replace(/\{[^}]*"revisionQA"[^}]*\}/g, '')
          .replace(/\{[^}]*"bulletNotes"[^}]*\}/g, '')
          .replace(/\{[^}]*"topicWise"[^}]*\}/g, '')
          .replace(/\{[^}]*"keyTakeaways"[^}]*\}/g, '')
          .trim();
        
        // Step 4: Remove all markdown headings and formatting
        answerContent = answerContent
          .replace(/^#{1,6}\s+/gm, '') // Remove markdown headings
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/\*\*Summary:\*\*/gi, '')
          .replace(/\*\*Key Takeaways:\*\*/gi, '')
          .replace(/\*\*Q&A:\*\*/gi, '')
          .replace(/\*\*Q\d+:\*\*/gi, '')
          .replace(/\*\*A:\*\*/gi, '')
          .replace(/^•\s+/gm, '') // Remove bullet points
          .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
          .replace(/^-\s+/gm, '') // Remove dash lists
          .trim();
        
        // Step 5: Clean up whitespace and newlines (keep paragraph breaks)
        answerContent = answerContent
          .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
          .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
          .trim();
        
        // Step 6: Extract only the first meaningful text block if JSON was embedded
        // If content still looks like structured data, extract first paragraph
        if (answerContent.includes('{') || answerContent.includes('[') || answerContent.length < 50) {
          // Try to extract first natural paragraph
          const paragraphs = answerContent.split(/\n\n+/).filter(p => {
            const clean = p.trim();
            return clean.length > 20 && 
                   !clean.startsWith('{') && 
                   !clean.startsWith('[') &&
                   !clean.includes('summaryFormats') &&
                   !clean.includes('revisionQA');
          });
          if (paragraphs.length > 0) {
            answerContent = paragraphs[0];
          }
        }
        
        // Step 7: Final validation - if still looks like JSON/structure, return simple message
        if (answerContent.includes('summaryFormats') || 
            answerContent.includes('revisionQA') || 
            answerContent.includes('bulletNotes') ||
            answerContent.trim().startsWith('{') ||
            answerContent.trim().startsWith('[')) {
          // Extract any natural language sentences before structured data
          const sentences = answerContent.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length > 0) {
            answerContent = sentences.slice(0, 3).join(' ').trim();
          }
        }
        
        // Ensure we have content
        if (!answerContent || answerContent.trim().length === 0) {
          answerContent = 'I apologize, but I could not generate a proper response. Please try rephrasing your question.';
        }
        
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: answerContent.trim() },
        ]);
      } else {
        throw new Error(agentData?.error || 'Failed to get response');
      }
    } catch (error) {
      toast.error('Failed to get AI response: ' + error.message);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
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
          {/* Header with Glassmorphism */}
          <header className="border-b border-purple-900/20 bg-black/30 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
            <div className="container mx-auto px-4 py-5">
              <div className="flex items-center justify-between">
                {/* Left: Logo + Navigation */}
                <div className="flex items-center gap-6">
                  <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300">
                    <div className="p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/50">
                      <Brain className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                        NoteRex
                      </h1>
                    </div>
                  </Link>
                  
                  {/* Center Navigation */}
                  <nav className="hidden md:flex items-center gap-4 ml-6">
                    <Button 
                      variant="ghost" 
                      onClick={() => router.push('/dashboard')}
                      className="relative text-purple-300 hover:text-white hover:bg-purple-900/20 transition-all duration-300 group"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                      {/* Hover underline effect */}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300"></span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setActiveView('notes')}
                      className="relative text-purple-300 hover:text-white hover:bg-purple-900/20 transition-all duration-300 group"
                    >
                      My Notes
                      {/* Hover underline effect */}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-fuchsia-400 group-hover:w-full transition-all duration-300"></span>
                    </Button>
                  </nav>
                </div>

                {/* Right: Auth Buttons */}
                <div className="flex items-center gap-3">
                  {isAuthenticated ? (
                    <Button 
                      variant="ghost"
                      onClick={logout}
                      className="text-purple-300 hover:text-white hover:bg-purple-900/20 transition-all duration-300"
                    >
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="ghost" 
                        onClick={() => router.push('/login')}
                        className="relative text-purple-300 hover:text-white hover:bg-purple-900/20 transition-all duration-300 group"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Login</span>
                        {/* Hover glow effect */}
                        <span className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/10 rounded-md transition-all duration-300 blur-sm"></span>
                      </Button>
                      <Button 
                        onClick={() => router.push('/signup')}
                        className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.03]"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Sign Up</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* 3D Hero Section */}
          <Hero3D onUploadClick={handleUploadClick} />

          {/* Project Impact Section */}
          <ProjectImpact />

          {/* Features Section - Enhanced with Animations */}
          <FeaturesSection />

          {/* How to Use Video Section - Fade-in on scroll only */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="container mx-auto px-4 pb-40"
          >
            <div className="max-w-5xl mx-auto space-y-12 text-center">
              <div className="space-y-6">
                <h3 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
                  How to Use NoteRex
                </h3>
                <p className="text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  Watch how easy it is to transform your content into smart notes
                </p>
              </div>
              
              {/* Video - Fully Config-Driven */}
              <div className="relative aspect-video w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/30 bg-gradient-to-br from-purple-950/50 to-black backdrop-blur-sm">
                {landingConfig.howToVideo.type === 'youtube' && landingConfig.howToVideo.src ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${landingConfig.howToVideo.src}`}
                    title="How to Use NoteRex"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                ) : landingConfig.howToVideo.type === 'local' && landingConfig.howToVideo.src ? (
                  <video
                    src={landingConfig.howToVideo.src}
                    controls
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Video failed to load - show fallback
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : null}
                {/* Fallback container - shown if video src is invalid or not configured */}
                {(!landingConfig.howToVideo.src || 
                  (landingConfig.howToVideo.type === 'local' && !landingConfig.howToVideo.src?.startsWith('/'))) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center shadow-2xl shadow-purple-500/50">
                        <Play className="w-10 h-10 text-white ml-1" />
                      </div>
                      <p className="text-gray-400 text-lg">Video coming soon</p>
                      <p className="text-gray-500 text-sm">Configure video in landingConfig.howToVideo</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Step-by-Step Roadmap */}
          <StepRoadmapSection />

          {/* Footer CTA */}
          <section className="container mx-auto px-4 pb-32">
            <div className="max-w-5xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-900/60 via-fuchsia-900/60 to-purple-900/60 border-purple-500/50 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.4),rgba(236,72,153,0.2),rgba(168,85,247,0))]"></div>
                <CardContent className="pt-20 pb-20 px-8 relative z-10">
                  <div className="text-center space-y-8">
                    <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
                      Ready to Transform Your Content?
                    </h3>
                    <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto leading-relaxed">
                      Start creating smart notes with AI-powered transcription and summarization
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                      <Button 
                        size="lg"
                        onClick={() => handleUploadClick('video')}
                        className="text-xl px-12 py-8 bg-white text-purple-900 hover:bg-purple-50 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 rounded-xl font-semibold"
                      >
                        Get Started Free
                        <ArrowRight className="w-6 h-6 ml-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-purple-900/20 bg-black/40 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-16">
              <div className="max-w-7xl mx-auto space-y-12">
                {/* Main Footer Content - 4 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                  {/* Column 1: Brand */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-xl shadow-lg shadow-purple-500/50">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                          NoteRex
                        </h4>
                        <p className="text-sm text-gray-400">Powered by Whisper + Gemini</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Transform your content into smart notes with AI-powered transcription and summarization.
                    </p>
                    {/* Social Icons */}
                    <div className="flex items-center gap-3 pt-2">
                      <a 
                        href="https://twitter.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-500/30 flex items-center justify-center hover:bg-purple-900/50 hover:border-purple-400/50 transition-all duration-300 hover:scale-110"
                        aria-label="Twitter"
                      >
                        <Twitter className="w-5 h-5 text-purple-300" />
                      </a>
                      <a 
                        href="https://youtube.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-500/30 flex items-center justify-center hover:bg-purple-900/50 hover:border-purple-400/50 transition-all duration-300 hover:scale-110"
                        aria-label="YouTube"
                      >
                        <Youtube className="w-5 h-5 text-purple-300" />
                      </a>
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-500/30 flex items-center justify-center hover:bg-purple-900/50 hover:border-purple-400/50 transition-all duration-300 hover:scale-110"
                        aria-label="GitHub"
                      >
                        <Github className="w-5 h-5 text-purple-300" />
                      </a>
                    </div>
                  </div>

                  {/* Column 2: Product */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white">Product</h5>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Features</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Pricing</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">How It Works</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Use Cases</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">API</a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 3: Resources */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white">Resources</h5>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Documentation
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" />
                          Help Center
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Blog</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Tutorials</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Community</a>
                      </li>
                    </ul>
                  </div>

                  {/* Column 4: Company */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-white">Company</h5>
                    <ul className="space-y-3 text-sm text-gray-400">
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">About</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact
                        </a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Privacy Policy</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Terms of Service</a>
                      </li>
                      <li>
                        <a href="#" className="hover:text-purple-300 transition-colors cursor-pointer">Security</a>
                      </li>
                    </ul>
                    {/* Features Badge */}
                    <div className="pt-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs text-purple-300">Privacy First</span>
                        <span className="px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs text-purple-300">No Storage Costs</span>
                        <span className="px-3 py-1 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs text-purple-300">AI Powered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Copyright */}
                <div className="pt-8 border-t border-purple-900/20">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500">
                      © 2025 NoteRex. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-600">
                      Built with ❤️ using Next.js, Whisper, and Gemini
                    </p>
                  </div>
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
            {/* Left: Logo + Navigation */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveView('landing')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    NoteRex
                  </h1>
                  <p className="text-sm text-muted-foreground">AI-Powered Note Generation</p>
                </div>
              </button>
              
              {/* Center Navigation */}
              <nav className="hidden md:flex items-center gap-3 ml-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveView('notes')}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                >
                  My Notes
                </Button>
              </nav>
            </div>

            {/* Right: Auth Buttons */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs hidden lg:block">
                
              </Badge>
              {isAuthenticated ? (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  Logout
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/login')}
                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Login</span>
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => router.push('/signup')}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Sign Up</span>
                  </Button>
                </>
              )}
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
              {/* Agent Progress Display */}
              {processing && agentProgress > 0 && (
                <div className="py-6">
                  <AgentProgress currentStage={agentProgress} />
                </div>
              )}
              
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
                            {processingStage === 'transcribing' ? 'Transcribing...' : 'Summarizing...'}
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
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Header with Save Button */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{currentResult.title}</h3>
                        <p className="text-sm text-muted-foreground">Source: {currentResult.sourceType}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setActiveView('upload')}>
                          New Upload
                        </Button>
                        <Button onClick={saveNote}>
                          <Save className="w-4 h-4 mr-2" />
                          Save to Notes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabbed Interface */}
                <Tabs value={resultTab} onValueChange={setResultTab} className="w-full">
                  <TabsList className={`grid w-full ${currentResult.videoId ? 'grid-cols-6' : 'grid-cols-5'}`}>
                    {currentResult.videoId && (
                      <TabsTrigger value="video">
                        <Youtube className="w-4 h-4 mr-2" />
                        Video
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="summary" disabled={!currentResult.summaryFormats || (!currentResult.summaryFormats.bulletNotes?.length && !currentResult.summaryFormats.topicWise?.length && !currentResult.summaryFormats.keyTakeaways?.length)}>
                      <Brain className="w-4 h-4 mr-2" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="qa" disabled={!currentResult.revisionQA?.length}>
                      <MessageSquareQuote className="w-4 h-4 mr-2" />
                      Q&A
                    </TabsTrigger>
                    <TabsTrigger value="transcript">
                      <FileText className="w-4 h-4 mr-2" />
                      Transcript
                    </TabsTrigger>
                    <TabsTrigger value="chat">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </TabsTrigger>
                  </TabsList>

                  {/* Video Tab */}
                  {currentResult.videoId && (
                    <TabsContent value="video" className="space-y-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="aspect-video w-full">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${currentResult.videoId}`}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="rounded-lg"
                            ></iframe>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  )}

                  {/* Transcript Tab with Editing */}
                  <TabsContent value="transcript" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Full Transcript</CardTitle>
                          <Button 
                            onClick={regenerateNotes} 
                            disabled={processing}
                            variant="outline"
                            size="sm"
                          >
                            {processing && processingStage === 'summarizing' ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Regenerating...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Regenerate Notes
                              </>
                            )}
                          </Button>
                        </div>
                        <CardDescription>
                          Edit the transcript and click "Regenerate Notes" to create new summaries
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea
                          value={editedTranscript}
                          onChange={(e) => setEditedTranscript(e.target.value)}
                          rows={20}
                          className="font-mono text-sm"
                          placeholder="Transcript will appear here..."
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Summary Tab */}
                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Bullet Points */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <ListChecks className="w-5 h-5 text-indigo-600" />
                            Bullet Notes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-96 w-full">
                            <div className="space-y-3 text-sm">
                              {currentResult.summaryFormats?.bulletNotes?.length > 0 ? (
                                currentResult.summaryFormats.bulletNotes.map((point, index) => (
                                  <div key={index} className="flex gap-2">
                                    <span className="font-semibold">{index + 1}.</span>
                                    <span className="whitespace-pre-wrap">{point}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground">No bullet notes available.</p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      {/* Topics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Brain className="w-5 h-5 text-purple-600" />
                            Topic-Wise Structure
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-96 w-full">
                            <div className="space-y-4 text-sm">
                              {currentResult.summaryFormats?.topicWise?.length > 0 ? (
                                currentResult.summaryFormats.topicWise.map((topic, index) => (
                                  <div key={index} className="border rounded-lg p-4 bg-muted/40">
                                    <h4 className="font-semibold text-base mb-2">
                                      Topic {index + 1}
                                    </h4>
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                      {topic}
                                    </p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground">No topic-wise structure available.</p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>

                      {/* Key Takeaways */}
                      <Card className="md:col-span-2">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                            Key Takeaways
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="h-64 w-full">
                            <div className="space-y-3 text-sm">
                              {currentResult.summaryFormats?.keyTakeaways?.length > 0 ? (
                                currentResult.summaryFormats.keyTakeaways.map((item, index) => (
                                  <div key={index} className="flex gap-2">
                                    <span className="font-semibold">✓</span>
                                    <span className="whitespace-pre-wrap">{item}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground">No key takeaways available.</p>
                              )}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Q&A Tab */}
                  <TabsContent value="qa" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MessageSquareQuote className="w-5 h-5 text-amber-600" />
                          Revision Q&A
                        </CardTitle>
                        <CardDescription>Question and answer pairs for exam preparation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px] w-full">
                          <div className="space-y-4">
                            {currentResult.revisionQA?.length > 0 ? (
                              currentResult.revisionQA.map((qa, i) => (
                                <div key={i} className="border rounded-lg p-4 bg-muted/40">
                                  <p className="font-semibold text-primary mb-2">Q: {(qa.question || qa.q || '').trim() || 'Question'}</p>
                                  <p className="text-muted-foreground whitespace-pre-wrap">A: {(qa.answer || qa.a || '').trim() || 'Answer'}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground">No Q&A pairs available.</p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Chat Tab */}
                  <TabsContent value="chat" className="space-y-4">
                    <Card className="flex flex-col h-[600px]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <MessageSquare className="w-5 h-5 text-blue-600" />
                          Chat with Your Notes
                        </CardTitle>
                        <CardDescription>
                          Ask questions about your notes and get AI-powered answers
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-4">
                        {/* Chat Messages */}
                        <ScrollArea className="flex-1 w-full border rounded-lg p-4 bg-muted/20">
                          <div className="space-y-4">
                            {chatMessages.length === 0 ? (
                              <div className="text-center text-muted-foreground py-8">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Start a conversation about your notes!</p>
                                <p className="text-sm mt-2">Try asking: "What are the main topics?" or "Explain the key takeaways"</p>
                              </div>
                            ) : (
                              chatMessages.map((msg, index) => (
                                <div
                                  key={index}
                                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg p-3 ${
                                      msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                    }`}
                                  >
                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            {chatLoading && (
                              <div className="flex justify-start">
                                <div className="bg-muted text-foreground rounded-lg p-3">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                        {/* Chat Input */}
                        <div className="flex gap-2">
                          <Input
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey && !chatLoading) {
                                e.preventDefault();
                                handleChatSubmit();
                              }
                            }}
                            placeholder="Ask a question about your notes..."
                            disabled={chatLoading}
                            className="flex-1"
                          />
                          <Button
                            onClick={handleChatSubmit}
                            disabled={!chatInput.trim() || chatLoading}
                          >
                            {chatLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
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