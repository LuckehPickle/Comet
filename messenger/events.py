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
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.utils.html import strip_tags

# Other Imports
from django_socketio import events
from messenger.models import ChatGroup

# On Message
# Event handler for a ChatGroup receiving a message.
# TODO Check if public, deny URL connections if not.
# TODO Check if user is muted or banned
# TODO Deal with unauthenticated users
# TODO Listen for user commands
# TODO Add some way for users to invite other users
# TODO If a user has been invited to a chat and joins without accepting
# the request, should the request automatically be accepted?
# TODO Tell users attempting to connect to a private group that the group
# is private and alert the groups moderators that someone attempted to
# connect, giving them the option to accept.
# TODO Handle the message action
@events.on_message(channel="^group-")
def message(request, socket, context, message):
    # Check if the user is authenticated
    if not user.is_authenticated():
        # User is a guest, create a temporary guest name and warn the user they are not logged in.
        messages.add_message(request, messages.ERROR, "You must be logged in to view this content. Note: We are working on allowing guests to join chats without logging in.")
        return redirect("login")

    room = get_object_or_404(ChatGroup, identifier=message["group_id"])

    if room.users.filter(user_id=request.user.user_id).count() >= 1:
        # User is subscribed to this group
        return redirect("messages")
    else:
        # User is not subscribed to this group. Check if they should be.
        return redirect("messages")
