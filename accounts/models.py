import uuid

from django.db import models
from django.contrib.auth.models import AbstractBaseUser

# Custom User class
# By adding a custom user class we can allow users to log in
# with an email address rather than a username. This is a huge
# step forward but will still pose a porblem later on. It
# will be difficult to implement an email changing system.
class User(AbstractBaseUser):
    userid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField("Email Address", unique=True)
    username = models.CharField("Username", max_length=32)
    date_joined = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_super_user = models.BooleanField(default=False)

    USERNAME_FIELD = "email"

    def __unicode__(self):
        return self.email
