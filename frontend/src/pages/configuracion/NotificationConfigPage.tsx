import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import { Bell, Mail, Smartphone, Save, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiResponse } from '@/types';

interface NotifConfig {
  id: string;
  notificationType: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  recipients?: string;
}

const NOTIFICATION_TYPES: Array<{ key: string; label: string; desc: string }> = [
  { key: 'STOCK_MIN_ALERT', label: 'Alerta de stock m\u00ednimo', desc: 'Cuando un producto alcanza su stock m\u00ednimo configurado' },
  { key: 'STOCK_OUT_ALERT', label: 'Producto sin stock', desc: 'Cuando un producto se agota por completo' },
  { key: 'DIAN_ERROR', label: 'Error en facturaci\u00f3n DIAN', desc: 'Cuando falla el env\u00edo de una factura electr\u00f3nica a la DIAN' },
  { key: 'CASH_DIFFERENCE', label: 'Cierre de caja con diferencia', desc: 'Cuando hay diferencia entre el efectivo esperado y el contado' },
  { key: 'SALE_CANCELLED', label: 'Venta anulada', desc: 'Cuando un administrador anula una venta' },
  { key: 'RESOLUTION_EXPIRING', label: 'Resoluci\u00f3n DIAN por vencer', desc: 'Cuando una resoluci\u00f3n de numeraci\u00f3n est\u00e1 por vencer' },
  { key: 'PO_RECEIVED', label: 'Orden de compra recibida', desc: 'Cuando se recibe mercanc\u00eda de una orden de compra' },
  { key: 'NEW_USER_CREATED', label: 'Nuevo usuario creado', desc: 'Cuando se crea un nuevo usuario en el sistema' },
];

export default function NotificationConfigPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<Map<string, NotifConfig>>(new Map());
  const [recipients, setRecipients] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch config from API
  const { data, isLoading } = useQuery({
    queryKey: ['notif-config', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<NotifConfig[]>>('/notifications/config', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  // Sync fetched data to local state
  useEffect(() => {
    if (data?.data?.data) {
      const map = new Map<string, NotifConfig>();
      let rcp = '';
      for (const c of data.data.data) {
        map.set(c.notificationType, c);
        if (c.recipients) rcp = c.recipients;
      }
      setConfigs(map);
      setRecipients(rcp);
    }
  }, [data]);

  const getConfig = (key: string): NotifConfig => {
    return configs.get(key) || {
      id: '',
      notificationType: key,
      emailEnabled: false,
      inAppEnabled: true,
      pushEnabled: false,
    };
  };

  const toggle = async (key: string, channel: 'emailEnabled' | 'inAppEnabled' | 'pushEnabled') => {
    const cfg = getConfig(key);
    const newVal = !cfg[channel];

    // Optimistic UI update
    setConfigs(prev => {
      const next = new Map(prev);
      next.set(key, { ...cfg, [channel]: newVal });
      return next;
    });

    try {
      await api.put('/notifications/config', {
        companyId: user?.companyId,
        notificationType: key,
        [channel]: newVal,
      });
    } catch {
      // Revert on error
      setConfigs(prev => {
        const next = new Map(prev);
        next.set(key, cfg);
        return next;
      });
      toast.error('Error al guardar preferencia');
    }
  };

  const handleSaveRecipients = async () => {
    setSaving(true);
    try {
      for (const [key, cfg] of configs.entries()) {
        await api.put('/notifications/config', {
          companyId: user?.companyId,
          notificationType: key,
          recipients: recipients || null,
        });
      }
      toast.success('Preferencias guardadas');
      queryClient.invalidateQueries({ queryKey: ['notif-config'] });
    } catch {
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Bell size={24} />
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notificaciones</h1>
            <p className="text-surface-500 text-sm">Cargando configuraci\u00f3n...</p>
          </div>
        </div>
        <div className="card p-8 text-center text-surface-400">
          <Loader2 size={32} className="animate-spin mx-auto mb-2" />
          <p className="text-sm">Cargando preferencias de notificaci\u00f3n</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Bell size={24} className="text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Notificaciones</h1>
          <p className="text-surface-500 text-sm">Configura qu\u00e9 notificaciones recibes y por qu\u00e9 canal</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_60px_60px_60px] gap-0 text-xs font-semibold uppercase tracking-wider bg-surface-50 dark:bg-surface-800/50 p-3 border-b border-surface-100 dark:border-surface-800 text-surface-500">
          <span>Tipo de notificaci\u00f3n</span>
          <span className="text-center"><Mail size={14} className="inline mr-1" />Email</span>
          <span className="text-center"><Bell size={14} className="inline mr-1" />App</span>
          <span className="text-center"><Smartphone size={14} className="inline mr-1" />Push</span>
        </div>

        {NOTIFICATION_TYPES.map(nt => {
          const cfg = getConfig(nt.key);
          return (
            <div key={nt.key} className="grid grid-cols-[1fr_60px_60px_60px] gap-0 p-3 border-b last:border-0 border-surface-100 dark:border-surface-800 hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
              <div>
                <p className="text-sm font-medium text-surface-900 dark:text-white">{nt.label}</p>
                <p className="text-xs text-surface-400">{nt.desc}</p>
              </div>
              {(['emailEnabled', 'inAppEnabled', 'pushEnabled'] as const).map(channel => {
                const enabled = cfg[channel] || false;
                return (
                  <div key={channel} className="flex justify-center items-center">
                    <button
                      onClick={() => toggle(nt.key, channel)}
                      className={cn(
                        'w-9 h-5 rounded-full transition-all duration-200 relative',
                        enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
                        enabled && 'translate-x-4'
                      )} />
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="card p-5">
        <label className="label">Emails adicionales para notificaciones cr\u00edticas</label>
        <div className="flex gap-3">
          <input
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="admin@escriba.co, gerente@escriba.co"
            className="input flex-1"
          />
          <button onClick={handleSaveRecipients} disabled={saving} className="btn-primary flex-shrink-0">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar
          </button>
        </div>
        <p className="text-xs text-surface-400 mt-2">Emails separados por coma. Recibir\u00e1n las notificaciones con email habilitado.</p>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-surface-400">
          <CheckCircle size={12} className="inline mr-1 text-accent-500" />
          {configs.size} tipos de notificaci\u00f3n configurados
        </p>
      </div>
    </div>
  );
}
