var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        this.pingPong = true;
        this.debugTexture = false;
    };

    var init = function() {
        cfg = new Cfg();
        var gui = new dat.GUI();
        gui.add(cfg, 'debugTexture');
        var obj = {
            reset:function(){
                R.toReset = true;;
            }
        };
        gui.add(obj,'reset');
    };

    window.handle_load.push(init);
})();
