import json
import os
from lib import openai_client
from lib.restapi import _cached_api_request


def _load_prompts() -> dict:
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


def infer_category_node(state):
    """
    Use OpenAI LLM to infer the most appropriate category for the part description.

    Args:
        state: Current agent state containing part_description and categories

    Returns:
        Updated state with category_id
    """
    try:
        prompts = _load_prompts()

        # Build the user prompt with part description and categories
        # Categories are already in markdown format from lookup_parts.py
        user_prompt = prompts['infer_category'].format(
            part_description=state['part_description'],
            categories=state['categories']
        )

        # Build messages list - include system prompt and chat history if this is a retry
        messages = [
            {
                'role': 'system',
                'content': prompts['system']
            }
        ]

        # Add previous chat history (if retrying after invalid category)
        if state.get('chat_history'):
            # Convert chat history from Bedrock format to OpenAI format
            for msg in state['chat_history']:
                if msg['role'] == 'user':
                    messages.append({
                        'role': 'user',
                        'content': msg['content'][0]['text'] if isinstance(msg['content'], list) else msg['content']
                    })
                elif msg['role'] == 'assistant':
                    messages.append({
                        'role': 'assistant',
                        'content': msg['content'][0]['text'] if isinstance(msg['content'], list) else msg['content']
                    })

        # Add current user message
        messages.append({
            'role': 'user',
            'content': user_prompt
        })

        # Call OpenAI
        result = openai_client.invoke_model_text(messages)
        print(f"LLM category inference result: {result}")

        # Parse subcategory_id and category name from XML tags
        category_id = openai_client._parse_xml_tag(result, 'subcategory_id')
        category_name = openai_client._parse_xml_tag(result, 'category')

        # Update chat history with assistant's response (using OpenAI format)
        updated_history = state.get('chat_history', []).copy()
        updated_history.append({
            'role': 'user',
            'content': user_prompt
        })
        updated_history.append({
            'role': 'assistant',
            'content': result
        })

        return {
            **state,
            'category_id': category_id,
            'category_name': category_name,
            'chat_history': updated_history,
            'error': ''
        }

    except Exception as e:
        print(f"Error in infer_category_node: {str(e)}")
        return {
            **state,
            'error': f"Category inference failed: {str(e)}"
        }


def get_parts_list_node(state):
    """
    Call REST API to get the list of parts in the selected category.

    Args:
        state: Current agent state containing category_id

    Returns:
        Updated state with parts_list or error message in chat_history
    """
    try:
        # Get required parameters from environment
        rapidapi_key = os.environ.get('RAPIDAPI_KEY', '')
        if not rapidapi_key:
            raise ValueError("RAPIDAPI_KEY environment variable not set")

        # Get vehicle_id from state
        vehicle_id = state.get('vehicle_id')
        if not vehicle_id:
            raise ValueError("vehicle_id not provided in state")

        category_id = state.get('category_id')

        if not category_id:
            raise ValueError("category_id not provided in state")

        # Build API URL
        type_id = 1  # Passenger cars
        lang_id = 4  # English
        url = f"https://auto-parts-catalog.p.rapidapi.com/articles/list/type-id/{type_id}/vehicle-id/{vehicle_id}/category-id/{category_id}/lang-id/{lang_id}"

        headers = {
            "x-rapidapi-host": "auto-parts-catalog.p.rapidapi.com",
            "x-rapidapi-key": rapidapi_key
        }

        print(f"Calling REST API for category ID: {category_id}")

        # Make cached API request
        response = _cached_api_request(url, headers)
        data = response.json()

        # Extract articles list from response
        parts_list = data.get('articles', [])
        count_articles = data.get('countArticles', 0)

        print(f"Found {count_articles} articles in category ID {category_id}")

        if not parts_list or count_articles == 0:
            # API returned no parts - add invalid_category message to chat
            prompts = _load_prompts()

            updated_history = state.get('chat_history', []).copy()
            updated_history.append({
                'role': 'user',
                'content': prompts['invalid_category']
            })

            return {
                **state,
                'chat_history': updated_history,
                'retry_count': state.get('retry_count', 0) + 1,
                'error': 'API_UNAVAILABLE'
            }

        # Success - parts retrieved
        return {
            **state,
            'parts_list': parts_list,
            'error': ''
        }

    except Exception as e:
        print(f"Error in get_parts_list_node: {str(e)}")

        # Add error message to chat history
        prompts = _load_prompts()
        updated_history = state.get('chat_history', []).copy()
        updated_history.append({
            'role': 'user',
            'content': prompts['invalid_category']
        })

        return {
            **state,
            'chat_history': updated_history,
            'retry_count': state.get('retry_count', 0) + 1,
            'error': 'API_ERROR'
        }


