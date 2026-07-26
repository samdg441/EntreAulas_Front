import React, { useState, useEffect } from 'react'
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './Card'
import Button from './Button'
import Badge from './Badge'
import { summarizeOpenResponses } from '../api/ai'
import { apiClient } from '../api/client'

type Props = {
  texts?: string[]
  title?: string
  description?: string
  // Opción para llamar directamente a endpoints del backend
  endpoint?: 'by-professor' | 'by-career' | 'by-faculty'
  params?: {
    profesor_id?: string
    carrera_id?: string
    periodo_id?: string | number
    // Para by-career y by-faculty no se necesita profesor_id
  }
}

export default function AISummaryCard({ texts, title, description, endpoint, params }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ 
    summary: string; 
    topics: string[]; 
    textsCount?: number;
    ratingsCount?: number;
    analysisSource?: 'open_text' | 'quantitative_fallback';
    acosoDetectado?: boolean;
    mensajeAcoso?: string;
    acosoProfesores?: Array<{
      profesorId: string;
      nombre: string;
      menciones: number;
      ejemplos: string[];
    }>;
  } | null>(null)
  
  // hasData es true si:
  // 1. Hay endpoint configurado (el backend manejará la validación de params)
  // 2. O si hay textos directos con contenido
  const getHasData = () => {
    // Si hay textos directos, usar esos
    if (texts && texts.length > 0) return true
    
    // Si hay endpoint configurado, considerarlo válido (el backend validará los params)
    // Esto permite que el usuario siempre pueda hacer clic para ver el error real
    if (endpoint) {
      return true // Siempre permitir intentar si hay endpoint
    }
    
    return false
  }
  
  // Debug: Log cuando cambian los props
  useEffect(() => {
    if (endpoint) {
      const dataValid = getHasData()
      console.log('🔍 AISummaryCard - Props:', { 
        endpoint, 
        params, 
        hasTexts: texts?.length || 0,
        hasData: dataValid,
        profesor_id: params?.profesor_id,
        periodo_id: params?.periodo_id
      })
    }
  }, [endpoint, params, texts])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)
      
      console.log('🚀 [AISummaryCard] Intentando generar resumen...', { endpoint, params, hasEndpoint: !!endpoint, hasParams: !!params })
      
      // Si hay endpoint, intentar usarlo siempre (incluso si falta algún param para ver el error)
      if (endpoint) {
        if (!params) {
          const errorMsg = 'Faltan parámetros necesarios. Verifica la configuración.'
          console.error('❌ [AISummaryCard]', errorMsg)
          setError(errorMsg)
          return
        }
        
        const url = `/api/ai/summarize/${endpoint}`
        console.log(`📡 [AISummaryCard] Llamando a: ${url}`, { params })
        
        try {
          const { data } = await apiClient.get(url, { params })
          console.log('✅ [AISummaryCard] Respuesta recibida:', { 
            textsCount: data.textsCount, 
            summaryLength: data.summary?.length,
            topicsCount: data.topics?.length
          })
          setResult(data)
        } catch (apiError: any) {
          console.error('❌ [AISummaryCard] Error en API:', {
            status: apiError.response?.status,
            data: apiError.response?.data,
            message: apiError.message,
            url,
            params
          })
          throw apiError
        }
      } 
      // Si hay textos directos, enviarlos
      else if (texts && texts.length > 0) {
        console.log(`📝 [AISummaryCard] Usando ${texts.length} textos directos`)
        const r = await summarizeOpenResponses(texts)
        setResult(r)
      } 
      else {
        const errorMsg = 'No hay datos para generar el resumen. Configura un endpoint o proporciona textos directos.'
        console.warn('⚠️ [AISummaryCard]', errorMsg)
        setError(errorMsg)
      }
    } catch (e: any) {
      console.error('❌ [AISummaryCard] Error generando resumen:', e)
      const errorMessage = e.response?.data?.error || 
                           e.response?.data?.details ||
                           e.message || 
                           'No se pudo generar el resumen automáticamente'
      
      console.error('   Detalles completos:', {
        message: errorMessage,
        response: e.response?.data,
        status: e.response?.status,
        stack: e.stack
      })
      
      setError(`${errorMessage} ${process.env.NODE_ENV === 'development' ? `(Status: ${e.response?.status || 'N/A'})` : ''}`)
    } finally {
      setLoading(false)
    }
  }
  
  const hasData = getHasData()

  return (
    <Card className="bg-white shadow-md border border-gray-200">
      <CardHeader>
        <CardTitle>{title || 'Resumen automático de respuestas abiertas (IA)'}</CardTitle>
        <CardDescription>
          {description || 'Generado con Google Gemini y extracción local de temas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="min-w-[180px]"
            >
              {loading ? 'Generando…' : 'Generar resumen IA'}
            </Button>
          </div>
          {!hasData && !loading && !endpoint && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              <p className="font-semibold mb-1">ℹ️ Información:</p>
              <p className="text-xs">No hay endpoint configurado. Configura un endpoint en el componente padre.</p>
            </div>
          )}
        </div>
        {error && (
          <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="font-semibold mb-1">❌ Error:</p>
            <p className="mb-2">{error}</p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-red-700 hover:text-red-900">
                  Ver detalles técnicos
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                  Revisa la consola del navegador (F12) para más detalles
                </pre>
              </details>
            )}
          </div>
        )}
        {result && result.textsCount === 0 && result.analysisSource !== 'quantitative_fallback' && (
          <div className="text-sm text-amber-600 mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
            <p className="font-semibold mb-2">⚠️ No se encontraron respuestas abiertas</p>
            <p className="mb-2">{result.summary}</p>
            {process.env.NODE_ENV === 'development' && result.sqlCommand && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-700 hover:text-amber-900">
                  Ver comando SQL para verificar en Supabase
                </summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto font-mono">
                  {result.sqlCommand}
                </pre>
                <p className="mt-2 text-xs text-gray-600">
                  💡 Copia este SQL y ejecútalo en Supabase SQL Editor para ver qué datos hay en la BD
                </p>
              </details>
            )}
          </div>
        )}
        {result && (result.textsCount > 0 || result.analysisSource === 'quantitative_fallback') && (
          <div className="space-y-3">
            {result.analysisSource === 'quantitative_fallback' ? (
              <p className="text-xs text-blue-600">
                ✅ Resumen cualitativo generado desde {result.ratingsCount ?? 0} respuestas cuantitativas (sin texto abierto suficiente)
              </p>
            ) : result.textsCount !== undefined && (
              <p className="text-xs text-gray-500">
                ✅ Analizadas {result.textsCount} respuestas abiertas
              </p>
            )}
            {result.acosoDetectado && result.mensajeAcoso && (
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-red-600 text-xl font-bold">⚠️</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-red-800 mb-1">ALERTA DE ACOSO DETECTADO</h4>
                    <p className="text-sm text-red-700 whitespace-pre-line">{result.mensajeAcoso}</p>
                  </div>
                </div>
              </div>
            )}
            {result.acosoProfesores && result.acosoProfesores.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-rose-800 mb-2">Docentes vinculados a menciones de acoso</h4>
                <ul className="text-sm text-rose-700 space-y-1">
                  {result.acosoProfesores.slice(0, 5).map((p, i) => (
                    <li key={`${p.profesorId}-${i}`}>
                      {p.nombre}: {p.menciones} mención(es)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Resumen</h4>
              <p className="text-sm text-gray-700 whitespace-pre-line">{result.summary}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Temas más mencionados</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.topics.length > 0 ? (
                  result.topics.map((t, i) => (
                    <Badge key={i} variant="outline">{t}</Badge>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No se identificaron temas específicos</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


