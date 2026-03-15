from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q, Sum, Count
from datetime import datetime, timedelta
import json

from .models import Cake, Order, CakeDesign, Wishlist, UserProfile, Address
from .forms import UserRegistrationForm, UserProfileForm

# ==================== PUBLIC VIEWS ====================

def quiz(request):
    return render(request, 'creake/quiz.html')

def index(request):
    """Main shop page with all cakes."""
    cakes = Cake.objects.all()
    context = {
        'cakes': cakes,
        'show_quiz': request.session.pop('show_quiz', False),
    }
    return render(request, 'creake/index.html', context)


def login_view(request):
    """Handle user login."""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            next_page = request.POST.get('next', 'creake:delivery')
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            return redirect(next_page)
        else:
            messages.error(request, 'Invalid email or password.')
    
    return render(request, 'creake/index.html')


def register_view(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.username = form.cleaned_data['email']
            user.email = form.cleaned_data['email']
            user.save()

            profile = UserProfile.objects.create(
                user=user,
                phone=form.cleaned_data.get('phone', '')
            )

            login(request, user)
            messages.success(request, '🎉 Account created! Let\'s find your perfect cake.')
            return redirect('creake:quiz')  # ← change this line
        else:
            messages.error(request, 'Please fix the errors below.')
            return redirect('creake:index')
    
    return redirect('creake:index')


def logout_view(request):
    """Handle user logout."""
    logout(request)
    messages.success(request, '👋 Logged out successfully!')
    return redirect('creake:index')


# ==================== DASHBOARD VIEWS ====================

@login_required
def delivery(request):
    """User delivery progress dashboard."""
    user = request.user
    active_orders = Order.objects.filter(
        user=user,
        status__in=['pending', 'paid', 'baking', 'out_for_delivery']
    ).order_by('-created_at')
    
    delivered_count = Order.objects.filter(user=user, status='delivered').count()
    out_for_delivery_count = Order.objects.filter(user=user, status='out_for_delivery').count()
    active_orders_count = active_orders.count()
    total_spent = Order.objects.filter(user=user, status='delivered').aggregate(
        total=Sum('total')
    )['total'] or 0
    
    context = {
        'active_orders': active_orders,
        'active_orders_count': active_orders_count,
        'out_for_delivery_count': out_for_delivery_count,
        'delivered_count': delivered_count,
        'total_spent': total_spent,
    }
    return render(request, 'creake/delivery.html', context)


@login_required
def my_designs(request):
    """User's saved cake designs."""
    user = request.user
    designs = CakeDesign.objects.filter(user=user)
    
    context = {
        'designs': designs,
        'designs_count': designs.count(),
    }
    return render(request, 'creake/my_designs.html', context)


@login_required
def order_history(request):
    """User's complete order history."""
    user = request.user
    orders = Order.objects.filter(user=user).order_by('-created_at')
    
    context = {
        'orders': orders,
        'total_orders': orders.count(),
    }
    return render(request, 'creake/order_history.html', context)


@login_required
def wishlist(request):
    """User's wishlist."""
    user = request.user
    wishlist_items = Wishlist.objects.filter(user=user).select_related('cake')
    
    context = {
        'wishlist_items': wishlist_items,
        'wishlist_count': wishlist_items.count(),
    }
    return render(request, 'creake/wishlist.html', context)


@login_required
def profile(request):
    """User profile management."""
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    addresses = Address.objects.filter(user=user)
    cakes = Cake.objects.all()
    
    total_orders = Order.objects.filter(user=user).count()
    designs_count = CakeDesign.objects.filter(user=user).count()
    wishlist_count = Wishlist.objects.filter(user=user).count()
    total_spent = Order.objects.filter(user=user, status='delivered').aggregate(
        total=Sum('total')
    )['total'] or 0
    
    if request.method == 'POST':
        if 'update_profile' in request.POST:
            user.first_name = request.POST.get('first_name', user.first_name)
            user.last_name = request.POST.get('last_name', user.last_name)
            user.email = request.POST.get('email', user.email)
            user.save()
            
            profile.phone = request.POST.get('phone', '')
            birthday_str = request.POST.get('birthday')
            if birthday_str:
                profile.birthday = birthday_str
            fav_cake_id = request.POST.get('favourite_cake')
            if fav_cake_id:
                profile.favourite_cake_id = int(fav_cake_id)
            profile.save()
            messages.success(request, 'Profile updated!')
        
        elif 'update_notifications' in request.POST:
            profile.notif_orders = request.POST.get('notif_orders') == 'on'
            profile.notif_promos = request.POST.get('notif_promos') == 'on'
            profile.notif_arrivals = request.POST.get('notif_arrivals') == 'on'
            profile.notif_quiz = request.POST.get('notif_quiz') == 'on'
            profile.save()
            messages.success(request, 'Notification preferences updated!')
    
    context = {
        'profile': profile,
        'addresses': addresses,
        'cakes': cakes,
        'total_orders': total_orders,
        'designs_count': designs_count,
        'wishlist_count': wishlist_count,
        'total_spent': total_spent,
    }
    return render(request, 'creake/profile.html', context)


# ==================== CART & CHECKOUT ====================

@require_http_methods(["POST"])
def checkout(request):
    """Process checkout and create order."""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    try:
        data = json.loads(request.body)
        cart = data.get('cart', [])
        delivery_type = data.get('delivery_type', 'standard')
        payment_method = data.get('payment_method', 'credit')
        
        if not cart:
            return JsonResponse({'error': 'Cart is empty'}, status=400)
        
        # Calculate totals
        subtotal = sum(item['price'] * item['quantity'] for item in cart)
        delivery_cost = {'standard': 50, 'express': 150, 'sameday': 300}.get(delivery_type, 0)
        total = subtotal + delivery_cost
        
        # Create order for each cake in cart
        for item in cart:
            Order.objects.create(
                user=request.user,
                cake_name=item['name'],
                quantity=item['quantity'],
                total=item['price'] * item['quantity'],
                status='pending',
                delivery_type=delivery_type,
                payment_method=payment_method,
                address=data.get('address', ''),
                city=data.get('city', ''),
                zip_code=data.get('zip_code', ''),
                phone=data.get('phone', ''),
                special_instructions=data.get('notes', ''),
                estimated_arrival=_calculate_arrival(delivery_type),
            )
        
        messages.success(request, '🎉 Order placed successfully!')
        return JsonResponse({'success': True})
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


def _calculate_arrival(delivery_type):
    """Calculate estimated arrival time."""
    now = datetime.now()
    if delivery_type == 'sameday':
        arrival = now + timedelta(hours=4)
    elif delivery_type == 'express':
        arrival = now + timedelta(days=1)
    else:  # standard
        arrival = now + timedelta(days=2)
    return arrival.strftime('%B %d, %I:%M %p')


# ==================== WISHLIST MANAGEMENT ====================

@login_required
def add_wishlist(request, cake_id):
    """Add cake to wishlist."""
    cake = get_object_or_404(Cake, id=cake_id)
    wishlist, created = Wishlist.objects.get_or_create(user=request.user, cake=cake)
    
    if created:
        messages.success(request, f'Added {cake.name} to wishlist!')
    return redirect(request.META.get('HTTP_REFERER', 'creake:index'))


@login_required
def remove_wishlist(request, wishlist_id):
    """Remove cake from wishlist."""
    wishlist = get_object_or_404(Wishlist, id=wishlist_id, user=request.user)
    cake_name = wishlist.cake.name
    wishlist.delete()
    messages.success(request, f'Removed {cake_name} from wishlist!')
    return redirect(request.META.get('HTTP_REFERER', 'creake:wishlist'))


# ==================== DESIGNS ====================

@login_required
def create_design(request):
    """Create new cake design."""
    if request.method == 'POST':
        name = request.POST.get('name', 'My Design')
        emoji = request.POST.get('emoji', '🎂')
        layers = int(request.POST.get('layers', 2))
        description = request.POST.get('description', '')
        
        design = CakeDesign.objects.create(
            user=request.user,
            name=name,
            emoji=emoji,
            layers=layers,
            description=description,
        )
        messages.success(request, 'Design created!')
        return redirect('creake:my_designs')
    
    return render(request, 'creake/create_design.html')


@login_required
def edit_design(request, design_id):
    """Edit cake design."""
    design = get_object_or_404(CakeDesign, id=design_id, user=request.user)
    
    if request.method == 'POST':
        design.name = request.POST.get('name', design.name)
        design.emoji = request.POST.get('emoji', design.emoji)
        design.layers = int(request.POST.get('layers', design.layers))
        design.description = request.POST.get('description', design.description)
        design.save()
        messages.success(request, 'Design updated!')
        return redirect('creake:my_designs')
    
    context = {'design': design}
    return render(request, 'creake/edit_design.html', context)


@login_required
def reorder_design(request, design_id):
    """Reorder a design as a cake."""
    design = get_object_or_404(CakeDesign, id=design_id, user=request.user)
    # Add to cart logic here (handled by JS)
    messages.success(request, f'Added {design.name} to cart!')
    return redirect('creake:index')


# ==================== ADDRESSES ====================

@login_required
def add_address(request):
    """Add new address."""
    if request.method == 'POST':
        Address.objects.create(
            user=request.user,
            label=request.POST.get('label', 'Home'),
            street=request.POST.get('street'),
            city=request.POST.get('city'),
            zip_code=request.POST.get('zip_code'),
            is_default=request.POST.get('is_default') == 'on',
        )
        messages.success(request, 'Address added!')
        return redirect('creake:profile')
    
    return render(request, 'creake/add_address.html')


# ==================== UTILS ====================

def custom_404(request, exception):
    """Custom 404 page."""
    return render(request, 'creake/404.html', status=404)


def custom_500(request):
    """Custom 500 page."""
    return render(request, 'creake/500.html', status=500)