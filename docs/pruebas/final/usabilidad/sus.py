"""Calcula el SUS (System Usability Scale). Entrada: respuestas 1–5 de las 10 preguntas por participante.
   python sus.py respuestas.csv   (una fila por participante, 10 columnas)"""
import csv, sys, statistics as st

def sus(r):
    # ítems impares (1,3,5,7,9): r-1; pares: 5-r; suma × 2.5
    return sum((x - 1) if i % 2 == 0 else (5 - x) for i, x in enumerate(r)) * 2.5

if __name__ == "__main__":
    filas = [[int(x) for x in f] for f in csv.reader(open(sys.argv[1])) if f]
    pts = [sus(f) for f in filas]
    print(f"n={len(pts)} · SUS medio={st.mean(pts):.1f} · mediana={st.median(pts):.1f}")
    print("Interpretación: ≥ 80.3 excelente · 68–80.3 bueno · 51–68 aceptable bajo · < 51 deficiente")
