(function() {
    'use strict';

    window.R = {};
	
    R.particleSetup = function() {
        loadAllShaderPrograms();
		
		R.positionTex = createPositionTexture();
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
				p.a_position  = gl.getAttribLocation(prog, 'a_position');

				// Save the object into this variable for access later
				R.progParticle = p;
			});		
		
    };

	var createPositionTexture = function() {
		var posTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, posTex);
		
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
            gl.RGBA, gl.UNSIGNED_SHORT, null);
			
        gl.bindTexture(gl.TEXTURE_2D, null);

		// Not sure about this...
        /*gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTex, 0);*/

        return posTex;

	}
})();
