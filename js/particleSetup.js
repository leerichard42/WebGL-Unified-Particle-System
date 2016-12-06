(function() {
    'use strict';

    window.R = {};

    R.particleSetup = function() {
        loadAllShaderPrograms();
        initParticleData();
        initRigidBodyData();
        initRender();
        setupBuffers('A');
        setupBuffers('RK2_A');
        setupBuffers('RK2_B');
        setupBuffers('B');
    };

    var initParticleData = function() {
        var exp = 2;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp); 
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 1,
            max: 2
        };
        for (var i = 0; i < R.numParticles; i++) {
            positions.push( Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0/* + gridBounds.min*/,
                            Math.random() * (gridBounds.max - gridBounds.min) + gridBounds.min,
                            //gridBounds.min + i / 100.0,
                            Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0/* + gridBounds.min*/, 1.0);
        }
        R.particlePositions = positions;

        // Initialize particle velocities
        var velocities = [];
        var velBounds = {
            min: -1.0,
            max: 1.0
        };
        //velocities.push(1.0, 0.0, 0.0, 1.0);
        for (var i = 0; i < R.numParticles; i++) {
            velocities.push(Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                            Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                            Math.random() * (velBounds.max - velBounds.min) + velBounds.min, 1.0);
        }
        R.particleVelocities = velocities;

        // Initialize particle forces
        var forces = [];
        for (var i = 0; i < R.numParticles; i++) {
            forces.push(0.0, 0.0, 0.0, 1.0);
        }
        R.forces = forces;

        // Initialize particle indices
        var indices = [];
        for (var i = 0; i < R.numParticles; i++) {
            indices[i] = i;
        }
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        R.indices = indexBuffer;

        R.timeStep = 0.01;
        R.particleSize = 0.15;
        R.bound = .5;
    }

    var initRigidBodyData = function() {
        var exp = 0;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = Math.pow(2, exp);
        R.bodySideLength = Math.sqrt(R.numBodies);

        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push( 0.0, i, 0.0, 1.0);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 1.0, 0.0);
        }
        R.bodyOrientations = orientations;

        // Relative particle positions (cube for now)
        var relativePositions = Array(R.numParticles * 4).fill(0.0);
        //for (i = 0; i < R.numBodies; i++) {
        //    for (var x = 0; x < 2; x++) {
        //        for (var y = 0; y < 2; y++) {
        //            for (var z = 0; z < 2; z++) {
        //                relativePositions[4*i] = x * R.particleSize - R.particleSize / 2.0;
        //                relativePositions[4*i+1] = y * R.particleSize - R.particleSize / 2.0;
        //                relativePositions[4*i+2] = z * R.particleSize - R.particleSize / 2.0;
        //                relativePositions[4*i+3] = 1.0;
        //            }
        //        }
        //    }
        //}
        R.relativePositions = relativePositions;

        // Linear and angular velocities
        var linearVelocities = Array(R.numBodies * 4).fill(0.0);
        R.linearVelocities = linearVelocities;
        var angularVelocities = Array(R.numBodies * 4).fill(0.0);
        R.angularVelocities = angularVelocities;

        //Particle to rigid body ids
    }

    var initRender = function() {
        gl.clearColor(0.5, 0.5, 0.5, 0.9);
        gl.enable(gl.DEPTH_TEST);
    }

    var setupBuffers = function(id) {
        R["fbo" + id] = gl.createFramebuffer();

        // Particle positions
        R["particlePosTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.particleSideLength, R.particlePositions);

        // Particle velocities
        R["particleVelTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.particleSideLength, R.particleVelocities);

        // Particle forces
        R["forceTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.particleSideLength, R.forces);

        R["bodyFBO" + id] = gl.createFramebuffer();
        // Rigid Body Data
        R["bodyPosTex" + id] = createAndBindTexture(R["bodyFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.bodySideLength, R.bodyPositions);

        R["bodyRotTex" + id] = createAndBindTexture(R["bodyFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.bodySideLength, R.bodyOrientations);

        R["linearVelTex" + id] = createAndBindTexture(R["bodyFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.bodySideLength, R.linearVelocities);

        R["angularVelTex" + id] = createAndBindTexture(R["bodyFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.bodySideLength, R.angularVelocities);

        //R["relativePosTex" + id] = createAndBindTexture(R["bodyFBO" + id],
        //    gl_draw_buffers.COLOR_ATTACHMENT4_WEBGL, R.particleSideLength, R.relativePositions);

        //// Calculate gridTex size
        //var numCells = Math.ceil(R.bound * 2 / R.particleSize);
        //R.gridTexWidth = Math.ceil(Math.sqrt(numCells) * numCells);
        //// Find next highest power of two
        //R.gridTexPotWidth = Math.pow(2, Math.ceil(Math.log(R.gridTexWidth)/Math.log(2)));
        //R.gridDimension = numCells;
        //
        //// Initialize grid values to 0
        //var gridVals = [];
        //for (var i = 0; i < Math.pow(R.gridTexPotWidth, 2.); i++) {
        //    gridVals.push(0.0, 0.0, 0.0, 1.0);
        //}
        //
        //R["gridTex" + id] = createAndBindTexture(R["fbo" + id],
        //    gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.gridTexPotWidth, gridVals);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R["fbo" + id]);
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL]);

        abortIfFramebufferIncomplete(R["bodyFBO" + id]);
        //gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
        //    gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
        //    gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
        //    gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL,
        //    gl_draw_buffers.COLOR_ATTACHMENT4_WEBGL]);
    }

    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {

		// Load collision fragment shader
		loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/forces.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };

				// Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.u_bound = gl.getUniformLocation(prog, 'u_bound');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

				// Save the object into this variable for access later
				R.progPhysics = p;
			}
        );

        // Load particle rendering shader
		loadShaderProgram(gl, 'glsl/particle/particle.vert.glsl', 'glsl/particle/particle.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };

				// Retrieve the uniform and attribute locations
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_side');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_nearPlaneHeight = gl.getUniformLocation(prog, 'u_nearPlaneHeight');
                p.a_idx  = gl.getAttribLocation(prog, 'a_idx');

				// Save the object into this variable for access later
				R.progParticle = p;
			}
        );

        // Load particle update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/euler.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progEuler = p;
            }
        );

        // Load particle update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/rk2.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex1 = gl.getUniformLocation(prog, 'u_velTex1');
                p.u_forceTex1 = gl.getUniformLocation(prog, 'u_forceTex1');
                p.u_velTex2 = gl.getUniformLocation(prog, 'u_velTex2');
                p.u_forceTex2 = gl.getUniformLocation(prog, 'u_forceTex2');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progRK2 = p;
            }
        );

        // Load debug shader for viewing textures
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/debug.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_gridTex = gl.getUniformLocation(prog, 'u_gridTex');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progDebug = p;
            }
        );

        // Load ambient shader for viewing models
        loadShaderProgram(gl, 'glsl/object/ambient.vert.glsl', 'glsl/object/ambient.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');
                p.a_normal = gl.getAttribLocation(prog, 'a_normal');
                p.a_uv = gl.getAttribLocation(prog, 'a_uv');
                // Save the object into this variable for access later
                R.progAmbient = p;
            }
        );

        // Load ambient shader for grid generation
        loadShaderProgram(gl, 'glsl/grid.vert.glsl', 'glsl/grid.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_posTexSize = gl.getUniformLocation(prog, 'u_posTexSize');
                p.u_gridSize = gl.getUniformLocation(prog, 'u_gridSize');
                p.u_gridTexSize = gl.getUniformLocation(prog, 'u_texSize');
                p.u_gridTexInnerLength = gl.getUniformLocation(prog, 'u_gridTexInnerLength'); // Should probably be renamed
                p.u_particleDiameter = gl.getUniformLocation(prog, 'u_particleDiameter');
                p.a_idx = gl.getAttribLocation(prog, 'a_idx');

                // Save the object into this variable for access later
                R.progGrid = p;
            }
        );
    };

	var createAndBindTexture = function(fbo, attachment, sideLength, data) {
		var tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        // These are necessary for non-pot textures https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLength, sideLength, 0, gl.RGBA, gl.FLOAT, new Float32Array(data));
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLength, sideLength, 0, gl.RGBA, gl.FLOAT, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;

	}
})();