def get_part_details_node(state):
    """
    Retrieve OEM numbers and S3 image URI for the matched part by iterating through the parts list
    and fetching detailed information for matching articles.

    Args:
        state: Current agent state containing parts_list, result with part_name, and country_filter_id

    Returns:
        Updated state with oem_numbers list and s3image_uri
    """
    try:
        # Get required parameters from environment
        rapidapi_key = os.environ.get('RAPIDAPI_KEY', '')
        if not rapidapi_key:
            raise ValueError("RAPIDAPI_KEY environment variable not set")

        # Extract required data from state
        parts_list = state.get('parts_list', [])
        result = state.get('result', {})
        part_name = result.get('part_name', '')
        country_filter_id = state.get('country_filter_id')

        if not part_name:
            return {
                **state,
                'oem_numbers': [],
                'error': 'No part name found in result'
            }

        if not country_filter_id:
            return {
                **state,
                'oem_numbers': [],
                'error': 'country_filter_id not provided'
            }

        print(f"Looking for OEM numbers for part: {part_name}")

        # Iterate through parts_list
        for article in parts_list:
            article_product_name = article.get('articleProductName', '')

            # Check if this article matches our part name
            if article_product_name.strip().lower() == part_name.strip().lower():
                article_id = article.get('articleId')

                if not article_id:
                    print(f"No articleId found for {article_product_name}, skipping...")
                    continue

                print(f"Found matching article: {article_product_name} (ID: {article_id})")

                # Build API URL
                type_id = 1  # Passenger cars
                lang_id = 4  # English
                url = f"https://auto-parts-catalog.p.rapidapi.com/articles/article-complete-details/type-id/{type_id}/article-id/{article_id}/lang-id/{lang_id}/country-filter-id/{country_filter_id}"

                headers = {
                    "x-rapidapi-host": "auto-parts-catalog.p.rapidapi.com",
                    "x-rapidapi-key": rapidapi_key
                }

                # Make cached API request
                response = _cached_api_request(url, headers)
                data = response.json()

                # Get article details
                article_details = data.get('article', {})
                oem_list = article_details.get('oemNo', [])

                # Check if OEM numbers are available
                if oem_list and len(oem_list) > 0:
                    # Extract all oemDisplayNo values
                    oem_numbers = [oem.get('oemDisplayNo') for oem in oem_list if oem.get('oemDisplayNo')]

                    if oem_numbers:
                        # Get s3image URI if available
                        s3image_uri = article_details.get('s3image', '')
                        print(f"Found {len(oem_numbers)} OEM numbers for article {article_id}")
                        if s3image_uri:
                            print(f"Found s3image URI: {s3image_uri}")

                        return {
                            **state,
                            'oem_numbers': oem_numbers,
                            's3image_uri': s3image_uri,
                            'error': ''
                        }
                    else:
                        print(f"No valid oemDisplayNo found for article {article_id}, continuing...")
                else:
                    print(f"No OEM numbers found for article {article_id}, continuing...")

        # No OEM numbers found for any matching article
        print(f"No OEM numbers found for part: {part_name}")
        return {
            **state,
            'oem_numbers': [],
            's3image_uri': '',
            'error': ''
        }

    except Exception as e:
        print(f"Error in get_part_details_node: {str(e)}")
        return {
            **state,
            'oem_numbers': [],
            's3image_uri': '',
            'error': f"Failed to get part details: {str(e)}"
        }


def _extract_parts(parts_list):
    """
    Extract unique article product names from parts list.

    Args:
        parts_list: List of article dictionaries

    Returns:
        List of unique article product names
    """
    if not parts_list:
        return []

    unique_names = set()
    for article in parts_list:
        if 'articleProductName' in article and article['articleProductName']:
            unique_names.add(article['articleProductName'])

    return sorted(list(unique_names))


def match_part_node(state):
    """
    Use OpenAI LLM to match the part description to the most appropriate part
    from the retrieved parts list.

    Args:
        state: Current agent state containing part_description and parts_list

    Returns:
        Updated state with result containing matched part details
    """
    try:
        # Extract unique part names
        unique_parts = _extract_parts(state['parts_list'])

        # Handle empty parts list
        if not unique_parts:
            return {
                **state,
                'result': {'status': 'NO_MATCH', 'message': 'No parts found in the category'},
                'error': ''
            }

        # Handle single unique part - skip LLM call
        if len(unique_parts) == 1:
            print(f"Only one unique part found: {unique_parts[0]}, skipping LLM call")
            return {
                **state,
                'result': {
                    'status': 'SUCCESS',
                    'part_name': unique_parts[0],
                    'category_id': state['category_id']
                },
                'error': ''
            }

        # Multiple parts - use LLM to match
        prompts = _load_prompts()

        # Format the parts list as bullet list
        parts_text = "\n".join([f"- {part}" for part in unique_parts])

        # Build the user prompt
        user_prompt = prompts['match_part'].format(
            part_description=state['part_description'],
            parts_list=parts_text
        )

        # Build messages with system prompt
        messages = [
            {
                'role': 'system',
                'content': prompts['system']
            },
            {
                'role': 'user',
                'content': user_prompt
            }
        ]

        # Call OpenAI
        result = openai_client.invoke_model_text(messages)
        print(f"LLM part matching result: {result}")

        # Parse replacement part from XML tags
        replacement_part = openai_client._parse_xml_tag(result, 'replacement')

        # Validate the replacement part is in the unique parts list (case-insensitive)
        if not replacement_part:
            return {
                **state,
                'result': {'status': 'NO_MATCH', 'message': 'No suitable part found in the category'},
                'error': ''
            }

        # Check case-insensitive match
        replacement_lower = replacement_part.strip().lower()
        unique_parts_lower = [part.lower() for part in unique_parts]

        if replacement_lower not in unique_parts_lower:
            return {
                **state,
                'result': {'status': 'NO_MATCH', 'message': 'No suitable part found in the category'},
                'error': ''
            }

        return {
            **state,
            'result': {
                'status': 'SUCCESS',
                'part_name': replacement_part.strip(),
                'category_id': state['category_id']
            },
            'error': ''
        }

    except Exception as e:
        print(f"Error in match_part_node: {str(e)}")
        return {
            **state,
            'result': {'status': 'ERROR', 'message': f"Part matching failed: {str(e)}"},
            'error': f"Part matching failed: {str(e)}"
        }
