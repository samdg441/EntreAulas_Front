import http from 'node:http'
import https from 'node:https'
import type { ClientLLM } from '@browserbasehq/stagehand'

type GenerateInput = Parameters<ClientLLM['generate']>[0]
type GenerateOutput = Awaited<ReturnType<ClientLLM['generate']>>

type OllamaResponse = {
  choices?: Array<{ message?: { content?: string } }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

function contentAsText(content: GenerateInput['messages'][number]['content']): string {
  const blocks = Array.isArray(content) ? content : [content]
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.text
      if (block.type === 'image') return `[Imagen ${block.mimeType} omitida del mensaje]`
      if (block.type === 'tool_use') return JSON.stringify({ tool: block.name, input: block.input })
      return JSON.stringify({ toolResult: block.toolUseId, content: block.content })
    })
    .join('\n')
}

/**
 * POST sin límite de tiempo: en CPU una inferencia de qwen2.5:7b sobre una página grande supera los 300 s
 * que fetch (undici) espera por las cabeceras, y la prueba caía con «fetch failed».
 */
function postJson(url: string, headers: Record<string, string>, body: string): Promise<{ status: number; text: string }> {
  const destino = new URL(url)
  const cliente = destino.protocol === 'https:' ? https : http
  return new Promise((resolve, reject) => {
    const req = cliente.request(destino, { method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      let text = ''
      res.setEncoding('utf8')
      res.on('data', (parte) => (text += parte))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, text }))
    })
    req.setTimeout(0)
    req.on('error', reject)
    req.end(body)
  })
}

/** Adaptador Ollama → API compatible con OpenAI (Stagehand 4 no trae proveedor nativo "ollama/..."). */
export function createOllamaClient(): ClientLLM {
  const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1').replace(/\/$/, '')
  const apiKey = process.env.OLLAMA_API_KEY ?? 'ollama'
  const model = process.env.OLLAMA_MODEL ?? 'qwen2.5:7b'

  const generate = async (input: GenerateInput): Promise<GenerateOutput> => {
    const responseFormat = input.responseFormat ?? { type: 'text' as const }
    const messages = [
      ...(input.systemPrompt ? [{ role: 'system' as const, content: input.systemPrompt }] : []),
      ...input.messages.map((message) => ({
        role: message.role,
        content: contentAsText(message.content),
      })),
    ]

    const response = await postJson(
      `${baseUrl}/chat/completions`,
      { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      JSON.stringify({
        model,
        messages,
        temperature: input.temperature ?? 0,
        stream: false,
        ...(responseFormat.type === 'json_schema'
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: responseFormat.name,
                  schema: responseFormat.schema,
                  strict: true,
                },
              },
            }
          : {}),
      })
    )

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Ollama respondió ${response.status}: ${response.text}`)
    }

    const result = JSON.parse(response.text) as OllamaResponse
    const text = result.choices?.[0]?.message?.content
    if (!text) throw new Error('Ollama no devolvió contenido.')

    const usage = result.usage
      ? {
          inputTokens: result.usage.prompt_tokens ?? 0,
          outputTokens: result.usage.completion_tokens ?? 0,
          totalTokens: result.usage.total_tokens ?? 0,
        }
      : undefined

    if (responseFormat.type === 'json_schema') {
      return {
        role: 'assistant',
        content: { type: 'text', text },
        outputFormat: 'json_schema',
        structuredContent: JSON.parse(text),
        usage,
      }
    }

    return {
      role: 'assistant',
      content: { type: 'text', text },
      outputFormat: 'text',
      usage,
    }
  }

  return { generate }
}
