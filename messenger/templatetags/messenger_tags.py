# [Messenger] MESSENGER_TAGS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
from django import template
register = template.Library()

# Other Imports
import re
from comet_socketio import utils


@register.filter(name="field_type")
def field_type(field):
    """
    Returns the field type
    """
    return field.field.widget.__class__.__name__


@register.filter(name="sort_by")
def sort_by(queryset, order):
    """
    Sorts a query set by a certain parameter
    """
    return queryset.order_by(order)


@register.filter(name="is_other")
def is_other(model, user_id):
    """
    Tests to see whether a user matches the current user
    """
    if model.sender_id == user_id:
        return ""
    return "-other"


@register.filter(name="to_external")
def to_external(internal, user_info):
    """
    Converts internal data to external data. Only needed
    in non-group channels.

    Matches data conforming to the following syntax:
    `#[dataA][dataB]`
    """
    pattern = re.compile(r"#\[([\w]+)\]\[([\w]+)\]")
    match = pattern.findall(internal)
    if not len(match):
        return internal

    match = match[0]

    for m in match:
        if m != user_info:
            return m

    return internal
