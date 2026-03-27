'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, 
  ArrowLeft, 
  Save, 
  Layers, 
  Beaker,
  Loader2,
  Search,
  PlusCircle,
  RotateCcw,
  X,
  Folder,
  Droplet,
  Activity,
  Heart,
  Zap,
  TestTube,
  ChevronRight,
  Edit2,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationToast } from '@/components/ui/notification-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Types
interface Category {
  id: string;
  name: string;
  rank: number;
  icon?: string | null;
  parentId?: string | null;
  tests: Test[];
  children?: Category[];
  parent?: Category;
}

interface Test {
  id: string;
  name: string;
  code: string;
  rank: number;
}

interface SortableRenderProps {
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown> | undefined;
}

// Icônes disponibles
const AVAILABLE_ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Beaker', icon: Beaker },
  { name: 'Droplet', icon: Droplet },
  { name: 'Activity', icon: Activity },
  { name: 'Heart', icon: Heart },
  { name: 'Zap', icon: Zap },
  { name: 'TestTube', icon: TestTube },
  { name: 'Layers', icon: Layers },
];

// Composant pour afficher l'icône d'une catégorie
function CategoryIcon({ iconName }: { iconName?: string | null }) {
  const IconComponent = AVAILABLE_ICONS.find(i => i.name === iconName)?.icon || Folder;
  return <IconComponent size={18} />;
}

