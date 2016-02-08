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
#   - CustomUserManager
#   - User

# Django Imports
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import ugettext_lazy as _

# Other Imports
import uuid

# CustomUserManager Class
# This Custom User Manager plays an essential role in bridging the gap
# between the Custom User and the rest of Django.
# TODO Clean up and comment
class CustomUserManager(BaseUserManager):
    # Local Create User function
    def _create_user(self, email, username, password, **extra_fields):
        if not email:
            raise ValueError(_("Email address is required."))
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, username, password, **extra_fields):
        extra_fields.setdefault("is_verified", False)
        extra_fields.setdefault("is_super_user", False)
        return self._create_user(email, username, password, **extra_fields)

    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_super_user", True)
        return self._create_user(email, username, password, **extra_fields)

# User Class
# By adding a custom user class we can allow users to log in
# with an email address rather than a username. This is a huge
# step forward but will still pose a porblem later on. It
# will be difficult to implement an email changing system.
# TODO Clean up and comment
class User(AbstractBaseUser):
    user_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        _("Email Address"),
        unique=True,
        error_messages={
            "unique": "That email address is already in use.",
        },
    )
    username = models.CharField(_("Username"), max_length=32,)
    date_joined = models.DateTimeField(default=timezone.now)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_super_user = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "password"]

    def get_userid(self):
        return self.userid

    def get_email(self):
        return self.email

    def get_username(self):
        return self.username

    def get_join_date(self):
        return self.date_joined
