from __future__ import annotations

import logging
from typing import Optional

from supabase import Client

from .config import get_storage_bucket

LOGGER = logging.getLogger(__name__)


def download_file(client: Client, path: str) -> bytes:
  bucket = get_storage_bucket()
  response = client.storage.from_(bucket).download(path)
  if isinstance(response, bytes):
    return response
  # supabase-py retorna objeto con atributo data
  data = getattr(response, "data", None)
  if not data:
    raise RuntimeError(f"No se pudo descargar {path} del bucket {bucket}")
  return data
