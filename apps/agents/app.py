import streamlit as st


st.set_page_config(
    page_title="AI Agent Tools",
    page_icon="🤖",
    layout="wide"
)

st.title("🤖 AI Agent Tools")
st.write("Welcome to the AI Agent Tools suite. Choose a tool from the sidebar to get started.")

st.divider()

# Feature cards
col1, col2, col3 = st.columns(3)

with col1:
    st.subheader("🔍 Image Search")
    st.write("Search for images using DuckDuckGo and view the top results in a grid layout.")
    st.markdown("**Features:**")
    st.markdown("- Search by keyword or phrase")
    st.markdown("- Configurable number of results")
    st.markdown("- Grid display with image previews")

with col2:
    st.subheader("🚗 VIN Lookup")
    st.write("Upload a photo of a vehicle's VIN plate to extract the VIN and retrieve vehicle information.")
    st.markdown("**Features:**")
    st.markdown("- AI-powered VIN extraction")
    st.markdown("- Vehicle year, make, model lookup")
    st.markdown("- Powered by AWS Textract & Bedrock")

with col3:
    st.subheader("🔄 Reverse Image Search")
    st.write("Upload an image to find similar images or sources online.")
    st.markdown("**Features:**")
    st.markdown("- Google reverse image search")
    st.markdown("- JSON response with results")
    st.markdown("- Powered by SerpAPI & AWS S3")

st.divider()

st.info("👈 Select a tool from the sidebar to begin", icon="ℹ️")

st.divider()
st.caption("Powered by AWS AI Services and DuckDuckGo")
