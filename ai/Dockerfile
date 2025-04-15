FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-rus \
    libtesseract-dev \
    libleptonica-dev \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libgl1 \
    && apt-get clean

# Создание рабочей директории
WORKDIR /app

# Копирование файлов
COPY src/ ./src/
COPY tessdata/ ./tessdata/
COPY requirements.txt ./

# Установка зависимостей Python
RUN pip install --no-cache-dir -r requirements.txt

# Установка переменной окружения для tesseract
ENV TESSDATA_PREFIX=/app/tessdata

