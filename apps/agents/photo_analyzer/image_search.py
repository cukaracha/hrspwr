import io
import requests
from typing import List, Optional
from PIL import Image
import serpapi
from concurrent.futures import ThreadPoolExecutor, as_completed

# Add your SerpAPI key here
SERPAPI_KEY = "284f66fda9712b0f2f12e65f17ffb825055620cc953a90c388da887943e9de13"


def _download_image(image_url: str) -> Optional[bytes]:
    """
    Download a single image from a URL and convert to PNG bytes.

    Args:
        image_url: URL of the image to download

    Returns:
        Image bytes in PNG format, or None if download/conversion fails
    """
    try:
        response = requests.get(
            image_url,
            timeout=10,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        response.raise_for_status()

        image = Image.open(io.BytesIO(response.content))

        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return img_byte_arr.getvalue()

    except Exception:
        return None


def search_images(query: str, max_results: int = 10, max_workers: int = 10) -> List[bytes]:
    """
    Search for images using SerpAPI (Google Images) and return them as bytes.
    Uses multithreading to download images in parallel for faster performance.

    Note: SerpAPI returns up to 100 images per request. If you need more images,
    you'll need to implement pagination using the 'ijn' parameter.

    Args:
        query: Search query string
        max_results: Maximum number of images to return (default 10, max 100 per request)
        max_workers: Maximum number of concurrent download threads (default 10)

    Returns:
        List of image bytes (PNG format). May return fewer images than max_results
        if some downloads fail or if fewer images are available.

    Raises:
        ValueError: If query is empty, max_results is invalid, or API key is missing
        RuntimeError: If image search or download fails
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    if max_results < 1 or max_results > 100:
        raise ValueError("max_results must be between 1 and 100")

    if not SERPAPI_KEY:
        raise ValueError(
            "SERPAPI_KEY is not set. Please add your API key to the SERPAPI_KEY variable.")

    try:
        client = serpapi.Client(api_key=SERPAPI_KEY)
        results = client.search({
            "engine": "google_images",
            "tbm": "isch",
            "q": query
        })

        images_results = results.get("images_results", [])
    except Exception as e:
        raise RuntimeError(f"SerpAPI image search failed: {str(e)}")

    if not images_results:
        return []

    # Limit to top max_results images
    image_urls = [img.get('original')
                  for img in images_results[:max_results] if img.get('original')]

    image_bytes_list = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_url = {executor.submit(
            _download_image, url): url for url in image_urls}

        for future in as_completed(future_to_url):
            img_bytes = future.result()
            if img_bytes is not None:
                image_bytes_list.append(img_bytes)

    return image_bytes_list
