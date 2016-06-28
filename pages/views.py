"""
Copyright (c) 2016 - Sean Bailey - All Rights Reserved

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""


# Django Imports
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404

# Other Imports
import cr_config as config
from comet.decorators import login_required_message


def frontpage(request):
    data = {"title": config.TITLE}
    return render_page(request, "pages/frontpage.html", data)


@login_required_message
def search(request):
    data = {"title": config.TITLE_FORMAT % "Search"}
    return render_page(request, "pages/search.html", data)


def premium(request):
    data = {"title": config.TITLE_FORMAT % "Premium"}
    return render_page(request, "pages/premium.html", data)


def render_page(request, location=None, data={}):
    """
    Renders a page based on the information given.

    :param request: Django request object.
    :param location: String location of the pages template.
    :param data: Additional data to pass to the template.
    """

    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    template_args = {
        "user_id": user_id,
    }
    template_args.update(data)

    return render(request, location, template_args)
