export const TIPOS_DOCUMENTO = [
  'PERMISO_DE_CIRCULACION',
  'SEGURO_OBLIGATORIO',
  'REVISION_TECNICA',
  'REVISION_GASES',
  'CERTIFICADO_INSCRIPCION',
  'CERTIFICADO_RECORRIDO'
] as const;

export type TipoDocumento = (typeof TIPOS_DOCUMENTO)[number];

export const ESTADOS_DOCUMENTO = ['TIENE', 'NO_TIENE', 'DANADO'] as const;
export type EstadoDocumento = (typeof ESTADOS_DOCUMENTO)[number];

export const NOMBRE_DOCUMENTO: Record<TipoDocumento, string> = {
  PERMISO_DE_CIRCULACION: 'Permiso de circulación',
  SEGURO_OBLIGATORIO: 'Seguro obligatorio',
  REVISION_TECNICA: 'Revisión técnica',
  REVISION_GASES: 'Revisión de gases',
  CERTIFICADO_INSCRIPCION: 'Certificado de inscripción',
  CERTIFICADO_RECORRIDO: 'Certificado de recorrido'
};

export const ESTADO_COLOR: Record<EstadoDocumento, string> = {
  TIENE: 'bg-green-100 text-green-800 border-green-200',
  NO_TIENE: 'bg-red-100 text-red-800 border-red-200',
  DANADO: 'bg-amber-100 text-amber-800 border-amber-200'
};

export const STORAGE_BUCKET = 'buses-docs';
