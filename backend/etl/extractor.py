"""
Extractor ETL — scraping con Playwright + undetected-playwright (Chromium).
mobile.de:      headless=False + stealth patches + sesión persistente + warm-up de 3 páginas.
autoscout24.es: headless=True (sin necesidad de técnicas extra de evasión).
"""
import asyncio
import logging
import os
import random
from typing import Any

from playwright.async_api import Browser, BrowserContext, Page
from playwright.async_api import TimeoutError as PlaywrightTimeout
from playwright.async_api import async_playwright
from undetected_playwright import stealth_async

logger = logging.getLogger(__name__)

# ── Constantes ────────────────────────────────────────────────────────────────

MOBILE_DE_URL = (
    "https://suchen.mobile.de/fahrzeuge/search.html"
    "?categories=Automobiles&isSearchRequest=true"
)
AUTOSCOUT24_URL = "https://www.autoscout24.es/lst?atype=C&cy=D"

WAIT_TIMEOUT_MS = 60_000   # 60 s para que aparezcan los anuncios
MAX_INTENTOS    = 2        # reintentos antes de desistir con mobile.de

# Archivo de sesión persistente para mobile.de (cookies + localStorage entre ejecuciones)
_STORAGE_DIR  = os.path.join(os.path.dirname(__file__), "storage")
STORAGE_FILE  = os.path.join(_STORAGE_DIR, "mobile_de.json")

# User-Agents actualizados de Chrome 124 en varias plataformas
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.122 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.60 Safari/537.36",
]

# Cabeceras HTTP completas que emulan Chrome real en Windows
HEADERS_MOBILE_DE = {
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Upgrade-Insecure-Requests": "1",
    "DNT": "1",
}

# JS extra inyectado en cada nueva página para eliminar huellas de automatización
STEALTH_INIT_SCRIPT = """
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
Object.defineProperty(navigator, 'plugins',   { get: () => [1, 2, 3, 4, 5] });
Object.defineProperty(navigator, 'languages', { get: () => ['es-ES', 'es', 'de', 'en'] });
window.chrome = { runtime: {} };
"""

# Selectores del banner CMP de mobile.de (pueden cambiar con cada versión del CMP)
COOKIE_SELECTORS_MOBILE_DE = (
    "button[data-testid='gdpr-accept-button'], "
    "#uc-btn-accept-banner, "
    "button.gdpr-consent-accept, "
    "button[class*='acceptAll'], "
    "button[id*='accept']"
)

# Selectores de tarjetas de anuncio en mobile.de
CARD_SELECTOR_MOBILE_DE = (
    "div.cpo-card-body, "
    "article.result-item, "
    "div[data-testid='result-item'], "
    "div.g-col-12.u-margin-bottom-18"
)

# Textos que indican bloqueo activo — se comprueban antes del timeout largo
BLOCK_SIGNALS = [
    "access denied", "cloudflare", "captcha", "bot detected",
    "robot", "automated", "blocked", "zugriff verweigert",
    "datadome", "403 forbidden", "please verify you are a human",
]

# Args de Chromium compartidos por ambos navegadores
CHROMIUM_ARGS = [
    "--no-sandbox",
    "--disable-blink-features=AutomationControlled",  # elimina la señal más obvia de automatización
    "--disable-dev-shm-usage",
    "--disable-infobars",
    "--window-size=1920,1080",
]


# ── Helpers de comportamiento humano ─────────────────────────────────────────

