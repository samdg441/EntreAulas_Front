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
        
        # -> Seleccionar «Administrador» en el selector de tipo de usuario y revisar las opciones disponibles.
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Administrador» como tipo de usuario en el inicio de sesión.
        # Administrador button
        elem = page.get_by_role("button", name="Administrador")
        await elem.click(timeout=10000)
        
        # -> Iniciar sesión como Administrador con las credenciales indicadas.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Iniciar sesión como Administrador con las credenciales indicadas.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Iniciar sesión como Administrador con las credenciales indicadas.
        # Iniciar sesión como Administrador button
        elem = page.get_by_role("button", name="Iniciar sesión como")
        await elem.click(timeout=10000)
        
        # -> Abrir «Gestión de Usuarios» desde el panel de administración.
        # Gestión de Usuarios Listar, crear, editar y... button
        elem = page.get_by_role("button", name="Gestión de Usuarios Listar,")
        await elem.click(timeout=10000)
        
        # -> Abrir el formulario «Agregar usuario» y revisar los campos que presenta.
        # Agregar usuario button
        elem = page.get_by_role("button", name="Agregar usuario")
        await elem.click(timeout=10000)
        
        # -> Completar el formulario con datos únicos y una contraseña débil que no incluya caracteres especiales.
        # text field
        elem = page.get_by_role("textbox", name="Nombre", exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Prueba")
        
        # -> Completar el formulario con datos únicos y una contraseña débil que no incluya caracteres especiales.
        # text field
        elem = page.get_by_role("textbox", name="Apellido")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Validacion")
        
        # -> Completar el formulario con datos únicos y una contraseña débil que no incluya caracteres especiales.
        # usuario text field
        elem = page.get_by_role("textbox", name="Correo")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ts.202610271600")
        
        # -> Completar el formulario con datos únicos y una contraseña débil que no incluya caracteres especiales.
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Abcdefg123")
        
        # -> Enviar el formulario «Agregar usuario» con la contraseña débil y verificar el aviso de carácter especial y que el modal permanezca abierto.
        # Crear button
        elem = page.get_by_role("button", name="Crear")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> El modal «Agregar usuario» permanece abierto tras enviar la contraseña débil.
        await page.get_by_role("button", name="Cerrar").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: El modal «Agregar usuario» debe permanecer abierto.
        await expect(page.get_by_role("button", name="Cerrar").nth(0)).to_be_visible(timeout=15000), "El modal \u00abAgregar usuario\u00bb debe permanecer abierto."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    