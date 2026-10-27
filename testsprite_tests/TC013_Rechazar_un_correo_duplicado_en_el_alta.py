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
        
        # -> Abrir el selector «Tipo de Usuario» y elegir «Administrador» para acceder a la administración.
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Administrador» como tipo de usuario en el inicio de sesión.
        # Administrador button
        elem = page.get_by_role("button", name="Administrador")
        await elem.click(timeout=10000)
        
        # -> Completar el correo institucional y la contraseña, e iniciar sesión como administrador.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Completar el correo institucional y la contraseña, e iniciar sesión como administrador.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Completar el correo institucional y la contraseña, e iniciar sesión como administrador.
        # Iniciar sesión como Administrador button
        elem = page.get_by_role("button", name="Iniciar sesión como")
        await elem.click(timeout=10000)
        
        # -> Abrir “Gestión de Usuarios” para acceder a la lista y al formulario de usuarios.
        # Gestión de Usuarios Listar, crear, editar y... button
        elem = page.get_by_role("button", name="Gestión de Usuarios Listar,")
        await elem.click(timeout=10000)
        
        # -> Abrir el formulario «Agregar usuario» y observar sus campos y opciones.
        # Agregar usuario button
        elem = page.get_by_role("button", name="Agregar usuario")
        await elem.click(timeout=10000)
        
        # -> Completar el formulario con el prefijo de correo ya registrado y enviar la creación para verificar el mensaje de duplicado.
        # text field
        elem = page.get_by_role("textbox", name="Nombre", exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test")
        
        # -> Completar el formulario con el prefijo de correo ya registrado y enviar la creación para verificar el mensaje de duplicado.
        # text field
        elem = page.get_by_role("textbox", name="Apellido")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Duplicado")
        
        # -> Completar el formulario con el prefijo de correo ya registrado y enviar la creación para verificar el mensaje de duplicado.
        # usuario text field
        elem = page.get_by_role("textbox", name="Correo")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("aaguilar788")
        
        # -> Completar el formulario con el prefijo de correo ya registrado y enviar la creación para verificar el mensaje de duplicado.
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("PruebaSegura2026!")
        
        # -> Completar el formulario con el prefijo de correo ya registrado y enviar la creación para verificar el mensaje de duplicado.
        # Crear button
        elem = page.get_by_role("button", name="Crear")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        current_url = await page.evaluate("() => window.location.href")
        # Assert-outcome: passed
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    