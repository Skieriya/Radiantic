# Arxiv AI Agent PWA

A Progressive Web App that uses AI agents to curate and explain the latest AI research papers from Arxiv.

## Features

- 🤖 **3-Agent Pipeline**: Researcher → Teacher → Designer
- 📱 **PWA**: Installable on any device
- 🔔 **Smart Notifications**: Get notified when new papers are found
- 💡 **Simple Explanations**: Complex research explained with analogies
- ⏱️ **Customizable Frequency**: Control how often to check for new papers
- 📚 **Persistent History**: All notifications saved locally

## Tech Stack

### Frontend
- **Vite** - Build tool
- **Vanilla JavaScript** - No framework overhead
- **PWA** - Service worker for offline support
- **Glassmorphism UI** - Modern, premium design

### Backend
- **FastAPI** - Python web framework
- **Phidata** - Agent orchestration
- **Arxiv API** - Research paper source
- **Local LLM** - Llama 3.2 via Ollama (dev) / OpenAI (prod)

## Local Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Ollama (for local LLM)

### Setup

1. **Install dependencies**
```bash
npm install
pip install -r requirements.txt
```

2. **Start Ollama** (if using local model)
```bash
ollama serve
ollama pull llama3.2
```

3. **Run backend**
```bash
python src/agent.py
```

4. **Run frontend**
```bash
npm run dev
```

5. **Open** http://localhost:5173

## Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Railway/Render)
- Push to GitHub
- Connect repository to Railway/Render
- Set environment variables (if using OpenAI)
- Deploy

## Environment Variables

For production deployment with OpenAI:

```env
OPENAI_API_KEY=your_api_key_here
```

## License

MIT

## Author

Built with ❤️ using Agentic AI
