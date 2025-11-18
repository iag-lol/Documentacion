'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { BusSelector } from '@/components/BusSelector';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Bus, DocumentoArchivo } from '@/types';
import { useDocumentAnalysis } from '@/hooks/useDocumentAnalysis';
import { NOMBRE_DOCUMENTO, STORAGE_BUCKET, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';

const DOCS_UNICOS: TipoDocumento[] = ['REVISION_TECNICA', 'REVISION_GASES'];

interface DocumentUploadProps {
  busPreseleccionado?: Bus | null;
}

export const DocumentUpload = ({ busPreseleccionado = null }: DocumentUploadProps) => {
  const [bus, setBus] = useState<Bus | null>(busPreseleccionado);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('PERMISO_DE_CIRCULACION');
  const [archivos, setArchivos] = useState<DocumentoArchivo[]>([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => getSupabaseClient(), []);
  const {
    analisis,
    cargando: cargandoAnalisis,
    error: errorAnalisis,
    recargar: recargarAnalisis
  } = useDocumentAnalysis(bus?.id ?? null, tipoDocumento);
  const analisisPorArchivo = useMemo(() => {
    return analisis.reduce<Record<string, typeof analisis>>((acc, registro) => {
      if (!acc[registro.documento_archivo_id]) {
        acc[registro.documento_archivo_id] = [];
      }
      acc[registro.documento_archivo_id].push(registro);
      return acc;
    }, {});
  }, [analisis]);

  const cargarArchivos = useCallback(
    async (busId: string, tipo: TipoDocumento) => {
      setCargandoArchivos(true);
      setError(null);
      const { data, error: supaError } = await supabase
        .from('documentos_archivos')
        .select('*')
        .eq('bus_id', busId)
        .eq('tipo_documento', tipo)
        .order('uploaded_at', { ascending: false });

      if (supaError) {
        setError('Error al traer los archivos.');
        setArchivos([]);
      } else {
        setArchivos(data ?? []);
      }
      setCargandoArchivos(false);
    },
    [supabase]
  );

  useEffect(() => {
    setBus(busPreseleccionado);
  }, [busPreseleccionado]);

  useEffect(() => {
    if (bus) {
      cargarArchivos(bus.id, tipoDocumento);
    } else {
      setArchivos([]);
    }
  }, [bus, tipoDocumento, cargarArchivos]);

  const manejarSubida = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bus) {
      setError('Debe seleccionar un bus.');
      return;
    }
    const input = event.currentTarget.elements.namedItem('archivo') as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) {
      setError('Debes escoger al menos un archivo.');
      return;
    }
    setSubiendo(true);
    setMensaje(null);
    setError(null);

    try {
      if (DOCS_UNICOS.includes(tipoDocumento)) {
        await supabase
          .from('documentos_archivos')
          .update({ activo: false })
          .eq('bus_id', bus.id)
          .eq('tipo_documento', tipoDocumento);
      }

      for (const archivo of Array.from(input.files)) {
        const ruta = `buses/${bus.ppu}/${tipoDocumento}/${Date.now()}-${archivo.name}`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(ruta, archivo, {
            cacheControl: '3600',
            upsert: false,
            contentType: archivo.type
          });
        if (uploadError) {
          throw uploadError;
        }

        const { error: insertError } = await supabase.from('documentos_archivos').insert({
          bus_id: bus.id,
          tipo_documento: tipoDocumento,
          storage_path: ruta,
          mime_type: archivo.type || 'application/octet-stream',
          activo: true
        });
        if (insertError) {
          throw insertError;
        }
      }

      setMensaje('Archivo(s) cargados correctamente.');
      await cargarArchivos(bus.id, tipoDocumento);
      await recargarAnalisis();
      input.value = '';
    } catch (e) {
      console.error(e);
      setError('No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const obtenerUrl = (storagePath: string) => {
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return (
    <section className="space-y-6">
      <BusSelector
        etiqueta="Bus para documentación"
        descripcion="Busca por PPU o número interno"
        onSelect={(busSeleccionado) => setBus(busSeleccionado)}
        selectedBus={bus}
      />
      <form onSubmit={manejarSubida} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Tipo de documento</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={tipoDocumento}
              onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
            >
              {TIPOS_DOCUMENTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {NOMBRE_DOCUMENTO[tipo]}
                </option>
              ))}
            </select>
            {DOCS_UNICOS.includes(tipoDocumento) ? (
              <p className="mt-1 text-xs text-slate-500">
                Solo se mantiene un archivo activo a la vez para este documento.
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Se permiten múltiples archivos activos.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Archivo</label>
            <input
              name="archivo"
              type="file"
              multiple={!DOCS_UNICOS.includes(tipoDocumento)}
              accept="application/pdf,image/*"
              className="mt-1 w-full rounded-md border border-dashed border-slate-300 px-3 py-2"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!bus || subiendo}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {subiendo ? 'Subiendo...' : 'Subir archivo'}
        </button>
        {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Archivos cargados</h3>
          {bus && (
            <p className="text-sm text-slate-500">
              {bus.ppu} · {NOMBRE_DOCUMENTO[tipoDocumento]}
            </p>
          )}
        </div>
        {cargandoArchivos ? (
          <p className="text-sm text-slate-500">Cargando archivos...</p>
        ) : archivos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay archivos registrados.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {archivos.map((archivo) => {
              const analisisArchivo = analisisPorArchivo[archivo.id]?.[0];
              return (
                <li key={archivo.id} className="space-y-3 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{archivo.storage_path.split('/').pop()}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(archivo.uploaded_at).toLocaleString()} · {archivo.mime_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {archivo.activo ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Vigente</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Histórico</span>
                      )}
                      <a
                        href={obtenerUrl(archivo.storage_path)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-slate-900 underline"
                      >
                        Descargar
                      </a>
                    </div>
                  </div>
                  {cargandoAnalisis ? (
                    <p className="text-xs text-slate-500">Consultando análisis automático...</p>
                  ) : analisisArchivo ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      <p className="font-semibold text-slate-700">
                        Último análisis: {new Date(analisisArchivo.analizado_en).toLocaleString()}
                      </p>
                      <p>Puntaje de confianza: {(analisisArchivo.puntaje_confianza ?? 0).toFixed(2)}</p>
                      {analisisArchivo.observaciones && (
                        <p className="mt-1 text-amber-700">{analisisArchivo.observaciones}</p>
                      )}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-slate-700">Ver resumen JSON</summary>
                        <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-[10px] text-slate-800">
                          {JSON.stringify(analisisArchivo.resumen, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Sin análisis automático aún. Ejecuta{' '}
                      <code>{`python analysis/run_analysis.py --ppu=${bus?.ppu ?? 'TU-PPU'}`}</code> y luego pulsa
                      “Actualizar”.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <button
            type="button"
            disabled={!bus}
            onClick={() => {
              if (!bus) return;
              cargarArchivos(bus.id, tipoDocumento);
              recargarAnalisis();
            }}
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700 disabled:opacity-50"
          >
            Actualizar
          </button>
          {errorAnalisis && <span className="text-red-600">{errorAnalisis}</span>}
        </div>
      </div>
    </section>
  );
};
