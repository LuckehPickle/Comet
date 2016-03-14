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
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib import messages

# Other Imports
import cr_config
from chatproject.decorators import login_required_message

# INDEX
# Currently just renders the messenger interface from the template.
@login_required_message
def index(request):
    user_id = None
    if request.user.is_authenticated():
        user_id = str(request.user.user_id)[:8]
    return render(request, "messages/index.html", {
        "title": (cr_config.TITLE_FORMAT % "Messages"),
        "user_id": str(request.user.user_id)[:8],
    })

# PRIVATE
# Renders a page that allows you to interact with a specific user.
# Note: Will provide an error if you are not on the users contacts list
# and the user has "only_from_contacts" setting set to TRUE.
# IDEA: Allow users to set unique alliases for their URL.
@login_required_message
def private(request, identifier=None):
    return HttpResponse("Private message with " + identifier)

# group
# Renders a page that allows you to message a particular group.
# Note: You do not have to be logged in to view a group, but you will not
# be able to complete most interactions and will be assigned a temporary
# human readable guest identifier. If the group is private, you will be
# shown an error message regardless.
# IDEA: Allow groups to create unique aliases for their URL. This will make
# it easier to share the URL of public chats.
def group(request, identifier=None):
    return HttpResponse("Group message with " + identifier)
