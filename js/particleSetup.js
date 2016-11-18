(function() {
    'use strict';

    window.R = {};
	
    R.particleSetup = function() {
        loadAllShaderPrograms();
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

})();
