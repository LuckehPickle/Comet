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
 TODO Redo modal handling
 TODO User search modal
*/

var modal_wrapper = document.querySelector(".modal-wrapper");
var modal_create = document.querySelector(".modal-create");
var createGroupTriggers = document.querySelectorAll(".create-group-trigger");
var easingPath = mojs.easing.path('M0,100 Q0,0 100,0');

var modal_animations = {};

modal_animations["create-show"] = new mojs.Tween({
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

modal_animations["create-hide"] = new mojs.Tween({
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

    if(!modal.hasAttribute("data-enabled") && !modal.hasAttribute("data-animating")){ // Show modal
        modal_animations[modal.getAttribute("data-animation-id") + "-show"].run();
    }else if(modal.hasAttribute("data-enabled")){ // hide modal
        modal_animations[modal.getAttribute("data-animation-id") + "-hide"].run();
    }
}


/* FRIENDS LIST & GROUPS LIST */
var tab_heads = document.querySelectorAll(".tab-head");
var tab_bodies = document.querySelectorAll(".tab-body");
var tab_footers = document.querySelectorAll(".tab-footer");

// Opens whichever tab-head is passed to it.
// TODO Animate changing tabs
function openTab(tab){
    for(var i = 0; i < tab_heads.length; i++){
        tab_heads[i].removeAttribute("active");
        tab_bodies[i].removeAttribute("active");
    }
    tab.setAttribute("active", "");
    document.querySelector(".tab-" + tab.getAttribute("data-tab")).setAttribute("active", "");
    document.cookie = "tab=" + tab.getAttribute("data-tab") + ";path=/messages";
}

// Iterate over each tab to add an event listener
for(var i = 0; i < tab_heads.length; i++){
    tab_heads[i].addEventListener("click", function(event){
        var target = event.target; //Get event target
        //Move up the heirarchy untill we reach the tab-head
        while(!target.hasAttribute("data-tab")){
            target = target.parentElement;
        }
        openTab(target);
    });
}

/* Search bar */
$(".tools-input-wrapper:not([active]) > i").on("click", function(){
    $(".tools-input-wrapper > input").focus();
});

$(".tools-input-wrapper:not([active]) > input").on("focus", function(){
    $(".tools-input-dropdown").hide();
    $(this).parent().attr("active", "");
    setTimeout(function(){
        $(".tools-input-dropdown").slideDown(200);
    }, 300);
});

$("html").on("click", function(event){
    if(!$(event.target).closest(".tools-input-wrapper").length && !$(event.target).is(".tools-input-wrapper")){
        $(".tools-input-wrapper").removeAttr("active");
        $(".tools-input-dropdown").hide();
    }
});

/* SOCKETIO */

$(function(){

    $("[data-url]").on("click", function(){
        window.location.href = $(this).attr("data-url");
    });

    $("#chat-form").submit(function(){
        var message = $("#chat-message").val();
    });

    var typing_timer;
    var done_typing_interval = 500;
    var $input = $(".tools-input-wrapper > input");

    $input.on("keyup", function(){
        clearTimeout(typing_timer);
        typing_timer = setTimeout(doneTyping, done_typing_interval);
    });

    $input.on("keydown", function(){
        clearTimeout(typing_timer);
    });

    function doneTyping(){
        requestQueryResponse($input.val());
    }

    var requestQueryResponse = function(query){
        if(query != "" && query != null && query.length >= 3){
            console.log("Searching for users named '" + query + "'");
            socket.send({action: "search", data: query, group_id: window.group_id});
        }
    }

    var handleQueryResponse = function(data){
        console.log("Response received.");
        var users = JSON.parse(data.users);
        updateSearchList(users);
    }

    var users_sec = document.querySelector(".dropdown-users");
    function updateSearchList(data){
        if(data.length == 0){ // No data returned (ie Empty result)
            clearSearchList();
            $(".dropdown-users").append("<p class=\"dropdown-no-results\">No results found.</p>");
            return;
        }

        clearSearchList();

        jQuery.each(data, function(){
            $(".dropdown-users").append(
            "<div class=\"dropdown-results-container\">" +
                "<div class=\"dropdown-result-image\"></div>" +
                "<section>" +
                    "<p class=\"dropdown-result-username\">" + this.fields.username + " (" + this.pk.substring(0, 8).toUpperCase() + ")</p>" +
                    "<p class=\"dropdown-result-tags\">Beta Tester</p>" +
                "</section>" +
                "<div class=\"dropdown-result-add\" data-user-id=" + this.pk + "><i class=\"material-icons\">add</i> Add<link class=\"rippleJS\"/></div>" +
                //"<link class=\"rippleJS\"/>" +
            "</div>");
        });

        $(".dropdown-result-add").on("click", function(){
            sendFriendRequest($(this).attr("data-user-id"));
        });
    }

    function clearSearchList(){
        for(var i = 0; i < users_sec.children.length; i++){ //Iterate over children
            if(users_sec.children[i].className == "dropdown-results-container" ||
            users_sec.children[i].className == "dropdown-no-results"){
                users_sec.children[i].remove(); // Remove stale results
            }
        }
    }

    var sendFriendRequest = function(user_id){
        socket.send({action: "friend_req", user_id: user_id, group_id: window.group_id});
        console.log("Friend request sent to user '" + user_id + "'");
    }

    var announceSystemMessage = function(data){

    }

    var connected = function(){
        if(window.group_id != null){
            socket.subscribe("group-" + window.group_id);
            console.log("Subscribing to group-" + window.group_id);
        }else if(window.user_url != null){
            socket.subscribe("user-" + window.user_url);
            console.log("Subscribing to user-" + window.user_url);
        }
    };

    var disconnected;

    // Handles general message from client to server
    var messaged = function(data){
        switch(data.action){
            case "search":
                handleQueryResponse(data);
                break;
            case "system_message":
                announceSystemMessage(data);
                break;
            case "message":
                addMessage(data);
                break;
        }
    };

    var start = function(){
        socket = new io.Socket();
        socket.connect();
        socket.on("connect", connected);
        socket.on("disconnect", disconnected);
        socket.on("message", messaged);
    }

    start();
});
