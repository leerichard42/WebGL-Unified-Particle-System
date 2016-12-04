(function() {
    'use strict';

    R.particleRender = function(state) {
		if (!R.progParticle ||
		!R.progEuler ||
		!R.progPhysics ||
		!R.progDebug ||
		!R.progAmbient) {
			console.log('waiting for programs to load...');
			return;
		}

        // RK2 Integration
        //pos in A, vel_1 in A
        //force_1 in temp2, vel_2 in Temp1, force_2 in A

        generateGrid(state, R.progGrid, 'A');

        calculateForces(state, R.progPhysics, 'A', 'RK2_B');
		updateEuler(state, R.progEuler, 'A', 'RK2_B', 'RK2_A');
        calculateForces(state, R.progPhysics, 'RK2_A', 'A');
        updateRK2(state, R.progRK2, 'A', 'A', 'RK2_B', 'RK2_A', 'A', 'B');

        // Render the particles
        renderParticles(state, R.progParticle);

        drawModels(state);

        drawDebug();

        pingPong();
    };
    
    var generateGrid = function(state, prog, target) {

        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.viewport(0, 0, R.gridPotWidth, R.gridPotWidth);

        gl.uniform1i(prog.u_posTexSize, R.texSideLength);
        gl.uniform1i(prog.u_gridSize, R.gridDimension);
        gl.uniform1f(prog.u_num2DTex, R.gridTexWidth);
        gl.uniform1f(prog.u_particleDiameter, R.particleSize);

        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);
        
        // Bind position texture
        bindTextures(prog, [prog.u_posTex], [R.positionTexB]);
        
        gl.drawArrays(gl.POINTS, 0, R.numParticles);
    }
    
    // Calculate forces on all the particles from collisions, gravity, and boundaries
    var calculateForces = function(state, prog, source, target) {
		gl.useProgram(prog.prog);

        if (cfg.pingPong) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
            gl.viewport(0, 0, R.texSideLength, R.texSideLength);

			gl.uniform1i(prog.u_texSideLength, R.texSideLength);
            gl.uniform1f(prog.u_diameter, R.particleSize);
            gl.uniform1f(prog.u_dt, R.timeStep);
            gl.uniform1f(prog.u_bound, R.bound);

			// Program attributes and texture buffers need to be in
			// the same indices in the following arrays
            bindTextures(prog, [prog.u_posTex, prog.u_velTex], [R["positionTex" + source], R["velocityTex" + source]]);

			renderFullScreenQuad(prog);
        }
	}

    // Update the state of all particles with the computed forces and velocities using explicit euler
    var updateEuler = function(state, prog, stateSource, forceSource, target) {
		gl.useProgram(prog.prog);

        if (cfg.pingPong) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
            gl.viewport(0, 0, R.texSideLength, R.texSideLength);

			gl.uniform1i(prog.u_texSideLength, R.texSideLength);
            gl.uniform1f(prog.u_diameter, R.particleSize);
            gl.uniform1f(prog.u_dt, R.timeStep);

			// Program attributes and texture buffers need to be in
			// the same indices in the following arrays
            bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex],
                [R["positionTex" + stateSource], R["velocityTex" + stateSource], R["forceTex" + forceSource]]);

			renderFullScreenQuad(prog);
        }
	}

    // RK2 integration
    var updateRK2 = function(state, prog, pos, vel_1, force_1, vel_2, force_2, target) {
        gl.useProgram(prog.prog);

        if (cfg.pingPong) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
            gl.viewport(0, 0, R.texSideLength, R.texSideLength);

            gl.uniform1i(prog.u_texSideLength, R.texSideLength);
            gl.uniform1f(prog.u_dt, R.timeStep);

            // Program attributes and texture buffers need to be in
            // the same indices in the following arrays
            bindTextures(prog, [prog.u_posTex, prog.u_velTex1, prog.u_forceTex1, prog.u_velTex2, prog.u_forceTex2],
                [R["positionTex" + pos], R["velocityTex" + vel_1], R["forceTex" + force_1],
                    R["velocityTex" + vel_2], R["forceTex" + force_2]]);

            renderFullScreenQuad(prog);
        }
    }

    var renderParticles = function(state, prog) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        //gl.clearColor(0.5, 0.5, 0.5, 0.9);
        //gl.enable(gl.DEPTH_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, canvas.width, canvas.height);

        // Use the program
        gl.useProgram(prog.prog);

        var m = state.cameraMat.elements;
        gl.uniformMatrix4fv(prog.u_cameraMat, false, m);

        gl.uniform1i(prog.u_texSideLength, R.texSideLength);
        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_nearPlaneHeight, R.nearPlaneHeight);

        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);

        // Bind position texture
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex],
            [R.positionTexA, R.velocityTexA, R.forceTexTemp]);

        gl.drawArrays(gl.POINTS, 0, R.numParticles);
    }

    var bindTextures = function(prog, location, tex) {
		gl.useProgram(prog.prog);

		for (var i = 0; i < tex.length; i++) {
			gl.activeTexture(gl['TEXTURE' + i]);
        	gl.bindTexture(gl.TEXTURE_2D, tex[i]);
        	gl.uniform1i(location[i], i);
		}
	}

    var swap = function(property) {
        var temp = R[property + 'A'];
        R[property + 'A'] = R[property + 'B'];
        R[property + 'B'] = temp;
    }

    var pingPong = function() {
        swap('positionTex');
        swap('velocityTex');
        swap('forceTex');
        swap('fbo');
    }

    var drawModels = function(state) {
        for (var i = 0; i < state.models.length; i++) {
            var m = state.models[i];
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.useProgram(R.progAmbient.prog);

            gl.uniformMatrix4fv(R.progAmbient.u_cameraMat, false, state.cameraMat.elements);
            bindTextures(R.progAmbient, [R.progAmbient.u_posTex], [R.positionTexA]);

            readyModelForDraw(R.progAmbient, m);
            drawReadyModel(m);
        }
    }

    var drawDebug = function() {
        // Debug
        if (cfg.showTexture) {
            gl.useProgram(R.progDebug.prog);
            gl.viewport(0, 0, 128 * 4, 128);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.uniform1i(R.progDebug.u_texSideLength, R.texSideLength);
            bindTextures(R.progDebug, [R.progDebug.u_posTex, R.progDebug.u_velTex, R.progDebug.u_forceTex, R.progDebug.u_gridTex],
                [R.positionTexA, R.velocityTexA, R.forceTexA, R.gridTexA]);
            renderFullScreenQuad(R.progDebug);
        }
    }

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
    

})();
