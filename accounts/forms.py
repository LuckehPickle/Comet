"""
Copyright (c) 2016 - Sean Bailey - All Rights Reserved
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

# Django Imports
from django import forms
from django.utils.translation import ugettext as _

# Other Imports
from accounts.models import User


class RegistrationForm(forms.ModelForm):
    """
    Accounts Registration form.
    """

    username = forms.CharField(
        label="Username", # The text that shows up above a field
        min_length=5,
        max_length=32,
        error_messages={
            "required": "Please enter a username.", # Field was not filled out
            "min_length": "Usernames must be atleast five (5) characters long.",
            "max_length": "Usernames must be less than 32 characters long.",
        },
    )

    email = forms.EmailField(
        label="Email Address",
        error_messages={
            "required": "Please enter your email address.",
            "invalid": "Please enter a valid email address.",
        },
    )

    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        min_length=8,
        error_messages={
            "required": "Please enter your password.",
            "min_length": "Passwords must be atleast eight (8) characters long.",
        },
    )

    password_repeat = forms.CharField(
        label="Repeat Password",
        widget=forms.PasswordInput,
        error_messages={
            "required": "Please re-enter your password.",
        }
    )

    class Meta:
        model = User # Model to fill the form for
        fields = ["username", "email", "password", "password_repeat"]

    def clean(self):
        """
        Checks that the passwords match, and returns cleaned data.
        """
        cleaned_data = super(RegistrationForm, self).clean() # Get clean data from super
        if "password" in self.cleaned_data and "password_repeat" in self.cleaned_data:
            # Check if the cleaned values are identical.
            if self.cleaned_data["password"] != self.cleaned_data["password_repeat"]:
                # Raise an error if they are not the same.
                raise forms.ValidationError("Please enter matching passwords.")
        return self.cleaned_data

    def save(self, commit=True):
        """
        Extends upon the default save function, essentially saves password.
        """
        user = super(RegistrationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user


class AuthenticationForm(forms.Form):
    """
    Accounts login/authentication form.
    """

    email = forms.EmailField(
        label="Email Address",
        error_messages={
            "required": "Please enter your email address.",
        },
    )

    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        error_messages={
            "required": "Please enter your password.",
        },
    )

    class Meta:
        model = User
        fields = ["email", "password"]
