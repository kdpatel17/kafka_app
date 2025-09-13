from kafka import KafkaProducer, KafkaConsumer
import json
from typing import Dict, Generator
from ..schemas import Message


class KafkaProducerConsumer:
    def __init__(self, bootstrap_servers="localhost:9092"):
        self.bootstrap_servers = bootstrap_servers
        self.producer = None
        self.consumer = None
        self.consumer_thread = None
        self.stop_consumer = False

    def produce_message(self, topic: str, message: Message) -> Dict[str, str]:
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            self.producer.send(
                topic,
                value=message,
                # key=message.key.encode('utf-8')
            )
            self.producer.flush()
            return {"status": f"Message sent to topic {topic}"}
        except Exception as e:
            return {"error": str(e)}

    def start_consumer(self, topic: str) -> Generator[Dict[str, str], None, None]:
        """Generator that yields messages continuously from a topic."""
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers=self.bootstrap_servers,
            auto_offset_reset="earliest",
            value_deserializer=lambda x: json.loads(x.decode("utf-8")),
        )
        try:
            for message in consumer:
                yield message.value
        finally:
            consumer.close()
