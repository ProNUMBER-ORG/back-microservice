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
        
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(image, -1, kernel)
        
        gray = cv2.cvtColor(sharpened, cv2.COLOR_BGR2GRAY)
        
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 85, 11
        )
        
        denoised = cv2.fastNlMeansDenoising(thresh, h=10, templateWindowSize=7, searchWindowSize=21)
        
        resized = cv2.resize(denoised, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LANCZOS4)
        
        _, final = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        custom_config = r'''
            --tessdata-dir /app/tessdata
            --psm 4
            --oem 3
            -c tessedit_char_whitelist=0123456789,.абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ-/\ 
            -c preserve_interword_spaces=1
        '''
        
        text = pytesseract.image_to_string(
            Image.fromarray(final),
            lang='rus+eng',
            config=custom_config
        )

        print(text)
        
        cleaned_text = '\n'.join([line.strip() for line in text.split('\n') if line.strip()])
        
        print(cleaned_text)

        return {"status": "success", "additional": cleaned_text}
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}