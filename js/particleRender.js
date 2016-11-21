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
		renderParticles(state, R.progParticle);
    };
    
	
	var renderParticles = function(state, prog) {
		// Use the program
		gl.useProgram(prog.prog);
		
		var m = state.cameraMat.elements;
		gl.uniformMatrix4fv(prog.u_cameraMat, false, m);

		gl.bindBuffer(gl.ARRAY_BUFFER, R.uvCoords);
		gl.enableVertexAttribArray(prog.a_uv);
		gl.vertexAttribPointer(prog.a_uv, 2, gl.FLOAT, gl.FALSE, 0, 0);

		// Bind position texture
		bindTextures(prog);
		
		gl.clearColor(0.5, 0.5, 0.5, 0.9);
		gl.enable(gl.DEPTH_TEST);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.drawArrays(gl.POINTS, 0, 64);
	}
	
	var bindTextures = function(prog) {
		gl.useProgram(prog.prog);
		gl.activeTexture(gl['TEXTURE0']);
        gl.bindTexture(gl.TEXTURE_2D, R.positionTex);
        gl.uniform1i(prog.u_posTex, 0);
	}

})();
