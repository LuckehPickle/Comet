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
from django.contrib import messages
from django.db.models import Q
from django.http import HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.utils.html import escape

# Messenger Imports
from comet_socketio import notify
from messenger.forms import CreateChatForm
from messenger.identifier import generate
from messenger.models import Channel, ChannelPermissions, ChatInvite, ChatMessage

# Other Imports
import cr_config as config
from accounts.models import User
from comet import dynamic_modals
from comet.decorators import login_required_message

@login_required_message
def index(request):
    """
    Currently just renders the messenger interface from the template.
    """
    return renderMessenger(request, title="Messages")


@login_required_message
def private(request, identifier=None):
    """
    Renders a page that allows you to interact with a specific user.
    Private channels are registered under a channel_id which complies
    to the following format:
        userA.user_url + "-" + userB.user_url
    There is no way of knowing which user is userA and which user is
    userB (should probably redesign this), so both directions must be
    checked for an existing channel before creating a new one.
    """

    # User whos page this user has visited
    target_user = get_object_or_404(User, user_url=identifier)

    channel_id = None
    channel_urls = [ # All possible channel_ids
        request.user.user_url + "-" + identifier,
        identifier + "-" + request.user.user_url,
    ]

    for possible_url in channel_urls:
        channel = Channel.objects.filter(
            is_group=False,
            channel_id=possible_url
        )

        if channel.exists():
            channel_id = possible_url
            break;

    if channel_id == None:
        # No such channel exists, create one.
        channel_id = request.user.user_url + "-" + identifier
        channel = Channel.objects.create(
            name=channel_id,
            channel_id=channel_id,
            is_public=False,
            is_group=False,
        )

        # Add permissions for both users
        ChannelPermissions.objects.create(
            channel=channel,
            user=request.user,
            is_creator=True,
        )

        ChannelPermissions.objects.create(
            channel=channel,
            user=target_user,
        )

    return renderMessenger(
        request,
        title=target_user.username,
        channel_id=channel_id,
        chat_title=target_user.username,
    )


@login_required_message
def group(request, group_id=None):
    """
    Renders a page that allows you to message a particular group.
    IDEA: Allow groups to create unique aliases for their URL. This will make
    it easier to share the URL of public chats.
    TODO Show an error modal if someone tries to join a group and is denied.
    """
    # Get the group that the user is attempting to connect to
    group = get_object_or_404(Channel, channel_id=group_id)
    # Get the user's membership status
    is_member = group.users.filter(user_id=request.user.user_id).count() >= 1

    # Check if group is public
    if not group.is_public:
        print(str(is_member))
        # Group is private, handle membership/invites
        if not is_member:
            # User is not a member, check if they are invited.
            invites = ChatInvite.objects.filter(group=group, recipient=request.user)
            if invites.count() >= 1:
                print("membered")
                # User is invited, remove stale invites.
                for invite in invites:
                    invite.delete()
                is_member = True # Membership is added below when the perms are retrieved
            else:
                print("failure membered")
                # User has not been invited, refuse connection
                messages.add_message(request, messages.ERROR, "Sorry, this group is private. You will soon be able to send a request to the groups moderators.")
                return renderMessenger(request, title="Private Group", is_group=True, chat_title="Private Group")
    else:
        if not is_member:
            is_member = True

    # Get the permission set
    perms, created = ChannelPermissions.objects.get_or_create(
        channel=group,
        user=request.user,
    )

    # Check if the user has been banned
    if perms.is_banned:
        ban_reason = "No reason provided."
        if len(perms.ban_reason) >= 1:
            ban_reason = escape(perms.ban_reason)

        messages.add_message(request, messages.ERROR, "You have been banned from this group for the following reason: <div class=\"pmessage-well\">%s</div> <p class=\"pmessage\">Normally a ban appeal message would go here, but ban appealing hasn't been implemented yet.</p>" % ban_reason)
        return renderMessenger(request, title="Banned", is_group=True, chat_title="Banned")

    return renderMessenger(
        request,
        title=group,
        is_group=True,
        channel_id=group_id,
        chat_title=group.name,
    )


def renderMessenger(request, title, form=CreateChatForm(), is_group=False, channel_id=None, chat_title=None):
    """
    Renders the messenger page
    """
    chunk = None if not "_pjax" in request.GET else request.GET.get("_pjax")

    notify.check_notifications(request) # Check for new messages

    modals = dynamic_modals

    groups = Channel.objects.filter(
        Q(users__in=[request.user]),
        is_group=True,
    ).order_by("-last_message")

    return render(request, "messenger/index.html", {
        "title": (config.TITLE_FORMAT % title),
        "user_id": str(request.user.user_id)[:8],
        "create_chat_form": form,
        "groups": groups,
        "is_group": is_group,
        "channel_id": channel_id,
        "chat_title": chat_title,
        "latest_messages": get_latest_messages(channel_id),
        "modals": modals,
        "chunk": chunk,
    })


def get_latest_messages(channel_id, n=15):
    """
    Gets and returns the latest messages sent in any channel.
    The number of messages can be configured by adjusting n.
    """
    if channel_id == None:
        return None
    return ChatMessage.objects.filter(
        channel_id=channel_id,
    ).order_by("-time_sent")[:n]


@login_required_message
def create(request):
    """
    Creates a new public or private group channel.
    """
    if not request.POST:
        messages.add_message(request, messages.ERROR, "A group could not be created because no data was posted.")
        return redirect("messages")

    form = CreateChatForm(request.POST)
    if not form.is_valid():
        messages.add_message(request, messages.ERROR, "The data you entered was invalid.")
        return redirect("messages")

    # Generate a new identifier
    channel_id = generate()
    while Channel.objects.filter(channel_id=channel_id).count() != 0:
        channel_id = generate()

    data = form.cleaned_data

    # Create a new group
    group = Channel.objects.create(
        name=data["name"],
        is_public=data["is_public"],
        channel_id=channel_id,
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
