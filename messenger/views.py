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
from django.utils.html import escape

# Messenger Imports
from comet_socketio import notify
from messenger.forms import CreateChatForm
from messenger.models import ChatGroup, ChatPermissions, ChatInvite, ChatMessage
from messenger.identifier import generate

# Other Imports
import cr_config as config
from comet import Modal
from comet.decorators import login_required_message
from accounts.models import User, UserGroup
# from django_socketio import broadcast_channel

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
    Note: Will provide an error if you are not on the users contacts list
    and the user has "only_from_contacts" setting set to TRUE.
    IDEA: Allow users to set unique alliases for their URL.
    TODO Add user blocking
    TODO Add settings such as only_from_contacts
    """
    # Get the user that the user is attempting to message
    user = get_object_or_404(User, user_url=identifier)
    channel_id = None

    if UserGroup.objects.filter(user_one=user, user_two=request.user).count() != 0:
        # UserGroup exists in the opposite direction, join it instead.
        channel_id = UserGroup.objects.get(user_one=user, user_two=request.user).channel_id
    elif UserGroup.objects.filter(user_one=request.user, user_two=user).count() != 0:
        # UserGroup exists in this direction, join it.
        channel_id = UserGroup.objects.get(user_one=request.user, user_two=user).channel_id
    else:
        # No UserGroup exists, create one in this direction and join it.
        group = UserGroup.objects.create(
            user_one=request.user,
            user_two=user,
            channel_id=request.user.user_url + "-" + user.user_url
        )
        channel_id = group.channel_id

    return renderMessenger(
        request,
        title=user,
        channel_id=channel_id,
        chat_title=user.username,
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
    group = get_object_or_404(ChatGroup, group_id=group_id)
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
    perms, created = ChatPermissions.objects.get_or_create(
        chat_group=group,
        user=request.user,
    )

    # Check if the user has been banned
    if perms.is_banned:
        ban_reason = "No reason provided."
        if len(perms.ban_reason) >= 1:
            ban_reason = escape(perms.ban_reason)

        messages.add_message(request, messages.ERROR, "You have been banned from this group for the following reason: <div class=\"pmessage-well\">%s</div> <p class=\"pmessage\">Normally a ban appeal message would go here, but ban appealing hasn't been implemented yet.</p>" % ban_reason)
        return renderMessenger(request, title="Banned", is_group=True, chat_title="Banned")

    # If the request makes it this far, they are free to join the group.
    # TODO If connection is denied disable the text input

    if created:
        # Announce to the channel that a user has joined.
        # Perhaps this should occur in private messages?
        broadcast_channel(message = {
            "action": "user_join",
            "username": request.user.username,
        }, channel="group-" + group_id)

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
    notify.check_notifications(request) # Check for new messages

    modals = [
        Modal(
            title="connecting",
            foreground="comet_socketio/modal_connecting.html",
            background="comet_socketio/modal_connecting_background.html",
        ),
        Modal(
            title="create",
            foreground="messenger/modal_create.html",
            background="messenger/modal_create_background.html",
        )
    ]

    return render(request, "messenger/index.html", {
        "title": (config.TITLE_FORMAT % title),
        "user_id": str(request.user.user_id)[:8],
        "create_chat_form": form,
        "is_group": is_group,
        "channel_id": channel_id,
        "chat_title": chat_title,
        "latest_messages": get_latest_messages(channel_id),
        "modals": modals,
    })

def get_latest_messages(channel_id):
    """
    Gathers the fifteen (15) most recent messages sent in any group.
    """
    if channel_id == None:
        return None
    return ChatMessage.objects.filter(
        channel_id=channel_id,
    ).order_by("-time_sent")[:15]

# CREATE
# Handles the form submissions from the chat creation modal.
@login_required_message
def create(request):
    if request.POST:
        form = CreateChatForm(request.POST)
        if form.is_valid():
            # Generate a new identifier
            group_id = generate()
            while ChatGroup.objects.filter(group_id=group_id).count() != 0:
                group_id = generate()

            data = form.cleaned_data

            # Create a new group
            group = ChatGroup.objects.create(
                name=data["name"],
                is_public=data["is_public"],
                group_id=group_id,
            )

            # Add user permissions
            user_perms = ChatPermissions.objects.create(
                chat_group=group,
                user=request.user,
                is_creator=True,
            )

            if data["is_public"]:
                messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by giving them the URL or by clicking 'add users'." % data["name"])
            else:
                messages.add_message(request, messages.INFO, "Group '%s' successfully created. Add people to this group by clicking 'add users'." % data["name"])
            return redirect(group)

        # TODO handle this better
        messages.add_message(request, messages.ERROR, "The data you entered was invalid.")
        return redirect("messages")
    else:
        messages.add_message(request, messages.ERROR, "A group could not be created because no data was posted.")
        return redirect("messages")
