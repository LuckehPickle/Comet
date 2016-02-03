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
    cr_username = ""
    cr_password = ""

    next_dir = None # Directory to send user to after they have logged in.
    PAGE_NAME = "Login" # Name of page, used to format the title

    # Get Credentials from POST data
    if "username" in request.POST:
        cr_username = request.POST["username"]
    if "password" in request.POST:
        cr_password = request.POST["password"]
    if "next" in request.GET:
        next_dir = request.GET["next"]

    # Check if data is missing
    if cr_username == "" and cr_password == "":
        # No data was posted, render a regular login page
        return renderIndex(request, PAGE_NAME)
    elif cr_username == "" or cr_password == "":
        # Only some data was posted, render a login page with an error message
        messages.add_message(request, messages.ERROR, "Please fill out all fields.")
        return renderIndex(request, PAGE_NAME, username=cr_username)
    else:
        # Authenticate the user
        user = authenticate(username=cr_username, password=cr_password)

        # Check if the credentials match an account
        if user is not None:
            # Check if the account is active (not suspended)
            if user.is_active:
                # Everything went well, log the user in
                login(request, user)
                if next_dir == None:
                    return redirect("/m/")
                return redirect(next_dir)
            else:
                # Account has been suspended. Alert the user and render the page.
                messages.add_message(request, messages.ERROR, "Sorry, this account has been suspended. <a href='#'>Find out more.</a>")
                return renderIndex(request, PAGE_NAME)
        else:
            # Invalid credentials where entered
            messages.add_message(request, messages.ERROR, "Username or password was incorrect.")
            return renderIndex(request, PAGE_NAME, username=cr_username)
        return

def renderIndex(request, title, username=""):
    return render(request, "login/index.html", {
        "title": (cr_config.TITLE_FORMAT % title),
        "username": username,
    })
