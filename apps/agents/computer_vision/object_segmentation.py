import io
from typing import List, Optional, Tuple
from PIL import Image
from ultralytics import YOLO
from concurrent.futures import ThreadPoolExecutor, as_completed


def _load_yolo_model() -> YOLO:
    """
    Load and return YOLO11-small model.

    Returns:
        YOLO model instance configured for object detection

    Raises:
        RuntimeError: If model loading fails
    """
    try:
        model = YOLO('yolo11n.pt')  # yolo11n is the small model
        return model
    except Exception as e:
        raise RuntimeError(f"Failed to load YOLO model: {str(e)}")


def _bytes_to_image(image_bytes: bytes) -> Image.Image:
    """
    Convert image bytes to PIL Image.

    Args:
        image_bytes: Image data as bytes

    Returns:
        PIL Image object

    Raises:
        ValueError: If image bytes are invalid or cannot be decoded
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        return image
    except Exception as e:
        raise ValueError(f"Failed to decode image bytes: {str(e)}")


def _detect_objects(model: YOLO, image: Image.Image) -> List:
    """
    Run YOLO inference on image and return detections.

    Args:
        model: YOLO model instance
        image: PIL Image to run detection on

    Returns:
        List of detection results from YOLO

    Raises:
        RuntimeError: If object detection fails
    """
    try:
        results = model(image)
        return results
    except Exception as e:
        raise RuntimeError(f"Object detection failed: {str(e)}")


def _crop_object(image: Image.Image, bbox: Tuple[float, float, float, float], padding: int = 10) -> Image.Image:
    """
    Crop a single object from image using bounding box coordinates with padding.

    Args:
        image: PIL Image to crop from
        bbox: Bounding box as (x1, y1, x2, y2) tuple
        padding: Pixels to add around the bounding box (default: 10)

    Returns:
        Cropped PIL Image containing the object with padding

    Raises:
        ValueError: If bounding box coordinates are invalid
    """
    try:
        x1, y1, x2, y2 = bbox
        img_width, img_height = image.size

        # Add padding and clamp to image boundaries
        x1_padded = max(0, int(x1) - padding)
        y1_padded = max(0, int(y1) - padding)
        x2_padded = min(img_width, int(x2) + padding)
        y2_padded = min(img_height, int(y2) + padding)

        cropped = image.crop((x1_padded, y1_padded, x2_padded, y2_padded))
        return cropped
    except Exception as e:
        raise ValueError(f"Failed to crop object: {str(e)}")


def _image_to_bytes(image: Image.Image) -> bytes:
    """
    Convert PIL Image to PNG bytes.

    Args:
        image: PIL Image to convert

    Returns:
        Image data as PNG bytes

    Raises:
        RuntimeError: If image conversion fails
    """
    try:
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        return img_byte_arr.getvalue()
    except Exception as e:
        raise RuntimeError(f"Failed to convert image to bytes: {str(e)}")


def _process_single_object(image: Image.Image, bbox) -> Optional[bytes]:
    """
    Process a single detected object: crop and convert to bytes.

    Args:
        image: PIL Image to crop from
        bbox: Bounding box coordinates

    Returns:
        Cropped object as PNG bytes, or None if processing fails
    """
    try:
        cropped = _crop_object(image, bbox)
        cropped_bytes = _image_to_bytes(cropped)
        return cropped_bytes
    except Exception:
        return None


def get_objects(image_bytes: bytes, max_workers: int = 10) -> List[bytes]:
    """
    Detect objects in an image using YOLO11-small and return cropped objects as bytes.

    This function performs the complete object detection and cropping workflow:
    1. Loads YOLO11-small model
    2. Converts input bytes to PIL Image
    3. Runs object detection
    4. Crops each detected object using bounding boxes (with multithreading)
    5. Converts each crop to PNG bytes

    Args:
        image_bytes: Input image as bytes
        max_workers: Maximum number of concurrent threads for processing crops (default: 10)

    Returns:
        List of PNG image bytes, one for each detected object.
        Returns empty list if no objects are detected.

    Raises:
        ValueError: If image_bytes is empty or invalid
        RuntimeError: If model loading or detection fails
    """
    if not image_bytes:
        raise ValueError("image_bytes cannot be empty")

    # Load model
    model = _load_yolo_model()

    # Convert bytes to image
    image = _bytes_to_image(image_bytes)

    # Detect objects
    results = _detect_objects(model, image)

    # Collect all bounding boxes
    bboxes = []
    for result in results:
        if result.boxes is not None:
            for box in result.boxes:
                bbox = box.xyxy[0].cpu().numpy()
                bboxes.append(bbox)

    if not bboxes:
        return []

    # Process crops in parallel using multithreading
    cropped_objects = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_bbox = {executor.submit(_process_single_object, image, bbox): bbox for bbox in bboxes}

        for future in as_completed(future_to_bbox):
            cropped_bytes = future.result()
            if cropped_bytes is not None:
                cropped_objects.append(cropped_bytes)

    return cropped_objects
