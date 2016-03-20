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
/*var sign_in = document.querySelector(".sign-in");

if(sign_in != null){
    sign_in.addEventListener("click", function(event){
        new mojs.Transit({
            parent: sign_in,
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
        }).run();
    });
}*/

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
