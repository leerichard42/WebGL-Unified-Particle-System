var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        this.pingPong = true;
        this.debugTexture = false;
        this.scene = 1;
    };

    var init = function() {
        cfg = new Cfg();
        var gui = new dat.GUI();
        gui.add(cfg, 'debugTexture');

        var controller = gui.add(cfg, 'scene', {
            '0 - Ballpit':   0,
            '1 - Funnel':    1,
            '2 - Pile':      2,
            '3 - Push':      3,
            '4 - Duck':      4
        });
        controller.onChange(function(idx) {
            R.scene = idx;
            R.toReset = true;
        });

        var obj = {
            reset:function(foo){
                R.toReset = true;;
            }
        };
        gui.add(obj, 'reset');
    };

    window.handle_load.push(init);
})();
