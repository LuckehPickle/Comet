# [Accounts] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
# Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django
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
# TODO Redo the logic here. It's not amazing...

# Django Imports
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import logout as logout_user
from django.contrib.auth import login as login_user
from django.contrib.auth import authenticate
from django.utils.translation import ugettext_lazy as _

# Other Imports
from accounts.forms import AuthenticationForm, RegistrationForm
from accounts.models import User
from messenger.identifier import generate
import cr_config

# LOGOUT
# Pretty self explanatory. Logs out a user if they go to this URL whilst
# logged in. Note: The message seems to sit on the request if the user is
# sent to an error page. Waiting for the next successful page.
def logout(request):
    if request.user.is_authenticated(): # Check if the user is logged in
        logout_user(request) # Log out the user
        messages.add_message(request, messages.INFO, _("Successfully logged out.")) # Add translated message
    return redirect("frontpage") # Redirect to frontpage

# LOGIN
# Handles login requests. Note: This function actually doubles as a form,
# accepting inputs from itself if they exist. The majority of this function
# is dedicated to handling the login process from the POST data.
# TODO Put email verification timer in a code well/block
def login(request):
    if request.user.is_authenticated(): # Check if the user is logged in
        messages.add_message(request, messages.INFO, "You're already logged in to Comet. If you want to login to a different account please <a href='/logout'>logout</a> first.")
        return redirect("frontpage")

    if request.POST: # Check if there is any POST data.
        # Create a form instance and populate it with the Post data
        form = AuthenticationForm(request.POST)
        # Check whether the form is valid
        if form.is_valid():
            data = form.cleaned_data # Get cleaned data from the form
            user = authenticate( # Authenticate the user credentials against the db
                # The email field is called 'username' because the of how the auth backend works.
                username=data["email"],
                password=data["password"],
            )

            if user is not None: # Check if the credentials match an account
                if user.is_active: # Check if the account is active (not suspended)
                    login_user(request, user) # Log the user in
                    # Redirect to front page
                    if "next" in request.GET:
                        return redirect(request.GET["next"])
                    return redirect("messages")
                else:
                    # Account has been suspended. Alert the user and render the page.
                    messages.add_message(request, messages.ERROR, "Sorry, this account has been suspended. <a href='#'>Find out more.</a>")
            else:
                # Invalid credentials where entered
                messages.add_message(request, messages.ERROR, "Username or password is incorrect.")
        next_dir = ""
        if "next" in request.GET:
            next_dir=request.GET["next"]
        return renderLogin(request, next_dir=next_dir, form=form)

    # If the function reaches this point, then we simply need to render
    # a new page, taking the next direcory into account.
    next_dir = ""
    if "next" in request.GET:
        next_dir=request.GET["next"]
    return renderLogin(request, next_dir=next_dir)

# renderLogin(request, next_dir, [form])
# Gathers and formats any data that needs to be passed to the authentication
# template. It then returns an HttpResponse object with the compiled template
# to be sent to the client.
def renderLogin(request, next_dir="", form=AuthenticationForm()):
    PAGE_NAME = "Login" # Name of page, used to format the title

    # Make sure URL is kept if the user decides to register
    if not next_dir == "":
        next_dir = "?next=" + next_dir

    return render(request, "accounts/index.html", {
        "title": (cr_config.TITLE_FORMAT % PAGE_NAME),
        "next_dir": next_dir,
        "form": form,
        "form_type": "login",
        #"file_suffix": cr_config.FILE_SUFFIX,
    })

# REGISTER
# Handles registration requests. Note: This function actually doubles as a form,
# accepting inputs from itself if they exist. The majority of this function
# is dedicated to handling the registration process from the POST data.
# TODO Recaptcha setup
def register(request):
    if request.user.is_authenticated(): # Check if the user is logged in
        messages.add_message(request, messages.INFO, "You're currently logged in to Comet. If you want to register another account please <a href='/logout'>logout</a> first.")
        return redirect("frontpage") # User is logged in, return them to index

    if request.POST: # Some data was posted
        # Create a form instance and populate it with the Post data
        form = RegistrationForm(request.POST)

        # Check whether the form is valid.
        if form.is_valid():
            # Form data is valid, send a verification email.
            data = form.cleaned_data

            user_url = generate()
            while User.objects.filter(user_url=user_url).exists():
                user_url = generate()

            # You need to call user.objects.create_user rather than accessing
            # the user manager directly.
            User.objects.create_user(
                email=data["email"],
                username=data["username"],
                password=data["password"],
                user_url=user_url,
            )

            # Authenticate
            user = authenticate(
                username=data["email"],
                password=data["password"],
            )
            login_user(request, user) # Log the user in.

            if "next" in request.GET:
                return redirect(request.GET["next"])
            return redirect("messages")

        # Form data was invalid, render the page with error messages
        next_dir = ""
        if "next" in request.GET:
            next_dir=request.GET["next"]
        return renderRegister(request, next_dir=next_dir, form=form)
    else: # No data was posted, render a regular page
        next_dir = ""
        if "next" in request.GET:
            next_dir=request.GET["next"]
        return renderRegister(request, next_dir=next_dir)

# renderRegister(request, next_dir, [form])
# Gathers and formats any data that needs to be passed to the Registration
# template. It then returns an HttpResponse object with the compiled template
# to be sent to the client.
def renderRegister(request, next_dir="", form=RegistrationForm()):
    PAGE_NAME = "Register" # Name of page, used to format the title

    # Make sure URL is formatted in case the form is regenerated.
    if not next_dir == "":
        next_dir = "?next=" + next_dir

    return render(request, "accounts/index.html", {
        "title": (cr_config.TITLE_FORMAT % PAGE_NAME),
        "next_dir": next_dir,
        "form": form,
        "form_type": "register",
        #"file_suffix": cr_config.FILE_SUFFIX,
    })
