from image_search import search_images
import io
import json
import os
from typing import Dict, List
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3

# Import from sibling modules
import sys
sys.path.append(os.path.dirname(__file__))


def _load_prompts() -> dict:
    """
    Load prompts from prompts.json file.

    Returns:
        Dictionary containing prompt templates

    Raises:
        RuntimeError: If prompts file cannot be loaded
    """
    try:
        prompts_path = os.path.join(os.path.dirname(__file__), 'prompts.json')
        with open(prompts_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load prompts: {str(e)}")


def _parse_xml_tag(response: str, tag: str) -> str:
    """
    Parse content from XML tags using partition.

    Args:
        response: LLM response containing XML tags
        tag: Tag name to extract (e.g., 'parts', 'ans')

    Returns:
        Content within the XML tags

    Raises:
        ValueError: If tag is not found in response
    """
    opening_tag = f"<{tag}>"
    closing_tag = f"</{tag}>"

    _, _, after_opening = response.partition(opening_tag)
    content, _, _ = after_opening.partition(closing_tag)

    if not content:
        raise ValueError(f"Tag <{tag}> not found in response")

    return content.strip()


def _invoke_bedrock_converse(messages: List[Dict], system_prompt: str = None) -> str:
    """
    Call Amazon Bedrock's converse API with formatted messages.

    Args:
        messages: List of message dictionaries in Bedrock converse format
                 Example: [{"role": "user", "content": [{"text": "..."}, {"image": {...}}]}]
        system_prompt: Optional system prompt to include

    Returns:
        Response text from the model

    Raises:
        RuntimeError: If Bedrock invocation fails
    """
    try:
        bedrock_client = boto3.client(
            'bedrock-runtime', region_name='us-east-1')

        # Build request parameters
        request_params = {
            'modelId': 'global.anthropic.claude-sonnet-4-20250514-v1:0',
            'messages': messages
        }

        # Add system prompt if provided
        if system_prompt:
            request_params['system'] = [{'text': system_prompt}]

        response = bedrock_client.converse(**request_params)

        return response['output']['message']['content'][0]['text'].strip()
    except Exception as e:
        raise RuntimeError(f"Bedrock converse API call failed: {str(e)}")


def detect_objects(image_bytes: bytes) -> List[str]:
    """
    Detect all automotive parts in an image using Bedrock vision.

    Args:
        image_bytes: Input image as bytes

    Returns:
        List of detected part names

    Raises:
        RuntimeError: If LLM call fails
    """
    try:
        prompts = _load_prompts()

        messages = [
            {
                'role': 'user',
                'content': [
                    {
                        'image': {
                            'format': 'png',
                            'source': {
                                'bytes': image_bytes
                            }
                        }
                    },
                    {
                        'text': prompts['detect_objects']
                    }
                ]
            }
        ]

        result = _invoke_bedrock_converse(
            messages, system_prompt=prompts['system'])
        print(f"LLM detected objects: {result}")

        # Parse parts from XML tags
        try:
            parts_content = _parse_xml_tag(result, 'parts')
            parts = [part.strip()
                     for part in parts_content.split('\n') if part.strip()]
            return parts
        except ValueError:
            # If parsing fails, return empty list
            return []
    except Exception as e:
        raise RuntimeError(f"Object detection failed: {str(e)}")


def resize_image(image_bytes: bytes, max_dimension: int = 250) -> bytes:
    """
    Resize image to have max dimension of specified size while preserving aspect ratio.

    Args:
        image_bytes: Input image as bytes
        max_dimension: Maximum dimension (width or height) in pixels (default: 250)

    Returns:
        Resized image as PNG bytes

    Raises:
        ValueError: If image bytes are invalid
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Calculate new dimensions preserving aspect ratio
        width, height = image.size
        if width > height:
            new_width = max_dimension
            new_height = int((max_dimension / width) * height)
        else:
            new_height = max_dimension
            new_width = int((max_dimension / height) * width)

        # Resize image
        resized_image = image.resize(
            (new_width, new_height), Image.Resampling.LANCZOS)

        # Convert to bytes
        img_byte_arr = io.BytesIO()
        resized_image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return img_byte_arr.getvalue()
    except Exception as e:
        raise ValueError(f"Failed to resize image: {str(e)}")


def verify_part_match(normalized_object_bytes: bytes, normalized_search_results: List[bytes], part_name: str) -> bool:
    """
    Verify if search results match the original object part using Bedrock vision.

    Args:
        normalized_object_bytes: Normalized original object image bytes
        normalized_search_results: List of normalized search result image bytes
        part_name: Name of the part being verified

    Returns:
        True if parts match, False otherwise

    Raises:
        RuntimeError: If LLM call fails
    """
    try:
        prompts = _load_prompts()

        # Build content array with original image first, then search results
        content = [
            {
                'image': {
                    'format': 'png',
                    'source': {
                        'bytes': normalized_object_bytes
                    }
                }
            }
        ]

        # Add search result images
        for search_result_bytes in normalized_search_results:
            content.append({
                'image': {
                    'format': 'png',
                    'source': {
                        'bytes': search_result_bytes
                    }
                }
            })

        # Add prompt text with part name substituted
        prompt_text = prompts['verify_match'].replace('{part}', part_name)
        content.append({
            'text': prompt_text
        })

        # Format as messages
        messages = [
            {
                'role': 'user',
                'content': content
            }
        ]

        # Call Bedrock Converse API
        result = _invoke_bedrock_converse(
            messages, system_prompt=prompts['system'])

        # Parse answer from XML tags
        try:
            answer = _parse_xml_tag(result, 'ans')
            is_match = answer.upper() == 'YES'
            print(
                f"LLM verification decision: {part_name} (match: {is_match})")
            return is_match
        except ValueError:
            # If parsing fails, assume no match
            print(f"LLM verification failed to parse: {result}")
            return False
    except Exception as e:
        raise RuntimeError(f"LLM verification failed: {str(e)}")


def _process_single_part(part_name: str, image_bytes: bytes) -> Dict[str, any]:
    """
    Process a single detected part: search and verify.

    Args:
        part_name: Name of the detected part
        image_bytes: Original image bytes

    Returns:
        Dictionary with 'part_name' and 'identified_part' (verified or 'unknown')
    """
    try:
        # Normalize image for LLM
        normalized_image = resize_image(image_bytes, max_dimension=250)

        print(f"Processing part: {part_name}")

        # Search for images of the part (add "automotive" to query)
        search_query = f"automotive {part_name}"
        search_results = search_images(search_query, max_results=5)

        # If no search results, return unknown
        if not search_results:
            return {
                'part_name': part_name,
                'identified_part': 'unknown'
            }

        # Normalize search results
        normalized_results = [resize_image(
            img, max_dimension=250) for img in search_results]

        # Verify match using LLM
        is_match = verify_part_match(
            normalized_image, normalized_results, part_name)

        # Return result
        if is_match:
            return {
                'part_name': part_name,
                'identified_part': part_name
            }
        else:
            return {
                'part_name': part_name,
                'identified_part': 'unknown'
            }
    except Exception as e:
        print(f"Error processing part {part_name}: {str(e)}")
        # On any error, return unknown
        return {
            'part_name': part_name,
            'identified_part': 'unknown'
        }


def main(image_bytes: bytes) -> List[Dict[str, any]]:
    """
    Main workflow: detect objects in image and identify each part concurrently.

    Args:
        image_bytes: Input image as bytes (may contain multiple parts)

    Returns:
        List of dictionaries, each containing:
        - 'part_name': Detected part name
        - 'identified_part': Verified part name or 'unknown'

    Raises:
        ValueError: If image_bytes is empty
    """
    if not image_bytes:
        raise ValueError("image_bytes cannot be empty")

    try:
        # Step 1: Detect all objects in the image
        detected_parts = detect_objects(image_bytes)

        if not detected_parts:
            return []

        # Step 2: Process each detected part concurrently (max 5 workers)
        results = []
        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_part = {
                executor.submit(_process_single_part, part, image_bytes): part
                for part in detected_parts
            }

            for future in as_completed(future_to_part):
                result = future.result()
                results.append(result)

        return results
    except Exception as e:
        raise RuntimeError(f"Main workflow failed: {str(e)}")
