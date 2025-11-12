from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer
import logging

logger = logging.getLogger(__name__)

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"📦 Payment request received from user: {request.user}")
            logger.info(f"📦 Request data: {request.data}")
            
            data = request.data
            method = data.get('method')
            amount = data.get('amount')
            description = data.get('description', '')

            # Validaciones mejoradas
            if not amount:
                logger.error("❌ Amount is required")
                return Response(
                    {'error': 'El campo "amount" es requerido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                amount_float = float(amount)
                if amount_float <= 0:
                    logger.error(f"❌ Invalid amount: {amount}")
                    return Response(
                        {'error': 'El monto debe ser mayor a 0'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError) as e:
                logger.error(f"❌ Amount conversion error: {e}")
                return Response(
                    {'error': 'El monto debe ser un número válido'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if method not in ['cash', 'paypal']:
                logger.error(f"❌ Invalid payment method: {method}")
                return Response(
                    {'error': 'Método de pago no válido. Use "cash" o "paypal"'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Crear el pago
            payment = Payment.objects.create(
                user=request.user,
                amount=amount,
                method=method,
                status='completed' if method == 'cash' else 'pending',
                description=description
            )

            if method == 'paypal':
                payment.transaction_id = f"PAYPAL-SIM-{payment.id}"
                payment.save()

            logger.info(f"✅ Payment created successfully: {payment.id}")
            
            serializer = self.get_serializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"💥 Error in payment creation: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Error interno del servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )