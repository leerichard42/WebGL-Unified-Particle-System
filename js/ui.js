var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        this.pingPong = false;
        this.showTexture = false;
    };

    var init = function() {
        cfg = new Cfg();
        var gui = new dat.GUI();
        gui.add(cfg, 'pingPong');
        gui.add(cfg, 'showTexture');


    };

    window.handle_load.push(init);
})();
