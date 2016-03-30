/*
 [Shared] DROPDOWN.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var dropdown_triggers = document.querySelectorAll(".dropdown-trigger");
var dropdowns = {};
var heights = {};
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

for(var i = 0; i < dropdown_triggers.length; i++){
    var trigger = dropdown_triggers[i];
    var key = null;
    var searchNode = trigger;

    if(trigger.hasAttribute("data-mobile")){
        searchNode = trigger.parentNode;
    }

    for(var j = 0; j < searchNode.children.length; j++){
        if(searchNode.children[j].className == "dropdown"){
            key = getKey(trigger);
            if(key in dropdowns){
                console.error("The key '" + key + "' is already registered. Please use a unique id or transit id.");
                break;
            }
            dropdowns[key] = searchNode.children[j];
            heights[key] = searchNode.children[j].clientHeight - 20;
            break;
        }
    }

    trigger.addEventListener("click", function(event){
        var target = event.target;
        if(target.className.indexOf("dropdown-trigger") > -1){
            var key = getKey(target);
            var dropdown = dropdowns[key];
            var height = heights[key];
            var mobile = target.hasAttribute("data-mobile");

            if(dropdown.style.width == "" || dropdown.style.width == "0px"){
                new mojs.Tween({
                    duration: 250,
                    onUpdate: function(progress){
                        if(mobile){
                            dropdown.style.width = (100 * easingPath(progress)) + "%";
                        }else{
                            dropdown.style.width = (240 * easingPath(progress)) + "px";
                            dropdown.style.height = (height * easingPath(progress)) + "px";
                        }
                    }
                }).run();
            }else if(dropdown.style.width == "240px" || dropdown.style.width == "100%"){
                new mojs.Tween({
                    duration: 250,
                    onUpdate: function(progress){
                        if(mobile){
                            dropdown.style.width = (100 * easingPath(1 - progress)) + "%";
                        }else{
                            dropdown.style.width = (240 * easingPath(1 - progress)) + "px";
                            dropdown.style.height = (height * easingPath(1 - progress)) + "px";
                        }
                    },
                    onComplete: function(){
                        dropdown.style.width = "0px";
                    }
                }).run();
            }
        }
    });
}

function getKey(element){
    return element.hasAttribute("data-transit-id") ? element.getAttribute("data-transit-id") : element.id;
}