// Sortable Item Component
function SortableItem({ id, children }: { id: string, children: (props: SortableRenderProps) => React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    // Use Translate only (no scale) to prevent ghost misalignment
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,  // hide the placeholder item (DragOverlay replaces it)
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div id={id} ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

export default function OrderingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>('Folder');
  const [newCategoryParent, setNewCategoryParent] = useState<string>('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({ open: false, title: '', description: '', action: () => {} });
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const categorySensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const testSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory((prev) => prev ?? data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, [fetchCategories]);

  const updateOrder = async (model: 'category' | 'test', items: Array<{ id: string }>) => {
    setSaving(true);
    const updates = items.map((item, index) => ({
      id: item.id,
      rank: index
    }));

    try {
      await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, updates })
      });
    } catch (error) {
      console.error('Failed to save order', error);
    } finally {
      setSaving(false);
    }
  };

  // Récupérer la liste plate des catégories visibles dans l'ordre de l'arbre
  const getVisibleCategories = (rootCats: Category[]): Category[] => {
    const flattened: Category[] = [];
    
    const flatten = (cat: Category) => {
      flattened.push(cat);
      if (expandedCategories.has(cat.id)) {
        const children = getChildCategories(cat.id);
        children.forEach(flatten);
      }
    };

    rootCats.forEach(flatten);
    return flattened;
  };

  const handleDragStartCategory = (event: DragStartEvent) => {
    setActiveCategoryId(event.active.id as string);
    const width = event.active.rect.current.translated?.width ?? null;
    setActiveDragWidth(width);
  };

  const handleDragEndCategory = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCategoryId(null);
    setActiveDragWidth(null);

    if (active && over && active.id !== over.id) {
      const visibleCats = searchQuery ? filteredCategories : getVisibleCategories(buildCategoryTree(categories));
      const oldIndex = visibleCats.findIndex((i) => i.id === active.id);
      const newIndex = visibleCats.findIndex((i) => i.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newVisibleOrder = arrayMove(visibleCats, oldIndex, newIndex);
        
        // Mettre à jour les rangs visiblement
        const updatedVisibleOrder = newVisibleOrder.map((cat, index) => ({
          ...cat,
          rank: index
        }));
        
        const visibleIds = new Set(updatedVisibleOrder.map(c => c.id));
        const notVisible = categories.filter(c => !visibleIds.has(c.id));
        const finalOrder = [...updatedVisibleOrder, ...notVisible];

        setCategories(finalOrder);
        updateOrder('category', finalOrder);
      }
    }
  };

  const handleDragStartTest = (event: DragStartEvent) => {
    setActiveTestId(event.active.id as string);
    const width = event.active.rect.current.translated?.width ?? null;
    setActiveDragWidth(width);
  };

  const handleDragEndTest = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTestId(null);
    setActiveDragWidth(null);

    if (!selectedCategory || !active || !over || active.id === over.id) return;

    const oldIndex = selectedCategory.tests.findIndex((t) => t.id === active.id);
    const newIndex = selectedCategory.tests.findIndex((t) => t.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
        const newTests = arrayMove(selectedCategory.tests, oldIndex, newIndex);
        // Mettre à jour les rangs des tests
        const updatedTests = newTests.map((t, i) => ({ ...t, rank: i }));
        const newCategory = { ...selectedCategory, tests: updatedTests };
        
        setSelectedCategory(newCategory);
        setCategories(prev => prev.map(c => c.id === newCategory.id ? newCategory : c));
        
        updateOrder('test', updatedTests);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification('error', 'Le nom de la catégorie est requis');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          parentId: newCategoryParent || null
        })
      });

      if (res.ok) {
        showNotification('success', 'Catégorie créée avec succès');
        setShowCreateModal(false);
        setNewCategoryName('');
        setNewCategoryIcon('Folder');
        setNewCategoryParent('');
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la création');
      }
    } catch {
      showNotification('error', 'Erreur lors de la création');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showNotification('error', 'Le nom de la catégorie est requis');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          parentId: newCategoryParent || null
        })
      });

      if (res.ok) {
        showNotification('success', 'Catégorie modifiée avec succès');
        setShowEditModal(false);
        setEditingCategory(null);
        setNewCategoryName('');
        setNewCategoryIcon('Folder');
        setNewCategoryParent('');
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la modification');
      }
    } catch {
      showNotification('error', 'Erreur lors de la modification');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const res = await fetch(`/api/categories?id=${category.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        showNotification('success', 'Catégorie supprimée avec succès');
        if (selectedCategory?.id === category.id) {
          setSelectedCategory(null);
        }
        fetchCategories();
      } else {
        const error = await res.json();
        showNotification('error', error.error || 'Erreur lors de la suppression');
      }
    } catch {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryIcon(category.icon || 'Folder');
    setNewCategoryParent(category.parentId || '');
    setShowEditModal(true);
  };

  const handleReset = async () => {
    try {
      const res = await fetch('/api/categories/reset', {
        method: 'POST'
      });

      if (res.ok) {
        showNotification('success', 'Ordre réinitialisé avec succès');
        // Rafraîchir immédiatement l'UI
        await fetchCategories();
      } else {
        showNotification('error', 'Erreur lors de la réinitialisation');
      }
    } catch {
      showNotification('error', 'Erreur lors de la réinitialisation');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Construire l'arbre hiérarchique
  const buildCategoryTree = (cats: Category[]): Category[] => {
    const rootCategories = cats.filter(c => !c.parentId);
    return rootCategories.sort((a, b) => a.rank - b.rank);
  };

  const getChildCategories = (parentId: string): Category[] => {
    return categories
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.rank - b.rank);
  };

  // Fonction pour afficher une catégorie unique
  const renderCategoryItem = (cat: Category, depth: number = 0): React.ReactElement => {
    const hasChildren = categories.some(c => c.parentId === cat.id);
    const isExpanded = expandedCategories.has(cat.id);

    return (
      <SortableItem key={cat.id} id={cat.id}>
        {({ attributes, listeners }) => (
          <div 
            className={`
              p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border
              ${selectedCategory?.id === cat.id 
                ? 'bg-indigo-50 border-indigo-200 shadow-md' 
                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'}
            `}
            style={{ marginLeft: `${depth * 24}px` }}
          >
            <div className="flex items-center gap-3 flex-1">
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(cat.id);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                >
                  <ChevronRight size={16} />
                </button>
              )}
              {!hasChildren && depth > 0 && <div className="w-4" />} {/* Spacer pour aligner avec les parents */}
              <div 
                onClick={() => setSelectedCategory(cat)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <CategoryIcon iconName={cat.icon} />
                <div className="flex flex-col min-w-0 truncate">
                  <span className="font-bold text-slate-700 truncate">{cat.name}</span>
                  {depth > 0 && <span className="text-[10px] text-slate-400 uppercase font-black truncate">Sous-catégorie</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(cat);
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Modifier"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDialog({
                    open: true,
                    title: 'Supprimer la catégorie',
                    description: `Êtes-vous sûr de vouloir supprimer "${cat.name}" ? Cela ne supprimera pas les tests associés s'ils existent, mais vous devez d'abord les déplacer ou les supprimer.`,
                    action: () => handleDeleteCategory(cat)
                  });
                }}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <div {...attributes} {...listeners} className="p-2 -mr-2 text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none">
                <GripVertical size={16} />
              </div>
            </div>
          </div>
        )}
      </SortableItem>
    );
  };

  // Filtrage
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTests = selectedCategory?.tests?.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const rootCategories = buildCategoryTree(searchQuery ? filteredCategories : categories);
  const visibleCategories = searchQuery ? filteredCategories : getVisibleCategories(rootCategories);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[var(--color-accent)]" /></div>;

  return (
    <div className="space-y-6 pb-24">

      {/* Header */}
      <div className="bento-panel p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="group flex items-center gap-2 text-[var(--color-text-soft)] font-medium hover:text-[var(--color-accent)] transition-all"
          >
            <div className="w-8 h-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] flex items-center justify-center group-hover:bg-[var(--color-accent-soft)] transition-all">
              <ArrowLeft size={16} />
            </div>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)] tracking-tight">Organisation du Laboratoire</h1>
            <p className="text-[var(--color-text-secondary)] mt-1">Réorganisez l&apos;ordre d&apos;affichage par glisser-déposer.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saving && <span className="text-sm font-medium text-[var(--color-accent)] animate-pulse flex items-center gap-2"><Save size={14} /> Sauvegarde...</span>}
          <button
            onClick={() => setConfirmDialog({
              open: true,
              title: 'Réinitialiser l\'ordre',
              description: 'Êtes-vous sûr de vouloir réinitialiser l\'ordre par défaut ? Cette action est irréversible.',
              action: handleReset
            })}
            className="btn-secondary h-11 text-sm text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary-md text-sm"
          >
            <PlusCircle size={16} />
            Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative bento-panel p-4">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-[var(--color-text-soft)]" size={18} />
        <input
          type="text"
          placeholder="Rechercher une catégorie ou un test..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-premium h-11 pl-12"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Categories Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bento-panel p-4 rounded-b-none border-b-0 flex items-center gap-3">
            <Layers size={18} className="text-[var(--color-accent)]" />
            <h2 className="font-semibold text-[var(--color-text)]">Catégories</h2>
          </div>
          <div className="bento-panel rounded-t-none p-2 min-h-[400px]">
                <DndContext 
                  sensors={categorySensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStartCategory}
                  onDragEnd={handleDragEndCategory}
                >
                  <SortableContext 
                    items={visibleCategories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {visibleCategories.map((cat) => {
                        // Pour le rendu, on calcule la profondeur si on n'est pas en recherche
                        let depth = 0;
                        if (!searchQuery) {
                            let current = cat;
                            while (current.parentId) {
                                depth++;
                                const parent = categories.find(p => p.id === current.parentId);
                                if (!parent) break;
                                current = parent;
                            }
                        }
                        return renderCategoryItem(cat, depth);
                      })}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeCategoryId ? (() => {
                      const cat = categories.find(c => c.id === activeCategoryId);
                      if (!cat) return null;
                      return (
                        <div 
                          className="p-4 rounded-xl flex items-center justify-between bg-white border border-blue-200 shadow-xl opacity-90 scale-105 cursor-grabbing"
                          style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon iconName={cat.icon} />
                            <span className="font-bold text-slate-700">{cat.name}</span>
                          </div>
                          <GripVertical size={16} className="text-indigo-400" />
                        </div>
                      );
                    })() : null}
                  </DragOverlay>
                </DndContext>
          </div>
        </div>

        {/* Tests Column */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bento-panel p-4 rounded-b-none border-b-0 flex items-center gap-3">
            <Beaker size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-[var(--color-text)]">Tests de : <span className="text-[var(--color-text-secondary)]">{selectedCategory?.name}</span></h2>
          </div>
          <div className="bento-panel rounded-t-none p-2 min-h-[400px]">
             {selectedCategory ? (
                <DndContext 
                  sensors={testSensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStartTest}
                  onDragEnd={handleDragEndTest}
                >
                  <SortableContext 
                    items={filteredTests.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredTests.map((test) => (
                          <SortableItem key={test.id} id={test.id}>
                            {({ attributes, listeners }) => (
                              <div className="p-3 bg-white border border-[var(--color-border)] rounded-xl flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] font-mono text-[10px] flex items-center justify-center font-semibold group-hover:bg-[var(--color-accent-soft)] group-hover:text-[var(--color-accent)] transition-colors">
                                      {test.code}
                                    </div>
                                    <span className="font-medium text-[var(--color-text)]">{test.name}</span>
                                </div>
                                <div {...attributes} {...listeners} className="p-2 -mr-2 text-slate-300 group-hover:text-indigo-400 cursor-grab active:cursor-grabbing touch-none">
                                  <GripVertical size={16} />
                                </div>
                              </div>
                            )}
                          </SortableItem>
                      ))}
                      {filteredTests.length === 0 && (
                        <div className="p-8 text-center text-slate-400 italic">
                          {searchQuery ? 'Aucun test trouvé' : 'Aucun test dans cette catégorie'}
                        </div>
                      )}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeTestId ? (() => {
                      const test = filteredTests.find(t => t.id === activeTestId);
                      if (!test) return null;
                      return (
                        <div 
                          className="p-3 bg-white border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xl opacity-90 scale-105"
                          style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                        >
                          <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-mono text-[10px] flex items-center justify-center font-bold">
                                {test.code}
                              </div>
                              <span className="font-bold text-slate-700">{test.name}</span>
                          </div>
                          <GripVertical size={16} className="text-indigo-400" />
                        </div>
                      );
                    })() : null}
                  </DragOverlay>
                </DndContext>
             ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                   <Layers size={48} className="mb-4 opacity-20" />
                   <p>Sélectionnez une catégorie pour ordonner ses tests</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Modal de création / édition */}
      {mounted && (showCreateModal || showEditModal) && createPortal(
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
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                }} 
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-soft)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Nom de la catégorie</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Sérologie, Biochimie..."
                  className="input-premium h-11"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Icône</label>
                <div className="grid grid-cols-4 gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setNewCategoryIcon(name)}
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
                <label className="px-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-soft)]">Hiérarchie (Parent)</label>
                <select
                  value={newCategoryParent}
                  onChange={(e) => setNewCategoryParent(e.target.value)}
                  className="input-premium h-11 bg-white appearance-none cursor-pointer"
                >
                  <option value="">📂 Catégorie principale (Racine)</option>
                  {categories
                    .filter(cat => !showEditModal || cat.id !== editingCategory?.id)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.parentId ? '   ' : ''}• {cat.name}
                      </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingCategory(null);
                  setNewCategoryName('');
                }}
                className="btn-secondary-md flex-1"
              >
                Annuler
              </button>
              <button
                onClick={showEditModal ? handleEditCategory : handleCreateCategory}
                className="btn-primary-md flex-1 justify-center"
              >
                {showEditModal ? <Save size={16} /> : <PlusCircle size={16} />}
                {showEditModal ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.action}
        confirmLabel="Confirmer"
      />

      {/* Notification Toast */}
      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}
