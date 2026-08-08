import os
import ipaddress
import socket
from urllib.parse import urljoin, urlsplit

import httpx
from dotenv import load_dotenv
from bs4 import BeautifulSoup

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")

ALLOWED_URL_SCHEMES = {"http", "https"}
MAX_REDIRECTS = 5
MAX_PAGE_BYTES = 1_000_000


def _resolve_host_addresses(hostname: str, port: int) -> set[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    """Resolve every address for a host so each one can be safety checked."""
    addresses = set()
    for result in socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM):
        addresses.add(ipaddress.ip_address(result[4][0]))
    return addresses


def validate_public_url(url: str) -> None:
    """Reject URLs that could make the server contact a private network."""
    parsed = urlsplit(url)

    if parsed.scheme.lower() not in ALLOWED_URL_SCHEMES:
        raise ValueError("Only HTTP and HTTPS URLs are allowed")
    if not parsed.hostname:
        raise ValueError("URL must include a hostname")
    if parsed.username is not None or parsed.password is not None:
        raise ValueError("URLs containing credentials are not allowed")

    try:
        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
    except ValueError as exc:
        raise ValueError("URL contains an invalid port") from exc

    addresses = _resolve_host_addresses(parsed.hostname, port)
    if not addresses:
        raise ValueError("Hostname did not resolve to an address")

    if any(not address.is_global for address in addresses):
        raise ValueError("URL resolves to a non-public address")


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
        current_url = url
        response = None

        # Redirects are followed manually so every destination is checked
        # before the server contacts it.
        for redirect_count in range(MAX_REDIRECTS + 1):
            validate_public_url(current_url)
            response = httpx.get(
                current_url,
                timeout=10.0,
                follow_redirects=False,
                headers={"User-Agent": "Mozilla/5.0 (BookmarkBot)"},
            )

            if response.is_redirect:
                if redirect_count == MAX_REDIRECTS:
                    raise ValueError("Too many redirects")
                location = response.headers.get("location")
                if not location:
                    raise ValueError("Redirect response has no destination")
                current_url = urljoin(current_url, location)
                continue

            response.raise_for_status()
            break

        if response is None:
            return None

        content_type = response.headers.get("content-type", "")
        if "html" not in content_type.lower():
            print(f"[ai] skipping non-html content: {content_type}")
            return None

        content_length = response.headers.get("content-length")
        if content_length is not None and int(content_length) > MAX_PAGE_BYTES:
            print(f"[ai] skipping oversized page: {content_length} bytes")
            return None
        if len(response.content) > MAX_PAGE_BYTES:
            print(f"[ai] skipping oversized page: {len(response.content)} bytes")
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
