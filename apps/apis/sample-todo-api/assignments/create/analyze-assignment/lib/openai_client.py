import base64
from openai import OpenAI
import time


default_model = "gpt-4o"
models = ["gpt-4o-mini", "gpt-4o"]


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

        if f"rate limit reached for {model_id}" in str(e).lower():
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
