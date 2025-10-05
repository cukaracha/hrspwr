import os
import sys
import uuid
import base64
import json
import boto3
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from lib import (
    mistral_client,
    openai_client
)


def get_api_keys():
    """
    Retrieve API keys from AWS Secrets Manager.
    """
    secret_arn = os.environ.get('SECRET_ARN')
    if not secret_arn:
        raise ValueError("SECRET_ARN environment variable not set")

    secrets_client = boto3.client('secretsmanager')
    try:
        response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(response['SecretString'])
        return secret_data.get('MISTRAL_API_KEY'), secret_data.get('OPENAI_API_KEY')
    except Exception as e:
        print(f"Error retrieving secrets: {str(e)}")
        raise


def parse_tags(response: str, tag: str) -> str:
    '''
    Parses the content from within the given tags.
    Returns a tuple containing (tag_contents, remaining text)
    '''

    junk, sep, remaining = response.partition(f"<{tag}>")
    val, sep, junk = remaining.partition(f"</{tag}>")
    return (val, remaining)


def process_pdf_workflow(pdf_b64_content, filename, doc_type, tmp_dir):
    """
    Complete PDF processing workflow: decode base64, save to temp file, and invoke Mistral OCR.

    Args:
        pdf_b64_content: Base64 encoded PDF content
        filename: Name of the PDF file (e.g., "assignment.pdf")
        doc_type: Document type identifier (e.g., "assignment" or "rubric")
        tmp_dir: Temporary directory path

    Returns:
        Content extracted by Mistral OCR
    """
    # Create file path
    pdf_path = tmp_dir / filename

    # Decode base64 and save PDF
    pdf_bytes = base64.b64decode(pdf_b64_content)
    with open(pdf_path, 'wb') as f:
        f.write(pdf_bytes)

    print(f"Processing {doc_type} PDF with Mistral OCR...")

    # Process PDF using Mistral OCR
    content = mistral_client.pdf_to_openai(str(pdf_path), doc_type)

    return content, pdf_path


def lambda_handler(event, context):
    """
    Lambda function that accepts two PDF files (assignment task definition and grading rubric),
    processes them using Mistral OCR, and extracts assignment information using OpenAI.

    Expected event structure from API Gateway:
    {
        "body": "{\"assignment_pdf\": \"base64_encoded_pdf_content\", \"rubric_pdf\": \"base64_encoded_pdf_content\"}",
        "headers": {...},
        "httpMethod": "POST",
        ...
    }
    """

    # Get API keys from AWS Secrets Manager
    mistral_api_key, openai_api_key = get_api_keys()
    os.environ['MISTRAL_API_KEY'] = mistral_api_key or ''
    os.environ['OPENAI_API_KEY'] = openai_api_key or ''

    try:
        # Generate unique directory for this request
        request_id = str(uuid.uuid4())
        tmp_dir = Path(f"/tmp/{request_id}")
        tmp_dir.mkdir(parents=True, exist_ok=True)

        # Parse the request body from API Gateway
        if 'body' in event:
            # This is an API Gateway request
            try:
                request_body = json.loads(event['body'])
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON in request body")
        else:
            # This is a direct Lambda invocation (for testing)
            request_body = event

        # Extract PDF files from parsed request body
        assignment_pdf_b64 = request_body.get('assignment_pdf')
        rubric_pdf_b64 = request_body.get('rubric_pdf')

        if not assignment_pdf_b64 or not rubric_pdf_b64:
            raise ValueError("Both assignment_pdf and rubric_pdf are required")

        # Process both PDFs in parallel using the complete workflow
        print("Processing PDFs with complete workflow in parallel...")

        # Use ThreadPoolExecutor to run both PDF processing workflows in parallel
        with ThreadPoolExecutor(max_workers=2) as executor:
            # Submit both complete workflows
            assignment_future = executor.submit(
                process_pdf_workflow,
                assignment_pdf_b64,
                "assignment.pdf",
                "assignment",
                tmp_dir
            )
            rubric_future = executor.submit(
                process_pdf_workflow,
                rubric_pdf_b64,
                "rubric.pdf",
                "rubric",
                tmp_dir
            )

            # Wait for both tasks to complete and get results
            assignment_content, assignment_pdf_path = assignment_future.result()
            rubric_content, rubric_pdf_path = rubric_future.result()

        print("Both PDFs processed successfully")

        # Concatenate the content lists
        combined_content = assignment_content + rubric_content

        # Create messages for OpenAI API
        system_message = {
            "role": "system",
            "content": """Your task is to analyze assignment documents and grading rubrics to extract key information. If any of the information is not available, make an educated guess.

Instructions:
1) Extract the name of the assignment. The name should be concise and use less than 10 words. Output your response within <name></name> tags.
2) Extract a concise description of the assignment using less than 20 words. Output your response within <desc></desc> tags.
3) Extract the submission requirements for this assignment, for example a written email and recorded video. There may be more than one submission requirement. For each submission requirement, you must assign the modality as "written", "image", "audio", or "video". You must also extract a concise description of the submission requirement using less than 20 words. Output each submission requirement within <sub_N></sub_N> tags, where N is the index of the submissions starting from 1. The modality and description should be nested within the <sub_N></sub_N> tags. Output the modality within <mod></mod> tags and output the description within <sub_desc></sub_desc> tags.

Here is an example of the expected output:

<name>
A concise name for the assignment in less than 10 words.
</name>

<desc>
A concise description of the assignment using less than 20 words.
</desc>

<sub_1>
<mod>
The modality of the first submission as "written", "image", "audio", or "video". Use exactly one word.
</mod>

<sub_desc>
A concise description of the first submission requirement using less than 20 words.
</sub_desc>
</sub_1>

<sub_2>
<mod>
The modality of the second submission as "written", "image", "audio", or "video". Use exactly one word.
</mod>

<sub_desc>
A concise description of the second submission requirement using less than 20 words.
</sub_desc>
</sub_2>
"""
        }

        user_message = {
            "role": "user",
            "content": combined_content
        }

        messages = [system_message, user_message]

        # Invoke OpenAI model
        print("Analyzing content with OpenAI...")
        response = openai_client.invoke_model(messages)

        # Extract text response
        response_text = openai_client.get_response_text(response)

        # Parse the response_text to extract values from the XML tags and format into a JSON output
        try:
            # Extract name and description
            name, _ = parse_tags(response_text, "name")
            description, _ = parse_tags(response_text, "desc")

            # Extract submissions
            submissions = []
            submission_index = 1

            while True:
                # Try to extract submission with current index
                submission_tag = f"sub_{submission_index}"
                submission_content, remaining = parse_tags(
                    response_text, submission_tag)

                if not submission_content:
                    # No more submissions found
                    break

                # Extract modality and description from within the submission
                modality, _ = parse_tags(submission_content, "mod")
                sub_description, _ = parse_tags(submission_content, "sub_desc")

                # Add to submissions list
                submissions.append({
                    "modality": modality.strip(),
                    "description": sub_description.strip()
                })

                submission_index += 1

            # Create the formatted JSON output
            parsed_analysis = {
                "name": name.strip(),
                "description": description.strip(),
                "submissions": submissions
            }

            print("Analysis complete. Parsed result:")
            print(json.dumps(parsed_analysis, indent=4))

        except Exception as parse_error:
            print(f"Error parsing response: {str(parse_error)}")
            # Fallback to original response if parsing fails
            parsed_analysis = {
                "name": "Parse Error",
                "description": "Failed to parse response",
                "submissions": [],
                # "raw_response": response_text
            }

        # # Print the raw response for debugging
        # print("Raw OpenAI Response:")
        # print(response_text)

        # Clean up temporary files
        try:
            assignment_pdf_path.unlink()
            rubric_pdf_path.unlink()
            tmp_dir.rmdir()
        except Exception as cleanup_error:
            print(
                f"Warning: Failed to cleanup temporary files: {cleanup_error}")

        # Return the response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'success': True,
                'analysis': parsed_analysis
            })
        }

    except Exception as e:
        print(f"Error processing assignment: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': True,
                'Content-Type': 'application/json',
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }


