from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import typer
from rich import print as rprint

from config import get_output_dir, get_supabase_client
from data_access import (
  fetch_all_buses,
  fetch_bus,
  fetch_documentos,
  save_analysis_results,
)
from analyzer import DocumentAnalyzer
from models import AnalysisResult
from reporting import exportar_json, exportar_markdown, imprimir_resumen
from storage import download_file

app = typer.Typer(help="Analiza documentos de buses desde Supabase.")


def _resolver_buses(ppu: Optional[str], bus_id: Optional[str], todos: bool):
  client = get_supabase_client()
  if todos:
    buses = fetch_all_buses(client)
    if not buses:
      raise typer.BadParameter("No se encontraron buses activos.")
    return client, buses
  bus = fetch_bus(client, ppu=ppu, bus_id=bus_id)
  if not bus:
    raise typer.BadParameter("No encontramos el bus solicitado.")
  return client, [bus]


@app.command()
def run(
  ppu: Optional[str] = typer.Option(None, help="PPU del bus a analizar"),
  bus_id: Optional[str] = typer.Option(None, help="UUID del bus"),
  todos: bool = typer.Option(False, help="Analiza todos los buses activos"),
  solo_activos: bool = typer.Option(True, help="Sólo considerar archivos activos"),
  export_json: bool = typer.Option(False, help="Genera un JSON con el resumen"),
  export_markdown: bool = typer.Option(False, help="Genera un informe Markdown"),
  sin_guardar: bool = typer.Option(False, help="No guarda resultados en Supabase"),
):
  if not any([ppu, bus_id, todos]):
    raise typer.BadParameter("Debes indicar --ppu, --bus-id o --todos")
  client, buses = _resolver_buses(ppu, bus_id, todos)
  todos_resultados: List[AnalysisResult] = []

  for bus in buses:
    rprint(f"[bold blue]Analizando bus {bus.ppu} ({bus.numero_interno})[/bold blue]")
    documentos = fetch_documentos(client, bus_id=bus.id, solo_activos=solo_activos)
    if not documentos:
      rprint("[yellow]No hay documentos digitales para este bus.[/yellow]")
      continue
    analizador = DocumentAnalyzer(bus)
    for documento in documentos:
      contenido = download_file(client, documento.storage_path)
      resultado = analizador.analizar(documento, contenido)
      todos_resultados.append(resultado)

  if not todos_resultados:
    rprint("[yellow]No se generaron resultados de análisis.[/yellow]")
    raise typer.Exit(code=0)

  imprimir_resumen(todos_resultados)

  if not sin_guardar:
    save_analysis_results(client, [resultado.to_record() for resultado in todos_resultados])
    rprint("[green]Resultados guardados en documentos_analisis.[/green]")

  output_dir = get_output_dir()
  timestamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
  if export_json:
    destino = output_dir / f"reporte-{timestamp}.json"
    exportar_json(todos_resultados, destino)
    rprint(f"[cyan]Reporte JSON: {destino}")
  if export_markdown:
    destino = output_dir / f"reporte-{timestamp}.md"
    exportar_markdown(todos_resultados, destino)
    rprint(f"[cyan]Reporte Markdown: {destino}")


if __name__ == "__main__":
  app()
