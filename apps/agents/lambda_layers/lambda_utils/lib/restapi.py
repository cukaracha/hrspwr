import json
import os
from typing import Dict
from datetime import datetime, timedelta
import requests
import hashlib
import boto3


def _cached_api_request(url: str, headers: Dict[str, str], cache_ttl_hours: int = 24) -> requests.Response:
    """
    Make a cached API request using DynamoDB for cache storage.

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

    # Get DynamoDB table name from environment
    table_name = os.environ.get('API_CACHE_TABLE')
    if not table_name:
        print("Warning: API_CACHE_TABLE not set, skipping cache")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response

    try:
        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)

        # Try to get cached item from DynamoDB
        try:
            cache_response = table.get_item(Key={'cacheKey': cache_key})

            if 'Item' in cache_response:
                cached_item = cache_response['Item']

                # Check if cache entry is still valid (manual TTL check)
                current_time = int(datetime.now().timestamp())
                if current_time < cached_item.get('ttl', 0):
                    print(f"Cache hit for URL: {url}")

                    # Create a Response object from cached data
                    cached_response = requests.Response()
                    cached_response.status_code = int(cached_item['status_code'])
                    cached_response._content = cached_item['content'].encode('utf-8')
                    cached_response.headers.update(cached_item['headers'])

                    return cached_response
                else:
                    print(f"Cache expired for URL: {url}")

        except Exception as e:
            print(f"Warning: Failed to read from cache: {str(e)}")
            # Continue to make API request if cache read fails

    except Exception as e:
        print(f"Warning: DynamoDB cache initialization failed: {str(e)}")
        # Continue without cache if DynamoDB setup fails

    # Make fresh API request
    print(f"Making REST API request: {url}")
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    # Only cache successful responses (2xx status codes)
    if 200 <= response.status_code < 300:
        try:
            # Calculate TTL as Unix timestamp
            ttl_timestamp = int((datetime.now() + timedelta(hours=cache_ttl_hours)).timestamp())

            # Store in DynamoDB
            table.put_item(
                Item={
                    'cacheKey': cache_key,
                    'url': url,
                    'timestamp': datetime.now().isoformat(),
                    'status_code': response.status_code,
                    'content': response.text,
                    'headers': dict(response.headers),
                    'ttl': ttl_timestamp
                }
            )
            print(f"Cached response for URL: {url} (expires: {datetime.fromtimestamp(ttl_timestamp).isoformat()})")

        except Exception as e:
            print(f"Warning: Failed to write to cache: {str(e)}")
            # Continue even if cache write fails

    return response
