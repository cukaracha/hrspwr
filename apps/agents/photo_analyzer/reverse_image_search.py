"""
Reverse Image Search Workflow using SerpAPI

This module provides a workflow to perform reverse image search using SerpAPI's
Google Reverse Image API. Since SerpAPI requires an image URL (not direct bytes),
the workflow uploads the image to S3, generates a presigned URL, and then performs
the reverse image search.
"""

import os
import uuid
import json
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import boto3
import serpapi
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image
import io


# CONFIGURATION VARIABLES - UPDATE THESE WITH YOUR VALUES

# SerpAPI Configuration
SERPAPI_KEY = "284f66fda9712b0f2f12e65f17ffb825055620cc953a90c388da887943e9de13"

# S3 Configuration
# Enter your S3 bucket name here
S3_BUCKET_NAME = "sample-uploads-685445159226-us-east-1"
AWS_REGION = "us-east-1"  # AWS region for S3 bucket

# Optional: SerpAPI Search Parameters
SEARCH_LANGUAGE = "en"  # Language for search results
SEARCH_QUERY = "automotive"  # Text query to contextualize/filter results


# WORKFLOW METHODS

def _download_image(image_url: str) -> Optional[bytes]:
    """
    Download an image from URL and return as bytes.

    Args:
        image_url: URL of the image to download

    Returns:
        Image bytes in PNG format, or None if download fails
    """
    try:
        response = requests.get(
            image_url,
            timeout=10,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        response.raise_for_status()

        # Convert to PNG format
        image = Image.open(io.BytesIO(response.content))
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return img_byte_arr.getvalue()

    except Exception:
        return None


def upload_image_to_s3(image_bytes: bytes) -> str:
    """
    Upload image bytes to S3 bucket and return the S3 key.

    Args:
        image_bytes: Raw image data as bytes

    Returns:
        str: S3 key (object path) of the uploaded image

    Raises:
        ValueError: If S3_BUCKET_NAME is not configured
        Exception: If upload fails
    """
    if not S3_BUCKET_NAME:
        raise ValueError(
            "S3_BUCKET_NAME is not configured. Please set it at the top of the file.")

    # Generate unique filename
    unique_id = str(uuid.uuid4())
    s3_key = f"reverse-image-search/{unique_id}.jpg"

    # Initialize S3 client
    s3_client = boto3.client('s3', region_name=AWS_REGION)

    try:
        # Upload image to S3 with public-read ACL for Google reverse image search
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=image_bytes,
            ContentType='image/jpeg',
            ACL='public-read'
        )
        print(
            f"Image uploaded to S3 with public access: s3://{S3_BUCKET_NAME}/{s3_key}")
        return s3_key

    except Exception as e:
        raise Exception(f"Failed to upload image to S3: {str(e)}")


def generate_public_url(s3_key: str) -> str:
    """
    Generate a public URL for the S3 object.

    This creates a standard S3 public URL that works with Google reverse image search.
    The object must have been uploaded with public-read ACL.

    Args:
        s3_key: S3 object key

    Returns:
        str: Public URL that can be accessed without authentication

    Raises:
        ValueError: If S3_BUCKET_NAME or AWS_REGION is not configured
    """
    if not S3_BUCKET_NAME:
        raise ValueError(
            "S3_BUCKET_NAME is not configured. Please set it at the top of the file.")

    if not AWS_REGION:
        raise ValueError(
            "AWS_REGION is not configured. Please set it at the top of the file.")

    # Construct standard S3 public URL
    public_url = f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
    print(f"Generated public URL: {public_url}")
    return public_url


def _fetch_result_images(image_results: List[Dict[str, Any]], max_workers: int = 10) -> List[Tuple[int, Optional[bytes]]]:
    """
    Fetch thumbnail images concurrently from image_results.

    Args:
        image_results: List of image result dictionaries from SerpAPI
        max_workers: Maximum number of concurrent download threads (default: 10)

    Returns:
        List of tuples (position, image_bytes) where image_bytes may be None if download failed
    """
    image_downloads = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all image download tasks for results that have thumbnails
        future_to_position = {}
        for result in image_results:
            position = result.get('position')
            thumbnail_url = result.get('thumbnail')
            if thumbnail_url and position:
                future = executor.submit(_download_image, thumbnail_url)
                future_to_position[future] = position

        # Collect results as they complete
        for future in as_completed(future_to_position):
            position = future_to_position[future]
            image_bytes = future.result()
            image_downloads.append((position, image_bytes))

    return image_downloads


