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
from django.contrib import messages
from django.core import serializers
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.html import escape

# Other Imports
from accounts.models import User, FriendInvites
from comet_socketio import notify
from django_socketio import events
from messenger.models import Channel, ChatMessage


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
    if "action" in message:
        if message["action"] == "message" and "message" in message:
            handle_message(request, socket, message)
        if message["action"] == "search" and "query" in message:
            handle_search(request, socket, message)
        if message["action"] == "friend_req" and "user_id" in message:
            handle_friend_request(request, socket, message)
        if message["action"] == "answer_friend_req" and "user_id" in message:
            handle_friend_request_response(request, socket, message)
        if message["action"] == "message_confirm" and "message_id" in message:
            notify.notification_seen(message["message_id"])


@events.on_message
def message(request, socket, context, message):
    """
    For some reason, putting both decorators on the same method does not work as
    expected, so for now this method will handle everything that occurs on the
    front messaging page. It is essentially a duplicate of the above, without
    channel specific events.
    """
    if "action" in message:
        if message["action"] == "search" and "query" in message:
            handle_search(request, socket, message)
        if message["action"] == "friend_req" and "user_id" in message:
            handle_friend_request(request, socket, message)
        if message["action"] == "answer_friend_req" and "user_id" in message:
            handle_friend_request_response(request, socket, message)
        if message["action"] == "message_confirm" and "message_id" in message:
            notify.notification_seen(message["message_id"])


def handle_message(request, socket, message):
    """
    Handles messages sent via a channel, saving them to the database
    and then sending them to all sockets subscribed to the channel.
    If a message is marked to be tagged, it will be concatenated to
    the previous message from the same user.
    """
    channel_id = message["channel_id"]
    is_group = message["is_group"]
    user_message = escape(message["message"])

    # Check if a messsage has been sent in this channel before.
    most_recent = ChatMessage.objects.filter(channel_id=channel_id).order_by("-time_sent")
    if most_recent.count() != 0:
        # A message has been sent, retrieve the most recent
        most_recent = most_recent[0]

        if most_recent.sender == request.user:
            # This user sent the most recent message, tag it instead of creating a new one.
            most_recent.contents += "\n" + user_message
            most_recent.time_sent = timezone.now()
            most_recent.save()
        else:
            most_recent = None
    else:
        most_recent = None

    if most_recent == None:
        most_recent = create_message(request.user, user_message, channel_id, is_group)

    # Send back to sockets
    socket.send_and_broadcast_channel({
        "action": "message",
        "message": message["message"], # Do not broadcast back the escaped string.
        "sender": request.user.username,
        "sender_id": str(request.user.user_id),
        "time_sent": most_recent.time_sent.isoformat(),
    }, channel=("group-" + channel_id) if is_group else ("user-" + channel_id))

    socket.send({
        "action": "message_sent",
    })


def create_message(sender, contents, channel_id, is_group):
    """
    Creates a new chat message instance.
    """
    return ChatMessage.objects.create(
        sender=sender,
        contents=contents,
        channel_id=channel_id,
        is_group=is_group,
    )


def handle_search(request, socket, message):
    """
    Collects the first five (5) results of a database query, serializes them in
    JSON and then sends them back to the user via django-socketio.
    TODO Check if the users are friends, or if there is a friend request pending
    and update the button beside their username accordingly.
    """
    query_set = User.objects.filter(
        Q(username__icontains=message["query"]) &
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


def handle_friend_request(request, socket, message):
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
        # Notify target user
        notify.notify_user(target, messages.INFO,
            "You have received a friend request from {0}<section><div class=\"button-request-accept\" data-user-id=\"{1}\" data-new>Accept Request<link class=\"rippleJS\"/></div><div class=\"button-request-deny\" data-user-id=\"{1}\" data-new>Deny Request<link class=\"rippleJS\"/></div></section>".format(request.user.username, str(request.user.user_id))
        )
    else:
        # There is a pending invite from the recipient, add friends
        request.user.friends.add(target)
        FriendInvites.objects.get(sender=target, recipient=request.user).delete()

        # Notify
        socket.send({
            "action":"pmessage",
            "type":"info",
            "message":"You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(target.username, target.get_absolute_url())
        })

        # Notify target user
        notify.notify_user(target, messages.INFO, "You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(request.user.username, request.user.get_absolute_url()))


def handle_friend_request_response(request, socket, message):
    """
    Handles responses to friend requests.
    """
    target = None
    try:
        # Attempt to get the user
        target = User.objects.get(user_id=message["user_id"])
        # Attempts to delete the invitation instance
        FriendInvites.objects.get(recipient=request.user, sender_id=target).delete()
    except:
        return

    if message["accept"]:
        request.user.friends.add(target)
        socket.send({
            "action":"pmessage",
            "type":messages.INFO,
            "message":"You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(target.username, target.get_absolute_url())
        })
        notify.notify_user(target, messages.INFO, "You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(request.user.username, request.user.get_absolute_url()))


@events.on_connect
def on_connect(request, socket, context):
    """
    Handles socket connections. Each time a user opens a connection with the socket
    server this event is fired. It is mainly used to track whether a user is online.
    """
    if request.user.is_authenticated:
        request.user.is_online = True
        request.user.socket_session = socket.session.session_id
        request.user.save()


@events.on_finish(channel=".")
def finish(request, socket, context):
    """
    Handles socket disconnects. Each time a user disconnects from the socket server
    this event is fired. It is very similar to the above event, yet in reverse.
    """
    if request.user.is_authenticated:
        request.user.is_online = False
        request.user.save()
