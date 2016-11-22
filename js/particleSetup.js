(function() {
    'use strict';

    window.R = {};
	
    R.particleSetup = function() {
        loadAllShaderPrograms();

        // Position Texture A
        // Create the FBO
        R.posFboA = gl.createFramebuffer();
        R.posFboA.width = 8;
        R.posFboA.height = 8;
		// Create and bind a texture to store the particle positions
        R.positionTexA = createAndBindTexture(R.posFboA,
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.positions);

        // Create and bind particle velocities
        R.velocityTexA = createAndBindTexture(R.posFboA,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.velocities);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R.posFboA);
        // Tell the WEBGL_draw_buffers extension which FBO attachments are
        // being used. (This extension allows for multiple render targets.)
        //gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);

        // Position Texture B
        R.posFboB = gl.createFramebuffer();
        R.posFboB.width = 8;
        R.posFboB.height = 8;
        //color attachment 0?
        R.positionTexB = createAndBindTexture(R.posFboB,
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.positions);
        
        R.velocityTexB = createAndBindTexture(R.posFboB,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.velocities);

        abortIfFramebufferIncomplete(R.posFboB);
        //gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {
		
		// Load collision fragment shader
		// Collision fragment shader reads from position and velocity textures

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
