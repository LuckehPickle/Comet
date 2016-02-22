/*
# [FrontendUtils] UTIL-TOGGLE.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
*/

// Get all inner toggles
var toggles = document.querySelectorAll(".toggle");

// Add event listeners to each
for(var i = 0; i < toggles.length; i++){
    toggle = toggles[i]; //Get toggle
    toggle.addEventListener("click", handle);
}

// Handles Toggle Clicks
function handle(event){
    var source = event.target;

    // Move up the heirarchy until we find a DIV. This is to prevent
    // errors later on whilst accessing the class name of the element.
    while(source.tagName != "DIV"){
        source = source.parentNode;
    }

    // Now we need to move up the heirarchy until we find the parentNode
    // container.
    while(source.className.toLowerCase() != "toggle"){
        source = source.parentNode;
    }

    var toggled = source.hasAttribute("data-toggled"); // Get whether the toggle is currently toggled.

    if(toggled){
        source.removeAttribute("data-toggled");
        source.style.backgroundColor = "#EAEDED";
        source.nextSibling.removeAttribute("checked");
        source.children[0].style.opacity = "0";
        source.children[1].style.opacity = "1";
    }else{
        source.setAttribute("data-toggled", "");
        source.style.backgroundColor = "#ABEBC6";
        source.nextSibling.setAttribute("checked", "");
        source.children[0].style.opacity = "1";
        source.children[1].style.opacity = "0";
    }
}
