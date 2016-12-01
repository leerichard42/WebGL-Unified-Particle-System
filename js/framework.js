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
            models: models,
			cameraMat: cameraMat
		});
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
            0.1,            // Near plane
            100             // Far plane
        );
        camera.position.set(-3, 3, -3);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.target.set(0.5, 0.5, 0.5);
        controls.rotateSpeed = 0.3;
        controls.zoomSpeed = 1.0;
        controls.panSpeed = 2.0;

        var glTFURL = 'models/duck.gltf';
        var glTFLoader = new MinimalGLTFLoader.glTFLoader(gl);
        glTFLoader.loadGLTF(glTFURL, function (glTF) {
            var curScene = glTF.scenes[glTF.defaultScene];

            var webGLTextures = {};

            // temp var
            var i,len;
            var primitiveOrderID;

            var mesh;
            var primitive;
            var vertexBuffer;
            var indicesBuffer;


            // textures setting
            var textureID = 0;
            var textureInfo;
            var samplerInfo;
            var target, format, internalFormat, type;   // texture info
            var magFilter, minFilter, wrapS, wrapT;
            var image;
            var texture;


            // temp for sponza
            var colorTextureName = 'texture_color'; // for sponza
            if (!glTF.json.textures[colorTextureName]) {
                colorTextureName = (Object.keys(glTF.json.textures))[0];
                console.log(colorTextureName);
            }
            var normalTextureName = 'texture_normal';

            // textures
            for (var tid in glTF.json.textures) {

                textureInfo = glTF.json.textures[tid];
                target = textureInfo.target || gl.TEXTURE_2D;
                format = textureInfo.format || gl.RGBA;
                internalFormat = textureInfo.format || gl.RGBA;
                type = textureInfo.type || gl.UNSIGNED_BYTE;

                image = glTF.images[textureInfo.source];

                texture = gl.createTexture();
                gl.activeTexture(gl.TEXTURE0 + textureID);
                gl.bindTexture(target, texture);

                switch(target) {
                    case 3553: // gl.TEXTURE_2D
                    gl.texImage2D(target, 0, internalFormat, format, type, image);
                    break;
                    // TODO for TA
                }

                // !! Sampler
                // raw WebGL 1, no sampler object, set magfilter, wrapS, etc
                samplerInfo = glTF.json.samplers[textureInfo.sampler];
                minFilter = samplerInfo.minFilter || gl.NEAREST_MIPMAP_LINEAR;
                magFilter = samplerInfo.magFilter || gl.LINEAR;
                wrapS = samplerInfo.wrapS || gl.REPEAT;
                wrapT = samplerInfo.wrapT || gl.REPEAT;
                gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magFilter);
                gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrapT);
                if (minFilter == gl.NEAREST_MIPMAP_NEAREST || 
                    minFilter == gl.NEAREST_MIPMAP_LINEAR || 
                    minFilter == gl.LINEAR_MIPMAP_NEAREST ||
                    minFilter == gl.LINEAR_MIPMAP_LINEAR ) {
                        gl.generateMipmap(target);
                }


                gl.bindTexture(target, null);

                webGLTextures[tid] = {
                    texture: texture,
                    target: target,
                    id: textureID
                };

                textureID++;
            }


            // vertex attributes
            for (var mid in curScene.meshes) {
                mesh = curScene.meshes[mid];

                for (i = 0, len = mesh.primitives.length; i < len; ++i) {
                    primitive = mesh.primitives[i];


                    vertexBuffer = gl.createBuffer();
                    indicesBuffer = gl.createBuffer();

                    // initialize buffer
                    var vertices = primitive.vertexBuffer;
                    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);

                    var indices = primitive.indices;
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);


                    var posInfo = primitive.attributes[primitive.technique.parameters['position'].semantic];
                    var norInfo = primitive.attributes[primitive.technique.parameters['normal'].semantic];
                    var uvInfo;
                    if (primitive.technique.parameters['texcoord_0']) {
                        uvInfo = primitive.attributes[primitive.technique.parameters['texcoord_0'].semantic];
                    } else if (primitive.technique.parameters['texcoord0']) {
                        uvInfo = primitive.attributes[primitive.technique.parameters['texcoord0'].semantic];
                    }
                    

                    models.push({
                        gltf: primitive,

                        idx: indicesBuffer,

                        attributes: vertexBuffer,
                        posInfo: {size: posInfo.size, type: posInfo.type, stride: posInfo.stride, offset: posInfo.offset},
                        norInfo: {size: norInfo.size, type: norInfo.type, stride: norInfo.stride, offset: norInfo.offset},
                        uvInfo: {size: uvInfo.size, type: uvInfo.type, stride: uvInfo.stride, offset: uvInfo.offset},

                        // specific textures temp test
                        colmap: webGLTextures[colorTextureName].texture, 
                        normap: webGLTextures[normalTextureName] ? webGLTextures[normalTextureName].texture : null
                    });

                }

            }


            
        });
        resize();

        gl.clearColor(0.5, 0.5, 0.5, 0.5);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
        R.particleSetup();

        requestAnimationFrame(update);
    };

    window.handle_load.push(init);
})();
