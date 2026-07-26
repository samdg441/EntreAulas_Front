// components/Avatar.tsx
import * as React from "react";

export function Avatar({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}
      {...props}
    />
  );
}

export function AvatarImage({
  src,
  alt,
  className = "",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  if (!src) return null; // 👈 evita renderizar img vacía
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  );
}


interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string; // mostrará iniciales derivadas (por ejemplo, nombre/apellido o email)
}

export function AvatarFallback({
  className = "",
  text,
  ...props
}: AvatarFallbackProps) {
  const getInitials = (value?: string) => {
    if (!value) return ''
    const cleaned = value.trim()
    if (!cleaned) return ''
    // Si es email, usar primera letra antes del @
    if (cleaned.includes('@')) return cleaned[0]?.toUpperCase() ?? ''
    const parts = cleaned.split(/\s+/)
    const first = parts[0]?.[0] ?? ''
    const second = parts.length > 1 ? parts[1]?.[0] ?? '' : ''
    return (first + second).toUpperCase()
  }

  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold ${className}`}
      {...props}
    >
      {getInitials(text)}
    </div>
  );
}
