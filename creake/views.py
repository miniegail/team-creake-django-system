from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from decimal import Decimal
import json
import logging

from .models import Cake, Order, OrderItem

logger = logging.getLogger(__name__)


def index(request):
    """Home page with cake listing"""
    context = {
        'categories': Cake.CATEGORY_CHOICES,
    }
    return render(request, 'cake/index.html', context)


@require_http_methods(["GET"])
def get_cakes(request):
    """API endpoint to get filtered and sorted cakes"""
    try:
        cakes = Cake.objects.all()

        # Filter by category
        category = request.GET.get('category', 'all')
        if category and category != 'all':
            cakes = cakes.filter(category=category)

        # Filter by search
        search = request.GET.get('search', '').strip()
        if search:
            cakes = cakes.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Filter by price
        max_price = request.GET.get('maxPrice', '10000')
        try:
            cakes = cakes.filter(price__lte=Decimal(max_price))
        except (ValueError, TypeError):
            pass

        # Filter by rating
        min_rating = request.GET.get('minRating', '0')
        try:
            cakes = cakes.filter(rating__gte=float(min_rating))
        except (ValueError, TypeError):
            pass

        # Sort
        sort_by = request.GET.get('sortBy', 'name')
        if sort_by == 'price-low':
            cakes = cakes.order_by('price')
        elif sort_by == 'price-high':
            cakes = cakes.order_by('-price')
        elif sort_by == 'rating':
            cakes = cakes.order_by('-rating', '-reviews')
        elif sort_by == 'newest':
            cakes = cakes.order_by('-created_at')
        else:
            cakes = cakes.order_by('name')

        # Serialize data
        cakes_data = [
            {
                'id': cake.id,
                'name': cake.name,
                'category': cake.category,
                'desc': cake.description[:100] + '...' if len(cake.description) > 100 else cake.description,
                'price': float(cake.price),
                'img': cake.image.url if cake.image else '/static/cake/images/placeholder.png',
                'badge': 'Best Seller' if cake.is_bestseller else ('New' if cake.is_new else ''),
                'rating': cake.rating,
                'reviews': cake.reviews,
                'new': cake.is_new,
            }
            for cake in cakes
        ]

        return JsonResponse({
            'success': True,
            'cakes': cakes_data,
            'count': len(cakes_data)
        })
    except Exception as e:
        logger.error(f"Error fetching cakes: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Error loading cakes'
        }, status=500)


@require_http_methods(["POST"])
@csrf_exempt
def create_order(request):
    """Create an order from cart"""
    try:
        data = json.loads(request.body)
        
        # Validate input
        if not data.get('cartItems'):
            return JsonResponse({
                'success': False,
                'message': 'Cart is empty'
            }, status=400)

        # Calculate delivery cost
        delivery_costs = {
            'standard': 50,
            'express': 150,
            'sameday': 300,
        }
        
        delivery_fee = Decimal(str(delivery_costs.get(data.get('deliveryType'), 0)))
        
        # Create order
        order = Order.objects.create(
            full_name=data.get('fullName', '').strip(),
            email=data.get('email', '').strip(),
            phone=data.get('phone', '').strip(),
            address=data.get('address', '').strip(),
            city=data.get('city', '').strip(),
            postal_code=data.get('postalCode', '').strip(),
            delivery_type=data.get('deliveryType'),
            payment_method=data.get('paymentMethod'),
            special_instructions=data.get('notes', '').strip(),
            total_amount=Decimal(str(data.get('total', 0))),
            status='pending',
        )

        # Add items to order
        for item in data.get('cartItems', []):
            try:
                cake = Cake.objects.get(id=item['id'])
                
                OrderItem.objects.create(
                    order=order,
                    cake=cake,
                    quantity=item['quantity'],
                    price=Decimal(str(item['price'])),
                )
                
            except Cake.DoesNotExist:
                order.delete()
                return JsonResponse({
                    'success': False,
                    'message': f'Cake with ID {item["id"]} not found'
                }, status=400)

        logger.info(f"Order #{order.id} created successfully")
        
        return JsonResponse({
            'success': True,
            'orderId': order.id,
            'message': 'Order placed successfully!'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)