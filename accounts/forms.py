from django import forms
from .models import User

class RegistrationForm(forms.ModelForm):
    # Username Field
    username = forms.CharField(
        label="Username",
        min_length=5,
        max_length=32,
        error_messages={
            "required": "Please enter a username.",
            "min_length": "Usernames must be atleast five (5) characters long.",
            "max_length": "Usernames must be less than 32 characters long.",
        },
    )

    # Email Field
    email = forms.EmailField(
        label="Email Address",
        error_messages={
            "required": "Please enter your email address.",
            "invalid": "Please enter a valid email address.",
        },
    )

    # Password Field
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        min_length=8,
        error_messages={
            "required": "Please enter your password.",
            "min_length": "Passwords must be atleast eight (8) characters long.",
        },
    )

    # Password Repeat
    password_repeat = forms.CharField(
        label="Repeat Password",
        widget=forms.PasswordInput,
        error_messages={
            "required": "Please re-enter your password.",
        }
    )

    class Meta:
        model = User
        fields = ["username", "email", "password", "password_repeat"]

    # Verifies data
    def clean(self):
        cleaned_data = super(RegistrationForm, self).clean()
        if "password" in self.cleaned_data and "password_repeat" in self.cleaned_data:
            if self.cleaned_data["password"] != self.cleaned_data["password_repeat"]:
                raise forms.ValidationError("Your passwords did not match.")
        return self.cleaned_data

    def save(self, commit=True):
        user = super(RegistrationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

class AuthenticationForm(forms.Form):
    email = forms.EmailField(
        label="Email Address",
    )

    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
    )

    class Meta:
        fields = ["email", "password"]
