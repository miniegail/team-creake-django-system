from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.views.decorators.http import require_http_methods, require_POST
from django.http import JsonResponse
from django.contrib import messages
from django.db.models import Q, Sum, Count
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta, date
from django.db.models import Avg
import json
import logging
logger = logging.getLogger(__name__)

from .models import Cake, Order, CakeDesign, Wishlist, UserProfile, Address, CakeRating, CakeReview
from .forms import UserRegistrationForm, UserProfileForm

# ==================== HELPERS ====================

def is_admin(user):
    return user.is_authenticated and user.is_staff


# ==================== PUBLIC VIEWS ====================

def quiz(request):
    return render(request, 'creake/quiz.html')


def index(request):
    cakes = Cake.objects.all()
    user_ratings = {}
    received_cake_names = set()
    saved_address = None        # ← ADD
    if request.user.is_authenticated:
        user_ratings = {
            str(r.cake_id): r.rating
            for r in CakeRating.objects.filter(user=request.user)
        }
        received_cake_names = set(
            Order.objects.filter(
                user=request.user, status='received'
            ).values_list('cake_name', flat=True)
        )
        # Get default address, fall back to most recent
        saved_address = (
            Address.objects.filter(user=request.user, is_default=True).first()
            or Address.objects.filter(user=request.user).order_by('-created_at').first()
        )
    wishlist_ids = list(
        Wishlist.objects.filter(user=request.user).values_list('cake_id', flat=True)
    ) if request.user.is_authenticated else []
    context = {
        'cakes': cakes,
        'user_ratings': user_ratings,
        'received_cake_names': list(received_cake_names),
        'show_quiz': request.session.pop('show_quiz', False),
        'saved_address': saved_address,
        'wishlist_ids': wishlist_ids,
    }
    return render(request, 'creake/index.html', context)


def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.first_name or user.username}!')
            if user.is_staff:
                return redirect('creake:admin_dashboard')
            else:
                next_page = request.POST.get('next', 'creake:delivery')
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
            UserProfile.objects.create(user=user, phone=form.cleaned_data.get('phone', ''))
            login(request, user)
            messages.success(request, '🎉 Account created! Let\'s find your perfect cake.')
            return redirect('creake:quiz')
        else:
            messages.error(request, 'Please fix the errors below.')
            return redirect('creake:index')
    return redirect('creake:index')


def logout_view(request):
    logout(request)
    messages.success(request, '👋 Logged out successfully!')
    return redirect('creake:index')


# ==================== USER DASHBOARD VIEWS ====================

@login_required
def delivery(request):
    if request.user.is_staff:
        return redirect('creake:admin_dashboard')
    user = request.user
    active_orders = Order.objects.filter(
        user=user, status__in=['pending', 'paid', 'baking', 'out_for_delivery']
    ).order_by('-created_at')
    delivered_orders = Order.objects.filter(
        user=user, status='delivered'
    ).order_by('-created_at')
    delivered_count = delivered_orders.count()
    out_for_delivery_count = Order.objects.filter(user=user, status='out_for_delivery').count()
    active_orders_count = active_orders.count()
    total_spent = delivered_orders.aggregate(
        total=Sum('total'))['total'] or 0
    context = {
        'active_orders': active_orders,
        'active_orders_count': active_orders_count,
        'out_for_delivery_count': out_for_delivery_count,
        'delivered_count': delivered_count,
        'total_spent': total_spent,
        'delivered_orders': delivered_orders,
    }
    return render(request, 'creake/delivery.html', context)

@login_required
def my_designs(request):
    if request.user.is_staff:
        return redirect('creake:admin_dashboard')
    designs = CakeDesign.objects.filter(user=request.user)
    return render(request, 'creake/my_designs.html', {'designs': designs, 'designs_count': designs.count()})


@login_required
def order_history(request):
    if request.user.is_staff:
        return redirect('creake:admin_dashboard')
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'creake/order_history.html', {'orders': orders, 'total_orders': orders.count()})


@login_required
def wishlist(request):
    if request.user.is_staff:
        return redirect('creake:admin_dashboard')
    wishlist_items = Wishlist.objects.filter(user=request.user).select_related('cake')
    return render(request, 'creake/wishlist.html', {
        'wishlist_items': wishlist_items,
        'wishlist_count': wishlist_items.count(),
    })


