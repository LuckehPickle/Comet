/**
 * @license Copyright (c) 2016 - Sean Bailey - All Rights Reserved
 * Looking for source code? Check it out here: https://github.com/LuckehPickle/Comet
 */

/**
 * Copyright (c) 2016 - Sean Bailey - All Rights Reserved
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

var converter;

/**
 * In development code. Its not perfect.
 */
$(document).on("ready", function() {
    converter = new showdown.Converter({
        simplifiedAutoLink: true,
        strikethrough: true,
        tables: true,
    });

    $(".tab").on("click", function() {
        if ($(this).is("[active]"))
            return;

        var attr = $(this).attr("data-tab");
        var tabBodies = $("[data-tab]:not(.tab)");
        var tabBody = $("[data-tab=" + attr + "]:not(.tab)");

        tabBodies.hide();
        tabBody.show();
        $(".tab").removeAttr("active");
        $(this).attr("active", "");

        if (attr == "2") {
            var content = $(".editor > textarea").val();
            $(".output").empty();
            $(".output").append(converter.makeHtml(content));
        }
    });
});
