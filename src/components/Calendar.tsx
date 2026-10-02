import { useEffect, useId, useRef, useState } from 'react';
import { CalendarCheck, CalendarClock, CalendarX, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { getVentanasEvaluacion, type VentanaEvaluacion } from '../api/periodos.api';
import {
  celdasDelMes,
  estadoDelDia,
  formatoFechaLarga,
  mesInicial,
  mismoDia,
  resumenEvaluacion,
  textoDias,
  type EstadoDia,
} from '../lib/calendario';

interface CalendarProps {
  onClose: () => void;
}

const DIAS_SEMANA = [
  { corto: 'Lun', largo: 'lunes' },
  { corto: 'Mar', largo: 'martes' },
  { corto: 'Mié', largo: 'miércoles' },
  { corto: 'Jue', largo: 'jueves' },
  { corto: 'Vie', largo: 'viernes' },
  { corto: 'Sáb', largo: 'sábado' },
  { corto: 'Dom', largo: 'domingo' },
];

const ESTILO_DIA: Record<EstadoDia, string> = {
  inicio: 'bg-[#FECACA] text-[#991B1B] border-2 border-[#F87171]',
  fin: 'bg-[#FECACA] text-[#991B1B] border-2 border-[#F87171]',
  abierta: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]',
  normal: 'bg-white text-gray-700 border border-gray-100',
};

const ETIQUETA_DIA: Record<EstadoDia, string> = {
  inicio: 'Abre',
  fin: 'Cierra',
  abierta: '',
  normal: '',
};

const DESCRIPCION_DIA: Record<EstadoDia, string> = {
  inicio: 'apertura de la evaluación',
  fin: 'cierre de la evaluación',
  abierta: 'evaluación abierta',
  normal: 'sin evaluación',
};

function ResumenBanner({ ventanas, hoy }: Readonly<{ ventanas: VentanaEvaluacion[]; hoy: Date }>) {
  const resumen = resumenEvaluacion(hoy, ventanas);

  if (resumen.tipo === 'abierta') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 sm:p-4" role="status">
        <CalendarCheck className="h-6 w-6 shrink-0 text-[#B91C1C]" aria-hidden="true" />
        <div>
          <p className="font-semibold text-[#991B1B]">La evaluación docente está abierta</p>
          <p className="text-sm text-gray-700">
            Del {formatoFechaLarga(resumen.ventana.fechaInicio)} al {formatoFechaLarga(resumen.ventana.fechaFin)}.
            {' '}Cierra {textoDias(resumen.diasRestantes)}.
          </p>
        </div>
      </div>
    );
  }

  if (resumen.tipo === 'proxima') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4" role="status">
        <CalendarClock className="h-6 w-6 shrink-0 text-gray-600" aria-hidden="true" />
        <div>
          <p className="font-semibold text-gray-900">Próxima evaluación docente</p>
          <p className="text-sm text-gray-700">
            Del {formatoFechaLarga(resumen.ventana.fechaInicio)} al {formatoFechaLarga(resumen.ventana.fechaFin)}.
            {' '}Abre {textoDias(resumen.diasParaInicio)}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4" role="status">
      <CalendarX className="h-6 w-6 shrink-0 text-gray-500" aria-hidden="true" />
      <div>
        <p className="font-semibold text-gray-900">No hay evaluaciones programadas</p>
        <p className="text-sm text-gray-700">Cuando se defina el periodo de evaluación aparecerá marcado aquí.</p>
      </div>
    </div>
  );
}

const Calendar = ({ onClose }: CalendarProps) => {
  const hoy = new Date();
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [ventanas, setVentanas] = useState<VentanaEvaluacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const tituloId = useId();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let activo = true;
    getVentanasEvaluacion()
      .then((data) => {
        if (!activo) return;
        setVentanas(data);
        setMes(mesInicial(new Date(), data));
      })
      .catch(() => activo && setError(true))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // Los dashboards pasan onClose como función nueva en cada render; el ref evita re-enfocar en cada render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    cerrarRef.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, []);

  const cambiarMes = (delta: number) => setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const irAHoy = () => setMes(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const nombreMes = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="relative mx-auto max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Calendario de evaluación</p>
            <h2 id={tituloId} className="text-xl font-bold capitalize text-gray-900 sm:text-2xl" aria-live="polite">
              {nombreMes}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={irAHoy}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              ref={cerrarRef}
              type="button"
              onClick={onClose}
              aria-label="Cerrar calendario"
              className="rounded-full p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          {cargando && <p className="text-sm text-gray-500">Cargando fechas de evaluación…</p>}
          {!cargando && error && (
            <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700" role="alert">
              No pudimos cargar las fechas de evaluación. Intenta de nuevo más tarde.
            </p>
          )}
          {!cargando && !error && <ResumenBanner ventanas={ventanas} hoy={hoy} />}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2" role="grid" aria-label={`Días de ${nombreMes}`}>
          {DIAS_SEMANA.map((d) => (
            <div key={d.corto} role="columnheader" className="py-1 text-center text-xs font-bold text-gray-500 sm:text-sm">
              <abbr title={d.largo} className="no-underline">{d.corto}</abbr>
            </div>
          ))}

          {celdasDelMes(mes).map((dia, i) => {
            if (!dia) return <div key={`vacio-${i}`} role="gridcell" aria-hidden="true" />;
            const estado = estadoDelDia(dia, ventanas);
            const esHoy = mismoDia(dia, hoy);
            const fechaTexto = dia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
            return (
              <div
                key={dia.toISOString()}
                role="gridcell"
                aria-current={esHoy ? 'date' : undefined}
                aria-label={`${fechaTexto}${esHoy ? ', hoy' : ''}, ${DESCRIPCION_DIA[estado]}`}
                title={estado === 'normal' ? undefined : DESCRIPCION_DIA[estado]}
                className={`flex min-h-[48px] flex-col items-center justify-center rounded-lg text-sm font-semibold sm:min-h-[60px] sm:text-base ${ESTILO_DIA[estado]} ${esHoy ? 'ring-2 ring-gray-900 ring-offset-1' : ''}`}
              >
                <span>{dia.getDate()}</span>
                {(ETIQUETA_DIA[estado] || esHoy) && (
                  <span className="text-[10px] font-medium uppercase leading-none sm:text-[11px]" aria-hidden="true">
                    {ETIQUETA_DIA[estado] || 'Hoy'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border-2 border-[#F87171] bg-[#FECACA]" aria-hidden="true" />
            Apertura y cierre
          </li>
          <li className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-[#FECACA] bg-[#FEF2F2]" aria-hidden="true" />
            Evaluación abierta
          </li>
          <li className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-white ring-2 ring-gray-900" aria-hidden="true" />
            Hoy
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default Calendar;
