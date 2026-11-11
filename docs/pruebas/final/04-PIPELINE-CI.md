# 3. Pipeline Jenkins, Docker y SonarQube

Archivos: `Jenkinsfile` (front y back), `ci/docker-compose.ci.yml` (Jenkins + SonarQube), `ci/jenkins/plugins.txt`, `sonar-project.properties`, `Dockerfile` de cada repo.

Etapas del front: verificar entorno → `npm ci` en contenedor Node 22 → pruebas con cobertura y JUnit → análisis SonarQube → **Quality Gate** (`waitForQualityGate`) → imagen Docker → despliegue → verificación `healthy` → **Cypress (UI, accesibilidad, seguridad)** → revisión de dependencias → hook de Vercel. Reportes: `coverage/lcov.info`, `test-results.xml`, `reports/**`.

**Ejecución real de las mismas etapas (equipo local, 2026-11-11):**

| Etapa | Resultado |
|---|---|
| Pruebas + cobertura | Back 1115 ✔ · Front 773 ✔; lcov generado |
| SonarQube Community (contenedor `sonarqube-final`, :9001) + `@sonar/scan` | Back OK, Front OK |
| Quality Gate | **OK** en ambos (`evidencias/sonar-*.json`) |
| Build de imágenes | `entreaulas-back:final`, `entreaulas-front:final` |
| Despliegue | Ambos contenedores `healthy`; CSP, nosniff y X-Frame-Options presentes |
| E2E contra el despliegue | Cypress 64/64 · Playwright 25/25 |

**Limitación honesta:** la instancia de Jenkins no se levantó en este equipo (la red de Docker no enruta contenedor↔contenedor y la memoria era limitada), por lo que el `Jenkinsfile` se entrega con su configuración pero **no se ejecutó dentro de Jenkins**; sus etapas se ejecutaron manualmente con los mismos comandos. Para ejecutarlo: `docker compose -f ci/docker-compose.ci.yml up -d`, instalar `plugins.txt`, registrar la herramienta *SonarScanner* y el servidor *SonarQube* (token), y crear un job *Pipeline from SCM* sobre `pruebas-final-juliana`.
