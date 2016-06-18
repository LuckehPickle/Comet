# [Pages] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404

# Other Imports
import cr_config as config
from comet import dynamic_modals
from comet.decorators import login_required_message


@login_required_message
def search(request):
    """
    Renders a default search page.
    """
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    modals = dynamic_modals
    return render(request, "pages/search.html", {
        "title": (config.TITLE_FORMAT % "Search"),
        "user_id": user_id,
        "modals": modals,
    })


def premium(request):
    """
    Renders a default premium pages
    """
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    modals = dynamic_modals
    return render(request, "pages/premium.html", {
        "title": (config.TITLE_FORMAT % "Premium"),
        "user_id": user_id,
        "modals": modals,
    })
