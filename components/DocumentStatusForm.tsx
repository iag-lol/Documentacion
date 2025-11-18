'use client';

import { useEffect, useState } from 'react';
import { useDocumentStatus } from '@/hooks/useDocumentStatus';
import { ESTADO_COLOR, NOMBRE_DOCUMENTO, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';
import type { Bus } from '@/types';

interface DocumentStatusFormProps {
  bus: Bus | null;
  onImprimirFaltantes: (bus: Bus, tipos: TipoDocumento[]) => Promise<void>;
}

export const DocumentStatusForm = ({ bus, onImprimirFaltantes }: DocumentStatusFormProps) => {
  const { estados, actualizarEstado, guardarEstados, documentosCriticos, cargando, guardando, mensaje, error } =
    useDocumentStatus(bus?.id ?? null);
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    setObservacion('');
  }, [bus?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await guardarEstados(observacion);
    if (bus && documentosCriticos.length > 0) {
      await onImprimirFaltantes(bus, documentosCriticos);
    }
  };

  if (!bus) {
    return <p className="text-sm text-slate-600">Selecciona un bus para revisar su documentación.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {cargando ? (
        <p className="text-sm text-slate-500">Cargando estados actuales...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {TIPOS_DOCUMENTO.map((tipo) => {
            const estado = estados[tipo];
            return (
              <div key={tipo} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{NOMBRE_DOCUMENTO[tipo]}</p>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${ESTADO_COLOR[estado]}`}>
                    {estado.replace('_', ' ')}
                  </span>
                </div>
                <select
                  className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={estado}
                  onChange={(e) => actualizarEstado(tipo, e.target.value as typeof estado)}
                >
                  <option value="TIENE">Tiene</option>
                  <option value="NO_TIENE">No tiene</option>
                  <option value="DANADO">Dañado</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-2">
        <label htmlFor="observacion" className="text-sm font-medium text-slate-700">
          Observaciones
        </label>
        <textarea
          id="observacion"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          rows={3}
          placeholder="Comentarios relevantes"
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar revisión'}
        </button>
        {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {documentosCriticos.length > 0 && !guardando && (
          <p className="text-xs text-amber-600">
            Se generará impresión para {documentosCriticos.length} documento(s) observado(s).
          </p>
        )}
      </div>
    </form>
  );
};
