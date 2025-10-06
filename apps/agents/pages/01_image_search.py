import streamlit as st
from PIL import Image
import io
from apps.agents.lambda_layers.websearch import image_search


st.set_page_config(
    page_title="Image Search",
    page_icon="🔍",
    layout="wide"
)

st.title("🔍 Image Search")
st.write("Search for images using DuckDuckGo and view the top results.")

query = st.text_input(
    "Enter search query:",
    placeholder="e.g., golden retriever puppy, sunset beach, mountain landscape"
)

col1, col2 = st.columns([1, 4])
with col1:
    max_results = st.number_input(
        "Number of results:",
        min_value=1,
        max_value=20,
        value=10
    )

if st.button("Search", type="primary", width="stretch"):
    if not query or not query.strip():
        st.error("Please enter a search query")
    else:
        with st.spinner(f"Searching for '{query}'..."):
            try:
                image_bytes_list = image_search.search_images(
                    query, max_results=max_results)

                if not image_bytes_list:
                    st.warning(
                        "No images found. Try a different search query.")
                else:
                    st.success(f"Found {len(image_bytes_list)} images")

                    cols = st.columns(3)
                    for idx, img_bytes in enumerate(image_bytes_list):
                        with cols[idx % 3]:
                            try:
                                image = Image.open(io.BytesIO(img_bytes))
                                st.image(
                                    image,
                                    caption=f"Result {idx + 1}",
                                    width="stretch"
                                )
                            except Exception as e:
                                st.error(f"Error displaying image {idx + 1}")

            except ValueError as e:
                st.error(f"Invalid input: {str(e)}")
            except RuntimeError as e:
                st.error(f"Search failed: {str(e)}")
            except Exception as e:
                st.error(f"An unexpected error occurred: {str(e)}")

st.divider()
st.caption("Powered by DuckDuckGo Image Search")
