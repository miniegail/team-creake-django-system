from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Cake, Order

class CreakeTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='testuser@example.com'
        )

        self.cake = Cake.objects.create(
            name='Chocolate Dream',
            category='chocolate',
            description='A rich chocolate cake',
            price=350.00,
        )

    def test_index_page_loads(self):
        response = self.client.get(reverse('creake:index'))
        self.assertEqual(response.status_code, 200)

    def test_dashboard_redirects_if_not_logged_in(self):
        response = self.client.get(reverse('creake:delivery'))
        self.assertEqual(response.status_code, 302)