from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Cake(models.Model):
    CATEGORY_CHOICES = [
        ('chocolate', 'Chocolate'),
        ('vanilla', 'Vanilla'),
        ('strawberry', 'Strawberry'),
        ('redvelvet', 'Red Velvet'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    image = models.ImageField(upload_to='cakes/', blank=True, null=True)
    badge = models.CharField(max_length=50, blank=True, null=True)
    is_new = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def rating(self):
        from django.db.models import Avg
        avg = self.ratings.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0

    @property
    def review_count(self):
        return self.ratings.count()
    
    


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('baking', 'Baking'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('received', 'Received'),
        ('cancelled', 'Cancelled'),
    ]

    CUSTOM_STATUS_CHOICES = [
        ('none', 'Not a Custom Cake'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    cake_name  = models.CharField(max_length=100, default='')
    quantity   = models.IntegerField(default=1)
    total      = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    address    = models.TextField(default='')
    city       = models.CharField(max_length=100, default='')
    zip_code   = models.CharField(max_length=20, default='')
    status     = models.CharField(max_length=50, default='pending', choices=STATUS_CHOICES)
    phone = models.CharField(max_length=20, blank=True, default='')

    # Custom cake fields
    is_custom_cake  = models.BooleanField(default=False)
    custom_status   = models.CharField(max_length=20, choices=CUSTOM_STATUS_CHOICES, default='none')

    # Tracking
    created_at        = models.DateTimeField(auto_now_add=True)
    paid_at           = models.DateTimeField(null=True, blank=True)
    baking_at         = models.DateTimeField(null=True, blank=True)
    delivered_at      = models.DateTimeField(null=True, blank=True)
    received_at       = models.DateTimeField(null=True, blank=True) 
    rider_name        = models.CharField(max_length=100, blank=True, null=True)
    estimated_arrival = models.CharField(max_length=100, blank=True, null=True)
    step              = models.IntegerField(default=0)
    special_instructions = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user_str = self.user.username if self.user else "Guest"
        return f"Order #{self.id} - {user_str}"

    def get_status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status, 'Unknown')


class CakeDesign(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='designs')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    emoji = models.CharField(max_length=10, default='🎂')
    layers = models.IntegerField(default=2)
    badge = models.CharField(max_length=50, blank=True, null=True)
    thumb_class = models.CharField(max_length=20, default='custom')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.name}"


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    cake = models.ForeignKey(Cake, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'cake')
        ordering = ['-added_at']

    def __str__(self):
        return f"{self.user.username} - {self.cake.name}"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)
    favourite_cake = models.ForeignKey(Cake, on_delete=models.SET_NULL, blank=True, null=True)

    notif_orders   = models.BooleanField(default=True)
    notif_promos   = models.BooleanField(default=True)
    notif_arrivals = models.BooleanField(default=True)
    notif_quiz     = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"


class Address(models.Model):
    user     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label    = models.CharField(max_length=50, default='Home')
    street   = models.CharField(max_length=255)
    city     = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.label}"


class CakeRating(models.Model):
    cake = models.ForeignKey(Cake, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cake', 'user')  # one rating per user per cake


class CakeReview(models.Model):
    cake = models.ForeignKey(Cake, on_delete=models.CASCADE, related_name='cake_reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cake', 'user')