'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';
import type { CompletenessDetalle } from '@/types';

interface BusDetalleSupabase {
  id: string;
  ppu: string;
  numero_interno: string;
  activo: boolean;
  created_at: string;
  documentos_bus: Array<{
    tipo_documento: TipoDocumento;
    estado: 'TIENE' | 'NO_TIENE' | 'DANADO';
  }>;
  documentos_archivos: Array<{
    tipo_documento: TipoDocumento;
    activo: boolean;
  }>;
}

export const useCompletenessReport = () => {
  const [detalles, setDetalles] = useState<CompletenessDetalle[]>([]);
  const [soloIncompletos, setSoloIncompletos] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { data, error: supaError } = await supabase
      .from('buses')
      .select(
        'id, ppu, numero_interno, activo, created_at, documentos_bus(tipo_documento, estado), documentos_archivos(tipo_documento, activo)'
      )
      .order('ppu');

    if (supaError) {
      setError('No se pudo calcular el informe de completitud.');
      setDetalles([]);
    } else {
      const procesados = ((data as BusDetalleSupabase[]) ?? []).map<CompletenessDetalle>((bus) => {
        const faltantes: CompletenessDetalle['faltantes'] = [];
        TIPOS_DOCUMENTO.forEach((tipo) => {
          const registro = (bus.documentos_bus ?? []).find((d) => d.tipo_documento === tipo);
          const archivoActivo = (bus.documentos_archivos ?? []).some(
            (archivo) => archivo.tipo_documento === tipo && archivo.activo
          );
          if (!registro || registro.estado !== 'TIENE') {
            faltantes.push({ tipo_documento: tipo, motivo: 'ESTADO' });
          } else if (!archivoActivo) {
            faltantes.push({ tipo_documento: tipo, motivo: 'ARCHIVO' });
          }
        });
        return {
          bus: {
            id: bus.id,
            ppu: bus.ppu,
            numero_interno: bus.numero_interno,
            activo: bus.activo,
            created_at: bus.created_at
          },
          completo: faltantes.length === 0,
          faltantes
        };
      });
      setDetalles(procesados);
    }
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = useMemo(() => {
    const total = detalles.length;
    const completos = detalles.filter((d) => d.completo).length;
    const incompletos = total - completos;
    return { total, completos, incompletos };
  }, [detalles]);

  const visibles = useMemo(() => {
    return soloIncompletos ? detalles.filter((d) => !d.completo) : detalles;
  }, [detalles, soloIncompletos]);

  return {
    detalles: visibles,
    resumen,
    soloIncompletos,
    setSoloIncompletos,
    cargando,
    error,
    recargar: cargar
  };
};
