import cv2
import numpy as np
from PIL import Image
import pytesseract
import html
import unicodedata
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

        print(text)
        cleaned_text = sanitize_text(text)
        print(cleaned_text)
        return {"status": "success", "additional": cleaned_text}
    except Exception as e:
        logger.error(f"error processing image: {e}")
        return {"status": "error", "message": str(e)}


def sanitize_text(text: str) -> str:
    cleaned = ''.join(ch for ch in text if unicodedata.category(ch)[0] != 'C' or ch in '\n\t')
    return html.escape(cleaned)