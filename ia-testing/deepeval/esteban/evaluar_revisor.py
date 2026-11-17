"""DeepEval sobre el revisor de preguntas con IA de EntreAulas (RF-ENC-32, punto 14 — Esteban Arias).

Componente evaluado: revisarPregunta (EntreAulas_Back/src/modules/evaluations/revisor-preguntas.ts), el mismo que
responde POST /api/evaluations/questions/revisar. Se fuerza Ollama local (REVISOR_PROVEEDOR=ollama, temperatura 0):
los textos no salen de la máquina y el resultado es repetible.

Métricas:
  - DeteccionDeProblemas (BaseMetric propia): índice de Jaccard entre las etiquetas esperadas y las del modelo
    (1 si ambas están vacías). Con todas se agregan: acierto exacto, precisión/recall/F1 por etiqueta y
    falsos positivos en ítems correctos.
  - CorreccionVerificable (BaseMetric propia, sin LLM): en ítems con problemas, la sugerencia ya no contiene las
    marcas del problema (doble: sin «y/o/ni»; negativa: sin «no/nunca/ni»; sesgada: sin elogios ni pregunta;
    ambigua: sin términos vagos). Sirve además para medir qué tan indulgente es el juez de GEval.
  - GEval «Calidad de la sugerencia» (juez Ollama, con pasos de evaluación explícitos): solo en ítems con problemas;
    la versión sugerida debe conservar la intención, quitar el problema y quedar como un ítem Likert de una idea.
  - Robustez: el caso I1 intenta inyectar instrucciones; el revisor debe seguir detectando el problema.

  pip install deepeval      (4.3.2)
  python ia-testing/deepeval/esteban/evaluar_revisor.py [--sin-juez] [--reusar]
    --sin-juez  solo la detección (sin GEval)
    --reusar    usa salidas-revisor-<versión>.json en vez de volver a llamar al modelo
    --version=v2  sufijo de los archivos de salida (por defecto v2)
    --casos=casos_holdout.json  otro conjunto de casos (por defecto casos_preguntas.json)
    --proveedor=gemini  modelo evaluado (por defecto ollama, el que no saca datos de la máquina)
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

os.environ.setdefault("DEEPEVAL_TELEMETRY_OPT_OUT", "YES")
os.environ.setdefault("DEEPEVAL_DISABLE_DOTENV", "1")

from deepeval.metrics import BaseMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

AQUI = Path(__file__).resolve().parent
BACK = AQUI.parents[3] / "EntreAulas_Back"
VERSION = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--version=")), "v2")
SALIDAS = AQUI / f"salidas-revisor-{VERSION}.json"
RESULTADO = AQUI / f"resultados-revisor-{VERSION}.json"
MARCAS = {
    "doble": r"\b(y|e|o|ni)\b",
    "negativa": r"\b(no|nunca|ni|jamás)\b",
    "sesgada": r"(\?|¿|\b(excelente|brillante|mejor|maravillos[oa]|perfect[oa]|como todos saben)\b)",
    "ambigua": r"\b(adecuad[oa]s?|buen[oa]s?|bien|a veces|suficientes?|de calidad)\b",
}
ETIQUETAS = ["ambigua", "doble", "sesgada", "negativa"]
UMBRAL_EXACTITUD = 0.70
UMBRAL_RECALL_MACRO = 0.70
UMBRAL_GEVAL = 0.6

GENERADOR = r"""
require('dotenv').config()
process.env.REVISOR_PROVEEDOR = process.env.PROVEEDOR_EVALUADO || 'ollama'
require('ts-node/register/transpile-only')
const { revisarPregunta } = require('./src/modules/evaluations/revisor-preguntas.ts')
const casos = JSON.parse(require('fs').readFileSync(0, 'utf8'))
;(async () => {
  const salida = []
  for (const c of casos) {
    const inicio = Date.now()
    try {
      const r = await revisarPregunta(c.texto)
      salida.push({ id: c.id, ...r, ms: Date.now() - inicio })
    } catch (e) {
      salida.push({ id: c.id, error: String(e && e.message || e), ms: Date.now() - inicio })
    }
    process.stderr.write(`revisado ${c.id}\n`)
    if (process.env.REVISOR_PROVEEDOR === 'gemini') await new Promise((r) => setTimeout(r, Number(process.env.PAUSA_MS || 7000)))
  }
  console.log('@@JSON@@' + JSON.stringify(salida))
})()
"""


def correr_componente(casos: list[dict]) -> list[dict]:
    proveedor = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--proveedor=")), "ollama")
    proceso = subprocess.run(
        ["node", "-e", GENERADOR], cwd=BACK, input=json.dumps(casos), capture_output=True, text=True,
        encoding="utf-8", check=False, env={**os.environ, "PROVEEDOR_EVALUADO": proveedor},
    )
    if proceso.returncode != 0:
        raise SystemExit(proceso.stderr or proceso.stdout)
    avisos = [l for l in proceso.stderr.splitlines() if "Revisor de preguntas" in l or "429" in l or "quota" in l.lower()]
    for aviso in avisos[:5]:
        print(f"  aviso del componente: {aviso[:200]}")
    linea = next(l for l in proceso.stdout.splitlines() if l.startswith("@@JSON@@"))
    return json.loads(linea[len("@@JSON@@"):])


class DeteccionDeProblemas(BaseMetric):
    """Coincidencia entre las etiquetas esperadas (expected_output) y las del revisor (actual_output)."""

    def __init__(self, threshold: float = 1.0) -> None:
        self.threshold, self.score, self.reason, self.success = threshold, 0.0, "", False

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        esperado = set(json.loads(test_case.expected_output))
        real = set(json.loads(test_case.actual_output))
        union = esperado | real
        self.score = 1.0 if not union else len(esperado & real) / len(union)
        self.success = self.score >= self.threshold
        faltan, sobran = sorted(esperado - real), sorted(real - esperado)
        self.reason = "exacto" if self.success else f"faltan {faltan or '-'} · sobran {sobran or '-'}"
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self) -> str:
        return "Detección de problemas de redacción"


def evaluar_deteccion(casos: list[dict], salidas: dict[str, dict]) -> dict:
    metrica = DeteccionDeProblemas()
    por_etiqueta = {e: {"TP": 0, "FP": 0, "FN": 0} for e in ETIQUETAS}
    detalle, exactos, jaccard, fp_limpios, errores = [], 0, 0.0, 0, 0
    for c in casos:
        s = salidas[c["id"]]
        real = s.get("problemas", []) if "error" not in s else []
        errores += "error" in s
        caso = LLMTestCase(input=c["texto"], actual_output=json.dumps(real), expected_output=json.dumps(c["esperado"]))
        metrica.measure(caso)
        exactos += metrica.success
        jaccard += metrica.score
        if not c["esperado"] and real:
            fp_limpios += 1
        for e in ETIQUETAS:
            en_esp, en_real = e in c["esperado"], e in real
            if en_esp and en_real:
                por_etiqueta[e]["TP"] += 1
            elif en_real:
                por_etiqueta[e]["FP"] += 1
            elif en_esp:
                por_etiqueta[e]["FN"] += 1
        detalle.append({"id": c["id"], "texto": c["texto"], "esperado": c["esperado"], "obtenido": real,
                        "jaccard": round(metrica.score, 3), "veredicto": metrica.reason, "ms": s.get("ms"),
                        "error": s.get("error")})
    metricas = {}
    for e, k in por_etiqueta.items():
        p = k["TP"] / (k["TP"] + k["FP"]) if k["TP"] + k["FP"] else 0.0
        r = k["TP"] / (k["TP"] + k["FN"]) if k["TP"] + k["FN"] else 0.0
        f1 = 2 * p * r / (p + r) if p + r else 0.0
        metricas[e] = {**k, "precision": round(p, 3), "recall": round(r, 3), "f1": round(f1, 3)}
    exactitud = exactos / len(casos)
    recall_macro = sum(m["recall"] for m in metricas.values()) / len(metricas)
    limpios = sum(1 for c in casos if not c["esperado"])
    inyeccion = next((d for d in detalle if d["id"] in ("I1", "H8")), None)
    return {
        "casos": len(casos), "exactos": exactos, "exactitud": round(exactitud, 3),
        "jaccard_medio": round(jaccard / len(casos), 3), "recall_macro": round(recall_macro, 3),
        "falsos_positivos_en_limpios": f"{fp_limpios}/{limpios}", "errores_del_modelo": errores,
        "por_etiqueta": metricas, "inyeccion_resistida": bool(inyeccion and "doble" in inyeccion["obtenido"]) if inyeccion else None,
        "latencia_media_s": round(sum(d["ms"] or 0 for d in detalle) / len(detalle) / 1000, 1),
        "umbral_exactitud": UMBRAL_EXACTITUD, "umbral_recall_macro": UMBRAL_RECALL_MACRO,
        "cumple": exactitud >= UMBRAL_EXACTITUD and recall_macro >= UMBRAL_RECALL_MACRO,
        "detalle": detalle,
    }


class CorreccionVerificable(BaseMetric):
    """La sugerencia ya no contiene las marcas de los problemas esperados (context = etiquetas esperadas)."""

    def __init__(self, threshold: float = 1.0) -> None:
        self.threshold, self.score, self.reason, self.success = threshold, 0.0, "", False

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        texto = test_case.actual_output.lower()
        persisten = [e for e in test_case.context if re.search(MARCAS[e], texto)]
        self.score = 1.0 - len(persisten) / len(test_case.context)
        self.success = self.score >= self.threshold
        self.reason = "corregida" if self.success else f"persiste: {', '.join(persisten)}"
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success

    @property
    def __name__(self) -> str:
        return "Corrección verificable"


def evaluar_correccion(casos: list[dict], salidas: dict[str, dict]) -> dict:
    metrica = CorreccionVerificable()
    detalle = []
    for c in casos:
        s = salidas[c["id"]]
        if not c["esperado"] or "error" in s:
            continue
        metrica.measure(LLMTestCase(input=c["texto"], actual_output=s["sugerencia"], context=c["esperado"]))
        detalle.append({"id": c["id"], "sugerencia": s["sugerencia"], "ok": metrica.success, "razon": metrica.reason})
    ok = sum(d["ok"] for d in detalle)
    return {"evaluadas": len(detalle), "corregidas": ok, "tasa": round(ok / len(detalle), 3) if detalle else 0.0,
            "detalle": detalle}


def evaluar_sugerencias(casos: list[dict], salidas: dict[str, dict]) -> dict:
    from deepeval.models import OllamaModel

    juez = OllamaModel(model=os.getenv("OLLAMA_JUEZ", os.getenv("OLLAMA_MODEL", "qwen2.5:7b")),
                       base_url=os.getenv("OLLAMA_HOST", "http://localhost:11434"), temperature=0)
    metrica = GEval(
        name="Calidad de la sugerencia",
        criteria=(
            "El INPUT es un ítem de una encuesta de evaluación docente (escala Likert de acuerdo) que tiene un problema "
            "de redacción; el CONTEXTO dice cuál (ambigua, doble, sesgada o negativa). El ACTUAL OUTPUT es la versión "
            "corregida que propone el revisor. Califica alto solo si la versión corregida: (1) conserva la intención "
            "del ítem original; (2) ya no tiene el problema indicado: una sola idea, términos concretos y observables, "
            "sin adjetivos que induzcan la respuesta y redactada en positivo; (3) es una afirmación breve en español "
            "que un estudiante puede calificar de 1 a 5. Califica bajo si conserva el problema o cambia el sentido."
        ),
        evaluation_steps=[
            "Lee el problema indicado en el CONTEXTO y el ítem original (INPUT).",
            "Si el problema es 'doble' y el ACTUAL OUTPUT todavía une dos conductas o cualidades con 'y', 'o' o 'ni', el puntaje es 0.",
            "Si el problema es 'negativa' y el ACTUAL OUTPUT todavía usa 'no', 'nunca' o 'ni', el puntaje es 0.",
            "Si el problema es 'sesgada' y el ACTUAL OUTPUT conserva elogios ('excelente', 'muy', 'brillante') o es una pregunta, el puntaje es 0.",
            "Si el problema es 'ambigua' y el ACTUAL OUTPUT conserva un término vago ('adecuado', 'bueno', 'bien', 'suficiente'), el puntaje es 0.",
            "Si el ACTUAL OUTPUT es igual al INPUT, el puntaje es 0.",
            "Si quitó el problema, verifica que conserve la intención del ítem original y sea una afirmación breve calificable de 1 a 5.",
        ],
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT, LLMTestCaseParams.CONTEXT],
        model=juez,
        threshold=UMBRAL_GEVAL,
    )
    resultados = []
    for c in casos:
        s = salidas[c["id"]]
        if not c["esperado"] or "error" in s:
            continue
        caso = LLMTestCase(input=c["texto"], actual_output=s["sugerencia"], context=[f"Problema: {', '.join(c['esperado'])}"])
        metrica.measure(caso)
        resultados.append({"id": c["id"], "original": c["texto"], "sugerencia": s["sugerencia"],
                           "score": round(float(metrica.score), 3), "ok": bool(metrica.is_successful()),
                           "razon": metrica.reason})
        print(f"  GEval {c['id']}: {resultados[-1]['score']} {'ok' if resultados[-1]['ok'] else 'bajo'} · {s['sugerencia'][:80]}")
    aprobadas = sum(r["ok"] for r in resultados)
    return {"juez": juez.get_model_name(), "umbral": UMBRAL_GEVAL, "evaluadas": len(resultados), "aprobadas": aprobadas,
            "tasa": round(aprobadas / len(resultados), 3) if resultados else 0.0,
            "score_medio": round(sum(r["score"] for r in resultados) / len(resultados), 3) if resultados else 0.0,
            "detalle": resultados}


def main() -> None:
    usar_juez = "--sin-juez" not in sys.argv
    archivo = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--casos=")), "casos_preguntas.json")
    casos = json.loads((AQUI / archivo).read_text(encoding="utf-8"))["casos"]
    if "--reusar" in sys.argv and SALIDAS.exists():
        lista = json.loads(SALIDAS.read_text(encoding="utf-8"))
    else:
        inicio = time.time()
        lista = correr_componente(casos)
        print(f"Componente: {len(lista)} revisiones en {time.time() - inicio:.0f} s")
        SALIDAS.write_text(json.dumps(lista, ensure_ascii=False, indent=2), encoding="utf-8")
    salidas = {s["id"]: s for s in lista}

    deteccion = evaluar_deteccion(casos, salidas)
    print(f"Detección: exactitud {deteccion['exactitud']} ({deteccion['exactos']}/{deteccion['casos']}) · "
          f"Jaccard medio {deteccion['jaccard_medio']} · recall macro {deteccion['recall_macro']} · "
          f"falsos positivos en ítems correctos {deteccion['falsos_positivos_en_limpios']} · "
          f"inyección resistida {deteccion['inyeccion_resistida']}")
    for e, m in deteccion["por_etiqueta"].items():
        print(f"  {e:9} precisión {m['precision']} · recall {m['recall']} · F1 {m['f1']}  (TP {m['TP']} FP {m['FP']} FN {m['FN']})")
    for d in deteccion["detalle"]:
        if d["jaccard"] < 1:
            print(f"  ✗ {d['id']}: esperado {d['esperado']} · obtenido {d['obtenido']} — {d['texto']}")

    correccion = evaluar_correccion(casos, salidas)
    print(f"Corrección verificable: {correccion['corregidas']}/{correccion['evaluadas']} sugerencias sin las marcas del problema")
    for d in correccion["detalle"]:
        if not d["ok"]:
            print(f"  ✗ {d['id']}: {d['razon']} · {d['sugerencia'][:80]}")

    sugerencias = evaluar_sugerencias(casos, salidas) if usar_juez else None
    if sugerencias:
        print(f"Sugerencias (GEval, juez {sugerencias['juez']}): {sugerencias['aprobadas']}/{sugerencias['evaluadas']} "
              f"≥ {UMBRAL_GEVAL} · score medio {sugerencias['score_medio']}")
        verif = {d["id"]: d["ok"] for d in correccion["detalle"]}
        acuerdo = sum(1 for g in sugerencias["detalle"] if g["ok"] == verif.get(g["id"]))
        indulgentes = [g["id"] for g in sugerencias["detalle"] if g["ok"] and not verif.get(g["id"])]
        sugerencias["acuerdo_con_verificable"] = f"{acuerdo}/{len(sugerencias['detalle'])}"
        sugerencias["aprobadas_por_el_juez_con_el_problema"] = indulgentes
        print(f"  Acuerdo juez/verificación: {acuerdo}/{len(sugerencias['detalle'])} · el juez aprobó con el problema: {indulgentes or 'ninguna'}")

    RESULTADO.write_text(json.dumps({"version": VERSION, "deteccion": deteccion, "correccion_verificable": correccion,
                                     "sugerencias": sugerencias}, ensure_ascii=False, indent=2),
                         encoding="utf-8")
    print(f"Resultado guardado en {RESULTADO.name}")
    if not deteccion["cumple"]:
        raise SystemExit(f"DeepEval: la detección NO cumple los umbrales (exactitud ≥ {UMBRAL_EXACTITUD} y recall macro ≥ {UMBRAL_RECALL_MACRO}).")


if __name__ == "__main__":
    main()
