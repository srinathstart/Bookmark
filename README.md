# Bookmark Manager

[![CI](https://github.com/srinathstart/Bookmark/actions/workflows/ci.yml/badge.svg)](https://github.com/srinathstart/Bookmark/actions/workflows/ci.yml)

A full-stack bookmark manager with user authentication, private bookmark collections, search, pagination, and AI-generated page summaries using a local Ollama model.

## Screenshots

![Bookmark Manager landing page](docs/images/landing-page.png)

![Bookmark dashboard with completed AI summaries](docs/images/bookmark-dashboard.png)

## Features

- Registration and login with JWT authentication and bcrypt password hashing
- Bookmark create, read, update, and delete operations
- Case-insensitive title search and paginated results
- Per-user data isolation so users can access only their own bookmarks
- Background page summarization with pending, completed, and failed states
- Manual retry when summary generation fails
- IP-based rate limiting on registration and login
- Automated backend and frontend checks with GitHub Actions

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, MySQL
- **Frontend:** React, Vite
- **Authentication:** JWT, bcrypt
- **AI summaries:** Ollama, BeautifulSoup, HTTPX
- **Testing:** pytest, SQLite, Vitest, React Testing Library
- **Tooling:** Docker, GitHub Actions

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/srinathstart/Bookmark.git bookmarks
cd bookmarks
```

### 2. Configure and run the backend

Python 3.13 and a running MySQL database are required.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Update `.env` with your database URL and secret key:

```env
DATABASE_URL=mysql+pymysql://user:password@host:port/database
SECRET_KEY=replace-with-a-random-secret
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`, with interactive documentation at `http://127.0.0.1:8000/docs`.

### 3. Run Ollama

Ollama is optional for the main bookmark features. Without it, summary generation fails gracefully and can be retried later.

```bash
ollama pull phi3:mini
ollama serve
```

### 4. Run the frontend

In a separate terminal:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Run Tests

Backend:

```bash
source .venv/bin/activate
python -m pytest -q
```

Frontend:

```bash
cd frontend
npm test
npm run lint
npm run build
```
