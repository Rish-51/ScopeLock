"""
Encrypted Local Storage Service for ScopeLock.
Provides AES-256 encrypted persistence for proposals to protect sensitive NDA data.
"""

import os
import json
import base64
from pathlib import Path
from typing import Any, Dict, Optional
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from backend.core.config import settings

class StorageService:
    def __init__(self):
        # Store data in a hidden directory in the user's home folder
        self.storage_dir = Path.home() / ".scopelock" / "data"
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._encryption_key: Optional[bytes] = None

    def set_master_password(self, password: str):
        """
        Derives an encryption key from the master password using PBKDF2.
        In a real production app, the salt would be stored per-file or in a config file.
        For this implementation, we use a stable salt for simplicity.
        """
        salt = b'scopelock_stable_salt_2026' # In production, use a random salt stored on disk
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        self._encryption_key = kdf.derive(password.encode())

    def clear_session(self):
        """Wipes the encryption key from memory."""
        self._encryption_key = None

    def _get_file_path(self, proposal_id: str) -> Path:
        return self.storage_dir / f"{proposal_id}.lock"

    def save_proposal(self, proposal_id: str, data: Dict[str, Any]):
        """Encrypts and saves proposal data to disk."""
        if not self._encryption_key:
            raise PermissionError("Master password not set. Storage is locked.")

        # Serialize and encrypt
        plaintext = json.dumps(data).encode("utf-8")
        aesgcm = AESGCM(self._encryption_key)
        nonce = os.urandom(12)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)

        # Store as nonce + ciphertext
        with open(self._get_file_path(proposal_id), "wb") as f:
            f.write(nonce + ciphertext)

    def load_proposal(self, proposal_id: str) -> Optional[Dict[str, Any]]:
        """Loads and decrypts proposal data from disk."""
        if not self._encryption_key:
            raise PermissionError("Master password not set. Storage is locked.")

        path = self._get_file_path(proposal_id)
        if not path.exists():
            return None

        try:
            with open(path, "rb") as f:
                raw_data = f.read()

            nonce = raw_data[:12]
            ciphertext = raw_data[12:]

            aesgcm = AESGCM(self._encryption_key)
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            return json.loads(plaintext.decode("utf-8"))
        except Exception:
            # Decryption failure usually means wrong password or corrupted data
            return None

    def delete_proposal(self, proposal_id: str):
        """Deletes a proposal file from disk."""
        path = self._get_file_path(proposal_id)
        if path.exists():
            path.unlink()

# Singleton instance
storage_service = StorageService()
