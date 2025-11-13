from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.http import HttpResponse
from decimal import Decimal # <-- Importar Decimal para el 'or 0.00'

# --- Librerías para PDF y Excel ---
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from openpyxl import Workbook

# --- Importaciones para Reportes Dinámicos ---
from django.db import models
from django.db.models import Sum, Count
from .prompt_parser import parse_prompt
from apps.users.models import User
from django.db.models.functions import TruncMonth


from .models import Venta, DetalleVenta
from .serializers import VentaSerializer, VentaCreateSerializer
from apps.products.models import Producto
from apps.payments.models import Payment

from .ml_model import train_model, predict_future_sales

from .ml_model import get_filtered_data, predict_dynamic # Importa las nuevas funciones
from django.db.models import F

class VentaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint que permite a los usuarios ver sus Notas de Venta.
    """
    serializer_class = VentaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Sobreescribimos para que cada usuario vea solo sus propias ventas.
        """
        return Venta.objects.filter(usuario=self.request.user).order_by('-fecha_creacion')

    @action(detail=False, methods=['post'], url_path='crear-desde-carrito')
    @transaction.atomic
    def crear_desde_carrito(self, request):
        """
        Crea una Venta, sus Detalles, y un Pago a partir de un carrito.
        """
        serializer = VentaCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        items_data = validated_data['items']
        payment_method = validated_data['payment_method']
        user = request.user
        
        total_calculado = Decimal('0.0') # Usar Decimal
        detalles_para_crear = []
        
        try:
            for item in items_data:
                producto = Producto.objects.get(id=item['producto_id'])
                
                precio = producto.precio_venta # Es un Decimal
                total_calculado += (precio * item['cantidad'])
                
                detalles_para_crear.append(
                    DetalleVenta(
                        producto=producto,
                        nombre_producto=producto.nombre, 
                        precio_unitario=precio, 
                        cantidad=item['cantidad']
                    )
                )
        except Producto.DoesNotExist:
            return Response({'error': 'Uno o más productos no existen.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        payment_status = 'pending'
        if payment_method == 'cash':
            payment_status = 'completed'
            
        payment = Payment.objects.create(
            user=user,
            amount=total_calculado,
            method=payment_method,
            status=payment_status
        )

        venta_status = 'PROCESANDO'
        if payment_status == 'completed':
            venta_status = 'COMPLETADO'
            
        venta = Venta.objects.create(
            usuario=user,
            pago=payment,
            total=total_calculado,
            estado=venta_status
        )

        for detalle in detalles_para_crear:
            detalle.venta = venta
        
        DetalleVenta.objects.bulk_create(detalles_para_crear)

        return Response(
            VentaSerializer(venta).data, 
            status=status.HTTP_201_CREATED
        )

    
    # --- Acciones para descargar PDF/Excel de UNA sola venta ---
    @action(detail=True, methods=['get'], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        venta = self.get_object() 
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        p.setFont("Helvetica-Bold", 16)
        p.drawString(inch, height - inch, f"Nota de Venta #{venta.id}")
        p.setFont("Helvetica", 12)
        p.drawString(inch, height - 1.25*inch, f"Cliente: {venta.usuario.get_full_name()}")
        p.drawString(inch, height - 1.5*inch, f"Fecha: {venta.fecha_creacion.strftime('%d/%m/%Y %H:%M')}")
        p.drawString(inch, height - 1.75*inch, f"Estado: {venta.get_estado_display()}")
        p.setFont("Helvetica-Bold", 12)
        p.drawString(inch, height - 2.25*inch, "Detalles del Pedido:")
        p.setFont("Helvetica", 11)
        y = height - 2.5*inch
        
        p.drawString(inch, y, "Producto")
        p.drawString(inch * 4, y, "Cantidad")
        p.drawString(inch * 5, y, "P. Unitario")
        p.drawString(inch * 6, y, "Subtotal")
        y -= 0.25*inch
        
        for detalle in venta.detalles.all():
            y -= 0.25*inch
            subtotal = detalle.precio_unitario * detalle.cantidad
            p.drawString(inch, y, detalle.nombre_producto[:50])
            p.drawString(inch * 4, y, str(detalle.cantidad))
            p.drawString(inch * 5, y, f"Bs. {detalle.precio_unitario}")
            p.drawString(inch * 6, y, f"Bs. {subtotal}")
        
        y -= 0.5*inch
        p.setFont("Helvetica-Bold", 14)
        p.drawString(inch * 5, y, "Total:")
        p.drawString(inch * 6, y, f"Bs. {venta.total}")
        
        p.showPage()
        p.save()

        buffer.seek(0)
        return HttpResponse(
            buffer,
            content_type='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="venta_{venta.id}.pdf"'},
        )


    @action(detail=True, methods=['get'], url_path='download-excel')
    def download_excel(self, request, pk=None):
        venta = self.get_object()
        buffer = io.BytesIO()
        wb = Workbook()
        ws = wb.active
        ws.title = f"Venta {venta.id}"

        ws.append(["Nota de Venta", f"#{venta.id}"])
        ws.append(["Cliente", venta.usuario.get_full_name()])
        ws.append(["Fecha", venta.fecha_creacion.strftime('%d/%m/%Y %H:%M')])
        ws.append(["Estado", venta.get_estado_display()])
        ws.append([])
        
        ws.append(["Producto", "Cantidad", "Precio Unitario", "Subtotal"])
        for detalle in venta.detalles.all():
            subtotal = detalle.precio_unitario * detalle.cantidad
            ws.append([
                detalle.nombre_producto,
                detalle.cantidad,
                detalle.precio_unitario,
                subtotal
            ])
            
        ws.append([])
        ws.append(["", "", "Total:", venta.total])

        wb.save(buffer)
        buffer.seek(0)
        return HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename="venta_{venta.id}.xlsx"'},
        )


# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---
# ---     VIEWSET DE REPORTES (CON LAS CORRECCIONES PARA ERROR 500)     ---
# --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- --- ---

class ReportGeneratorViewSet(viewsets.ViewSet):
    """
    API endpoint para la generación dinámica de reportes
    basado en filtros o prompts de voz/texto.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='generar')
    def generate_report(self, request):
        prompt = request.data.get('prompt')
        
        if prompt:
            print(f"🤖 Recibido prompt: {prompt}")
            filters = parse_prompt(prompt)
            print(f"🔍 Filtros parseados: {filters}")
        else:
            filters = request.data
            print(f" manuel: {filters}")
        
        queryset = DetalleVenta.objects.filter(venta__estado='COMPLETADO')
        
        fecha_inicio_str = filters.get('fecha_inicio')
        fecha_fin_str = filters.get('fecha_fin')
        
        # Validación de fechas (AHORA es más robusta)
        if not fecha_inicio_str or not fecha_fin_str:
            # Si el prompt no tenía fecha, el parser no la añade.
            # Los filtros manuales sí la añaden.
            # Por lo tanto, si no hay fecha, es un prompt inválido.
            if prompt:
                return Response({'error': 'El prompt no especificó un rango de fechas válido (ej: "mes de septiembre").'}, status=400)
            else:
                return Response({'error': 'Se requiere un rango de fechas.'}, status=400)
            
        queryset = queryset.filter(fecha_creacion__gte=fecha_inicio_str, fecha_creacion__lte=fecha_fin_str)
        
        if filters.get('categoria_id'):
            queryset = queryset.filter(producto__categoria_id=filters.get('categoria_id'))
        if filters.get('producto_id'):
            queryset = queryset.filter(producto_id=filters.get('producto_id'))
        if filters.get('usuario_id'):
            queryset = queryset.filter(venta__usuario_id=filters.get('usuario_id'))
        if filters.get('producto_nombre'):
            queryset = queryset.filter(producto__nombre__icontains=filters.get('producto_nombre'))
        if filters.get('cliente_username'):
            queryset = queryset.filter(venta__usuario__username=filters.get('cliente_username'))

        group_by = filters.get('agrupar_por')
        
        if group_by == 'producto':
            report_data = queryset.values('nombre_producto') \
                                  .annotate(total_vendido=Sum(models.F('precio_unitario') * models.F('cantidad')),
                                            cantidad_total=Sum('cantidad')) \
                                  .order_by('-total_vendido')
            titulo = "Reporte de Ventas por Producto"
            headers = ["Producto", "Cantidad Vendida", "Total Recaudado"]
            
        elif group_by == 'cliente':
            report_data = queryset.values('venta__usuario__username') \
                                  .annotate(total_vendido=Sum(models.F('precio_unitario') * models.F('cantidad')),
                                            compras_total=Count('venta_id', distinct=True)) \
                                  .order_by('-total_vendido')
            titulo = "Reporte de Ventas por Cliente"
            headers = ["Cliente (username)", "N° Compras", "Total Gastado"]

        elif group_by == 'categoria':
            report_data = queryset.values('producto__categoria__nombre') \
                                  .annotate(total_vendido=Sum(models.F('precio_unitario') * models.F('cantidad')),
                                            cantidad_total=Sum('cantidad')) \
                                  .order_by('-total_vendido')
            titulo = "Reporte de Ventas por Categoría"
            headers = ["Categoría", "Cantidad Vendida", "Total Recaudado"]
            
        else:
            # Reporte simple (solo total)
            total_general = queryset.aggregate(total=Sum(models.F('precio_unitario') * models.F('cantidad')))
            report_data = [{'total': total_general['total'] or Decimal('0.00')}] # Asegura que no sea None
            titulo = "Reporte de Ventas General"
            headers = ["Total General de Ventas"] # <-- Lista con UN item

        formato = filters.get('formato', 'pdf')
        
        if formato == 'excel':
            return self.generate_excel(report_data, titulo, headers, group_by)
        else:
            return self.generate_pdf(report_data, titulo, headers, group_by)


    def generate_pdf(self, data, titulo, headers, group_by):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 1.5*inch
        
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(width/2.0, height - 1*inch, titulo)
        
        p.setFont("Helvetica-Bold", 10)
        
        # --- 👇 INICIO DE LA CORRECCIÓN (Manejar 1 o 3 headers) ---
        if not group_by:
            # Reporte simple, solo un header
            p.drawString(inch, y, headers[0])
        else:
            # Reporte agrupado, tres headers
            p.drawString(inch, y, headers[0])
            p.drawString(inch * 4, y, headers[1])
            p.drawString(inch * 6, y, headers[2])
        # --- 👆 FIN DE LA CORRECCIÓN ---

        y -= 0.25*inch
        
        p.setFont("Helvetica", 9)
        for item in data:
            if y < inch: 
                p.showPage()
                y = height - inch
            
            # --- 👇 INICIO DE LA CORRECCIÓN (Manejar 1 o 3 columnas) ---
            if not group_by:
                # Solo mostrar el total
                p.drawString(inch, y, f"Bs. {item['total']:.2f}")
            # --- 👆 FIN DE LA CORRECCIÓN ---
            
            elif group_by == 'producto':
                p.drawString(inch, y, str(item['nombre_producto']))
                p.drawString(inch * 4, y, str(item['cantidad_total']))
                p.drawString(inch * 6, y, f"Bs. {item['total_vendido']:.2f}")
            elif group_by == 'cliente':
                p.drawString(inch, y, str(item['venta__usuario__username']))
                p.drawString(inch * 4, y, str(item['compras_total']))
                p.drawString(inch * 6, y, f"Bs. {item['total_vendido']:.2f}")
            elif group_by == 'categoria':
                p.drawString(inch, y, str(item.get('producto__categoria__nombre', 'N/A')))
                p.drawString(inch * 4, y, str(item['cantidad_total']))
                p.drawString(inch * 6, y, f"Bs. {item['total_vendido']:.2f}")
            
            y -= 0.25*inch

        p.showPage()
        p.save()
        buffer.seek(0)
        return HttpResponse(buffer, content_type='application/pdf', headers={'Content-Disposition': 'attachment; filename="reporte.pdf"'})


    def generate_excel(self, data, titulo, headers, group_by):
        buffer = io.BytesIO()
        wb = Workbook()
        ws = wb.active
        ws.title = "Reporte"
        
        ws.append([titulo])
        ws.append([]) # Línea vacía
        ws.append(headers)
        
        for item in data:
            # --- 👇 INICIO DE LA CORRECCIÓN (Manejar 1 o 3 columnas) ---
            if not group_by:
                # Solo mostrar el total
                ws.append([item['total']])
            # --- 👆 FIN DE LA CORRECCIÓN ---
            
            elif group_by == 'producto':
                ws.append([str(item['nombre_producto']), item['cantidad_total'], item['total_vendido']])
            elif group_by == 'cliente':
                ws.append([str(item['venta__usuario__username']), item['compras_total'], item['total_vendido']])
            elif group_by == 'categoria':
                ws.append([str(item.get('producto__categoria__nombre', 'N/A')), item['cantidad_total'], item['total_vendido']])

        wb.save(buffer)
        buffer.seek(0)
        return HttpResponse(
            buffer,
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': 'attachment; filename="reporte.xlsx"'}
        )
    
class DashboardViewSet(viewsets.ViewSet):
    """
    API endpoint para los datos del Dashboard de Ventas e IA.
    """
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='historical-data')
    def historical_data(self, request):
        """
        Devuelve datos históricos filtrados.
        Body esperado: { categoria_id, producto_id, metric, start_date, end_date }
        """
        filters = request.data
        
        # Usamos la misma lógica de obtención de datos que el modelo de ML
        df = get_filtered_data(filters)
        
        if df is None:
            return Response([])
            
        # Filtrar por rango de fechas si se especifica
        if filters.get('start_date'):
            df = df[df['fecha'] >= filters['start_date']]
        if filters.get('end_date'):
            df = df[df['fecha'] <= filters['end_date']]

        # Formatear para el frontend
        data = []
        for _, row in df.iterrows():
            data.append({
                "fecha": row['fecha'].strftime("%Y-%m-%d"),
                "valor": row['valor']
            })
            
        return Response(data)

    @action(detail=False, methods=['post'], url_path='generate-prediction')
    def generate_prediction(self, request):
        """
        Genera una proyección basada en los filtros actuales.
        Body: { categoria_id, producto_id, metric, months }
        """
        filters = request.data
        months = int(filters.get('months', 6))
        
        predictions = predict_dynamic(filters, months_to_predict=months)
        
        if isinstance(predictions, dict) and 'error' in predictions:
            return Response(predictions, status=status.HTTP_400_BAD_REQUEST)
            
        return Response(predictions)