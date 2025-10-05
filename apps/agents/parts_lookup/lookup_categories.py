import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
import requests
import boto3
import re


# Constants
RAPIDAPI_KEY = "7f52966767mshdd7d2b2b14b58ddp13eeaajsn057c1530cd1c"
RAPIDAPI_HOST = "auto-parts-catalog.p.rapidapi.com"
TYPE_ID = 1  # Passenger cars
LANG_ID = 4  # English


def _load_prompts() -> Dict[str, str]:
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


def _invoke_bedrock_converse(messages: List[Dict[str, Any]]) -> str:
    """
    Call Amazon Bedrock's converse API with formatted messages.

    Args:
        messages: List of message dictionaries in Bedrock converse format
                 Example: [{"role": "user", "content": [{"text": "..."}]}]

    Returns:
        Response text from the model

    Raises:
        RuntimeError: If Bedrock invocation fails
    """
    try:
        bedrock_client = boto3.client('bedrock-runtime')

        # Call Bedrock Converse API
        response = bedrock_client.converse(
            modelId="global.anthropic.claude-sonnet-4-20250514-v1:0",
            messages=messages
        )

        # Extract and return response text
        return response['output']['message']['content'][0]['text'].strip()

    except Exception as e:
        raise RuntimeError(f"Bedrock converse API call failed: {str(e)}")


