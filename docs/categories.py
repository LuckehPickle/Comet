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

# Docs Imports
from docs.models import Article

class Category:
    """
    Article Category
    """

    def __init__(self, title, description, url, colour, db_code):
        self.title = title
        self.description = description
        self.url = url
        self.colour = colour
        self.db_code = db_code

    def get_absolute_url(self):
        return reverse("category", args=[self.url])

    def recent_articles(self):
        """
        Collects the most recent articles of a category.
        """
        return Article.objects.filter(
            category=self.db_code,
        ).order_by("last_edited")[:10]


NEWS = Category(
    title = "News",
    description = "Site news, changelogs and updates.",
    url = "news",
    colour = "#F44336",
    db_code = "NE",
)

SUPPORT = Category(
    title = "Support",
    description = "Helping you understand Comet.",
    url = "support",
    colour = "#5E35B1",
    db_code = "SU",
)

DEVELOPER = Category(
    title = "Developer",
    description = "Developer logs, explanations and all things code.",
    url = "developer",
    colour = "#E91E63",
    db_code = "DE",
)

COMMUNITY = Category(
    title = "Community",
    description = "For the community, by the community.",
    url = "community",
    colour = "#689F38",
    db_code = "CO",
)

OTHER = Category(
    title = "Other",
    description = "Miscellaneous articles.",
    url = "other",
    colour = "#2196F3",
    db_code = "OT",
)

CATEGORIES = [NEWS, SUPPORT, DEVELOPER, COMMUNITY, OTHER]
