from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from .schemas import TopicCreate, Message, APIConfig
from .services.kafka_manager import KafkaManager
from .services.producer_consumer import KafkaProducerConsumer
from .services.api_manager import *
import json

app = FastAPI()
kafka_manager = KafkaManager()
producer_consumer = KafkaProducerConsumer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Setup
# -----------------------------
@app.get("/kafka/status")
def kafka_status():
    if kafka_manager.get_kafka_status("kafka_app-kafka-1") and kafka_manager.get_kafka_status("kafka_app-zookeeper-1"):
        return {"status": "Kafka and Zookeeper is running ....."}
    else:
        return {"status": "Kafka and Zookeeper is stopped."}


@app.post("/kafka/start")
def start_kafka():
    return kafka_manager.start_kafka()


@app.post("/kafka/stop")
def stop_kafka():
    return kafka_manager.stop_kafka()


# -----------------------------
# Topic Management
# -----------------------------
@app.post("/topics")
def create_topic(topic: TopicCreate):
    return kafka_manager.create_topic(topic)


@app.delete("/topics/{topic_name}")
def delete_topic(topic_name: str):
    return kafka_manager.delete_topic(topic_name)


@app.get("/topics/list")
def list_topics():
    return kafka_manager.list_topics()


# -----------------------------
# Producer / Consumer
# -----------------------------
@app.post("/topics/{topic}/messages")
def produce_message(topic: str, message: Message):
    return producer_consumer.produce_message(topic, message.dict())


@app.get("/topics/{topic}/stream")
async def consume_messages_stream(topic: str):
    def event_stream():
        for message in producer_consumer.start_consumer(topic):
            yield f"data: {json.dumps(message)}\n\n"
    return StreamingResponse(event_stream(), media_type="text/event-stream")


# -----------------------------
# API Integration Routes
# -----------------------------
@app.post("/api/test")
def testapi(config: APIConfig):
    return validate_api(config)


@app.post("/api/schema")
def fetch_schemas(config: APIConfig):
    return fetch_schema(config)


@app.post("/api/fetch-data")
def collect_data(config: APIConfig):
    return fetch_data(config)


@app.get("/api/download/data/json/{topic}/{api_name}")
def download_data_json(topic: str, api_name: str):
    return download_json_data(topic, api_name)


@app.get("/api/download/data/csv/{topic}/{api_name}")
def download_data_csv(topic: str, api_name: str):
    return download_csv_data(topic, api_name)


@app.get("/api/download/data/schema/{topic}/{api_name}")
def download_data_schema(topic: str, api_name: str):
    return download_schema_data(topic, api_name)