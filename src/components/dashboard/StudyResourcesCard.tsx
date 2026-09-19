// src/components/dashboard/StudyResourcesCard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, BookOpen } from 'lucide-react';

interface FileItem {
  name: string;
  id: string;
  signedUrl?: string;
}

export const StudyResourcesCard = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [open, setOpen] = useState(false);

  // Fetch file list from Supabase bucket "resources-accenture"
  useEffect(() => {
    const fetchFiles = async () => {
      const { data, error } = await supabase.storage.from('resources-accenture').list('');
      if (error) {
        console.error('Supabase list error', error);
        return;
      }
      const items = data.map((f) => ({ name: f.name, id: f.id }));
      setFiles(items);
    };
    fetchFiles();
  }, []);

  const openPreview = async (file: FileItem) => {
    const { data, error } = await supabase.storage
      .from('resources-accenture')
      .createSignedUrl(file.name, 60); // 60‑second URL – view‑only
    if (error) {
      console.error('Signed URL error', error);
      return;
    }
    setSelectedFile({ ...file, signedUrl: data?.signedUrl });
    setOpen(true);
  };

  return (
    <div className="relative rounded-2xl p-6 flex flex-col gap-5 bg-white border border-stone-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase" style={{ color: '#3b82f6' }}>
            RESOURCE
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.17)' }}>
            <BookOpen className="w-5 h-5" style={{ color: '#3b82f6' }} />
          </div>
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-[1.1rem] font-bold" style={{ color: '#1c1c1e', letterSpacing: '-0.015em' }}>
          Study Resources
        </h3>
        <p className="text-stone-500 text-[12.5px] leading-relaxed">
          Your curated collection of study materials – view only.
        </p>
        <ul className="mt-4 space-y-2">
          {files.map((file) => (
            <li key={file.id} className="flex items-center justify-between text-sm">
              <span className="text-stone-600 truncate max-w-xs">{file.name}</span>
              <button
                onClick={() => openPreview(file)}
                className="px-2 py-0.5 rounded-full text-[9px] font-semibold border bg-[#f0f9ff] border-[#3b82f6] text-[#3b82f6]"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedFile?.name}</DialogTitle>
            <DialogDescription>Preview – download disabled.</DialogDescription>
          </DialogHeader>
          {selectedFile?.signedUrl && (
            <div className="mt-4">
              <iframe src={selectedFile.signedUrl} className="w-full h-96" loading="lazy" />
            </div>
          )}
          <button onClick={() => setOpen(false)} className="absolute top-2 right-2 p-1">
            <X className="w-5 h-5" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
