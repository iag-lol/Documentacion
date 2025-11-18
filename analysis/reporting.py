from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, List

from rich.console import Console
from rich.table import Table

from .models import AnalysisResult

console = Console()


def imprimir_resumen(resultados: Iterable[AnalysisResult]) -> None:
  tabla = Table(title="Resumen de análisis documental")
  tabla.add_column("PPU")
  tabla.add_column("Documento")
  tabla.add_column("Archivo")
  tabla.add_column("Puntaje", justify="right")
  tabla.add_column("Observaciones")
  for resultado in resultados:
    tabla.add_row(
      resultado.bus.ppu,
      resultado.documento.tipo_documento,
      resultado.documento.storage_path.split("/")[-1],
      f"{resultado.puntaje_confianza:.2f}",
      " | ".join(resultado.observaciones) or "—",
    )
  console.print(tabla)


def exportar_json(resultados: List[AnalysisResult], destino: Path) -> Path:
  destino.parent.mkdir(parents=True, exist_ok=True)
  contenido = [
    {
      "bus": {
        "ppu": r.bus.ppu,
        "numero_interno": r.bus.numero_interno,
      },
      "documento": {
        "tipo": r.documento.tipo_documento,
        "storage_path": r.documento.storage_path,
        "mime_type": r.documento.mime_type,
      },
      "resumen": r.resumen,
      "observaciones": r.observaciones,
      "puntaje_confianza": r.puntaje_confianza,
      "analizado_en": r.analizado_en.isoformat(),
    }
    for r in resultados
  ]
  destino.write_text(json.dumps(contenido, indent=2, ensure_ascii=False))
  return destino


def exportar_markdown(resultados: List[AnalysisResult], destino: Path) -> Path:
  destino.parent.mkdir(parents=True, exist_ok=True)
  lineas = ["# Informe de análisis documental", ""]
  for resultado in resultados:
    lineas.extend(
      [
        f"## {resultado.bus.ppu} · {resultado.documento.tipo_documento}",
        f"Archivo: `{resultado.documento.storage_path}`",
        f"Puntaje de confianza: **{resultado.puntaje_confianza:.2f}**",
        f"Observaciones: {resultado.observaciones or ['Sin observaciones']}",
        "```json",
        json.dumps(resultado.resumen, indent=2, ensure_ascii=False),
        "```",
        "",
      ]
    )
  destino.write_text("\n".join(lineas))
  return destino
