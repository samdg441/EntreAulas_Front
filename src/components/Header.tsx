import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import UserMenu from './UserMenu';
import NotificationDropdown from './NotificationDropdown';
import { ArrowLeft } from 'lucide-react';
import { User } from '../types';

// Importar imágenes
import logoUniversidadImg from '../assets/logo_conciencia.webp';

const logoUniversidad = logoUniversidadImg;

interface HeaderProps {
  user?: User;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: React.ReactNode;
}

export default function Header({ 
  user, 
  title, 
  subtitle, 
  showBackButton = false, 
  onBack, 
  children 
}: HeaderProps) {
  const navigate = useNavigate();

  console.log('🏠 Header renderizado con user:', user);

  const handleLogoClick = () => {
    navigate('/dashboard');
  };
  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-4 py-4 sm:py-6 lg:py-1"
      >
        <div className="w-full">
          {/* Primera fila: logo a la izquierda, usuario a la derecha */}
          <div className="flex items-center justify-between w-full">
            {/* Logo y nombre de la universidad - Reducido para móviles */}
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.img
                src={logoUniversidad}
                alt="Logo Universidad de Medellín"
                className="h-16 w-16 sm:h-20 sm:w-20 lg:h-[120px] lg:w-auto object-contain cursor-pointer select-none"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleLogoClick}
                role="button"
                aria-label="Ir al inicio"
                title="Ir al inicio"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900">EntreAulas</h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">Universidad de Medellín</p>
              </div>
            </div>
            
            {/* Título y subtítulo centrados - Solo visible en desktop */}
            {(title || subtitle) && (
              <div className="hidden lg:flex flex-col items-center flex-1 mx-4">
                {title && <h2 className="text-xl font-semibold text-gray-900 text-center" style={{ marginLeft: '-330px' }}>{title}</h2>}
                  <p className="text-sm text-gray-600 text-center mt-1" style={{ marginLeft: '-330px' }}>
    {subtitle}
  </p>
              </div>
            )}
            
            {/* Elementos del usuario (campana y menú de usuario) */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user && (
                <>
                  <NotificationDropdown />
                  <UserMenu />
                </>
              )}
            </div>
          </div>

          {/* Segunda fila: título y subtítulo para móviles */}
          <div className="w-full mt-4 lg:mt-2">
            {/* Título y subtítulo para móviles */}
            {(title || subtitle) && (
              <div className="lg:hidden text-center mb-2">
                {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            )}

            {/* Contenido adicional */}
            {children && (
              <div>
                {children}
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Botón de retroceso fuera del header */}
      {showBackButton && onBack && (
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      )}
    </>
  );
}