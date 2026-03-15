from django.urls import path
from . import views

app_name = 'creake'

urlpatterns = [
    # Public
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    
    # Dashboard
    path('dashboard/', views.delivery, name='delivery'),
    path('my-designs/', views.my_designs, name='my_designs'),
    path('order-history/', views.order_history, name='order_history'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('profile/', views.profile, name='profile'),
    
    # Checkout & Cart
    path('checkout/', views.checkout, name='checkout'),
    
    # Wishlist
    path('wishlist/add/<int:cake_id>/', views.add_wishlist, name='add_wishlist'),
    path('wishlist/remove/<int:wishlist_id>/', views.remove_wishlist, name='remove_wishlist'),
    
    # Designs
    path('designs/create/', views.create_design, name='create_design'),
    path('designs/<int:design_id>/edit/', views.edit_design, name='edit_design'),
    path('designs/<int:design_id>/reorder/', views.reorder_design, name='reorder_design'),
    
    # Addresses
    path('addresses/add/', views.add_address, name='add_address'),

    # Quiz
    path('quiz/', views.quiz, name='quiz'),
]



handler404 = 'creake.views.custom_404'
handler500 = 'creake.views.custom_500'