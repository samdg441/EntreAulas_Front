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
        
        # -> Enviar el inicio de sesión de estudiante con el correo configurado y una contraseña incorrecta, y comprobar el mensaje de error en /login.
        # estudiante@universidad.edu email field
        elem = page.get_by_role("textbox", name="Correo Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Enviar el inicio de sesión de estudiante con el correo configurado y una contraseña incorrecta, y comprobar el mensaje de error en /login.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Incorrecta#2026")
        
        # -> Enviar el inicio de sesión de estudiante con el correo configurado y una contraseña incorrecta, y comprobar el mensaje de error en /login.
        # Iniciar sesión como Estudiante button
        elem = page.get_by_role("button", name="Iniciar sesión como Estudiante")
        await elem.click(timeout=10000)
        
        # -> Reenviar el formulario de inicio de sesión de Estudiante con la contraseña incorrecta y observar la respuesta.
        # Iniciar sesión como Estudiante button
        elem = page.get_by_role("button", name="Iniciar sesión como Estudiante")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> La página permaneció en /login después del intento fallido de inicio de sesión.
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: Expected the URL to contain /login.
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "Expected the URL to contain /login."
        
        # --> Test blocked by environment/access constraints during agent run
        # Reason: TEST BLOCKED La verificación quedó bloqueada por el límite de intentos de inicio de sesión. La página permaneció en /login, pero no se pudo confirmar que la contraseña incorrecta muestre «Credenciales inválidas». Observations: - La página mostró «Demasiados intentos. Intenta de nuevo más tarde». - La URL continuó siendo /login.
        raise AssertionError("Test blocked during agent run: " + "TEST BLOCKED La verificaci\u00f3n qued\u00f3 bloqueada por el l\u00edmite de intentos de inicio de sesi\u00f3n. La p\u00e1gina permaneci\u00f3 en /login, pero no se pudo confirmar que la contrase\u00f1a incorrecta muestre \u00abCredenciales inv\u00e1lidas\u00bb. Observations: - La p\u00e1gina mostr\u00f3 \u00abDemasiados intentos. Intenta de nuevo m\u00e1s tarde\u00bb. - La URL continu\u00f3 siendo /login." + " — the exported script cannot reproduce a PASS in this environment.")
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    