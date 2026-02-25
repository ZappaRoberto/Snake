# 🐍 Pixel Art Snake Game

A modern, 3D pixel art Snake game built with React, Three.js, and FastAPI. Features difficulty presets, local game engine for zero-latency gameplay, and real-time apple synchronization.

![Game Screenshot](docs/screenshot.png)

## ✨ Features

- **Pixel Art Rendering**: Sharp, retro-style graphics using BoxGeometry with NearestFilter
- **Difficulty Presets**: Choose from Easy, Medium, or Hard difficulty levels
  - Speed increases as you eat more apples (dynamic difficulty)
- **Local Game Engine**: All movement and collision logic runs locally for instant response
- **Real-time Sync**: WebSocket connection keeps food position synchronized across clients
- **Score Tracking**: Best scores are saved and persisted
- **Responsive Layout**: Full-screen experience that adapts to your browser window

## 🚀 Quick Start

### Prerequisites

- Python 3.12+ with [uv](https://github.com/astral-sh/uv) installed
- Node.js 18+ with [pnpm](https://pnpm.io/) installed

### Installation & Running

```bash
# Install backend dependencies
uv sync

# Install frontend dependencies
cd client && pnpm install && cd ..

# Terminal 1: Start the backend server
uv run python -m src.main

# Terminal 2: Start the frontend dev server
cd client && pnpm dev

# Open http://localhost:5173 in your browser
```

## 🎮 How to Play

### Starting the Game

1. Open the game at `http://localhost:5173`
2. Select a difficulty level:
   - **Easy**: Slow speed (250ms base), gradual acceleration
   - **Medium**: Normal speed (200ms base), moderate acceleration
   - **Hard**: Fast speed (150ms base), rapid acceleration
3. Click **"Start Game"**

### Controls

| Key | Action |
|-----|--------|
| ⬆️ Arrow Up | Move up |
| ⬇️ Arrow Down | Move down |
| ⬅️ Arrow Left | Move left |
| ➡️ Arrow Right | Move right |

### Gameplay Rules

- **Goal**: Eat apples to grow and score points
- **Apple**: +10 points per apple eaten
- **Game Over**: Collision with walls or snake body
- **Restart**: Click "Restart Game" after game over

### Difficulty Mechanics

Each difficulty preset has different speed settings:

| Preset | Base Speed | Reduction/Apple | Min Speed |
|--------|-----------|-----------------|-----------|
| Easy   | 250ms     | 5ms             | 80ms      |
| Medium | 200ms     | 8ms             | 60ms      |
| Hard   | 150ms     | 12ms          | 40ms      |

**How it works**: Each apple you eat reduces the delay between moves, making the snake faster. The minimum speed (minSpeed) caps how fast the game can become.

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐        ┌─────────────────┐
│   Frontend      │         │    Backend       │        │    Storage      │
│  (React/Vite)   │────┐    │  (FastAPI)       │────┐   │  (JSON file)    │
│                 │    │    │                  │    │   │                 │
│ - Game3D.tsx    │    │    │ /api/apple       │    │   │ data/           │
│ - GameEngine.ts │    │    │ /api/score       │    │   │ high_scores.json│
│ - useGameSocket │    │    │ /ws/game (WS)    │    │   │                 │
└─────────────────┘    │    └──────────────────┘    │   └─────────────────┘
                       │                            │
                       │  Local game logic          │  Score persistence
                       │  - Movement                │  - Best scores
                       │  - Collision detection     │
                       │  - Food spawning           │
```

### Client-Side Components

| File | Description |
|------|-------------|
| `client/src/App.tsx` | Main app shell with difficulty selector and UI |
| `client/src/components/Game3D.tsx` | Three.js rendering with pixel art style |
| `client/src/hooks/useGameSocket.ts` | Game state management and WebSocket integration |
| `client/src/game/GameEngine.ts` | Core game logic (movement, collision) |
| `client/src/types/index.ts` | TypeScript type definitions |

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/apple` | POST | Generate food position not on snake body |
| `/api/score` | POST | Save/retrieve best scores |
| `/ws/game` | WebSocket | Real-time apple sync and score reporting |

## 🛠️ Development

### Running Tests

```bash
# Run all tests
uv run pytest -v

# With coverage
uv run pytest --cov=src --cov-report=term-missing -v

# Frontend tests
cd client && pnpm test
```

### Quality Gate

Before committing, run the quality gate:

```bash
./scripts/quality_gate.sh
```

Checks:
- Linting & formatting (Ruff)
- Type checking (Ty)
- Dead code detection (Vulture)
- Security scanning (detect-secrets)
- Tests with 80% coverage minimum

### Production Build

```bash
# Build frontend
cd client && pnpm build

# Run backend
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

## 📁 Project Structure

```
Snake/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # React components (Game3D, ScoreBoard, Controls)
│   │   ├── game/        # Game engine logic
│   │   ├── hooks/       # Custom React hooks
│   │   └── types/       # TypeScript type definitions
│   ├── public/          # Static assets
│   └── package.json
├── src/                 # FastAPI backend
│   ├── api/             # API routes
│   ├── config/          # Configuration
│   ├── game/            # Game models
│   └── main.py          # Application entry point
├── data/                # Persistent storage (high_scores.json)
├── scripts/             # Quality gate and utility scripts
└── pyproject.toml       # Backend dependencies
```

## 🎨 Pixel Art Style

The game uses a pixel art rendering approach:

- **BoxGeometry** instead of CylinderGeometry for sharp edges
- **CanvasTexture** with custom pixel patterns for snake segments and food
- **NearestFilter** to prevent anti-aliasing blur
- **Flat lighting** for a retro aesthetic
- **32x32 pixel sprites** for snake head/body and apple

## 📝 License

MIT License - see LICENSE file for details.
