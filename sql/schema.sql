create extension if not exists "pgcrypto";

create table if not exists public.buses (
  id uuid primary key default gen_random_uuid(),
  ppu text not null unique,
  numero_interno text not null unique,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.documentos_bus (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses(id) on delete cascade,
  tipo_documento text not null,
  estado text not null,
  observacion text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint documentos_bus_tipo check (
    tipo_documento in (
      'PERMISO_DE_CIRCULACION',
      'SEGURO_OBLIGATORIO',
      'REVISION_TECNICA',
      'REVISION_GASES',
      'CERTIFICADO_INSCRIPCION',
      'CERTIFICADO_RECORRIDO'
    )
  ),
  constraint documentos_bus_estado check (estado in ('TIENE', 'NO_TIENE', 'DANADO')),
  constraint documentos_bus_unique unique (bus_id, tipo_documento)
);

create index if not exists documentos_bus_bus_id_idx on public.documentos_bus (bus_id);
create index if not exists documentos_bus_tipo_estado_idx on public.documentos_bus (tipo_documento, estado);

create table if not exists public.documentos_archivos (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references public.buses(id) on delete cascade,
  tipo_documento text not null,
  storage_path text not null,
  mime_type text not null,
  uploaded_at timestamptz not null default now(),
  activo boolean not null default true,
  constraint documentos_archivos_tipo check (
    tipo_documento in (
      'PERMISO_DE_CIRCULACION',
      'SEGURO_OBLIGATORIO',
      'REVISION_TECNICA',
      'REVISION_GASES',
      'CERTIFICADO_INSCRIPCION',
      'CERTIFICADO_RECORRIDO'
    )
  )
);

create index if not exists documentos_archivos_bus_tipo_idx on public.documentos_archivos (bus_id, tipo_documento);
create index if not exists documentos_archivos_bus_tipo_activo_idx on public.documentos_archivos (bus_id, tipo_documento, activo);

create unique index if not exists documentos_archivos_revision_activa_unique
  on public.documentos_archivos (bus_id, tipo_documento)
  where tipo_documento in ('REVISION_TECNICA', 'REVISION_GASES') and activo;

create table if not exists public.documentos_analisis (
  id uuid primary key default gen_random_uuid(),
  documento_archivo_id uuid not null references public.documentos_archivos(id) on delete cascade,
  bus_id uuid not null references public.buses(id) on delete cascade,
  tipo_documento text not null,
  resumen jsonb not null default '{}'::jsonb,
  observaciones text,
  puntaje_confianza numeric(5,4),
  analizado_en timestamptz not null default now(),
  constraint documentos_analisis_tipo check (
    tipo_documento in (
      'PERMISO_DE_CIRCULACION',
      'SEGURO_OBLIGATORIO',
      'REVISION_TECNICA',
      'REVISION_GASES',
      'CERTIFICADO_INSCRIPCION',
      'CERTIFICADO_RECORRIDO'
    )
  )
);

create index if not exists documentos_analisis_bus_tipo_idx on public.documentos_analisis (bus_id, tipo_documento);
create index if not exists documentos_analisis_doc_idx on public.documentos_analisis (documento_archivo_id);
