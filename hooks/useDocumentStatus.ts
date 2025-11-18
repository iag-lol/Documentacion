'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ESTADOS_DOCUMENTO, EstadoDocumento, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';

const generarEstadoBase = () =>
  TIPOS_DOCUMENTO.reduce<Record<TipoDocumento, EstadoDocumento>>((acc, tipo) => {
    acc[tipo] = 'NO_TIENE';
    return acc;
  }, {} as Record<TipoDocumento, EstadoDocumento>);

export const useDocumentStatus = (busId: string | null) => {
  const [estados, setEstados] = useState<Record<TipoDocumento, EstadoDocumento>>(generarEstadoBase);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  useEffect(() => {
    if (!busId) {
      setEstados(generarEstadoBase());
      return;
    }

    const obtenerEstados = async () => {
      setCargando(true);
      setError(null);
      const { data, error: supaError } = await supabase
        .from('documentos_bus')
        .select('tipo_documento, estado')
        .eq('bus_id', busId);

      if (supaError) {
        setError('No se pudo cargar el estado documental.');
      } else {
        const base = generarEstadoBase();
        (data ?? []).forEach((row) => {
          base[row.tipo_documento as TipoDocumento] = row.estado as EstadoDocumento;
        });
        setEstados(base);
      }
      setCargando(false);
    };

    obtenerEstados();
  }, [busId, supabase]);

  const actualizarEstado = useCallback((tipo: TipoDocumento, estado: EstadoDocumento) => {
    setEstados((prev) => ({
      ...prev,
      [tipo]: estado
    }));
  }, []);

  const guardarEstados = useCallback(
    async (observacion?: string) => {
      if (!busId) {
        setError('Debes seleccionar un bus.');
        return;
      }
      setGuardando(true);
      setMensaje(null);
      setError(null);

      const ahora = new Date().toISOString();
      const registros = TIPOS_DOCUMENTO.map((tipo) => ({
        bus_id: busId,
        tipo_documento: tipo,
        estado: estados[tipo],
        observacion: observacion ?? null,
        updated_at: ahora
      }));

      const { error: supaError } = await supabase
        .from('documentos_bus')
        .upsert(registros, {
          onConflict: 'bus_id,tipo_documento'
        });

      if (supaError) {
        setError('No pudimos guardar los cambios.');
      } else {
        setMensaje('Estados actualizados correctamente.');
      }
      setGuardando(false);
    },
    [busId, estados, supabase]
  );

  const documentosCriticos = useMemo(
    () =>
      TIPOS_DOCUMENTO.filter((tipo) => estados[tipo] === 'NO_TIENE' || estados[tipo] === 'DANADO'),
    [estados]
  );

  return {
    estados,
    setEstados,
    actualizarEstado,
    guardarEstados,
    documentosCriticos,
    cargando,
    guardando,
    mensaje,
    error,
    estadosPosibles: ESTADOS_DOCUMENTO
  };
};
