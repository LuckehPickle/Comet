/*
 [Shared] HAMBURGER.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

 TODO Merge Hamburger.js into this script
*/

var trigger = document.querySelector(".mobile-nav-trigger");
var nav_ul = document.querySelector(".nav-ul");

if(trigger != null){
    trigger.addEventListener("click", function(event){
        if(trigger.hasAttribute("data-active")){
            //Hide nav_ul
            trigger.removeAttribute("data-active");
            nav_ul.className = "nav-ul";
        }else{
            // Show nav_ul
            trigger.setAttribute("data-active", "");
            nav_ul.className = "nav-ul active";
        }
    });
}

var menu_icons = document.querySelector(".menu-icons");
var more_transit = document.querySelector("#more-transit");
var easingPath = mojs.easing.bezier(0, 1, 0.5, 1);

var transit = new mojs.Tween({
    duration: 300,
    onStart: function(){
        more_transit.style.transform = "scale(0)";
        more_transit.style.opacity = "0";
        more_transit.style.display = "block";
    },
    onUpdate: function(progress){
        more_transit.style.transform = "scale(" + easingPath(progress) + ")";
        more_transit.style.opacity = "" + easingPath(progress);
    },
    onComplete: function(){
        onTransitComplete.run();
    },
});

var onTransitComplete = new mojs.Tween({
    duration: 200,
    onUpdate: function(progress){
        more_transit.style.opacity = "" + (1 - progress);
    },
    onComplete: function(){
        more_transit.style.display = "";
    }
});

menu_icons.addEventListener("click", function(event){
    transit.run();
});
