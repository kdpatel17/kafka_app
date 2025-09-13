from pydantic import BaseModel
from typing import Optional


class TopicCreate(BaseModel):
    name: str
    partitions: int = 1
    replication_factor: int = 1


class Message(BaseModel):
    key: Optional[str] = None
    value: str


class APIConfig(BaseModel):
    url: str
    token: Optional[str] = None
    topic: str
    api_name: str
    data_path: Optional[str] = None