def _load_country_id_lookup() -> Dict[str, Any]:
    """
    Load country ID lookup from JSON file.

    Returns:
        Dictionary with lowercase country names as keys

    Raises:
        RuntimeError: If country lookup file cannot be loaded
    """
    try:
        lookup_path = os.path.join(os.path.dirname(__file__), 'countryId_lookup.json')
        with open(lookup_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise RuntimeError(f"Failed to load country ID lookup: {str(e)}")


def _get_country_filter_id(plant_country: str) -> int:
    """
    Get country filter ID from country name.

    Args:
        plant_country: Country name in uppercase (e.g., "GERMANY")

    Returns:
        Country filter ID

    Raises:
        ValueError: If country not found in lookup
    """
    country_lookup = _load_country_id_lookup()
    country_key = plant_country.lower()

    if country_key not in country_lookup:
        raise ValueError(f"Country '{plant_country}' not found in country lookup")

    return country_lookup[country_key]["id"]


def _get_manufacturer_id(make: str, type_id: int, country_filter_id: int) -> int:
    """
    Get manufacturer ID by matching manufacturer name.

    Args:
        make: Manufacturer name from VIN (e.g., "MERCEDES-BENZ")
        type_id: Vehicle type ID
        country_filter_id: Country filter ID

    Returns:
        Manufacturer ID

    Raises:
        RuntimeError: If API call fails
        ValueError: If manufacturer not found
    """
    try:
        url = f"https://{RAPIDAPI_HOST}/manufacturers/list/type-id/{type_id}"
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        print(f"Found {data['countManufactures']} manufacturers")

        # Match manufacturer name (case-insensitive)
        make_upper = make.upper()
        for manufacturer in data["manufacturers"]:
            if manufacturer["manufacturerName"].upper() == make_upper:
                print(f"Matched manufacturer: {manufacturer['manufacturerName']} (ID: {manufacturer['manufacturerId']})")
                return manufacturer["manufacturerId"]

        raise ValueError(f"Manufacturer '{make}' not found in API response")

    except requests.RequestException as e:
        raise RuntimeError(f"Manufacturer API request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Manufacturer lookup failed: {str(e)}")


def _get_model_id(vehicle_info: Dict[str, Any], type_id: int, lang_id: int,
                  country_filter_id: int, manufacturer_id: int) -> int:
    """
    Get model ID by matching model name and year range.

    Args:
        vehicle_info: Vehicle information dictionary containing model and model_year
        type_id: Vehicle type ID
        lang_id: Language ID
        country_filter_id: Country filter ID
        manufacturer_id: Manufacturer ID from previous step

    Returns:
        Model ID

    Raises:
        RuntimeError: If API call fails
        ValueError: If model not found
    """
    try:
        url = (f"https://{RAPIDAPI_HOST}/models/list/type-id/{type_id}/"
               f"manufacturer-id/{manufacturer_id}/lang-id/{lang_id}/"
               f"country-filter-id/{country_filter_id}")
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        print(f"Found {data['countModels']} models")

        model_year = int(vehicle_info.get("model_year", "0"))

        # Step 1: Filter models by year range
        # Go through each model and check if input model_year is within its year range
        year_filtered = []
        for model in data["models"]:
            try:
                # Extract year from date string using partition (e.g., "2016-09-01" -> "2016")
                year_from = int(model["modelYearFrom"].partition("-")[0])

                # Handle modelYearTo - can be None (ongoing) or a date string
                if model["modelYearTo"] is None:
                    year_to = None
                else:
                    year_to = int(model["modelYearTo"].partition("-")[0])

                # Check if input model_year is within this model's year range
                # If year_to is None, the model is still in production (no end date)
                is_within_range = False
                if year_to is None:
                    # Model has no end date, check if model_year >= year_from
                    is_within_range = (model_year >= year_from)
                else:
                    # Model has both start and end dates, check if model_year is between them
                    is_within_range = (year_from <= model_year <= year_to)

                # Shortlist if within range, otherwise discard
                if is_within_range:
                    year_filtered.append(model)

            except (ValueError, KeyError, AttributeError, TypeError) as e:
                # Skip entries with malformed data (e.g., invalid date format, missing fields)
                print(f"Skipping model due to error: {e} - Model: {model.get('modelName', 'Unknown')}")
                continue

        if not year_filtered:
            raise ValueError(f"No models found for year {model_year}")

        print(f"Shortlisted {len(year_filtered)} models matching year {model_year}:")
        for model in year_filtered:
            year_range = f"{model['modelYearFrom']} to {model['modelYearTo']}" if model['modelYearTo'] else f"{model['modelYearFrom']}+"
            print(f"  - {model['modelName']} (ID: {model['modelId']}, Years: {year_range})")

        # Step 2: Use Bedrock to select the best matching model
        # Prepare shortlisted models as a formatted string
        shortlisted_models = "\n".join([
            f"- {model['modelName']} (ID: {model['modelId']})"
            for model in year_filtered
        ])

        # Prepare vehicle info for prompt - include only available fields
        vehicle_info_for_prompt = {
            "model": vehicle_info.get("model", ""),
            "series": vehicle_info.get("series", ""),
            "trim": vehicle_info.get("trim", ""),
            "year": model_year
        }

        # Add optional fields if available
        optional_fields = [
            "body_class",
            "doors",
            "steering_location",
            "number_of_seats",
            "number_of_seat_rows",
            "transmission_style",
            "transmission_speeds",
            "drive_type",
            "engine_number_of_cylinders",
            "fuel_type_-_primary"
        ]

        for field in optional_fields:
            if field in vehicle_info and vehicle_info[field]:
                vehicle_info_for_prompt[field] = vehicle_info[field]

        prompts = _load_prompts()
        prompt = prompts["select_model"].format(
            vehicle_info=json.dumps(vehicle_info_for_prompt, indent=2),
            models=shortlisted_models
        )

        messages = [{"role": "user", "content": [{"text": prompt}]}]
        print(f"Calling Bedrock to select best model...")
        response_text = _invoke_bedrock_converse(messages)
        print(f"Bedrock response: {response_text}")

        # Extract modelId from XML tags
        match = re.search(r'<modelId>(\d+)</modelId>', response_text)
        if not match:
            raise ValueError(f"Could not extract modelId from Bedrock response: {response_text}")

        model_id = int(match.group(1))

        # Find the selected model for logging
        selected_model = next((m for m in year_filtered if m["modelId"] == model_id), None)
        if selected_model:
            print(f"Selected model: {selected_model['modelName']} (ID: {model_id})")
        else:
            print(f"Selected model ID: {model_id}")

        return model_id

    except requests.RequestException as e:
        raise RuntimeError(f"Model API request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Model lookup failed: {str(e)}")


def _get_vehicle_details(vehicle_id: int, type_id: int, lang_id: int,
                        country_filter_id: int) -> Dict[str, Any]:
    """
    Get detailed vehicle specifications by vehicle ID.

    Args:
        vehicle_id: Vehicle ID
        type_id: Vehicle type ID
        lang_id: Language ID
        country_filter_id: Country filter ID

    Returns:
        Dictionary containing vehicle type details

    Raises:
        RuntimeError: If API call fails
    """
    try:
        url = (f"https://{RAPIDAPI_HOST}/types/type-id/{type_id}/"
               f"vehicle-type-details/{vehicle_id}/lang-id/{lang_id}/"
               f"country-filter-id/{country_filter_id}")
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        return data.get("vehicleTypeDetails", {})

    except requests.RequestException as e:
        raise RuntimeError(f"Vehicle details API request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Vehicle details lookup failed: {str(e)}")


def _get_vehicle_id(vehicle_info: Dict[str, Any], type_id: int, model_id: int,
                    lang_id: int, country_filter_id: int) -> int:
    """
    Get vehicle ID by matching model types and filtering by vehicle year.

    Args:
        vehicle_info: Vehicle information containing model year and specs
        type_id: Vehicle type ID
        model_id: Model ID from previous step (list-vehicles-id)
        lang_id: Language ID
        country_filter_id: Country filter ID

    Returns:
        Vehicle ID

    Raises:
        RuntimeError: If API call fails
        ValueError: If vehicle not found
    """
    try:
        url = (f"https://{RAPIDAPI_HOST}/types/type-id/{type_id}/"
               f"list-vehicles-id/{model_id}/lang-id/{lang_id}/"
               f"country-filter-id/{country_filter_id}")
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        print(f"Found {data.get('countModelTypes', 0)} model types")

        # Get all unique vehicle IDs from modelTypes array
        model_types = data.get("modelTypes", [])

        if not model_types:
            raise ValueError(f"No model types found for model ID {model_id}")

        # Create non-repeating set of vehicle IDs
        vehicle_ids = list(set([mt.get("vehicleId") for mt in model_types if mt.get("vehicleId")]))
        print(f"Found {len(vehicle_ids)} unique vehicle IDs: {vehicle_ids}")

        # Get vehicle year, cylinder count, and fuel type from input
        model_year = int(vehicle_info.get("model_year", "0"))
        engine_cylinders = vehicle_info.get("engine_number_of_cylinders", "")
        input_fuel_type = vehicle_info.get("fuel_type_-_primary", "")

        # Convert cylinders to int if available
        input_cylinders = None
        if engine_cylinders:
            try:
                input_cylinders = int(engine_cylinders)
            except (ValueError, TypeError):
                print(f"Warning: Could not parse engine_number_of_cylinders: {engine_cylinders}")

        # Fetch details for each vehicle ID and filter sequentially
        shortlisted_vehicles = {}
        for vehicle_id in vehicle_ids:
            try:
                vehicle_details = _get_vehicle_details(vehicle_id, type_id, lang_id, country_filter_id)

                # Filter 1: Check year range
                try:
                    construction_start = vehicle_details.get("constructionIntervalStart", "")
                    construction_end = vehicle_details.get("constructionIntervalEnd", "")

                    year_from = None
                    year_to = None

                    if construction_start:
                        year_from = int(construction_start.partition("-")[0])

                    if construction_end:
                        year_to = int(construction_end.partition("-")[0])

                    is_within_range = False
                    if year_from:
                        if year_to:
                            is_within_range = (year_from <= model_year <= year_to)
                        else:
                            is_within_range = (model_year >= year_from)

                    if not is_within_range:
                        continue
                except (KeyError, ValueError, TypeError) as e:
                    print(f"  Skipping vehicle ID {vehicle_id}: Year filter error - {str(e)}")
                    continue

                # Filter 2: Check cylinder match
                try:
                    if input_cylinders is not None:
                        vehicle_cylinders = vehicle_details.get("numberOfCylinders")
                        if vehicle_cylinders is not None:
                            if int(vehicle_cylinders) != input_cylinders:
                                continue
                except (KeyError, ValueError, TypeError) as e:
                    print(f"  Skipping vehicle ID {vehicle_id}: Cylinder filter error - {str(e)}")
                    continue

                # Filter 3: Check fuel type match
                try:
                    if input_fuel_type:
                        vehicle_engine_type = vehicle_details.get("engineType", "")
                        if vehicle_engine_type:
                            # Case-insensitive comparison
                            if vehicle_engine_type.upper() != input_fuel_type.upper():
                                continue
                except (KeyError, ValueError, TypeError) as e:
                    print(f"  Skipping vehicle ID {vehicle_id}: Fuel type filter error - {str(e)}")
                    continue

                # All filters passed - add to shortlist
                shortlisted_vehicles[vehicle_id] = vehicle_details

            except Exception as e:
                print(f"Skipping vehicle ID {vehicle_id} due to error: {str(e)}")
                continue

        if not shortlisted_vehicles:
            filters = [f"year {model_year}"]
            if input_cylinders:
                filters.append(f"{input_cylinders} cylinders")
            if input_fuel_type:
                filters.append(f"fuel type {input_fuel_type}")
            raise ValueError(f"No vehicles found matching {', '.join(filters)}")

        print(f"\nShortlisted {len(shortlisted_vehicles)} vehicles matching year {model_year}:")
        for vehicle_id, details in shortlisted_vehicles.items():
            print(f"  Vehicle ID: {vehicle_id}")
            print(f"    Model: {details.get('manufacturerName')} {details.get('modelType')}")
            print(f"    Engine: {details.get('typeEngineName')}")
            print(f"    Construction: {details.get('constructionIntervalStart')} to {details.get('constructionIntervalEnd')}")
            print(f"    Capacity: {details.get('capacityLt')}L, Cylinders: {details.get('numberOfCylinders')}, {details.get('fuelType')}")
            print()

        # Return the first vehicle ID from shortlisted vehicles
        first_vehicle_id = next(iter(shortlisted_vehicles.keys()))
        print(f"Selected vehicle ID: {first_vehicle_id}")
        return first_vehicle_id

    except requests.RequestException as e:
        raise RuntimeError(f"Vehicle API request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Vehicle lookup failed: {str(e)}")


def _get_categories(type_id: int, lang_id: int, vehicle_id: int) -> Dict[str, Any]:
    """
    Get parts categories for the vehicle.

    Args:
        type_id: Vehicle type ID
        lang_id: Language ID
        vehicle_id: Vehicle ID from previous step

    Returns:
        Raw API response containing product groups

    Raises:
        RuntimeError: If API call fails
    """
    try:
        url = (f"https://{RAPIDAPI_HOST}/category/type-id/{type_id}/"
               f"products-groups-variant-3/{vehicle_id}/lang-id/{lang_id}")
        headers = {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY
        }

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        data = response.json()
        print(f"Retrieved product groups")

        return data

    except requests.RequestException as e:
        raise RuntimeError(f"Categories API request failed: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Categories lookup failed: {str(e)}")


def get_parts_categories(vehicle_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get parts categories for a vehicle through a 4-step API workflow.

    This orchestrates the complete workflow:
    1. Get manufacturer ID from make/manufacturer name
    2. Get model ID from model name and year
    3. Get vehicle ID from engine specifications
    4. Get parts categories tree

    Args:
        vehicle_info: Dictionary from VIN lookup containing:
            - make: Manufacturer name (e.g., "MERCEDES-BENZ")
            - model: Model name (e.g., "C-Class")
            - model_year: Year (e.g., "1999")
            - plant_country: Country in uppercase (e.g., "GERMANY")
            - engine_number_of_cylinders: Number (e.g., "8")
            - displacement_(l): Engine size (e.g., "4.3")
            - fuel_type_-_primary: Fuel type (e.g., "Gasoline")

    Returns:
        Dictionary containing parts categories tree

    Raises:
        ValueError: If required fields are missing or invalid
        RuntimeError: If any API call fails
    """
    # Validate required fields
    required_fields = ["make", "model", "model_year", "plant_country"]
    for field in required_fields:
        if field not in vehicle_info or not vehicle_info[field]:
            raise ValueError(f"Required field '{field}' is missing from vehicle_info")

    try:
        # Get country filter ID
        print(f"\n=== Getting country filter ID for {vehicle_info['plant_country']} ===")
        country_filter_id = _get_country_filter_id(vehicle_info["plant_country"])
        print(f"Country filter ID: {country_filter_id}")

        # Step 1: Get manufacturer ID
        print(f"\n=== Step 1: Getting manufacturer ID for {vehicle_info['make']} ===")
        manufacturer_id = _get_manufacturer_id(
            vehicle_info["make"],
            TYPE_ID,
            country_filter_id
        )
        print(f"Manufacturer ID: {manufacturer_id}")

        # Step 2: Get model ID
        print(f"\n=== Step 2: Getting model ID for {vehicle_info['model']} ({vehicle_info['model_year']}) ===")
        model_id = _get_model_id(
            vehicle_info,
            TYPE_ID,
            LANG_ID,
            country_filter_id,
            manufacturer_id
        )
        print(f"Model ID: {model_id}")

        # Step 3: Get vehicle ID
        print(f"\n=== Step 3: Getting vehicle ID ===")
        vehicle_id = _get_vehicle_id(
            vehicle_info,
            TYPE_ID,
            model_id,
            LANG_ID,
            country_filter_id
        )
        print(f"Vehicle ID: {vehicle_id}")

        # Step 4: Get categories
        print(f"\n=== Step 4: Getting parts categories ===")
        categories = _get_categories(
            TYPE_ID,
            LANG_ID,
            vehicle_id
        )

        return categories

    except Exception as e:
        raise RuntimeError(f"Parts categories lookup failed: {str(e)}")
