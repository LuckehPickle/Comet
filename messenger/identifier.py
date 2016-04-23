# [Messenger] IDENTIFIER.PY - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

# Other Imports
import base64
import uuid

def generate():
    """
    Generates a random seven (7) character long base64 string to be used
    as a user friendly url for various models (users, chat groups etc).
    The string is based off of the Python implementation of UUID's.
    """
    u = uuid.uuid4() # Generate a new UUID
    b64 = base64.urlsafe_b64encode(str(u))[:7] # Encode in base64, splice to 7 chars
    return b64
