import streamlit as st
from PIL import Image
import io
import json
from apps.agents.lambda_layers.websearch.reverse_image_search import main as reverse_image_search


st.set_page_config(
    page_title="Reverse Image Search",
    page_icon="🔄",
    layout="wide"
)

st.title("🔄 Reverse Image Search")
st.write("Upload an image to perform a reverse image search and find similar images or sources.")

uploaded_file = st.file_uploader(
    "Choose an image file",
    type=["jpg", "jpeg", "png"],
    help="Upload an image to search for similar images or sources online"
)

if uploaded_file is not None:
    # Display uploaded image
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Uploaded Image")
        image = Image.open(uploaded_file)
        st.image(image, width="stretch")

    with col2:
        st.subheader("Search Results")

        if st.button("Run Reverse Image Search", type="primary", width="stretch"):
            with st.spinner("Uploading to S3 and performing reverse image search..."):
                try:
                    # Read image bytes
                    uploaded_file.seek(0)
                    image_bytes = uploaded_file.read()

                    # Perform reverse image search
                    results = reverse_image_search(image_bytes, cleanup=True)

                    # Display success message
                    st.success(
                        f"Found {len(results)} visually similar images!")

                    # Display each result with image and metadata
                    st.markdown("### 🔍 Similar Images")

                    # Display in a grid layout (3 columns)
                    cols = st.columns(3)

                    for idx, result in enumerate(results):
                        with cols[idx % 3]:
                            # Display the similar image if available
                            if result.get('image_bytes'):
                                try:
                                    similar_image = Image.open(
                                        io.BytesIO(result['image_bytes']))
                                    st.image(similar_image, width="stretch")
                                except Exception:
                                    st.write("⚠️ Image unavailable")
                            else:
                                st.write("⚠️ Image unavailable")

                            # Display metadata
                            if result.get('title'):
                                st.caption(f"**{result['title']}**")

                            if result.get('source'):
                                st.caption(
                                    f"🔗 [{result['source']}]({result['source']})")

                            st.divider()

                except ValueError as e:
                    st.error(f"Configuration error: {str(e)}")
                    st.info(
                        "💡 Make sure S3_BUCKET_NAME and SERPAPI_KEY are configured in reverse_image_search.py")
                except Exception as e:
                    st.error(f"Search failed: {str(e)}")

st.divider()
st.caption("Powered by SerpAPI Google Reverse Image Search and AWS S3")
