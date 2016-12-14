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

        if (R.rigidBodiesEnabled) {
            // Ping-pong old body state from B to A after computing the particle locations
            computeBodyParticles(state, R.progSetup, 'B', 'B', 'A');
            if (cfg.pingPong) {
                pingPongBody('A', 'B');
            }
        }

        // RK2 Integration
        //pos in A, vel_1 in A
        //force_1 in rk2b, vel_2 in rk2a, force_2 in A


        if (cfg.pingPong) {
            updateGrid(state, R.progGrid, 'A', 'A');
            calculateForces(state, R.progPhysics, 'A', 'A', 'RK2_B');
            updateEuler(state, 'A', 'RK2_B', 'RK2_A');

            if (R.rigidBodiesEnabled) {
                //updateBodyEuler(state, 'A', 'RK2_C', 'B');

                //updateGrid(state, R.progGrid, 'RK2_A', 'RK2_A');
                //calculateForces(state, R.progPhysics, 'RK2_A', 'B', 'A');
                //updateParticlesRK2(state, R.progRK2, 'RK2_B', 'RK2_B', 'RK2_B', 'RK2_A', 'A', 'B');
                ////updateBodyRK2(state, R.progBodyRK2, 'A', 'A', 'RK2_B', 'RK2_A', 'A', 'B');


                //A has pp1, pv1, bp1, bv1 - do not write
                //rk2a has pp2, pv2, pf1, bp1, bv1
                //rk2b has pp1, pv1, pf1, bp1, bv1
                calculateBodyForces(state, 'A', 'RK2_B', 'RK2_C');
                //rk2a has pp2, pv2, pf1, bp1, bv1
                //rk2c has bp1, bv1, bf1
                updateBodyEuler(state, 'A', 'RK2_C', 'RK2_A');
                //rk2a has pp2, pv2, pf1, bp2, bv2, bf1 - do not write
                computeBodyParticles(state, R.progSetup, 'RK2_A', 'RK2_A', 'RK2_B');
                //rk2b has pp2b, pv2, pf1, bp2, bv2, bf1
                updateGrid(state, R.progGrid, 'RK2_B', 'RK2_B');
                calculateForces(state, R.progPhysics, 'RK2_B', 'RK2_B', 'RK2_C');
                //rk2c has pp2b, pv2, pf2, bp2, bv2, bf1
                updateParticlesRK2(state, R.progRK2, 'A', 'A', 'RK2_A', 'RK2_C', 'RK2_C', 'B');

            }
            else {
                updateGrid(state, R.progGrid, 'RK2_A', 'RK2_A');
                calculateForces(state, R.progPhysics, 'RK2_A', 'B', 'A');
                updateParticlesRK2(state, R.progRK2, 'RK2_B', 'RK2_B', 'RK2_B', 'RK2_A', 'A', 'B');
            }

        }

        //updateEuler(state, 'A', 'RK2_B', 'B');

        // Render the particles
        renderParticles(state, R.progParticle);

        //drawModels(state);

        drawDebug();

        //only ping pong the buffers if not using the rigid body setup shader since
        //the setup shader transfers the particle data from B to A
        if (!R.rigidBodiesEnabled && cfg.pingPong) {
            pingPong('A', 'B');
        }
    };

    var computeBodyParticles = function(state, prog, particleSource, bodySource, target) {
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.disable(gl.BLEND);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1i(prog.u_bodySide, R.bodySideLength);

        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex, prog.u_bodyPosTex,
            prog.u_bodyRotTex, prog.u_relPosTex,
            prog.u_linearMomentumTex, prog.u_angularMomentumTex],
            [R["particlePosTex" + particleSource], R["particleVelTex" + particleSource], R["forceTex" + particleSource],
                R["bodyPosTex" + bodySource], R["bodyRotTex" + bodySource],
                R["relativePosTex" + bodySource],
                R["linearMomentumTex" + bodySource], R["angularMomentumTex" + bodySource]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
    }

    var updateGrid = function(state, prog, source, target) {
        gl.useProgram(prog.prog);
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["gridFBO" + target]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.viewport(0, 0, R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth);

        // Bind position texture
        bindTextures(prog, [prog.u_posTex], [R["particlePosTex" + source]]);
        
        gl.uniform1i(prog.u_posTexSize, R.particleSideLength);
        gl.uniform1f(prog.u_gridSideLength, R.gridBound * 2.); // WARNING: R.bound + constant
        gl.uniform1i(prog.u_gridNumCellsPerSide, R.gridInfo.numCellsPerSide);
        gl.uniform1i(prog.u_gridTexSize, R.gridInfo.gridTexWidth);
        gl.uniform1i(prog.u_gridTexTileDimensions, R.gridInfo.gridTexTileDimensions);
        gl.uniform1f(prog.u_gridCellSize, R.gridInfo.gridCellSize);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);
        
        // 1 Pass
        gl.colorMask(true, false, false, false);
        gl.depthFunc(gl.LESS);
        gl.drawArrays(gl.POINTS, 0, R.numParticles);

        // Set stencil values
        // 4 passes to fit up to 4 particle indices per pixel
        gl.enable(gl.STENCIL_TEST);
        gl.depthFunc(gl.GREATER);
        gl.stencilFunc(gl.EQUAL, 0, 0xFF); 
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

        // 2 Pass
        gl.colorMask(false, true, false, false);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, R.numParticles);

        // 3 Pass
        gl.colorMask(false, false, true, false);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, R.numParticles);
        
        // 4 Pass
        gl.colorMask(false, false, false, true);
        gl.clear(gl.STENCIL_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, R.numParticles);        

        gl.disable(gl.STENCIL_TEST);
        gl.depthFunc(gl.LESS);
        gl.colorMask(true, true, true, true);
        gl.enable(gl.BLEND);
        gl.clearColor(.8, .8, .8, 1);

    }
    
    // Calculate forces on all the particles from collisions, gravity, and boundaries
    var calculateForces = function(state, prog, source, gridSource, target) {
		gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_dt, R.timeStep);
        gl.uniform1f(prog.u_bound, R.bound);

        // Fill in grid uniforms
        gl.uniform1f(prog.u_gridSideLength, R.gridBound * 2.); // WARNING: R.bound + constant
        gl.uniform1i(prog.u_gridNumCellsPerSide, R.gridInfo.numCellsPerSide);
        gl.uniform1i(prog.u_gridTexSize, R.gridInfo.gridTexWidth);
        gl.uniform1i(prog.u_gridTexTileDimensions, R.gridInfo.gridTexTileDimensions);
        gl.uniform1f(prog.u_gridCellSize, R.gridInfo.gridCellSize);
        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays

        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_relPosTex, prog.u_gridTex],
            [R["particlePosTex" + source], R["particleVelTex" + source], R["relativePosTex" + source], R["gridTex" + gridSource]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
    }

    // Update the state of all particles (TODO: and rigid bodies) with
    // the computed forces and velocities using explicit euler
    var updateEuler = function(state, stateSource, forceSource, target) {
        var prog = R.progEuler;
		gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.particleSideLength, R.particleSideLength);

        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex, prog.u_relPosTex,
            prog.u_linearMomentumTex, prog.u_angularMomentumTex],
            [R["particlePosTex" + stateSource], R["particleVelTex" + stateSource], R["forceTex" + forceSource],
                R["relativePosTex" + stateSource], R["linearMomentumTex" + stateSource], R["angularMomentumTex" + stateSource]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
    }

    var calculateBodyForces = function(state, stateSource, forceSource, target) {
        var prog = R.progBodyForces;
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["bodyFBO" + target]);
        gl.disable(gl.BLEND);
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.bodySideLength, R.bodySideLength);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_forceTex, prog.u_bodyPosTex,
                prog.u_bodyRotTex, prog.u_bodyForceTex, prog.u_bodyTorqueTex,
                prog.u_linearMomentumTex, prog.u_angularMomentumTex],
            [R["particlePosTex" + stateSource], R["forceTex" + forceSource], R["bodyPosTex" + stateSource],
                R["bodyRotTex" + stateSource], R["bodyForceTex" + forceSource], R["bodyTorqueTex" + forceSource],
                R["linearMomentumTex" + stateSource], R["angularMomentumTex" + stateSource]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
    }

    var updateBodyEuler = function(state, stateSource, forceSource, target) {
        var prog = R.progBodyEuler;
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["bodyFBO" + target]);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.bodySideLength, R.bodySideLength);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
        gl.uniform1f(prog.u_diameter, R.particleSize);
        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_bodyPosTex,
            prog.u_bodyRotTex, prog.u_bodyForceTex, prog.u_bodyTorqueTex,
            prog.u_linearMomentumTex, prog.u_angularMomentumTex],
            [R["particlePosTex" + stateSource],
                R["bodyPosTex" + stateSource], R["bodyRotTex" + stateSource], R["bodyForceTex" + forceSource],
                R["bodyTorqueTex" + forceSource], R["linearMomentumTex" + stateSource], R["angularMomentumTex" + stateSource]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
    }

    // RK2 integration
    var updateParticlesRK2 = function(state, prog, pos, vel_1, force_1, vel_2, force_2, target) {
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["fbo" + target]);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
        gl.enable(gl.BLEND);
    }

    var updateBodyRK2 = function(state, prog, pos, vel_1, force_1, vel_2, force_2, target) {
        gl.useProgram(prog.prog);

        gl.bindFramebuffer(gl.FRAMEBUFFER, R["bodyFBO" + target]);
        gl.disable(gl.BLEND);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, R.bodySideLength, R.bodySideLength);

        gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
        gl.uniform1f(prog.u_dt, R.timeStep);

        // Program attributes and texture buffers need to be in
        // the same indices in the following arrays
        bindTextures(prog, [prog.u_posTex, prog.u_bodyPosTex, prog.u_bodyRotTex,
                prog.u_forceTex1, prog.u_forceTex2,
                prog.u_torqueTex1, prog.u_torqueTex2,
                prog.u_linearMomentumTex1, prog.u_linearMomentumTex2,
            prog.u_angularMomentumTex1, prog.u_angularMomentumTex2],
            [R["particlePosTex" + pos], R["bodyPosTex" + pos], R["bodyRotTex" + pos],
                R["bodyForceTex" + force_1], R["bodyForceTex" + force_2],
                R["bodyTorqueTex" + force_1], R["bodyTorqueTex" + force_2],
                R["linearMomentumTex" + vel_1], R["linearMomentumTex" + vel_2],
                R["angularMomentumTex" + vel_1], R["angularMomentumTex" + vel_2]]);

        renderFullScreenQuad(prog);
        gl.enable(gl.BLEND);
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
        gl.uniform3f(prog.u_cameraPos, state.cameraPos.x, state.cameraPos.y, state.cameraPos.z);
        gl.uniform1f(prog.u_fovy, R.fovy);

        gl.bindBuffer(gl.ARRAY_BUFFER, R.indices);
        gl.enableVertexAttribArray(prog.a_idx);
        gl.vertexAttribPointer(prog.a_idx, 1, gl.FLOAT, gl.FALSE, 0, 0);

        // Bind position texture
        bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_relPosTex],
            [R.particlePosTexA, R.particleVelTexA, R.relativePosTexA]);

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

    var swap = function(property, a, b) {
        var temp = R[property + a];
        R[property + a] = R[property + b];
        R[property + b] = temp;
    }

    var pingPong = function(a, b) {
        swap('particlePosTex', a, b);
        swap('particleVelTex', a, b);
        swap('forceTex', a, b);
        swap('relativePosTex', a, b);
        swap('fbo', a, b);
    }

    var pingPongBody = function(a, b) {
        swap('bodyFBO', a, b);
        swap('bodyPosTex', a, b);
        swap('bodyRotTex', a, b);
        swap('bodyForceTex', a, b);
        swap('bodyTorqueTex', a, b);
        swap('linearMomentumTex', a, b);
        swap('angularMomentumTex', a, b);
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
            var prog = R.progDebug;
            gl.useProgram(prog.prog);
            gl.viewport(0, 0, 128 * 4, 128 * 2);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.uniform1i(prog.u_particleSideLength, R.particleSideLength);
            bindTextures(prog, [prog.u_posTex, prog.u_velTex, prog.u_forceTex, prog.u_gridTex,
                prog.u_bodyPosTex, prog.u_bodyRotTex, prog.u_linearMomentumTex,
                prog.u_angularMomentumTex,
                prog.u_relPosTex, prog.u_bodyForceTex],
                [R.particlePosTexA, R.particleVelTexA, R.forceTexRK2_B, R.gridTexA,
                    R.bodyPosTexA, R.bodyRotTexA, R.linearMomentumTexA, R.angularMomentumTexA,
                    R.relativePosTexA, R.bodyForceTexRK2_C]);
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
