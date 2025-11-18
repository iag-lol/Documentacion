'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Bus, DocumentoArchivo } from '@/types';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ESTADO_COLOR, EstadoDocumento, NOMBRE_DOCUMENTO, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';

interface DocumentPrintGridProps {
  bus: Bus | null;
  estados: Record<TipoDocumento, EstadoDocumento> | null;
}

const coloresBorde: Record<EstadoDocumento, string> = {
  TIENE: 'border-green-200',
  NO_TIENE: 'border-red-200',
  DANADO: 'border-amber-200'
};

const crearMapaVacio = (): Record<TipoDocumento, DocumentoArchivo | null> =>
  TIPOS_DOCUMENTO.reduce((acc, tipo) => {
    acc[tipo] = null;
    return acc;
  }, {} as Record<TipoDocumento, DocumentoArchivo | null>);

export const DocumentPrintGrid = ({ bus, estados }: DocumentPrintGridProps) => {
  const [archivosPorTipo, setArchivosPorTipo] = useState<Record<TipoDocumento, DocumentoArchivo | null>>(crearMapaVacio());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const cargarArchivos = useCallback(async () => {
    if (!bus) {
      setArchivosPorTipo(crearMapaVacio());
      return;
    }
    setCargando(true);
    setError(null);
    const { data, error: supaError } = await supabase
      .from('documentos_archivos')
      .select('*')
      .eq('bus_id', bus.id)
      .order('uploaded_at', { ascending: false });
    if (supaError) {
      setError('No pudimos cargar los archivos digitales.');
      setCargando(false);
      return;
    }
    const agrupados = TIPOS_DOCUMENTO.reduce<Record<TipoDocumento, DocumentoArchivo | null>>((acc, tipo) => {
      const registro =
        data?.find((doc) => doc.tipo_documento === tipo && doc.activo) ??
        data?.find((doc) => doc.tipo_documento === tipo);
      acc[tipo] = (registro ?? null) as DocumentoArchivo | null;
      return acc;
    }, crearMapaVacio());
    setArchivosPorTipo(agrupados);
    setCargando(false);
  }, [bus, supabase]);

  useEffect(() => {
    cargarArchivos();
  }, [cargarArchivos]);

  const handleImprimir = (tipo: TipoDocumento) => {
    if (!bus) return;
    const archivo = archivosPorTipo[tipo];
    if (archivo) {
      window.open(`/print/file/${archivo.id}`, '_blank');
      return;
    }
    const params = new URLSearchParams({ modo: 'faltantes', tipos: tipo });
    window.open(`/print/${bus.ppu}?${params.toString()}`, '_blank');
  };

  const estadosLocales = estados ?? null;

  if (!bus) {
    return <p className="text-sm text-slate-500">Selecciona un bus para habilitar la impresión por documento.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-semibold">Documentos digitales</h3>
        <p className="text-sm text-slate-500">Imprime cada documento directamente desde el bucket.</p>
        <button
          type="button"
          onClick={cargarArchivos}
          className="ml-auto rounded-md border border-slate-300 px-3 py-1 text-sm"
        >
          Actualizar lista
        </button>
      </div>
      {cargando && <p className="text-sm text-slate-500">Cargando archivos...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TIPOS_DOCUMENTO.map((tipo) => {
          const estadoActual = estadosLocales ? estadosLocales[tipo] : ('NO_TIENE' as EstadoDocumento);
          const archivo = archivosPorTipo[tipo];
          return (
            <article
              key={tipo}
              className={`flex h-full flex-col justify-between rounded-xl border bg-white p-4 shadow-sm transition ${coloresBorde[estadoActual]}`}
            >
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500">{tipo.replace('_', ' ')}</p>
                <h4 className="text-xl font-semibold">{NOMBRE_DOCUMENTO[tipo]}</h4>
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${ESTADO_COLOR[estadoActual]}`}>
                  {estadoActual.replace('_', ' ')}
                </span>
                {archivo ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Última carga: {new Date(archivo.uploaded_at).toLocaleString()} · {archivo.mime_type}
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-amber-600">No hay archivo activo. Se imprimirá la hoja resumen.</p>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleImprimir(tipo)}
                  className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {archivo ? 'Imprimir archivo' : 'Imprimir resumen'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
