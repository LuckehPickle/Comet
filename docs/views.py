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
from django.http import HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404

# Docs Imports
from docs.models import Article
from docs.categories import CATEGORIES

# Other Imports
import cr_config as config
from comet.decorators import login_required_message
from comet_socketio import utils


def index(request):
    """
    """
    utils.check_notifications(request)
    
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    return render(request, "docs/index.html", {
        "title": (config.TITLE_FORMAT % "Documentation"),
        "user_id": user_id,
    })


@login_required_message
def create(request):
    """
    View for creating articles.
    TODO Add permission for articles.
    """

    if not request.user.is_staff:
        messages.add_message(
            request,
            messages.ERROR,
            "You do not have permission to create articles. You can apply for permission <a href='/'>here</a>."
        )
        return redirect("docs")

    return render_editor(request)


@login_required_message
def edit(request, slug=None):
    """
    View for editing articles.
    """
    if slug == None:
        return redirect("docs_create")

    article = get_object_or_404(Article, slug=slug)

    if request.user != article.creator and not request.user.is_staff:
        messages.add_message(
            request,
            messages.ERROR,
            "You do not have permission to edit this article."
        )
        return redirect(article)

    data = {
        "title": (config.TITLE_FORMAT % str(article.title)),
        "article": article,
    }

    return render_editor(request, data)


def render_editor(request, data={}):
    """
    Function for creating an editor.
    :param request: Django request object.
    :param data: Additional data to pass to the template.
    """
    
    utils.check_notifications(request)

    # Default values
    template_args = {
        "title": (config.TITLE_FORMAT % "Create"),
        "user_id": str(request.user.user_id)[:8],
    }
    template_args.update(data)

    return render(request, "docs/editor.html", template_args)


def category(request, category):
    """
    Handles
    """
    
    utils.check_notifications(request)

    article_category = None

    for cat in CATEGORIES:
        if cat.url == category:
            article_category = cat

    if article_category == None:
        raise Http404()

    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    return render(request, "docs/category.html", {
        "title": (config.TITLE_FORMAT % article_category.title),
        "user_id": user_id,
        "category": article_category,
    })


def article(request, category, slug):
    """
    Handles and renders individual articles.
    """
    
    utils.check_notifications(request)
    
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]

    article = get_object_or_404(Article, slug=slug)

    article_category = None

    for cat in CATEGORIES:
        if cat.url == category:
            article_category = cat

    if article_category == None:
        raise Http404()

    return render(request, "docs/article.html", {
        "title": (config.TITLE_FORMAT % article.title),
        "user_id": user_id,
        "article": article,
        "category": article_category,
    })
