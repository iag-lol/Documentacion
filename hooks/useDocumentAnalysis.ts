'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { DocumentoAnalisis } from '@/types';
import type { TipoDocumento } from '@/utils/constants';

export const useDocumentAnalysis = (busId: string | null, tipoDocumento: TipoDocumento | null) => {
  const [analisis, setAnalisis] = useState<DocumentoAnalisis[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const cargar = useCallback(async () => {
    if (!busId || !tipoDocumento) {
      setAnalisis([]);
      return;
    }
    setCargando(true);
    setError(null);
    const { data, error: supaError } = await supabase
      .from('documentos_analisis')
      .select('*')
      .eq('bus_id', busId)
      .eq('tipo_documento', tipoDocumento)
      .order('analizado_en', { ascending: false });
    if (supaError) {
      setError('No se pudo cargar el análisis automático.');
      setAnalisis([]);
    } else {
      setAnalisis(data ?? []);
    }
    setCargando(false);
  }, [busId, supabase, tipoDocumento]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { analisis, cargando, error, recargar: cargar };
};
