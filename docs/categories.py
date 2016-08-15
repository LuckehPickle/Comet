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
from django.core.urlresolvers import reverse

class Category:
    """
    Article Category
    """

    def __init__(self, title, url, colour, db_code):
        self.title = title
        self.url = url
        self.colour = colour
        self.db_code = db_code

    def get_absolute_url(self):
        return reverse("category", args=[self.url])


NEWS = Category("News", "news", "#3F3F3F", "NE") #f44336
SUPPORT = Category("Support", "support", "#3F3F3F", "SU") #ff5722
DOCUMENTATION = Category("Developer Documentation", "developer", "#3F3F3F", "DO") #ffc107
COMMUNITY = Category("Community Submissions", "community", "#3F3F3F", "CO") #689F38

CATEGORIES = [NEWS, SUPPORT, DOCUMENTATION, COMMUNITY]
