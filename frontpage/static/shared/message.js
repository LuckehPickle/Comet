/*
# [Shared] MESSAGE.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
var messages = document.querySelectorAll(".message-close"); //Get all message objects
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

// Init
for(var i = 0; i < messages.length; i++){ //Iterate over messages
    var message = messages[i];
    message.addEventListener("click", function(event){
        var source = event.target; //Get event target
        while(source.tagName != "DIV"){ //Move up the element tree until you reach a div
            source = source.parentNode;
        }
        //Animate
        var start_height = source.offsetHeight;
        new mojs.Tween({
            duration: 300,
            onUpdate: function(progress){
                source.style.height = ((1 - easingPath(progress)) * start_height) + "px";
            },
            onComplete: function(){
                source.style.display = "none";
                source.style.height = "";
            },
        }).run();
    });
}
