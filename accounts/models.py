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
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.urlresolvers import reverse
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

# Other Imports
import uuid
from messenger import identifier


class UserManager(BaseUserManager):
    """
    Manages the creation of User models.
    """

    
    def _create_user(self, email, username, password, **extra_fields):
        """
        Creates a user model.
        """
        
        # Make sure that the function is provided with an email address.
        if not email:
            # Raise a value error if no email address was supplied.
            raise ValueError(_("Email address is required."))
        
        # Normalizing the email simply lower cases the domain.
        email = self.normalize_email(email)
        
        # This is the actual user creation process.
        user = self.model(email=email, username=username, **extra_fields)
        
        # You have to set the password after creation so that it can
        # be hashed with PBKDF2.
        user.set_password(password)
        user.save(using=self._db) # Save the new user to the database
        return user
    

    def create_user(self, email, username, password, **extra_fields):
        """
        An interface for the above function. Creates a user model.
        
        TODO Since this is the only function that needs to interface,
        merge it with the above function.
        """
        
        # Add defaults
        extra_fields.setdefault("is_verified", False)
        extra_fields.setdefault("is_super_user", False)
        return self._create_user(email, username, password, **extra_fields)
        

class User(AbstractBaseUser):
    """
    A User model.
    """

    user_id = models.UUIDField(
        primary_key=True, # The UUID needs to be the primary key
        default=uuid.uuid4,
    )

    email = models.EmailField(
        _("Email Address"),
        unique=True,
        error_messages={
            "unique": "That email address is already in use.",
        },
    )

    username = models.CharField(
        _("Username"),
        max_length=32,
    )

    friends = models.ManyToManyField(
        "self",
    )

    user_url = models.CharField(
        unique=True,
        max_length=20,
        default=identifier.generate,
    )

    date_joined = models.DateTimeField(default=timezone.now)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_super_user = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)
    socket_session = models.CharField(max_length=20, blank=True)

    objects = UserManager() # Reference to the UserManager class above.

    # The default Django authentication backend requires a 'USERNAME_FIELD'
    # which identifies which field is considered to be the unique, identifying
    # field.
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "password"]

    def __unicode__(self):
        return str(self.username)

    def get_absolute_url(self):
        return reverse("messenger.views.private", args=[str(self.user_url)])


class FriendInvites(models.Model):
    """
    Friend request/invite model.
    TODO Rename to FriendRequest
    """
    
    recipient = models.ForeignKey(
        "User",
        on_delete=models.CASCADE,
        related_name="request_sender",
    )

    sender = models.ForeignKey(
        "User",
        on_delete=models.CASCADE,
        related_name="request_recipient",
    )

    sent = models.DateTimeField(default=timezone.now)
