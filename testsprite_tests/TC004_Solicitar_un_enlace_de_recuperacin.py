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
        
        # -> Abrir el flujo de recuperación desde «¿Olvidaste tu contraseña?».
        # ¿Olvidaste tu contraseña? button
        elem = page.get_by_role("button", name="¿Olvidaste tu contraseña?")
        await elem.click(timeout=10000)
        
        # -> Enviar la solicitud de recuperación con el correo institucional configurado y comprobar si aparece «Solicitud enviada».
        # tu.correo@universidad.edu email field
        elem = page.get_by_role("textbox", name="Correo Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Enviar la solicitud de recuperación con el correo institucional configurado y comprobar si aparece «Solicitud enviada».
        # Enviar enlace de recuperación button
        elem = page.get_by_role("button", name="Enviar enlace de recuperación")
        await elem.click(timeout=10000)
        
        # -> Esperar unos segundos y volver a enviar una sola vez la solicitud para comprobar si aparece la confirmación genérica.
        # Enviar enlace de recuperación button
        elem = page.get_by_role("button", name="Enviar enlace de recuperación")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> El formulario de recuperación debía mostrar «Solicitud enviada» tras enviar el correo válido.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Se esperaba que el formulario mostrara «Solicitud enviada».
        await expect(page.locator("form").nth(0)).to_contain_text("Solicitud enviada", timeout=15000), "Se esperaba que el formulario mostrara \u00abSolicitud enviada\u00bb."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    