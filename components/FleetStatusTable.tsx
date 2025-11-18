'use client';

import { useFleetStatus } from '@/hooks/useFleetStatus';
import { ESTADO_COLOR, NOMBRE_DOCUMENTO, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';
import { clsx } from 'clsx';

interface FleetStatusTableProps {
  onSeleccionarBus: (ppu: string) => void;
}

const Badge = ({ tipo, estado }: { tipo: TipoDocumento; estado: keyof typeof ESTADO_COLOR }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize',
      ESTADO_COLOR[estado]
    )}
  >
    {NOMBRE_DOCUMENTO[tipo].split(' ')[0]}: {estado.replace('_', ' ')}
  </span>
);

export const FleetStatusTable = ({ onSeleccionarBus }: FleetStatusTableProps) => {
  const {
    buses,
    recargar,
    cargando,
    error,
    filtros: { filtroPPU, setFiltroPPU, filtroNumero, setFiltroNumero, filtroEstado, setFiltroEstado }
  } = useFleetStatus();

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <input
            value={filtroPPU}
            onChange={(e) => setFiltroPPU(e.target.value)}
            placeholder="Filtrar por PPU"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={filtroNumero}
            onChange={(e) => setFiltroNumero(e.target.value)}
            placeholder="Filtrar por número interno"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="TIENE">Solo en regla</option>
            <option value="NO_TIENE">Solo sin documento</option>
            <option value="DANADO">Solo dañados</option>
          </select>
          <button
            type="button"
            onClick={() => recargar()}
            className="ml-auto rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            Recargar
          </button>
        </div>
      </div>
      {cargando && <p className="text-sm text-slate-500">Cargando estado de la flota...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">PPU</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Número interno</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Documentos</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {buses.map((bus) => (
              <tr key={bus.id}>
                <td className="px-4 py-3 font-semibold">{bus.ppu}</td>
                <td className="px-4 py-3">{bus.numero_interno}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_DOCUMENTO.map((tipo) => {
                      const registro = bus.documentos_bus.find((doc) => doc.tipo_documento === tipo);
                      const estado = registro?.estado ?? 'NO_TIENE';
                      return <Badge key={tipo} tipo={tipo} estado={estado} />;
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onSeleccionarBus(bus.ppu)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Revisar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {buses.length === 0 && !cargando && (
          <p className="px-4 py-6 text-center text-sm text-slate-500">Sin resultados con los filtros actuales.</p>
        )}
      </div>
    </div>
  );
};
