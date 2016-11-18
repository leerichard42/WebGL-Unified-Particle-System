var handle_load = [];

(function() {
    'use strict';

    window.onload = function() {
        for (var i = 0; i < handle_load.length; i++) {
            handle_load[i]();
        }
    };
})();
