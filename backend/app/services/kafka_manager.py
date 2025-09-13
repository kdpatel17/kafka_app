import json
from ..schemas import TopicCreate
from kafka import KafkaAdminClient
from kafka.admin import NewTopic
from kafka.errors import TopicAlreadyExistsError, UnknownTopicOrPartitionError
import subprocess


class KafkaManager:
    def __init__(self, bootstrap_servers="localhost:9092"):
        self.bootstrap_servers = bootstrap_servers

    def get_kafka_status(self, container_name):
        try:
            # Run the 'docker ps' command and filter by container name
            result = subprocess.run(
                ["docker", "ps", "--filter", f"name={container_name}", "--format", "{{.Names}}"],
                capture_output=True,
                text=True,
                check=True
            )
            output = result.stdout.strip()
            if output == container_name:
                # print(f"Container '{container_name}' is running ✅")
                return True
            else:
                # print(f"Container '{container_name}' is NOT running ❌")
                return False
        except subprocess.CalledProcessError as e:
            # print(f"Error checking container '{container_name}': {e}")
            return False

    def start_kafka(self):
        try:
            # Start Kafka and Zookeeper using docker-compose
            subprocess.run(
                ["docker-compose", "up", "-d"],
                check=True
            )
            return {"status": "Kafka and Zookeeper started"}
        except subprocess.CalledProcessError as e:
            return {"error": f"Failed to start Kafka/Zookeeper: {e}"}

    def stop_kafka(self):
        try:
            # Stop all containers defined in docker-compose.yml
            subprocess.run(
                ["docker-compose", "stop"],
                check=True
            )
            return {"status": "Kafka and Zookeeper stopped"}
        except subprocess.CalledProcessError as e:
            return {"error": f"Failed to stop Kafka/Zookeeper: {e}"}

    def create_topic(self, topic: TopicCreate):
        try:
            new_topic = NewTopic(
                name=topic.name,
                num_partitions=topic.partitions,
                replication_factor=topic.replication_factor,
            )
            admin_client = KafkaAdminClient(bootstrap_servers=self.bootstrap_servers)
            admin_client.create_topics([new_topic])
            return {"status": f"Topic {topic.name} created"}
        except TopicAlreadyExistsError:
            return {"error": f"Topic {topic.name} already exists"}

    def delete_topic(self, topic_name: str):
        try:
            admin_client = KafkaAdminClient(bootstrap_servers=self.bootstrap_servers)
            admin_client.delete_topics([topic_name], timeout_ms=10000)
            return {"status": f"Topic {topic_name} deleted"}
        except UnknownTopicOrPartitionError:
            return {"error": f"Topic {topic_name} does not exist"}
        except Exception as e:
            return {"error": str(e)}

    def list_topics(self):
        admin_client = KafkaAdminClient(bootstrap_servers=self.bootstrap_servers)
        return admin_client.list_topics()