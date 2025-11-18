'use client';

import { useCallback, useMemo, useState } from 'react';
import { BusSelector } from '@/components/BusSelector';
import { DocumentStatusForm } from '@/components/DocumentStatusForm';
import { FleetStatusTable } from '@/components/FleetStatusTable';
import { FleetCompletenessReport } from '@/components/FleetCompletenessReport';
import { DocumentUpload } from '@/components/DocumentUpload';
import type { Bus } from '@/types';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { TipoDocumento } from '@/utils/constants';

const tabs = [
  { id: 'revision', label: 'Revisión' },
  { id: 'flota', label: 'Flota' },
  { id: 'documentos', label: 'Documentos' }
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function HomePage() {
  const [tabActiva, setTabActiva] = useState<TabId>('revision');
  const [busRevision, setBusRevision] = useState<Bus | null>(null);
  const [busDocumentos, setBusDocumentos] = useState<Bus | null>(null);
  const [alerta, setAlerta] = useState<string | null>(null);
  const supabase = useMemo(() => getSupabaseClient(), []);

  const buscarBusPorPPU = useCallback(
    async (ppu: string) => {
      const normalizado = ppu.trim().toUpperCase();
      const { data, error } = await supabase.from('buses').select('*').ilike('ppu', normalizado).maybeSingle();
      if (error || !data) {
        setAlerta('No encontramos el bus solicitado.');
        return null;
      }
      return data as Bus;
    },
    [supabase]
  );

  const irARevisionPorPPU = useCallback(
    async (ppu: string) => {
      const bus = await buscarBusPorPPU(ppu);
      if (bus) {
        setBusRevision(bus);
        setTabActiva('revision');
        setAlerta(null);
      }
    },
    [buscarBusPorPPU]
  );

  const irADocumentosPorPPU = useCallback(
    async (ppu: string) => {
      const bus = await buscarBusPorPPU(ppu);
      if (bus) {
        setBusDocumentos(bus);
        setTabActiva('documentos');
        setAlerta(null);
      }
    },
    [buscarBusPorPPU]
  );

  const handleImprimirTodo = () => {
    if (!busRevision) return;
    window.open(`/print/${busRevision.ppu}?modo=todo`, '_blank');
  };

  const handleImprimirFaltantes = (bus: Bus, tipos: TipoDocumento[]) => {
    const params = new URLSearchParams({ modo: 'faltantes', tipos: tipos.join(',') });
    window.open(`/print/${bus.ppu}?${params.toString()}`, '_blank');
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Documentación de buses</h1>
        <p className="text-slate-600">Control completo de estados documentales, archivos digitales e impresión.</p>
      </header>
      <nav className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActiva(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${tabActiva === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      {alerta && <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{alerta}</p>}
      {tabActiva === 'revision' && (
        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <BusSelector
              etiqueta="Seleccionar bus"
              descripcion="Busca por PPU o número interno para cargar el formulario"
              onSelect={(bus) => {
                setBusRevision(bus);
                setAlerta(null);
              }}
              selectedBus={busRevision}
            />
            {busRevision && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-slate-600">
                  Bus seleccionado: <span className="font-semibold">{busRevision.ppu}</span> ·{' '}
                  <span className="font-semibold">{busRevision.numero_interno}</span>
                </p>
                <button
                  type="button"
                  onClick={handleImprimirTodo}
                  className="rounded-md border border-slate-300 px-3 py-1 text-sm"
                >
                  Imprimir todo
                </button>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Formulario de revisión</h2>
            <DocumentStatusForm bus={busRevision} onImprimirFaltantes={handleImprimirFaltantes} />
          </div>
        </section>
      )}
      {tabActiva === 'flota' && (
        <section className="space-y-8">
          <FleetStatusTable onSeleccionarBus={irARevisionPorPPU} />
          <FleetCompletenessReport onIrARevision={irARevisionPorPPU} onIrADocumentos={irADocumentosPorPPU} />
        </section>
      )}
      {tabActiva === 'documentos' && (
        <section>
          <DocumentUpload busPreseleccionado={busDocumentos} />
        </section>
      )}
    </main>
  );
}
