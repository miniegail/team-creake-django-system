from django.urls import path
from . import views

app_name = 'creake'

urlpatterns = [
    # ── Public ────────────────────────────────────────────────
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),

    # ── User Dashboard ─────────────────────────────────────────
    path('dashboard/', views.delivery, name='delivery'),
    path('my-designs/', views.my_designs, name='my_designs'),
    path('order-history/', views.order_history, name='order_history'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('profile/', views.profile, name='profile'),

    # ── Checkout & Cart ────────────────────────────────────────
    path('checkout/', views.checkout, name='checkout'),

    # ── Wishlist ───────────────────────────────────────────────
    path('wishlist/add/<int:cake_id>/', views.add_wishlist, name='add_wishlist'),
    path('wishlist/remove/<int:wishlist_id>/', views.remove_wishlist, name='remove_wishlist'),

    # ── Designs ────────────────────────────────────────────────
    path('designs/create/', views.create_design, name='create_design'),
    path('designs/<int:design_id>/edit/', views.edit_design, name='edit_design'),
    path('designs/<int:design_id>/reorder/', views.reorder_design, name='reorder_design'),

    # ── Addresses ──────────────────────────────────────────────
    path('addresses/add/', views.add_address, name='add_address'),

    # ── Quiz ───────────────────────────────────────────────────
    path('quiz/', views.quiz, name='quiz'),

    # ── Customize ──────────────────────────────────────────────
    path('customize/', views.customize, name='customize'),
    path('customize/order/', views.customize_order, name='customize_order'),

    # ── Admin Dashboard ────────────────────────────────────────
    path('admin-panel/', views.admin_dashboard, name='admin_dashboard'),
    path('admin-panel/orders/', views.admin_orders, name='admin_orders'),
    path('admin-panel/orders/<int:order_id>/', views.admin_order_detail, name='admin_order_detail'),
    path('admin-panel/orders/<int:order_id>/update-status/', views.admin_update_order_status, name='admin_update_order_status'),
    path('admin-panel/custom-cakes/', views.admin_custom_cakes, name='admin_custom_cakes'),
    path('admin-panel/custom-cakes/<int:order_id>/approve/', views.admin_approve_custom_cake, name='admin_approve_custom_cake'),
    path('admin-panel/custom-cakes/<int:order_id>/reject/', views.admin_reject_custom_cake, name='admin_reject_custom_cake'),
    path('admin-panel/cakes/', views.admin_cakes, name='admin_cakes'),
    path('admin-panel/cakes/add/', views.admin_add_cake, name='admin_add_cake'),
    path('admin-panel/cakes/<int:cake_id>/edit/', views.admin_edit_cake, name='admin_edit_cake'),
    path('admin-panel/cakes/<int:cake_id>/delete/', views.admin_delete_cake, name='admin_delete_cake'),
    path('admin-panel/users/', views.admin_users, name='admin_users'),
    path('rate-cake/', views.rate_cake, name='rate_cake'),
    path('confirm-received/<int:order_id>/', views.confirm_received, name='confirm_received'),
    path('wishlist/toggle/', views.toggle_wishlist, name='toggle_wishlist'),
    path('cakes/<int:cake_id>/reviews/',         views.get_reviews,    name='get_reviews'),
    path('cakes/<int:cake_id>/reviews/submit/',  views.submit_review,  name='submit_review'),
    path('cakes/<int:cake_id>/reviews/delete/',  views.delete_review,  name='delete_review'),
]

handler404 = 'creake.views.custom_404'
handler500 = 'creake.views.custom_500'