# TODO swap username with email address so that users can change their name

from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login
import cr_config

# Index
def index(request):
    # Check if the user is logged in
    if request.user.is_authenticated():
        return redirect("/")

    # Credentials
    # Username and Password must be initialised as "" rather than None
    # This is because they are passed to the template regardless of whether
    # they where filled out or not.
    cr_email = ""
    cr_password = ""

    next_dir = "" # Directory to send user to after they have logged in.

    # Get Credentials from POST data
    if "email" in request.POST:
        cr_email = request.POST["email"]
    if "password" in request.POST:
        cr_password = request.POST["password"]
    if "next" in request.GET:
        next_dir = request.GET["next"]

    # Check if data is missing
    if cr_email == "" and cr_password == "":
        # No data was posted, render a regular login page
        return renderIndex(request, next_dir)
    elif cr_email == "" or cr_password == "":
        # Only some data was posted, render a login page with an error message
        messages.add_message(request, messages.ERROR, "Please fill out all fields.")
        return renderIndex(request, next_dir, username=cr_email)
    else:
        # Authenticate the user
        user = authenticate(username=cr_email, password=cr_password)

        # Check if the credentials match an account
        if user is not None:
            # Check if the account is active (not suspended)
            if user.is_active:
                # Everything went well, log the user in
                login(request, user)
                if next_dir == None:
                    return redirect("/")
                return redirect(next_dir)
            else:
                # Account has been suspended. Alert the user and render the page.
                messages.add_message(request, messages.ERROR, "Sorry, this account has been suspended. <a href='#'>Find out more.</a>")
                return renderIndex(request, next_dir)
        else:
            # Invalid credentials where entered
            messages.add_message(request, messages.ERROR, "Username or password is incorrect.")
            return renderIndex(request, next_dir, username=cr_email)
        return

def renderIndex(request, next_dir, username=""):
    PAGE_NAME = "Login" # Name of page, used to format the title
    # Make sure URL is kept if the user decides to register
    if not next_dir == "":
        next_dir = "?next=" + next_dir

    return render(request, "login/index.html", {
        "projectname": cr_config.TITLE,
        "title": (cr_config.TITLE_FORMAT % PAGE_NAME),
        "next_dir": next_dir,
        "email": username,
    })
