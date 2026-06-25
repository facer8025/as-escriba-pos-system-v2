import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  BookOpen, Ruler, MapPin, Tag, Building2, AlertCircle,
  Plus, Pencil, Trash2, Save, X, Loader2, Check,
} from 'lucide-react';
import type { ApiResponse } from '@/types';

interface CatalogDef {
  id: string;
  label: string;
  icon: any;
  endpoint: string;
  fields: { key: string; label: string; type: 'text' | 'select'; options?: { value: string; label: string }[] }[];
  idField: string;
}

const CATALOGS: CatalogDef[] = [
  {
    id: 'units', label: 'Unidades de medida', icon: Ruler, endpoint: '/catalogs/units',
    idField: 'id', fields: [
      { key: 'code', label: 'Código', type: 'text' },
      { key: 'name', label: 'Nombre', type: 'text' },
      { key: 'type', label: 'Tipo', type: 'select', options: [
        { value: 'QUANTITY', label: 'Cantidad' }, { value: 'WEIGHT', label: 'Peso' },
        { value: 'VOLUME', label: 'Volumen' }, { value: 'LENGTH', label: 'Longitud' },
      ]},
    ],
  },
  {
    id: 'brands', label: 'Marcas', icon: Tag, endpoint: '/catalogs/brands',
    idField: 'id', fields: [
      { key: 'name', label: 'Nombre', type: 'text' },
    ],
  },
  {
    id: 'banks', label: 'Bancos', icon: Building2, endpoint: '/catalogs/banks',
    idField: 'id', fields: [
      { key: 'code', label: 'Código', type: 'text' },
      { key: 'name', label: 'Nombre', type: 'text' },
    ],
  },
];

export default function CatalogsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [active, setActive] = useState('units');
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const catalog = CATALOGS.find(c => c.id === active)!;

  const { data, isLoading } = useQuery({
    queryKey: ['catalog', catalog.endpoint],
    queryFn: () => api.get<ApiResponse<any[]>>(catalog.endpoint),
  });

  const items = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: () => api.post(catalog.endpoint, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Creado'); reset(); },
    onError: () => toast.error('Error al crear'),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`${catalog.endpoint}/${editingItem[catalog.idField]}`, form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Actualizado'); reset(); },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: any) => api.delete(`${catalog.endpoint}/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['catalog'] }); toast.success('Eliminado'); },
    onError: () => toast.error('Error al eliminar'),
  });

  const reset = () => { setEditingItem(null); setIsCreating(false); setForm({}); };

  const startEdit = (item: any) => {
    const f: Record<string, string> = {};
    catalog.fields.forEach(fld => { f[fld.key] = String(item[fld.key] || ''); });
    setForm(f); setEditingItem(item); setIsCreating(false);
  };

  const startCreate = () => {
    const f: Record<string, string> = {};
    catalog.fields.forEach(fld => { f[fld.key] = ''; });
    setForm(f); setEditingItem(null); setIsCreating(true);
  };

  const handleSave = () => {
    if (isCreating) createMutation.mutate();
    else updateMutation.mutate();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex gap-6 animate-fade-in">
      {/* Sidebar */}
      <div className="w-56 space-y-1">
        <h3 className="text-sm font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-3">
          Catálogos
        </h3>
        {CATALOGS.map(c => (
          <button key={c.id} onClick={() => { setActive(c.id); reset(); }}
            className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active === c.id
                ? 'bg-primary-500 text-white shadow-soft dark:bg-primary-600 dark:text-white'
                : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800')}>
            <c.icon size={18} />
            {c.label}
          </button>
        ))}
        <div className="border-t border-surface-200 dark:border-surface-700 pt-3 mt-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-surface-400 hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all">
            <Plus size={16} /> Nuevo catálogo
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
            <catalog.icon size={18} /> {catalog.label}
          </h3>
          <button onClick={startCreate} className="btn-primary text-xs py-1.5 px-3">
            <Plus size={14} /> Nuevo
          </button>
        </div>

        {/* Inline create/edit form */}
        {(isCreating || editingItem) && (
          <div className="mb-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl border border-primary-200 dark:border-primary-800 animate-fade-in">
            <div className="flex items-center gap-3 flex-wrap">
              {catalog.fields.map(fld => (
                <div key={fld.key}>
                  <label className="text-xs text-surface-500 mb-1 block">{fld.label}</label>
                  {fld.type === 'select' ? (
                    <select value={form[fld.key] || ''} onChange={e => setForm({...form, [fld.key]: e.target.value})}
                      className="input text-sm py-1.5 h-9">
                      <option value="">Seleccionar...</option>
                      {fld.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input type="text" value={form[fld.key] || ''} placeholder={fld.label}
                      onChange={e => setForm({...form, [fld.key]: e.target.value})}
                      className="input text-sm py-1.5 h-9 w-40" autoFocus />
                  )}
                </div>
              ))}
              <div className="flex items-end gap-1 pt-4">
                <button onClick={handleSave} disabled={isPending || !form.name} className="btn-primary text-xs py-1.5 px-3 h-9">
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {isCreating ? 'Crear' : 'Guardar'}
                </button>
                <button onClick={reset} className="btn-ghost p-1.5 h-9"><X size={16} /></button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                {catalog.fields.map(f => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={catalog.fields.length + 1} className="text-center py-8 text-surface-400">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={catalog.fields.length + 1} className="text-center py-8 text-surface-400">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin registros. Crea el primero.</p>
                </td></tr>
              ) : (
                items.map((item: any, i: number) => (
                  <tr key={item.id || i} className="group hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                    {catalog.fields.map(f => (
                      <td key={f.key} className="text-surface-900 dark:text-white">{item[f.key] || '—'}</td>
                    ))}
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(item)} className="btn-ghost p-1.5" title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { if (confirm('¿Eliminar este registro?')) deleteMutation.mutate(item[catalog.idField]); }}
                          className="btn-ghost p-1.5 text-red-500 hover:bg-red-50" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-surface-400 mt-3 flex items-center gap-1">
          <AlertCircle size={12} /> Pasa el mouse sobre las filas para ver las acciones
        </p>
      </div>
    </div>
  );
}
