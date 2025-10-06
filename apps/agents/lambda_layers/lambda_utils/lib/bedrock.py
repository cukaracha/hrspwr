from typing import List, Dict, Any
import boto3


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


def _invoke_bedrock_converse(messages: List[Dict[str, Any]], system_prompt: str = None) -> str:
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
        bedrock_client = boto3.client('bedrock-runtime')

        # Build request parameters
        request_params = {
            'modelId': 'global.anthropic.claude-sonnet-4-20250514-v1:0',
            'messages': messages
        }

        # Add system prompt if provided
        if system_prompt:
            request_params['system'] = [{'text': system_prompt}]

        response = bedrock_client.converse(**request_params)

        # Extract and return response text
        return response['output']['message']['content'][0]['text'].strip()

    except Exception as e:
        raise RuntimeError(f"Bedrock converse API call failed: {str(e)}")
