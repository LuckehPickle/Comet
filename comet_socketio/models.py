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
from django.db import models

# Other Imports
import uuid

# Create your models here.
class Notification(models.Model):
    """
    A notification that is stored in the database whilst the user is offline.
    When the user logs on again they are sent via Django's message API. It must
    be stored here so that it can be deleted if the socket handles the hard work.
    """
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
    )

    message_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4
    )

    message_type = models.IntegerField()
    message = models.CharField(max_length=512)
