"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import { motion } from "framer-motion";
import { Camera, Trash2, Upload, CheckCircle2 } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  created_at: string;
  label: string;
}

export default function ProgressVault() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPhotos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("progress_photos")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setPhotos(data);
      setLoading(false);
    }
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // 1. Upload to Supabase Storage
      const fileName = `${session.user.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("progress-photos")
        .getPublicUrl(fileName);

      // 3. Save to Database
      const { error: dbError } = await supabase
        .from("progress_photos")
        .insert({
          user_id: session.user.id,
          url: publicUrl,
          label: "Progress Update",
        });

      if (dbError) throw dbError;
      
      // Refresh list
      const { data: updatedPhotos } = await supabase
        .from("progress_photos")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (updatedPhotos) setPhotos(updatedPhotos);
      alert("Photo added to the vault!");
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading Vault...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
      <header className="max-w-5xl mx-auto flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">
            Progress <span className="text-yellow-500">Vault</span>
          </h1>
          <p className="text-zinc-500">Evidence of the grind. Store your growth.</p>
        </div>
        
        <label className="flex items-center gap-2 px-6 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-all cursor-pointer">
          {uploading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5" />}
          {uploading ? "Uploading..." : "Add Photo"}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
        </label>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-zinc-900 rounded-3xl border border-zinc-800 border-dashed">
            <Camera className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">Your vault is empty. Start documenting your transformation.</p>
          </div>
        ) : (
          photos.map((photo) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={photo.id} 
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800"
            >
              <img src={photo.url} alt="Progress" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-xs font-medium text-zinc-300">
                  {new Date(photo.created_at).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
