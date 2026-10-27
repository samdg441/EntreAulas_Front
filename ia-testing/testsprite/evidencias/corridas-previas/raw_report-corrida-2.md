
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** EntreAulas_Front
- **Date:** 2026-10-26
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Iniciar sesión como estudiante y llegar a su panel
- **Test Code:** [TC001_Iniciar_sesin_como_estudiante_y_llegar_a_su_panel.py](./TC001_Iniciar_sesin_como_estudiante_y_llegar_a_su_panel.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/bf83703a-3dcf-44a1-84a2-1c91709cda3f
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Rechazar credenciales incorrectas
- **Test Code:** [TC005_Rechazar_credenciales_incorrectas.py](./TC005_Rechazar_credenciales_incorrectas.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/7e893774-c43e-47da-b2ed-e45b924c4a6d
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Mostrar y ocultar la contraseña en el alta de usuarios
- **Test Code:** [TC010_Mostrar_y_ocultar_la_contrasea_en_el_alta_de_usuarios.py](./TC010_Mostrar_y_ocultar_la_contrasea_en_el_alta_de_usuarios.py)
- **Test Error:** TEST FAILURE

El formulario «Agregar usuario» no ofrece un control «Mostrar contraseña», por lo que no se puede revelar y volver a ocultar la contraseña.

Observations:
- La contraseña ingresada permanece enmascarada.
- La búsqueda de «Mostrar contraseña» y «Ocultar contraseña» no encontró coincidencias.
- El modal muestra los campos del formulario y los botones «Cancelar» y «Crear», pero ningún control para mostrar la contraseña.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/a4952d70-46a5-5ce8-8cc0-c49cf20c3149/test/783a5c66-9eb0-4252-90a1-3f4a282e76aa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **66.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---