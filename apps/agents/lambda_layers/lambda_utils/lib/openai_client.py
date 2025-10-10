import base64
from openai import OpenAI
import time


default_model = "gpt-4.1"
models = [
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-4o-mini",
]


class APILimitExceededError(Exception):
    """Raised when the API rate limit is exceeded."""
    pass


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def invoke_model(messages: list, model_id: str = "", retries: int = 0, failed_models: list = []) -> dict:

    if retries > 5:
        print(f"\nERROR in openAI invoke_model. Aborting.")
        raise ValueError("ERROR in openAI invoke_model. Aborting.")

    openai = OpenAI()

    if model_id == "":
        model_id = default_model

    try:
        response = openai.chat.completions.create(
            model=model_id,
            messages=messages,
            temperature=0.5,
            top_p=0.5,
        )

        return response

    except Exception as e:
        print(f"\nERROR in openAI invoke_model: {e}")

        if f"rate limit reached" in str(e).lower():
            failed_models.append(model_id)
            model_id = get_another_model(failed_models)
            if model_id is None:
                raise APILimitExceededError(
                    f"API limit reached. No alternative models available. Aborting.")

        retries += 1
        retry_delay = 10 * retries
        print(f"Retrying in {retry_delay} seconds (retry attempt #{retries})")
        time.sleep(retry_delay)

        return invoke_model(messages, model_id, retries)


def get_another_model(failed_models: list) -> str:
    '''
    Checks available models and returns one that isn't in the failed_models list.
    If none are available, returns None.
    '''

    for m in models:
        if m not in failed_models:
            return m

    return None


def get_response_text(response: dict) -> str:
    '''
    Extracts the text response from the full API response.
    Returns a string.
    '''

    return response.choices[0].message.content


def invoke_model_text(messages: list, model_id: str = "") -> str:
    '''
    Convenience method that combines invoke_model() and get_response_text().
    Only accepts text-based messages (no image content).

    Args:
        messages: List of message dictionaries with text content only
        model_id: Optional model ID to use (defaults to default_model)

    Returns:
        String containing the model's text response
    '''
    response = invoke_model(messages, model_id)
    return get_response_text(response)


def _parse_xml_tag(response: str, tag: str) -> str:
    """
    Parse content from XML tags using partition.

    Args:
        response: LLM response containing XML tags
        tag: Tag name to extract (e.g., 'parts', 'ans', 'subcategory_id')

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


def analyze_image(image_bytes: bytes, instructions: str, model_id: str = "") -> str:

    # format payload
    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    messages = [
        {
            "role": "user",
            "content": [
                    {
                        "type": "text",
                        "text": instructions,
                    },
                {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                },
            ],
        }
    ]

    response = invoke_model(messages, model_id)
    return get_response_text(response)
