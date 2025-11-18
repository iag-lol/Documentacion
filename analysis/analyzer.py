from __future__ import annotations

import io
import logging
from typing import Dict, List

from PIL import Image
from PyPDF2 import PdfReader

try:
  import pytesseract  # type: ignore
except Exception:  # pragma: no cover - dependencia opcional
  pytesseract = None

from .models import AnalysisResult, Bus, DocumentoArchivo

LOGGER = logging.getLogger(__name__)

PALABRAS_CLAVE = {
  "PERMISO_DE_CIRCULACION": ["permiso", "circulación", "municipalidad"],
  "SEGURO_OBLIGATORIO": ["soap", "seguro", "compañía"],
  "REVISION_TECNICA": ["plant", "revisión técnica", "rv"],
  "REVISION_GASES": ["gases", "emisiones"],
  "CERTIFICADO_INSCRIPCION": ["registro", "inscripción"],
  "CERTIFICADO_RECORRIDO": ["recorrido", "seremitt"],
}


class DocumentAnalyzer:
  def __init__(self, bus: Bus):
    self.bus = bus

  def analizar(self, documento: DocumentoArchivo, contenido: bytes) -> AnalysisResult:
    resumen: Dict[str, object] = {
      "mime_type": documento.mime_type,
      "tamanio_bytes": len(contenido),
      "tipo_documento": documento.tipo_documento,
    }
    observaciones: List[str] = []
    puntajes: List[float] = []

    if documento.mime_type.lower() == "application/pdf" or documento.storage_path.lower().endswith(".pdf"):
      data = self._analizar_pdf(contenido, documento)
    elif documento.mime_type.startswith("image"):
      data = self._analizar_imagen(contenido, documento)
    else:
      observaciones.append("Formato no soportado, se realiza análisis básico de tamaño.")
      data = {"heuristicas": []}

    resumen.update(data)

    if resumen.get("tiene_ppu"):
      puntajes.append(0.4)
    else:
      observaciones.append("No se encontró la PPU del bus en el documento.")

    if resumen.get("tiene_numero_interno"):
      puntajes.append(0.25)
    else:
      observaciones.append("No aparece el número interno del bus.")

    if resumen.get("palabras_clave"):
      puntajes.append(0.2)

    if resumen.get("paginas", 1) >= 1 and resumen.get("tamanio_bytes", 0) > 50_000:
      puntajes.append(0.1)
    else:
      observaciones.append("Archivo demasiado liviano, podría estar incompleto.")

    puntaje = min(sum(puntajes), 0.95)

    return AnalysisResult(
      bus=self.bus,
      documento=documento,
      resumen=resumen,
      observaciones=observaciones,
      puntaje_confianza=puntaje,
    )

  def _analizar_pdf(self, contenido: bytes, documento: DocumentoArchivo) -> Dict[str, object]:
    buffer = io.BytesIO(contenido)
    reader = PdfReader(buffer)
    paginas = len(reader.pages)
    texto_completo = ""
    for pagina in reader.pages:
      try:
        texto_completo += pagina.extract_text() or ""
      except Exception:  # pragma: no cover - PyPDF puede fallar en PDFs escaneados
        continue
    texto_normalizado = texto_completo.lower()

    palabras = PALABRAS_CLAVE.get(documento.tipo_documento, [])
    claves_detectadas = [p for p in palabras if p in texto_normalizado]

    return {
      "paginas": paginas,
      "tiene_ppu": self.bus.ppu.lower().replace("-", "") in texto_normalizado.replace("-", ""),
      "tiene_numero_interno": self.bus.numero_interno.lower() in texto_normalizado,
      "palabras_clave": claves_detectadas,
      "caracteristicas_pdf": {
        "lector": getattr(reader, "pdf_header", ""),
        "encrypted": reader.is_encrypted,
      },
    }

  def _analizar_imagen(self, contenido: bytes, documento: DocumentoArchivo) -> Dict[str, object]:
    imagen = Image.open(io.BytesIO(contenido))
    width, height = imagen.size
    ocr_texto = ""
    if pytesseract:
      try:
        ocr_texto = pytesseract.image_to_string(imagen, lang="spa")
      except Exception as exc:  # pragma: no cover
        LOGGER.warning("OCR falló para %s: %s", documento.storage_path, exc)
    texto_normalizado = ocr_texto.lower()
    palabras = PALABRAS_CLAVE.get(documento.tipo_documento, [])
    claves_detectadas = [p for p in palabras if p in texto_normalizado]
    return {
      "dimensiones": {"ancho": width, "alto": height},
      "tiene_ppu": self.bus.ppu.lower().replace("-", "") in texto_normalizado.replace("-", ""),
      "tiene_numero_interno": self.bus.numero_interno.lower() in texto_normalizado,
      "palabras_clave": claves_detectadas,
      "ocr_habilitado": bool(ocr_texto),
    }
