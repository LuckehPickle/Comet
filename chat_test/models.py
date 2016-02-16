# [ChatTest] MODELS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
#
# TODO Cleanup and comment

# Django Imports
from django.db import models
from django.template.defaultfilters import slugify

# ChatRoom Class
# Place a comment here that explains what this class does.
class ChatRoom(models.Model):
    name = models.CharField(max_length=32)
    slug = models.SlugField(blank=True)

    class Meta:
        ordering = ("name",)

    def __unicode__(self):
        return self.name

    @models.permalink
    def get_absolute_url(self):
        return ("room", (self.slug,))

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super(ChatRoom, self).save(*args, **kwargs)

# ChatUser Class
class ChatUser(models.Model):
    name = models.CharField(max_length=20)
    session = models.CharField(max_length=20)
    room = models.ForeignKey("chat.Chatroom", related_name="users")

    class Meta:
        ordering = ("name",)

    def __unicode__(self):
        return self.name
