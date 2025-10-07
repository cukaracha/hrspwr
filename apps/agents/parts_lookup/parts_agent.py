from typing import Dict, Any, TypedDict, List
from langgraph.graph import StateGraph, END
from nodes import infer_category_node, get_parts_list_node, match_part_node, get_part_details_node


class AgentState(TypedDict):
    """State schema for the parts lookup agent workflow."""
    part_description: str
    categories: str
    category_id: str
    parts_list: List[Dict[str, Any]]
    chat_history: List[Dict[str, Any]]
    retry_count: int
    result: Dict[str, Any]
    error: str
    vehicle_id: int
    country_filter_id: int
    oem_numbers: List[str]
    s3image_uri: str


def should_retry(state: AgentState) -> str:
    """
    Conditional routing function to determine next step after get_parts_list_node.

    Args:
        state: Current agent state

    Returns:
        Next node name: 'infer_category' for retry, 'match_part' for success, 'end' for max retries
    """
    # Check if there was an error
    if state.get('error') in ['API_UNAVAILABLE', 'API_ERROR']:
        retry_count = state.get('retry_count', 0)

        # Max 3 retries
        if retry_count >= 3:
            print(f"Max retries ({retry_count}) reached. Ending workflow with ERROR.")
            return 'end'
        else:
            print(f"Retry {retry_count}/3: Attempting different category selection.")
            return 'infer_category'

    # No error - proceed to match part
    return 'match_part'


def create_workflow() -> StateGraph:
    """
    Create and configure the LangGraph workflow for parts lookup.

    Returns:
        Compiled StateGraph workflow
    """
    # Create the graph
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("infer_category", infer_category_node)
    workflow.add_node("get_parts_list", get_parts_list_node)
    workflow.add_node("match_part", match_part_node)
    workflow.add_node("get_part_details", get_part_details_node)

    # Set entry point
    workflow.set_entry_point("infer_category")

    # Add edges
    # Always go from infer_category to get_parts_list
    workflow.add_edge("infer_category", "get_parts_list")

    # Conditional routing after get_parts_list
    workflow.add_conditional_edges(
        "get_parts_list",
        should_retry,
        {
            "infer_category": "infer_category",  # Retry with different category
            "match_part": "match_part",           # Success - proceed to matching
            "end": END                             # Max retries - terminate
        }
    )

    # Go from match_part to get_part_details
    workflow.add_edge("match_part", "get_part_details")

    # Always end after get_part_details
    workflow.add_edge("get_part_details", END)

    # Compile the workflow
    return workflow.compile()


def run_workflow(part_description: str, categories: str, vehicle_id: int, country_filter_id: int) -> Dict[str, Any]:
    """
    Run the parts lookup workflow to find a matching part.

    This function is the main entry point for the parts lookup agent. It will:
    1. Infer the most appropriate category from the given list
    2. Fetch parts list from the REST API (with up to 3 retries if category is invalid)
    3. Match the specific part from the list using LLM

    Args:
        part_description: Text description of the part to search for
        categories: Markdown-formatted string of available part categories
        vehicle_id: Vehicle ID for API requests
        country_filter_id: Country filter ID for API requests

    Returns:
        Dictionary containing:
        - status: 'SUCCESS', 'NO_MATCH', 'ERROR', or 'MAX_RETRIES'
        - part: Matched part details (if status is SUCCESS)
        - category: Selected category (if status is SUCCESS)
        - message: Error or status message
        - retry_count: Number of retries attempted

    Example:
        >>> categories_md = "# Braking System\\n- Brake Pads (100006)\\n\\n# Engine\\n- Oil Filter (100023)"
        >>> result = run_workflow("brake pad for front wheel", categories_md, 19942, 1)
        >>> print(result)
        {
            'status': 'SUCCESS',
            'part': {'part_id': '12345', 'part_name': 'Front Brake Pad Set', ...},
            'category': 'Braking System'
        }
    """
    # Initialize state
    initial_state = AgentState(
        part_description=part_description,
        categories=categories,
        category_id='',
        parts_list=[],
        chat_history=[],
        retry_count=0,
        result={},
        error='',
        vehicle_id=vehicle_id,
        country_filter_id=country_filter_id,
        oem_numbers=[],
        s3image_uri=''
    )

    # Create and run workflow
    app = create_workflow()

    try:
        # Run the workflow
        final_state = app.invoke(initial_state)

        # Check if we hit max retries
        if final_state.get('retry_count', 0) >= 3 and not final_state.get('result'):
            return {
                'status': 'MAX_RETRIES',
                'message': 'Unable to find valid category after 3 attempts',
                'retry_count': final_state.get('retry_count', 0),
                'oem_numbers': [],
                's3image_uri': ''
            }

        # Return the result from the final state
        result = final_state.get('result', {})
        result['retry_count'] = final_state.get('retry_count', 0)
        result['oem_numbers'] = final_state.get('oem_numbers', [])
        result['s3image_uri'] = final_state.get('s3image_uri', '')

        return result

    except Exception as e:
        print(f"Workflow execution failed: {str(e)}")
        return {
            'status': 'ERROR',
            'message': f"Workflow execution failed: {str(e)}",
            'retry_count': 0
        }


# Example usage (for testing)
if __name__ == "__main__":
    # Test the workflow
    test_description = "front brake pad"
    test_categories = "Braking System,Engine,Suspension/Damping,Wheels/Tyres"
    test_vehicle_id = 19942
    test_country_filter_id = 1

    print(f"Testing parts lookup workflow...")
    print(f"Part description: {test_description}")
    print(f"Categories: {test_categories}")
    print(f"Vehicle ID: {test_vehicle_id}")
    print(f"Country Filter ID: {test_country_filter_id}\n")

    result = run_workflow(test_description, test_categories, test_vehicle_id, test_country_filter_id)

    print(f"\nWorkflow Result:")
    print(f"Status: {result.get('status')}")
    print(f"Retry Count: {result.get('retry_count')}")

    if result.get('status') == 'SUCCESS':
        print(f"Category: {result.get('category')}")
        print(f"Part: {result.get('part')}")
    else:
        print(f"Message: {result.get('message')}")
