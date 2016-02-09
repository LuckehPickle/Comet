# [Accounts] MODELS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
#
# This file contains all accounts related models. The models contained
# within this file include:
#   - UserManager
#   - User

# Django Imports
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import ugettext_lazy as _

# Other Imports
import uuid

# UserManager Class [extends BaseUserManager]
# This custom manager class allows the user of a custom user model.
# Note: This class should not be called directly. Instead you should
# access it with User.objects
class UserManager(BaseUserManager):

    # _create_user(self, email, username, password, **extra_fields)
    # This function creates an account from the parameters, but isn't
    # ready to be directly accessed. To create an account use the
    # create_user interface below.
    def _create_user(self, email, username, password, **extra_fields):
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

    # create_user(self, email, username, password, **extra_fields)
    # This function acts as an interface to the _create_user function
    # because it adds various defaults. In this case, verification status
    # and super user status.
    def create_user(self, email, username, password, **extra_fields):
        # Add defaults
        extra_fields.setdefault("is_verified", False)
        extra_fields.setdefault("is_super_user", False)
        return self._create_user(email, username, password, **extra_fields)

    # create_superuser(self, email, username, password, **extra_fields)
    # Comments from above apply here as well.
    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_super_user", True)
        return self._create_user(email, username, password, **extra_fields)

# User Class [extends AbstractBaseUser]
# By adding a custom user class we can allow users to log in with an
# email address rather than a username. This class relies heavily on the
# above UserManager class.
class User(AbstractBaseUser):

    user_id = models.UUIDField( # UUID for uniquely identifying user accounts.
        primary_key=True, # The UUID needs to be the primary key
        default=uuid.uuid4,
        editable=False,
    )

    email = models.EmailField(
        _("Email Address"),
        unique=True,
        error_messages={
            "unique": "That email address is already in use.",
        },
    )

    # Most of these fields are pretty self explanatory.
    username = models.CharField(_("Username"), max_length=32,)
    date_joined = models.DateTimeField(default=timezone.now)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_super_user = models.BooleanField(default=False)

    objects = UserManager() # Reference to the UserManager class above.

    # The default Django authentication backend requires a 'USERNAME_FIELD'
    # which identifies which field is considered to be the unique, identifying
    # field.
    # TODO Create a custom authentication backend to allow users to change
    # their email address, and even add secondary addresses.
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "password"]
