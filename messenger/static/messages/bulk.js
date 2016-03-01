/*
# [Messages] BULK.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

// Variables
var utils = document.querySelectorAll(".util");

// Init
for(var i = 0; i < utils.length; i++){
    var util = utils[i];
    util.onmouseover = function(event){
        var source = event.target;
        while(source.className != "util"){
            source = source.parentNode;
        }
        var tooltip = source.children[0];
        tooltip.style.display = "flex";
        tooltip.style.opacity = 0;
        new mojs.Tween({
            duration: 250,
            onUpdate: function(progress){
                tooltip.style.opacity = progress;
            },
        }).run();
    }
    util.onmouseout = function(event){
        var source = event.target;
        while(source.className != "util"){
            source = source.parentNode;
        }
        source.children[0].style.display = "none";
    }
}
