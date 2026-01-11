# NoteForge AI 🧠✨

**AI-Powered Note Generation Platform**

Transform audio, video, PDFs, and text into intelligent, structured summaries using cutting-edge AI technology.

## 🚀 Features

### Multi-Format Input Support
- **Audio Files**: MP3, WAV, AAC, etc.
- **Video Files**: MP4, AVI, MOV, etc.
- **PDF Documents**: Extract and summarize text
- **Plain Text**: Direct text input or TXT files
- **YouTube URLs**: (Coming soon)

### AI-Powered Processing
- **Speech-to-Text**: OpenAI Whisper for accurate transcription
- **Intelligent Summarization**: Gemini 2.0 Flash for advanced analysis

### 4 Summary Formats
1. **Bullet-Point Notes**: Key points in concise bullets
2. **Topic-Wise Structure**: Organized by main topics and subtopics
3. **Key Takeaways**: 3-5 most important insights
4. **Q&A for Revision**: Study-ready question-answer pairs

### Smart Storage
- **Firestore Database**: Store all notes, transcripts, and summaries
- **In-Memory Processing**: No file storage costs - process and delete
- **Search Functionality**: Find notes quickly
- **Note Management**: View and delete notes

## 🏗️ Tech Stack

### Frontend
- **Next.js 14**: App Router with React Server Components
- **Tailwind CSS**: Modern, responsive styling
- **shadcn/ui**: Beautiful, accessible UI components
- **Lucide Icons**: Clean, consistent iconography

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **OpenAI Whisper**: State-of-the-art speech recognition
- **Google Gemini 2.0**: Advanced text understanding and generation
- **Firebase Firestore**: Scalable NoSQL database

### Libraries
- `openai`: OpenAI API client
- `@google/generative-ai`: Google Gemini API client
- `firebase`: Firebase SDK
- `pdf-parse`: PDF text extraction
- `busboy`: Multipart form data parsing
- `ytdl-core`: YouTube video processing (future feature)

## 📁 Project Structure

```
/app
├── app/
│   ├── api/
│   │   └── [[...path]]/
│   │       └── route.js          # All API endpoints
│   ├── page.js                   # Main UI component
│   ├── layout.js                 # Root layout with metadata
│   └── globals.css               # Global styles
├── lib/
│   ├── firebase.js               # Firestore configuration
│   ├── openai.js                 # OpenAI client setup
│   └── gemini.js                 # Gemini AI client setup
├── components/
│   └── ui/                       # shadcn/ui components
├── .env                          # Environment variables
└── package.json                  # Dependencies
```

## 🔧 Setup Instructions

### 1. Environment Variables

Create or update `.env` file with the following:

```env
# Emergent LLM Key (for OpenAI Whisper & Gemini)
EMERGENT_LLM_KEY=your_emergent_llm_key_here

# Firebase Firestore Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database**:
   - Click "Firestore Database" → "Create database"
   - Start in **test mode** (for development)
   - Select your preferred location
4. Get your Firebase config:
   - Project Settings → Your apps → Web app
   - Copy the configuration values to `.env`

### 3. Install Dependencies

```bash
yarn install
```

### 4. Run Development Server

```bash
yarn dev
```

The app will be available at `http://localhost:3000`

## 🎯 How to Use

### Upload & Process Files

1. **Select Input Method**:
   - Click on file type card (Audio, Video, PDF, Text)
   - Or paste text directly
   - Or enter YouTube URL (coming soon)

2. **Process**:
   - Click "Process File" or "Generate Summary"
   - Wait for AI processing (transcription + summarization)

3. **Review Results**:
   - View full transcript
   - See 4 different summary formats
   - Each optimized for different use cases

4. **Save to Notes**:
   - Click "Save to Notes" to store in Firestore
   - Access anytime from "My Notes" tab

### Manage Notes

- **View All Notes**: Switch to "My Notes" tab
- **Search**: Use the search bar to find specific notes
- **Delete**: Click trash icon to remove notes

## 🔄 API Endpoints

### POST `/api/process`
Process files or text and generate summaries

**For file upload:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file`, `sourceType`
- Response: `{ success, data: { title, sourceType, transcript, summaries } }`

**For text input:**
- Method: `POST`
- Content-Type: `application/json`
- Body: `{ text, sourceType: 'text' }`
- Response: `{ success, data: { title, sourceType, transcript, summaries } }`

### POST `/api/notes`
Save note to Firestore
- Method: `POST`
- Body: `{ title, sourceType, transcript, summaries }`
- Response: `{ success, data: { ...noteData, firestoreId } }`

### GET `/api/notes`
Fetch all notes or search
- Method: `GET`
- Query params: `?search=query` (optional)
- Response: `{ success, data: [notes] }`

### DELETE `/api/notes/:id`
Delete a note
- Method: `DELETE`
- Path: `/api/notes/{firestoreId}`
- Response: `{ success }`

## 🎨 Design System

### Colors
- **Primary**: Indigo/Purple gradient
- **Accent**: Pink, Teal, Yellow for different features
- **Background**: Soft gradient (indigo-50 → purple-50 → pink-50)

### Components
All UI components are from **shadcn/ui**:
- Button, Card, Input, Textarea
- Tabs, ScrollArea, Badge, Separator
- Toast notifications via Sonner

### Typography
- Font: Inter (Google Fonts)
- Responsive, accessible text sizing

## 🔒 Security & Privacy

### In-Memory Processing
- Files are processed in memory only
- Immediately deleted after transcription
- No file storage = no storage costs or security risks

### Firestore Security
- Currently in test mode (development)
- **Production**: Enable authentication and security rules

Example security rules for production:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /notes/{noteId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
Make sure to add all `.env` variables in your hosting platform:
- `EMERGENT_LLM_KEY`
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

## 🛠️ Troubleshooting

### Server won't start
```bash
# Check logs
tail -n 50 /var/log/supervisor/nextjs.out.log

# Restart server
sudo supervisorctl restart nextjs
```

### Missing dependencies
```bash
yarn install
```

### Firebase errors
- Verify all Firebase env variables are set correctly
- Check Firestore is enabled in Firebase Console
- Ensure security rules allow access

### API errors
- Check `.env` has valid API keys
- Verify Emergent LLM key has access to OpenAI and Gemini
- Check network connectivity

## 📝 Future Enhancements

- [ ] YouTube video processing
- [ ] User authentication
- [ ] Note sharing and collaboration
- [ ] Export notes (PDF, Markdown)
- [ ] Tags and categories
- [ ] Advanced search with filters
- [ ] Mobile app
- [ ] Browser extension
- [ ] Batch processing
- [ ] Custom AI prompts

## 🤝 Contributing

This is an MVP/hackathon project. Feel free to fork and extend!

## 📄 License

MIT License - feel free to use for your projects!

---

**Built with ❤️ using Next.js, OpenAI Whisper, and Google Gemini 2.0**
