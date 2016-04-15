# [Messenger] FORMS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

# Django Imports
from django import forms

# Other Imports
from .models import ChatRoom

# Create Chat Form Class
# Contains information for the chat room creation form.
class CreateChatForm(forms.ModelForm):

    # NAME FIELD
    # These restrictions should be imposed on the client side first, but
    # must remain here for security reasons. Note that this name does not
    # need to be unique, as each chat has it's own unique identifier.
    name = forms.CharField(
        label="Group Name",
        min_length=3,
        max_length=32,
        error_messages={
            "required": "No chat name was provided.", # Field was not filled out
            "min_length": "Chat names must be atleast three (3) characters long.",
            "max_length": "Chat names must be less than 32 characters long.",
        },
    )

    # PUBLIC FIELD
    # Allows users to choose whether the chat should be accessible by the
    # public or not. If set to true then anyone with the URL can join the
    # chat. If set to false then then only users who are invited to join
    # or accepted can subscribe to the room.
    is_public = forms.BooleanField(
        label="Make this group public",
    )

    class Meta:
        model = ChatRoom
        fields = ["name", "is_public"]
