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
from django.core import serializers
from django.shortcuts import get_object_or_404
from django.utils.html import escape
from django.db.models import Q

# Other Imports
from django_socketio import events
from messenger.models import ChatGroup
from accounts.models import User, FriendInvites

@events.on_message(channel=".")
def channel_message(request, socket, context, message):
    """
    Handles django-socketio events for all channels, including when no channel is
    used. Anything which is not channel specific is handled here.
    Note: The response action 'pmessage-info' will render a pmessage in the same
    way that a normal pmessage would be handled.
    """
    if not request.user.is_authenticated():
        return
    if message["action"] == "search" and "data" in message:
        handleSearch(request, socket, message)
    if message["action"] == "friend_req" and "user_id" in message:
        handleFriendRequest(request, socket, message)

@events.on_message
def message(request, socket, context, message):
    """
    For some reason, putting both decorators on the same method does not work as
    expected, so for now this method will handle everything that occurs on the
    front messaging page. It is essentially a duplicate of the above.
    """
    if not request.user.is_authenticated():
        return
    if message["action"] == "search" and "data" in message:
        handleSearch(request, socket, message)
    if message["action"] == "friend_req" and "user_id" in message:
        handleFriendRequest(request, socket, message)

def handleSearch(request, socket, message):
    """
    Collects the first five (5) results of a database query, serializes them in
    JSON and then sends them back to the user via django-socketio.
    TODO Check if the users are friends, or if there is a friend request pending
    and update the button beside their username accordingly.
    """
    query_set = User.objects.filter(
        Q(username__icontains=message["data"]) &
        ~Q(user_id=request.user.user_id) # ~Q negates (not)
    ).order_by("username")[:5]

    friends_in_query = {}

    for query_user in query_set:
        if request.user.friends.filter(user_id=query_user.user_id).count() != 0:
            friends_in_query[str(query_user.user_id)] = "friend"
        elif FriendInvites.objects.filter(sender=request.user, recipient=query_user).count() != 0:
            friends_in_query[str(query_user.user_id)] = "request_sent"
        elif FriendInvites.objects.filter(sender=query_user, recipient=request.user).count() != 0:
            friends_in_query[str(query_user.user_id)] = "request_received"

    json_users = serializers.serialize(
        "json",
        query_set,
        fields = ("username", "is_premium", "user_url"),
    )

    socket.send({"action": "search", "users": json_users, "friends": friends_in_query})

def handleFriendRequest(request, socket, message):
    """
    Handles incoming friend requests, and checks to ensure that a friend request
    hasn't already been sent. Also notifies the target user about their new
    friend request.
    """
    # Get the target user of the friend invite
    target = get_object_or_404(User, user_id=message["user_id"])

    # Check if the users are already friends.
    if request.user.friends.filter(user_id=message["user_id"]).count() != 0:
        # Users are already friends
        socket.send({
            "action":"pmessage",
            "type":"error",
            "message":"You are already friends with {0}.".format(target.username)
        })
        return

    # Make sure there are no currently pending requests
    if FriendInvites.objects.filter(sender=request.user, recipient=target).count() != 0:
        # User has already sent a friend request to the target
        socket.send({
            "action":"pmessage",
            "type":"error",
            "message":"There is already a pending friend request between you and {0}.".format(target.username)
        })
        return

    # There are no currently pending requests in this direction, check other dir
    if FriendInvites.objects.filter(sender=target, recipient=request.user).count() == 0:
        # There are no invites in either direction, create one.
        FriendInvites.objects.create(
            sender=request.user,
            recipient=target,
        )
        socket.send({
            "action":"pmessage",
            "type":"info",
            "message":"Friend request successfully sent to {0}.".format(target.username)
        })
        # TODO Notify target user
    else:
        # There is a pending invite from the recipient, add friends
        request.user.friends.add(target)
        FriendInvites.objects.get(sender=target, recipient=request.user).delete()
        socket.send({
            "action":"pmessage",
            "type":"info",
            "message":"You are now friends with {0}. You can now message them here: <div class=\"pmessage-well\"><a href=\"{1}\">{1}</a></div>".format(target.username, target.get_absolute_url())
        })
        # TODO Notify target user

@events.on_finish(channel="^group-")
def finish(request, socket, context):
    data = {
        "action": "user_disconnect",
        "username": request.user.username,
        "user_id": str(request.user.user_id),
    }
    socket.broadcast_channel(data)

@events.on_connect
def on_connect(request, socket, context):
    """
    Handles socket connections. Each time a user opens a connection with the socket
    server this event is fired. It is mainly used to track whether a user is online.
    """
    if request.user.is_authenticated:
        request.user.is_online = True
        request.user.save()

@events.on_disconnect
def on_disconnect(request, socket, context):
    """
    Handles socket disconnects. Each time a user disconnects from the socket server
    this event is fired. It is very similar to the above event, yet in reverse.
    """
    if request.user.is_authenticated:
        request.user.is_online = False
        request.user.save()
