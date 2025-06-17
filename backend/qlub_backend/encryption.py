import base64
import os
from pathlib import Path
from cryptography.fernet import Fernet
from django.conf import settings
import logging
from dotenv import load_dotenv

# Load .env file to ensure TOKEN_ENCRYPTION_KEY is available
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(os.path.join(BASE_DIR, '.env'))

logger = logging.getLogger(__name__)

def get_encryption_key():
    """
    Get encryption key from TOKEN_ENCRYPTION_KEY environment variable.
    This key must be set in production - no fallback to Django SECRET_KEY.
    """
    # Get encryption key from environment - this is required
    env_key = os.environ.get('TOKEN_ENCRYPTION_KEY')
    if not env_key:
        raise ValueError("TOKEN_ENCRYPTION_KEY environment variable is required but not set")
    
    try:
        # Ensure it's a valid Fernet key (URL-safe base64-encoded 32-byte key)
        key = base64.urlsafe_b64decode(env_key + '=' * (4 - len(env_key) % 4))
        if len(key) != 32:
            raise ValueError(f"TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes, got {len(key)} bytes")
        return env_key
    except Exception as e:
        raise ValueError(f"Invalid TOKEN_ENCRYPTION_KEY format: {str(e)}")

def encrypt_token(token):
    """Encrypt a token string"""
    if not token:
        return None
    
    try:
        key = get_encryption_key()
        f = Fernet(key)
        return f.encrypt(token.encode()).decode()
    except Exception as e:
        logger.error(f"Error encrypting token: {str(e)}")
        return token  # Return original token if encryption fails

def decrypt_token(encrypted_token):
    """Decrypt an encrypted token string"""
    if not encrypted_token:
        return None
    
    try:
        key = get_encryption_key()
        f = Fernet(key)
        return f.decrypt(encrypted_token.encode()).decode()
    except Exception as e:
        logger.error(f"Error decrypting token: {str(e)}")
        return encrypted_token  # Return the encrypted token if decryption fails