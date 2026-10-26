import { Inbox } from 'lucide-react'
import Button from './Button'

interface EmptyStateProps {
  titulo: string
  descripcion: string
  accion?: string
  onAccion?: () => void
}

export default function EmptyState({ titulo, descripcion, accion, onAccion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4">
      <Inbox className="h-10 w-10 text-gray-400 mb-3" aria-hidden="true" />
      <p className="font-medium text-gray-900">{titulo}</p>
      <p className="mt-1 text-sm text-gray-600 max-w-md">{descripcion}</p>
      {accion && onAccion && (
        <Button type="button" className="mt-4" onClick={onAccion}>
          {accion}
        </Button>
      )}
    </div>
  )
}
