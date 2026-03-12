from django.contrib import admin # type: ignore
from .models import Cake, Order, OrderItem


@admin.register(Cake)
class CakeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'rating', 'is_bestseller', 'is_new', 'stock')
    list_filter = ('category', 'is_bestseller', 'is_new', 'created_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'category', 'description')
        }),
        ('Pricing & Stock', {
            'fields': ('price', 'stock')
        }),
        ('Ratings', {
            'fields': ('rating', 'reviews')
        }),
        ('Status', {
            'fields': ('is_new', 'is_bestseller')
        }),
        ('Media', {
            'fields': ('image',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'total_amount', 'status', 'created_at')
    list_filter = ('status', 'delivery_type', 'payment_method', 'created_at')
    search_fields = ('full_name', 'email', 'phone')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Order Info', {
            'fields': ('id', 'status', 'total_amount', 'created_at', 'updated_at')
        }),
        ('Customer Info', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Delivery Address', {
            'fields': ('address', 'city', 'postal_code')
        }),
        ('Delivery & Payment', {
            'fields': ('delivery_type', 'payment_method')
        }),
        ('Special Instructions', {
            'fields': ('special_instructions',),
            'classes': ('collapse',)
        }),
    )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'cake', 'quantity', 'price')
    list_filter = ('order__created_at', 'cake__category')
    search_fields = ('order__full_name', 'cake__name')
    readonly_fields = ('order', 'cake', 'price')