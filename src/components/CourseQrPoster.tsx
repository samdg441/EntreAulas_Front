import QRCode from 'react-qr-code';
import logoProyecto from '../assets/logo_conciencia.webp';

interface CourseQrPosterProps {
  url: string;
  nombreMateria: string;
  grupo: string;
  nombreProfesor: string;
}

/**
 * QR negro sobre blanco (máxima lectura en celulares).
 * Logo pequeño al centro con level="H" (alta corrección de errores).
 */
export function CourseQrPoster({
  url,
  nombreMateria,
  grupo,
  nombreProfesor,
}: CourseQrPosterProps) {
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 w-[280px] min-h-[380px] relative overflow-hidden flex flex-col py-3">
      <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-university-red rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-university-red rounded-tr-3xl" />

      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-university-red rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-university-red rounded-br-3xl" />

      <div className="relative z-10 w-full flex flex-col items-center gap-2 px-3">
        <div className="text-center pt-1">
          <p className="text-sm font-extrabold leading-tight tracking-wide text-university-red uppercase">
            {nombreMateria}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-gray-800 uppercase tracking-wide">
            Grupo {grupo}
          </p>
        </div>

        {/* QR + logo centrado (H = tolera el hueco del logo) */}
        <div className="relative rounded-lg bg-white p-2 border border-gray-200 shadow-sm">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200">
              <img
                src={logoProyecto}
                alt="EntreAulas"
                className="h-7 w-7 object-contain"
              />
            </div>
          </div>
          <QRCode
            value={url}
            size={200}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#000000"
          />
        </div>

        <div className="text-center pb-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">
            Docente
          </p>
          <p className="text-sm font-bold leading-snug text-gray-900 mt-0.5">
            {nombreProfesor}
          </p>
        </div>
      </div>
    </div>
  );
}
