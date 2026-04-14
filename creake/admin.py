from django.contrib import admin
from .models import Cake, Order, CakeDesign, Wishlist, UserProfile, Address

@admin.register(Cake)
class CakeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'is_new', 'created_at')
    list_filter = ('category', 'is_new', 'created_at')
    search_fields = ('name', 'description')
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'category', 'description', 'price')
        }),
        ('Image & Display', {
            'fields': ('image', 'badge', 'is_new')
        }),
        ('Rating', {
            'fields': ('rating', 'review_count')
        }),
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'cake_name', 'total', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'cake_name', 'address')
    readonly_fields = ('id', 'created_at', 'user', 'special_instructions')
    fieldsets = (
        ('Order Info', {
            'fields': ('id', 'user', 'created_at', 'status')
        }),
        ('Cake Details', {
            'fields': ('cake_name', 'quantity', 'total')
        }),
        ('Delivery', {
            'fields': ('address', 'city', 'zip_code', 'phone', 'rider_name', 'estimated_arrival')
        }),
        ('Notes', {
            'fields': ('special_instructions',)
        }),
        ('Tracking', {
            'fields': ('step', 'paid_at', 'baking_at', 'delivered_at')
        }),
    )


@admin.register(CakeDesign)
class CakeDesignAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'layers', 'created_at')
    list_filter = ('created_at', 'layers')
    search_fields = ('name', 'user__username')


@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'cake', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('user__username', 'cake__name')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'created_at')
    search_fields = ('user__username', 'user__email')
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'phone', 'birthday', 'favourite_cake')
        }),
        ('Notifications', {
            'fields': ('notif_orders', 'notif_promos', 'notif_arrivals', 'notif_quiz')
        }),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'city', 'is_default')
    list_filter = ('is_default', 'created_at')
    search_fields = ('user__username', 'city')