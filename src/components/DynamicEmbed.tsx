import React from 'react';
import { useLocation } from 'react-router-dom';

interface DynamicEmbedProps {
  baseUrl: string;
  prefix: string; 
}

const DynamicEmbed: React.FC<DynamicEmbedProps> = ({ baseUrl, prefix }) => {
  const location = useLocation();

  // Menghapus prefix dari URL web Anda untuk mendapatkan path asli web tujuan
  const iframePath = location.pathname.replace(prefix, "");
  
  // Menggabungkan IP tujuan, path halaman, beserta query string
  const targetUrl = `${baseUrl}${iframePath}${location.search}`;

  return (
    <div className="w-full h-full overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200/80">
      <iframe
        src={targetUrl}
        title="External App"
        className="w-full h-full border-none"
      />
    </div>
  );
};

export default DynamicEmbed;
