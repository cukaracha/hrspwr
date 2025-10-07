import json
import os
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from lib.secrets import load_secrets
from parts_agent import run_workflow


def get_categories_md(categories: Dict[str, Any]) -> str:
    """
    Convert categories dictionary to markdown format, showing only leaf nodes.

    Args:
        categories: Dictionary containing category hierarchy with structure:
            {
                "100001": {
                    "text": "Body",
                    "children": {
                        "100216": {
                            "text": "Fuel Tank/Parts",
                            "children": []
                        },
                        "100219": {
                            "text": "Trim/Protection/Decorative Strips/Emblems",
                            "children": {
                                "100740": {
                                    "text": "Trim/Protection Strips",
                                    "children": []
                                }
                            }
                        }
                    }
                }
            }

    Returns:
        Markdown-formatted string with parent categories as headers and
        only leaf node categories (categories with no children) as bulleted lists with IDs

    Example output:
        # Body
        - Fuel Tank/Parts (100216)
        - Trim/Protection Strips (100740)

        # Engine
        - Engine Timing (100003)
    """
    # Unwrap the "categories" wrapper if present
    if "categories" in categories and isinstance(categories.get("categories"), dict):
        print("UNWRAPPING 'categories' wrapper layer")
        categories = categories["categories"]

    def collect_leaf_nodes(node: Dict[str, Any], parent_name: str) -> List[tuple]:
        """
        Recursively collect all leaf nodes (categories with no children).
        Returns list of tuples: (category_id, category_name, parent_name)
        """
        leaf_nodes = []
        children = node.get('children', {})

        # If children is a list (empty), this is a leaf node
        if isinstance(children, list) and len(children) == 0:
            return leaf_nodes

        # If children is a dict, iterate through it
        if isinstance(children, dict):
            for child_id, child_data in children.items():
                child_name = child_data.get('text', child_id)
                child_children = child_data.get('children', {})

                # Check if this is a leaf node (no children or empty children)
                is_leaf = (isinstance(child_children, list) and len(child_children) == 0) or \
                         (isinstance(child_children, dict) and len(child_children) == 0)

                if is_leaf:
                    # This is a leaf node, add it
                    leaf_nodes.append((child_id, child_name, parent_name))
                else:
                    # This has children, recurse into it
                    leaf_nodes.extend(collect_leaf_nodes(child_data, parent_name))

        return leaf_nodes

    markdown_lines = []

    # Iterate through parent categories (keys are IDs like "100001")
    for parent_id, parent_data in categories.items():
        # Get parent category name from 'text' field
        parent_name = parent_data.get('text', parent_id)

        # Add parent category as header
        markdown_lines.append(f"# {parent_name}")

        # Collect all leaf nodes under this parent
        leaf_nodes = collect_leaf_nodes(parent_data, parent_name)

        # Add leaf nodes as bulleted list with IDs
        for child_id, child_name, _ in leaf_nodes:
            markdown_lines.append(f"- {child_name} ({child_id})")

        # Add blank line between parent categories
        markdown_lines.append("")

    # Join all lines and strip trailing whitespace
    result = "\n".join(markdown_lines).strip()

    return result


def _search_single_part(part_description: str, categories: str, vehicle_id: int, country_filter_id: int) -> Dict[str, Any]:
    """
    Search for a single part using the parts agent workflow.

    Args:
        part_description: Part description string
        categories: Categories string to pass to the workflow
        vehicle_id: Vehicle ID for API requests
        country_filter_id: Country filter ID for API requests

    Returns:
        Dictionary with search results including original part_description
    """
    try:
        print(f"Searching for part: {part_description} (vehicle_id: {vehicle_id}, country_filter_id: {country_filter_id})")

        # Run the parts agent workflow with categories, vehicle_id, and country_filter_id
        result = run_workflow(part_description, categories, vehicle_id, country_filter_id)

        # Add the original part description to the result
        result['part_description'] = part_description

        return result

    except Exception as e:
        print(f"Error searching for part '{part_description}': {str(e)}")
        return {
            'part_description': part_description,
            'status': 'ERROR',
            'message': f"Part search failed: {str(e)}",
            'retry_count': 0,
            'oem_numbers': [],
            's3image_uri': ''
        }


