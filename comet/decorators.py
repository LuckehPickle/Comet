# [Comet] DECORATORS.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
# Note: This section is based off of the source code from the login_required
# decorator. Source code can be found here:
# https://docs.djangoproject.com/en/1.9/_modules/django/contrib/auth/decorators/

# Django Imports
from django.utils.decorators import available_attrs
from django.contrib import messages
from django.contrib.auth import REDIRECT_FIELD_NAME
from django.contrib.auth.decorators import login_required

# Other Imports
from functools import wraps

DEFAULT_MESSAGE = "You must be logged in to view this content."

# user_passes_test(test_func, [message])
# Checks that the user passes a particular test. If the test is failed then
# the user is shown a message. The test needs to be a callable that accepts
# a user object and returns a True if the user passes.
def user_passes_test(test_func, message=DEFAULT_MESSAGE):
    def decorator(view_func):
        @wraps(view_func, assigned=available_attrs(view_func))
        def _wrapped_view(request, *args, **kwargs):
            if not test_func(request.user):
                messages.add_message(request, messages.ERROR, message)
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

# _login_required_message([function, message])
# Appends a message to the session if the user is not logged in. Designed to
# be placed immediately before the Django login_required decorator is used.
def _login_required_message(function=None, message=DEFAULT_MESSAGE):
    actual_decorator = user_passes_test(
        lambda u: u.is_authenticated(),
        message=message,
    )
    if function:
        return actual_decorator(function)
    return actual_decorator

# login_required_message([function, redirect_field_name, login_url, message])
# Interfaces with the above function, allowing it to be called on it's own,
# rather than before the Django login_required decorator.
def login_required_message(function=None, redirect_field_name=REDIRECT_FIELD_NAME, login_url=None, message=DEFAULT_MESSAGE):
    if function:
        return _login_required_message(
            login_required(function, redirect_field_name, login_url),
            message
        )

    return lambda deferred_function: login_required_message(deferred_function, redirect_field_name, login_url, message)
