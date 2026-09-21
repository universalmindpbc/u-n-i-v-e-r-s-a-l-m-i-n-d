#!/usr/bin/env python3
"""Prepare an owner-only sealed document and public-key-encrypted server seed.

All outputs MUST be outside the website/source tree, in an ignored .private
directory. This command never uploads anything. Existing keys are preserved.
"""
import argparse
import base64
import hashlib
import io
import json
import os
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pypdf import PdfReader, PdfWriter, PageObject
from reportlab.pdfgen.canvas import Canvas

AAD = b"universal-sovereignty/envelope/v1"


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    path.write_bytes(data if isinstance(data, bytes) else data.encode())
    path.chmod(0o600)


def js(value):
    return json.dumps(value, separators=(",", ":")).encode()


def key_file(path):
    if path.exists():
        return serialization.load_pem_private_key(path.read_bytes(), password=None)
    key = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    write(path, key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                                 serialization.NoEncryption()))
    return key


def envelope(data, recipient):
    key, iv = os.urandom(32), os.urandom(12)
    encrypted = AESGCM(key).encrypt(iv, data, AAD)
    wrapped = recipient.encrypt(key, padding.OAEP(mgf=padding.MGF1(hashes.SHA1()),
                                                algorithm=hashes.SHA1(), label=None))
    enc = lambda value: base64.b64encode(value).decode()
    return dict(schema=1, algorithm="AES-256-GCM+RSA-OAEP-SHA1", aad=AAD.decode(),
                wrapped_key=enc(wrapped), iv=enc(iv), tag=enc(encrypted[-16:]),
                ciphertext=enc(encrypted[:-16]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--flora", type=Path, required=True)
    parser.add_argument("--private-dir", type=Path, required=True)
    parser.add_argument("--environment", choices=["staging", "production"], default="staging")
    args = parser.parse_args()
    private = args.private_dir.resolve()
    if ".private" not in private.parts or "i  a m" in private.parts:
        parser.error("Use an owner-only .private directory outside the website folder")
    os.umask(0o077)
    private.mkdir(parents=True, exist_ok=True, mode=0o700)
    seed = private / (args.environment + "-runtime")
    if (seed / "config.json").exists():
        parser.error("Runtime already prepared; do not rotate keys or document silently")
    reader = PdfReader(args.source)
    writer = PdfWriter()
    # Add header space instead of obscuring, shrinking or reflowing source text.
    for page in reader.pages:
        width, height = float(page.mediabox.width), float(page.mediabox.height)
        output = PageObject.create_blank_page(width=width, height=height + 48)
        output.merge_page(page)
        artwork = io.BytesIO()
        canvas = Canvas(artwork, pagesize=(width, height + 48))
        canvas.drawImage(str(args.flora), 56, height + 8, width=30, height=30, mask="auto")
        canvas.save()
        output.merge_page(PdfReader(artwork).pages[0])
        writer.add_page(output)
    writer.add_metadata({"/Title": "Universal Sovereignty", "/Author": "Andrew Bartzis"})
    sealed = private / "Universal Sovereignty - sealed.pdf"
    with sealed.open("wb") as stream:
        writer.write(stream)
    sealed.chmod(0o600)
    proof = PdfReader(sealed)
    assert len(proof.pages) == len(reader.pages)
    for original, result in zip(reader.pages, proof.pages):
        assert original.extract_text().rstrip() == result.extract_text().rstrip(), "Source wording changed"
    recipient = key_file(private / "owner-decryption-key.pem")
    signing = key_file(seed / "signing-private.pem")
    public = recipient.public_key().public_bytes(serialization.Encoding.PEM,
                                                serialization.PublicFormat.SubjectPublicKeyInfo)
    write(seed / "recipient-public.pem", public)
    write(private / (args.environment + "-signing-public.pem"), signing.public_key().public_bytes(
        serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo))
    encrypted = js(envelope(sealed.read_bytes(), recipient.public_key()))
    write(seed / "document.encrypted.json", encrypted)
    write(seed / "document.json", js(dict(version="universal-sovereignty-v1",
        pages=len(reader.pages), sealed_sha256=hashlib.sha256(sealed.read_bytes()).hexdigest(),
        encrypted_sha256=hashlib.sha256(encrypted).hexdigest())))
    token = os.urandom(32).hex()
    write(private / (args.environment + "-worker-token"), token)
    write(seed / "config.json", js(dict(schema=1, enabled=True, environment=args.environment,
        identity_key=os.urandom(32).hex(), worker_token_sha256=hashlib.sha256(token.encode()).hexdigest(),
        retention_days=None, vaults=[])))
    write(private / "README.txt", "Private owner archive. Never commit or upload this directory.\n"
        "Keep an encrypted offline backup of owner-decryption-key.pem; losing it loses access to every encrypted copy.\n"
        "Only the explicitly named staging-runtime files are eligible for private provisioning.\n"
        "The original and sealed PDFs, owner decryption key and worker token stay on this computer.\n"
        "The declaration records portal entry only, with no consent, signature by a member, or token issuance asserted.\n")
    print(json.dumps(dict(pages=len(reader.pages), exact_text_preserved=True,
                          encrypted=True, private_key_uploaded=False)))


if __name__ == "__main__":
    main()
