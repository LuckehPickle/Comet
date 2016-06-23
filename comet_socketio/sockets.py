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
from django.core import serializers
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.html import escape

# SocketIO Imports
from socketio.namespace import BaseNamespace
from socketio.sdjango import namespace

# Other Imports
from accounts.models import User, FriendInvites
from comet_socketio import notify
from comet_socketio.mixins import ChannelMixin
from messenger.models import Channel, ChatMessage


def create_message(sender, message, channel_id):
    """
    Creates a new chat message instance.
    :param sender: The user that sent the message.
    :param message: The message that was sent.
    :param channel_id: Identifier of the channel which handled the message.
    """
    return ChatMessage.objects.create(
        sender=sender,
        contents=message,
        channel_id=channel_id,
    )


@namespace('/messenger')
class MessengerNamespace(BaseNamespace, ChannelMixin):
    """
    SocketIO Messenger namespace.
    """

    def on_connect(self):
        """
        Event that is fired whenever the user connects to the socket server.
        """
        user = self.request.user
        if user.is_authenticated:
            user.socket_session = self.socket.sessid
            user.is_online = True
            user.save()
        return True


    def on_message(self, data):
        """
        Event that is fired whenever a chat message is sent.
        :param data: Data from the SocketIO client.
        
        TODO Check message length, and whether user is in group.
        """
        if not "channel_id" in data and not "message" in data:
            return

        channel_id = data["channel_id"]
        message = data["message"]

        # Check if a messsage has been sent in this channel before.
        most_recent = ChatMessage.objects.filter(channel_id=channel_id).order_by("-time_sent")

        if most_recent.count() != 0:
            # A message has been sent, retrieve the most recent
            most_recent = most_recent[0]

            if most_recent.sender == self.request.user:
                # This user sent the most recent message, tag it instead of creating a new one.
                most_recent.contents += "\n" + escape(message)
                most_recent.time_sent = timezone.now()
                most_recent.save()
            else:
                most_recent = None
        else:
            most_recent = None

        if most_recent == None:
            most_recent = create_message(
                sender=self.request.user,
                contents=escape(message),
                channel_id=channel_id
            )

        self.emit("message", {
            "action": "message_sent",
        })

        self.emit_to_channel(channel_id, "message", {
            "action": "message",
            "message": message,
            "channel_id": channel_id,
            "sender": self.request.user.username,
            "sender_id": str(self.request.user.user_id),
            "time_sent": most_recent.time_sent.isoformat(),
        })

        return True


    def on_search(self, query):
        """
        Event that is fired whenever a search query is received. Essentially the backend
        for the search bar on the messenger page.
        
        :param query: Query sent from the SocketIO client.
        """
        
        # Create a Query Set from the query.
        query_set = User.objects.filter(
            Q(username__icontains=query) & ~Q(user_id=self.request.user.user_id) # ~Q negates (not)
        ).order_by("username")[:5]
        
        # Searialize as JSON
        json_query_set = serializers.serialize(
            "json",
            query_set, 
            fields = (
                "username",
                "user_id",
                "is_premium",
                "user_url",
            ),
        )

        # Dict of friends within the Query Set
        friends_in_query = {}

        # Iterate over Query Set, looking for friends.
        for query_user in query_set:
            if self.request.user.friends.filter(user_id=query_user.user_id).count() != 0:
                friends_in_query[str(query_user.user_id)] = "friend"
            elif FriendInvites.objects.filter(sender=self.request.user, recipient=query_user).count() != 0:
                friends_in_query[str(query_user.user_id)] = "request_sent"
            elif FriendInvites.objects.filter(sender=query_user, recipient=self.request.user).count() != 0:
                friends_in_query[str(query_user.user_id)] = "request_received"

        # Emit Data.
        self.emit("message", {
            "action": "search",
            "users": json_query_set,
            "friends": friends_in_query,
        })
        
        # Event handled. Return True.
        return True


    def on_friend_req(self, user_id):
        """
        Event handler for friend requests from the SocketIO client.
        :param user_id: The user identifier of the target user.
        """
        
        # Get the target user from the user_id.
        target = get_object_or_404(User, user_id=user_id)

        # Check if the users are already friends.
        if self.request.user.friends.filter(user_id=user_id).count() != 0:
            # Users are already friends
            self.emit("message", {
                "action":"push_message",
                "type":"error",
                "message":"You are already friends with {0}.".format(target.username)
            })
            
            # Event handled.
            return True

        # Make sure there are no currently pending requests
        if FriendInvites.objects.filter(sender=self.request.user, recipient=target).count() != 0:
            # User has already sent a friend request to the target
            self.emit("message", {
                "action":"push_message",
                "type":"error",
                "message":"There is already a pending friend request between you and {0}.".format(target.username)
            })
            
            # Event Handled
            return True

        # There are no currently pending requests in this direction, check other dir
        if FriendInvites.objects.filter(sender=target, recipient=self.request.user).count() == 0:
            
            # There are no invites in either direction, create one.
            FriendInvites.objects.create(
                sender=self.request.user,
                recipient=target,
            )
            
            # Notify the sender
            self.emit("message", {
                "action":"push_message",
                "type":"info",
                "message":"Friend request successfully sent to {0}.".format(target.username)
            })
            
            # Notify the target user
            notify.notify_user(target, messages.INFO,
                "You have received a friend request from {0}<section><div class=\"button-request-accept\" data-user-id=\"{1}\" data-new>Accept Request<link class=\"rippleJS\"/></div><div class=\"button-request-deny\" data-user-id=\"{1}\" data-new>Deny Request<link class=\"rippleJS\"/></div></section>".format(self.request.user.username, str(self.request.user.user_id))
            )
        else:
            # There is a pending invite from the recipient, add friends
            self.request.user.friends.add(target)
            FriendInvites.objects.get(sender=target, recipient=self.request.user).delete()

            # Notify the sender
            self.emit("message", {
                "action":"push_message",
                "type":"info",
                "message":"You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(target.username, target.get_absolute_url())
            })
            
            # Notify the targey user.
            notify.notify_user(
                target,
                messages.INFO,
                "You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(self.request.user.username, self.request.user.get_absolute_url())
            )

        # Event Handled
        return True


    def on_answer_friend_req(self, data):
        """
        Event handler for responses to friend requests.
        """
        target = None
        try:
            # Get user from user_id
            target = User.objects.get(user_id=data["user_id"])
            # Attempts to delete the invitation instance
            FriendInvites.objects.get(recipient=self.request.user, sender_id=target).delete()
        except:
            return

        if data["accept"]:
            self.request.user.friends.add(target)
            self.emit("message", {
                "action":"push_message",
                "type":messages.INFO,
                "message":"You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(target.username, target.get_absolute_url())
            })

            """
            pkt = dict(
                type="event",
                name="message",
                args=[{
                    "action":"push_message",
                    "type":messages.INFO,
                    "message":"You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(self.request.user.username, self.request.user.get_absolute_url()),
                }],
                endpoint="/messenger",
            )
            """

            # Notify target user
            notify.notify_user(
                target,
                messages.INFO,
                "You are now friends with {0}. You can now message them here: <div class=\"push-message-well\"><a href=\"{1}\">{1}</a></div>".format(self.request.user.username, self.request.user.get_absolute_url())
            )

        return True
