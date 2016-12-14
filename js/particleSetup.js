(function() {
    'use strict';

    window.R = {};

    R.particleSetup = function(model) {
        R.model = model;

        loadAllShaderPrograms();
        initParticleData();
        initRigidBodyData();
        initRender();
        setupBuffers('A');
        setupBuffers('RK2_A');
        setupBuffers('RK2_B');
        setupBuffers('B');

        generateGrid('A');
        generateGrid('B');

        generateParticlesFromMesh("duck", 64)
    };

    var initParticleData = function() {
        var exp = 12;
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

        var particleMass = 1.0;
        for (var i = 0; i < R.numParticles; i++) {
            positions.push( Math.random() * 0.5 - 0.25,
                            Math.random() * 2.0 + 1.0,
                            Math.random() * 0.5 - 0.25,
                particleMass);
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

        R.particleSize = .1;
        R.bound = 2.;
        R.gridBound = R.bound * 1.1;
    }

    var initRigidBodyData = function() {
        R.rigidBodiesEnabled = false;
        var exp = 2;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        var particlesPerBody = 9;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };
        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push( Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                4 + i/2.0,
                Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                particlesPerBody * i);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyOrientations = orientations;

        // Linear and angular velocities
        var linearMomenta = Array(R.numBodies * 4).fill(0.0);
        R.linearMomenta = linearMomenta;
        var angularMomenta = Array(R.numBodies * 4).fill(0.0);
        R.angularMomenta = angularMomenta;

        // Relative particle positions (cube for now) and rigid body index
        var relativePositions = Array(R.numParticles * 4).fill(-1.0);
        var bodyMass = 0.3;
        if (R.rigidBodiesEnabled) {
            var index = 0;
            for (i = 0; i < R.numBodies; i++) {
                for (var x = 0; x < 2; x++) {
                    for (var y = 0; y < 2; y++) {
                        for (var z = 0; z < 2; z++) {
                            relativePositions[index] = x * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 1] = y * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 2] = z * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = bodyMass;
                            linearMomenta[index + 3] = particlesPerBody;
                            index += 4;
                        }
                    }
                }
                relativePositions[index] = 0;
                relativePositions[index + 1] = 0;
                relativePositions[index + 2] = 0;
                relativePositions[index + 3] = i;
                R.particlePositions[index + 3] = bodyMass;
                linearMomenta[index + 3] = particlesPerBody;
                index += 4;
            }
        }
        R.relativePositions = relativePositions;
    }

    var initRender = function() {
        gl.clearColor(0.5, 0.5, 0.5, 0.9);
        gl.enable(gl.DEPTH_TEST);
    }

    var setupBuffers = function(id) {
        R["fbo" + id] = gl.createFramebuffer();

        // Particle positions
        R["particlePosTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.particleSideLength, R.particleSideLength, R.particlePositions);

        // Particle velocities
        R["particleVelTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.particleSideLength, R.particleSideLength, R.particleVelocities);

        // Particle forces
        R["forceTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.particleSideLength, R.particleSideLength, R.forces);

        // Can't attach different dimension texture to the bodyFBO
        R["relativePosTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.particleSideLength, R.particleSideLength, R.relativePositions);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R["fbo" + id]);
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL]);

        if (R.rigidBodiesEnabled) {
            R["bodyFBO" + id] = gl.createFramebuffer();
            // Rigid Body Data
            R["bodyPosTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyPositions);
            console.log(R.bodyPositions);

            R["bodyRotTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyOrientations);

            R["linearMomentumTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.bodySideLength, R.bodySideLength, R.linearMomenta);

            R["angularMomentumTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.bodySideLength, R.bodySideLength, R.angularMomenta);

            abortIfFramebufferIncomplete(R["bodyFBO" + id]);
            gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT4_WEBGL]);
        }
    }

    var generateGrid = function(id) {
        R["gridFBO" + id] = gl.createFramebuffer();
        R.gridInfo = {};

        R.gridInfo.gridCellSize = R.particleSize;
        R.gridInfo.numCellsPerSide = Math.ceil((R.gridBound) * 2 / R.gridInfo.gridCellSize);

        // gridTexTileDimensions are the dimensions of the flattened out grid texture in terms of individual
        // 2-dimensional "slices." This is necessary for recreating the 3D texture in the shaders
        R.gridInfo.gridTexTileDimensions = Math.ceil(Math.sqrt(R.gridInfo.numCellsPerSide));
        R.gridInfo.gridTexWidth = R.gridInfo.gridTexTileDimensions * R.gridInfo.numCellsPerSide;
        
        // Initialize grid values to 0
        var gridVals = [];
        for (var i = 0; i < Math.pow(R.gridInfo.gridTexWidth, 2.); i++) {
           gridVals.push(0.0, 0.0, 0.0, 0.0);
        }

        R["gridTex" + id] = createAndBindTexture(R["gridFBO" + id],
           gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth, gridVals);

        // Add depth and stencil attachments    
        createAndBindDepthStencilBuffer(R["gridFBO" + id], R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth);

        abortIfFramebufferIncomplete(R["gridFBO" + id]);
    }

    var generateParticlesFromMesh = function(id, gridSideLength) {
        // HACKY!
        if (!R.progParticleFromMeshDepth || !R.progDebug) {
            window.requestAnimationFrame(function() {
                generateParticlesFromMesh(id, gridSideLength);
            });
            return;
        }
        debugger;
        R["meshParticlesFBO" + id] = gl.createFramebuffer();
        var gridTexSideLength = Math.ceil(Math.sqrt(Math.pow(gridSideLength, 3)));

        var localR = {};
        localR["meshParticlesTex" + id + "0"] = createAndBindTexture(R["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, gridSideLength, gridSideLength, null);
        localR["meshParticlesTex" + id + "1"] = createAndBindTexture(R["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, gridSideLength, gridSideLength, null);
        R["meshParticlesTex" + id] = createAndBindTexture(R["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, gridSideLength, gridSideLength, null);

        createAndBindDepthStencilBuffer(R["meshParticlesFBO" + id], gridSideLength, gridSideLength);
        
        abortIfFramebufferIncomplete(R["bodyFBO" + id]);
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL]);

        // Draw model 2x on two textures. Once with near, once with far
        gl.useProgram(R.progParticleFromMeshDepth.prog);
        gl.viewport(0, 0, gridSideLength, gridSideLength);
        gl.bindFramebuffer(gl.FRAMEBUFFER, R["meshParticlesFBO" + id]);
        //gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        
        var orthoMat = new THREE.Matrix4();
        var width = 3;
        var height = 3;
        var camera = new THREE.OrthographicCamera( width / -2, width / 2, 
            height / 2, height / -2, 1, 100);
        camera.position.set(0, 0, -15);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        orthoMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

        gl.uniformMatrix4fv(R.progParticleFromMeshDepth.u_cameraMat, false, orthoMat.elements);
        gl.uniform1i(R.progParticleFromMeshDepth.u_texID, 0);
        
        readyModelForDraw(R.progParticleFromMeshDepth, R.model);
        gl.drawElements(R.model.gltf.mode, R.model.gltf.indices.length, R.model.gltf.indicesComponentType, 0);
        
        var prog = R.progDebug;
        gl.useProgram(prog.prog);
        gl.viewport(0, 0, 128 * 5, 128 * 2);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.activeTexture(gl['TEXTURE0']);
        gl.bindTexture(gl.TEXTURE_2D, localR["meshParticlesTex" + id + "0"]);
        gl.uniform1i(prog.u_depth0, 0);

        renderFullScreenQuad(R.progDebug);
        // gl.uniform1i(progParticleFromMesh.u_texID, 1);
        // // Feed those textures (and array of uniform grid) into vertex shader

        // Output 1s or 0s into 3D texture
    }

    // TEMPORARY
    var renderFullScreenQuad = (function() {
		var positions = new Float32Array([
			-1.0, -1.0,
			1.0, -1.0,
			-1.0,  1.0,
			1.0,  1.0
		]);

		var vbo = null;

        var init = function() {
			// Create a new buffer with gl.createBuffer, and save it as vbo.
			vbo = gl.createBuffer();

			// Bind the VBO as the gl.ARRAY_BUFFER
			gl.bindBuffer(gl.ARRAY_BUFFER,vbo);

			// Upload the positions array to the currently-bound array buffer
			// using gl.bufferData in static draw mode.
			gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
		};

		return function(prog) {
			if (!vbo) {
				// If the vbo hasn't been initialized, initialize it.
				init();
			}

			// Bind the program to use to draw the quad
			gl.useProgram(prog.prog);

			// Bind the position array to the vbo
			gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
			gl.enableVertexAttribArray(prog.a_position);
			gl.vertexAttribPointer(prog.a_position, 2, gl.FLOAT, gl.FALSE, 0, 0);

			// Use gl.drawArrays (or gl.drawElements) to draw your quad.
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

			// Unbind the array buffer.
			gl.bindBuffer(gl.ARRAY_BUFFER, null);
		};
	})();
    ///////////////

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
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.u_bound = gl.getUniformLocation(prog, 'u_bound');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Grid uniforms
                p.u_gridTex = gl.getUniformLocation(prog, 'u_gridTex');
                p.u_gridSideLength = gl.getUniformLocation(prog, 'u_gridSideLength');
                p.u_gridNumCellsPerSide = gl.getUniformLocation(prog, 'u_gridNumCellsPerSide');
                p.u_gridTexSize = gl.getUniformLocation(prog, 'u_gridTexSize');
                p.u_gridTexTileDimensions = gl.getUniformLocation(prog, 'u_gridTexTileDimensions');
                p.u_gridCellSize = gl.getUniformLocation(prog, 'u_gridCellSize');
				
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
                p.u_cameraPos = gl.getUniformLocation(prog, 'u_cameraPos');
                p.u_fovy = gl.getUniformLocation(prog, 'u_fovy');
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_side');
                p.u_bodySideLength = gl.getUniformLocation(prog, 'u_bodySide');
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
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progEuler = p;
            }
        );

        // Load body update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/bodyEuler.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progBodyEuler = p;
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
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progRK2 = p;
            }
        );

        // Load body update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/bodyRK2.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_linearMomentumTex1 = gl.getUniformLocation(prog, 'u_linearMomentumTex1');
                p.u_forceTex1 = gl.getUniformLocation(prog, 'u_forceTex1');
                p.u_linearMomentumTex2 = gl.getUniformLocation(prog, 'u_linearMomentumTex2');
                p.u_forceTex2 = gl.getUniformLocation(prog, 'u_forceTex2');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progBodyRK2 = p;
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
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_depth0 = gl.getUniformLocation(prog, 'u_depth0');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progDebug = p;
            }
        );

        // Load rigid body particle setup shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/setup.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_bodySide = gl.getUniformLocation(prog, 'u_bodySide');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progSetup = p;
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
                p.u_gridSideLength = gl.getUniformLocation(prog, 'u_gridSideLength');
                p.u_gridNumCellsPerSide = gl.getUniformLocation(prog, 'u_gridNumCellsPerSide');
                p.u_gridTexSize = gl.getUniformLocation(prog, 'u_gridTexSize');
                p.u_gridTexTileDimensions = gl.getUniformLocation(prog, 'u_gridTexTileDimensions'); 
                p.u_gridCellSize = gl.getUniformLocation(prog, 'u_gridCellSize');
                p.a_idx = gl.getAttribLocation(prog, 'a_idx');

                // Save the object into this variable for access later
                R.progGrid = p;
            }
        );

         // Load particle generation shader 
        loadShaderProgram(gl, 'glsl/object/particleFromMesh.vert.glsl', 'glsl/object/particleFromMesh.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_texID = gl.getUniformLocation(prog, 'u_texID');
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.a_position = gl.getUniformLocation(prog, 'a_position');                
                // Save the object into this variable for access later
                R.progParticleFromMeshDepth = p;
            }
        );
    };

	var createAndBindTexture = function(fbo, attachment, sideLengthx, sideLengthy, data) {
		var tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);

        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLengthx, sideLengthy, 0, gl.RGBA, gl.FLOAT, new Float32Array(data));
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLengthx, sideLengthy, 0, gl.RGBA, gl.FLOAT, null);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        // These are necessary for non-pot textures https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;

	}

    var createAndBindDepthStencilBuffer = function(fbo, sideLengthx, sideLengthy) {
        var depthStencil = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencil);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, sideLengthx, sideLengthy);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencil);

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
})();
