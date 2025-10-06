import json
import os
import base64
from typing import Dict, List
import boto3
from lib.secrets import load_secrets


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
