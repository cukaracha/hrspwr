import json
import os
import base64
from typing import List
from lib.secrets import load_secrets
from lib import bedrock


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

        result = bedrock._converse(
            messages, system_prompt=prompts['system'])
        print(f"LLM detected objects: {result}")

        # Parse parts from XML tags
        try:
            parts_content = bedrock._parse_xml_tag(result, 'parts')
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


def lambda_handler(event, context):
    """
    AWS Lambda handler for photo object detection.

    Args:
        event: API Gateway event containing base64-encoded image in body
        context: Lambda context object

    Returns:
        API Gateway response with detected parts list
    """
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': True,
        'Content-Type': 'application/json'
    }

    try:
        # Load secrets from Secrets Manager
        secret_arn = os.environ.get('SECRET_ARN')
        if secret_arn:
            load_secrets(secret_arn)

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract and decode base64 image
        base64_image = body.get('image')
        if not base64_image:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Missing required field: image (base64-encoded)'
                })
            }

        # Decode base64 image to bytes
        image_bytes = base64.b64decode(base64_image)

        # Process photo analysis
        detected_parts = main(image_bytes)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'parts': detected_parts
            })
        }

    except ValueError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({
                'error': str(e)
            })
        }
    except Exception as e:
        print(f"Error in photo analysis: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Photo analysis failed',
                'details': str(e)
            })
        }
