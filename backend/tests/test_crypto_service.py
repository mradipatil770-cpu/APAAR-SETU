import pytest
from app.core.crypto import CryptoService, CryptoTamperError


def test_aes_gcm_encryption_roundtrip():
    crypto = CryptoService()
    plaintext = "123456789012"
    aad = "11111111-1111-1111-1111-111111111111"

    ciphertext_b64, nonce_b64, key_ver = crypto.encrypt_identifier(plaintext, associated_data=aad)
    assert ciphertext_b64 != plaintext
    assert len(nonce_b64) > 0
    assert key_ver == "v1"

    decrypted = crypto.decrypt_identifier(ciphertext_b64, nonce_b64, associated_data=aad, key_version=key_ver)
    assert decrypted == plaintext


def test_aes_gcm_tampering_fails_safely():
    crypto = CryptoService()
    plaintext = "987654321098"
    aad = "INST-001"

    ciphertext_b64, nonce_b64, key_ver = crypto.encrypt_identifier(plaintext, associated_data=aad)

    # Tamper with the ciphertext (flip a character)
    tampered_ciphertext = "A" + ciphertext_b64[1:]

    with pytest.raises(CryptoTamperError):
        crypto.decrypt_identifier(tampered_ciphertext, nonce_b64, associated_data=aad)

    # Tamper with AAD
    with pytest.raises(CryptoTamperError):
        crypto.decrypt_identifier(ciphertext_b64, nonce_b64, associated_data="WRONG-INST-002")


def test_hmac_blind_token_properties():
    crypto = CryptoService()
    id1 = "123456789012"
    id2 = "1234 5678 9012" # With spaces
    id3 = "1234-5678-9012" # With hyphens
    different_id = "999988887777"

    token1 = crypto.compute_hmac_token(id1)
    token2 = crypto.compute_hmac_token(id2)
    token3 = crypto.compute_hmac_token(id3)
    different_token = crypto.compute_hmac_token(different_id)

    # Normalized inputs must yield identical HMAC tokens
    assert token1 == token2 == token3
    assert len(token1) == 64 # SHA-256 hex length
    assert token1 != different_token


def test_identifier_masking():
    crypto = CryptoService()
    assert crypto.mask_identifier("123456789012") == "XXXXXXXX9012"
    assert crypto.mask_identifier("1234 5678 9012") == "XXXXXXXX9012"
    assert crypto.mask_identifier("9999") == "XXXX"
    assert crypto.mask_identifier(None) == "—"
    assert crypto.mask_identifier("") == "—"
