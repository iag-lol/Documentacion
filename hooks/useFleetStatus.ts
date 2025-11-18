'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { EstadoDocumento, TipoDocumento } from '@/utils/constants';

interface DocumentoResumen {
  tipo_documento: TipoDocumento;
  estado: EstadoDocumento;
}

export interface BusConDocumentos {
  id: string;
  ppu: string;
  numero_interno: string;
  documentos_bus: DocumentoResumen[];
}

export const useFleetStatus = () => {
  const [buses, setBuses] = useState<BusConDocumentos[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroPPU, setFiltroPPU] = useState('');
  const [filtroNumero, setFiltroNumero] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoDocumento | 'TODOS'>('TODOS');

  const supabase = useMemo(() => getSupabaseClient(), []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const { data, error: supaError } = await supabase
      .from('buses')
      .select('id, ppu, numero_interno, documentos_bus(tipo_documento, estado)')
      .order('ppu');

    if (supaError) {
      setError('No conseguimos cargar la flota.');
      setBuses([]);
    } else {
      const filas = ((data as BusConDocumentos[]) ?? []).map((bus) => ({
        ...bus,
        documentos_bus: bus.documentos_bus ?? []
      }));
      setBuses(filas);
    }
    setCargando(false);
  }, [supabase]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    return buses.filter((bus) => {
      const coincidePPU = bus.ppu.toUpperCase().includes(filtroPPU.trim().toUpperCase());
      const coincideNumero = bus.numero_interno
        .toUpperCase()
        .includes(filtroNumero.trim().toUpperCase());
      const coincideEstado =
        filtroEstado === 'TODOS' ||
        bus.documentos_bus.some((doc) => doc.estado === filtroEstado);
      return coincidePPU && coincideNumero && coincideEstado;
    });
  }, [buses, filtroPPU, filtroNumero, filtroEstado]);

  return {
    buses: filtrados,
    recargar: cargar,
    cargando,
    error,
    filtros: {
      filtroPPU,
      setFiltroPPU,
      filtroNumero,
      setFiltroNumero,
      filtroEstado,
      setFiltroEstado
    }
  };
};
