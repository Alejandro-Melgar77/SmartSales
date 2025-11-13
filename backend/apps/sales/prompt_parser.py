import re
import datetime
from django.utils import timezone

def parse_prompt(prompt_text):
    """
    Interpreta un prompt de texto para extraer filtros de reporte.
    Cumple con el requisito de "parser propio simple"[cite: 72].
    """
    prompt_text = prompt_text.lower()
    filters = {}
    
    # 1. Detectar Formato (PDF/Excel)
    if "en pdf" in prompt_text or "formato pdf" in prompt_text:
        filters['formato'] = 'pdf'
    elif "en excel" in prompt_text or "formato excel" in prompt_text:
        filters['formato'] = 'excel'
    else:
        filters['formato'] = 'pdf' # PDF por defecto

    # 2. Detectar Fechas
    # Formato: "del DD/MM/YYYY al DD/MM/YYYY"
    date_range_match = re.search(r'del (\d{2})/(\d{2})/(\d{4}) al (\d{2})/(\d{2})/(\d{4})', prompt_text)
    if date_range_match:
        try:
            d1, m1, y1, d2, m2, y2 = date_range_match.groups()
            filters['fecha_inicio'] = datetime.date(int(y1), int(m1), int(d1))
            filters['fecha_fin'] = datetime.date(int(y2), int(m2), int(d2))
        except:
            pass # Ignorar fechas inválidas

    # Formato: "mes de [nombre_mes]"
    meses = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
    }
    month_match = re.search(r'mes de (\w+)', prompt_text)
    if month_match and month_match.group(1) in meses:
        month = meses[month_match.group(1)]
        year = 2025 # Asumimos 2025 según los seeders
        
        from calendar import monthrange
        _, last_day = monthrange(year, month)
        
        filters['fecha_inicio'] = datetime.date(year, month, 1)
        filters['fecha_fin'] = datetime.date(year, month, last_day)

    # 3. Detectar Agrupación
    if "agrupado por producto" in prompt_text:
        filters['agrupar_por'] = 'producto'
    elif "agrupado por cliente" in prompt_text:
        filters['agrupar_por'] = 'cliente'
    elif "agrupado por categoria" in prompt_text:
        filters['agrupar_por'] = 'categoria'
        
    # 4. Detectar Filtros (simple)
    # "del producto [nombre]"
    producto_match = re.search(r'del producto ([\w\s]+)', prompt_text)
    if producto_match:
        filters['producto_nombre'] = producto_match.group(1).strip()

    # "del cliente [nombre]"
    cliente_match = re.search(r'del cliente (\w+)', prompt_text)
    if cliente_match:
        filters['cliente_username'] = cliente_match.group(1).strip()
        
    return filters