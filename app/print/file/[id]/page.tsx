'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabaseClient';
import type { Bus, DocumentoArchivo } from '@/types';
import { NOMBRE_DOCUMENTO, STORAGE_BUCKET } from '@/utils/constants';

interface PrintFilePageProps {
  params: { id: string };
}

export default function PrintFilePage({ params }: PrintFilePageProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [documento, setDocumento] = useState<DocumentoArchivo | null>(null);
  const [bus, setBus] = useState<Bus | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      const { data, error: docError } = await supabase
        .from('documentos_archivos')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();
      if (docError || !data) {
        setError('No encontramos el archivo solicitado.');
        return;
      }
      const archivo = data as DocumentoArchivo;
      setDocumento(archivo);

      const { data: busData } = await supabase
        .from('buses')
        .select('id, ppu, numero_interno, activo, created_at')
        .eq('id', archivo.bus_id)
        .maybeSingle();
      if (busData) {
        setBus(busData as Bus);
      }

      const storage = supabase.storage.from(STORAGE_BUCKET);
      const { data: signedData, error: signedError } = await storage.createSignedUrl(
        archivo.storage_path,
        60 * 10
      );
      if (signedData?.signedUrl) {
        setFileUrl(signedData.signedUrl);
        return;
      }
      const { data: publicData } = storage.getPublicUrl(archivo.storage_path);
      if (publicData?.publicUrl) {
        setFileUrl(publicData.publicUrl);
      } else {
        setError('No pudimos preparar el archivo para impresión.');
      }
    };

    cargar();
  }, [params.id, supabase]);

  const handleLoaded = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (error) {
    return <p className="p-8 text-center text-red-600">{error}</p>;
  }

  if (!documento || !fileUrl) {
    return <p className="p-8 text-center text-slate-600">Preparando documento para impresión...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 bg-white p-4">
      <header className="text-center">
        <p className="text-xs uppercase tracking-wide text-slate-500">Documento digital</p>
        <h1 className="text-2xl font-semibold">
          {NOMBRE_DOCUMENTO[documento.tipo_documento]}
          {bus ? ` · ${bus.ppu}` : ''}
        </h1>
        {bus && <p className="text-sm text-slate-600">N° interno: {bus.numero_interno}</p>}
        <p className="text-xs text-slate-500">
          Subido el {new Date(documento.uploaded_at).toLocaleString()} · {documento.mime_type}
        </p>
      </header>
      <div className="h-[80vh] w-full overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src={fileUrl}
          title="Documento digital"
          className="h-full w-full"
          onLoad={handleLoaded}
        />
      </div>
      <p className="text-center text-xs text-slate-500">
        Una vez impreso, cierra esta pestaña y actualiza el estado en el formulario si corresponde.
      </p>
    </div>
  );
}
