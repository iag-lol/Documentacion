import { EstadoDocumento, TipoDocumento } from '@/utils/constants';

export interface Bus {
  id: string;
  ppu: string;
  numero_interno: string;
  activo: boolean;
  created_at: string;
}

export interface DocumentoBus {
  id: string;
  bus_id: string;
  tipo_documento: TipoDocumento;
  estado: EstadoDocumento;
  observacion: string | null;
  updated_at: string;
  created_at: string;
}

export interface DocumentoArchivo {
  id: string;
  bus_id: string;
  tipo_documento: TipoDocumento;
  storage_path: string;
  mime_type: string;
  uploaded_at: string;
  activo: boolean;
}

export interface DocumentoAnalisis {
  id: string;
  documento_archivo_id: string;
  bus_id: string;
  tipo_documento: TipoDocumento;
  resumen: Record<string, unknown>;
  observaciones: string | null;
  puntaje_confianza: number | null;
  analizado_en: string;
}

export interface CompletenessDetalle {
  bus: Bus;
  completo: boolean;
  faltantes: Array<{
    tipo_documento: TipoDocumento;
    motivo: 'ESTADO' | 'ARCHIVO';
  }>;
}
