import json
import os
import boto3
from typing import Dict, Any


def load_secrets(secret_arn: str) -> None:
    """
    Load secrets from AWS Secrets Manager and set them as environment variables.

    Args:
        secret_arn: The ARN of the secret in AWS Secrets Manager

    Raises:
        ValueError: If secret_arn is None or empty
        RuntimeError: If secret retrieval or parsing fails
    """
    if not secret_arn:
        raise ValueError("secret_arn cannot be None or empty")

    try:
        # Create Secrets Manager client
        secrets_client = boto3.client('secretsmanager')

        # Retrieve the secret
        response = secrets_client.get_secret_value(SecretId=secret_arn)

        # Parse secret string (should be JSON)
        if 'SecretString' in response:
            secret_dict: Dict[str, Any] = json.loads(response['SecretString'])
        else:
            raise RuntimeError("Secret does not contain SecretString")

        # Set each key-value pair as environment variable
        for key, value in secret_dict.items():
            os.environ[key] = str(value)
            print(f"Loaded secret: {key}")

    except json.JSONDecodeError as e:
        raise RuntimeError(f"Failed to parse secret as JSON: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Failed to load secrets from ARN: {str(e)}")
