'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
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
function SortableItem({ id, children, active }: { id: string, children: (props: any) => React.ReactNode, active: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div id={id} ref={setNodeRef} style={style} className={`${active ? 'opacity-50' : ''} ${isDragging ? 'shadow-2xl' : ''}`}>
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

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', {
        cache: 'no-store',
        next: { revalidate: 0 }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
            setSelectedCategory(data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (model: 'category' | 'test', items: any[]) => {
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

  const handleDragStartCategory = (event: any) => {
    setActiveCategoryId(event.active.id);
    const node = document.getElementById(event.active.id);
    if (node) setActiveDragWidth(node.offsetWidth);
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

  const handleDragStartTest = (event: any) => {
    setActiveTestId(event.active.id);
    const node = document.getElementById(event.active.id);
    if (node) setActiveDragWidth(node.offsetWidth);
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
      <SortableItem key={cat.id} id={cat.id} active={selectedCategory?.id === cat.id}>
        {({ attributes, listeners }) => (
          <div 
            className={`
              p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border
              ${selectedCategory?.id === cat.id 
                ? 'bg-blue-50 border-blue-200 shadow-md translate-x-2' 
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
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
              <div {...attributes} {...listeners} className="p-2 -mr-2 text-slate-300 hover:text-blue-400 cursor-grab active:cursor-grabbing touch-none">
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

  const filteredTests = selectedCategory?.tests.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const rootCategories = buildCategoryTree(searchQuery ? filteredCategories : categories);
  const visibleCategories = searchQuery ? filteredCategories : getVisibleCategories(rootCategories);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-8 space-y-8 animate-fade-in pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all shadow-sm border border-slate-200"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organisation du Laboratoire</h1>
            <p className="text-slate-500 font-medium">Réorganisez l'ordre d'affichage par glisser-déposer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm font-bold text-blue-600 animate-pulse flex items-center gap-2"><Save size={14} /> Sauvegarde...</span>}
          <button
            onClick={() => setConfirmDialog({
              open: true,
              title: 'Réinitialiser l\'ordre',
              description: 'Êtes-vous sûr de vouloir réinitialiser l\'ordre par défaut ? Cette action est irréversible.',
              action: handleReset
            })}
            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm flex items-center gap-2 transition-all"
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            <PlusCircle size={16} />
            Nouvelle Catégorie
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher une catégorie ou un test..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Categories Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex items-center gap-3 shadow-lg">
            <Layers size={20} className="text-blue-400" />
            <h2 className="font-bold">Catégories</h2>
          </div>
          <div className="bg-white rounded-b-2xl shadow-xl shadow-slate-200/50 p-2 min-h-[400px]">
                <DndContext 
                  sensors={categorySensors}
                  collisionDetection={closestCorners}
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
                          className="p-4 rounded-xl flex items-center justify-between bg-white border border-blue-200 shadow-2xl opacity-90 scale-105 cursor-grabbing"
                          style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                        >
                          <div className="flex items-center gap-3">
                            <CategoryIcon iconName={cat.icon} />
                            <span className="font-bold text-slate-700">{cat.name}</span>
                          </div>
                          <GripVertical size={16} className="text-blue-400" />
                        </div>
                      );
                    })() : null}
                  </DragOverlay>
                </DndContext>
          </div>
        </div>

        {/* Tests Column */}
        <div className="lg:col-span-1 space-y-4">
           <div className="bg-slate-900 text-white p-4 rounded-t-2xl flex items-center gap-3 shadow-lg">
            <Beaker size={20} className="text-emerald-400" />
            <h2 className="font-bold">Tests de : <span className="text-emerald-300">{selectedCategory?.name}</span></h2>
          </div>
          <div className="bg-white rounded-b-2xl shadow-xl shadow-slate-200/50 p-2 min-h-[400px]">
             {selectedCategory ? (
                <DndContext 
                  sensors={testSensors}
                  collisionDetection={closestCorners}
                  onDragStart={handleDragStartTest}
                  onDragEnd={handleDragEndTest}
                >
                  <SortableContext 
                    items={filteredTests.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredTests.map((test) => (
                          <SortableItem key={test.id} id={test.id} active={false}>
                            {({ attributes, listeners }) => (
                              <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between hover:border-blue-200 hover:shadow-md transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-mono text-[10px] flex items-center justify-center font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                      {test.code}
                                    </div>
                                    <span className="font-bold text-slate-700">{test.name}</span>
                                </div>
                                <div {...attributes} {...listeners} className="p-2 -mr-2 text-slate-300 group-hover:text-blue-400 cursor-grab active:cursor-grabbing touch-none">
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
                          className="p-3 bg-white border border-blue-200 rounded-xl flex items-center justify-between shadow-2xl opacity-90 scale-105"
                          style={{ width: activeDragWidth ? `${activeDragWidth}px` : 'auto' }}
                        >
                          <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 font-mono text-[10px] flex items-center justify-center font-bold">
                                {test.code}
                              </div>
                              <span className="font-bold text-slate-700">{test.name}</span>
                          </div>
                          <GripVertical size={16} className="text-blue-400" />
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  {showEditModal ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nom de la catégorie</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Sérologie, Biochimie..."
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-700"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Icône</label>
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  {AVAILABLE_ICONS.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setNewCategoryIcon(name)}
                      className={`p-3 rounded-xl transition-all ${
                        newCategoryIcon === name
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-300 hover:text-blue-500'
                      }`}
                      title={name}
                    >
                      <Icon size={20} className="mx-auto" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Hiérarchie (Parent)</label>
                <select
                  value={newCategoryParent}
                  onChange={(e) => setNewCategoryParent(e.target.value)}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all font-bold text-slate-700 bg-white appearance-none cursor-pointer"
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
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold transition-all border border-slate-100"
              >
                Annuler
              </button>
              <button
                onClick={showEditModal ? handleEditCategory : handleCreateCategory}
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
              >
                {showEditModal ? <Save size={18} /> : <PlusCircle size={18} />}
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
