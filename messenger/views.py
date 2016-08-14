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
from django.db.models import Q
from django.http import HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.html import escape

# Messenger Imports
from comet_socketio import notify
from messenger.forms import CreateChatForm
from messenger.identifier import generate
from messenger.models import Channel, ChannelPermissions, ChannelInvite, ChannelMessage

# Other Imports
import cr_config as config
from accounts.models import User
from comet.decorators import login_required_message


@login_required_message
def index(request):
    """
    Handles frontpage for the messenger.
    """
    return renderMessenger(request)


@login_required_message
def private(request, user_url=None):
    """
    Handles connections to private channels (directly to a user).

    :param request: Django request object.
    :param channel_url: Channel ID.
    """

    target = get_object_or_404(User, user_url=user_url)

    if target == request.user:
        # TODO Redirect to settings file here.
        raise Http404("Your user settings would be here, but I haven't made them yet.")

    #if not request.user.friends.filter(user_id=target.user_id).exists():
    #    raise Http404("You are not friends with this user!")

    channel_url = None
    channel_urls = [
        "#[" + request.user.user_url + "][" + user_url + "]",
        "#[" + user_url + "][" + request.user.user_url + "]",
    ]

    for possible_url in channel_urls:
        channel = Channel.objects.filter(
            is_group=False,
            channel_url=possible_url,
        )

        if channel.exists():
            channel_url = possible_url
            break;

    if channel_url == None:
        # Channel hasn't been created yet
        """
        Note: User channels are denoted with the following syntax:
        `#[nameA][nameB]`
        `#[urlA][urlB]`
        This is so that the correct URL and name can be selected later by
        the client. This doesn't seem to be a very good way of doing things,
        but it's all I can think of for right now.
        TODO Rethink this.
        """
        channel_name = "#[" + request.user.username + "][" + target.username + "]"
        channel_url = "#[" + request.user.user_url + "][" + user_url + "]"
        channel = Channel.objects.create(
            channel_name=channel_name,
            channel_url=channel_url,
            is_public=False,
            is_group=False,
        )

        # Add permissions for both users
        ChannelPermissions.objects.create(
            channel=channel,
            user=request.user,
        )

        ChannelPermissions.objects.create(
            channel=channel,
            user=target,
        )

    data = {
        "title": (config.TITLE_FORMAT % target.username),
        "channel_url": channel_url,
        "channel_title": target.username,
        "channel_messages": get_latest_messages(request, channel_url),
    }

    return renderMessenger(request, data)


@login_required_message
def group(request, channel_url=None):
    """
    Handles connections to group channels.

    :param request: Django request object.
    :param channel_url: Channel ID.
    """

    channel = get_object_or_404(Channel, channel_url=channel_url)
    is_member = channel.users.filter(user_id=request.user.user_id).count() >= 1

    if channel.is_public and not is_member:
        # User is not a member, but needs to become one.
        is_member = True

    if not is_member:
        # Check if the user has been invited.
        invites = ChannelInvite.objects.filter(channel=channel, recipient=request.user)

        if invites.count() >= 1: # User has been invited.
            for invite in invites:
                invite.delete() # Delete stale invite.
            is_member = True
        else:
            raise Http404("Sorry, this group is private.")

    # Get or create permissions.
    perms, created = ChannelPermissions.objects.get_or_create(
        channel=channel,
        user=request.user,
    )

    if perms.is_banned:
        ban_reason = "No ban reason provided."
        if len(perms.ban_reason) >= 1:
            ban_reason = escape(perms.ban_reason)

        raise Http404(ban_reason)

    data = {
        "title": (config.TITLE_FORMAT % channel),
        "channel_url": channel_url,
        "channel_title": channel.name,
        "channel_messages": get_latest_messages(request, channel_url),
        "is_group": True,
    }

    return renderMessenger(request, data)


