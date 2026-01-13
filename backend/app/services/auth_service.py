from datetime import datetime, timedelta
from typing import Optional
import bcrypt
from jose import jwt, JWTError
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import UserCreate, UserUpdate, TokenData
from app.core.config import settings


# Password hashing
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


# JWT token handling
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenData]:
    """Decode and validate a JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id_str = payload.get("sub")
        username: str = payload.get("username")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
        return TokenData(user_id=user_id, username=username)
    except (JWTError, ValueError):
        return None


# User CRUD operations
async def get_user_by_id(session: AsyncSession, user_id: int) -> Optional[User]:
    """Get a user by ID"""
    stmt = select(User).where(User.id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[User]:
    """Get a user by email"""
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_username(session: AsyncSession, username: str) -> Optional[User]:
    """Get a user by username"""
    stmt = select(User).where(User.username == username)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_user_by_username_or_email(session: AsyncSession, identifier: str) -> Optional[User]:
    """Get a user by username or email"""
    stmt = select(User).where(
        or_(User.username == identifier, User.email == identifier)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, user_data: UserCreate) -> User:
    """Create a new user"""
    # Hash the password
    hashed_password = hash_password(user_data.password)

    # Create user instance
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


async def update_user(session: AsyncSession, user_id: int, user_data: UserUpdate) -> Optional[User]:
    """Update a user"""
    user = await get_user_by_id(session, user_id)
    if not user:
        return None

    if user_data.email is not None:
        user.email = user_data.email
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)

    await session.commit()
    await session.refresh(user)

    return user


async def authenticate_user(session: AsyncSession, username: str, password: str) -> Optional[User]:
    """Authenticate a user by username/email and password"""
    user = await get_user_by_username_or_email(session, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if not user.is_active:
        return None
    return user
