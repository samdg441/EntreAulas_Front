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
        
        # -> Abrir las opciones de «Tipo de Usuario» y seleccionar «Administrador».
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Administrador» en el selector de tipo de usuario y revisar cómo queda el formulario de acceso.
        # Administrador button
        elem = page.get_by_role("button", name="Administrador")
        await elem.click(timeout=10000)
        
        # -> Iniciar sesión como administrador con el correo y la contraseña proporcionados.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Iniciar sesión como administrador con el correo y la contraseña proporcionados.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Iniciar sesión como administrador con el correo y la contraseña proporcionados.
        # Iniciar sesión como Administrador button
        elem = page.get_by_role("button", name="Iniciar sesión como")
        await elem.click(timeout=10000)
        
        # -> Reintentar una vez el inicio de sesión como Administrador desde la pantalla que muestra el error interno del servidor.
        # Iniciar sesión como Administrador button
        elem = page.get_by_role("button", name="Iniciar sesión como")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> El aviso «El correo ya está registrado» debía mostrarse al intentar crear un usuario con un correo duplicado.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected the duplicate-email message «El correo ya está registrado» to be visible.
        await expect(page.locator("form").nth(0)).to_contain_text("El correo ya est\u00e1 registrado", timeout=15000), "Expected the duplicate-email message \u00abEl correo ya est\u00e1 registrado\u00bb to be visible."
        
        # --> Test blocked by environment/access constraints during agent run
        # Reason: TEST BLOCKED No se pudo verificar el mensaje «El correo ya está registrado» porque no fue posible acceder a la administración. Observations: - En la pantalla de inicio de sesión apareció «Demasiados intentos. Intenta de nuevo más tarde». - El acceso a /admin/users y el formulario para agregar usuario no se alcanzaron.
        raise AssertionError("Test blocked during agent run: " + "TEST BLOCKED No se pudo verificar el mensaje \u00abEl correo ya est\u00e1 registrado\u00bb porque no fue posible acceder a la administraci\u00f3n. Observations: - En la pantalla de inicio de sesi\u00f3n apareci\u00f3 \u00abDemasiados intentos. Intenta de nuevo m\u00e1s tarde\u00bb. - El acceso a /admin/users y el formulario para agregar usuario no se alcanzaron." + " — the exported script cannot reproduce a PASS in this environment.")
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    