# 3D Snake Game - Running Guide

This guide explains how to run the 3D Snake Game in development mode.

## Architecture Overview

The game uses a **client-side game engine** architecture:

- **Frontend (`client/`)**: React + Vite + Three.js for rendering
  - All game logic (movement, collision, food spawning) runs locally in the browser
  - Zero network latency for moves

- **Backend (`src/`)**: FastAPI server with minimal responsibilities
  - `/api/apple`: Generates food positions not on snake body
  - `/api/score`: Saves/retrieves best scores (persisted to `data/high_scores.json`)
  - `/ws/game`: WebSocket for apple sync and score reporting

## Prerequisites

- **Python 3.12+** with [uv](https://github.com/astral-sh/uv) installed
- **Node.js 18+** with [pnpm](https://pnpm.io/) installed

## Quick Start

### 1. Install Backend Dependencies

```bash
uv sync
```

### 2. Install Frontend Dependencies

```bash
cd client
pnpm install
cd ..
```

### 3. Run the Development Servers

You need **two terminals** running side by side:

#### Terminal 1: Start the Backend Server

```bash
uv run python -m src.main
```

This starts the FastAPI server at `http://localhost:8000` with:
- Auto-reload enabled (restarts on code changes)
- API docs at `/docs`
- WebSocket support at `/ws/game`

#### Terminal 2: Start the Frontend Dev Server

```bash
cd client
pnpm dev
```

This starts Vite's development server (usually at `http://localhost:5173`).

### 4. Open the Game

Open your browser and navigate to:
```
http://localhost:5173
```

Click **"Start Game"** to begin playing!

## Controls

- **Arrow Keys**: Move the snake (Up, Down, Left, Right)
- The game automatically restarts when you get a game over

## What Happens on Start?

1. Frontend creates initial game state locally using `GameEngine`
2. Snake starts at center, pointing right, length 3
3. Food spawns randomly not on snake body
4. WebSocket connects to backend for apple sync and score reporting

## Game Flow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client    │     │   Backend    │     │   Storage    │
│   (React)   │────▶│  (FastAPI)   │     │  (JSON file) │
└─────────────┘     └──────────────┘     └──────────────┘
      │                    │                     │
      │  Start Game        │                     │
      │───────────────────▶│                     │
      │                    │                     │
      │  Local move        │                     │
      │◀───────────────────│                     │
      │   (0ms latency)    │                     │
      │                    │                     │
      │  Eat food →        │                     │
      │  Request apple     │                     │
      │───────────────────▶│                     │
      │                    │  Generate position  │
      │◀───────────────────│────────────────────▶│
      │                    │                     │
      │  Score on Game Over│                     │
      │───────────────────▶│                     │
      │                    │  Save best score    │
      │◀───────────────────│────────────────────▶│
```

## Testing

Run tests with:

```bash
uv run pytest -v
```

Or run with coverage and watch mode:

```bash
uv run pytest --cov=src --cov-report=term-missing -v
```

## Quality Gate

Before committing, run the quality gate:

```bash
./scripts/quality_gate.sh
```

This checks:
- Linting & formatting (Ruff)
- Type checking (Ty)
- Dead code detection (Vulture)
- Security scanning (detect-secrets)
- Tests with 80% coverage minimum

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, set a different port:

```bash
SNAKE_PORT=8001 uv run python -m src.main
```

### Frontend Can't Connect to Backend

Ensure the backend server is running before starting the frontend. The WebSocket tries to connect immediately on mount.

### CORS Errors

The server allows all origins in development. If you see CORS errors, check that:
1. Backend is running on expected port (default 8000)
2. Frontend is running via `pnpm dev` (not just opening `index.html`)

## Production Build

To create a production build:

```bash
# Build frontend
cd client
pnpm build

# Run backend with uvicorn directly
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

The frontend will be served from `client/dist/`. Note that in production, you may want to configure CORS origins properly.
