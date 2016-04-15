# [Messages] VIEWS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.http import HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages

# Other Imports
import cr_config as config
from comet.decorators import login_required_message
from messenger.forms import CreateChatForm
from messenger.models import ChatGroup
from messenger.identifier import generate

# INDEX
# Currently just renders the messenger interface from the template.
@login_required_message
def index(request):
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]
    return render(request, "messenger/index.html", {
        "title": (config.TITLE_FORMAT % "Messages"),
        "user_id": str(request.user.user_id)[:8],
        "create_chat_form": CreateChatForm(),
    })

# PRIVATE
# Renders a page that allows you to interact with a specific user.
# Note: Will provide an error if you are not on the users contacts list
# and the user has "only_from_contacts" setting set to TRUE.
# IDEA: Allow users to set unique alliases for their URL.
@login_required_message
def private(request, identifier=None):
    return HttpResponse("Private message with " + identifier)

# GROUP
# Renders a page that allows you to message a particular group.
# Note: You do not have to be logged in to view a group, but you will not
# be able to complete most interactions and will be assigned a temporary
# human readable guest identifier. If the group is private, you will be
# shown an error message regardless.
# IDEA: Allow groups to create unique aliases for their URL. This will make
# it easier to share the URL of public chats.
@login_required_message
def group(request, identifier=None):
    user_id = None
    name = get_object_or_404(ChatGroup, identifier=identifier)
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]
    return render(request, "messenger/index.html", {
        "title": (config.TITLE_FORMAT % name),
        "user_id": str(request.user.user_id)[:8],
        "create_chat_form": CreateChatForm(),
    })

# CREATE
# Handles the form submissions from the chat creation modal.
@login_required_message
def create(request):
    if request.POST:
        form = CreateChatForm(request.POST)
        if form.is_valid():
            # Generate a new identifier
            identifier = generate()
            while ChatGroup.objects.filter(identifier=identifier).count() != 0:
                print("Looping")
                identifier = generate()

            data = form.cleaned_data
            room = ChatGroup.objects.create(
                name=data["name"],
                is_public=data["is_public"],
                creator=request.user,
                identifier=identifier,
            )

            if data["is_public"]:
                messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by giving them the URL or by clicking 'add users'." % data["name"])
            else:
                messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by clicking 'add users'." % data["name"])
            return redirect(room)

        messages.add_message(request, messages.ERROR, "The data you entered was invalid.")
        return redirect("messages")
    else:
        messages.add_message(request, messages.ERROR, "A group could not be created because no data was posted.")
        return redirect("messages")
