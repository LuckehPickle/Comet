from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password, password_validators_help_text_html

from accounts.forms import RegistrationForm
import cr_config

def index(request):
    if request.user.is_authenticated(): # Check if the user is logged in
        return redirect("/") # User is logged in, return them to index

    if request.POST: # Some data was posted
        # Create a form instance and populate it with the Post data
        form = RegistrationForm(request.POST)
        # Check whether the form is valid.
        if form.is_valid():
            # Form data is valid, send a verification email.
            next_dir = ""
            if "next" in request.GET:
                next_dir="?next=" + request.GET["next"]
            return redirect("/register/done" + next_dir)

        # Form data was invalid, render the page
        return renderIndex(request, form=form)

    else: # No data was posted, render a regular page
        next_dir = ""
        if "next" in request.GET:
            next_dir=request.GET["next"]
        return renderIndex(request, next_dir=next_dir)

# renderIndex(request, next_dir, username="", email="")
# Gathers and formats any data that needs to be passed to the template.
# It then returns an HttpResponse object with the compiled template to
# be sent to the client.
def renderIndex(request, next_dir="", form=RegistrationForm()):
    PAGE_NAME = "Register" # Name of page, used to format the title

    # Make sure URL is formatted in case the form is regenerated.
    if not next_dir == "":
        next_dir = "?next=" + next_dir

    return render(request, "register/index.html", {
        "projectname": cr_config.TITLE,
        "title": (cr_config.TITLE_FORMAT % PAGE_NAME),
        "next_dir": next_dir,
        "form": form,
    })