def main(parts_to_search: List[str], vehicle_id: int, country_filter_id: int, categories: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Search for multiple parts concurrently using the parts lookup agent.

    This function spins up multiple parts agents in parallel to search for each part
    concurrently and returns the consolidated parts list.

    Args:
        parts_to_search: List of part description strings
        vehicle_id: Vehicle ID for API requests
        country_filter_id: Country filter ID for API requests
        categories: Dictionary containing category hierarchy

    Returns:
        List of dictionaries, each containing:
        - part_description: str - Original part description
        - status: str - 'SUCCESS', 'NO_MATCH', 'ERROR', or 'MAX_RETRIES'
        - part: dict - Matched part details (if status is SUCCESS)
        - category: str - Selected category (if status is SUCCESS)
        - message: str - Error or status message (if applicable)
        - retry_count: int - Number of retries attempted

    Example:
        >>> parts = ["front brake pad", "air filter", "engine oil"]
        >>> results = main(parts, vehicle_id=19942, country_filter_id=1, categories=categories_dict)
        >>> print(results)
        [
            {
                'part_description': 'front brake pad',
                'status': 'SUCCESS',
                'part': {...},
                'category': 'Braking System',
                'retry_count': 0
            },
            {
                'part_description': 'air filter',
                'status': 'SUCCESS',
                'part': {...},
                'category': 'Filters',
                'retry_count': 0
            },
            {
                'part_description': 'engine oil',
                'status': 'SUCCESS',
                'part': {...},
                'category': 'Engine',
                'retry_count': 0
            }
        ]

    Raises:
        ValueError: If parts_to_search is empty or invalid
    """
    if not parts_to_search:
        raise ValueError("parts_to_search cannot be empty")

    # Convert categories dictionary to markdown format
    categories_md = get_categories_md(categories)

    results = []

    # Execute all part searches concurrently using ThreadPoolExecutor
    max_workers = min(len(parts_to_search), 10)  # Limit to 10 concurrent searches

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_part = {
            executor.submit(_search_single_part, part_description, categories_md, vehicle_id, country_filter_id): part_description
            for part_description in parts_to_search
        }

        # Collect results as they complete
        for future in as_completed(future_to_part):
            part_description = future_to_part[future]
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                print(f"Exception occurred for part '{part_description}': {str(e)}")
                results.append({
                    'part_description': part_description,
                    'status': 'ERROR',
                    'message': f"Unexpected error: {str(e)}",
                    'retry_count': 0,
                    'oem_numbers': [],
                    's3image_uri': ''
                })

    print(f"Completed searching for {len(results)} parts")
    return results


def lambda_handler(event, context):
    """
    AWS Lambda handler for parallel parts lookup.

    Args:
        event: API Gateway event containing list of parts to search in body
        context: Lambda context object

    Expected request body:
        {
            "vehicle_id": 19942,
            "country_filter_id": 1,
            "categories": {
                "CategoryName": {
                    "categoryId": 123,
                    "categoryName": "CategoryName",
                    "level": 1,
                    "children": {...}
                }
            },
            "parts": [
                "front brake pad",
                "air filter",
                "engine oil"
            ]
        }

    Returns:
        API Gateway response with list of search results
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

        # Extract vehicle_id
        vehicle_id = body.get('vehicle_id')
        if not vehicle_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Missing required field: vehicle_id'
                })
            }

        if not isinstance(vehicle_id, int):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Field "vehicle_id" must be an integer'
                })
            }

        # Extract country_filter_id
        country_filter_id = body.get('country_filter_id')
        if not country_filter_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Missing required field: country_filter_id'
                })
            }

        if not isinstance(country_filter_id, int):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Field "country_filter_id" must be an integer'
                })
            }

        # Extract categories dictionary
        categories = body.get('categories')
        if not categories:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Missing required field: categories (dictionary)'
                })
            }

        if not isinstance(categories, dict):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Field "categories" must be a dictionary'
                })
            }

        # Extract parts list
        parts_to_search = body.get('parts')
        if not parts_to_search:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Missing required field: parts (array of part description strings)'
                })
            }

        if not isinstance(parts_to_search, list):
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Field "parts" must be an array of strings'
                })
            }

        # Process parts lookup
        results = main(parts_to_search, vehicle_id, country_filter_id, categories)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'results': results,
                'total_parts': len(results)
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
        print(f"Error in parts lookup: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Parts lookup failed',
                'details': str(e)
            })
        }
