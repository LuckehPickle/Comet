from django import forms

# The pass
class RegisterForm(forms.Form):
    username = forms.CharField(
        label="Username",
        min_length=5,
        max_length=32,
        error_messages = {
            "min_length": "Usernames must be atleast 5 characters long.",
            "max_length": "Usernames must be less than 32 characters long.",
        },
    )

    email = forms.EmailField(
        label="Email Address",
        error_messages = {
            "invalid": "Email Address is invalid.",
        },
    )
