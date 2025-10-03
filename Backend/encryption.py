from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os

class EncryptionService:
    def __init__(self, password: str):
        # Derive key from password
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'complex_app_salt',  # In production, use random salt per user
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        self.fernet = Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Encrypt string data"""
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = self.fernet.decrypt(encrypted_bytes)
        return decrypted_data.decode()
    
    def encrypt_dict(self, data: dict) -> dict:
        """Encrypt all string values in a dictionary"""
        encrypted_dict = {}
        for key, value in data.items():
            if isinstance(value, str):
                encrypted_dict[key] = self.encrypt(value)
            else:
                encrypted_dict[key] = value
        return encrypted_dict
    
    def decrypt_dict(self, encrypted_data: dict) -> dict:
        """Decrypt all string values in a dictionary"""
        decrypted_dict = {}
        for key, value in encrypted_data.items():
            if isinstance(value, str):
                try:
                    decrypted_dict[key] = self.decrypt(value)
                except:
                    decrypted_dict[key] = value  # If decryption fails, return original
            else:
                decrypted_dict[key] = value
        return decrypted_dict

# Singleton instance for app-wide use
app_encryption = EncryptionService("complex_app_master_key")