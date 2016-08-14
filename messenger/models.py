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
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.db import models
from django.utils import timezone

# Other Imports
import re
import uuid
from . import identifier as ident


class Channel(models.Model):
    """
    A model for user created channels.
    """

    channel_name = models.CharField(max_length=32)
    channel_url = models.CharField(
        unique=True,
        primary_key=True,
        max_length=20,
        default=ident.generate,
    )

    date_created = models.DateTimeField(default=timezone.now)
    last_message = models.DateTimeField(default=timezone.now)
    is_public = models.BooleanField(default=False)
    is_group = models.BooleanField(default=True)

    # Many to Many of all Users involved in the channel
    users = models.ManyToManyField(
        "accounts.User",
        through="ChannelPermissions",
        through_fields=("channel", "user"),
        related_name="+",
    )

    def __unicode__(self):
        return str(self.name)

    def get_absolute_url(self):
        """
        Gets the URL of this channel.
        """
        if not self.is_group:
            return self.channel_url

        return reverse("messenger.views.group", args=[str(self.channel_url)])


    def get_latest_message(self):
        """
        Gets the contents of the latest message.
        """
        query_set = ChannelMessage.objects.filter(
            channel_url=self.channel_url
        ).order_by("-time_sent")

        if query_set.exists():
            query_set = query_set[0]
        else:
            return None

        return str(query_set.sender) + ": " + str(query_set.contents)


def get_sentinel_user():
    """
    Returns a sentinel user. This user is used in place of a deleted user.
    It must be unique enough that any other user named "deleted" is not
    retrieved instead. Since this user doesn't have a username or password
    we can safely set its super user status to TRUE, which as of right now
    makes it completely unique.
    """
    return get_user_model().objects.get_or_create(
        username="deleted",
        is_active=False,
        is_super_user=True
    )[0]


class ChannelMessage(models.Model):
    """
    Message in a channel.
    """
    sender = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET(get_sentinel_user),
    )

    contents = models.CharField(max_length=256)
    channel_url = models.CharField(max_length=20)
    time_sent = models.DateTimeField(default=timezone.now)
    is_group = models.BooleanField(default=True)

    def get_absolute_url(self):
        view = "messenger.views.group"
        if not self.is_group:
            view = "messenger.views.private"
        return reverse(view, args=[str(self.channel_url)])

    def get_parent_model(self):
        if self.is_group:
            return Channel.objects.get(group_id=self.channel_url)
        return get_user_model().objects.get(user_url=self.channel_url)


class ChannelPermissions(models.Model):
    """
    Stores user specific permissions for each group.
    """
    # The group that these permissions apply to
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
    )

    # The user whose permissions apply
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
    )

    # Creator's have elavated permissions compared to moderators.
    is_creator = models.BooleanField(default=False)

    # Is the user a moderator of this group. This field is ignored if the user is a creator
    is_moderator = models.BooleanField(default=False)

    # Tracks whether the user is currently muted. Muted users can appeal their mute to
    # moderators, but only once per set amount of time.
    is_muted = models.BooleanField(default=False)

    # Tracks whether the user has been banned, preventing them from connecting.
    is_banned = models.BooleanField(default=False)

    # Tracks the reason for the ban, to be relayed to the user on a failed connect.
    ban_reason = models.CharField(
        blank=True,
        max_length=120,
    )


class ChannelInvite(models.Model):
    # The user that received the invite
    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="group_recipient",
    )

    # The user that sent the invite
    sender = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="group_sender",
    )

    # The group that the recipient was invited to
    channel = models.ForeignKey(
        Channel,
        on_delete=models.CASCADE,
    )
