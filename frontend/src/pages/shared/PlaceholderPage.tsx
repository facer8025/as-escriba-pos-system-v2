import { Construction } from 'lucide-react';

interface Props {
  title: string;
}

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="flex items-center justify-center h-[60vh] animate-fade-in">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-surface-100 dark:bg-surface-800 rounded-2xl flex items-center justify-center">
          <Construction size={36} className="text-surface-400" />
        </div>
        <h2 className="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
          {title}
        </h2>
        <p className="text-surface-500">
          Esta sección está en construcción y estará disponible próximamente.
        </p>
        <p className="text-xs text-surface-400 mt-4">
          Módulo especificado en la documentación funcional MVP
        </p>
      </div>
    </div>
  );
}
