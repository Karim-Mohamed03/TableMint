import base64
import os
from cryptography.fernet import Fernet
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_encryption_key():
    """Get the encryption key from environment variables"""
    key = os.getenv('TOKEN_ENCRYPTION_KEY')
    if not key:
        raise ValueError("TOKEN_ENCRYPTION_KEY environment variable not set")
    return key.encode()

def encrypt_token(token):
    """Encrypt a token using the encryption key"""
    try:
        key = get_encryption_key()
        f = Fernet(key)
        encrypted_token = f.encrypt(token.encode())
        return base64.urlsafe_b64encode(encrypted_token).decode()
    except Exception as e:
        logger.error(f"Error encrypting token: {str(e)}")
        raise

def decrypt_token(encrypted_token):
    """Decrypt a token using the encryption key"""
    try:
        key = get_encryption_key()
        f = Fernet(key)
        decoded_token = base64.urlsafe_b64decode(encrypted_token.encode())
        decrypted_token = f.decrypt(decoded_token)
        return decrypted_token.decode()
    except Exception as e:
        logger.error(f"Error decrypting token: {str(e)}")
        raise