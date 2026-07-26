import { motion } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-lg p-10 w-full max-w-lg" 
      >
        <div className="flex justify-between items-center mb-100"> 
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3> 
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" /> 
          </button>
        </div>
        
        <div className="text-center mb-8"> 
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" /> 
          <p className="text-xl text-gray-700">{message}</p> 
        </div>
        
        <div className="flex justify-center space-x-6"> 
          <Button
            variant="outline"
            onClick={onClose}
            className="px-12 py-4" 
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 px-12 py-4" 
          >
            {confirmText}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
