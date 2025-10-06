from typing import List, Dict, Any
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import time


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


# Claude model pool for round-robin fallback (ordered by preference)
_CLAUDE_MODELS = [
    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
    'global.anthropic.claude-sonnet-4-20250514-v1:0',
    'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
]


def _converse(messages: List[Dict[str, Any]], system_prompt: str = None) -> str:
    """
    Call Amazon Bedrock's converse API with formatted messages.
    Implements round-robin model selection with exponential backoff on errors.

    Args:
        messages: List of message dictionaries in Bedrock converse format
                 Example: [{"role": "user", "content": [{"text": "..."}, {"image": {...}}]}]
        system_prompt: Optional system prompt to include

    Returns:
        Response text from the model

    Raises:
        RuntimeError: If Bedrock invocation fails after all retries
    """
    # Configure boto3 client with no built-in retries (max_attempts=0 means no retries)
    config = Config(retries={'max_attempts': 0})
    bedrock_client = boto3.client('bedrock-runtime', config=config)

    # Track errors across all attempts
    all_errors = []
    max_retries = 5

    for retry in range(max_retries):
        # Try each model in the pool
        for model_idx, model_id in enumerate(_CLAUDE_MODELS):
            try:
                # Build request parameters
                request_params = {
                    'modelId': model_id,
                    'messages': messages
                }

                # Add system prompt if provided
                if system_prompt:
                    request_params['system'] = [{'text': system_prompt}]

                response = bedrock_client.converse(**request_params)

                # Extract and return response text on success
                return response['output']['message']['content'][0]['text'].strip()

            except ClientError as e:
                error_str = str(e)

                # Check if this is a retryable error by checking string representation
                retryable_errors = ['ThrottlingException', 'ValidationException', 'ModelErrorException']
                is_retryable = any(err in error_str for err in retryable_errors)

                if is_retryable:
                    all_errors.append(f"Retry {retry + 1}, Model {model_idx + 1} ({model_id}): {error_str}")

                    # If we've tried all models in this retry cycle, wait before next cycle
                    if model_idx == len(_CLAUDE_MODELS) - 1 and retry < max_retries - 1:
                        backoff_time = 2 ** retry
                        time.sleep(backoff_time)
                    # Continue to next model immediately
                    continue
                else:
                    # Non-retryable error, raise immediately
                    raise RuntimeError(f"Bedrock converse API call failed with non-retryable error: {error_str}")

            except Exception as e:
                # Unexpected error, raise immediately
                raise RuntimeError(f"Bedrock converse API call failed with unexpected error: {str(e)}")

    # All retries exhausted
    error_summary = "\n".join(all_errors)
    raise RuntimeError(f"Bedrock converse API call failed after {max_retries} retries across {len(_CLAUDE_MODELS)} models:\n{error_summary}")
