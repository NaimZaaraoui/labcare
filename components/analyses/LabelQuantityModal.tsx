'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tags } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (count: number) => void;
  defaultCount?: number;
}

export function LabelQuantityModal({ open, onOpenChange, onConfirm, defaultCount = 3 }: Props) {
  const [count, setCount] = useState(defaultCount);

  const handleConfirm = () => {
    onConfirm(count);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-[32px] p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white">
        <DialogHeader>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4 mx-auto">
            <Tags size={28} />
          </div>
          <DialogTitle className="text-center text-2xl font-black text-slate-900 tracking-tight">
            Impression Étiquettes
          </DialogTitle>
          <p className="text-center text-slate-500 text-sm mt-1">
            Combien d'étiquettes de tubes souhaitez-vous imprimer pour ce patient ?
          </p>
        </DialogHeader>

        <div className="py-8">
          <div className="space-y-3">
            <Label htmlFor="quantity" className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Nombre d'étiquettes
            </Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-center text-xl font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirm();
              }}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-14 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200"
          >
            Imprimer {count} {count > 1 ? 'étiquettes' : 'étiquette'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