def perform_reverse_image_search(image_url: str, query: Optional[str] = None) -> Dict[str, Any]:
    """
    Perform reverse image search using SerpAPI.

    Args:
        image_url: Public URL of the image to search
        query: Optional text query to contextualize/filter results (e.g., "animals", "automotive", "red car")

    Returns:
        dict: Raw response from SerpAPI containing search results

    Raises:
        ValueError: If SERPAPI_KEY is not configured
        Exception: If search fails
    """
    if not SERPAPI_KEY:
        raise ValueError(
            "SERPAPI_KEY is not configured. Please set it at the top of the file.")

    try:
        # Initialize SerpAPI client
        client = serpapi.Client(api_key=SERPAPI_KEY)

        # Build search parameters
        search_params = {
            "engine": "google_reverse_image",
            "image_url": image_url,
            "hl": SEARCH_LANGUAGE
        }

        # Use provided query or default to configured SEARCH_QUERY
        search_query = query if query is not None else SEARCH_QUERY

        if search_query:
            search_params["q"] = search_query
            print(
                f"Performing reverse image search with query: '{search_query}'...")
        else:
            print(f"Performing reverse image search...")

        # Perform search
        results = client.search(search_params)

        # Convert SerpResults to dictionary for JSON serialization
        results_dict = dict(results)

        # Print raw response
        print(f"SerpAPI raw response: {json.dumps(results_dict, indent=2)}")

        # Check search status
        search_metadata = results_dict.get('search_metadata', {})
        status = search_metadata.get('status', 'Unknown')

        if status == 'Success':
            print(f"Reverse image search completed successfully")
        else:
            print(f"Warning: Search status: {status}")

        return results_dict

    except Exception as e:
        raise Exception(f"Failed to perform reverse image search: {str(e)}")


def process_search_results(api_response: Dict[str, Any], max_workers: int = 10) -> List[Dict[str, Any]]:
    """
    Process SerpAPI response and fetch images concurrently.

    Args:
        api_response: Raw SerpAPI response dictionary
        max_workers: Maximum number of concurrent image downloads (default: 10)

    Returns:
        List of dictionaries, each containing:
            - position: Result position in search results
            - title: Page/product title
            - link: URL of the page
            - source: Source website name
            - thumbnail: SerpAPI thumbnail URL (if available)
            - snippet: Text snippet from the page
            - image_bytes: Thumbnail image as bytes (PNG format), or None if no thumbnail or download failed
    """
    image_results = api_response.get('image_results', [])

    if not image_results:
        print("No image results found in API response")
        return []

    # Filter results that have thumbnails
    results_with_thumbnails = [r for r in image_results if r.get('thumbnail')]

    print(f"Processing {len(image_results)} search results ({len(results_with_thumbnails)} with thumbnails)...")

    # Fetch all thumbnail images concurrently
    image_downloads = _fetch_result_images(
        image_results, max_workers=max_workers)

    # Create lookup map for image bytes by position
    image_map = {pos: img_bytes for pos, img_bytes in image_downloads}

    # Build result list with metadata and image bytes
    processed_results = []
    for result in image_results:
        position = result.get('position')
        processed_result = {
            'position': position,
            'title': result.get('title'),
            'link': result.get('link'),
            'source': result.get('source'),
            'thumbnail': result.get('thumbnail'),
            'snippet': result.get('snippet'),
            'image_bytes': image_map.get(position)
        }
        processed_results.append(processed_result)

    successful_downloads = sum(
        1 for r in processed_results if r['image_bytes'] is not None)
    print(
        f"Successfully downloaded {successful_downloads}/{len(results_with_thumbnails)} thumbnail images")

    return processed_results


