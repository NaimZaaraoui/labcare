'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'default',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[480px] bg-white border border-slate-100 shadow-2xl rounded-3xl p-8"
        showCloseButton={false}
      >
        <DialogHeader className="mb-2">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              isDestructive 
                ? 'bg-rose-50' 
                : 'bg-indigo-50'
            }`}>
              {isDestructive ? (
                <Trash2 className={`w-6 h-6 ${isDestructive ? 'text-rose-600' : 'text-indigo-600'}`} />
              ) : (
                <AlertCircle className={`w-6 h-6 ${isDestructive ? 'text-rose-600' : 'text-indigo-600'}`} />
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-left">
                {title}
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-slate-600 font-medium pt-4 text-left leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-8 gap-3 sm:gap-3 flex-row justify-end pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl font-bold px-6 py-2.5 h-auto text-slate-700 hover:bg-slate-50 border-slate-200 transition-all active:scale-95"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={`rounded-xl font-bold px-6 py-2.5 h-auto transition-all active:scale-95 ${
              isDestructive 
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
            }`}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
