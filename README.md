# 🎓 Multimodal AI Lecture Summarizer - NoteRex

> **An end-to-end full-stack AI platform that converts videos, audio, PDFs, and text into structured, intelligent study notes using multimodal AI fusion.**

This system understands content the way humans do — by **listening to explanations, reading slides/boards, and combining everything into clean, structured knowledge**.

---

## 🧠 What Makes This Different?

Most summarizers only work on text or audio.

**This platform fuses multiple modalities:**
- 🎤 Spoken explanations (audio)
- 👁️ Visual text from slides & boards (OCR)
- 📝 Subtitles (fallback)
- 📄 PDFs & plain text

➡️ Result: **More accurate notes, formulas preserved, better learning outcomes.**

---

## 🚀 Key Features

### 🔹 Multi-Format Input
- 🎥 YouTube videos *(user-provided URLs)*
- 📹 Uploaded video files
- 🎧 Audio files (MP3, WAV, etc.)
- 📄 PDF documents
- 📝 Plain text input

### 🔹 Multimodal AI Processing
- **Whisper** for speech-to-text
- **OpenCV + SSIM** for smart frame selection
- **EasyOCR** for slides, formulas & handwritten text
- **Subtitle fallback** when audio/visual is unclear
- **Timestamp-aligned fusion engine**

### 🔹 AI-Generated Outputs
- 📌 Bullet-point notes
- 🧩 Topic-wise structured notes
- ⭐ Key takeaways
- ❓ Q&A for revision
- 🧮 Formulas & definitions
- ⏱️ Timestamped topic changes

### 🔹 Notes Management
- Save notes to Firestore
- Search & view previous notes
- Delete anytime
- Text-only storage (privacy-first)

---

## ⚖️ Terms of Service & Privacy Compliance

This project is **TOS-safe and privacy-focused**:

✅ Temporary media processing only  
✅ No video/audio storage  
✅ No redistribution of YouTube content  
✅ User-provided URLs only  
✅ Transformative use (notes, summaries)  
✅ Text-only outputs stored  

> Media files are processed **in memory and deleted immediately** after analysis.

---

## 🏗️ System Architecture

```
Frontend (Next.js + Tailwind)
    ↓
API Gateway (Next.js API Routes)
    ↓
Processing Orchestrator
    ↓
Multimodal Pipelines
    ├─ Audio → Whisper
    ├─ Video → OpenCV + OCR
    ├─ Subtitles → Fallback
    ↓
Multimodal Fusion Engine
    ↓
LLM Reasoning (Gemini / GPT)
    ↓
Structured Notes (Markdown)
    ↓
Firestore Storage
```

---

## 🧩 Tech Stack

### Frontend
- **Next.js 14 (App Router)**
- React 18
- Next.js
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### Backend
- Next.js API Routes
- Node.js 18+
- FFmpeg

### Multimodal AI
- yt-dlp (YouTube extraction)
- OpenAI Whisper (speech-to-text)
- OpenCV (frame extraction)
- scikit-image (SSIM)
- EasyOCR (visual text)
- YouTubeTranscriptApi

### LLM
- **Google Gemini 2.0 Flash**
- *(Optional)* GPT-4 / GPT-5

### Database & Auth
- Firebase Firestore
- Firebase Auth

### DevOps
- Vercel (frontend & APIs)
- Docker *(for heavy processing – optional)*

---

## 📁 Project Structure

```
/app
├── app/
│   ├── api/
│   │   └── [[...path]]/route.js   # Backend APIs
│   ├── page.js                   # Main UI
│   ├── layout.js                 # Root layout
│   └── globals.css               # Styles
├── lib/
│   ├── firebase.js               # Firestore config
│   ├── gemini.js                 # Gemini client
│   ├── whisper.js                # Whisper wrapper
├── components/
│   └── ui/                       # shadcn/ui components
├── python/
│   ├── audio_pipeline.py
│   ├── video_pipeline.py
│   ├── fusion_engine.py
│   └── ocr_utils.py
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/multimodal-ai-notes.git
cd multimodal-ai-notes
```

### 2️⃣ Environment Variables

Create a `.env` file in the root:

```env
# LLM Keys
GOOGLE_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_key

# Firebase
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 3️⃣ Install Frontend Dependencies

```bash
npm install
```

### 4️⃣ Python Environment (for multimodal processing)

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

**Required system dependency:**
👉 Install FFmpeg and add it to PATH.

### 5️⃣ Run Development Server

```bash
npm run dev
```

App will run at:

```
http://localhost:3000
```

---

## 🧪 API Endpoints

### `POST /api/process`

Processes uploaded files or text.

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Lecture Title",
    "transcript": "...",
    "summaries": {
      "bullets": [],
      "topics": [],
      "takeaways": [],
      "qa": []
    }
  }
}
```

### `POST /api/notes`

Save generated notes to Firestore.

### `GET /api/notes`

Fetch or search saved notes.

### `DELETE /api/notes/:id`

Delete a saved note.

---

## 🔐 Security Notes

- Media files are never stored
- Firestore rules required for production
- Enable Firebase Auth before public deployment

**Example Firestore Rule:**
```
allow read, write: if request.auth != null;
```

---

## 📊 Performance Tips

- Increase frame interval (5–10s) → faster
- Decrease frame interval (2–3s) → more accurate
- Disable OCR for low-memory systems

---

## 🎯 Use Cases

- University lectures
- Online courses
- Technical tutorials
- Webinars
- Exam revision
- Self-learning

---

## 🔮 Future Enhancements

- [ ] Topic-wise segmentation
- [ ] Quiz generation
- [ ] PDF / Markdown export
- [ ] Batch video processing
- [ ] User collaboration
- [ ] Mobile app
- [ ] Browser extension

---

## 🏆 Why This Project Stands Out

✔ Real multimodal AI  
✔ Full-stack implementation  
✔ TOS-compliant  
✔ Scalable architecture  
✔ Hackathon & production ready

---

## 📄 License

MIT License  
Free to use, modify, and distribute.

---

## 🙌 Acknowledgments

- OpenAI Whisper
- Google Gemini
- EasyOCR
- Streamlit (prototyping)
- Firebase
- Open-source community

---

**Built with ❤️ for students, educators, and lifelong learners.**  
🧠✨ Turn content into knowledge.

