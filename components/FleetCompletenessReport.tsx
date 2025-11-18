'use client';

import { useCompletenessReport } from '@/hooks/useCompletenessReport';
import { NOMBRE_DOCUMENTO } from '@/utils/constants';

interface FleetCompletenessReportProps {
  onIrARevision: (ppu: string) => void;
  onIrADocumentos: (ppu: string) => void;
}

export const FleetCompletenessReport = ({ onIrARevision, onIrADocumentos }: FleetCompletenessReportProps) => {
  const { detalles, resumen, soloIncompletos, setSoloIncompletos, cargando, error, recargar } =
    useCompletenessReport();

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total buses</p>
          <p className="text-2xl font-semibold">{resumen.total}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
          <p className="text-xs text-green-700">Completos</p>
          <p className="text-2xl font-semibold text-green-900">{resumen.completos}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-700">Incompletos</p>
          <p className="text-2xl font-semibold text-amber-900">{resumen.incompletos}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={soloIncompletos}
            onChange={(e) => setSoloIncompletos(e.target.checked)}
            className="h-4 w-4"
          />
          Mostrar solo incompletos
        </label>
        <button
          type="button"
          onClick={() => recargar()}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm"
        >
          Actualizar datos
        </button>
      </div>
      {cargando && <p className="text-sm text-slate-500">Calculando informe ...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">PPU</th>
              <th className="px-4 py-3">Número interno</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Faltantes</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {detalles.map(({ bus, completo, faltantes }) => (
              <tr key={bus.id}>
                <td className="px-4 py-3 font-semibold">{bus.ppu}</td>
                <td className="px-4 py-3">{bus.numero_interno}</td>
                <td className="px-4 py-3">
                  {completo ? (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Completo
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      Incompleto
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {faltantes.length === 0 ? (
                    <span className="text-xs text-slate-500">—</span>
                  ) : (
                    <ul className="list-disc pl-5 text-xs text-slate-600">
                      {faltantes.map((faltante, index) => (
                        <li key={`${faltante.tipo_documento}-${index}`}>
                          {NOMBRE_DOCUMENTO[faltante.tipo_documento]} ({
                            faltante.motivo === 'ESTADO' ? 'estado' : 'archivo'
                          })
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onIrARevision(bus.ppu)}
                      className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Revisar
                    </button>
                    <button
                      type="button"
                      onClick={() => onIrADocumentos(bus.ppu)}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold"
                    >
                      Subir archivos
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {detalles.length === 0 && !cargando && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">Aún no hay buses registrados.</p>
        )}
      </div>
    </section>
  );
};