def renderMessenger(request, data={}):
    """
    Renders the messenger page.

    :param request: Django request object.
    :param data: Additional data to pass to the template.
    """

    # TODO Only get channels from the last week(?)
    channels = Channel.objects.filter(
        Q(users__in=[request.user]),
    ).order_by("-last_message")[:30]

    # Default values
    template_args = {
        "title": (config.TITLE_FORMAT % "Messages"),
        "user_id": str(request.user.user_id)[:8],
        "channels": channels,
        "channel_url": None,
        "channel_title": "No Channel Selected.",
        "channel_messages": None,
        "is_group": False,
        "pjax_req": None if not "_pjax" in request.GET else request.GET.get("_pjax")
    }
    template_args.update(data)

    return render(request, "messenger/index.html", template_args)


def get_latest_messages(request, channel_url, n=25):
    """
    Gets and returns the latest messages sent in any channel. Converting
    to HTML, as it is too complicated to perform in the tempalte.

    :param channel_url: URL of the channel in question.
    :param n: Number of messages to retrieve.

    TODO Improve/rethink
    """
    if channel_url == None:
        return None

    messages = ChannelMessage.objects.filter(
        channel_url=channel_url,
    ).order_by("-time_sent")[:n]

    out = ""
    previous_sender_name = None
    previous_sender_id = None
    previous_origin = None
    count = 0

    for message in reversed(messages):
        count += 1
        origin = "left" if message.sender != request.user else "right"
        sender_id = str(message.sender.user_id)
        sender_name = str(message.sender.username)

        if previous_sender_id == sender_id:
            out += (
                "<div class='message-wrapper' data-{0} data-user-id='{1}'>"
                    "<div class='message-content-wrapper'>"
                        "<p class='message-content'>{2}</p>"
                    "</div>"
                "</div>"
            ).format(origin, sender_id, message.contents)
        else:
            if previous_sender_id != sender_id and count:
                # The previous message was the last of its kind,
                # so we need to append a name tag.
                out += (
                    "<div class='message-user-wrapper' data-{0} data-sender-id='{1}'>"
                        "<p class='message-user-name noselect'>{2}</p>"
                    "</div>"
                ).format(previous_origin, previous_sender_id, previous_sender_name)

            out += (
                "<div class='message-wrapper' data-{0} data-image data-user-id='{1}'>"
                    "<div class='message-image'></div>"
                    "<div class='message-content-wrapper'>"
                        "<p class='message-content'>{2}</p>"
                    "</div>"
                "</div>"
            ).format(origin, sender_id, message.contents)

        previous_sender_name = sender_name
        previous_sender_id = sender_id
        previous_origin = origin

    # Add nametag for the final message
    out += (
        "<div class='message-user-wrapper' data-{0} data-sender-id='{1}'>"
            "<p class='message-user-name noselect'>{2}</p>"
        "</div>"
    ).format(previous_origin, previous_sender_id, previous_sender_name)

    return out


@login_required_message
def create(request):
    """
    Creates a new public or private group channel.

    TODO Redo without form
    """
    if not request.POST:
        messages.add_message(request, messages.ERROR, "A group could not be created because no data was posted.")
        return redirect("messages")

    form = CreateChatForm(request.POST)
    if not form.is_valid():
        messages.add_message(request, messages.ERROR, "The data you entered was invalid.")
        return redirect("messages")

    # Generate a new identifier
    channel_url = generate()
    while Channel.objects.filter(channel_url=channel_url).exists():
        channel_url = generate()

    data = form.cleaned_data

    # Create a new group
    group = Channel.objects.create(
        name=data["name"],
        is_public=data["is_public"],
        channel_url=channel_url,
        is_group=True,
    )

    # Add user permissions
    user_perms = ChannelPermissions.objects.create(
        channel=group,
        user=request.user,
        is_creator=True,
    )

    if data["is_public"]:
        messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by giving them the URL or by clicking 'add users'." % data["name"])
    else:
        messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by clicking 'add users'." % data["name"])
    return redirect(group)
