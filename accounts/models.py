import uuid

from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils.translation import ugettext_lazy as _

# Custom User Manager class
# This Custom User Manager seems to play an essential role in
# bridging the gap between the Custom User and the rest of Django.
# I need to understand this further. Most of my knowledge comes
# from the source code.
# ERROR: 'NoneType' object is not callable ln 18
class CustomUserManager(BaseUserManager):
    # Local Create User function
    def _create_user(self, email, username, password, **extra_fields):
        if not email:
            raise ValueError("Email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, username, password, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_super_user", False)
        return self._create_user(email, username, password, **extra_fields)

    def create_superuser(self, email, username, password, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_super_user", True)
        return self._create_user(email, username, password, **extra_fields)

# Custom User class
# By adding a custom user class we can allow users to log in
# with an email address rather than a username. This is a huge
# step forward but will still pose a porblem later on. It
# will be difficult to implement an email changing system.
class User(AbstractBaseUser):
    userid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(
        _("Email Address"),
        unique=True,
        error_messages={
            "unique": "That email address is already in use.",
        },
    )
    username = models.CharField(_("Username"), max_length=32,)
    date_joined = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
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
