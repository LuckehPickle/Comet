/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * [Shared] PUSH-MESSAGE.JS - Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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
 * Close Push Message
 * Closes a puch message and sends a confirmation response to the server
 * if necessary. TODO Confirmation response. If it's here than pmessages
 * will last accross page loads.
 * @param {Element} source Element which fired the event.
 */
function closePushMessage(source){
    // Move up the DOM until you reach the container
    while(!source.hasClass("pmessage-container")){
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


    /**
     * Add Event Listeners
     */
    var addEventListeners = function(){
        $("[class^=\"pmessage-container\"]").on("click", function(){
            $(this).fadeIn(300);
        });

        $("[class^=\"pmessage-close\"], [class^=\"button-request-\"]").on("click", function(){
            closePushMessage($(this));
        });
    };


    addEventListeners();

});
