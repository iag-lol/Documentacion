from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


@dataclass
class Bus:
  id: str
  ppu: str
  numero_interno: str
  activo: bool


@dataclass
class DocumentoArchivo:
  id: str
  bus_id: str
  tipo_documento: str
  storage_path: str
  mime_type: str
  uploaded_at: str
  activo: bool


@dataclass
class AnalysisResult:
  bus: Bus
  documento: DocumentoArchivo
  resumen: Dict[str, Any]
  observaciones: List[str] = field(default_factory=list)
  puntaje_confianza: float = 0.0
  analizado_en: datetime = field(default_factory=datetime.utcnow)

  def to_record(self) -> Dict[str, Any]:
    return {
      "documento_archivo_id": self.documento.id,
      "bus_id": self.bus.id,
      "tipo_documento": self.documento.tipo_documento,
      "resumen": self.resumen,
      "observaciones": "\n".join(self.observaciones) or None,
      "puntaje_confianza": round(self.puntaje_confianza, 4),
      "analizado_en": self.analizado_en.isoformat(),
    }
