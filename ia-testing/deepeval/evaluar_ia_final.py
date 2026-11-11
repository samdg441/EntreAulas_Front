"""DeepEval sobre el componente de IA de EntreAulas: detección de indicios de acoso (RQ31) y resumen de comentarios (RQ29).

Componente evaluado: AiService.summarizeOpenResponses (EntreAulas_Back/src/modules/ai-summary/ai.service.ts), el mismo
que usan el dashboard del coordinador y los reportes. Se ejecuta sin Gemini (GEMINI_API_KEY vacío) para que el resultado
sea determinista y no salga ningún dato de la máquina.

Métricas de DeepEval:
  - DeteccionDeAcoso (BaseMetric propia): exactitud por caso; aquí se agregan precisión, exhaustividad (recall) y F1.
  - GEval «Fidelidad del resumen»: un LLM local (Ollama · qwen2.5:7b) juzga si el resumen refleja los comentarios sin inventar.

  python3 -m venv .venv && .venv/bin/pip install deepeval
  .venv/bin/python ia-testing/deepeval/evaluar_ia_final.py [--sin-juez]
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")
os.environ.setdefault("DEEPEVAL_DISABLE_DOTENV", "1")

from deepeval.metrics import BaseMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

AQUI = Path(__file__).resolve().parent
BACK = AQUI.parents[2] / "EntreAulas_Back"
SALIDA = AQUI / "resultados-final.json"
UMBRAL_RECALL = 0.90
UMBRAL_PRECISION = 0.80

GENERADOR = r"""
process.env.GEMINI_API_KEY = ''
process.env.GOOGLE_API_KEY = ''
require('ts-node/register/transpile-only')
const { AiService } = require('./src/modules/ai-summary/ai.service.ts')
const entrada = JSON.parse(require('fs').readFileSync(0, 'utf8'))
;(async () => {
  const salida = []
  for (const texto of entrada.comentarios) {
    const r = await AiService.summarizeOpenResponses([texto], 'profesor')
    salida.push({ texto, acosoDetectado: Boolean(r.acosoDetectado) })
  }
  const resumenes = []
  for (const grupo of entrada.resumenes) {
    const r = await AiService.summarizeOpenResponses(grupo, 'profesor')
    resumenes.push({ comentarios: grupo, resumen: r.summary, temas: r.topics, acoso: Boolean(r.acosoDetectado) })
  }
  console.log('@@JSON@@' + JSON.stringify({ salida, resumenes }))
})()
"""


def correr_componente(comentarios: list[str], resumenes: list[list[str]]) -> dict:
    proceso = subprocess.run(
        ["node", "-e", GENERADOR],
        cwd=BACK, input=json.dumps({"comentarios": comentarios, "resumenes": resumenes}),
        capture_output=True, text=True, check=False,
    )
    if proceso.returncode != 0:
        raise SystemExit(proceso.stderr or proceso.stdout)
    linea = next(l for l in proceso.stdout.splitlines() if l.startswith("@@JSON@@"))
    return json.loads(linea[len("@@JSON@@"):])


class DeteccionDeAcoso(BaseMetric):
    """El componente marca la alerta exactamente cuando el comentario es de acoso."""

    def __init__(self, threshold: float = 1.0) -> None:
        self.threshold, self.score, self.reason, self.success = threshold, 0.0, "", False

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        esperado, real = test_case.expected_output, test_case.actual_output
        self.score = 1.0 if esperado == real else 0.0
        self.success = self.score >= self.threshold
        tipo = "TP" if esperado == "acoso" == real else "TN" if esperado == real else "FP" if real == "acoso" else "FN"
        self.reason = tipo
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self) -> str:  # nombre que DeepEval muestra
        return "Detección de acoso"


def evaluar_deteccion(datos: dict) -> dict:
    etiquetas = [(t, "acoso") for t in datos["acoso"]] + [(t, "normal") for t in datos["normal"]]
    real = correr_componente([t for t, _ in etiquetas], [])["salida"]
    metrica = DeteccionDeAcoso()
    conteo = {"TP": 0, "TN": 0, "FP": 0, "FN": 0}
    detalle = []
    for (texto, esperado), obtenido in zip(etiquetas, real):
        caso = LLMTestCase(input=texto, actual_output="acoso" if obtenido["acosoDetectado"] else "normal", expected_output=esperado)
        metrica.measure(caso)
        conteo[metrica.reason] += 1
        if metrica.reason in ("FP", "FN"):
            detalle.append({"tipo": metrica.reason, "comentario": texto})
    tp, fp, fn, tn = conteo["TP"], conteo["FP"], conteo["FN"], conteo["TN"]
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "casos": len(etiquetas), **conteo, "precision": round(precision, 3), "recall": round(recall, 3), "f1": round(f1, 3),
        "exactitud": round((tp + tn) / len(etiquetas), 3), "errores": detalle,
        "umbral_recall": UMBRAL_RECALL, "umbral_precision": UMBRAL_PRECISION,
        "cumple": recall >= UMBRAL_RECALL and precision >= UMBRAL_PRECISION,
    }


def evaluar_resumenes(datos: dict, usar_juez: bool) -> list[dict]:
    resumenes = correr_componente([], datos["resumenes"])["resumenes"]
    resultados = []
    juez = None
    if usar_juez:
        from deepeval.models import OllamaModel

        juez = OllamaModel(model=os.getenv("OLLAMA_MODEL", "qwen2.5:7b"), base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"), temperature=0)
        metrica = GEval(
            name="Fidelidad del resumen",
            criteria=(
                "Evalúa si el RESUMEN (actual output) refleja los temas que aparecen en los COMENTARIOS (input), "
                "sin inventar hechos, nombres ni cifras que no estén en los comentarios, y se entiende en español."
            ),
            evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
            model=juez,
            threshold=0.5,
        )
    for r in resumenes:
        item = {"comentarios": r["comentarios"], "resumen": r["resumen"], "temas": r["temas"], "acoso_falso": r["acoso"]}
        if usar_juez:
            caso = LLMTestCase(input="\n".join(f"- {c}" for c in r["comentarios"]), actual_output=r["resumen"])
            metrica.measure(caso)
            item.update({"geval_score": round(float(metrica.score), 3), "geval_razon": metrica.reason, "geval_ok": bool(metrica.is_successful())})
        resultados.append(item)
    return resultados


def main() -> None:
    usar_juez = "--sin-juez" not in sys.argv
    datos = json.loads((AQUI / "casos_comentarios.json").read_text(encoding="utf-8"))
    deteccion = evaluar_deteccion(datos)
    print(f"Detección de acoso: precisión {deteccion['precision']} · recall {deteccion['recall']} · F1 {deteccion['f1']} · exactitud {deteccion['exactitud']}")
    print(f"  TP {deteccion['TP']} · TN {deteccion['TN']} · FP {deteccion['FP']} · FN {deteccion['FN']}")
    for e in deteccion["errores"]:
        print(f"  {e['tipo']}: {e['comentario']}")
    resumenes = evaluar_resumenes(datos, usar_juez)
    for r in resumenes:
        print(f"Resumen: {r['resumen'][:110]}…" + (f"  → GEval {r.get('geval_score')} ({'ok' if r.get('geval_ok') else 'bajo'})" if usar_juez else ""))
    SALIDA.write_text(json.dumps({"deteccion": deteccion, "resumenes": resumenes}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Resultado guardado en {SALIDA.name}")
    if not deteccion["cumple"]:
        raise SystemExit("DeepEval: la detección de acoso NO cumple los umbrales (precisión ≥ 0.80 y recall ≥ 0.90).")


if __name__ == "__main__":
    main()
