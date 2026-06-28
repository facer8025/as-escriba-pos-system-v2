import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatDate, getInitials, cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { 
  Plus, Search, Filter, MoreHorizontal, 
  Shield, ShieldCheck, UserCog, User as UserIcon,
  Pencil, Trash2, X, Save, Loader2, Mail, Phone, Lock,
  CheckCircle, XCircle,
} from 'lucide-react';
import type { ApiResponse, User as UserType } from '@/types';

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  AD: { label: 'Administrador', color: 'badge-info', icon: ShieldCheck },
  CA: { label: 'Cajero', color: 'badge-success', icon: UserIcon },
  BO: { label: 'Bodeguero', color: 'badge-warning', icon: Shield },
  VE: { label: 'Vendedor', color: 'badge-neutral', icon: UserIcon },
  SA: { label: 'Superadmin', color: 'badge-danger', icon: Shield },
};

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  roleCode: string;
};

const EMPTY_FORM: UserFormData = {
  firstName: '', lastName: '', email: '', password: '', phone: '', roleCode: 'CA',
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['users', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<UserType[]>>('/users', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  const users: UserType[] = data?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: UserFormData) =>
      api.post('/auth/register', {
        ...formData,
        companyId: user?.companyId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al crear usuario');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData: UserFormData) =>
      api.put(`/users/${editingUser!.id}`, {
        ...formData,
        companyId: user?.companyId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario actualizado exitosamente');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al actualizar usuario');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) => api.patch(`/users/${userId}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado');
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter && u.roleCode !== roleFilter) return false;
    return true;
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingUser(null);
    setShowModal(true);
  };

  const openEdit = (u: UserType) => {
    setForm({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: '',
      phone: u.phone || '',
      roleCode: u.roleCode,
    });
    setEditingUser(u);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    if (!editingUser && !form.password) {
      toast.error('La contraseña es requerida');
      return;
    }

    if (editingUser) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const roleOptions = [
    { code: 'AD', label: 'Administrador' },
    { code: 'CA', label: 'Cajero' },
    { code: 'BO', label: 'Bodeguero' },
    { code: 'VE', label: 'Vendedor' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Usuarios</h1>
          <p className="text-surface-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} />
          Nuevo usuario
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select className="input w-auto min-w-[150px]" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="AD">Administrador</option>
            <option value="CA">Cajero</option>
            <option value="BO">Bodeguero</option>
            <option value="VE">Vendedor</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo electrónico</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Último acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = roleConfig[u.roleCode] || roleConfig['VE'];
              const RoleIcon = role.icon;
              return (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                          {getInitials(u.fullName)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">{u.fullName}</p>
                        <p className="text-xs text-surface-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-surface-600 dark:text-surface-400">{u.email}</td>
                  <td>
                    <span className={`badge ${role.color} flex items-center gap-1 w-fit`}>
                      <RoleIcon size={12} />
                      {role.label}
                    </span>
                  </td>
                  <td>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={u.active}
                        onChange={() => toggleMutation.mutate(u.id)}
                        className="sr-only peer" />
                      <div className="w-9 h-5 bg-surface-300 dark:bg-surface-600 peer-focus:outline-none peer-focus:ring-2 
                                    peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full 
                                    peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                                    after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-500">
                      </div>
                    </label>
                  </td>
                  <td className="text-surface-500 text-sm">
                    {u.lastLogin ? formatDate(u.lastLogin, 'relative') : 'Nunca'}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="btn-ghost p-1.5" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar a ${u.fullName}?`)) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        className="btn-ghost p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
                  <UserIcon size={20} className="text-primary-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
                  <p className="text-xs text-surface-400">
                    {editingUser ? 'Modifica los datos del usuario' : 'Ingresa los datos del nuevo usuario'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="btn-ghost p-2"><X size={20} /></button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Nombres *</label>
                  <input type="text" value={form.firstName}
                    onChange={e => setForm({...form, firstName: e.target.value})}
                    className="input" placeholder="Ej: Juan Carlos" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Apellidos *</label>
                  <input type="text" value={form.lastName}
                    onChange={e => setForm({...form, lastName: e.target.value})}
                    className="input" placeholder="Ej: Pérez López" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  <Mail size={14} className="inline mr-1" /> Correo electrónico *
                </label>
                <input type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="input" placeholder="Ej: usuario@empresa.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  <Phone size={14} className="inline mr-1" /> Teléfono
                </label>
                <input type="text" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="input" placeholder="Ej: +57 300 123 4567" />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  <Lock size={14} className="inline mr-1" /> Contraseña {!editingUser ? '*' : '(dejar vacío para mantener)'}
                </label>
                <input type="password" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="input" placeholder={editingUser ? '••••••••' : 'Mínimo 8 caracteres'} />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Rol *</label>
                <select value={form.roleCode}
                  onChange={e => setForm({...form, roleCode: e.target.value})}
                  className="input">
                  {roleOptions.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700">
              <button onClick={closeModal} className="btn-secondary" disabled={isPending}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isPending} className="btn-primary">
                {isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                ) : (
                  <><Save size={16} /> {editingUser ? 'Guardar cambios' : 'Crear usuario'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
