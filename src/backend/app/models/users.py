from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    """Base model for user, typically for request bodies or general user info."""
    email: EmailStr

class UserCreate(UserBase):
    """Model for user registration (includes password)."""
    password: str

class UserInDB(UserBase):
    """Model for user data as stored in the database (includes hashed password and ID)."""
    hashed_password: str
    id: Optional[str] = None # MongoDB _id is typically an ObjectId, Pydantic handles str conversion from ObjectId
    is_active: bool = True # For potential future features like account activation

    class Config:
        """Configuration for Pydantic model."""
        # This allows Pydantic to work with MongoDB's ObjectId types by setting `from_attributes`.
        # Also, `populate_by_name` helps if you use `_id` in MongoDB but want `id` in your model.
        from_attributes = True
        populate_by_name = True
        # If you were to use ObjectId directly, you might need arbitrary_types_allowed = True
        # but with Optional[str] and from_attributes = True, it usually handles it well.