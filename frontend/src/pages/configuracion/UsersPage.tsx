import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatDate, getInitials, cn } from '@/lib/utils';
import { 
  Plus, Search, Filter, MoreHorizontal, 
  Shield, ShieldCheck, UserCog, User as UserIcon,
} from 'lucide-react';
import type { ApiResponse, User as UserType } from '@/types';

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  AD: { label: 'Administrador', color: 'badge-info', icon: ShieldCheck },
  CA: { label: 'Cajero', color: 'badge-success', icon: UserIcon },
  BO: { label: 'Bodeguero', color: 'badge-warning', icon: Shield },
  VE: { label: 'Vendedor', color: 'badge-neutral', icon: UserIcon },
  SA: { label: 'Superadmin', color: 'badge-danger', icon: Shield },
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data } = useQuery({
    queryKey: ['users', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<UserType[]>>('/users', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  const users: UserType[] = data?.data?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Usuarios</h1>
          <p className="text-surface-500 mt-1">{users.length} usuarios registrados</p>
        </div>
        <button className="btn-primary">
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
                      <input type="checkbox" checked={u.active} className="sr-only peer" />
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
                    <button className="btn-ghost p-1.5">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
