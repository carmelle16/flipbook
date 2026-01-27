import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Edit3, Trash2, MoreVertical, Share2, Globe, Lock, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function FlipbookCard({ flipbook, onDelete, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      <Card className="group relative overflow-hidden bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10">
        {/* Cover Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          {flipbook.cover_image ? (
            <img
              src={flipbook.cover_image}
              alt={flipbook.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-16 h-16 text-slate-700" />
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Quick Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Link to={createPageUrl('FlipbookViewer', { id: flipbook.id })}>
              <Button size="sm" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-0">
                <Eye className="w-4 h-4 mr-2" />
                Voir
              </Button>
            </Link>
            <Link to={createPageUrl('Studio', { id: flipbook.id })}>
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0">
                <Edit3 className="w-4 h-4 mr-2" />
                Éditer
              </Button>
            </Link>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              variant="secondary" 
              className={`${flipbook.is_public ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'} border backdrop-blur-sm`}
            >
              {flipbook.is_public ? (
                <>
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 mr-1" />
                  Privé
                </>
              )}
            </Badge>
          </div>

          {/* Menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-8 h-8 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/80 text-slate-300"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => onDelete(flipbook.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-white truncate mb-1 group-hover:text-cyan-400 transition-colors">
            {flipbook.title}
          </h3>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{flipbook.page_count || 0} pages</span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {flipbook.views || 0}
            </span>
          </div>
          {flipbook.created_date && (
            <p className="text-xs text-slate-600 mt-2">
              {format(new Date(flipbook.created_date), 'dd MMM yyyy', { locale: fr })}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}