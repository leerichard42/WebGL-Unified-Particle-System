(function() {
    'use strict';

    R.particleRender = function(state) {
		if (!R.progParticle) {
			console.log('waiting for programs to load...');
			return;
		}
		
		// Render
		renderParticles(R.progParticle);
    };
    
	
	var renderParticles = function(prog) {
		// Use the program
		gl.useProgram(prog.prog);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, R.sphereModel.position);
		
        gl.enableVertexAttribArray(prog.a_position);
		
		// Populate a_position attribute
		gl.vertexAttribPointer(prog.a_position, 3, gl.FLOAT, gl.FALSE, 0, 0);
		
		gl.clearColor(0.0, 0.5, 0.5, 0.0);
        
		gl.enable(gl.DEPTH_TEST);
        
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.drawArrays(gl.POINTS, 0, 63);
	}

})();
