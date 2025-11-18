from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

REQUIRED_ENV = ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")


def _get_env(name: str) -> str:
  value = os.environ.get(name)
  if value:
    return value
  alias = {
    "SUPABASE_URL": "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY": "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  }.get(name)
  if alias:
    alias_val = os.environ.get(alias)
    if alias_val:
      return alias_val
  raise RuntimeError(f"La variable {name} es obligatoria para ejecutar el análisis.")


def get_storage_bucket() -> str:
  return os.environ.get("SUPABASE_STORAGE_BUCKET", "buses-docs")


def get_output_dir() -> Path:
  directorio = Path(os.environ.get("ANALYSIS_OUTPUT_DIR", "output")).resolve()
  directorio.mkdir(parents=True, exist_ok=True)
  return directorio


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
  url = _get_env("SUPABASE_URL")
  key = _get_env("SUPABASE_SERVICE_ROLE_KEY")
  return create_client(url, key)
