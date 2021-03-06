# [Comet] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

# Django Imports
from django.shortcuts import render

def bad_request(request):
    return render(request, "shared/error.html", {
        "title": "Bad Request",
    })

def permission_denied(request):
    return render(request, "shared/error.html", {
        "title": "Permission Denied",
    })

def page_not_found(request):
    return render(request, "shared/error.html", {
        "title": "Page not found",
    })

def server_error(request):
    return render(request, "shared/error.html", {
        "title": "Server Error",
    })
