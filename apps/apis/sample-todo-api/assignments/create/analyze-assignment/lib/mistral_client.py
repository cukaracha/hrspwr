from mistralai import Mistral
from mistralai import DocumentURLChunk, ImageURLChunk, TextChunk
from mistralai.models import OCRResponse
from pathlib import Path
import time
import os
import json


class APILimitExceededError(Exception):
    """Raised when the API rate limit is exceeded."""
    pass


def replace_images_in_markdown(markdown_str: str, images_dict: dict, decorator: str = "") -> str:
    """
    Replace image placeholders in markdown with base64-encoded images.
    Optionally, specify a decorator that will encapsulate images in tags. For example, <img>image_markdown</img>.

    Args:
        markdown_str: Markdown text containing image placeholders
        images_dict: Dictionary mapping image IDs to base64 strings

    Returns:
        Markdown text with images replaced by base64 data
    """

    for img_name, base64_str in images_dict.items():
        img_md = f"![{img_name}]({base64_str})"

        if decorator != "":
            img_md = f"<{decorator}>{img_md}</{decorator}>"

        markdown_str = markdown_str.replace(
            f"![{img_name}]({img_name})", img_md)

    return markdown_str


def get_combined_markdown(ocr_response: OCRResponse, decorator: str = "") -> str:
    """
    Combine OCR text and images into a single markdown document.
    Optionally, specify a decorator that will encapsulate images in tags. For example, <img>image_markdown</img>.

    Args:
        ocr_response: Response from OCR processing containing text and images

    Returns:
        Combined markdown string with embedded images
    """
    markdowns: list[str] = []
    # Extract images from page
    for page in ocr_response.pages:
        image_data = {}

        for img in page.images:
            image_data[img.id] = img.image_base64

        # Replace image placeholders with actual images
        markdowns.append(replace_images_in_markdown(
            page.markdown, image_data, decorator))

    return "\n\n".join(markdowns)


def invoke_pdf_ocr(pdf_filepath: str, retries: int = 0) -> OCRResponse:
    '''
    Uses Mistral OCR to process a PDF.
    Returns the response OCRResponse object.
    '''

    if retries > 5:
        print("\nERROR in invoke_pdf_ocr. Max retries reached. Aborting.")
        raise APILimitExceededError("Max retries reached. Aborting.")

    try:

        # Upload PDF file to Mistral's OCR service
        client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
        pdf_file = pdf_filepath

        uploaded_file = client.files.upload(
            file={
                "file_name": pdf_file.stem,
                "content": pdf_file.read_bytes(),
            },
            purpose="ocr",
        )

        # Get URL for the uploaded file
        signed_url = client.files.get_signed_url(
            file_id=uploaded_file.id, expiry=1)

        # Process PDF with OCR, including embedded images
        pdf_response = client.ocr.process(
            document=DocumentURLChunk(document_url=signed_url.url),
            model="mistral-ocr-latest",
            include_image_base64=True
        )

        return pdf_response

    except Exception as e:
        print("\nERROR in invoke_pdf_ocr: {e}")

        if "throttling" in str(e).lower():
            retries += 1
            delay = retries * 10
            print(
                f"Throttling encountered. Retrying in {delay}s (retry #{retries}).")
            time.sleep(delay)
            return invoke_pdf_ocr(pdf_filepath, retries)

        raise e


def md_to_openai(pdf_markdown: str, tag: str) -> list:
    '''
    Splits the markdown string into 'text' and 'image' keys while preserving order of elements.
    Returns an ordered list of dictionaries containing {'text' | 'image': str | bytes}.
    '''

    pdf_content = []
    remaining = pdf_markdown

    while len(remaining) > 0:
        text, sep, after = remaining.partition(f"<{tag}>")
        image_md, sep, remaining = after.partition(f"</{tag}>")
        junk, sep, image_md = image_md.partition('(')
        image_bytes, sep, junk = image_md.rpartition(')')

        if text.strip() != "":
            pdf_content.append({
                'type': 'text',
                'text': text
            })

        if image_bytes.strip() != "":
            pdf_content.append({
                'type': 'image_url',
                'image_url': {'url': image_bytes}
            })

    return pdf_content


def pdf_to_openai(pdf_filepath: str, tag: str = "") -> list:
    '''
    Runs OCR on the PDF file using Mistral OCR and formats the response to be compatible with OpenAI API calls.
    Optionally, specify a tag to encapsulate the response.
    Example output: 
    [
        {'type': 'text', 'text': '<{tag}>'}, 
        {'type': 'text', 'text': pdf_text_content}, 
        {'type': 'image_url', 'image_url': {'url': "data:image/jpeg;base64,{base64_image}"}}
        {'type': 'text', 'text': '<{/tag}>'}, 
    ]
    '''

    try:
        pdf_response = invoke_pdf_ocr(Path(pdf_filepath))
        decorator = "pdf_img"
        pdf_md = get_combined_markdown(pdf_response, decorator)
        pdf_content = md_to_openai(pdf_md, decorator)

        if tag != "":
            pdf_content = [{"type": "text", "text": f"<{tag}>"}] + \
                pdf_content + [{"type": "text", "text": f"</{tag}>"}]

        return pdf_content

    except Exception as e:
        print("\nERROR in pdf_to_openai: {e}")
        raise e
