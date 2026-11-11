"""Genera la matriz en el formato 'Formato Casos y Escenarios de Pruebas.xlsx' + RTM, CSV y Markdown desde datos.py.
   uso: python generar.py <ruta-del-formato.xlsx> <ruta-del-RTM.xlsx>"""
import csv, sys, copy
from pathlib import Path
from openpyxl import load_workbook
from datos import *

fmt, rtm = sys.argv[1], sys.argv[2]
AQUI = Path(__file__).parent
ESTADO = {c[0]: "Pass" for c in CASOS}          # todos ejecutados y verificados (ver evidencias)
ESTADO["CP-IA-01"] = "Fail"                      # DeepEval no cumple los umbrales: defecto abierto en el componente de IA
ESTADO["CP-REG-01"] = "Fail"                     # las 11 fallas heredadas persisten (deuda de pruebas), 0 nuevas

def copiar(origen, destino):
    destino._style = copy.copy(origen._style)

wb = load_workbook(fmt)
for n in list(wb.sheetnames):
    if n not in ("Matríz Escenarios de Prueba", "Matriz Casos de Prueba") and not n.startswith("Casos de Prueba Detallado Julia"):
        del wb[n]

# ── Escenarios ──
ws = wb["Matríz Escenarios de Prueba"]
ws["B3"] = RESPONSABLE
plantilla = [copy.copy(ws.cell(8, c)._style) for c in range(1, 13)]
ws.delete_rows(8, ws.max_row)
for i, e in enumerate(ESCENARIOS):
    fila = 8 + i
    vals = [e[0], e[1], e[2], e[3], e[4], e[5], e[6], e[7], "Ejecutado", None, None, "Juliana"]
    for c, v in enumerate(vals, 1):
        cel = ws.cell(fila, c, v); cel._style = copy.copy(plantilla[c - 1])
    casos = [k for k in CASOS if k[1] == e[0]]
    ws.cell(fila, 10, f"=COUNTIFS('Matriz Casos de Prueba'!B:B,A{fila},'Matriz Casos de Prueba'!K:K,\"Pass\")/COUNTIFS('Matriz Casos de Prueba'!B:B,A{fila})")

# ── Casos ──
wc = wb["Matriz Casos de Prueba"]
tp = [copy.copy(wc.cell(3, c)._style) for c in range(1, 15)]
wc.delete_rows(3, wc.max_row)
for i, k in enumerate(CASOS):
    vals = [k[0], k[1], k[2], next(e[2] for e in ESCENARIOS if e[0] == k[1]), f"COND-{k[0][3:]}", k[3], k[4], k[5], k[6], k[7], ESTADO[k[0]], RESPONSABLE, None if k[10] == "—" else k[10], k[9]]
    for c, v in enumerate(vals, 1):
        cel = wc.cell(3 + i, c, v); cel._style = copy.copy(tp[c - 1])

