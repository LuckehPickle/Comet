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

/* Allows :active styles to work on Safari */
document.addEventListener("touchstart", function(){}, true);

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

var transit_items = document.querySelectorAll(".js-transit");
var animations = {};
for(var i = 0; i < transit_items.length; i++){
    var transit_item = transit_items[i];

    if(!transit_item.hasAttribute("data-transit-id")){
        console.log("An element with class js-transit was not assigned a transit id.");
        break;
    }else if(transit_item.getAttribute("data-transit-id") in animations){
        console.log("Transit id '" + transit_item.getAttribute("data-transit-id") + "' already exists. Please use a unique id.");
        break;
    }

    animations[transit_item.getAttribute("data-transit-id")] = new mojs.Transit({
		parent: transit_item,
		duration: 400,
		type: 'circle',
		radius: {0: 21},
		fill: 'rgba(0, 0, 0, 0.4)',
		stroke: 'rgba(0, 0, 0, 0.4)',
		strokeWidth: {15:0},
		opacity: 0.6,
		x: '50%',
		y: '50%',
		isRunLess: true,
		easing: mojs.easing.bezier(0, 1, 0.5, 1)
	});

    transit_item.addEventListener("click", function(event){
        var source = event.target;
        if(source.hasAttribute("data-transit-id")){
            animations[source.getAttribute("data-transit-id")].run();
        }
    });
}
