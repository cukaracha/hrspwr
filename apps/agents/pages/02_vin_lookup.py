import streamlit as st
from PIL import Image
import io
from vin_lookup import lookup_vin


st.set_page_config(
    page_title="VIN Lookup",
    page_icon="🚗",
    layout="wide"
)

st.title("🚗 VIN Lookup")
st.write("Upload an image of a vehicle's VIN plate to extract the VIN number and retrieve vehicle information.")

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
        st.subheader("Vehicle Information")

        if st.button("Extract VIN & Lookup Vehicle", type="primary", width="stretch"):
            with st.spinner("Processing image with AWS Textract and Bedrock..."):
                try:
                    # Read image bytes
                    uploaded_file.seek(0)
                    image_bytes = uploaded_file.read()

                    # Get vehicle info (includes VIN extraction and lookup)
                    result = lookup_vin.get_vehicle_info(image_bytes)

                    # Display results in formatted cards
                    st.success("Vehicle information extracted successfully!")

                    # VIN Display - prominent
                    st.markdown("### 📋 VIN Number")
                    st.code(result.get("vin", "N/A"), language=None)

                    st.divider()

                    # Vehicle details in columns
                    st.markdown("### 🚙 Vehicle Details")

                    detail_col1, detail_col2 = st.columns(2)

                    with detail_col1:
                        st.metric(label="Year",
                                  value=result.get("year", "N/A"))
                        st.metric(label="Make",
                                  value=result.get("make", "N/A"))

                    with detail_col2:
                        st.metric(label="Model",
                                  value=result.get("model", "N/A"))
                        st.metric(label="Trim", value=result.get(
                            "trim", "N/A") if result.get("trim") else "N/A")

                except ValueError as e:
                    st.error(f"Invalid input: {str(e)}")
                except RuntimeError as e:
                    st.error(f"Processing failed: {str(e)}")
                except Exception as e:
                    st.error(f"An unexpected error occurred: {str(e)}")

st.divider()
st.caption("Powered by AWS Textract, Amazon Bedrock, and CarAPI")
