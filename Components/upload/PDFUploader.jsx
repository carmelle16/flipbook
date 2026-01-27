import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { base44 } from '@/api/base44Client';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

// Configure PDF.js worker - use the worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PDFUploader({ onUploadComplete, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      processFile(droppedFile);
    } else {
      setErrorMessage('Veuillez déposer un fichier PDF');
      setStatus('error');
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      processFile(selectedFile);
    } else {
      setErrorMessage('Veuillez sélectionner un fichier PDF');
      setStatus('error');
    }
  };

  const processFile = async (pdfFile) => {
    setFile(pdfFile);
    setStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    try {
      // Process PDF with PDF.js first
      setUploadProgress(10);
      setStatus('processing');

      // Load PDF with PDF.js
      const fileReader = new FileReader();
      const arrayBuffer = await new Promise((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(pdfFile);
      });

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;

      const firstPage = await pdf.getPage(1);
      const viewport = firstPage.getViewport({ scale: 1 });
      const aspectRatio = viewport.width / viewport.height;

      setUploadProgress(50);

      // Extract pages as images
      const pageImages = [];
      const scale = 2; // Higher quality
      
      for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const pageViewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = pageViewport.width;
        canvas.height = pageViewport.height;

        // Render PDF page to canvas
        await page.render({
          canvasContext: context,
          viewport: pageViewport,
        }).promise;

        // Convert canvas to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        pageImages.push(imageDataUrl);

        // Update progress
        setUploadProgress(50 + (pageNum / pageCount) * 40);
      }

      setUploadProgress(100);
      setStatus('success');
      
      // Create object URL for the PDF
      const pdfUrl = URL.createObjectURL(pdfFile);
      
      onUploadComplete?.({
        pdf_url: pdfUrl,
        page_images: pageImages,
        page_count: pageCount,
        cover_image: pageImages[0],
        title: pdfFile.name.replace('.pdf', ''),
        aspect_ratio: aspectRatio,
      });

    } catch (error) {
      console.error('PDF processing error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Erreur lors du traitement du PDF');
      onError?.(error);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragging 
                ? 'border-cyan-500 bg-cyan-500/10' 
                : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <motion.div
              animate={{ 
                scale: isDragging ? 1.1 : 1,
                y: isDragging ? -10 : 0
              }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? 'bg-cyan-500/20' : 'bg-slate-800'
              }`}>
                <Upload className={`w-10 h-10 ${isDragging ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragging ? 'Déposez votre PDF ici' : 'Glissez-déposez votre PDF'}
                </h3>
                <p className="text-slate-500">
                  ou <span className="text-cyan-400 hover:underline cursor-pointer">parcourez vos fichiers</span>
                </p>
              </div>
              
              <p className="text-sm text-slate-600">
                PDF uniquement • Max 50 Mo
              </p>
            </motion.div>
          </motion.div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border border-slate-700 rounded-2xl p-8 bg-slate-900/50"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center">
                <FileText className="w-7 h-7 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium truncate">{file?.name}</h4>
                <p className="text-sm text-slate-500">
                  {(file?.size / 1024 / 1024).toFixed(2)} Mo
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={reset} className="text-slate-500">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  {status === 'uploading' ? 'Téléchargement...' : 'Traitement du PDF...'}
                </span>
                <span className="text-cyan-400">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-800" />
            </div>

            {status === 'processing' && (
              <div className="flex items-center gap-2 mt-4 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Extraction des pages en cours...</span>
              </div>
            )}
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-emerald-500/30 rounded-2xl p-8 bg-emerald-500/10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">PDF importé avec succès !</h3>
            <p className="text-slate-400 mb-4">{file?.name}</p>
            <Button variant="outline" onClick={reset} className="border-slate-700 text-slate-300">
              Importer un autre PDF
            </Button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-red-500/30 rounded-2xl p-8 bg-red-500/10 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Erreur</h3>
            <p className="text-red-400 mb-4">{errorMessage}</p>
            <Button variant="outline" onClick={reset} className="border-slate-700 text-slate-300">
              Réessayer
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}