from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.contrib.auth import authenticate, login

# Index
def index(request):
    # Credentials
    username = None
    password = None
    next = None

    # Get Credentials from POST data
    if "username" in request.POST:
        username = request.POST["username"]
    if "password" in request.POST:
        password = request.POST["password"]
    if "next" in request.GET:
        next = request.GET["next"]

    # Check if data is missing
    if username == None and password == None:
        # TODO display normal page
        return
    elif username == None or password == None:
        # TODO display missing credential
        return
    else:
        user = authenticate(username=username, password=password)
        if user is not None:
            if user.is_active:
                login(request, user)
                # TODO Redirect to a success page
            else:
                # TODO return a disabled account error message
                return
        else:
            # TODO Invalid credentials error
            return
        return
