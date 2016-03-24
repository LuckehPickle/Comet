/*
 [Messenger] MESSENGER.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

var more_d = document.querySelector("#more_d");
var dropdown;
var height;

for(var i = 0; i < more_d.children.length; i++){
    if(more_d.children[i].className == "dropdown"){
        dropdown = more_d.children[i];
        height = dropdown.clientHeight - 20;
        break;
    }
}

if(more_d != null && dropdown != null){
    more_d.addEventListener("click", function(event){
        if(dropdown.style.width == "" || dropdown.style.width == "0px"){
            new mojs.Tween({
                duration: 250,
                onUpdate: function(progress){
                    dropdown.style.width = (240 * progress) + "px";
                    dropdown.style.height = (height * progress) + "px";
                }
            }).run();
        }else if(dropdown.style.width == "240px"){
            new mojs.Tween({
                duration: 250,
                onUpdate: function(progress){
                    dropdown.style.width = (240 * (1 - progress)) + "px";
                    dropdown.style.height = (height * (1 - progress)) + "px";
                }
            }).run();
        }
    });
}