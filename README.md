# Bookmark Manager API

A REST API for managing bookmarks with JWT authentication and AI-powered page summaries using a local LLM.

**Live:** https://bookmark-production-11ac.up.railway.app/docs

## Tech Stack

- **FastAPI** — API framework
- **MySQL** + **SQLAlchemy** — database and ORM
- **JWT** + **bcrypt** — authentication and password hashing
- **Ollama** — local LLM for AI page summaries
- **Docker** — containerization
- **Railway** — production deployment

## Features

- User registration and login with JWT auth
- Full bookmark CRUD with pagination and search
- AI-generated summaries by fetching and parsing page content
- Rate limiting on auth endpoints
- Strict user data isolation

## Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/srinathstart/Bookmark.git
cd bookmarks

# 2. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Fill in your values

# 5. Start the server
uvicorn main:app --reload
```

## Environment Variables

```
DATABASE_URL=mysql+pymysql://user:password@host:port/dbname
SECRET_KEY=your-secret-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Register a new user |
| POST | `/login` | No | Login and get JWT token |
| GET | `/bookmarks/` | Yes | List bookmarks (supports `?search=`, `?limit=`, `?offset=`) |
| POST | `/bookmarks/` | Yes | Create a bookmark |
| GET | `/bookmarks/{id}` | Yes | Get a single bookmark |
| PUT | `/bookmarks/{id}` | Yes | Update a bookmark |
| DELETE | `/bookmarks/{id}` | Yes | Delete a bookmark |

## Run Tests

```bash
pytest
```
