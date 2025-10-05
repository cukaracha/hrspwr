import streamlit as st
from PIL import Image
import io
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from photo_analyzer.analyze_object import main as analyze_object


st.set_page_config(
    page_title="Object Analysis",
    page_icon="🔍",
    layout="wide"
)

st.title("🔍 Object Analysis")
st.write("Upload a photo to detect and identify automotive parts using AI-powered vision analysis.")

uploaded_file = st.file_uploader(
    "Choose an image...",
    type=["jpg", "jpeg", "png"],
    help="Upload a photo containing automotive parts"
)

if uploaded_file is not None:
    # Display uploaded image
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Uploaded Image")
        image_bytes = uploaded_file.read()
        image = Image.open(io.BytesIO(image_bytes))
        st.image(image, caption="Original Photo", width="stretch")

    with col2:
        st.subheader("Analysis")

        if st.button("Analyze Parts", type="primary", width="stretch"):
            try:
                # Analyze image to detect and identify parts
                with st.spinner("Detecting and identifying parts..."):
                    results = analyze_object(image_bytes)

                if not results:
                    st.warning("No automotive parts detected in the image. Try uploading a different photo.")
                else:
                    st.success(f"Detected {len(results)} part(s)")

                    # Display Results
                    st.divider()
                    st.subheader("Identified Parts")

                    # Create table layout for results
                    for idx, result in enumerate(results):
                        part_name = result.get('part_name', 'Unknown')
                        identified_part = result.get('identified_part', 'unknown')

                        # Display with colored indicator based on identification
                        col_idx, col_detected, col_verified = st.columns([1, 2, 2])

                        with col_idx:
                            st.write(f"**#{idx + 1}**")

                        with col_detected:
                            st.write(f"Detected: `{part_name}`")

                        with col_verified:
                            if identified_part.lower() == 'unknown':
                                st.error(f"Verified: **{identified_part}** ❌")
                            else:
                                st.success(f"Verified: **{identified_part}** ✓")

                    # Summary statistics
                    st.divider()
                    identified_count = sum(1 for r in results if r.get('identified_part', '').lower() != 'unknown')
                    unknown_count = len(results) - identified_count

                    col_stat1, col_stat2, col_stat3 = st.columns(3)
                    with col_stat1:
                        st.metric("Total Parts", len(results))
                    with col_stat2:
                        st.metric("Verified", identified_count)
                    with col_stat3:
                        st.metric("Unverified", unknown_count)

            except ValueError as e:
                st.error(f"Invalid input: {str(e)}")
            except RuntimeError as e:
                st.error(f"Analysis failed: {str(e)}")
            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")

st.divider()
st.caption("Powered by AWS Bedrock Claude 3.5 Sonnet with Vision")
