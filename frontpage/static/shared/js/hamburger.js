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

 TODO Animate each path
*/

// Variables
var menu_icon = document.querySelector(".user-menu-icon");
var menu_trigger = document.querySelector(".user-menu-trigger");
var menu_dropdown = document.querySelector(".user-menu-dropdown");
var menu_overlay = document.querySelector(".user-menu-overlay");
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

//Timeline
var timeline = new mojs.Timeline();

// Transit
var transit = new mojs.Transit({
    parent: menu_icon,
    duration: 550,
    type: "circle",
    radius: {0: 22},
    fill: "transparent",
    stroke: "#ABABAB",
    strokeWidth: {16: 0},
    opacity: 0.6,
    x: "50%",
    y: "50%",
    isRunLess: true,
    easing: mojs.easing.bezier(0, 1, 0.5, 1),
});

var fadeIn = new mojs.Tween({
    duration: 350,
    onUpdate: function(progress){
        menu_dropdown.style.opacity = easingPath(progress);
        menu_overlay.style.opacity = easingPath(progress);
    }
});

var fadeOut = new mojs.Tween({
    duration: 100,
    onUpdate: function(progress){
        menu_dropdown.style.opacity = 1 - progress;
        menu_overlay.style.opacity = 1 - progress;
    },
    onComplete: function(){
        menu_dropdown.style.display = "none";
        menu_overlay.style.display = "none";
    }
});

timeline.add(transit);
menu_dropdown.style.display = "none";
menu_overlay.style.display = "none";

// Init
menu_trigger.addEventListener("click", handle);
menu_overlay.addEventListener("click", handle);

function handle(event){
    if(menu_dropdown.style.display == "none"){
        timeline.start(); //Start animation

        menu_dropdown.style.display = "block";
        menu_overlay.style.display = "block";
        fadeIn.run();
    }else{
        fadeOut.run();
    }
}
