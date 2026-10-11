"use client";

import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Property = { id: string; user_id: string; name: string; address: string | null; monthly_rent: number; monthly_expenses: number; mortgage_payment: number; notes: string | null; status: string | null; };
type Doc = { id: string; property_id: string; doc_name: string; file_url: string; expiry_date: string; };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (session?.user?.id) fetchData(session.user.id);
  }, [session]);

  async function fetchData(userId: string) {
    const { data: props } = await supabase.from("properties").select("*").eq("user_id", userId);
    const { data: documents } = await supabase.from("property_documents").select("*").eq("user_id", userId);
    setProperties(props || []);
    setDocs(documents || []);
  }

  async function uploadDoc(propId: string, file: File, name: string, expiry: string) {
    if (!file || !name || !expiry) return alert("Please provide name, date, and file.");
    // Supabase bucket ID is usually lowercase with dashes
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from('property-docs').upload(fileName, file);
    if (uploadError) return alert(uploadError.message);
    
    const { data: { publicUrl } } = supabase.storage.from('property-docs').getPublicUrl(fileName);
    await supabase.from("property_documents").insert({ 
      property_id: propId, user_id: session?.user?.id, doc_name: name, file_url: publicUrl, expiry_date: expiry 
    });
    fetchData(session!.user.id);
  }

  // NOTE: You can paste your existing handleSubmit, handleDelete, and UI rendering 
  // from your previous working file below this line to keep your exact design.

  return (
    <main className="ph-page">
      <div className="ph-container">
        <h1>PortfolioHub</h1>
        {properties.map((p) => (
          <div key={p.id} className="ph-property-card" style={{border: '1px solid #ddd', padding: '15px', marginBottom: '10px'}}>
            <h3>{p.name}</h3>
            
            <div className="ph-docs-section" style={{marginTop: '10px', background: '#f9f9f9', padding: '10px'}}>
              <h4>Documents</h4>
              {docs.filter(d => d.property_id === p.id).map(d => (
                <div key={d.id}>
                  <a href={d.file_url} target="_blank" rel="noreferrer">{d.doc_name}</a> 
                  <span> (Expires: {d.expiry_date})</span>
                </div>
              ))}
              <div style={{marginTop: '10px'}}>
                <input type="text" id={`name-${p.id}`} placeholder="Doc Name (e.g. EPC)" />
                <input type="date" id={`date-${p.id}`} />
                <input type="file" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDoc(p.id, file, (document.getElementById(`name-${p.id}`) as HTMLInputElement).value, (document.getElementById(`date-${p.id}`) as HTMLInputElement).value);
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}