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

                    # Basic Vehicle Information
                    st.markdown("### 🚙 Vehicle Overview")
                    overview_col1, overview_col2, overview_col3, overview_col4 = st.columns(4)

                    with overview_col1:
                        st.metric(label="Year", value=result.get("model_year", "N/A"))
                        st.metric(label="Make", value=result.get("make", "N/A"))

                    with overview_col2:
                        st.metric(label="Model", value=result.get("model", "N/A"))
                        st.metric(label="Trim", value=result.get("trim", "N/A"))

                    with overview_col3:
                        st.metric(label="Engine", value=f"{result.get('displacement_(l)', 'N/A')} L")
                        st.metric(label="Horsepower", value=f"{result.get('engine_brake_(hp)_from', 'N/A')} HP")

                    with overview_col4:
                        st.metric(label="Fuel Type", value=result.get("fuel_type_-_primary", "N/A"))
                        st.metric(label="Drive Type", value=result.get("drive_type", "N/A"))

                    st.divider()

                    # Additional Details in Expander
                    with st.expander("🔍 View Detailed Specifications"):
                        # Specifications
                        st.markdown("#### ⚙️ Engine & Performance")
                        spec_col1, spec_col2 = st.columns(2)

                        with spec_col1:
                            st.write(f"**Cylinders:** {result.get('engine_number_of_cylinders', 'N/A')}")
                            st.write(f"**Displacement:** {result.get('displacement_(l)', 'N/A')} L ({result.get('displacement_(cc)', 'N/A')} cc)")
                            st.write(f"**Transmission:** {result.get('transmission_style', 'N/A')} ({result.get('transmission_speeds', 'N/A')}-speed)")

                        with spec_col2:
                            st.write(f"**Top Speed:** {result.get('top_speed_(mph)', 'N/A')} mph")
                            st.write(f"**Body Class:** {result.get('body_class', 'N/A')}")
                            st.write(f"**Series:** {result.get('series', 'N/A')}")

                        st.divider()

                        # Dimensions
                        st.markdown("#### 📐 Dimensions")
                        dim_col1, dim_col2, dim_col3 = st.columns(3)

                        with dim_col1:
                            st.write(f"**Doors:** {result.get('doors', 'N/A')}")
                            st.write(f"**Seats:** {result.get('number_of_seats', 'N/A')}")

                        with dim_col2:
                            st.write(f"**Wheelbase:** {result.get('wheel_base_(inches)_from', 'N/A')}\"")
                            st.write(f"**Wheels:** {result.get('number_of_wheels', 'N/A')}")

                        with dim_col3:
                            st.write(f"**Front Wheels:** {result.get('wheel_size_front_(inches)', 'N/A')}\"")
                            st.write(f"**Rear Wheels:** {result.get('wheel_size_rear_(inches)', 'N/A')}\"")

                        st.divider()

                        # Safety Features
                        st.markdown("#### 🛡️ Safety Features")
                        safety_col1, safety_col2 = st.columns(2)

                        with safety_col1:
                            st.write("**Active Safety**")
                            st.write(f"• ABS: {result.get('anti-lock_braking_system_(abs)', 'N/A')}")
                            st.write(f"• ESC: {result.get('electronic_stability_control_(esc)', 'N/A')}")
                            st.write(f"• Traction Control: {result.get('traction_control', 'N/A')}")
                            st.write(f"• Backup Camera: {result.get('backup_camera', 'N/A')}")
                            st.write(f"• Adaptive Cruise: {result.get('adaptive_cruise_control_(acc)', 'N/A')}")
                            st.write(f"• Forward Collision Warning: {result.get('forward_collision_warning_(fcw)', 'N/A')}")
                            st.write(f"• Blind Spot Warning: {result.get('blind_spot_warning_(bsw)', 'N/A')}")
                            st.write(f"• Lane Departure Warning: {result.get('lane_departure_warning_(ldw)', 'N/A')}")

                        with safety_col2:
                            st.write("**Passive Safety**")
                            st.write(f"• Front Airbags: {result.get('front_air_bag_locations', 'N/A')}")
                            st.write(f"• Side Airbags: {result.get('side_air_bag_locations', 'N/A')}")
                            st.write(f"• Curtain Airbags: {result.get('curtain_air_bag_locations', 'N/A')}")
                            st.write(f"• Knee Airbags: {result.get('knee_air_bag_locations', 'N/A')}")
                            st.write(f"• Seat Belt Type: {result.get('seat_belt_type', 'N/A')}")
                            st.write(f"• Pretensioner: {result.get('pretensioner', 'N/A')}")
                            st.write(f"• TPMS: {result.get('tire_pressure_monitoring_system_(tpms)_type', 'N/A')}")

                        st.divider()

                        # Manufacturing Info
                        st.markdown("#### 🏭 Manufacturing")
                        mfg_col1, mfg_col2, mfg_col3 = st.columns(3)

                        with mfg_col1:
                            st.write(f"**Manufacturer:** {result.get('manufacturer_name', 'N/A')}")

                        with mfg_col2:
                            st.write(f"**Plant City:** {result.get('plant_city', 'N/A')}")

                        with mfg_col3:
                            st.write(f"**Plant Country:** {result.get('plant_country', 'N/A')}")

                except ValueError as e:
                    st.error(f"Invalid input: {str(e)}")
                except RuntimeError as e:
                    st.error(f"Processing failed: {str(e)}")
                except Exception as e:
                    st.error(f"An unexpected error occurred: {str(e)}")
