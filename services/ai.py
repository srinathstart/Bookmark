import os
import httpx
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")


def generate_summary(text: str) -> str | None:
    """
    Send text to Ollama and return a one-paragraph summary.
    Returns None if the call fails for any reason.
    """
    prompt = (
        "Summarize the following content in one short paragraph (2-3 sentences). "
        "Be factual and concise. Do not add commentary.\n\n"
        f"Content:\n{text}"
    )

    try:
        response = httpx.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except Exception as e:
        print(f"[ai] summary generation failed: {e}")
        return None
    
def fetch_page_text(url: str, max_chars: int = 4000) -> str | None:
    """
    Fetch a URL and return clean readable text from the page.
    Returns None if the fetch fails or the page isn't usable text.
    """
    try:
        response = httpx.get(
            url,
            timeout=10.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0 (BookmarkBot)"},
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "html" not in content_type.lower():
            print(f"[ai] skipping non-html content: {content_type}")
            return None

        soup = BeautifulSoup(response.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)

        if not text:
            return None

        return text[:max_chars]
    except Exception as e:
        print(f"[ai] fetch failed for {url}: {e}")
        return None