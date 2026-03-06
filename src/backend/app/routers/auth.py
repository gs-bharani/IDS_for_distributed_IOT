from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any

from ..models.users import UserCreate, UserInDB, UserBase
from ..services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user_from_token
)
from ..database.mongo import get_database

router = APIRouter()

# --- Helper to get user collection (can be moved to a dedicated service later) ---
async def get_users_collection():
    db = get_database()
    return db.users # 'users' is the MongoDB collection name for user data

# --- User Registration Endpoint ---
@router.post("/register", response_model=UserBase, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """
    Registers a new user.
    Takes email and password, hashes the password, and stores the user in MongoDB.
    """
    users_collection = await get_users_collection()
    
    # Check if user with this email already exists
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please choose a different email or log in."
        )
    
    # Hash the password
    hashed_password = get_password_hash(user.password)
    
    # Create a UserInDB instance for storage
    user_in_db = UserInDB(email=user.email, hashed_password=hashed_password, is_active=True)
    
    # Insert new user into MongoDB
    # Pydantic's model_dump(exclude_unset=True) is great for partial updates,
    # but for initial insert, it ensures only set fields are included.
    insert_result = await users_collection.insert_one(user_in_db.model_dump(exclude_unset=True))
    
    # Return basic user info (email) without sensitive data
    return UserBase(email=user.email)

# --- User Login / Get Access Token Endpoint ---
@router.post("/token", response_model=Dict[str, str])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticates a user and returns a JWT access token.
    Expects 'username' (email) and 'password' in x-www-form-urlencoded format.
    """
    users_collection = await get_users_collection()
    
    # Find user by email (form_data.username is used for email)
    user_data = await users_collection.find_one({"email": form_data.username})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Convert MongoDB dict to UserInDB model for password verification
    # Using UserInDB(**user_data) directly works because UserInDB's Config has from_attributes=True
    # and it handles the _id to id mapping.
    user_in_db = UserInDB(**user_data)
    
    # Verify the password
    if not verify_password(form_data.password, user_in_db.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please check your credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create the JWT access token
    access_token = create_access_token(data={"sub": user_in_db.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Protected Endpoint Example ---
@router.get("/me", response_model=UserBase)
async def read_current_user(current_user: UserBase = Depends(get_current_user_from_token)):
    """
    Returns information about the current authenticated user.
    Requires a valid JWT in the Authorization: Bearer <token> header.
    """
    return current_user