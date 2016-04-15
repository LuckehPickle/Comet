# [Messages_App] URLS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django.conf.urls import url

# Other Imports
from . import views

urlpatterns = [
    url(r'^$', views.index, name="messages"),
    url(r'^create', views.create, name="create"),
    url(r'^user/(?P<identifier>[a-zA-Z0-9]+)$', views.private),
    url(r'^(?P<identifier>[a-zA-Z0-9]+)$', views.group),
]
