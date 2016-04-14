# [Messages] MODELS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.db import models
from django.utils import timezone
from django.core.urlresolvers import reverse

# Other Imports
from . import identifier as ident
from . import views

class ChatRoom(models.Model):
    name = models.CharField(max_length=32)
    identifier = models.CharField(max_length=20, default=ident.generate)
    date_created = models.DateTimeField(default=timezone.now)
    is_public = models.BooleanField(default=False)

    def __unicode__(self):
        return str(self.name)

    @models.permalink
    def get_absolute_url(self):
        return reverse(views.group, args=[str(self.identifier)])
