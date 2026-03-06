from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any, Union
from datetime import datetime
from bson import ObjectId
from pydantic_core import CoreSchema

# PyObjectId class (copied for self-containment, assuming it's consistent)
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema: CoreSchema, handler) -> Dict[str, Any]:
        json_schema = handler(core_schema)
        json_schema.update(type="string")
        return json_schema

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler) -> CoreSchema:
        from pydantic_core import core_schema

        def validate_from_str(input_value: str) -> ObjectId:
            if not ObjectId.is_valid(input_value):
                raise ValueError("Invalid ObjectId string")
            return core_schema.to_string_ser_schema()

        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.no_info_after_validator_function(validate_from_str, core_schema.str_schema())
            ]),
            serialization=core_schema.to_string_ser_schema()
        )

# --- Attack Configuration Models (Discriminator for different attack types) ---
class AttackConfigBase(BaseModel):
    """Base model for attack configuration."""
    attack_type: Literal[
        "port_scan",
        "dos",
        "mitm",
        "brute_force",
        "malware_delivery",
        "ddos"
    ]
    source_node_id: str
    target_node_id: str
    duration_seconds: int = Field(30, ge=1)

class PortScanConfig(AttackConfigBase):
    attack_type: Literal["port_scan"] = "port_scan"
    port_range_start: int = Field(1, ge=1, le=65535)
    port_range_end: int = Field(1024, ge=1, le=65535)
    scan_type: Literal["tcp_syn", "tcp_connect"] = "tcp_syn"

class DoSConfig(AttackConfigBase):
    attack_type: Literal["dos"] = "dos"
    protocol: Literal["tcp", "udp", "http"] = "tcp"
    payload_size_bytes: int = Field(100, ge=1)
    packet_rate_per_second: int = Field(100, ge=1)

class MitMConfig(AttackConfigBase):
    attack_type: Literal["mitm"] = "mitm"
    target_node_id_secondary: str # Required for MITM
    intercept_protocols: List[Literal["all", "http", "https", "dns"]] = ["all"]

class BruteForceConfig(AttackConfigBase):
    attack_type: Literal["brute_force"] = "brute_force"
    service_port: int = Field(22, ge=1, le=65535)
    username_list: List[str] = Field([])
    password_list: List[str] = Field([])
    delay_per_attempt_ms: int = Field(100, ge=0)

class MalwareDeliveryConfig(AttackConfigBase):
    attack_type: Literal["malware_delivery"] = "malware_delivery"
    payload: str
    delivery_method: Literal["http_download", "email_attachment", "usb"] = "http_download"

class DDoSConfig(AttackConfigBase):
    attack_type: Literal["ddos"] = "ddos"
    num_attackers: int = Field(2, ge=2)
    protocol: Literal["tcp", "udp", "http"] = "udp"
    payload_size_bytes: int = Field(50, ge=1)
    packet_rate_per_second: int = Field(50, ge=1)

# Union type for dynamic attack configuration
AttackConfig = Union[
    PortScanConfig,
    DoSConfig,
    MitMConfig,
    BruteForceConfig,
    MalwareDeliveryConfig,
    DDoSConfig
]

# --- Attack Launch Request Model ---
class AttackLaunchRequest(BaseModel):
    scenario_id: str = Field(..., description="ID of the scenario to attack.")
    attack_config: AttackConfig = Field(..., discriminator="attack_type", description="Configuration for the specific attack type.")

# --- Attack Result Models ---
# These models *do not* need an 'attack_type' field themselves
class PortScanResults(BaseModel):
    open_ports: List[int] = Field([])
    closed_ports: List[int] = Field([])
    filtered_ports: List[int] = Field([])
    scan_duration_ms: int = Field(..., ge=0)

class DoSResults(BaseModel):
    packets_sent: int
    data_sent_bytes: int
    target_response_time_avg_ms: Optional[float] = None
    target_availability_percentage: Optional[float] = None

class MitMResults(BaseModel):
    packets_intercepted: int
    data_intercepted_bytes: int
    credentials_captured: Optional[List[Dict[str, str]]] = None
    intercepted_http_requests: Optional[List[Dict[str, Any]]] = None
    intercepted_dns_queries: Optional[List[Dict[str, Any]]] = None

class BruteForceResults(BaseModel):
    success: bool
    credentials_found: Optional[Dict[str, str]] = None
    attempts_made: int
    attempt_duration_ms: Optional[int] = None

class MalwareDeliveryResults(BaseModel):
    delivery_successful: bool
    target_compromised: bool
    indicators_of_compromise: Optional[List[str]] = None

class DDoSResults(BaseModel):
    total_packets_sent: int
    total_data_sent_bytes: int
    impact_on_target_avg_latency_ms: Optional[float] = None
    target_downtime_seconds: Optional[int] = None

# Union type for dynamic attack results (used internally for type hinting)
# The actual structure in the DB will be a plain dictionary.
AttackResults = Union[
    PortScanResults,
    DoSResults,
    MitMResults,
    BruteForceResults,
    MalwareDeliveryResults,
    DDoSResults
]

# --- Attack Status Response Model (for history and launch response) ---
class AttackStatusResponse(BaseModel):
    attack_id: str 
    status: Literal["initiated", "running", "completed", "failed", "stopped"]
    message: str
    scenario_id: str
    attack_type: Literal[
        "port_scan",
        "dos",
        "mitm",
        "brute_force",
        "malware_delivery",
        "ddos"
    ]
    source_node_id: str
    target_node_id: str
    initiator: EmailStr
    started_at: datetime
    db_id: Optional[PyObjectId] = Field(None, alias="_id") 
    
    # Optional fields for results, directly as a flexible dictionary (Dict[str, Any])
    # The frontend will use the 'attack_type' field to interpret this dictionary.
    results: Optional[Dict[str, Any]] = None # <--- Removed discriminator here
    
    # Config for Pydantic
    class Config:
        populate_by_name = True 
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True
        extra = "allow" 

