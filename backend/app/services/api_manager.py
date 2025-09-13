import csv
import json
import os
import requests
from kafka import KafkaProducer
from fastapi import HTTPException
from fastapi.responses import FileResponse
from ..schemas import APIConfig


# -----------------------------
# Helpers
# -----------------------------
def ensure_dir(path: str) -> str:
    """Ensure directory exists."""
    os.makedirs(path, exist_ok=True)
    return path


def write_json_file(path: str, data: dict | list) -> None:
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def write_csv_file(path: str, data: dict | list) -> None:
    """Write data to CSV if dict or list of dicts."""
    with open(path, "w", newline="") as f:
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            writer = csv.DictWriter(f, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        elif isinstance(data, dict):
            writer = csv.DictWriter(f, fieldnames=list(data.keys()))
            writer.writeheader()
            writer.writerow(data)
        else:
            raise HTTPException(status_code=400, detail="Data format not supported for CSV export.")


# -----------------------------
# API Operations
# -----------------------------
def validate_api(config: APIConfig):
    """Check if API is reachable and returns valid JSON."""
    try:
        headers = {"Authorization": f"Bearer {config.token}"} if config.token else {}
        resp = requests.get(config.url, headers=headers, timeout=10)
        resp.raise_for_status()
        return {"status": "API connection successful", "sample": resp.json()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"API validation failed: {str(e)}")


def fetch_schema(config: APIConfig):
    """Fetch and save JSON schema."""
    try:
        headers = {"Authorization": f"Bearer {config.token}"} if config.token else {}
        resp = requests.get(config.url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Infer schema
        if isinstance(data, dict):
            schema = {k: type(v).__name__ for k, v in data.items()}
        elif isinstance(data, list) and data and isinstance(data[0], dict):
            schema = {k: type(v).__name__ for k, v in data[0].items()}
        else:
            schema = {"type": type(data).__name__}

        # Save schema
        dir_path = ensure_dir(f"data/{config.topic}/{config.api_name}")
        schema_file = os.path.join(dir_path, "schema.json")
        write_json_file(schema_file, schema)

        return {"status": "Schema fetched", "schema": schema, "path": dir_path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Schema fetch failed: {str(e)}")


def fetch_data(config: APIConfig):
    """Fetch data, save as JSON/CSV, and push to Kafka."""
    try:
        headers = {"Authorization": f"Bearer {config.token}"} if config.token else {}
        resp = requests.get(config.url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Navigate into nested data if path given
        if config.data_path:
            for key in config.data_path.split("/"):
                if isinstance(data, dict):
                    data = data.get(key, {})
                else:
                    raise HTTPException(status_code=400, detail="Invalid data_path traversal.")

        # Ensure directory
        dir_path = ensure_dir(f"data/{config.topic}/{config.api_name}")
        json_file = os.path.join(dir_path, "data.json")
        csv_file = os.path.join(dir_path, "data.csv")

        # Save JSON and CSV
        write_json_file(json_file, data)
        try:
            write_csv_file(csv_file, data)
        except Exception:
            pass  # not all data can be written as CSV

        # Send to Kafka
        producer = KafkaProducer(
            bootstrap_servers="localhost:9092",
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        if isinstance(data, list):
            for record in data:
                producer.send(config.topic, record)
        else:
            producer.send(config.topic, data)
        producer.flush()

        return {
            "status": f"Data fetched and saved for topic '{config.topic}', API '{config.api_name}'",
            "download_path_json": f"/api/download/data/json/{config.topic}/{config.api_name}",
            "download_path_csv": f"/api/download/data/csv/{config.topic}/{config.api_name}",
            "download_path_schema": f"/api/download/data/schema/{config.topic}/{config.api_name}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Data fetch failed: {str(e)}")


# -----------------------------
# File Download
# -----------------------------
def download_json_data(topic: str, api_name: str):
    fpath = f"data/{topic}/{api_name}/data.json"
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="JSON file not found.")
    return FileResponse(fpath, media_type="application/json", filename="data.json")


def download_csv_data(topic: str, api_name: str):
    fpath = f"data/{topic}/{api_name}/data.csv"
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="CSV file not found.")
    return FileResponse(fpath, media_type="text/csv", filename="data.csv")


def download_schema_data(topic: str, api_name: str):
    fpath = f"data/{topic}/{api_name}/schema.json"
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Schema file not found.")
    return FileResponse(fpath, media_type="application/json", filename="schema.json")