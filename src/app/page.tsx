"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

// Types
type Property = { id: string; name: string; user_id: string; monthly_rent: number; monthly_expenses: number; mortgage_payment: number; status: string | null; address: string | null; notes: string | null; };
type Doc = { id: string; property_id: string; doc_name: string; file_url: string; expiry_date: string; };

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_, session) => setSession(session));
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData(session.user.id);
    }
  }, [session]);

  async function fetchData(userId: string) {
    const { data: props } = await supabase.from("properties").select("*").eq("user_id", userId);
    const { data: documents } = await supabase.from("property_documents").select("*").eq("user_id", userId);
    setProperties(props || []);
    setDocs(documents || []);
  }

  async function uploadDoc(propId: string, e: React.ChangeEvent<HTMLInputElement>, name: string, expiry: string) {
    const file = e.target.files?.[0];
    if (!file || !expiry) return alert("Please select a file and expiry date");

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('property-docs').upload(fileName, file);
    if (uploadError) { alert(uploadError.message); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('property-docs').getPublicUrl(fileName);
    await supabase.from("property_documents").insert({
      property_id: propId, user_id: session?.user?.id, doc_name: name, file_url: publicUrl, expiry_date: expiry
    });

    setUploading(false);
    fetchData(session!.user.id);
  }

  return (
    <main className="ph-page">
      <div className="ph-container">
        <h1>PortfolioHub</h1>
        {properties.map((p) => (
          <div key={p.id} className="ph-property-card" style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
            <h3>{p.name}</h3>
            <h4>Documents</h4>
            {docs.filter(d => d.property_id === p.id).map(d => (
              <div key={d.id}>
                <a href={d.file_url} target="_blank">{d.doc_name}</a> (Expires: {d.expiry_date})
              </div>
            ))}
            <input type="text" id={`name-${p.id}`} placeholder="Doc Name" />
            <input type="date" id={`date-${p.id}`} />
            <input type="file" onChange={(e) => uploadDoc(p.id, e, (document.getElementById(`name-${p.id}`) as HTMLInputElement).value, (document.getElementById(`date-${p.id}`) as HTMLInputElement).value)} />
          </div>
        ))}
      </div>
    </main>
  );
}
