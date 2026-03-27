'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, X, LogOut, Key, UserX, UserCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: 'logout' | 'reset' | 'deactivate' | 'activate' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  type = 'info',
  icon = 'warning'
}: ConfirmationModalProps) {
  const getIcon = () => {
    switch (icon) {
      case 'logout': return <LogOut className="w-6 h-6 text-rose-600" />;
      case 'reset': return <Key className="w-6 h-6 text-amber-600" />;
      case 'deactivate': return <UserX className="w-6 h-6 text-rose-600" />;
      case 'activate': return <UserCheck className="w-6 h-6 text-emerald-600" />;
      default: return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 text-white';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600 text-white';
      default: return 'bg-[var(--color-accent)] hover:brightness-95 text-white';
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return 'bg-rose-50';
      case 'warning': return 'bg-amber-50';
      default: return 'bg-indigo-50';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white p-6 text-left align-middle shadow-[0_18px_50px_rgba(15,31,51,0.18)] transition-all sm:p-7">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${getIconBg()} flex items-center justify-center`}>
                    {getIcon()}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 text-[var(--color-text-soft)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-xl sm:text-2xl font-semibold text-[var(--color-text)] leading-tight mb-2"
                >
                  {title}
                </Dialog.Title>
                
                <div className="mt-2">
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {message}
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex justify-center items-center h-11 px-5 text-sm font-medium rounded-2xl transition-all active:scale-[0.99] flex-1 ${getButtonClass()}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center items-center h-11 px-5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] hover:bg-slate-100 rounded-2xl border border-[var(--color-border)] transition-all active:scale-[0.99] flex-1"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
