'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Bus } from '@/types';
import { NOMBRE_DOCUMENTO, TIPOS_DOCUMENTO, TipoDocumento } from '@/utils/constants';

interface PrintPageProps {
  params: { ppu: string };
  searchParams: { modo?: string; tipos?: string };
}

type RegistroDocumento = {
  tipo_documento: TipoDocumento;
  estado: 'TIENE' | 'NO_TIENE' | 'DANADO';
  updated_at: string;
};

export default function PrintPage({ params, searchParams }: PrintPageProps) {
  const [bus, setBus] = useState<Bus | null>(null);
  const [documentos, setDocumentos] = useState<RegistroDocumento[]>([]);
  const [listoParaImprimir, setListoParaImprimir] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [impreso, setImpreso] = useState(false);

  const supabase = useMemo(() => getSupabaseClient(), []);

  const modo = searchParams.modo === 'todo' ? 'todo' : 'faltantes';
  const tiposQuery = searchParams.tipos?.split(',').filter(Boolean) as TipoDocumento[] | undefined;

  useEffect(() => {
    const cargar = async () => {
      const { data: busData, error: busError } = await supabase.from('buses').select('*').eq('ppu', params.ppu).maybeSingle();
      if (busError || !busData) {
        setError('No encontramos la información del bus.');
        return;
      }
      setBus(busData as Bus);
      const { data: docs, error: docsError } = await supabase
        .from('documentos_bus')
        .select('tipo_documento, estado, updated_at')
        .eq('bus_id', busData.id);
      if (docsError) {
        setError('No se pudo traer el estado documental.');
        return;
      }
      const registros = TIPOS_DOCUMENTO.map((tipo) => {
        const encontrado = docs?.find((doc) => doc.tipo_documento === tipo);
        return {
          tipo_documento: tipo,
          estado: (encontrado?.estado ?? 'NO_TIENE') as RegistroDocumento['estado'],
          updated_at: encontrado?.updated_at ?? new Date().toISOString()
        };
      });
      setDocumentos(registros);
      setListoParaImprimir(true);
    };

    cargar();
  }, [params.ppu, supabase]);

  useEffect(() => {
    if (!listoParaImprimir || !bus || impreso) return;
    setTimeout(async () => {
      window.print();
      setImpreso(true);
      if (modo === 'todo') {
        await supabase
          .from('documentos_bus')
          .update({ estado: 'TIENE', updated_at: new Date().toISOString() })
          .eq('bus_id', bus.id)
          .in('estado', ['NO_TIENE', 'DANADO']);
      }
    }, 500);
  }, [bus, listoParaImprimir, modo, supabase, impreso]);

  const documentosAMostrar = useMemo(() => {
    if (modo === 'todo') return documentos;
    if (tiposQuery && tiposQuery.length > 0) {
      return documentos.filter((doc) => tiposQuery.includes(doc.tipo_documento));
    }
    return documentos.filter((doc) => doc.estado !== 'TIENE');
  }, [documentos, modo, tiposQuery]);

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }

  if (!bus) {
    return <p className="p-8 text-center text-slate-500">Preparando impresión...</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-6 print:p-0">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Informe documental</h1>
        <p className="text-slate-600">PPU: {bus.ppu} · N° interno: {bus.numero_interno}</p>
        <p className="text-sm text-slate-500">Generado el {new Date().toLocaleString()}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
          {modo === 'todo' ? 'Resumen completo' : 'Documentos faltantes o dañados'}
        </p>
      </header>
      <section>
        <table className="min-w-full border border-slate-200 text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="border-b border-slate-200 px-4 py-2 text-left">Documento</th>
              <th className="border-b border-slate-200 px-4 py-2 text-left">Estado</th>
              <th className="border-b border-slate-200 px-4 py-2 text-left">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {documentosAMostrar.map((doc) => (
              <tr key={doc.tipo_documento} className="border-b border-slate-100">
                <td className="px-4 py-2 font-semibold">{NOMBRE_DOCUMENTO[doc.tipo_documento]}</td>
                <td className="px-4 py-2 capitalize">{doc.estado.replace('_', ' ').toLowerCase()}</td>
                <td className="px-4 py-2 text-xs text-slate-600">{new Date(doc.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <footer className="text-xs text-slate-500">Se imprime automáticamente y se deja registro en Supabase.</footer>
    </div>
  );
}
