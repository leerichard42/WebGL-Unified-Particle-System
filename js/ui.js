var cfg;

(function() {
    'use strict';

    var Cfg = function() {
        this.debugView = -1;
        this.enableScissor = false;
        this.debugScissor = false;
        this.toonShading = false;
        this.packNormals = false;
        this.motionBlur = false;
    };

    var init = function() {
        cfg = new Cfg();

        var gui = new dat.GUI();
        gui.add(cfg, 'debugView', {
            'None':             -1,
            '0 Depth':           0,
            '1 Position':        1,
            '2 Geometry normal': 2,
            '3 Color map':       3,
            '4 Normal map':      4,
            '5 Surface normal':  5
        });
        var scissor = gui.addFolder('Scissor Test');
        scissor.open();
        scissor.add(cfg, 'enableScissor');
        scissor.add(cfg, 'debugScissor');

        gui.add(cfg, 'toonShading');
        gui.add(cfg, 'packNormals');
        gui.add(cfg, 'motionBlur');


    };

    window.handle_load.push(init);
})();
