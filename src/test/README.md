# Pruebas Frontend (unitarias)

Cada requisito vive en **un archivo** y **una clase** con todos sus casos.
No hay mocks: se llaman funciones con datos y se revisa el resultado.

Los casos `FALLA` están a propósito en rojo: esperan el resultado incorrecto
para dejar evidencia de que la prueba detecta el error.

```
src/test/
├── unit/           → Una clase por requisito (C1…Cn)
├── helpers/        → Funciones de apoyo (acceso, QR, métricas)
├── fixtures/       → Datos estáticos
├── defects/        → Registro de defectos (suite aparte)
└── setup.ts
```

## Cómo correrlas

Desde **EntreAulas_Front**:

```bash
npm test
npm run test:unit
```
