import cv2
import numpy as np
from PIL import Image
import pytesseract
from logger import get_logger

logger = get_logger("IMAGE_PROCESSOR")

def process_image(image_bytes: bytes) -> dict:
    try:
        # Улучшенная предобработка изображения
        np_img = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        
        # 1. Увеличение резкости
        kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
        sharpened = cv2.filter2D(image, -1, kernel)
        
        # 2. Конвертация в grayscale с учетом освещения
        gray = cv2.cvtColor(sharpened, cv2.COLOR_BGR2GRAY)
        
        # 3. Адаптивный threshold с оптимизированными параметрами
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 85, 11
        )
        
        # 4. Удаление шумов
        denoised = cv2.fastNlMeansDenoising(thresh, h=10, templateWindowSize=7, searchWindowSize=21)
        
        # 5. Масштабирование с улучшенной интерполяцией
        resized = cv2.resize(denoised, None, fx=1.5, fy=1.5, interpolation=cv2.INTER_LANCZOS4)
        
        # 6. Дополнительная бинаризация
        _, final = cv2.threshold(resized, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Конфигурация Tesseract для чеков
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

        logger.info(text)
        
        # Постобработка текста
        cleaned_text = '\n'.join([line.strip() for line in text.split('\n') if line.strip()])
        
        logger.info(cleaned_text)

        return {"status": "success", "additional": cleaned_text}
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}