# ── Casos detallados (bloques de 27 filas con el mismo estilo del primero) ──
wd = next(wb[n] for n in wb.sheetnames if n.startswith("Casos de Prueba Detallado Julia"))
wd.title = "Casos de Prueba Detallado Juliana"
molde = {(r, c): copy.copy(wd.cell(r, c)._style) for r in range(1, 28) for c in range(1, 7)}
alturas = {r: wd.row_dimensions[r].height for r in range(1, 28)}
combinadas = [str(m) for m in wd.merged_cells.ranges]
for m in combinadas: wd.unmerge_cells(m)
wd.delete_rows(2, wd.max_row)
wd["A1"] = "Caso de Prueba Detallado Juliana Franco - EntreAulas\t"
hdr = ["Paso", "Accion", "Datos", "Caso de prueba", "Procedimiento Caso de prueba", "Resultado esperado"]
for i, k in enumerate(CASOS):
    base = 2 + 27 * i
    esc = next(e for e in ESCENARIOS if e[0] == k[1])
    campos = [("Nombre del proyecto", PROYECTO), ("Codigo caso de prueba", k[0]), ("Escenario asociado", k[1]),
              ("Requisito asociado", f"{k[2]} - {esc[2]}"), ("ID Condicion Prueba", f"COND-{k[0][3:]}"), ("Condicion Prueba", k[3]),
              ("Descripcion", k[4]), ("Objetivo", f"Verificar: {k[3]}"), ("Criterio de exito", esc[9]), ("Nivel de prueba", k[5]), ("Tipo", k[6]),
              ("Prioridad", k[7]), ("Riesgo asociado", k[8]), ("Responsable", RESPONSABLE), ("Automatizable", k[9]),
              ("Caso de Prueba", f"{k[0]} - {k[3]}"), ("Procedimiento Caso de Prueba", f"Ejecutar {k[11]} (ver evidencia {k[12]})")]
    for j, (a, b) in enumerate(campos):
        r = base + 1 + j
        wd.cell(r, 1, a)._style = copy.copy(molde[(3 + j, 1)]); wd.cell(r, 2, b)._style = copy.copy(molde[(3 + j, 2)])
    for c, h in enumerate(hdr, 1):
        wd.cell(base + 20, c, h)._style = copy.copy(molde[(21, c)])
    for p, (acc, dat, esp) in enumerate(k[13]):
        r = base + 21 + p
        for c, v in enumerate([str(p + 1), acc, dat, f"{k[0]} - {k[3]}", f"Ejecutar {k[0]} / {k[1]}", esp], 1):
            wd.cell(r, c, v)._style = copy.copy(molde[(22 + p, c)])

# ── RTM (formato del RTM avanzado) ──
wr = load_workbook(rtm)
if "RTM" in wr.sheetnames:
    hoja = wr["RTM"]
    cab = [c.value for c in hoja[1]]
    estilos = [copy.copy(hoja.cell(2, c)._style) for c in range(1, len(cab) + 1)]
    hoja.delete_rows(2, hoja.max_row)
    sprint = "Sprint 4"
    for i, k in enumerate(CASOS):
        f = next((x for x in FUNCIONALIDADES if x[1] == k[2]), (k[2], k[2], "Transversal", "R3"))
        fila = {"HU": k[2], "RF/RNF": f[0], "Descripción Requerimiento": f[2], "Escenario": k[1], "Condición de Prueba": f"COND-{k[0][3:]}",
                "Caso de Prueba": k[0], "Nivel": k[5], "Tipo": k[6], "Prioridad": k[7], "Riesgo": k[8], "Sprint": sprint,
                "Automatizable": k[9], "Estado": ESTADO[k[0]], "Defecto": None if k[10] == "—" else k[10],
                "Severidad": "N/A" if k[10] == "—" else "Media", "Versión Probada": VERSION}
        for c, nombre in enumerate(cab, 1):
            v = fila.get(nombre)
            cel = hoja.cell(2 + i, c, v)
            if c <= len(estilos): cel._style = copy.copy(estilos[c - 1])
    wr.save(AQUI.parent / "RTM-EntreAulas-Final.xlsx")
wb.save(AQUI.parent / "Matriz-Casos-y-Escenarios-Final-Juliana.xlsx")

# ── CSV y Markdown ──
with open(AQUI.parent / "MATRIZ-TRAZABILIDAD-FINAL.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.writer(f); w.writerow(["HU", "RF", "Funcionalidad", "Escenario", "Caso", "Condición", "Nivel", "Tipo", "Prioridad", "Riesgo", "Herramienta / archivo", "Estado", "Defecto", "Evidencia"])
    for k in CASOS:
        fx = next((x for x in FUNCIONALIDADES if x[1] == k[2]), ("—", k[2], "Transversal", ""))
        w.writerow([k[2], fx[0], fx[2], k[1], k[0], k[3], k[5], k[6], k[7], k[8], k[11], ESTADO[k[0]], k[10], k[12]])
n_pass = sum(v == "Pass" for v in ESTADO.values())
print(f"{len(CASOS)} casos, {n_pass} Pass, {len(CASOS)-n_pass} Fail; {len(ESCENARIOS)} escenarios")
