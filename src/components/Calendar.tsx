// components/Calendar.tsx
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarProps {
  onClose: () => void;
}

const Calendar = ({ onClose }: CalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Mes/año actual

  // Fechas importantes
  const surveyStart = new Date(2025, 8, 16); // 16 de septiembre
  const surveyEnd = new Date(2025, 8, 26);   // 26 de septiembre

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  // ✅ Asegurar que la semana empiece en lunes
  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = domingo
    return (firstDay + 6) % 7; // convierte lunes = 0, domingo = 6
  };

  const formatMonthYear = (date: Date) => {
    const options = { year: 'numeric', month: 'long' } as const;
    return date.toLocaleDateString('es-ES', options);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

const renderDays = () => {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate); // lunes = 0, domingo = 6
  const days: JSX.Element[] = [];

  // Total de celdas = huecos antes + días del mes + huecos después
  const totalCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;

  for (let cell = 0; cell < totalCells; cell++) {
    const dayNumber = cell - firstDayIndex + 1;
    const dayDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      dayNumber
    );

    let content: number | null = null;
    let dayClass =
      "calendar-day text-center rounded-lg text-gray-700 text-sm sm:text-base font-semibold flex items-center justify-center min-h-[44px] sm:min-h-[56px] md:min-h-[68px]";
    let tooltip = "";

    if (dayNumber > 0 && dayNumber <= daysInMonth) {
      content = dayNumber;

      if (isSameDay(dayDate, surveyStart)) {
        dayClass =
          "calendar-day tooltip text-center rounded-lg bg-blue-100 text-blue-700 font-bold border-2 border-blue-300 text-sm sm:text-base flex items-center justify-center min-h-[44px] sm:min-h-[56px] md:min-h-[68px]";
        tooltip = "Apertura de la encuesta";
      } else if (isSameDay(dayDate, surveyEnd)) {
        dayClass =
          "calendar-day tooltip text-center rounded-lg bg-red-100 text-red-700 font-bold border-2 border-red-300 text-sm sm:text-base flex items-center justify-center min-h-[44px] sm:min-h-[56px] md:min-h-[68px]";
        tooltip = "Cierre de la encuesta";
      }
    }

    days.push(
      <div key={`cell-${cell}`} className={dayClass} data-tooltip={tooltip}>
        {content}
      </div>
    );
  }

  return days;
};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-5xl max-h-[90vh] relative mx-auto my-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del calendario */}
        <div className="flex items-center gap-2 sm:gap-4 mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 capitalize">
            {formatMonthYear(currentDate)}
          </h2>

          {/* Flechas + botón de cerrar alineados */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors bg-white shadow-md"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 sm:p-3 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors bg-white shadow-md"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-3 rounded-full hover:bg-gray-100 bg-white shadow-md"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 mb-3 sm:mb-4">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm md:text-base font-bold text-gray-700 py-1 sm:py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">{renderDays()}</div>

        {/* Leyenda */}
        <div className="flex flex-col sm:flex-row justify-center mt-6 sm:mt-8 gap-3 sm:gap-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-sm sm:text-base font-semibold text-gray-800">
              Apertura de encuesta
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm sm:text-base font-semibold text-gray-800">
              Cierre de encuesta
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Calendar;
