import pika
import json
import os
import requests
from enums import BillStatus, QueueTags
from logger import get_logger
from process_image import process_image

# Настройка Tesseract (путь к языковым данным)
os.environ['TESSDATA_PREFIX'] = '/usr/share/tesseract-ocr/4.00/tessdata/'
logger = get_logger("MAIN")



class ReceiptProcessor:
    def __init__(self):
        logger.info("Init App")
        self.rabbit_host = os.getenv("RABBITMQ_HOST", "rabbit")
        self.rabbit_port = int(os.getenv("RABBITMQ_PORT", "5672"))
        self.rabbit_user = os.getenv("RABBITMQ_USER")
        self.rabbit_pass = os.getenv("RABBITMQ_PASSWORD")
        self.queue_listen = os.getenv("RABBITMQ_QUEUE_LISTENER")
        self.queue_push = os.getenv("RABBITMQ_QUEUE_PUSHER")
        self.connection = None
        self.channel = None


    def connect(self):
        logger.info("Connecting to Queue")
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=self.rabbit_host, port=self.rabbit_port, credentials=pika.PlainCredentials(username=self.rabbit_user, password=self.rabbit_pass))
        )
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.queue_listen, durable=True)
        logger.info(f"Queue connected. Listen queue: {self.queue_listen}")

    def process_msg(self, data: dict):
        url = data.get("url")
        self.push_message(id=data.get("id"),tag=QueueTags.get("UPDATE_BILL"), status=BillStatus.get("Pending"))

        if not url:
            logger.error("Empty url")
            self.push_message(id=data.get("id"),tag=QueueTags.get("UPDATE_BILL"), status=BillStatus.get("Error"), error={"text": 'Empty url'})
            return

        response = requests.get(url)
        if response.status_code != 200:
            logger.error(f"Cannot download img. Status code: {response.status_code}")
            self.push_message(id=data.get("id"),tag=QueueTags.get("UPDATE_BILL"), status=BillStatus.get("Error"), error={"text": 'Cannot download img'})
            return
        image_bytes = response.content
        logger.info("Image downloaded")
        result = process_image(image_bytes)
        if result.get("status") == "error":
            self.push_message(id=data.get("id"),tag=QueueTags.get("UPDATE_BILL"), status=BillStatus.get("Error"), error=result.get("message"))
        else:
            self.push_message(id=data.get("id"),tag=QueueTags.get("PROCESS_TEXT"), status=BillStatus.get("Success"), additional=result.get("additional"))

    def receive_msg(self, ch, method, properties, body: str):
        try:
            message = json.loads(body.decode("utf-8"))
            self.process_msg(message)
        except json.JSONDecodeError as e:
            logger.error(f"Error json parsing: {e}")
            logger.error(f"Row data: {body}")

    def push_message(self, id: str, tag: str, **kwargs):
        output_msg = {
            "id": id,
            "tag": tag,
            **kwargs
        }

        self.channel.basic_publish(
            exchange='',
            routing_key=self.queue_push,
            body=json.dumps([output_msg], ensure_ascii=True),
            properties=pika.BasicProperties(
                delivery_mode=2,
            )
        )

    def start_consuming(self):
        self.connect()
        self.channel.basic_consume(
            queue=self.queue_listen,
            on_message_callback=self.receive_msg,
            auto_ack=True 
        )
        self.channel.start_consuming()

if __name__ == "__main__":
    processor = ReceiptProcessor()
    processor.start_consuming()