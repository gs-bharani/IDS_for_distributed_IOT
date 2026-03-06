from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from bson import ObjectId
from pydantic_core import CoreSchema

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    # --- Pydantic V2 Change: Use __get_pydantic_json_schema__ instead of __modify_schema__ ---
    @classmethod
    def __get_pydantic_json_schema__(cls, core_schema: CoreSchema, handler) -> Dict[str, Any]:
        """
        Return the JSON schema for this field.
        This method is called by Pydantic V2 to generate the OpenAPI (Swagger) schema.
        """
        # Call the default handler first to get the base schema
        json_schema = handler(core_schema)
        # Then modify it to represent ObjectId as a string
        json_schema.update(type="string")
        return json_schema

    # For Pydantic v2, you might also need this for internal schema generation if issues persist
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler) -> CoreSchema:
        from pydantic_core import core_schema

        def validate_from_str(input_value: str) -> ObjectId:
            if not ObjectId.is_valid(input_value):
                raise ValueError("Invalid ObjectId string")
            return ObjectId(input_value)

        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.no_info_after_validator_function(validate_from_str, core_schema.str_schema())
            ]),
            serialization=core_schema.to_string_ser_schema()
        )

# --- Node Model ---
class Node(BaseModel):
    """Represents a single network entity (e.g., host, server, router, attacker)."""
    id: str # Unique ID for the node within the scenario (used by frontend for linking)
    name: str = Field(..., min_length=1, max_length=50)
    
    # Type of node (e.g., victim, attacker, server, router, iot)
    type: Literal["victim", "attacker", "server", "router", "iot", "switch", "firewall", "cloud"]
    
    # Frontend position for drag-and-drop UI
    position: Dict[str, float] = Field(..., description="x and y coordinates for frontend visualization") # e.g., {"x": 100, "y": 200}
    
    # Optional properties specific to the node type
    # This can be flexible, e.g., {"os": "Linux", "services": ["HTTP", "SSH"], "ip_address": "10.0.0.1"}
    properties: Dict[str, Any] = {}

    class Config:
        arbitrary_types_allowed = True # Allow Any type in properties
        from_attributes = True

# --- Connection Model ---
class Connection(BaseModel):
    """Represents a connection between two nodes."""
    id: str # Unique ID for the connection within the scenario
    source: str # id of the source node
    target: str # id of the target node
    
    # Optional properties for connection (e.g., "bandwidth": "1Gbps", "latency": "10ms")
    properties: Dict[str, Any] = {}

    class Config:
        arbitrary_types_allowed = True
        from_attributes = True

# --- Scenario Models ---
class ScenarioBase(BaseModel):
    """Base model for scenario, used for creation and updates."""
    name: str = Field(..., min_length=3, max_length=100, description="Name of the network scenario")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the scenario")
    
    # The actual network topology
    nodes: List[Node] = []
    connections: List[Connection] = []

class ScenarioCreate(ScenarioBase):
    """Model for creating a new scenario."""
    # Inherits name, description, nodes, connections
    pass

class ScenarioInDB(ScenarioBase):
    """Model for scenario as stored in MongoDB."""
    # Ensure this part correctly uses PyObjectId for the _id field
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id") # MongoDB's _id
    owner_email: EmailStr
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str} # Still good for direct ObjectId serialization in dumps
        arbitrary_types_allowed = True
        from_attributes = True
        # Explicitly allow extra fields to prevent issues if MongoDB returns fields not in model
        # Though it should be fine with _id if alias is working
        extra = "allow"