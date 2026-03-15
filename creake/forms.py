from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import re

class UserRegistrationForm(forms.Form):
    first_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={
        'placeholder': 'Jane',
        'autocomplete': 'given-name',
    }))
    last_name = forms.CharField(max_length=50, widget=forms.TextInput(attrs={
        'placeholder': 'Doe',
        'autocomplete': 'family-name',
    }))
    email = forms.EmailField(widget=forms.EmailInput(attrs={
        'placeholder': 'you@example.com',
        'autocomplete': 'email',
    }))
    phone = forms.CharField(max_length=20, widget=forms.TextInput(attrs={
        'placeholder': '+63 9XX XXX XXXX',
        'autocomplete': 'tel',
    }))
    password1 = forms.CharField(min_length=6, widget=forms.PasswordInput(attrs={
        'placeholder': 'Create a strong password',
        'autocomplete': 'new-password',
    }))
    password2 = forms.CharField(min_length=6, widget=forms.PasswordInput(attrs={
        'placeholder': 'Re-enter password',
        'autocomplete': 'new-password',
    }))
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')
        email = cleaned_data.get('email')
        
        if password1 and password2:
            if password1 != password2:
                raise ValidationError('Passwords do not match.')
        
        if email and User.objects.filter(email=email).exists():
            raise ValidationError('An account with this email already exists.')
        
        return cleaned_data
    
    def save(self, commit=True):   # ← indented inside the class
        user = User(
            username=self.cleaned_data['email'],
            email=self.cleaned_data['email'],
            first_name=self.cleaned_data['first_name'],
            last_name=self.cleaned_data['last_name'],
        )
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class UserProfileForm(forms.Form):
    first_name = forms.CharField(max_length=50)
    last_name = forms.CharField(max_length=50)
    email = forms.EmailField()
    phone = forms.CharField(max_length=20, required=False)
    birthday = forms.DateField(required=False)