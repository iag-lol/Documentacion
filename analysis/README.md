# Análisis automático de documentación

Este módulo en Python descarga los archivos digitales almacenados en Supabase Storage, ejecuta un análisis semántico rápido y deja los resultados consolidados en la tabla `documentos_analisis`. El objetivo es complementar el panel de Next.js con verificaciones automatizadas que ayuden a detectar inconsistencias antes de aprobar o imprimir documentos.

## Requisitos

- Python 3.10+
- Dependencias de `analysis/requirements.txt`
- Variables de entorno (se pueden definir en un `.env` dentro de `analysis/`):
  - `SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_URL`)
  - `SUPABASE_SERVICE_ROLE_KEY` (clave service role para lectura/escritura de Storage y tablas protegidas)
  - `SUPABASE_STORAGE_BUCKET` (opcional, por defecto `buses-docs`)
  - `ANALYSIS_OUTPUT_DIR` (opcional, carpeta donde se dejarán reportes JSON/Markdown)
- Para habilitar OCR en imágenes: instalar Tesseract en el sistema operativo y asegurarse de que `pytesseract` pueda invocarlo.

## Instalación

```bash
cd analysis
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env # y completa los valores
```

## Uso rápido

```bash
python run_analysis.py --ppu=ABCD12 --export-json --export-markdown
```

### Opciones principales

```
python run_analysis.py [--ppu PPU] [--bus-id UUID] [--todos] \
  [--solo-activos/--incluir-historicos] \
  [--export-json] [--export-markdown] [--sin-guardar]
```

- `--ppu` o `--bus-id` permiten analizar un bus específico. Con `--todos` se procesan todos los buses activos.
- `--solo-activos` limita el análisis a archivos con `activo=true` (comportamiento por defecto).
- `--incluir-historicos` considera todos los archivos aunque estén inactivos.
- `--export-json` y `--export-markdown` generan reportes en `analysis/output/` (configurable).
- `--sin-guardar` evita escribir el resultado en la tabla `documentos_analisis` si solo necesitas una corrida ad-hoc.

## Flujo

1. Consulta los buses y documentos (`documentos_archivos`).
2. Descarga cada archivo desde Storage.
3. Analiza PDFs (PyPDF2) e imágenes (Pillow + OCR opcional) para detectar:
   - Cantidad de páginas y tamaño del archivo.
   - Presencia de la PPU/número interno dentro del texto.
   - Palabras clave dependiendo del tipo de documento.
   - Anomalías (archivos en blanco, PDFs protegidos, imágenes muy pequeñas, etc.).
4. Calcula un puntaje de confianza (`puntaje_confianza`).
5. Persiste el resultado en `documentos_analisis` y deja un registro JSON/Markdown.

Los registros quedan disponibles en el panel “Documentos” para cada archivo, facilitando la revisión manual.
