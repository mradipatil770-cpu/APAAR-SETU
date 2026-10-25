import os
import hmac
import base64
import hashlib
import logging
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from app.core.config import settings

logger = logging.getLogger("apaarsetu.crypto")


class CryptoError(Exception):
    """Base exception for cryptographic operations."""
    pass


class CryptoTamperError(CryptoError):
    """Raised when an encrypted ciphertext fails authentication or has been tampered with."""
    pass


class CryptoService:
    """
    Dedicated cryptographic service for APAARSetu:
    - AES-256-GCM for field-level recoverable encryption of sensitive identifiers.
    - Keyed HMAC-SHA-256 for privacy-preserving blind index duplicate matching.
    - Deterministic normalization & masking.
    """

    KEY_VERSION = "v1"

    def __init__(self):
        self._aes_key: bytes = self._load_or_derive_aes_key()
        self._hmac_key: bytes = self._load_or_derive_hmac_key()
        self._aesgcm = AESGCM(self._aes_key)

    def _load_or_derive_aes_key(self) -> bytes:
        raw = getattr(settings, "AES_ENCRYPTION_KEY", "")
        if raw:
            try:
                # Support 64-char hex or 32 raw bytes or base64
                if len(raw) == 64:
                    return bytes.fromhex(raw)
                decoded = base64.b64decode(raw)
                if len(decoded) == 32:
                    return decoded
            except Exception:
                pass
        
        if settings.ENVIRONMENT == "production":
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: AES_ENCRYPTION_KEY must be set in production. "
                "Must be a 32-byte key (64 hex characters)."
            )

        # Development / Testing fallback key (ephemeral, safe for local testing)
        logger.warning(
            "AES_ENCRYPTION_KEY not configured in environment. "
            "Using derived development key for local prototype demonstration only."
        )
        return hashlib.sha256(b"APAARSetu-Dev-AES-Key-Seed-2026").digest()

    def _load_or_derive_hmac_key(self) -> bytes:
        raw = getattr(settings, "HMAC_SEARCH_KEY", "")
        if raw:
            try:
                if len(raw) == 64:
                    return bytes.fromhex(raw)
                decoded = base64.b64decode(raw)
                if len(decoded) >= 32:
                    return decoded
            except Exception:
                pass

        if settings.ENVIRONMENT == "production":
            raise ValueError(
                "CRITICAL SECURITY CONFIGURATION ERROR: HMAC_SEARCH_KEY must be set in production. "
                "Must be a 32-byte key (64 hex characters)."
            )

        logger.warning(
            "HMAC_SEARCH_KEY not configured in environment. "
            "Using derived development HMAC key for local prototype demonstration only."
        )
        return hashlib.sha256(b"APAARSetu-Dev-HMAC-Key-Seed-2026").digest()

    @staticmethod
    def normalize_identifier(identifier: Optional[str]) -> str:
        """Normalizes an APAAR ID by removing whitespace and hyphens."""
        if not identifier:
            return ""
        return identifier.strip().replace(" ", "").replace("-", "")

    @staticmethod
    def mask_identifier(identifier: Optional[str]) -> str:
        """
        Masks an APAAR ID to protect student privacy in UI and exports.
        E.g. '123456789012' -> 'XXXXXXXX9012'.
        """
        norm = CryptoService.normalize_identifier(identifier)
        if not norm:
            return "—"
        if len(norm) <= 4:
            return "X" * len(norm)
        return "X" * (len(norm) - 4) + norm[-4:]

    def compute_hmac_token(self, identifier: Optional[str]) -> Optional[str]:
        """
        Computes a keyed HMAC-SHA-256 blind token for privacy-preserving duplicate detection.
        Prevents brute-force dictionary attacks against the small 12-digit number space.
        """
        norm = self.normalize_identifier(identifier)
        if not norm:
            return None
        return hmac.new(self._hmac_key, norm.encode("utf-8"), hashlib.sha256).hexdigest()

    def encrypt_identifier(
        self,
        identifier: str,
        associated_data: Optional[str] = None
    ) -> Tuple[str, str, str]:
        """
        Encrypts an identifier using AES-256-GCM.
        Returns (ciphertext_base64, nonce_base64, key_version).
        Nonce is a cryptographically secure 96-bit (12 bytes) random value.
        """
        norm = self.normalize_identifier(identifier)
        if not norm:
            return "", "", self.KEY_VERSION

        nonce = os.urandom(12) # 96-bit standard nonce for AES-GCM
        aad = associated_data.encode("utf-8") if associated_data else None

        ciphertext = self._aesgcm.encrypt(nonce, norm.encode("utf-8"), aad)

        ciphertext_b64 = base64.b64encode(ciphertext).decode("utf-8")
        nonce_b64 = base64.b64encode(nonce).decode("utf-8")
        return ciphertext_b64, nonce_b64, self.KEY_VERSION

    def decrypt_identifier(
        self,
        ciphertext_b64: str,
        nonce_b64: str,
        associated_data: Optional[str] = None,
        key_version: str = "v1"
    ) -> str:
        """
        Decrypts an identifier using AES-256-GCM and verifies the authentication tag.
        Fails safely if the ciphertext, nonce, or associated data has been tampered with.
        """
        if not ciphertext_b64 or not nonce_b64:
            return ""

        try:
            ciphertext = base64.b64decode(ciphertext_b64)
            nonce = base64.b64decode(nonce_b64)
            aad = associated_data.encode("utf-8") if associated_data else None

            plaintext_bytes = self._aesgcm.decrypt(nonce, ciphertext, aad)
            return plaintext_bytes.decode("utf-8")
        except InvalidTag:
            logger.error("Tampering or authentication tag failure during identifier decryption.")
            raise CryptoTamperError("Ciphertext integrity verification failed (invalid authentication tag).")
        except Exception as exc:
            logger.error(f"Decryption failed: {exc}")
            raise CryptoError(f"Decryption operation failed: {exc}")


crypto_service = CryptoService()

