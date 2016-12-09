(function() {
    'use strict';

    R.particleRender = function(state) {
		if (!R.progParticle ||
		!R.progEuler ||
		!R.progPhysics ||
		!R.progDebug ||
		!R.progAmbient ||
        !R.progSetup) {
			console.log('waiting for programs to load...');
			return;
		}

        // Ping-pong body state from B to A after computing the particle locations
        computeBodyParticles(state, R.progSetup, 'B', 'A');
        if (cfg.pingPong) {
            pingPongBody();
        }

        // RK2 Integration
        //pos in A, vel_1 in A
        //force_1 in rk2b, vel_2 in rk2a, force_2 in A

        //generateGrid(state, R.progGrid, 'A');

        calculateForces(state, R.progPhysics, 'A', 'RK2_B');
        updateEuler(state, 'A', 'RK2_B', 'RK2_A');
        calculateForces(state, R.progPhysics, 'RK2_A', 'A');
        updateParticlesRK2(state, R.progRK2, 'A', 'A', 'RK2_B', 'RK2_A', 'A', 'B');

        // Render the particles
        renderParticles(state, R.progParticle);

        //drawModels(state);

        drawDebug();

        if (cfg.pingPong) {
            pingPong();
        }
    };

    var computeBodyParticles = function(state, prog, source, target) {
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1f(prog.u_testAngle, R.testAngle);
        R.testAngle++;

        bindTextures(prog, [prog.u_bodyPosTex, prog.u_bodyRotTex, prog.u_relPosTex],
            [R["bodyPosTex" + source], R["bodyRotTex" + source], R["relativePosTex" + source]]);

        renderFullScreenQuad(prog);
    }

    var generateGrid = function(state, prog, target) {
        gl.useProgram(prog.prog);
        debugger;
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, R["gridFBO" + target]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // gl.viewport(0, 0, canvas.width, canvas.height);
        // Bind position texture
        bindTextures(prog, [prog.u_posTex], [R.particlePosTexB]);
        
        gl.uniform1i(prog.u_posTexSize, R.particleSideLength);
        gl.uniform1i(prog.u_gridSideLength, R.gridBound); // WARNING: R.bound + constant
        gl.uniform1i(prog.u_gridNumCellsPerSide, R.gridInfo.numCellsPerSide);
        gl.uniform1i(prog.u_gridTexSize, R.gridInfo.gridTexWidth);
        gl.uniform1i(prog.u_gridTexTileDimensions, R.gridInfo.gridTexTileDimensions);
        gl.uniform1f(prog.u_particleDiameter, R.particleSize);

        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);
        
        gl.drawArrays(gl.POINTS, 0, R.numParticles);
    }
    
    // Calculate forces on all the particles from collisions, gravity, and boundaries
    var calculateForces = function(state, prog, source, target) {
		gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_dt, R.timeStep);
        gl.uniform1f(prog.u_bound, R.bound);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_velTex], [R["particlePosTex" + source], R["particleVelTex" + source]]);

        renderFullScreenQuad(prog);
	}

    // Update the state of all particles (TODO: and rigid bodies) with
    // the computed forces and velocities using explicit euler
    var updateEuler = function(state, stateSource, forceSource, target) {
        var prog = R.progEuler;
		gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex, prog.u_relPosTex],
            [R["particlePosTex" + stateSource], R["particleVelTex" + stateSource],
                R["forceTex" + forceSource], R["relativePosTex" + stateSource]]);

        renderFullScreenQuad(prog);
	}

    var updateBodyEuler = function(state, stateSource, forceSource, target) {
        var prog = R.progBodyEuler;
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["bodyFBO" + target]);
        gl.viewport(0, 0, R.bodySideLength, R.bodySideLength);

        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex],
            [R["particlePosTex" + stateSource], R["particleVelTex" + stateSource],
                R["forceTex" + forceSource]]);

        renderFullScreenQuad(prog);
    }

    // RK2 integration
    var updateParticlesRK2 = function(state, prog, pos, vel_1, force_1, vel_2, force_2, target) {
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_velTex1, prog.u_forceTex1, prog.u_velTex2,
            prog.u_forceTex2, prog.u_relPosTex],
            [R["particlePosTex" + pos], R["particleVelTex" + vel_1], R["forceTex" + force_1],
                R["particleVelTex" + vel_2], R["forceTex" + force_2], R["relativePosTex" + pos]]);

        renderFullScreenQuad(prog);
    }

    var renderParticles = function(state, prog) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, canvas.width, canvas.height);

        // Use the program
        gl.useProgram(prog.prog);

        gl.uniformMatrix4fv(prog.u_cameraMat, false, state.cameraMat.elements);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
        gl.uniform1i(prog.u_bodySideLength, R.bodySideLength);
        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_nearPlaneHeight, R.nearPlaneHeight);

        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);

        // Bind position texture
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_relPosTex, prog.u_bodyPosTex],
            [R.particlePosTexA, R.particleVelTexA, R.relativePosTexA, R.bodyPosTexA]);

        gl.drawArrays(gl.POINTS, 0, R.numParticles);
    }

    var bindTextures = function(prog, location, tex) {
        //console.log(prog);
        //console.log(location);
        //console.log(tex);
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
        swap('particlePosTex');
        swap('particleVelTex');
        swap('forceTex');
        swap('relativePosTex');
        swap('fbo');
    }

    var pingPongBody = function() {
        swap('bodyFBO');
        swap('bodyPosTex');
        swap('bodyRotTex');
    }

    var drawModels = function(state) {
        for (var i = 0; i < state.models.length; i++) {
            var m = state.models[i];
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, canvas.width, canvas.height);

            gl.useProgram(R.progAmbient.prog);

            gl.uniformMatrix4fv(R.progAmbient.u_cameraMat, false, state.cameraMat.elements);
            bindTextures(R.progAmbient, [R.progAmbient.u_posTex], [R.particlePosTexA]);

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
            gl.uniform1i(R.progDebug.u_particleSideLength, R.particleSideLength);
            bindTextures(R.progDebug, [R.progDebug.u_posTex, R.progDebug.u_velTex, R.progDebug.u_forceTex, R.progDebug.u_gridTex],
                [R.particlePosTexA, R.particleVelTexA, R.forceTexA, R.gridTexA]);
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
