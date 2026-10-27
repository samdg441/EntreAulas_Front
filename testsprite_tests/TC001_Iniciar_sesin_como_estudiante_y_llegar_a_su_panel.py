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
        
        # -> Completar el correo institucional y la contraseña, enviar el formulario de inicio de sesión como estudiante y comprobar que se muestra el dashboard estudiantil.
        # estudiante@universidad.edu email field
        elem = page.get_by_role("textbox", name="Correo Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Completar el correo institucional y la contraseña, enviar el formulario de inicio de sesión como estudiante y comprobar que se muestra el dashboard estudiantil.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Completar el correo institucional y la contraseña, enviar el formulario de inicio de sesión como estudiante y comprobar que se muestra el dashboard estudiantil.
        # Iniciar sesión como Estudiante button
        elem = page.get_by_role("button", name="Iniciar sesión como Estudiante")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> El dashboard estudiantil está visible.
        await page.get_by_role("button", name="Nueva Evaluación Evaluar un").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: El dashboard estudiantil muestra la acción «Nueva Evaluación».
        await expect(page.get_by_role("button", name="Nueva Evaluación Evaluar un").nth(0)).to_be_visible(timeout=15000), "El dashboard estudiantil muestra la acci\u00f3n \u00abNueva Evaluaci\u00f3n\u00bb."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    