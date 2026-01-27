import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Grid3X3, List, Filter, Sparkles, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import FlipbookCard from '../components/flipbook/FlipbookCard';

export default function Dashboard() {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: flipbooks = [], isLoading } = useQuery({
    queryKey: ['flipbooks'],
    queryFn: () => base44.entities.Flipbook.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Flipbook.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flipbooks'] });
    },
  });

  const filteredFlipbooks = flipbooks.filter(fb => {
    const matchesSearch = fb.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'public' && fb.is_public) ||
      (filterStatus === 'private' && !fb.is_public);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Vos <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Flipbooks</span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Transformez vos PDF en expériences interactives captivantes
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {[
              { label: 'Flipbooks', value: flipbooks.length, icon: BookOpen },
              { label: 'Pages totales', value: flipbooks.reduce((acc, fb) => acc + (fb.page_count || 0), 0), icon: Grid3X3 },
              { label: 'Vues', value: flipbooks.reduce((acc, fb) => acc + (fb.views || 0), 0), icon: Sparkles },
              { label: 'Publics', value: flipbooks.filter(fb => fb.is_public).length, icon: Filter },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <Input
              placeholder="Rechercher un flipbook..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900/50 border-slate-800 text-white placeholder:text-slate-500 focus:border-cyan-500"
            />
          </div>

          <div className="flex gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-slate-900/50 border-slate-800 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800">
                <SelectItem value="all" className="text-slate-300">Tous</SelectItem>
                <SelectItem value="public" className="text-slate-300">Publics</SelectItem>
                <SelectItem value="private" className="text-slate-300">Privés</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-slate-800 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={`rounded-none ${viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={`rounded-none ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}
              >
                <List className="w-5 h-5" />
              </Button>
            </div>

            <Link to={createPageUrl('CreateFlipbook')}>
              <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white shadow-lg shadow-cyan-500/25">
                <Plus className="w-5 h-5 mr-2" />
                Créer
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <Skeleton className="aspect-[3/4] bg-slate-800" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-slate-800" />
                  <Skeleton className="h-4 w-1/2 bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFlipbooks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucun flipbook'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery 
                ? 'Essayez avec d\'autres termes de recherche'
                : 'Créez votre premier flipbook interactif'
              }
            </p>
            {!searchQuery && (
              <Link to={createPageUrl('CreateFlipbook')}>
                <Button className="bg-gradient-to-r from-cyan-500 to-violet-500">
                  <Plus className="w-5 h-5 mr-2" />
                  Créer mon premier flipbook
                </Button>
              </Link>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {filteredFlipbooks.map((flipbook, index) => (
                <FlipbookCard
                  key={flipbook.id}
                  flipbook={flipbook}
                  index={index}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}