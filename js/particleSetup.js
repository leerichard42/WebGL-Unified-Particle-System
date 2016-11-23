(function() {
    'use strict';

    window.R = {};
	
    R.particleSetup = function() {
        loadAllShaderPrograms();

        // Position Texture A
        // Create the FBO
        R.fboA = gl.createFramebuffer();
        R.fboA.width = 8;
        R.fboA.height = 8;

        R.positionTexA = createAndBindTexture(R.fboA,
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.positions);

        R.velocityTexA = createAndBindTexture(R.fboA,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.velocities);
        
        R.forcesTexA = createAndBindTexture(R.fboA,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.forces);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R.fboA);

        // Position Texture B
        R.fboB = gl.createFramebuffer();
        R.fboB.width = 8;
        R.fboB.height = 8;

        R.positionTexB = createAndBindTexture(R.fboB,
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.positions);
        
        R.velocityTexB = createAndBindTexture(R.fboB,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.velocities);

        R.forcesTexB = createAndBindTexture(R.fboB,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.forces);

        abortIfFramebufferIncomplete(R.fboB);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {
		
		// Load collision fragment shader
		loadShaderProgram(gl, 'glsl/particle/physics.vert.glsl', 'glsl/particle/physics.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };

				// Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
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
                p.a_uv  = gl.getAttribLocation(prog, 'a_uv');

				// Save the object into this variable for access later
				R.progParticle = p;
			}
        );

        // Load particle update shader
        loadShaderProgram(gl, 'glsl/particle/update.vert.glsl', 'glsl/particle/update.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progUpdate = p;
            }
        );

    };

	var createAndBindTexture = function(fbo, attachment, data) {
		var tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.FLOAT, new Float32Array(data));
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fbo.width, fbo.height, 0, gl.RGBA, gl.FLOAT, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;

	}
})();
