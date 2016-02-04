from django.shortcuts import render, redirect
from django.contrib import messages

import cr_config

def index(request):
    # Check if the user is logged in
    if request.user.is_authenticated():
        return redirect("/")

    # Credentials
    # Fields that are fed back into the template must be initialised
    # with "" rather than None.
    cr_username = ""
    cr_email = ""
    cr_password = ""
    cr_password_repeat = ""

    next_dir = "" # Directory to send user to after they have logged in.

    # Get Credentials from POST data
    if "username" in request.POST:
        cr_username = request.POST["username"]
    if "email" in request.POST:
        cr_email = request.POST["email"]
    if "password" in request.POST:
        cr_password = request.POST["password"]
    if "password_repeat" in request.POST:
        cr_password_repeat = request.POST["password_repeat"]
    if "next" in request.GET:
        next_dir = request.GET["next"]

    # Check if data is missing
    if cr_username == "" and cr_email == "" and cr_password == "" and cr_password_repeat == "":
        # No data was posted, render a regular register page
        return renderIndex(request, next_dir)
    elif cr_username == "" or cr_email == "" or cr_password == "" or cr_password_repeat == "":
        # Only some data was posted, render a register page with an error message
        messages.add_message(request, messages.ERROR, "Please fill out all fields.")
        return renderIndex(request, next_dir, username=cr_username, email=cr_email)
    elif len(cr_password) < 6:
        # Password was too short
        messages.add_message(request, messages.ERROR, "Passwords must be atleast six (6) characters long.")
        return renderIndex(request, next_dir, username=cr_username, email=cr_email)
    elif not cr_password == cr_password_repeat:
        # The passwords didn't match
        messages.add_message(request, messages.ERROR, "Passwords don't match.")
        return renderIndex(request, next_dir, username=cr_username, email=cr_email)


def renderIndex(request, next_dir, username="", email=""):
    PAGE_NAME = "Register" # Name of page, used to format the title
    # Make sure URL is kept if the user decides to register
    if not next_dir == "":
        next_dir = "?next=" + next_dir

    return render(request, "register/index.html", {
        "projectname": cr_config.TITLE,
        "title": (cr_config.TITLE_FORMAT % PAGE_NAME),
        "next_dir": next_dir,
        "username": username,
        "email": email,
    })
