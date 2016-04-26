/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * [Shared] BASE.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Powered by Django (https://www.djangoproject.com/) - Not endorsed by Django
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * TODO Migrate Socket handling to this script
 * TODO Migrate modal handling
 * TODO Migrate friend requests
 */


/**
 * Message Types
 * Enum for push message types. This essentially allows the creation of
 * push messages that are compatible with Django's messaging framework.
 * https://git.io/vwgcG (Django GitHub Repo)
 * @enum {number}
 */
var MessageTypes = {
    DEBUG: 10,
    INFO: 20,
    SUCCESS: 25,
    WARNING: 30,
    ERROR: 40,
}


/**
 * Print
 * Formats and outputs a string to the console.
 * @param {boolean} error Show as an error
 * @param {string} out Message to output
 */
function print(error, out){
    var date = new Date();
    var message = "[" + date.getHours() + ":" + date.getMinutes() + "] [Comet] " + out;
    if(error){
        console.error(message);
        return;
    }
    console.log(message);
}


/**
 * Create Push Message
 * Creates, displays and initialises a new push message.
 * @param {number} type Type of push message. Refer to MessageType enum.
 * @param {string} message Message to display on the push message.
 */
function createPushMessage(type, message){
    $(".push-messages").append(
        "<div class=\"push-message-container-" + type + "\" data-new>" +
            "<svg class=\"push-message-close-" + type + "\" viewBox=\"0 0 20 20\">" +
                "<path d=\"M0 3 L3 0 L10 7 L17 0 L20 3 L13 10 L20 17 L17 20 L10 13 L3 20 L0 17 L7 10 z\">" +
            "</svg>" +
            "<p class=\"push-message-content-" + type + "\">" + message + "</p>" +
        "</div>"
    );
    $("[class^=\"push-message-container\"][data-new]").fadeIn(300);
    $("[class^=\"push-message-container\"][data-new]").removeAttr("data-new");
    $("[class^=\"push-message-close\"]").on("click", function(){
        closePushMessage($(this));
    });
}


/**
 * Close Push Message
 * Closes a puch message and sends a confirmation response to the server
 * if necessary. TODO Confirmation response on close.
 * @param {Element} source Element which fired the event.
 */
function closePushMessage(source){
    // Move up the DOM until you reach the container
    while(!source.is("[class*=\"push-message-container\"]")){
        source = source.parent();
    }

    source.slideUp(300, function(){
        source.remove();
        print(false, "Push message closed.");
    });
}


/**
 * JQuery Document Ready function. The following code is run whenever the page
 * has finished loading and is ready to work with.
 */
$(function(){
    // Fade in any idle push messages
    $("div[class^=\"push-message-container\"]").fadeIn(300);

    /**
     * Add Event Listeners
     */
    var addEventListeners = function(){
        // Listens for click events on push message close buttons
        $("[class^=\"push-message-close\"], [class^=\"button-request-\"]").on("click", function(){
            closePushMessage($(this));
        });
    };

    addEventListeners();

});
