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
        
        # -> Abrir el selector «Tipo de Usuario» y elegir «Administrador» si está disponible.
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Administrador» en el selector de tipo de usuario.
        # Administrador button
        elem = page.get_by_role("button", name="Administrador")
        await elem.click(timeout=10000)
        
        # -> Completar el correo y la contraseña administrativos y enviar el formulario de inicio de sesión.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Completar el correo y la contraseña administrativos y enviar el formulario de inicio de sesión.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Completar el correo y la contraseña administrativos y enviar el formulario de inicio de sesión.
        # Iniciar sesión como Administrador button
        elem = page.get_by_role("button", name="Iniciar sesión como")
        await elem.click(timeout=10000)
        
        # -> Abrir «Gestión de Usuarios» desde el panel de administración.
        # Gestión de Usuarios Listar, crear, editar y... button
        elem = page.get_by_role("button", name="Gestión de Usuarios Listar,")
        await elem.click(timeout=10000)
        
        # -> Abrir «Agregar usuario» y revisar los campos visibles del formulario antes de completarlos.
        # Agregar usuario button
        elem = page.get_by_role("button", name="Agregar usuario")
        await elem.click(timeout=10000)
        
        # -> Confirmar «estudiante» como tipo de usuario y luego completar los datos únicos de la cuenta de prueba.
        # estudiante profesor coordinador decano admin dropdown
        elem = page.locator("xpath=/html/body/div/div/div[4]/div/form/div[5]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Completar los datos únicos de la cuenta de prueba y crearla desde el formulario «Agregar usuario».
        # text field
        elem = page.get_by_role("textbox", name="Nombre", exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QA Prueba 20261027")
        
        # -> Completar los datos únicos de la cuenta de prueba y crearla desde el formulario «Agregar usuario».
        # text field
        elem = page.get_by_role("textbox", name="Apellido")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Busqueda 20261027")
        
        # -> Completar los datos únicos de la cuenta de prueba y crearla desde el formulario «Agregar usuario».
        # usuario text field
        elem = page.get_by_role("textbox", name="Correo")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ts.20261027")
        
        # -> Completar los datos únicos de la cuenta de prueba y crearla desde el formulario «Agregar usuario».
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ClaveValida2026!")
        
        # -> Completar los datos únicos de la cuenta de prueba y crearla desde el formulario «Agregar usuario».
        # Crear button
        elem = page.get_by_role("button", name="Crear")
        await elem.click(timeout=10000)
        
        # -> Buscar «ts.20261027» en el campo «Buscar por nombre, email o rol…» y verificar la fila de la cuenta creada.
        # Buscar por nombre, email o rol… text field
        elem = page.get_by_role("textbox", name="Buscar por nombre, email o")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ts.20261027")
        
        # --> Assertions to verify final state
        
        # --> El resultado filtrado incluye la cuenta cuyo usuario coincide con «ts.20261027».
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: El resultado filtrado incluye la cuenta buscada.
        await expect(page.locator("tbody").nth(0)).to_contain_text("ts.20261027", timeout=15000), "El resultado filtrado incluye la cuenta buscada."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    