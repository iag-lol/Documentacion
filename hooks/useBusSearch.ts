'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Bus } from '@/types';
import { getSupabaseClient } from '@/lib/supabaseClient';

interface UseBusSearchOptions {
  limit?: number;
}

const normalizar = (valor: string) => valor.trim().toUpperCase();

export const useBusSearch = ({ limit = 10 }: UseBusSearchOptions = {}) => {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<Bus[]>([]);
  const [busSeleccionado, setBusSeleccionado] = useState<Bus | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const buscar = useCallback(
    async (valor: string) => {
      setTermino(valor);
      if (!valor || valor.length < 2) {
        setResultados([]);
        return;
      }
      setCargando(true);
      setError(null);
      const normalizado = `%${normalizar(valor)}%`;
      const { data, error: supaError } = await supabase
        .from('buses')
        .select('*')
        .or(`ppu.ilike.${normalizado},numero_interno.ilike.${normalizado}`)
        .order('ppu')
        .limit(limit);

      if (supaError) {
        setError('No pudimos obtener los buses.');
        setResultados([]);
      } else {
        setResultados(data ?? []);
      }
      setCargando(false);
    },
    [limit, supabase]
  );

  const seleccionarBus = useCallback((bus: Bus | null) => {
    setBusSeleccionado(bus);
    if (bus) {
      setTermino(bus.ppu);
    }
  }, []);

  return {
    termino,
    resultados,
    busSeleccionado,
    buscar,
    seleccionarBus,
    cargando,
    error
  };
};
