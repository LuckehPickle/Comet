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

    for(var j = 0; j < trigger.children.length; j++){
        if(trigger.children[j].className == "dropdown"){
            var key = getKey(trigger);
            if(key in dropdowns){
                console.error("The key '" + key + "' is already registered. Please use a unique id or transit id.");
                break;
            }
            dropdowns[key] = trigger.children[j];
            heights[key] = trigger.children[j].clientHeight - 20;
            break;
        }
    }


    trigger.addEventListener("click", function(event){
        var target = event.target;
        if(target.className.indexOf("dropdown-trigger") > -1){
            var key = getKey(target);
            var dropdown = dropdowns[key];
            var height = heights[key];
            var width = target.hasAttribute("data-mobile") ? "mobile" : "240px";

            if(dropdown.style.width == "" || dropdown.style.width == "0px"){
                new mojs.Tween({
                    duration: 250,
                    onUpdate: function(progress){
                        if(width == "mobile"){
                            dropdown.style.width = (parseInt(width) * easingPath(progress)) + "%";
                        }else{
                            dropdown.style.width = (parseInt(width) * easingPath(progress)) + "px";
                        }
                        dropdown.style.height = (height * easingPath(progress)) + "px";
                    }
                }).run();
            }else if(dropdown.style.width == width){
                new mojs.Tween({
                    duration: 250,
                    onUpdate: function(progress){
                        if(width == "mobile"){
                            dropdown.style.width = (parseInt(width) * easingPath(1 - progress)) + "%";
                        }else{
                            dropdown.style.width = (parseInt(width) * easingPath(1 - progress)) + "px";
                        }
                        dropdown.style.height = (height * easingPath(1 - progress)) + "px";
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
