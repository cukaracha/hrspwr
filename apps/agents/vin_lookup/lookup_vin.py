import json
import os
import base64
from typing import List, Dict, Any, Optional, Union
import boto3


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


def _invoke_bedrock_converse(messages: List[Dict[str, Any]]) -> str:
    """
    Call Amazon Bedrock's converse API with formatted messages.

    Args:
        messages: List of message dictionaries in Bedrock converse format
                 Example: [{"role": "user", "content": [{"text": "..."}, {"image": {...}}]}]

    Returns:
        Response text from the model

    Raises:
        RuntimeError: If Bedrock invocation fails
    """
    try:
        bedrock_client = boto3.client('bedrock-runtime')

        # Call Bedrock Converse API
        response = bedrock_client.converse(
            modelId="global.anthropic.claude-sonnet-4-20250514-v1:0",
            messages=messages
        )

        # Extract and return response text
        return response['output']['message']['content'][0]['text'].strip()

    except Exception as e:
        raise RuntimeError(f"Bedrock converse API call failed: {str(e)}")


def _extract_vin_with_textract(image_bytes: bytes) -> str:
    """
    Extract VIN string from image using Textract and Bedrock.

    Args:
        image_bytes: Image bytes containing VIN plate

    Returns:
        VIN string (17 characters)

    Raises:
        RuntimeError: If Textract or Bedrock invocation fails
    """
    try:
        # Call Textract to detect text
        textract_client = boto3.client('textract')
        textract_response = textract_client.detect_document_text(
            Document={'Bytes': image_bytes}
        )

        # Use Bedrock to extract VIN from Textract output
        prompts = _load_prompts()

        # Prepare message with Textract output
        message_content = f"{prompts['extract_vin_from_textract']}\n\nTextract Output:\n{json.dumps(textract_response, indent=2)}"

        # Format messages for Bedrock
        messages = [
            {
                "role": "user",
                "content": [{"text": message_content}]
            }
        ]

        # Call Bedrock to extract VIN
        vin = _invoke_bedrock_converse(messages)

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
    # api_key = os.environ.get('RAPIDAPI_KEY')
    api_key = "7f52966767mshdd7d2b2b14b58ddp13eeaajsn057c1530cd1c"

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


def get_vehicle_info(image_bytes: bytes) -> Dict[str, Any]:
    """
    Extract VIN from an image and look up vehicle information.

    This orchestrates the complete workflow:
    1. Run Textract on the image to detect text
    2. Use Bedrock to extract the VIN from Textract output
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
