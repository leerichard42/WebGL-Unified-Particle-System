(function() {
    'use strict';

    R.particleRender = function(state) {
		if (!R.progParticle) {
			console.log('waiting for programs to load...');
			return;
		}
		
		// Collision
		// Bind collision shaders, bind position + vel textures -> write to force texture
		
		// Render
		// Bind render shaders, bind position texture -> vertex shader transforms particles to new positions
		
		// Update state
		// Bind update shaders, bind force texture -> write to velocity and position texture
		renderParticles(R.progParticle);
    };
    
	
	var renderParticles = function(prog) {
		// Use the program
		gl.useProgram(prog.prog);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, R.sphereModel.position);
		
        gl.enableVertexAttribArray(prog.a_position);
		
		// Populate a_position attribute
		gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		var m = state.cameraMat.elements;
		gl.uniformMatrix4fv(prog.u_cameraMat, false, m);
		
		// Bind textures
		bindTextures(prog);
		
		gl.clearColor(0.5, 0.5, 0.5, 0.9);
        
		gl.enable(gl.DEPTH_TEST);
        
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.drawArrays(gl.POINTS, 0, R.sphereModel.elemCount);
	}
	
	var bindTextures = function(prog) {
		// Use the program
		gl.useProgram(prog.prog);
		
		gl.activeTexture(gl['TEXTURE0']);
		
        gl.bindTexture(gl.TEXTURE_2D, R.positionTex);
		
        gl.uniform1i(prog.u_pos, 0);
	}

})();
