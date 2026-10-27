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
        
        # -> Abrir el selector «Tipo de Usuario» y elegir «Estudiante» para preparar la prueba de validación.
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Confirmar «Estudiante» en el selector para cerrar el menú y poder observar el formulario de inicio de sesión.
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante").nth(1)
        await elem.click(timeout=10000)
        
        # -> Ingresar un correo mal formado y la contraseña indicada, enviar el formulario y revisar el mensaje de validación visible.
        # estudiante@universidad.edu email field
        elem = page.get_by_role("textbox", name="Correo Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("correo-invalido")
        
        # -> Ingresar un correo mal formado y la contraseña indicada, enviar el formulario y revisar el mensaje de validación visible.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Ingresar un correo mal formado y la contraseña indicada, enviar el formulario y revisar el mensaje de validación visible.
        # Iniciar sesión como Estudiante button
        elem = page.get_by_role("button", name="Iniciar sesión como Estudiante")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Se muestra el error de validación del correo «Por favor, ingresa un correo electrónico válido».
        await page.locator("xpath=/html/body/div[1]/div/div[2]/div/form/div[2]/p/svg").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Se muestra el indicador del error de validación del correo.
        await expect(page.locator("xpath=/html/body/div[1]/div/div[2]/div/form/div[2]/p/svg").nth(0)).to_be_visible(timeout=15000), "Se muestra el indicador del error de validaci\u00f3n del correo."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    