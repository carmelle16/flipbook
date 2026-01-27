import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Eye, Undo, Redo, 
  MousePointer2, Square, Video, Music, Link as LinkIcon, 
  Code, Sparkles, Loader2, Trash2, Settings,
  ChevronLeft, ChevronRight, Wand2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Sélectionner' },
  { id: 'button', icon: Square, label: 'Bouton' },
  { id: 'video', icon: Video, label: 'Vidéo' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'link', icon: LinkIcon, label: 'Lien' },
  { id: 'iframe', icon: Code, label: 'iFrame' },
];

export default function Studio() {
  const { id } = useParams();
  const location = useLocation();
  const flipbookId = id || new URLSearchParams(location.search).get('id');
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [overlays, setOverlays] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isGeneratingTOC, setIsGeneratingTOC] = useState(false);
  const [flipbookData, setFlipbookData] = useState(null);

  const { data: flipbook, isLoading } = useQuery({
    queryKey: ['flipbook', flipbookId],
    queryFn: () => base44.entities.Flipbook.get(flipbookId),
    enabled: !!flipbookId,
  });

  useEffect(() => {
    if (flipbook?.overlays) {
      setOverlays(flipbook.overlays);
    }
    // Debug logging
    if (flipbook) {
      console.log('📘 Flipbook loaded:', {
        id: flipbook.id,
        title: flipbook.title,
        pageCount: flipbook.page_count,
        pageImagesCount: flipbook.page_images?.length || 0,
        hasPageImages: !!flipbook.page_images?.length,
      });
    }
  }, [flipbook]);

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Flipbook.update(flipbookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbook', flipbookId] });
      setIsDirty(false);
      toast.success('Modifications enregistrées');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ overlays });
  };

  const handleCanvasClick = (e) => {
    if (selectedTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newOverlay = {
      id: `overlay-${Date.now()}`,
      page: currentPage,
      type: selectedTool === 'link' ? 'button' : selectedTool,
      x: Math.max(0, Math.min(x - 5, 90)),
      y: Math.max(0, Math.min(y - 2.5, 95)),
      width: 10,
      height: 5,
      config: getDefaultConfig(selectedTool),
    };

    setOverlays([...overlays, newOverlay]);
    setSelectedOverlay(newOverlay);
    setSelectedTool('select');
    setIsDirty(true);
  };

  const getDefaultConfig = (type) => {
    switch (type) {
      case 'button':
      case 'link':
        return { label: 'Cliquez ici', url: '', bgColor: '#06b6d4', gradient: true, bgColorEnd: '#8b5cf6' };
      case 'video':
        return { videoUrl: '', thumbnail: '' };
      case 'audio':
        return { title: 'Audio', audioUrl: '' };
      case 'iframe':
        return { url: '' };
      default:
        return {};
    }
  };

  const updateOverlay = (id, updates) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
    if (selectedOverlay?.id === id) {
      setSelectedOverlay({ ...selectedOverlay, ...updates });
    }
    setIsDirty(true);
  };

  const deleteOverlay = (id) => {
    setOverlays(overlays.filter(o => o.id !== id));
    setSelectedOverlay(null);
    setIsDirty(true);
  };

  const generateTOC = async () => {
    setIsGeneratingTOC(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un sommaire fictif mais réaliste pour un document PDF de ${flipbook?.page_count || 10} pages intitulé "${flipbook?.title}".
        Le sommaire doit avoir entre 3 et 6 entrées avec des titres pertinents.
        Réponds en JSON avec le format: [{"title": "Titre du chapitre", "page": 1}, ...]`,
        response_json_schema: {
          type: "object",
          properties: {
            chapters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  page: { type: "number" }
                }
              }
            }
          }
        }
      });

      await base44.entities.Flipbook.update(flipbookId, { 
        toc: result.chapters || result 
      });
      queryClient.invalidateQueries({ queryKey: ['flipbook', flipbookId] });
      toast.success('Sommaire généré avec succès');
    } catch (error) {
      toast.error('Erreur lors de la génération');
    } finally {
      setIsGeneratingTOC(false);
    }
  };

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

  // Generate demo pages if none exist
  const pages = useMemo(() => {
    if (flipbook?.page_images?.length > 0) {
      return flipbook.page_images;
    }
    return generatePlaceholderPages(flipbook?.page_count || 10);
  }, [flipbook?.page_images, flipbook?.page_count]);

  const currentOverlays = overlays.filter(o => o.page === currentPage);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white">{flipbook?.title}</h1>
            <p className="text-xs text-slate-500">Studio d'édition</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-500" disabled>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-500" disabled>
            <Redo className="w-4 h-4" />
          </Button>
          
          <div className="w-px h-6 bg-slate-700 mx-2" />
          
          <Link to={createPageUrl('FlipbookViewer', { id: flipbookId })}>
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
          </Link>
          
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-violet-500"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-2">
          {TOOLS.map((tool) => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTool(tool.id)}
              className={`w-12 h-12 ${
                selectedTool === tool.id 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
              title={tool.label}
            >
              <tool.icon className="w-5 h-5" />
            </Button>
          ))}
          
          <div className="w-8 h-px bg-slate-700 my-2" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={generateTOC}
            disabled={isGeneratingTOC}
            className="w-12 h-12 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
            title="Générer sommaire IA"
          >
            {isGeneratingTOC ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
          </Button>
        </aside>

        {/* Main Canvas */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Page Navigation */}
          <div className="flex items-center justify-center gap-4 py-3 bg-slate-900/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="text-slate-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm text-slate-400">
              Page {currentPage + 1} / {pages.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
              disabled={currentPage === pages.length - 1}
              className="text-slate-400"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-slate-900">
            {pages && pages.length > 0 && pages[currentPage] ? (
              <div 
                className="relative bg-white rounded-lg shadow-2xl shadow-black/50 cursor-crosshair w-full h-full"
                style={{
                  maxWidth: 'min(90vw, 80vh * var(--aspect-ratio, 0.75))',
                  maxHeight: '80vh',
                  aspectRatio: `var(--aspect-ratio, 0.75)`,
                  '--aspect-ratio': flipbook?.aspect_ratio || 0.75,
                }}
                onClick={handleCanvasClick}
              >
                <img
                  src={pages[currentPage]}
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                  draggable={false}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="800"%3E%3Crect fill="%23f5f5f5" width="600" height="800"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="20"%3EPage ' + (currentPage + 1) + '%3C/text%3E%3C/svg%3E';
                  }}
                />
                {currentOverlays.map((overlay) => (
                  <div
                    key={overlay.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlay(overlay);
                    }}
                    className={`absolute cursor-pointer transition-all ${
                      selectedOverlay?.id === overlay.id 
                        ? 'ring-2 ring-cyan-500 ring-offset-2' 
                        : 'hover:ring-2 hover:ring-white/50'
                    }`}
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      width: `${overlay.width}%`,
                      height: `${overlay.height}%`,
                    }}
                  >
                    <div className={`w-full h-full rounded flex items-center justify-center text-xs text-white ${
                      overlay.type === 'button' ? 'bg-gradient-to-r from-cyan-500 to-violet-500' :
                      overlay.type === 'video' ? 'bg-red-500/80' :
                      overlay.type === 'audio' ? 'bg-violet-500/80' :
                      'bg-slate-500/80'
                    }`}>
                      {overlay.type === 'button' && overlay.config?.label}
                      {overlay.type === 'video' && <Video className="w-4 h-4" />}
                      {overlay.type === 'audio' && <Music className="w-4 h-4" />}
                      {overlay.type === 'iframe' && <Code className="w-4 h-4" />}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-[70vh] flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Aucune page chargée</p>
                  <p className="text-sm">Importez un PDF pour commencer</p>
                </div>
              </div>
            )}
          </div>

          {/* Page Thumbnails */}
          <div className="h-24 bg-slate-900 border-t border-slate-800 flex items-center px-4 gap-2 overflow-x-auto">
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`flex-shrink-0 h-16 w-12 rounded overflow-hidden transition-all ${
                  currentPage === index 
                    ? 'ring-2 ring-cyan-500' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img src={page} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-72 bg-slate-900 border-l border-slate-800 flex flex-col">
          <Tabs defaultValue="properties" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none bg-slate-800/50 p-1">
              <TabsTrigger value="properties" className="flex-1 text-xs">Propriétés</TabsTrigger>
              <TabsTrigger value="layers" className="flex-1 text-xs">Calques</TabsTrigger>
            </TabsList>

            <TabsContent value="properties" className="flex-1 p-4 overflow-auto">
              {selectedOverlay ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white capitalize">
                      {selectedOverlay.type}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteOverlay(selectedOverlay.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Position */}
                  <div className="space-y-3">
                    <Label className="text-slate-400 text-xs">Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">X (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedOverlay.x)}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { x: Number(e.target.value) })}
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Y (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedOverlay.y)}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { y: Number(e.target.value) })}
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Size */}
                  <div className="space-y-3">
                    <Label className="text-slate-400 text-xs">Taille</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-500">Largeur (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedOverlay.width)}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { width: Number(e.target.value) })}
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Hauteur (%)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedOverlay.height)}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { height: Number(e.target.value) })}
                          className="bg-slate-800 border-slate-700 text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Type-specific config */}
                  {selectedOverlay.type === 'button' && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-slate-400 text-xs">Texte du bouton</Label>
                        <Input
                          value={selectedOverlay.config?.label || ''}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { 
                            config: { ...selectedOverlay.config, label: e.target.value }
                          })}
                          className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">URL</Label>
                        <Input
                          value={selectedOverlay.config?.url || ''}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { 
                            config: { ...selectedOverlay.config, url: e.target.value }
                          })}
                          placeholder="https://..."
                          className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {selectedOverlay.type === 'video' && (
                    <div>
                      <Label className="text-slate-400 text-xs">URL de la vidéo</Label>
                      <Input
                        value={selectedOverlay.config?.videoUrl || ''}
                        onChange={(e) => updateOverlay(selectedOverlay.id, { 
                          config: { ...selectedOverlay.config, videoUrl: e.target.value }
                        })}
                        placeholder="YouTube, Vimeo ou MP4"
                        className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                      />
                    </div>
                  )}

                  {selectedOverlay.type === 'audio' && (
                    <>
                      <div>
                        <Label className="text-slate-400 text-xs">Titre</Label>
                        <Input
                          value={selectedOverlay.config?.title || ''}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { 
                            config: { ...selectedOverlay.config, title: e.target.value }
                          })}
                          className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-400 text-xs">URL Audio (MP3)</Label>
                        <Input
                          value={selectedOverlay.config?.audioUrl || ''}
                          onChange={(e) => updateOverlay(selectedOverlay.id, { 
                            config: { ...selectedOverlay.config, audioUrl: e.target.value }
                          })}
                          className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                        />
                      </div>
                    </>
                  )}

                  {selectedOverlay.type === 'iframe' && (
                    <div>
                      <Label className="text-slate-400 text-xs">URL de l'iFrame</Label>
                      <Input
                        value={selectedOverlay.config?.url || ''}
                        onChange={(e) => updateOverlay(selectedOverlay.id, { 
                          config: { ...selectedOverlay.config, url: e.target.value }
                        })}
                        placeholder="https://..."
                        className="bg-slate-800 border-slate-700 text-white text-sm mt-1"
                      />
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="text-slate-500">
                    <MousePointer2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sélectionnez un élément<br />ou ajoutez-en un nouveau</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="layers" className="flex-1 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  {currentOverlays.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      Aucun élément sur cette page
                    </div>
                  ) : (
                    currentOverlays.map((overlay, index) => (
                      <button
                        key={overlay.id}
                        onClick={() => setSelectedOverlay(overlay)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          selectedOverlay?.id === overlay.id 
                            ? 'bg-cyan-500/20 text-cyan-400' 
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {overlay.type === 'button' && <Square className="w-4 h-4" />}
                        {overlay.type === 'video' && <Video className="w-4 h-4" />}
                        {overlay.type === 'audio' && <Music className="w-4 h-4" />}
                        {overlay.type === 'iframe' && <Code className="w-4 h-4" />}
                        <span className="text-sm truncate capitalize">
                          {overlay.type} {index + 1}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}