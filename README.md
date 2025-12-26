# Arxiv AI Agent - FastAPI Backend

A FastAPI backend that uses AI agents to curate and explain research papers from Arxiv.

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/fastapi)

## Environment Variables

Set these in Railway dashboard:

- `GROQ_API_KEY` - Your Groq API key (required)
- `PORT` - Automatically set by Railway

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export GROQ_API_KEY=your_key_here

# Run server
python src/agent.py
```

## API Endpoints

- `GET /api/latest` - Get latest research notification
- `POST /api/config` - Update research frequency

## Tech Stack

- FastAPI - Web framework
- Phidata - Agent orchestration  
- Groq - LLM provider
- Arxiv API - Research papers