def cleanup_s3_image(s3_key: str) -> None:
    """
    Delete the temporary image from S3.

    Args:
        s3_key: S3 object key to delete

    Raises:
        ValueError: If S3_BUCKET_NAME is not configured
        Exception: If deletion fails
    """
    if not S3_BUCKET_NAME:
        raise ValueError(
            "S3_BUCKET_NAME is not configured. Please set it at the top of the file.")

    # Initialize S3 client
    s3_client = boto3.client('s3', region_name=AWS_REGION)

    try:
        # Delete object from S3
        s3_client.delete_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key
        )
        print(f"Cleaned up S3 image: {s3_key}")

    except Exception as e:
        # Log error but don't raise - cleanup failure shouldn't break the workflow
        print(f"Warning: Failed to cleanup S3 image: {str(e)}")


# MAIN ORCHESTRATION

def main(image_bytes: bytes, query: Optional[str] = None, cleanup: bool = True, max_workers: int = 10) -> List[Dict[str, Any]]:
    """
    Main orchestration method for reverse image search workflow.

    This method coordinates the entire workflow:
    1. Upload image bytes to S3 with public-read ACL
    2. Generate a public URL for the uploaded image
    3. Perform reverse image search using SerpAPI
    4. Fetch visually similar images concurrently from results
    5. Optionally cleanup the temporary S3 image
    6. Return processed results with image bytes and metadata

    Args:
        image_bytes: Raw image data as bytes
        query: Optional text query to contextualize/filter results (e.g., "animals", "automotive")
        cleanup: Whether to delete the S3 image after search (default: True)
        max_workers: Maximum concurrent image downloads (default: 10)

    Returns:
        List of dictionaries, each containing:
            - position: Result position in search results
            - title: Page/product title
            - link: URL of the page
            - source: Source website name
            - thumbnail: SerpAPI thumbnail URL (if available, None otherwise)
            - snippet: Text snippet from the page
            - image_bytes: Thumbnail image as bytes (PNG format), or None if no thumbnail or download failed

    Raises:
        ValueError: If required configuration variables are not set
        Exception: If any step in the workflow fails

    Examples:
        >>> # Basic reverse image search
        >>> with open('image.jpg', 'rb') as f:
        ...     image_bytes = f.read()
        >>> results = main(image_bytes)
        >>> print(f"Found {len(results)} search results")
        >>> for result in results:
        ...     print(f"Position {result['position']}: {result['title']}")
        ...     print(f"  Link: {result['link']}")
        ...     print(f"  Source: {result['source']}")
        ...     if result['image_bytes']:
        ...         # Save the thumbnail image
        ...         with open(f"thumbnail_{result['position']}.png", 'wb') as f:
        ...             f.write(result['image_bytes'])

        >>> # Reverse image search with text context
        >>> with open('car.jpg', 'rb') as f:
        ...     image_bytes = f.read()
        >>> results = main(image_bytes, query="automotive", max_workers=5)
        >>> # Filter to only results with images
        >>> results_with_images = [r for r in results if r['image_bytes']]
    """
    s3_key = None

    try:
        print("Starting reverse image search workflow")

        # Step 1: Upload image to S3
        print("[1/4] Uploading image to S3...")
        s3_key = upload_image_to_s3(image_bytes)

        # Step 2: Generate public URL
        print("[2/4] Generating public URL...")
        image_url = generate_public_url(s3_key)

        # Step 3: Perform reverse image search
        print("[3/4] Performing reverse image search...")
        api_response = perform_reverse_image_search(image_url, query=query)

        # Step 4: Process results and fetch images
        print("[4/4] Fetching result images...")
        processed_results = process_search_results(
            api_response, max_workers=max_workers)

        print("Workflow completed successfully")

        return processed_results

    except Exception as e:
        print(f"Workflow failed: {str(e)}")
        raise

    finally:
        # Cleanup S3 image if requested
        if cleanup and s3_key:
            print("\nCleaning up temporary files...")
            # cleanup_s3_image(s3_key)
