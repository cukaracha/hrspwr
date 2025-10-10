import json
import os
import base64
from typing import Dict, Any
import boto3
from lib.secrets import load_secrets
from lib import openai_client


def _load_prompts() -> Dict[str, str]:
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


def _extract_vin_with_textract(image_bytes: bytes) -> str:
    """
    Extract VIN string from image using Textract and OpenAI.

    Args:
        image_bytes: Image bytes containing VIN plate

    Returns:
        VIN string (17 characters)

    Raises:
        RuntimeError: If Textract or OpenAI invocation fails
    """
    try:
        # Call Textract to detect text
        textract_client = boto3.client('textract')
        textract_response = textract_client.detect_document_text(
            Document={'Bytes': image_bytes}
        )

        # Use OpenAI to extract VIN from Textract output
        prompts = _load_prompts()

        # Prepare message with Textract output
        message_content = f"{prompts['extract_vin_from_textract']}\n\nTextract Output:\n{json.dumps(textract_response, indent=2)}"

        # Format messages for OpenAI
        messages = [
            {
                "role": "user",
                "content": message_content
            }
        ]

        # Call OpenAI to extract VIN
        vin = openai_client.invoke_model_text(messages)

        # Validate VIN format (17 characters, alphanumeric)
        if len(vin) != 17:
            raise ValueError(
                f"Invalid VIN length: {len(vin)}, expected 17 characters")

        vin = vin.upper()
        print(f"Extracted VIN: {vin}")
        return vin

    except Exception as e:
        raise RuntimeError(f"VIN extraction failed: {str(e)}")


def _lookup_vehicle_info(vin: str) -> Dict[str, Any]:
    """
    Look up vehicle information using RapidAPI TecDoc VIN decoder API.

    Args:
        vin: Vehicle Identification Number (17 characters)

    Returns:
        Dictionary containing year, make, model, and trim

    Raises:
        ValueError: If required environment variable is not set
        RuntimeError: If API call fails
    """
    api_key = os.environ.get('RAPIDAPI_KEY')

    if not api_key:
        raise ValueError("RAPIDAPI_KEY environment variable must be set")

    try:
        import requests

        # Look up VIN using RapidAPI
        vin_url = f"https://tecdoc-catalog.p.rapidapi.com/vin/decoder-v2/{vin}"
        headers = {
            "x-rapidapi-host": "tecdoc-catalog.p.rapidapi.com",
            "x-rapidapi-key": api_key
        }

        vin_response = requests.get(vin_url, headers=headers)
        vin_response.raise_for_status()

        vehicle_data = vin_response.json()
        print(f"RapidAPI raw response: {json.dumps(vehicle_data, indent=2)}")

        # Return entire API response
        return vehicle_data

    except requests.RequestException as e:
        raise RuntimeError(f"RapidAPI request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Vehicle lookup failed: {str(e)}")


def main(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extract VIN from an image and look up vehicle information.

    This orchestrates the complete workflow:
    1. Run Textract on the image to detect text
    2. Use OpenAI to extract the VIN from Textract output
    3. Look up vehicle information using the VIN
    4. Return dictionary with VIN and vehicle info

    Args:
        image_bytes: Image containing VIN plate as bytes

    Returns:
        Dictionary with VIN and vehicle information:
        {
            "vin": str (17 characters),
            "year": int or str,
            "make": str,
            "model": str,
            "trim": str
        }

    Raises:
        ValueError: If image_bytes is empty or invalid
        RuntimeError: If any step in the workflow fails
    """
    if not image_bytes:
        raise ValueError("image_bytes cannot be empty")

    try:
        # Step 1 & 2: Extract VIN string from the image
        vin = _extract_vin_with_textract(image_bytes)

        # Step 3: Look up vehicle information
        vehicle_info = _lookup_vehicle_info(vin)

        # Step 4: Combine VIN with vehicle info
        result = {"vin": vin}
        result.update(vehicle_info)

        return result

    except Exception as e:
        raise RuntimeError(f"Vehicle info extraction failed: {str(e)}")


def lambda_handler(event, context):
    """
    AWS Lambda handler for VIN lookup from image.

    Args:
        event: API Gateway event containing base64-encoded image in body
        context: Lambda context object

    Returns:
        API Gateway response with VIN and vehicle information
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

        # Process VIN lookup
        result = main(image_bytes)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(result)
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
        print(f"Error in VIN lookup: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'VIN lookup failed',
                'details': str(e)
            })
        }
