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

 TODO Rewrite in JQuery
*/

var createGroupTriggers = document.querySelectorAll(".create-group-trigger");
var modal_wrapper = document.querySelector(".modal-wrapper");
var modal_create = document.querySelector(".modal-create");
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

var modal_animations = {};

var modal_create_show = new mojs.Tween({
    duration: 250,
    onStart: function(){
        modal_create.setAttribute("data-animating", "");
        modal_wrapper.setAttribute("data-animating", "");
    },
    onUpdate: function(progress){
        modal_create.style.opacity = easingPath(progress);
        modal_wrapper.style.opacity = easingPath(progress);
    },
    onComplete: function(){
        modal_create.removeAttribute("data-animating");
        modal_create.setAttribute("data-enabled", "");
        modal_wrapper.removeAttribute("data-animating");
        modal_wrapper.setAttribute("data-enabled", "");
    },
});

modal_animations["create-show"] = modal_create_show;

var modal_create_hide = new mojs.Tween({
    duration: 300,
    delay: 120,
    onStart: function(){
        modal_create.removeAttribute("data-enabled");
        modal_create.setAttribute("data-animating", "");
        modal_wrapper.removeAttribute("data-enabled");
        modal_wrapper.setAttribute("data-animating", "");
    },
    onUpdate: function(progress){
        modal_create.style.opacity = (1 - easingPath(progress));
        modal_wrapper.style.opacity = (1 - easingPath(progress));
    },
    onComplete: function(){
        modal_create.removeAttribute("data-animating");
        modal_wrapper.removeAttribute("data-animating");
    },
});

modal_animations["create-hide"] = modal_create_hide;

var modal_create_cancel = document.querySelector(".modal-create-cancel");

modal_create_cancel.addEventListener("click", function(){
    toggleModal(modal_create);
});

for(var i = 0; i < createGroupTriggers.length; i++){
    var trigger = createGroupTriggers[i];
    trigger.addEventListener("click", function(){
        toggleModal(modal_create);
    });
}

// Disables
function toggleModal(modal){
    // Make sure a modal was passed
    if(modal.className.indexOf("_modal") == -1){
        return;
    }

    console.debug("Toggling Modal");

    if(!modal.hasAttribute("data-enabled") && !modal.hasAttribute("data-animating")){ // Show modal
        modal_animations[modal.getAttribute("data-animation-id") + "-show"].run();
    }else if(modal.hasAttribute("data-enabled")){ // hide modal
        modal_animations[modal.getAttribute("data-animation-id") + "-hide"].run();
    }
}

$(function(){
    $("#chat-form").submit(function(){
        var message = $("#chat-message").val();
    });

    var connected = function(){
        socket.subscribe("group-" + window.group_id);
        socket.send({
            group: window.group_id,
            action: 'start',
        });
    };

    var disconnected;
    var messaged;

    var start = function(){
        socket = new io.Socket();
        socket.connect();
        socket.on("connect", connected);
        socket.on("disconnect", disconnected);
        socket.on("message", messaged);
    }

    //start();
});
