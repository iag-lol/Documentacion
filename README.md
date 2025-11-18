# Gestión de documentación de buses

Aplicación Next.js + Tailwind + Supabase para revisar documentación, controlar estados de la flota y administrar archivos digitales. Incluye módulo de análisis automático en Python para validar PDFs/Imágenes cargados.

## Instalación Frontend

```bash
npm install
npm run dev
```

Crea un archivo `.env.local` con:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Aplica el esquema de Supabase con `sql/schema.sql` y crea el bucket `buses-docs`.

## Análisis automático (Python)

Dentro de `analysis/` encontrarás un CLI que descarga los documentos desde Supabase Storage, los inspecciona (PyPDF2, OCR opcional) y registra los resultados en `documentos_analisis`. Luego, el panel “Documentos” muestra los hallazgos para cada archivo.

Pasos rápidos:

```bash
cd analysis
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
python run_analysis.py --ppu=ABCD12 --export-json --export-markdown
```

Puedes listar las opciones con `npm run analyze:docs` o `python run_analysis.py --help`.
