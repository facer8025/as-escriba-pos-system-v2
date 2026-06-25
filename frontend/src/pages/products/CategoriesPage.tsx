import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, FolderTree, Palette, Save, Trash2, Loader2,
  X, ChevronRight, ChevronDown, AlertTriangle,
} from 'lucide-react';
import type { ApiResponse } from '@/types';

interface Category {
  id: string;
  parent?: { id: string } | null;
  parentId?: string | null;
  company?: { id: string };
  companyId?: string;
  name: string;
  description?: string;
  color: string;
  sortOrder?: number;
  active: boolean;
}

const COLORS = [
  '#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6',
  '#f97316','#6366f1','#84cc16','#06b6d4','#d946ef','#10b981','#e11d48',
  '#0ea5e9','#a855f7','#65a30d','#0891b2','#c026d3','#059669',
];

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', color: '#5c5e68', parentId: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['categories', user?.companyId],
    queryFn: () => api.get<ApiResponse<Category[]>>('/categories', {
      params: { companyId: user?.companyId },
    }),
    enabled: !!user?.companyId,
  });

  const categories = data?.data?.data || [];
  const selected = categories.find(c => c.id === selectedId);

  const rootCategories = categories.filter(c => !c.parent);
  const getChildren = (parentId: string) => categories.filter(c => c.parent?.id === parentId);

  const createMutation = useMutation({
    mutationFn: () => api.post('/categories', {
      name: form.name,
      description: form.description,
      color: form.color,
      sortOrder: 0,
      active: true,
      company: { id: user?.companyId },
      parent: form.parentId ? { id: form.parentId } : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría creada');
      resetForm();
    },
    onError: () => toast.error('Error al crear categoría'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/categories/${selectedId}`, {
      name: form.name,
      description: form.description,
      color: form.color,
      parent: form.parentId ? { id: form.parentId } : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría actualizada');
      resetForm();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/categories/${selectedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada');
      resetForm();
      setShowDeleteConfirm(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Error al eliminar';
      toast.error(msg);
      setShowDeleteConfirm(false);
    },
  });

  const resetForm = () => {
    setSelectedId(null);
    setShowForm(false);
    setIsCreating(false);
    setForm({ name: '', description: '', color: '#5c5e68', parentId: '' });
  };

  const selectCategory = (cat: Category) => {
    setSelectedId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#5c5e68',
      parentId: cat.parent?.id || '',
    });
    setShowForm(true);
    setIsCreating(false);
  };

  const startCreating = (parentId?: string) => {
    setIsCreating(true);
    setShowForm(true);
    setSelectedId(null);
    setForm({ name: '', description: '', color: '#5c5e68', parentId: parentId || '' });
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    if (isCreating) createMutation.mutate();
    else updateMutation.mutate();
  };

  const renderTree = (items: Category[], depth = 0) => {
    return items.map(cat => {
      const children = getChildren(cat.id);
      const isSelected = selectedId === cat.id;
      return (
        <div key={cat.id}>
          <div className="flex items-center group">
            {depth > 0 && <div className="w-4 flex-shrink-0" />}
            <button onClick={() => selectCategory(cat)}
              className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all flex-1 text-left',
                isSelected ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 font-medium border-l-2 border-primary-500 dark:border-primary-400' : 'hover:bg-surface-100 dark:hover:bg-surface-800 border-l-2 border-transparent')}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#5c5e68' }} />
              <span className="truncate">{cat.name}</span>
              {children.length > 0 && <span className="text-xs text-surface-400 ml-auto">{children.length}</span>}
            </button>
            {depth === 0 && (
              <button onClick={(e) => { e.stopPropagation(); startCreating(cat.id); }}
                className="p-1.5 opacity-0 group-hover:opacity-100 text-surface-400 hover:text-primary-500 transition-all"
                title="Agregar subcategoría">
                <Plus size={14} />
              </button>
            )}
          </div>
          {children.length > 0 && (
            <div className="ml-4 border-l-2 border-surface-200 dark:border-surface-700 pl-2">
              {renderTree(children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)] animate-fade-in">
      {/* Left - Tree */}
      <div className="w-72 flex-shrink-0 flex flex-col">
        <div className="card p-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-surface-500 uppercase tracking-wider">
              Categorías <span className="text-surface-400 font-normal">({categories.length})</span>
            </h3>
            <button onClick={() => startCreating()} className="btn-primary text-xs py-1.5 px-3">
              <Plus size={14} /> Nueva
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {isLoading ? (
              <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-9 rounded-lg" />)}</div>
            ) : rootCategories.length === 0 ? (
              <div className="text-center py-8 text-surface-400">
                <FolderTree size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin categorías</p>
                <button onClick={() => startCreating()} className="btn-primary text-xs mt-3 py-1.5 px-3">
                  <Plus size={14} /> Crear primera
                </button>
              </div>
            ) : (
              renderTree(rootCategories)
            )}
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 card p-6 overflow-y-auto">
        {!showForm ? (
          <div className="text-center py-16 text-surface-400">
            <FolderTree size={56} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">Selecciona una categoría</p>
            <p className="text-sm mt-1">o crea una nueva desde el botón "Nueva"</p>
          </div>
        ) : (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {isCreating ? 'Nueva categoría' : `Editar: ${selected?.name || ''}`}
              </h3>
              <button onClick={resetForm} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            {/* Name */}
            <div>
              <label className="label">Nombre *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Ej: Despensa, Lácteos..." className="input" maxLength={60} autoFocus />
            </div>

            {/* Description */}
            <div>
              <label className="label">Descripción</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Descripción opcional..." className="input h-20 resize-none" maxLength={200} />
            </div>

            {/* Parent category */}
            <div>
              <label className="label">Categoría padre</label>
              <select value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}
                className="input" disabled={!isCreating}>
                <option value="">— Categoría raíz —</option>
                {categories.filter(c => c.id !== selectedId).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div>
              <label className="label">Color identificador</label>
              <div className="grid grid-cols-10 gap-2 mb-3">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form, color: c})}
                    className={cn('w-8 h-8 rounded-lg border-2 transition-all', form.color === c ? 'border-primary-500 scale-110 ring-2 ring-primary-200' : 'border-transparent hover:scale-105')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                  className="w-10 h-10 rounded cursor-pointer border-0" />
                <span className="font-mono text-sm text-surface-400">{form.color}</span>
                <div className="w-10 h-10 rounded-lg border" style={{ backgroundColor: form.color }} />
              </div>
            </div>

            {/* Preview */}
            <div className="card p-3 bg-surface-50 dark:bg-surface-800/50 flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: form.color }} />
              <span className="font-medium text-sm">{form.name || 'Vista previa'}</span>
              {form.parentId && <span className="badge-neutral text-[10px]">Subcategoría</span>}
              {!form.parentId && <span className="badge-info text-[10px]">Categoría raíz</span>}
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4 border-t">
              <div>
                {!isCreating && (
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="btn-danger text-sm">
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={resetForm} className="btn-secondary">Cancelar</button>
                <button onClick={handleSave}
                  disabled={!form.name.trim() || createMutation.isPending || updateMutation.isPending}
                  className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending)
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Save size={16} />}
                  {isCreating ? 'Crear categoría' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-bold mb-2">¿Eliminar categoría?</h3>
              <p className="text-sm text-surface-500 mb-1">
                Se eliminará <strong>{selected?.name}</strong>
              </p>
              <p className="text-xs text-red-500">Esta acción no se puede deshacer</p>
            </div>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="btn-danger">
                {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
