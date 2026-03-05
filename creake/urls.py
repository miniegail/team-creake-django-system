from django.urls import path
from . import views

app_name = 'creake'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/cakes/', views.get_cakes, name='get_cakes'),
    path('api/order/', views.create_order, name='create_order'),
]