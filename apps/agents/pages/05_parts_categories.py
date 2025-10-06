import streamlit as st
from PIL import Image
import json
from vin_lookup import lookup_vin
from parts_lookup.lookup_categories import get_parts_categories


st.set_page_config(
    page_title="Parts Lookup",
    page_icon="🔧",
    layout="wide"
)

st.title("🔧 Parts Lookup")
st.write("Upload an image of a vehicle's VIN plate to extract the VIN, retrieve vehicle information, and lookup available parts categories.")

uploaded_file = st.file_uploader(
    "Choose an image file",
    type=["jpg", "jpeg", "png"],
    help="Upload a clear image of the VIN plate (typically found on dashboard, door jamb, or engine compartment)"
)

if uploaded_file is not None:
    # Display uploaded image
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Uploaded Image")
        image = Image.open(uploaded_file)
        st.image(image, width="stretch")

    with col2:
        st.subheader("Parts Categories")

        if st.button("Extract VIN & Lookup Parts", type="primary", width="stretch"):
            with st.spinner("Step 1/2: Extracting VIN and vehicle information..."):
                try:
                    # Read image bytes
                    uploaded_file.seek(0)
                    image_bytes = uploaded_file.read()

                    # Get vehicle info (includes VIN extraction and lookup)
                    vehicle_info = lookup_vin.get_vehicle_info(image_bytes)

                    # Display VIN
                    st.success(f"VIN extracted: **{vehicle_info.get('vin', 'N/A')}**")

                    # Display basic vehicle info
                    st.write(f"**{vehicle_info.get('model_year', 'N/A')} {vehicle_info.get('make', 'N/A')} {vehicle_info.get('model', 'N/A')}**")

                except ValueError as e:
                    st.error(f"Invalid input: {str(e)}")
                    st.stop()
                except RuntimeError as e:
                    st.error(f"Processing failed: {str(e)}")
                    st.stop()
                except Exception as e:
                    st.error(f"An unexpected error occurred: {str(e)}")
                    st.stop()

            with st.spinner("Step 2/2: Fetching parts categories..."):
                try:
                    # Get parts categories using the vehicle info
                    categories_response = get_parts_categories(vehicle_info)

                    st.success("Parts categories retrieved successfully!")

                    # Display categories in readable format
                    st.subheader("Available Parts Categories")

                    # Extract and format categories from new structure
                    categories = categories_response.get("categories", {})

                    if categories:
                        for category_id, category_data in categories.items():
                            parent_name = category_data.get("text", "Unknown Category")

                            # Get child categories (dict with numeric keys)
                            children = category_data.get("children", {})
                            if children:
                                # Extract text from each child category
                                child_names = [child_data.get("text", "") for child_data in children.values()]
                                children_text = ", ".join(child_names)
                                st.write(f"**{parent_name}**: {children_text}")
                            else:
                                st.write(f"**{parent_name}**: (no subcategories)")
                    else:
                        st.warning("No categories found in response")

                    # Add expandable section for raw JSON
                    with st.expander("View Raw JSON Response"):
                        st.json(categories_response)

                    # Add download button for JSON
                    json_str = json.dumps(categories_response, indent=2)
                    st.download_button(
                        label="Download JSON Response",
                        data=json_str,
                        file_name=f"parts_categories_{vehicle_info.get('vin', 'unknown')}.json",
                        mime="application/json"
                    )

                except ValueError as e:
                    st.error(f"Lookup failed: {str(e)}")
                except RuntimeError as e:
                    st.error(f"API request failed: {str(e)}")
                except Exception as e:
                    st.error(f"An unexpected error occurred during parts lookup: {str(e)}")
                    st.exception(e)

else:
    st.info("👆 Upload an image of a VIN plate to get started", icon="ℹ️")
