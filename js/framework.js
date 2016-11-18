var gl, gl_draw_buffers;
var width, height;

(function() {
    'use strict';

    var canvas, renderer, scene, camera, controls, stats;
    var models = [];

    var cameraMat = new THREE.Matrix4();

    var render = function() {
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        cameraMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        
		R.particleRender({
			cameraMat: cameraMat
		});
        // R.deferredRender({
        //     cameraMat: cameraMat,
        //     projMat: camera.projectionMatrix,
        //     viewMat: camera.matrixWorldInverse,
        //     cameraPos: camera.position,
        //     models: models
        // });

    };

    var update = function() {
        controls.update();
        stats.end();
        stats.begin();
        render();
        if (!aborted) {
            requestAnimationFrame(update);
        }
    };

    var resize = function() {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        render();
    };

    var initExtensions = function() {
        var extensions = gl.getSupportedExtensions();
        console.log(extensions);

        var reqd = [
            'OES_texture_float',
            'OES_texture_float_linear',
            'WEBGL_depth_texture',
            'WEBGL_draw_buffers'
        ];
        for (var i = 0; i < reqd.length; i++) {
            var e = reqd[i];
            if (extensions.indexOf(e) < 0) {
                abort('unable to load extension: ' + e);
            }
        }

        gl.getExtension('OES_texture_float');
        gl.getExtension('OES_texture_float_linear');
        gl.getExtension('WEBGL_depth_texture');

        gl_draw_buffers = gl.getExtension('WEBGL_draw_buffers');
        var maxdb = gl.getParameter(gl_draw_buffers.MAX_DRAW_BUFFERS_WEBGL);
        console.log('MAX_DRAW_BUFFERS_WEBGL: ' + maxdb);
    };

    var init = function() {
        var debugMode = false;

        canvas = document.getElementById('canvas');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            preserveDrawingBuffer: debugMode
        });
        gl = renderer.context;

        if (debugMode) {
            $('#debugmodewarning').css('display', 'block');
            var throwOnGLError = function(err, funcName, args) {
                abort(WebGLDebugUtils.glEnumToString(err) +
                    " was caused by call to: " + funcName);
            };
            gl = WebGLDebugUtils.makeDebugContext(gl, throwOnGLError);
        }

        initExtensions();

        stats = new Stats();
        stats.setMode(1); // 0: fps, 1: ms, 2: mb
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);

        scene = new THREE.Scene();

        width = canvas.width;
        height = canvas.height;
        camera = new THREE.PerspectiveCamera(
            45,             // Field of view
            width / height, // Aspect ratio
            1.0,            // Near plane
            100             // Far plane
        );
        camera.position.set(-15.5, 1, -1);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.target.set(0, 4, 0);
        controls.rotateSpeed = 0.3;
        controls.zoomSpeed = 1.0;
        controls.panSpeed = 2.0;

		var sph = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6));
        scene.add(sph);
        renderer.render(scene, camera);
		uploadModel(sph, function(m) {
			R.sphereModel = m;
		});

        var positions = [];
        for (var x = 0; x < 4; x++) {
            for (var y = 0; y < 4; y++) {
                for (var z = 0; z < 4; z++) {
                    positions.push(x, y, z);
                }
            }
        }

        var posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
        R.particles = posBuffer;

        resize();

        gl.clearColor(0.5, 0.5, 0.5, 0.5);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
        R.particleSetup();

        requestAnimationFrame(update);
    };

    var uploadModel = function(o, callback) {
        for (var i = -1; i < o.children.length; i++) {
            var c, g, idx;
            if (i < 0) {
                c = o;
                if (!c.geometry) {
                    continue;
                }
                g = c.geometry._bufferGeometry.attributes;
                idx = c.geometry._bufferGeometry.index;
            } else {
                c = o.children[i];
                g = c.geometry.attributes;
                idx = c.geometry.index;
            }

            var gposition = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, gposition);
            gl.bufferData(gl.ARRAY_BUFFER, g.position.array, gl.STATIC_DRAW);
            console.log(g.position.array);

            var gnormal;
            if (g.normal && g.normal.array) {
                gnormal = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, gnormal);
                gl.bufferData(gl.ARRAY_BUFFER, g.normal.array, gl.STATIC_DRAW);
            }

            var guv;
            if (g.uv && g.uv.array) {
                guv = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, guv);
                gl.bufferData(gl.ARRAY_BUFFER, g.uv.array, gl.STATIC_DRAW);
            }

            if (!idx) {
                idx = new Uint32Array(g.position.array.length / 3);
                for (var j = 0; j < idx.length; j++) {
                    idx[j] = j;
                }
            }

            var gidx = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gidx);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

            var m = {
                idx: gidx,
                elemCount: idx.length,
                position: gposition,
                normal: gnormal,
                uv: guv
            };

            if (callback) {
                callback(m);
            }
        }
    };

    window.handle_load.push(init);
})();
