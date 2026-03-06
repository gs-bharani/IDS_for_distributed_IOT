from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List, Optional
from datetime import datetime

from ..models.users import UserBase # For dependency injection of current user
from ..models.scenario import ScenarioCreate, ScenarioInDB, Node, Connection, PyObjectId
from ..services.auth_service import get_current_user_from_token
from ..database.mongo import get_database

router = APIRouter()

# --- Helper to get scenarios collection ---
async def get_scenarios_collection():
    db = get_database()
    return db.scenarios # 'scenarios' is the MongoDB collection name

# --- Create New Scenario ---
@router.post("/", response_model=ScenarioInDB, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    scenario_data: ScenarioCreate,
    current_user: UserBase = Depends(get_current_user_from_token)
):
    """
    Creates a new network scenario for the authenticated user.
    """
    scenarios_collection = await get_scenarios_collection()
    
    # Prepare scenario for insertion
    scenario_in_db = ScenarioInDB(
        **scenario_data.model_dump(), # Convert Pydantic model to dict
        owner_email=current_user.email,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    # Insert into MongoDB
    insert_result = await scenarios_collection.insert_one(scenario_in_db.model_dump(by_alias=True))
    
    # Retrieve the inserted document to ensure it includes the MongoDB _id
    created_scenario = await scenarios_collection.find_one({"_id": insert_result.inserted_id})
    if created_scenario:
        return ScenarioInDB(**created_scenario) # Convert dict back to Pydantic model
    
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create scenario")

# --- Get All Scenarios for Current User ---
@router.get("/", response_model=List[ScenarioInDB], response_model_by_alias=True) # Added response_model_by_alias=True here
async def get_my_scenarios(
    current_user: UserBase = Depends(get_current_user_from_token)
):
    """
    Retrieves all network scenarios owned by the authenticated user.
    """
    scenarios_collection = await get_scenarios_collection()
    
    # Find scenarios by owner_email
    my_scenarios_raw = await scenarios_collection.find({"owner_email": current_user.email}).to_list(length=None)
    
    # Explicitly convert each raw dictionary to ScenarioInDB model.
    # FastAPI's serialization will then apply the alias for 'id' from '_id'.
    return [ScenarioInDB(**scenario) for scenario in my_scenarios_raw]


# --- Get Single Scenario by ID ---
@router.get("/{scenario_id}", response_model=ScenarioInDB, response_model_by_alias=True) # Added response_model_by_alias=True
async def get_scenario_by_id(
    scenario_id: str,
    current_user: UserBase = Depends(get_current_user_from_token)
    ):
    """
    Retrieves a single network scenario by its ID, ensuring it belongs to the current user.
    """
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    scenarios_collection = await get_scenarios_collection()
    
    scenario_data = await scenarios_collection.find_one({
        "_id": ObjectId(scenario_id),
        "owner_email": current_user.email # Ensure user owns this scenario
    })
    print("Received scenario_id:", scenario_id)
    print("Owner email from token:", current_user.email)
    
    if not scenario_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found or not owned by user")
    
    return ScenarioInDB(**scenario_data)

# --- Update Scenario by ID ---
@router.put("/{scenario_id}", response_model=ScenarioInDB, response_model_by_alias=True) # Added response_model_by_alias=True
async def update_scenario(
    scenario_id: str,
    scenario_data: ScenarioCreate, # Use ScenarioCreate for updates as well
    current_user: UserBase = Depends(get_current_user_from_token)
):
    """
    Updates an existing network scenario by its ID, ensuring it belongs to the current user.
    """
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    scenarios_collection = await get_scenarios_collection()
    
    # Prepare update data. Use model_dump(exclude_unset=True) to only update provided fields
    # and not overwrite existing fields with defaults if not provided.
    update_data = scenario_data.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow() # Update timestamp on change

    update_result = await scenarios_collection.find_one_and_update(
        {"_id": ObjectId(scenario_id), "owner_email": current_user.email},
        {"$set": update_data},
        return_document=True # Return the updated document
    )
    
    if not update_result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found or not owned by user")
    
    return ScenarioInDB(**update_result)

# --- Delete Scenario by ID ---
@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: str,
    current_user: UserBase = Depends(get_current_user_from_token)
):
    """
    Deletes a network scenario by its ID, ensuring it belongs to the current user.
    """
    if not ObjectId.is_valid(scenario_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid scenario ID format")

    scenarios_collection = await get_scenarios_collection()
    
    delete_result = await scenarios_collection.delete_one({
        "_id": ObjectId(scenario_id),
        "owner_email": current_user.email # Ensure user owns this scenario
    })
    
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found or not owned by user")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)