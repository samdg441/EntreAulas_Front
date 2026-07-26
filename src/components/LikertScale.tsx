import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface LikertScaleProps {
  value: number;
  onChange: (value: number) => void;
  options?: number;
  leftLabel?: string;
  rightLabel?: string;
}

export default function LikertScale({
  value,
  onChange,
  options = 5,
  leftLabel = "En desacuerdo",
  rightLabel = "De acuerdo"
}: LikertScaleProps) {
  // Tamaño uniforme (y ligeramente más grande) para que todas las esferas se vean del mismo tamaño.
  const getCircleSize = () => {
    return window.innerWidth < 640 ? 42 : 52; // sm breakpoint
  };

  // Función para determinar el color basado en la posición
  const getColorClass = (option: number, selected: boolean, totalOptions: number) => {
    if (!selected) return 'border-gray-300 bg-white';
    
    const center = Math.ceil(totalOptions / 2);
    
    if (option === center) {
      return 'border-gray-500 bg-gray-500 text-white'; // Centro - Gris
    } else if (option < center) {
      // Lado izquierdo (desacuerdo) - Tonos rojos/anaranjados
      const intensity = (center - option) / center;
      if (intensity > 0.6) return 'border-red-600 bg-red-600 text-white';
      if (intensity > 0.3) return 'border-orange-500 bg-orange-500 text-white';
      return 'border-amber-500 bg-amber-500 text-white';
    } else {
      // Lado derecho (acuerdo) - Tonos verdes
      const intensity = (option - center) / center;
      if (intensity > 0.6) return 'border-green-600 bg-green-600 text-white';
      if (intensity > 0.3) return 'border-emerald-500 bg-emerald-500 text-white';
      return 'border-lime-500 bg-lime-500 text-white';
    }
  };

  // Función para calcular el tamaño del check proporcional al círculo
  const getCheckSize = (circleSize: number) => {
    // El check será aproximadamente el 40% del tamaño del círculo
    const proportionalSize = circleSize * 0.4;
    // Limitamos el tamaño mínimo y máximo para buena visualización
    return Math.max(16, Math.min(proportionalSize, 32));
  };

  return (
    <div className="space-y-6 w-full">
      {/* Scale with sized circles */}
      <div className="flex justify-between items-center w-full px-1 sm:px-2">
        {Array.from({ length: options }, (_, i) => i + 1).map((option) => {
          const isSelected = value === option;
          const size = getCircleSize();
          const colorClass = getColorClass(option, isSelected, options);
          const checkSize = getCheckSize(size);
          
          return (
            <motion.button
              key={option}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(option)}
              className="relative flex flex-col items-center group"
            >
              {/* Circle with dynamic size */}
              <div
                className={`rounded-full border-4 flex items-center justify-center transition-all duration-200 ${colorClass} ${
                  isSelected 
                    ? 'ring-4 ring-opacity-30 ring-current shadow-lg' 
                    : 'hover:border-gray-400'
                }`}
                style={{ 
                  width: `${size}px`, 
                  height: `${size}px` 
                }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ width: `${checkSize}px`, height: `${checkSize}px` }}
                  >
                    <Check size={checkSize} />
                  </motion.div>
                )}
              </div>
              
              {/* Number */}
              <span className={`text-xs sm:text-sm font-medium mt-1 sm:mt-2 ${
                isSelected ? 'font-bold text-gray-800' : 'text-gray-600'
              }`}>
                {option}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between items-center px-1 sm:px-2 mt-3 sm:mt-4">
        <span className="text-sm sm:text-xl font-semibold text-gray-800">{leftLabel}</span>
        <span className="text-sm sm:text-xl font-semibold text-gray-800">{rightLabel}</span>
      </div>
    </div>
  );
}