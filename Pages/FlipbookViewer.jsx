import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit3, Share2, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FlipbookViewer3D from '@/components/flipbook/FlipbookViewer3D';

export default function FlipbookViewer() {
  const { id: flipbookId } = useParams();

  const { data: flipbook, isLoading } = useQuery({
    queryKey: ['flipbook', flipbookId],
    queryFn: () => base44.entities.Flipbook.get(flipbookId),
    enabled: !!flipbookId,
  });

  // Increment views
  const viewMutation = useMutation({
    mutationFn: () => base44.entities.Flipbook.update(flipbookId, { 
      views: (flipbook?.views || 0) + 1 
    }),
  });

  useEffect(() => {
    if (flipbook && !viewMutation.isSuccess) {
      viewMutation.mutate();
    }
  }, [flipbook]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!flipbook) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-white mb-4">Flipbook non trouvé</h2>
          <Link to={createPageUrl('Dashboard')}>
            <Button>Retour au dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Generate demo pages if none exist
  const generatePlaceholderPages = (count) => {
    return Array.from({ length: count }, (_, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 600, 800);
      
      // Page number
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Page ${i + 1}`, 300, 400);
      
      // Border
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 560, 760);
      
      return canvas.toDataURL('image/png');
    });
  };

  const pages = flipbook?.page_images?.length > 0 
    ? flipbook.page_images 
    : generatePlaceholderPages(flipbook?.page_count || 10);

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Controls */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex-shrink-0"
      >
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">{flipbook.title}</h1>
            <p className="text-sm text-slate-500">{flipbook.page_count} pages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <MessageSquare className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Share2 className="w-5 h-5" />
          </Button>
          <Link to={createPageUrl('Studio', { id: flipbook.id })}>
            <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white">
              <Edit3 className="w-4 h-4 mr-2" />
              Éditer
            </Button>
          </Link>
        </div>
      </motion.header>

      {/* Flipbook 3D Viewer */}
      <div className="flex-1 overflow-hidden">
        <FlipbookViewer3D
          pages={pages}
          title={flipbook.title}
          overlays={flipbook.overlays || []}
          aspectRatio={flipbook.aspect_ratio}
        />
      </div>
    </div>
  );
}