(function() {
    'use strict';

    window.R = {};
	
    R.particleSetup = function() {
        loadAllShaderPrograms();

        // Create the FBO
        R.posFBO = gl.createFramebuffer();

		// Create and bind a texture to store the particle positions
        R.positionTex = createAndBindPositionTexture(R.posFBO, gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.positions);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R.posFBO);

        // Tell the WEBGL_draw_buffers extension which FBO attachments are
        // being used. (This extension allows for multiple render targets.)
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL]);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };


    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {
		
		// Load collision fragment shader
		// Collision fragment shader reads from position and velocity textures
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
			});		
		
    };

	var createAndBindPositionTexture = function(fbo, attachment, data) {
		var tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 8, 0, gl.RGBA, gl.FLOAT, new Float32Array(data));
        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;

	}
})();