@login_required
def profile(request):
    if request.user.is_staff:
        return redirect('creake:admin_dashboard')
    user = request.user
    profile, created = UserProfile.objects.get_or_create(user=user)
    addresses = Address.objects.filter(user=user)
    cakes = Cake.objects.all()
    total_orders = Order.objects.filter(user=user).count()
    designs_count = CakeDesign.objects.filter(user=user).count()
    wishlist_count = Wishlist.objects.filter(user=user).count()
    total_spent = Order.objects.filter(user=user, status='delivered').aggregate(
        total=Sum('total'))['total'] or 0

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
        'profile': profile, 'addresses': addresses, 'cakes': cakes,
        'total_orders': total_orders, 'designs_count': designs_count,
        'wishlist_count': wishlist_count, 'total_spent': total_spent,
    }
    return render(request, 'creake/profile.html', context)


# ==================== CART & CHECKOUT ====================

@require_http_methods(["POST"])
def checkout(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    try:
        data = json.loads(request.body)
        cart = data.get('cart', [])
        delivery_type = data.get('delivery_type', 'standard')
        payment_method = data.get('payment_method', 'cash')
        if not cart:
            return JsonResponse({'error': 'Cart is empty'}, status=400)

        # Use saved address if flagged
        if data.get('use_saved_address'):
            addr = (
                Address.objects.filter(user=request.user, is_default=True).first()
                or Address.objects.filter(user=request.user).order_by('-created_at').first()
            )
            address = addr.street if addr else ''
            city = addr.city if addr else ''
            zip_code = addr.zip_code if addr else ''
            phone = request.user.profile.phone if hasattr(request.user, 'profile') else ''
        else:
            address = data.get('address', '')
            city = data.get('city', '')
            zip_code = data.get('zip_code', '')
            phone = data.get('phone', '')

        for item in cart:
            Order.objects.create(
                user=request.user,
                cake_name=item['name'],
                quantity=item['quantity'],
                total=item['price'] * item['quantity'],
                status='pending',
                address=address,
                city=city,
                zip_code=zip_code,
                phone=phone,
                special_instructions=f"Delivery: {delivery_type} | Payment: {payment_method} | Notes: {data.get('notes', '')}",
                estimated_arrival=_calculate_arrival(delivery_type),
            )
        messages.success(request, '🎉 Order placed successfully!')
        return JsonResponse({'success': True})
    except Exception as e:
        logger.error(f"Checkout error for user {request.user.username}: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=400)


def _calculate_arrival(delivery_type):
    now = datetime.now()
    if delivery_type == 'sameday':
        arrival = now + timedelta(hours=4)
    elif delivery_type == 'express':
        arrival = now + timedelta(days=1)
    else:
        arrival = now + timedelta(days=2)
    return arrival.strftime('%B %d, %I:%M %p')


# ==================== WISHLIST ====================

@login_required
@require_POST
def toggle_wishlist(request):
    try:
        data = json.loads(request.body)
        cake_id = data.get('cake_id')
        cake = get_object_or_404(Cake, id=cake_id)
        obj, created = Wishlist.objects.get_or_create(user=request.user, cake=cake)
        if not created:
            obj.delete()
        return JsonResponse({'success': True, 'wishlisted': created})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
def add_wishlist(request, cake_id):
    cake = get_object_or_404(Cake, id=cake_id)
    wishlist, created = Wishlist.objects.get_or_create(user=request.user, cake=cake)
    if created:
        messages.success(request, f'Added {cake.name} to wishlist!')
    return redirect(request.META.get('HTTP_REFERER', 'creake:index'))


@login_required
def remove_wishlist(request, wishlist_id):
    wishlist = get_object_or_404(Wishlist, id=wishlist_id, user=request.user)
    cake_name = wishlist.cake.name
    wishlist.delete()
    messages.success(request, f'Removed {cake_name} from wishlist!')
    return redirect(request.META.get('HTTP_REFERER', 'creake:wishlist'))


# ==================== DESIGNS ====================

@login_required
def create_design(request):
    if request.method == 'POST':
        CakeDesign.objects.create(
            user=request.user,
            name=request.POST.get('name', 'My Design'),
            emoji=request.POST.get('emoji', '🎂'),
            layers=int(request.POST.get('layers', 2)),
            description=request.POST.get('description', ''),
        )
        messages.success(request, 'Design created!')
        return redirect('creake:my_designs')
    return render(request, 'creake/create_design.html')


@login_required
def edit_design(request, design_id):
    design = get_object_or_404(CakeDesign, id=design_id, user=request.user)
    if request.method == 'POST':
        design.name = request.POST.get('name', design.name)
        design.emoji = request.POST.get('emoji', design.emoji)
        design.layers = int(request.POST.get('layers', design.layers))
        design.description = request.POST.get('description', design.description)
        design.save()
        messages.success(request, 'Design updated!')
        return redirect('creake:my_designs')
    return render(request, 'creake/edit_design.html', {'design': design})


@login_required
def reorder_design(request, design_id):
    design = get_object_or_404(CakeDesign, id=design_id, user=request.user)
    messages.success(request, f'Added {design.name} to cart!')
    return redirect('creake:index')


# ==================== ADDRESSES ====================

@login_required
def add_address(request):
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

# ==================== CUSTOMIZE PAGE ====================

def customize(request):
    return render(request, 'creake/creake.html')


@require_http_methods(["POST"])
def customize_order(request):
    try:
        data = json.loads(request.body)
        cake_name = (
            f"Custom Cake — {data.get('cake_flavor', '').title()}, "
            f"{data.get('cake_size', '')}\" "
            f"({data.get('cake_layers', '')} layer/s, "
            f"{data.get('icing_type', '')} frosting)"
        )
        instructions = (
            f"Flavor: {data.get('cake_flavor', '')} | "
            f"Filling: {data.get('filling', '')} | "
            f"Icing: {data.get('icing_type', '')} ({data.get('icing_color', '')}) | "
            f"Decorations: {', '.join(data.get('toppings', [])) or 'None'} | "
            f"Message on cake: '{data.get('cake_message', '') or 'None'}' | "
            f"Delivery: {data.get('delivery_type', '')} | "
            f"Payment: {data.get('payment_method', '')} | "
            f"Notes: {data.get('notes', '') or 'None'}"
        )
        Order.objects.create(
            user=request.user if request.user.is_authenticated else None,
            cake_name=cake_name,
            quantity=1,
            total=data.get('total_price', 0),
            address=data.get('address', ''),
            city=data.get('city', ''),
            zip_code=data.get('zip_code', ''),
            phone=data.get('phone', ''),
            status='pending',
            is_custom_cake=True,
            custom_status='pending',
            special_instructions=instructions,
            estimated_arrival=_calculate_arrival(data.get('delivery_type', 'standard')),
        )
        cake_details = (
            f"NEW CUSTOM CAKE ORDER\n=====================\n"
            f"Customer : {data.get('first_name', '')} {data.get('last_name', '')}\n"
            f"Email    : {data.get('email', '')}\nPhone    : {data.get('phone', '')}\n\n"
            f"CAKE DETAILS\n------------\n"
            f"Size: {data.get('cake_size', '')} inch | Layers: {data.get('cake_layers', '')} | "
            f"Flavor: {data.get('cake_flavor', '')} | Filling: {data.get('filling', '')} | "
            f"Frosting: {data.get('icing_type', '')} ({data.get('icing_color', '')}) | "
            f"Decorations: {', '.join(data.get('toppings', [])) or 'None'} | "
            f"Message: {data.get('cake_message', '') or 'None'}\n\n"
            f"DELIVERY\n--------\n"
            f"Address: {data.get('address', '')}, {data.get('city', '')} {data.get('zip_code', '')}\n"
            f"Delivery: {data.get('delivery_type', '')} | Payment: {data.get('payment_method', '')}\n"
            f"Notes: {data.get('notes', '') or 'None'}\n\nTOTAL: ₱{data.get('total_price', 0)}"
        )
        send_mail(
            subject=f"🎂 New Custom Cake Order — {data.get('first_name', '')} {data.get('last_name', '')}",
            message=cake_details,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.ADMIN_EMAIL],
            fail_silently=True,
        )
        send_mail(
            subject="🎂 Your CREAKE Order is Confirmed!",
            message=f"Hi {data.get('first_name', '')}!\n\nThank you for your order. We've received your custom cake request and will contact you shortly.\n\n{cake_details}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[data.get('email', '')],
            fail_silently=True,
        )
        return JsonResponse({'success': True})
    except Exception as e:
        logger.error(f"Custom order error for user {request.user if request.user.is_authenticated else 'guest'}: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=400)


# ==================== ADMIN VIEWS ====================

@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_dashboard(request):
    today = date.today()
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    total_cakes = Cake.objects.count()
    total_users = User.objects.filter(is_staff=False).count()
    pending_custom = Order.objects.filter(is_custom_cake=True, custom_status='pending').count()
    delivered_today = Order.objects.filter(status='delivered', delivered_at__date=today).count()
    out_for_delivery = Order.objects.filter(status='out_for_delivery').count()
    total_revenue = Order.objects.filter(status='delivered').aggregate(total=Sum('total'))['total'] or 0
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    pending_custom_list = Order.objects.filter(
        is_custom_cake=True, custom_status='pending'
    ).select_related('user').order_by('-created_at')[:5]
    context = {
        'total_orders': total_orders, 'pending_orders': pending_orders,
        'total_cakes': total_cakes, 'total_users': total_users,
        'pending_custom': pending_custom, 'delivered_today': delivered_today,
        'out_for_delivery': out_for_delivery, 'total_revenue': total_revenue,
        'recent_orders': recent_orders, 'pending_custom_list': pending_custom_list,
        'pending_orders_count': pending_orders, 'pending_custom_count': pending_custom,
    }
    return render(request, 'creake/admin_dashboard.html', context)


@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_orders(request):
    status_filter = request.GET.get('status', 'all')
    orders = Order.objects.select_related('user').order_by('-created_at')
    if status_filter != 'all':
        orders = orders.filter(status=status_filter)
    status_tabs = [
        ('All', 'all', Order.objects.count()),
        ('Pending', 'pending', Order.objects.filter(status='pending').count()),
        ('Paid', 'paid', Order.objects.filter(status='paid').count()),
        ('Baking', 'baking', Order.objects.filter(status='baking').count()),
        ('Out for Delivery', 'out_for_delivery', Order.objects.filter(status='out_for_delivery').count()),
        ('Delivered', 'delivered', Order.objects.filter(status='delivered').count()),
        ('Cancelled', 'cancelled', Order.objects.filter(status='cancelled').count()),
    ]
    context = {
        'orders': orders, 'status_tabs': status_tabs, 'current_status': status_filter,
        'pending_orders_count': Order.objects.filter(status='pending').count(),
        'pending_custom_count': Order.objects.filter(is_custom_cake=True, custom_status='pending').count(),
    }
    return render(request, 'creake/admin_orders.html', context)


@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_order_detail(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    context = {
        'order': order,
        'pending_orders_count': Order.objects.filter(status='pending').count(),
        'pending_custom_count': Order.objects.filter(is_custom_cake=True, custom_status='pending').count(),
    }
    return render(request, 'creake/admin_order_detail.html', context)


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_update_order_status(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    new_status = request.POST.get('status')
    if new_status:
        order.status = new_status
        now = datetime.now()
        if new_status == 'paid' and not order.paid_at:
            order.paid_at = now
        elif new_status == 'baking' and not order.baking_at:
            order.baking_at = now
        elif new_status == 'delivered' and not order.delivered_at:
            order.delivered_at = now
        step_map = {'pending': 1, 'paid': 2, 'baking': 3, 'out_for_delivery': 4, 'delivered': 5}
        order.step = step_map.get(new_status, 0)
    rider_name = request.POST.get('rider_name', '').strip()
    estimated_arrival = request.POST.get('estimated_arrival', '').strip()
    if rider_name:
        order.rider_name = rider_name
    if estimated_arrival:
        order.estimated_arrival = estimated_arrival
    order.save()
    messages.success(request, f'Order #{order.id} updated to {order.get_status_display()}!')
    return redirect(request.META.get('HTTP_REFERER', 'creake:admin_orders'))


@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_custom_cakes(request):
    status_filter = request.GET.get('status', 'all')
    custom_cakes = Order.objects.filter(is_custom_cake=True).select_related('user').order_by('-created_at')
    if status_filter != 'all':
        custom_cakes = custom_cakes.filter(custom_status=status_filter)
    context = {
        'custom_cakes': custom_cakes, 'current_status': status_filter,
        'pending_orders_count': Order.objects.filter(status='pending').count(),
        'pending_custom_count': Order.objects.filter(is_custom_cake=True, custom_status='pending').count(),
    }
    return render(request, 'creake/admin_custom_cakes.html', context)


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_approve_custom_cake(request, order_id):
    order = get_object_or_404(Order, id=order_id, is_custom_cake=True)
    order.custom_status = 'approved'
    order.save()
    messages.success(request, f'Custom cake order #{order.id} approved!')
    return redirect('creake:admin_custom_cakes')


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_reject_custom_cake(request, order_id):
    order = get_object_or_404(Order, id=order_id, is_custom_cake=True)
    order.custom_status = 'rejected'
    order.save()
    messages.success(request, f'Custom cake order #{order.id} rejected.')
    return redirect('creake:admin_custom_cakes')


@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_cakes(request):
    cakes = Cake.objects.all()
    context = {
        'cakes': cakes,
        'pending_orders_count': Order.objects.filter(status='pending').count(),
        'pending_custom_count': Order.objects.filter(is_custom_cake=True, custom_status='pending').count(),
    }
    return render(request, 'creake/admin_cakes.html', context)


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_add_cake(request):
    try:
        Cake.objects.create(
            name=request.POST.get('name'),
            category=request.POST.get('category'),
            description=request.POST.get('description', ''),
            price=request.POST.get('price'),
            badge=request.POST.get('badge', '') or None,
            is_new=request.POST.get('is_new') == 'on',
            image=request.FILES.get('image'),
        )
        messages.success(request, 'Cake added successfully!')
    except Exception as e:
        logger.error(f"Add cake error: {e}", exc_info=True)
        messages.error(request, f'Error adding cake: {str(e)}')
    return redirect('creake:admin_cakes')


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_edit_cake(request, cake_id):
    cake = get_object_or_404(Cake, id=cake_id)
    try:
        cake.name = request.POST.get('name', cake.name)
        cake.category = request.POST.get('category', cake.category)
        cake.description = request.POST.get('description', cake.description)
        cake.price = request.POST.get('price', cake.price)
        cake.badge = request.POST.get('badge', '') or None
        cake.is_new = request.POST.get('is_new') == 'on'
        if request.FILES.get('image'):
            cake.image = request.FILES.get('image')
        cake.save()
        messages.success(request, f'{cake.name} updated successfully!')
    except Exception as e:
        logger.error(f"Edit cake {cake_id} error: {e}", exc_info=True)
        messages.error(request, f'Error updating cake: {str(e)}')
    return redirect('creake:admin_cakes')


@login_required
@user_passes_test(is_admin, login_url='creake:index')
@require_http_methods(["POST"])
def admin_delete_cake(request, cake_id):
    cake = get_object_or_404(Cake, id=cake_id)
    name = cake.name
    cake.delete()
    messages.success(request, f'{name} deleted.')
    return redirect('creake:admin_cakes')


@login_required
@user_passes_test(is_admin, login_url='creake:index')
def admin_users(request):
    users = User.objects.filter(is_staff=False).select_related('profile').annotate(
        order_count=Count('order'),
        total_spent=Sum('order__total', filter=Q(order__status='delivered'))
    ).order_by('-date_joined')
    context = {
        'users': users, 'total_users': users.count(),
        'pending_orders_count': Order.objects.filter(status='pending').count(),
        'pending_custom_count': Order.objects.filter(is_custom_cake=True, custom_status='pending').count(),
    }
    return render(request, 'creake/admin_users.html', context)


# ==================== UTILS ====================

def custom_404(request, exception):
    return render(request, 'creake/404.html', status=404)


def custom_500(request):
    return render(request, 'creake/500.html', status=500)

@login_required
@require_POST
def rate_cake(request):
    data = json.loads(request.body)
    rating_val = int(data.get('rating'))

    cake_id = data.get('cake_id')
    cake_name = data.get('cake_name')
    if cake_id:
        cake = get_object_or_404(Cake, id=cake_id)
    elif cake_name:
        cake = get_object_or_404(Cake, name=cake_name)
    else:
        return JsonResponse({'error': 'No cake specified.'}, status=400)

    has_received = Order.objects.filter(
        user=request.user,
        cake_name=cake.name,
        status='received'
    ).exists()
    if not has_received:
        return JsonResponse({'error': 'You can only rate a cake after confirming receipt.'}, status=403)

    CakeRating.objects.update_or_create(
        cake=cake, user=request.user,
        defaults={'rating': rating_val}
    )

    avg = CakeRating.objects.filter(cake=cake).aggregate(avg=Avg('rating'))['avg'] or rating_val
    review_count = CakeRating.objects.filter(cake=cake).count()

    return JsonResponse({'success': True, 'new_rating': avg, 'review_count': review_count})

@login_required
@require_POST
def confirm_received(request, order_id):
    order = get_object_or_404(Order, id=order_id, user=request.user)
    if order.status != 'delivered':
        return JsonResponse({'error': 'Order is not in delivered status.'}, status=400)
    order.status = 'received'
    order.received_at = datetime.now()
    order.step = 6
    order.save()
    return JsonResponse({'success': True})


# ==================== REVIEWS ====================

def get_reviews(request, cake_id):
    cake = get_object_or_404(Cake, id=cake_id)
    reviews = CakeReview.objects.filter(cake=cake).select_related('user').order_by('-created_at')
    data = []
    for r in reviews:
        data.append({
            'id': r.id,
            'user': r.user.get_full_name() or r.user.username,
            'rating': r.rating,
            'comment': r.comment,
            'created_at': r.created_at.strftime('%b %d, %Y'),
            'is_mine': request.user.is_authenticated and r.user == request.user,
        })
    avg = reviews.aggregate(avg=Avg('rating'))['avg']
    return JsonResponse({'reviews': data, 'count': reviews.count(), 'avg': round(avg, 1) if avg else 0})


@login_required
@require_POST
def submit_review(request, cake_id):
    try:
        cake = get_object_or_404(Cake, id=cake_id)
        data = json.loads(request.body)
        rating = int(data.get('rating', 0))
        comment = data.get('comment', '').strip()
        if not (1 <= rating <= 5):
            return JsonResponse({'error': 'Rating must be between 1 and 5.'}, status=400)
        if not comment:
            return JsonResponse({'error': 'Please write a review.'}, status=400)
        # update or create
        review, created = CakeReview.objects.update_or_create(
            cake=cake, user=request.user,
            defaults={'rating': rating, 'comment': comment}
        )
        # also update the CakeRating aggregate
        CakeRating.objects.update_or_create(
            cake=cake, user=request.user,
            defaults={'rating': rating}
        )
        avg = CakeReview.objects.filter(cake=cake).aggregate(avg=Avg('rating'))['avg'] or rating
        return JsonResponse({
            'success': True,
            'created': created,
            'review': {
                'id': review.id,
                'user': request.user.get_full_name() or request.user.username,
                'rating': rating,
                'comment': comment,
                'created_at': review.created_at.strftime('%b %d, %Y'),
                'is_mine': True,
            },
            'new_avg': round(avg, 1),
            'count': CakeReview.objects.filter(cake=cake).count(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@login_required
@require_POST
def delete_review(request, cake_id):
    try:
        cake = get_object_or_404(Cake, id=cake_id)
        CakeReview.objects.filter(cake=cake, user=request.user).delete()
        CakeRating.objects.filter(cake=cake, user=request.user).delete()
        avg = CakeReview.objects.filter(cake=cake).aggregate(avg=Avg('rating'))['avg']
        return JsonResponse({
            'success': True,
            'new_avg': round(avg, 1) if avg else 0,
            'count': CakeReview.objects.filter(cake=cake).count(),
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)