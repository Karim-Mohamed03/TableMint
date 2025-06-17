import base64
import os
from cryptography.fernet import Fernet
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Encryption key derived from SECRET_KEY
def get_encryption_key():
    """
    Generate a stable encryption key from Django's SECRET_KEY or from environment variable.
    This ensures the same key is used across application restarts.
    """
    # Try to get encryption key from environment first
    env_key = os.environ.get('TOKEN_ENCRYPTION_KEY')
    if env_key:
        try:
            # Ensure it's a valid Fernet key (URL-safe base64-encoded 32-byte key)
            key = base64.urlsafe_b64decode(env_key + '=' * (4 - len(env_key) % 4))
            if len(key) == 32:
                return env_key
        except Exception:
            pass  # If there's any issue with the env key, fall back to SECRET_KEY
    
    # Fall back to using Django's SECRET_KEY (for development)
    # In production, TOKEN_ENCRYPTION_KEY should be set in environment
    secret_key = settings.SECRET_KEY
    # Use the first 32 bytes of SECRET_KEY + static salt to ensure key is stable
    key_material = (secret_key + "tablemint_encryption_salt")[:32].encode()
    # Make sure it's padded correctly for base64
    key_b64 = base64.urlsafe_b64encode(key_material)
    return key_b64.decode()

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