def main():
    """
    Main function for local testing.
    Usage: python analyze_assignment.py <assignment_pdf_path> <rubric_pdf_path>
    """
    if len(sys.argv) != 3:
        print("Error: Missing required arguments!")
        print("Usage: python analyze_assignment.py <assignment_pdf_path> <rubric_pdf_path>")
        print("Example: python analyze_assignment.py ./assignment.pdf ./rubric.pdf")
        print(f"You provided {len(sys.argv)-1} arguments, but 2 are required.")
        sys.exit(1)

    assignment_pdf_path = sys.argv[1]
    rubric_pdf_path = sys.argv[2]

    # Validate file paths
    if not os.path.exists(assignment_pdf_path):
        print(f"Error: Assignment PDF file not found: {assignment_pdf_path}")
        sys.exit(1)

    if not os.path.exists(rubric_pdf_path):
        print(f"Error: Rubric PDF file not found: {rubric_pdf_path}")
        sys.exit(1)

    print(f"Processing assignment PDF: {assignment_pdf_path}")
    print(f"Processing rubric PDF: {rubric_pdf_path}")

    # For local testing, set environment variables from system environment or defaults
    os.environ.setdefault('MISTRAL_API_KEY', '')
    os.environ.setdefault('OPENAI_API_KEY', '')
    # Mock value for local testing
    os.environ.setdefault('SECRET_ARN', 'local-testing')

    try:
        # Read and encode PDF files
        with open(assignment_pdf_path, 'rb') as f:
            assignment_pdf_b64 = base64.b64encode(f.read()).decode('utf-8')

        with open(rubric_pdf_path, 'rb') as f:
            rubric_pdf_b64 = base64.b64encode(f.read()).decode('utf-8')

        # Create mock event
        event = {
            'assignment_pdf': assignment_pdf_b64,
            'rubric_pdf': rubric_pdf_b64
        }

        # Mock context (not used in our function)
        context = {}

        # For local testing, override get_api_keys to use environment variables directly
        def mock_get_api_keys():
            return os.environ.get('MISTRAL_API_KEY', ''), os.environ.get('OPENAI_API_KEY', '')

        # Monkey patch for local testing
        current_module = sys.modules[__name__]
        current_module.get_api_keys = mock_get_api_keys

        # Call the lambda handler
        result = lambda_handler(event, context)

        # Print results
        print("\n" + "="*50)
        print("LAMBDA FUNCTION RESULT:")
        print("="*50)
        print(json.dumps(result, indent=2))

        return result

    except Exception as e:
        print(f"Error in main function: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
