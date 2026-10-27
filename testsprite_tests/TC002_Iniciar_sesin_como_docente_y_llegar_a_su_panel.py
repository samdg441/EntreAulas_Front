import os
import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3001/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Abrir el selector «Tipo de Usuario» y elegir «Docente».
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Docente» en el selector «Tipo de Usuario».
        # Docente button
        elem = page.get_by_role("button", name="Docente")
        await elem.click(timeout=10000)
        
        # -> Ingresar las credenciales del docente y enviar el formulario de inicio de sesión.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_DOCENTE_USER"])
        
        # -> Ingresar las credenciales del docente y enviar el formulario de inicio de sesión.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_DOCENTE_PASSWORD"])
        
        # -> Ingresar las credenciales del docente y enviar el formulario de inicio de sesión.
        # Iniciar sesión como Docente button
        elem = page.get_by_role("button", name="Iniciar sesión como Docente")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> El docente llega al panel en /dashboard-profesor después de iniciar sesión.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: La URL contiene /dashboard-profesor.
        await expect(page).to_have_url(re.compile("/dashboard\\-profesor"), timeout=15000), "La URL contiene /dashboard-profesor."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    