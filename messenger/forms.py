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

class CreateChatForm(forms.ModelForm):

    name = forms.CharField(
        label="Name",
        min_length=3,
        max_length=32,
        error_messages={
            "required": "No chat name was provided.",
            "min_length": "Chat names must be atleast three (3) characters long.",
            "max_length": "Chat names must be less than 32 characters long.",
        },
    )

    public = forms.BooleanField(
        label="Anyone with the link can join (public)",
    )
