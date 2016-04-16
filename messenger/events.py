# [Messenger] EVENTS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
# Powered by Django (https://www.djangoproject.com/)
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
from django.shortcuts import get_object_or_404
from django.utils.html import escape

# Other Imports
from django_socketio import events
from messenger.models import ChatGroup

# On Message
# Event handler for a ChatGroup receiving a message.
# TODO Listen for user commands
# TODO Handle the message action
# TODO Make sure user is allowed to connect to socket before subscription
@events.on_message(channel="^group-")
def message(request, socket, context, message):
    # Check if the user is authenticated
    if not user.is_authenticated():
        # TODO See if HttpResponse will work here
        return

    group = get_object_or_404(ChatGroup, group_id=message["group_id"])
    if message["action"] == "message":
        message["message"] = escape(message["message"])

    return
