import cv2
import numpy as np
from PIL import Image
import pytesseract
from logger import get_logger

logger = get_logger("IMAGE_PROCESSOR")

def process_image(image_bytes: bytes) -> dict:
    try:
        np_img = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 31, 15
        )

        resized = cv2.resize(thresh, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        # Преобразуем обратно в байты через PIL, чтобы использовать с pytesseract
        pil_img = Image.fromarray(resized)

        text = pytesseract.image_to_string(pil_img, lang='rus', config='--tessdata-dir /app/tessdata')

        return {"status": "success", "additional": text}
    except Exception as e:
        logger.error(f"error processing image: {e}")
        return {"status": "error", "message": str(e)}
