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

# Other Imports
import cr_config as config
from comet.decorators import login_required_message
from messenger.forms import CreateChatForm
from messenger.models import ChatGroup, ChatPermissions, ChatInvite
from messenger.identifier import generate

# INDEX
# Currently just renders the messenger interface from the template.
@login_required_message
def index(request):
    return renderMessenger(request, title="Messages")

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
# IDEA: Allow groups to create unique aliases for their URL. This will make
# it easier to share the URL of public chats.
# TODO Show an error modal if someone tries to join a group and is denied.
@login_required_message
def group(request, group_id=None):
    # Get the group that the user is attempting to connect to
    group = get_object_or_404(ChatGroup, group_id=group_id)
    # Get the user's membership status
    is_member = group.users.filter(user_id=request.user.user_id) >= 1

    # Check if group is public
    if not group.is_public:
        # Group is private, handle membership/invites
        if not is_member:
            # User is not a member, check if they are invited.
            invites = ChatInvite.objects.filter(group=group, recipient=request.user)
            if invites.count >= 1:
                # User is invited, remove stale invites.
                for invite in invites:
                    invite.delete()
                is_member = True # Membership is added below when the perms are retrieved
            else:
                # User has not been invited, refuse connection
                messages.add_message(request, messages.ERROR, "Sorry, this group is private. You will soon be able to send a request to the groups moderators.")
                return renderMessenger(request, title="Private Group")
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
        return renderMessenger(request, title="Banned")

    # If the request makes it this far, they are free to join the group.
    # TODO Add socket data here
    # TODO If connection is denied disable the text input
    return renderMessenger(request, title=group)

def renderMessenger(request, title, form=CreateChatForm()):
    return render(request, "messenger/index.html", {
        "title": (config.TITLE_FORMAT % title),
        "user_id": str(request.user.user_id)[:8],
        "create_chat_form": form,
    })

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
