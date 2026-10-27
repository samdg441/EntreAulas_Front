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
        
        # -> Abrir el selector «Tipo de Usuario» y elegir «Administrador».
        # Estudiante button
        elem = page.get_by_role("button", name="Estudiante", exact=True)
        await elem.click(timeout=10000)
        
        # -> Seleccionar «Administrador» en el selector de tipo de usuario y revisar el formulario de inicio de sesión actualizado.
        # Administrador button
        elem = page.get_by_role("button", name="Administrador")
        await elem.click(timeout=10000)
        
        # -> Ingresar el correo y la contraseña del administrador y enviar el formulario de inicio de sesión.
        # profesor@universidad.edu email field
        elem = page.get_by_role("textbox", name="Email Institucional")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_USER"])
        
        # -> Ingresar el correo y la contraseña del administrador y enviar el formulario de inicio de sesión.
        # •••••••• password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill(os.environ["TESTSPRITE_PASSWORD"])
        
        # -> Ingresar el correo y la contraseña del administrador y enviar el formulario de inicio de sesión.
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
        
        # -> Seleccionar «estudiante» como tipo de usuario en el formulario de creación.
        # estudiante profesor coordinador decano admin dropdown
        elem = page.locator("xpath=/html/body/div/div/div[4]/div/form/div[5]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Completar los campos del formulario con datos únicos y crear la cuenta de estudiante.
        # text field
        elem = page.get_by_role("textbox", name="Nombre", exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("QA Prueba 20261027")
        
        # -> Completar los campos del formulario con datos únicos y crear la cuenta de estudiante.
        # text field
        elem = page.get_by_role("textbox", name="Apellido")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Usuario 20261027")
        
        # -> Completar los campos del formulario con datos únicos y crear la cuenta de estudiante.
        # usuario text field
        elem = page.get_by_role("textbox", name="Correo")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ts.20261027qa01")
        
        # -> Completar los campos del formulario con datos únicos y crear la cuenta de estudiante.
        # password field
        elem = page.get_by_role("textbox", name="Contraseña")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("PruebaUsuario2026!")
        
        # -> Completar los campos del formulario con datos únicos y crear la cuenta de estudiante.
        # Crear button
        elem = page.get_by_role("button", name="Crear")
        await elem.click(timeout=10000)
        
        # -> Buscar el prefijo de correo único del usuario recién creado y confirmar que aparece en Gestión de Usuarios.
        # Buscar por nombre, email o rol… text field
        elem = page.get_by_role("textbox", name="Buscar por nombre, email o")
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("ts.20261027qa01")
        
        # --> Assertions to verify final state
        
        # --> La cuenta recién creada aparece en la lista de usuarios.
        await page.get_by_role("row", name="ts.20261027qa01@").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: not verified — the export-time check could not be evaluated
        # Assert: La cuenta recién creada aparece en la lista de usuarios.
        await expect(page.get_by_role("row", name="ts.20261027qa01@").nth(0)).to_be_visible(timeout=15000), "La cuenta reci\u00e9n creada aparece en la lista de usuarios."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    