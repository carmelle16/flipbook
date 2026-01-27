import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import PDFUploader from '@/components/upload/PDFUploader';
import { Link } from 'react-router-dom';

export default function CreateFlipbook() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [uploadData, setUploadData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: false,
  });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Flipbook.create(data),
    onSuccess: (result) => {
      const flipbookId = result?.id || Math.random().toString(36).substr(2, 9);
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
      queryClient.invalidateQueries({ queryKey: ['flipbook', flipbookId] });
      navigate(`/studio/${flipbookId}`);
    },
    onError: (error) => {
      console.error('Creation error:', error);
    },
  });

  const handleUploadComplete = (data) => {
    setUploadData(data);
    setFormData(prev => ({
      ...prev,
      title: data.title || prev.title,
    }));
    setStep(2);
  };

  const generateWithAI = async () => {
    if (!formData.title) return;
    
    setIsGeneratingAI(true);
    try {
      const prompt = `Génère une description SEO captivante pour un flipbook intitulé "${formData.title}". 
        La description doit faire environ 150 caractères et être engageante.
        Réponds uniquement avec la description, sans guillemets.`;
      
      const result = await base44.integrations.Core.InvokeLLM({ prompt });
      
      setFormData(prev => ({
        ...prev,
        description: typeof result === 'string' ? result : 'Description générée',
      }));
    } catch (error) {
      console.error('AI generation error:', error);
      // Fallback: generate a simple description
      setFormData(prev => ({
        ...prev,
        description: `Découvrez "${formData.title}" - Un flipbook interactif captivant`,
      }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = () => {
    const flipbookData = {
      ...formData,
      ...uploadData,
      overlays: [],
      toc: [],
    };
    createMutation.mutate(flipbookData);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Créer un nouveau flipbook
          </h1>
          <p className="text-slate-400">
            Importez votre PDF et personnalisez votre livre interactif
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-4 mb-12"
        >
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {s}
                </div>
                <span className={`hidden sm:block ${step >= s ? 'text-white' : 'text-slate-500'}`}>
                  {s === 1 ? 'Import PDF' : 'Informations'}
                </span>
              </div>
              {s < 2 && (
                <div className={`flex-1 h-0.5 ${step > 1 ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Step Content */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PDFUploader 
              onUploadComplete={handleUploadComplete}
              onError={(error) => console.error(error)}
            />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Preview */}
            {uploadData?.cover_image && (
              <div className="flex gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <div className="w-32 h-44 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  <img 
                    src={uploadData.cover_image} 
                    alt="Couverture"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 mb-1">Aperçu</p>
                  <p className="text-white font-medium">{uploadData.page_count} pages détectées</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Votre PDF a été importé avec succès. Complétez les informations ci-dessous.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">Titre du flipbook</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Mon super flipbook"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateWithAI}
                    disabled={!formData.title || isGeneratingAI}
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    Générer avec l'IA
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre flipbook..."
                  rows={4}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                <div>
                  <Label htmlFor="public" className="text-white">Rendre public</Label>
                  <p className="text-sm text-slate-500">Permettre à tout le monde de voir ce flipbook</p>
                </div>
                <Switch
                  id="public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Retour
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.title || createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Créer le flipbook
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}