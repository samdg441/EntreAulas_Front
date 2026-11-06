"""DeepEval sobre el resumen cuantitativo de RF-IA-32.

El componente es AiService.summarizeFromRatings (sin Gemini). Node imprime los
resúmenes reales y esta métrica comprueba que el texto se mantiene fiel a las
notas: el conteo, el promedio y que una nota 99 no aparezca.

  pip install deepeval
  python ia-testing/deepeval/evaluar_resumen.py
  (Node usa ts-node del backend para llamar a AiService.summarizeFromRatings)
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

from deepeval.metrics import BaseMetric
from deepeval.test_case import LLMTestCase

RAIZ = Path(__file__).resolve().parents[2]
BACK = RAIZ.parent / "EntreAulas_Back"
GENERADOR = r"""
require('ts-node/register/transpile-only')
const { AiService } = require('./src/modules/ai-summary/ai.service.ts')
const casos = [
  { nombre: 'notas-5-4-3', ratings: [5, 4, 3], debe: ['3 respuestas cuantitativas', '4.00/5'], noDebe: ['99', '36'] },
  { nombre: 'notas-5-4-99', ratings: [5, 4, 99], debe: ['2 respuestas cuantitativas', '4.50/5'], noDebe: ['99', '36.00'] },
  { nombre: 'sin-notas-validas', ratings: [99, 0], debe: ['No hay respuestas cuantitativas válidas'], noDebe: ['99/5', '<script>'] },
]
const salida = casos.map((caso) => {
  const resumen = AiService.summarizeFromRatings(caso.ratings, 'profesor')
  return { ...caso, actual: resumen.summary, fuente: resumen.analysisSource }
})
console.log(JSON.stringify(salida))
"""


class FidelidadCuantitativa(BaseMetric):
    """El resumen dice el conteo y el promedio de las notas válidas, y no repite la nota descartada."""

    def __init__(self, threshold: float = 1.0) -> None:
        self.threshold = threshold
        self.score = 0.0
        self.reason = ""
        self.success = False

    def measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        meta = json.loads(test_case.expected_output or "{}")
        actual = test_case.actual_output or ""
        faltan = [parte for parte in meta["debe"] if parte not in actual]
        sobran = [parte for parte in meta["noDebe"] if parte in actual]
        self.score = 1.0 if not faltan and not sobran else 0.0
        self.success = self.score >= self.threshold
        self.reason = "fiel al cálculo" if self.success else f"faltan {faltan} sobran {sobran}"
        return self.score

    async def a_measure(self, test_case: LLMTestCase, *args, **kwargs) -> float:
        return self.measure(test_case)

    def is_successful(self) -> bool:
        return self.success


def resumenes_reales() -> list[dict]:
    proceso = subprocess.run(
        ["node", "-r", "ts-node/register/transpile-only", "-e", GENERADOR],
        cwd=BACK,
        capture_output=True,
        text=True,
        check=False,
    )
    if proceso.returncode != 0:
        raise SystemExit(proceso.stderr or proceso.stdout)
    return json.loads(proceso.stdout)


def main() -> None:
    metrica = FidelidadCuantitativa()
    fallos = []
    for caso in resumenes_reales():
        prueba = LLMTestCase(
            input=str(caso["ratings"]),
            actual_output=caso["actual"],
            expected_output=json.dumps({"debe": caso["debe"], "noDebe": caso["noDebe"]}, ensure_ascii=False),
        )
        metrica.measure(prueba)
        print(f"{caso['nombre']}: score {metrica.score} — {metrica.reason}")
        print(f"  fuente={caso['fuente']}")
        print(f"  {caso['actual'][:180]}")
        if not metrica.is_successful():
            fallos.append(caso["nombre"])
    if fallos:
        raise SystemExit(f"DeepEval no pasó: {', '.join(fallos)}")
    print("DeepEval: 3/3 fieles al cálculo.")


if __name__ == "__main__":
    main()
