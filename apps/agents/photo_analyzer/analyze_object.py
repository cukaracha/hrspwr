import json
import os
from typing import Dict, List
import boto3


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


def main(image_bytes: bytes) -> List[str]:
    """
    Main workflow: detect objects in image using Amazon Bedrock.

    Args:
        image_bytes: Input image as bytes (may contain multiple parts)

    Returns:
        List of detected part names

    Raises:
        ValueError: If image_bytes is empty
    """
    if not image_bytes:
        raise ValueError("image_bytes cannot be empty")

    try:
        # Detect all objects in the image
        detected_parts = detect_objects(image_bytes)
        return detected_parts
    except Exception as e:
        raise RuntimeError(f"Main workflow failed: {str(e)}")