async def _random_delay(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Pausa aleatoria configurable entre acciones."""
    await asyncio.sleep(random.uniform(min_s, max_s))


async def human_mouse_move(page: Page, x: float, y: float) -> None:
    """
    Mueve el ratón de la posición central a (x, y) siguiendo una curva
    ease-in-out (smoothstep) en lugar de una línea recta, imitando
    el movimiento natural de una mano sobre el ratón.
    """
    current_x, current_y = 500.0, 500.0
    steps = random.randint(10, 25)
    for i in range(steps):
        progress = i / steps
        # Smoothstep: acelera al salir, desacelera al llegar
        eased = progress * progress * (3 - 2 * progress)
        new_x = current_x + (x - current_x) * eased
        new_y = current_y + (y - current_y) * eased
        await page.mouse.move(new_x, new_y)
        await asyncio.sleep(random.uniform(0.01, 0.05))


async def _simulate_human(page: Page) -> None:
    """Movimientos de ratón bezier aleatorios + scroll gradual hacia abajo."""
    for _ in range(random.randint(4, 7)):
        x = random.randint(80, 1840)
        y = random.randint(80, 1000)
        await human_mouse_move(page, float(x), float(y))

    for _ in range(random.randint(3, 6)):
        await page.evaluate("window.scrollBy(0, 300)")
        await asyncio.sleep(random.uniform(0.6, 1.4))


async def _accept_cookies(page: Page, selectors: str, site: str) -> None:
    """Acepta el banner de cookies; ignora si no aparece en 6 s."""
    try:
        await page.click(selectors, timeout=6_000)
        logger.debug("%s: banner de cookies aceptado", site)
        await asyncio.sleep(0.8)
    except PlaywrightTimeout:
        pass


def _detect_block(content: str) -> str | None:
    """
    Busca señales de bloqueo conocidas en el texto de la página.
    Devuelve la señal encontrada para el log, o None si todo parece normal.
    """
    lower = content.lower()
    for signal in BLOCK_SIGNALS:
        if signal in lower:
            return signal
    return None


# ── Contextos de navegador ────────────────────────────────────────────────────

async def _new_mobile_de_context(browser: Browser) -> Page:
    """
    Contexto para mobile.de: stealth_async patches, cabeceras completas,
    timezone Madrid y sesión persistente (carga mobile_de.json si existe).
    """
    context_kwargs: dict[str, Any] = {
        "user_agent": random.choice(USER_AGENTS),
        "viewport": {"width": 1920, "height": 1080},
        "locale": "es-ES",
        "timezone_id": "Europe/Madrid",
        "extra_http_headers": HEADERS_MOBILE_DE,
    }
    # Reutiliza cookies y localStorage de ejecuciones anteriores
    if os.path.exists(STORAGE_FILE):
        logger.info("mobile.de: cargando sesión guardada desde %s", STORAGE_FILE)
        context_kwargs["storage_state"] = STORAGE_FILE

    context: BrowserContext = await browser.new_context(**context_kwargs)
    # undetected-playwright parchea el contexto contra Cloudflare, DataDome y similares
    await stealth_async(context)
    page = await context.new_page()
    # Script adicional por si los parches de stealth_async no cubren algún vector
    await page.add_init_script(STEALTH_INIT_SCRIPT)
    return page


async def _new_page(browser: Browser) -> Page:
    """Contexto genérico para AutoScout24 con stealth básico."""
    context: BrowserContext = await browser.new_context(
        user_agent=random.choice(USER_AGENTS),
        viewport={"width": 1366, "height": 768},
        locale="es-ES",
        extra_http_headers={
            "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Upgrade-Insecure-Requests": "1",
        },
    )
    await stealth_async(context)
    page = await context.new_page()
    await page.add_init_script(STEALTH_INIT_SCRIPT)
    return page


# ── Warm-up y parseo ──────────────────────────────────────────────────────────

async def _warm_up_mobile_de(page: Page) -> None:
    """
    Navega por 3 páginas antes de ir a los resultados:
    Google → portada de mobile.de → sección de coches → búsqueda.
    Esto imita el recorrido de un usuario real y fortalece el referer.
    """
    # 1. Google — establece el referer de entrada
    await page.goto("https://www.google.com", wait_until="domcontentloaded", timeout=15_000)
    await _random_delay(1.5, 3.0)

    # 2. Portada de mobile.de
    await page.goto("https://www.mobile.de", wait_until="domcontentloaded", timeout=20_000)
    await _random_delay(1.5, 4.0)
    await _simulate_human(page)

    # 3. Sección de coches de segunda mano (no crítico si falla)
    try:
        await page.goto(
            "https://www.mobile.de/gebrauchtwagen",
            wait_until="domcontentloaded",
            timeout=15_000,
        )
        await _random_delay(1.5, 3.0)
        await _simulate_human(page)
    except Exception:
        pass


async def _parse_mobile_de_cards(cards: list) -> list[dict[str, Any]]:
    """Extrae marca, modelo, año, km, combustible y precio de cada tarjeta."""
    import re  # Aseguramos que regex está disponible
    results = []
    
    for idx, card in enumerate(cards[:20]):
        try:
            marca_modelo_el = await card.query_selector(
                "div.headline-block span.make-model, h2.g-col-10, "
                "span[data-testid='title'], h2.listing-title"
            )
            precio_el = await card.query_selector(
                "div.price-block span.h3, span.price-block__price, "
                "span[data-testid='price'], p.price, div.price-section span"
            )
            km_el   = await card.query_selector("li[data-testid='mileage'], span[data-testid='mileage'], li.rbt-kilowatt")
            anio_el = await card.query_selector("li[data-testid='first-registration'], li.rbt-registration, span[data-testid='ez']")
            fuel_el = await card.query_selector("li[data-testid='fuel-type'], li.rbt-fuel, span[data-testid='fuel']")

            # --- EL SALVAVIDAS FISCAL (Regex sobre el texto crudo) ---
            # Extraemos todo el texto de la tarjeta y buscamos patrones fijos
            texto_completo = await card.inner_text()
            
            # Caza el CO2: ej. "120 g/km" o "120g/km"
            match_co2 = re.search(r"(\d+)\s*g/km", texto_completo, re.IGNORECASE)
            emisiones_raw = match_co2.group(0) if match_co2 else None
            
            # Caza el Color (busca coincidencias en alemán)
            match_color = re.search(r"(schwarz|weiß|weiss|silber|grau|blau|rot|grün|gruen|braun|beige|gelb|orange|violett)", texto_completo, re.IGNORECASE)
            color_raw = match_color.group(1) if match_color else None
            # -----------------------------------------------------------

            id_anuncio = (
                await card.get_attribute("data-ad-id")
                or await card.get_attribute("id")
                or f"mobile_{idx}"
            )
            texto_mm = (await marca_modelo_el.inner_text()).strip() if marca_modelo_el else ""
            partes   = texto_mm.split(" ", 1)

            results.append({
                "marca":       partes[0] if partes else "Desconocido",
                "modelo":      partes[1] if len(partes) > 1 else "Desconocido",
                "anio":        (await anio_el.inner_text()).strip() if anio_el   else "2020",
                "kilometraje": (await km_el.inner_text()).strip()   if km_el     else "0",
                "combustible": (await fuel_el.inner_text()).strip() if fuel_el   else "Benzin",
                "emisiones_co2": emisiones_raw, # Dejamos de mandar 'None'
                "color": color_raw,             # Dejamos de mandar 'None'
                "precio_base": (await precio_el.inner_text()).strip() if precio_el else "15000",
                "imagen_url":  None,
                "plataforma_origen": "mobile.de",
                "id_anuncio_externo": str(id_anuncio),
            })
        except Exception as exc:
            logger.debug("mobile.de: error parseando tarjeta %d: %s", idx, exc)
            continue
    return results


# ── Fetchers principales ──────────────────────────────────────────────────────

async def _fetch_mobile_de_once(browser: Browser) -> list[dict[str, Any]]:
    """
    Un único intento de extracción en mobile.de aplicando todas las técnicas:
    warm-up de 3 páginas, detección de bloqueo, guardado de sesión y simulación humana.
    """
    page = await _new_mobile_de_context(browser)
    try:
        # Recorre 3 páginas previas para forjar un historial de navegación real
        await _warm_up_mobile_de(page)

        await page.goto(MOBILE_DE_URL, wait_until="domcontentloaded", timeout=30_000)

        # Diagnóstico temprano: comprueba señales de bloqueo antes del timeout largo
        body_text = await page.evaluate("document.body.innerText")
        bloqueo = _detect_block(body_text)
        if bloqueo:
            logger.error("mobile.de: bloqueo detectado — señal: '%s'", bloqueo)
            raise PlaywrightTimeout(f"bloqueo detectado: {bloqueo}")

        # Acepta cookies y guarda la sesión para reutilizarla en la próxima ejecución
        await _accept_cookies(page, COOKIE_SELECTORS_MOBILE_DE, "mobile.de")
        os.makedirs(_STORAGE_DIR, exist_ok=True)
        await page.context.storage_state(path=STORAGE_FILE)
        logger.info("mobile.de: sesión guardada en %s", STORAGE_FILE)

        await _simulate_human(page)
        await page.wait_for_selector(CARD_SELECTOR_MOBILE_DE, timeout=WAIT_TIMEOUT_MS)

        cards = await page.query_selector_all(CARD_SELECTOR_MOBILE_DE)
        logger.info("mobile.de: %d tarjetas encontradas", len(cards))
        return await _parse_mobile_de_cards(cards)
    finally:
        await page.context.close()


async def fetch_mobile_de(browser: Browser) -> list[dict[str, Any]]:
    """
    Extrae anuncios de mobile.de con hasta MAX_INTENTOS reintentos.
    Si todos los intentos fallan, loguea y devuelve lista vacía
    para que el runner continúe con AutoScout24.
    """
    for intento in range(1, MAX_INTENTOS + 1):
        logger.info("mobile.de: intento %d/%d …", intento, MAX_INTENTOS)
        try:
            results = await _fetch_mobile_de_once(browser)
            if results:
                logger.info("mobile.de: %d anuncios extraídos en intento %d", len(results), intento)
                return results
            logger.warning("mobile.de: intento %d — página cargó pero sin tarjetas", intento)
        except PlaywrightTimeout as exc:
            logger.error("mobile.de: intento %d — timeout/bloqueo: %s", intento, exc)
        except Exception as exc:
            logger.error("mobile.de: intento %d — error inesperado: %s", intento, exc)

        if intento < MAX_INTENTOS:
            espera = random.uniform(8.0, 15.0)
            logger.info("mobile.de: esperando %.1fs antes del siguiente intento …", espera)
            await asyncio.sleep(espera)

    logger.error("mobile.de: todos los intentos fallaron — continuando con AutoScout24")
    return []


async def fetch_autoscout24(browser: Browser, max_paginas: int = 5) -> list[dict[str, Any]]:
    """
    Navega a autoscout24.es (headless), espera los anuncios con JS
    y extrae los datos paginando hasta max_paginas páginas.
    Devuelve lista vacía si hay error o bloqueo en la primera página.
    """
    results: list[dict[str, Any]] = []
    page = await _new_page(browser)

    card_selector = (
        "article.cldt-summary-full-item, "
        "article[data-item-name='listing'], "
        "div[data-testid='listing-item']"
    )

    try:
        await _random_delay()
        logger.info("autoscout24.es: navegando a la página de búsqueda …")
        await page.goto(AUTOSCOUT24_URL, wait_until="domcontentloaded", timeout=30_000)

        # Debug: título y preview del body para diagnosticar banners/bloqueos
        title = await page.title()
        logger.info("autoscout24: título: %s", title)
        body = await page.evaluate("document.body.innerText.substring(0, 200)")
        logger.info("autoscout24: body preview: %s", body)

        # Espera a que el banner de cookies y el JS inicial terminen de renderizar
        await asyncio.sleep(5)

        # Diagnóstico temprano de bloqueo
        body_text = await page.evaluate("document.body.innerText")
        bloqueo = _detect_block(body_text)
        if bloqueo:
            logger.warning("autoscout24.es: señal de bloqueo detectada ('%s') — continuando de todas formas", bloqueo)

        await _accept_cookies(
            page,
            "button[data-cy='as24-cmp-accept-all-button'], "
            "button#onetrust-accept-btn-handler, "
            "button.sc-button-primary",
            "autoscout24.es",
        )
        # Espera a que la página recargue los resultados tras aceptar cookies
        await asyncio.sleep(3)
        await _simulate_human(page)

        for num_pagina in range(1, max_paginas + 1):
            if num_pagina > 1:
                url_pagina = f"{AUTOSCOUT24_URL}&page={num_pagina}"
                try:
                    await page.goto(url_pagina, wait_until="domcontentloaded", timeout=30_000)
                except Exception as exc:
                    logger.warning(
                        "autoscout24.es: error navegando a página %d/%d — %s",
                        num_pagina, max_paginas, exc,
                    )
                    break

            try:
                await page.wait_for_selector(card_selector, timeout=WAIT_TIMEOUT_MS)
            except PlaywrightTimeout:
                logger.warning(
                    "autoscout24.es: página %d/%d sin anuncios (timeout) — deteniendo",
                    num_pagina, max_paginas,
                )
                break

            # Scroll para activar lazy loading de imágenes
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1.5)
            await page.evaluate("window.scrollTo(0, 0)")
            await asyncio.sleep(0.5)

            # Esperar a que las imágenes carguen
            try:
                await page.wait_for_selector("img[src*='autoscout24']", timeout=5_000)
            except Exception:
                pass

            cards = await page.query_selector_all(card_selector)
            if not cards:
                logger.warning(
                    "autoscout24.es: página %d/%d sin anuncios — deteniendo",
                    num_pagina, max_paginas,
                )
                break

            anuncios_pagina: list[dict[str, Any]] = []
            import re # Aseguramos regex
            
            for idx, card in enumerate(cards[:20]):
                try:
                    marca_el  = await card.query_selector("span.cldt-make, [data-testid='make'], h2 span:first-child")
                    modelo_el = await card.query_selector("span.cldt-model, [data-testid='model'], h2 span:nth-child(2)")
                    precio_el = await card.query_selector("span.cldt-price, [data-testid='price-section'] strong, p.cldt-price")
                    km_el     = await card.query_selector("li[data-type='Mileage'] span, [data-testid='mileage']")
                    anio_el   = await card.query_selector("li[data-type='FirstRegistration'] span, [data-testid='first-registration']")
                    fuel_el   = await card.query_selector("li[data-type='FuelType'] span, [data-testid='fuel-type']")
                    
                    # --- EL SALVAVIDAS FISCAL ---
                    texto_completo = await card.inner_text()
                    
                    # DEBUG TEMPORAL — borrar después
                    if idx == 0 and num_pagina == 1:
                        logger.info("DEBUG CARD TEXT: %s", texto_completo[:500])
                    
                    # Caza el CO2
                    match_co2 = re.search(r"(\d+)\s*g/km", texto_completo, re.IGNORECASE)
                    emisiones_raw = match_co2.group(1) if match_co2 else None

                    # Caza el Color
                    match_color = re.search(r"(schwarz|weiß|weiss|silber|grau|blau|rot|grün|gruen|braun|beige|gelb|orange|violett)", texto_completo, re.IGNORECASE)
                    color_raw = match_color.group(1) if match_color else None
                    
                    # Caza los Kilómetros
                    match_km = re.search(r"(\d{1,3}(?:\.\d{3})*|\d+)\s*km", texto_completo, re.IGNORECASE)
                    km_raw = match_km.group(1) if match_km else "0"
                    
                    # Caza el Precio real del texto completo
                    # AutoScout24 formato: "€ 16.490" (euro ANTES del número)
                    precios_encontrados = re.findall(r"€\s*(\d{1,3}(?:\.\d{3})+)", texto_completo)
                    precio_raw = None
                    for p in precios_encontrados:
                        val = int(p.replace(".", ""))
                        if val > 1000:
                            precio_raw = p
                            break
                    
                    if not precio_raw:
                        # Fallback: formato "15.900 €" (euro después)
                        match_precio = re.findall(r"(\d{1,3}(?:\.\d{3})+)\s*€", texto_completo)
                        for p in match_precio:
                            val = int(p.replace(".", ""))
                            if val > 1000:
                                precio_raw = p
                                break
                            
                    # NUEVO: Caza el Año (Busca el formato alemán 05/2019 o el año directo)
                    match_anio = re.search(r"(?:0[1-9]|1[0-2])/([12]\d{3})", texto_completo)
                    if not match_anio: # Si no encuentra el mes/año, busca un año suelto lógico
                        match_anio = re.search(r"\b(19[89]\d|20[0-2]\d)\b", texto_completo)
                    anio_raw = match_anio.group(1) if match_anio else "2020"

                    # NUEVO: Caza el Combustible (Términos en alemán o inglés/español)
                    match_fuel = re.search(r"\b(Benzin|Diesel|Elektro|Hybrid|Plug-in|Super)\b", texto_completo, re.IGNORECASE)
                    fuel_raw = match_fuel.group(1) if match_fuel else "Benzin"
                    
                    # ----------------------------

                    id_anuncio = (
                        await card.get_attribute("data-listing-id")
                        or await card.get_attribute("id")
                        or f"as24_p{num_pagina}_{idx}"
                    )

                    # ── Imagen principal ──────────────────────────────────────
                    imagen_url: str | None = None

                    # Intento 1: selectores agresivos — priorizan src ya resueltos
                    img_el = await card.query_selector(
                        "img[src*='autoscout24'], "
                        "img[src*='https'], "
                        "img[data-src*='https'], "
                        "img:not([src*='data:']):not([src*='.svg'])"
                    )
                    if img_el:
                        imagen_url = (
                            await img_el.get_attribute("data-src")
                            or await img_el.get_attribute("src")
                        )
                        # Descarta placeholders base64 / SVGs genéricos
                        if imagen_url and (
                            imagen_url.startswith("data:")
                            or imagen_url.endswith(".svg")
                            or "placeholder" in imagen_url.lower()
                            or "no-image" in imagen_url.lower()
                        ):
                            imagen_url = None

                    # Intento 2: <picture><source srcset="…"> si el <img> no dio URL útil
                    if not imagen_url:
                        source_el = await card.query_selector("picture source[srcset], picture source[data-srcset]")
                        if source_el:
                            srcset = (
                                await source_el.get_attribute("srcset")
                                or await source_el.get_attribute("data-srcset")
                            )
                            if srcset:
                                # srcset puede ser "url1 400w, url2 800w" → tomar la primera URL
                                imagen_url = srcset.split(",")[0].split()[0].strip() or None

                    anuncios_pagina.append({
                        "marca":         (await marca_el.inner_text()).strip()  if marca_el  else "Desconocido",
                        "modelo":        (await modelo_el.inner_text()).strip() if modelo_el else "Desconocido",
                        "anio":          anio_raw,
                        "kilometraje":   km_raw,
                        "combustible":   fuel_raw,
                        "emisiones_co2": emisiones_raw, # Actualizado
                        "color":         color_raw,     # Actualizado
                        "precio_base": precio_raw if precio_raw else ((await precio_el.inner_text()).strip() if precio_el else "0"),
                        "imagen_url":    imagen_url,
                        "plataforma_origen":   "autoscout24.es",
                        "id_anuncio_externo":  str(id_anuncio),
                    })
                except Exception as exc:
                    logger.debug(
                        "autoscout24.es: error parseando tarjeta %d en página %d: %s",
                        idx, num_pagina, exc,
                    )
                    continue

            logger.info(
                "autoscout24.es: página %d/%d — %d anuncios",
                num_pagina, max_paginas, len(anuncios_pagina),
            )
            results.extend(anuncios_pagina)

            if num_pagina < max_paginas:
                await _random_delay(2.0, 4.0)

    except PlaywrightTimeout:
        logger.error("autoscout24.es: timeout de %ds (posible bloqueo)", WAIT_TIMEOUT_MS // 1000)
    except Exception as exc:
        logger.error("autoscout24.es: error inesperado — %s", exc)
    finally:
        await page.context.close()

    logger.info("autoscout24.es: total extraídos %d anuncios", len(results))
    return results


# ── Orquestador ───────────────────────────────────────────────────────────────

async def extract() -> list[dict[str, Any]]:
    """
    Lanza dos navegadores Chromium independientes y los cierra al terminar:
    - mobile.de:      headless=False (visible, evita detectores de modo headless)
    - autoscout24.es: headless=True  (suficiente para esta plataforma)
    """
    async with async_playwright() as pw:
        browser_mobile = await pw.chromium.launch(
            headless=False,   # navegador visible para mobile.de
            args=CHROMIUM_ARGS,
        )
        browser_headless = await pw.chromium.launch(
            headless=True,
            args=CHROMIUM_ARGS,
        )
        try:
            mobile_results    = await fetch_mobile_de(browser_mobile)
            autoscout_results = await fetch_autoscout24(browser_headless)
        finally:
            await browser_mobile.close()
            await browser_headless.close()

    all_results = mobile_results + autoscout_results
    logger.info("Extracción total: %d registros crudos", len(all_results))
    return all_results
