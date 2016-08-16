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
from django.db import models
from django.template.defaultfilters import slugify
from django.utils import timezone

# Other Imports
import re


class Article(models.Model):
    """
    A model for user created articles.
    """

    NEWS = "NE"
    SUPPORT = "SU"
    DOCUMENTATION = "DO"
    COMMUNITY = "CO"

    CATEGORIES = (
        (NEWS, "news"),
        (SUPPORT, "support"),
        (DOCUMENTATION, "developer"),
        (COMMUNITY, "community"),
    )

    title = models.CharField(max_length=96)

    category = models.CharField(
        max_length = 2,
        choices = CATEGORIES,
        default = COMMUNITY,
    )

    slug = models.SlugField(max_length=50)
    markup_content = models.CharField(max_length=4096)

    creator = models.ForeignKey(
        "accounts.User",
        on_delete = models.SET_NULL,
        blank = True,
        null = True,
        related_name = "articles",
    )

    date_created = models.DateTimeField(auto_now=True)

    last_edited = models.DateTimeField(auto_now=True)
    last_edited_by = models.ForeignKey(
        "accounts.User",
        on_delete = models.SET_NULL,
        blank = True,
        null = True,
        related_name = "articles_edited"
    )

    def save(self, *args, **kwargs):
        unique_slugify(self, self.title)
        super(Article, self).save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("article", args = [
            get_category_url(self.category),
            self.slug,
        ])

    def get_edit_url(self):
        return reverse("edit", args=[self.slug])


def get_category_url(category):
    """
    Gets a category's URL representation.
    :param category:
    """

    for item in Article.CATEGORIES:
        if item[0] == str(category):
            return item[1]


def unique_slugify(instance, value, slug_field_name='slug', queryset=None,
                   slug_separator='-'):
    """
    Snippet from: https://djangosnippets.org/snippets/690/
    Calculates and stores a unique slug of ``value`` for an instance.

    ``slug_field_name`` should be a string matching the name of the field to
    store the slug in (and the field to check against for uniqueness).

    ``queryset`` usually doesn't need to be explicitly provided - it'll default
    to using the ``.all()`` queryset from the model's default manager.
    """
    slug_field = instance._meta.get_field(slug_field_name)

    slug = getattr(instance, slug_field.attname)
    slug_len = slug_field.max_length

    # Sort out the initial slug, limiting its length if necessary.
    slug = slugify(value)
    if slug_len:
        slug = slug[:slug_len]
    slug = _slug_strip(slug, slug_separator)
    original_slug = slug

    # Create the queryset if one wasn't explicitly provided and exclude the
    # current instance from the queryset.
    if queryset is None:
        queryset = instance.__class__._default_manager.all()
    if instance.pk:
        queryset = queryset.exclude(pk=instance.pk)

    # Find a unique slug. If one matches, at '-2' to the end and try again
    # (then '-3', etc).
    next = 2
    while not slug or queryset.filter(**{slug_field_name: slug}):
        slug = original_slug
        end = '%s%s' % (slug_separator, next)
        if slug_len and len(slug) + len(end) > slug_len:
            slug = slug[:slug_len-len(end)]
            slug = _slug_strip(slug, slug_separator)
        slug = '%s%s' % (slug, end)
        next += 1

    setattr(instance, slug_field.attname, slug)


def _slug_strip(value, separator='-'):
    """
    Cleans up a slug by removing slug separator characters that occur at the
    beginning or end of a slug.

    If an alternate separator is used, it will also replace any instances of
    the default '-' separator with the new separator.
    """
    separator = separator or ''
    if separator == '-' or not separator:
        re_sep = '-'
    else:
        re_sep = '(?:-|%s)' % re.escape(separator)
    # Remove multiple instances and if an alternate separator is provided,
    # replace the default '-' separator.
    if separator != re_sep:
        value = re.sub('%s+' % re_sep, separator, value)
    # Remove separator from the beginning and end of the slug.
    if separator:
        if separator != '-':
            re_sep = re.escape(separator)
        value = re.sub(r'^%s+|%s+$' % (re_sep, re_sep), '', value)
    return value
