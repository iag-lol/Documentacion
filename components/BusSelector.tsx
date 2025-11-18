'use client';

import { useEffect, useState } from 'react';
import type { Bus } from '@/types';
import { useBusSearch } from '@/hooks/useBusSearch';

interface BusSelectorProps {
  etiqueta?: string;
  onSelect: (bus: Bus | null) => void;
  selectedBus?: Bus | null;
  descripcion?: string;
}

export const BusSelector = ({ etiqueta = 'Bus', onSelect, selectedBus, descripcion }: BusSelectorProps) => {
  const { buscar, resultados, seleccionarBus, busSeleccionado, cargando, error } = useBusSearch();
  const [ppuInput, setPpuInput] = useState('');
  const [numeroInput, setNumeroInput] = useState('');

  useEffect(() => {
    if (selectedBus) {
      setPpuInput(selectedBus.ppu);
      setNumeroInput(selectedBus.numero_interno);
      seleccionarBus(selectedBus);
    }
  }, [selectedBus, seleccionarBus]);

  const mostrarResultados = resultados.length > 0;

  const handleSeleccion = (bus: Bus) => {
    seleccionarBus(bus);
    setPpuInput(bus.ppu);
    setNumeroInput(bus.numero_interno);
    onSelect(bus);
  };

  const limpiar = () => {
    setPpuInput('');
    setNumeroInput('');
    onSelect(null);
    seleccionarBus(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-slate-700">{etiqueta}</label>
          {descripcion && <p className="text-xs text-slate-500">{descripcion}</p>}
        </div>
        {busSeleccionado && (
          <button type="button" onClick={limpiar} className="text-sm text-slate-500 underline">
            Limpiar
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-slate-500">PPU</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
            placeholder="Ej: AB-CD-12"
            value={ppuInput}
            onChange={(e) => {
              setPpuInput(e.target.value.toUpperCase());
              buscar(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500">Número interno</label>
          <input
            type="text"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
            placeholder="Ej: 045"
            value={numeroInput}
            onChange={(e) => {
              setNumeroInput(e.target.value.toUpperCase());
              buscar(e.target.value);
            }}
          />
        </div>
      </div>
      {cargando && <p className="text-sm text-slate-500">Buscando buses...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mostrarResultados && (
        <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white shadow">
          {resultados.map((bus) => (
            <button
              key={bus.id}
              type="button"
              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-slate-50"
              onClick={() => handleSeleccion(bus)}
            >
              <span className="font-semibold">{bus.ppu}</span>
              <span className="text-slate-500">{bus.numero_interno}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
