# MiniMax Image Studio

Web app wrapping [minimax_image_gen.py](https://github.com/MiniMax-Organization/MiniMax/blob/main/minimax_image_gen.py) with a FastAPI backend and a Next.js frontend.

## Features

- Text-to-image and image-to-image generation via MiniMax API
- Configurable model (`image-01`, `image-01-live`), aspect ratio, seed, and batch size
- Drag-and-drop reference image upload for img2img mode
- Responsive two-panel UI (prompt + settings left, output right)

## Tech stack

| Layer | Framework | Port |
|-------|-----------|------|
| Frontend | Next.js 16 (React 19) | 3000 |
| Backend | FastAPI + Uvicorn | 8000 |

## How to run locally

### Prerequisites

- Node.js 20+ and npm
- Python 3.10+
- A [MiniMax API key](https://platform.minimax.io/)

### 1. Configure the API key

Create or edit `~/.hermes/.env` and add:

```
MINIMAX_API_KEY=your_key_here
```

### 2. Install dependencies

```bash
make install
```

Or separately:

```bash
make install-backend   # pip install -r backend/requirements.txt
make install-frontend  # npm install --prefix frontend
```

### 3. Start both services

```bash
make dev
```

This starts the backend on **http://localhost:8000** and the frontend on **http://localhost:3000**. The Next.js dev server proxies `/api/generate` → `http://localhost:8000/generate` via a rewrite rule.

### Using Docker Compose

```bash
MINIMAX_API_KEY=your_key_here docker compose up
```

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## Project structure

```
.
├── backend/
│   ├── main.py          # FastAPI app (GET /, POST /generate)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   ├── components/  # InputPanel, OutputPanel
│   │   └── lib/api.ts   # API client
│   ├── next.config.js   # Rewrites /api/generate → backend:8000
│   └── package.json
├── Makefile             # dev helpers
├── docker-compose.yml   # both services
├── SPEC.md              # full feature spec
└── README.md
```

## API

### `POST /generate`

**Text-to-image**

```json
{
  "model": "image-01",
  "prompt": "A sunset over the ocean",
  "aspect_ratio": "16:9",
  "n": 2,
  "response_format": "url"
}
```

**Image-to-image** (with reference images)

Send as `multipart/form-data` with `reference_images` files and the same text fields.

Response:

```json
{
  "model": "image-01",
  "aspect_ratio": "16:9",
  "n": 2,
  "image_base64": ["...", "..."]
}
```

Or with references: `image_urls: ["https://..."]`.

### `GET /`

Health check — returns `{"status": "ok"}`.

## Testing

```bash
make test   # npm run lint --prefix frontend
```
