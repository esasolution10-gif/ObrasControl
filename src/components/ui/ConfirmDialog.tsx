'use client'

import { Modal } from './Modal'
import { Button } from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar exclusão',
  message,
  confirmLabel = 'Excluir',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        <div className="flex-shrink-0 p-2 bg-red-50 rounded-full h-fit">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </Modal>
  )
}
