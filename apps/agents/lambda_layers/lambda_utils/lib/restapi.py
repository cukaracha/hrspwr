import json
import os
from typing import Dict
from datetime import datetime, timedelta
import requests
import hashlib
import threading


# Global lock for cache file operations to prevent race conditions
_cache_lock = threading.Lock()


def _cached_api_request(url: str, headers: Dict[str, str], cache_ttl_hours: int = 24) -> requests.Response:
    """
    Make a cached API request using local JSON file storage.

    Args:
        url: The full URL to request
        headers: Request headers dictionary
        cache_ttl_hours: Time-to-live for cache entries in hours (default: 24)

    Returns:
        requests.Response object (either from cache or fresh API call)

    Raises:
        requests.RequestException: If API request fails
    """
    # Generate cache key from URL and sorted headers
    cache_key_content = url + json.dumps(sorted(headers.items()))
    cache_key = hashlib.md5(cache_key_content.encode()).hexdigest()

    # Cache file path in same directory as this script
    cache_file_path = os.path.join(os.path.dirname(__file__), 'api_cache.json')

    # Load existing cache with thread lock to prevent race conditions
    cache = {}
    cache_hit = False
    cached_response = None

    with _cache_lock:
        if os.path.exists(cache_file_path):
            try:
                with open(cache_file_path, 'r') as f:
                    cache = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load cache file, starting fresh: {str(e)}")
                cache = {}

        # Check cache hit
        if cache_key in cache:
            cached_entry = cache[cache_key]
            cached_time = datetime.fromisoformat(cached_entry['timestamp'])
            expiry_time = cached_time + timedelta(hours=cache_ttl_hours)

            if datetime.now() < expiry_time:
                print(f"Cache hit for URL: {url}")
                cache_hit = True
                # Create a mock Response object from cached data
                cached_response = requests.Response()
                cached_response.status_code = cached_entry['status_code']
                cached_response._content = cached_entry['content'].encode('utf-8')
                cached_response.headers.update(cached_entry['headers'])

    # Return cached response if available (outside lock to minimize lock duration)
    if cache_hit:
        return cached_response

    # Make fresh API request (outside lock to allow parallel API calls)
    print(f"Making REST API request: {url}")
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    # Only cache successful responses (2xx status codes)
    if 200 <= response.status_code < 300:
        with _cache_lock:
            # Reload cache in case it was updated by another thread
            if os.path.exists(cache_file_path):
                try:
                    with open(cache_file_path, 'r') as f:
                        cache = json.load(f)
                except Exception as e:
                    print(f"Warning: Failed to reload cache before writing: {str(e)}")
                    cache = {}

            cache[cache_key] = {
                'url': url,
                'timestamp': datetime.now().isoformat(),
                'status_code': response.status_code,
                'content': response.text,
                'headers': dict(response.headers)
            }

            # Save cache to file
            try:
                with open(cache_file_path, 'w') as f:
                    json.dump(cache, f, indent=2)
            except Exception as e:
                print(f"Warning: Failed to save cache file: {str(e)}")

    return response
