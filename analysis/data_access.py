from __future__ import annotations

from typing import Iterable, List, Optional

from supabase import Client

from .models import Bus, DocumentoArchivo


def fetch_bus(client: Client, *, ppu: Optional[str] = None, bus_id: Optional[str] = None) -> Optional[Bus]:
  query = client.table("buses").select("id, ppu, numero_interno, activo").limit(1)
  if ppu:
    query = query.ilike("ppu", ppu.upper())
  elif bus_id:
    query = query.eq("id", bus_id)
  else:
    raise ValueError("Debes indicar ppu o bus_id")
  response = query.execute()
  data = (response.data or [])
  if not data:
    return None
  row = data[0]
  return Bus(id=row["id"], ppu=row["ppu"], numero_interno=row["numero_interno"], activo=row["activo"])


def fetch_all_buses(client: Client) -> List[Bus]:
  response = client.table("buses").select("id, ppu, numero_interno, activo").eq("activo", True).order("ppu").execute()
  return [
    Bus(id=row["id"], ppu=row["ppu"], numero_interno=row["numero_interno"], activo=row["activo"])
    for row in (response.data or [])
  ]


def fetch_documentos(
  client: Client,
  *,
  bus_id: str,
  tipo_documento: Optional[str] = None,
  solo_activos: bool = True,
) -> List[DocumentoArchivo]:
  query = client.table("documentos_archivos").select("*").eq("bus_id", bus_id)
  if tipo_documento:
    query = query.eq("tipo_documento", tipo_documento)
  if solo_activos:
    query = query.eq("activo", True)
  response = query.order("uploaded_at", desc=True).execute()
  data = response.data or []
  return [
    DocumentoArchivo(
      id=row["id"],
      bus_id=row["bus_id"],
      tipo_documento=row["tipo_documento"],
      storage_path=row["storage_path"],
      mime_type=row["mime_type"],
      uploaded_at=row["uploaded_at"],
      activo=row["activo"],
    )
    for row in data
  ]


def save_analysis_results(client: Client, results: Iterable[dict]) -> None:
  payload = list(results)
  if not payload:
    return
  client.table("documentos_analisis").insert(payload).execute()
