# [Accounts] FORMS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
# Powered by Django (https://www.djangoproject.com/)
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# This file contains all accounts related forms. The forms contained
# within this file include:
#   - Registration Form
#   - Authentication Form

# Django Imports
from django import forms
from .models import User
from django.utils.translation import ugettext as _

# Registration Form Class
# Contains information and a cleaning function for the registration
# form. Note that this is where error messages for particular fields
# can be defined.
class RegistrationForm(forms.ModelForm):

    # USERNAME FIELD
    # Note that the maximum length restriction will no be imposed in
    # the template because of how the template handles forms. However,
    # it will still be used during the validation process.
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

    # EMAIL FIELD
    email = forms.EmailField(
        label="Email Address",
        error_messages={
            "required": "Please enter your email address.",
            "invalid": "Please enter a valid email address.",
        },
    )

    # PASSWORD FIELD
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        min_length=8,
        error_messages={
            "required": "Please enter your password.",
            "min_length": "Passwords must be atleast eight (8) characters long.",
        },
    )

    # PASSWORD REPEAT FIELD
    password_repeat = forms.CharField(
        label="Repeat Password",
        widget=forms.PasswordInput,
        error_messages={
            "required": "Please re-enter your password.",
        }
    )

    # Meta class is necessary for ModelForms.
    class Meta:
        model = User # Model to fill the form for
        fields = ["username", "email", "password", "password_repeat"]

    # CLEAN
    # This function simply checks if the passwords match. Regular data
    # cleaning/validation takes place in the super class.
    def clean(self):
        cleaned_data = super(RegistrationForm, self).clean() # Get clean data from super
        if "password" in self.cleaned_data and "password_repeat" in self.cleaned_data:
            # Check if the cleaned values are identical.
            if self.cleaned_data["password"] != self.cleaned_data["password_repeat"]:
                # Raise an error if they are not the same.
                raise forms.ValidationError("Please enter matching passwords.")
        return self.cleaned_data

    # SAVE
    # This function saves the data to the database.
    def save(self, commit=True):
        user = super(RegistrationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user

# AuthenticationForm Class
# Contains information and fields for the Authentication form. Note: that this
# is where error messages for particular fields can be defined.
# Note x2: Some comments from the above form apply here.
class AuthenticationForm(forms.Form):

    # EMAIL FIELD
    email = forms.EmailField(
        label="Email Address",
        error_messages={
            "required": "Please enter your email address.",
        },
    )

    # PASSWORD FIELD
    password = forms.CharField(
        label="Password",
        widget=forms.PasswordInput,
        error_messages={
            "required": "Please enter your password.",
        },
    )

    # This may be unnecessary.
    class Meta:
        model = User
        fields = ["email", "password"]
