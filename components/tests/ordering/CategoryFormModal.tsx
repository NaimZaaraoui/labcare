'use client';

import { createPortal } from 'react-dom';
import { Edit2, PlusCircle, Save, X } from 'lucide-react';
import { AVAILABLE_ICONS } from './ordering-helpers';
import type { Category } from './types';

interface Props {
  mounted: boolean;
  showCreateModal: boolean;
  showEditModal: boolean;
  editingCategory: Category | null;
  newCategoryName: string;
  newCategoryIcon: string;
  newCategoryParent: string;
  categories: Category[];
  onNameChange: (v: string) => void;
  onIconChange: (v: string) => void;
  onParentChange: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CategoryFormModal({
  mounted,
  showCreateModal,
  showEditModal,
  editingCategory,
  newCategoryName,
  newCategoryIcon,
  newCategoryParent,
  categories,
  onNameChange,
  onIconChange,
  onParentChange,
  onClose,
  onSubmit,
}: Props) {
  if (!mounted || (!showCreateModal && !showEditModal)) return null;

  return createPortal(
    <div className="modal-overlay z-[100] animate-in fade-in duration-200">
      <div
        className="modal-shell h-[90vh] w-full max-w-md space-y-6 overflow-y-auto p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              {showEditModal ? <Edit2 size={20} /> : <PlusCircle size={20} />}
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text)] tracking-tight">
              {showEditModal ? 'Modifier la Catégorie' : 'Nouvelle Catégorie'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Nom de la catégorie
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Sérologie, Biochimie..."
              className="input-premium h-11"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Icône
            </label>
            <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
              {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => onIconChange(name)}
                  className={`p-3 rounded-xl transition-all ${
                    newCategoryIcon === name
                      ? 'bg-[var(--color-accent)] text-white shadow-md scale-105'
                      : 'bg-white text-[var(--color-text-soft)] border border-[var(--color-border)] hover:border-blue-200 hover:text-[var(--color-accent)]'
                  }`}
                  title={name}
                >
                  <Icon size={20} className="mx-auto" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">
              Hiérarchie (Parent)
            </label>
            <select
              value={newCategoryParent}
              onChange={(e) => onParentChange(e.target.value)}
              className="input-premium h-11 bg-white appearance-none cursor-pointer"
            >
              <option value="">📂 Catégorie principale (Racine)</option>
              {categories
                .filter((cat) => !showEditModal || cat.id !== editingCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? '   ' : ''}• {cat.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={onClose} className="btn-secondary-md flex-1">
            Annuler
          </button>
          <button onClick={onSubmit} className="btn-primary-md flex-1 justify-center">
            {showEditModal ? <Save size={16} /> : <PlusCircle size={16} />}
            {showEditModal ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
