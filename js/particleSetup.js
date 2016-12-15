(function() {
    'use strict';

    window.R = {};

    R.particleSetup = function() {
        loadAllShaderPrograms();
        R.scene = 1; // 0 = test, 1 = funnel, 2 = pile, 3 = push
        if (R.scene == 0) {
            initParticleData();
            initRigidBodyData();
        }
        else if (R.scene == 1) {
            initFunnelParticleData();
            initFunnelRigidBodyData();
        }
        else if (R.scene == 2) {
            initPileParticleData();
            initPileRigidBodyData();
        }
        else if (R.scene == 3) {
            initPushParticleData();
            initPushRigidBodyData();
        }
        initRender();
        setupBuffers('A');
        setupBuffers('RK2_A');
        setupBuffers('RK2_B');
        setupBuffers('RK2_C');
        setupBuffers('B');

        generateGrid('A');
        generateGrid('B');
    };

    // Test Init
    var initParticleData = function() {
        var exp = 10;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp); 
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 1,
            max: 2
        };

        var particleMass = 1.0;
        for (var i = 0; i < R.numParticles; i++) {
            positions.push( Math.random() * 0.2 - 0.1,
                            Math.random() * 1.0 + 0.0,
                            Math.random() * 0.2 - 0.1,
                particleMass);
        }
        R.particlePositions = positions;

        // Initialize particle velocities
        var velocities = [];
        var velBounds = {
            min: -0.2,
            max: 0.2
        };
        //velocities.push(1.0, 0.0, 0.0, 1.0);
        for (var i = 0; i < R.numParticles; i++) {
            velocities.push(Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                            Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                            Math.random() * (velBounds.max - velBounds.min) + velBounds.min, 1.0);
        }
        R.particleVelocities = velocities;

        // Initialize particle forces
        var forces = [];
        for (var i = 0; i < R.numParticles; i++) {
            forces.push(0.0, 0.0, 0.0, 1.0);
        }
        R.forces = forces;

        // Initialize particle indices
        var indices = [];
        for (var i = 0; i < R.numParticles; i++) {
            indices[i] = i;
        }
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        R.indices = indexBuffer;

        R.timeStep = 0.01;

        R.particleSize = .1;
        R.bound = 0.5;
        R.gridBound = R.bound * 1.1;

        R.k = 600.0;
        R.kT = 5.0;
        R.kBound = 2000.0;
        R.n = 5.0;
        R.nBound = 40.0;
        R.u = 0.4;
    }
    var initRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.bodyParticleMass = 0.3;
        var exp = 2;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        var particlesPerBody = 9;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };
        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push( Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                0.8 + i/4.0,
                Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                particlesPerBody * i);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyOrientations = orientations;

        // Body forces
        var forces = [];
        for (i = 0; i < R.numBodies; i++) {
            forces.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyForces = forces;

        // Body torques
        var torques = [];
        for (i = 0; i < R.numBodies; i++) {
            torques.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyTorques = torques;

        // Linear and angular velocities
        var linearMomenta = Array(R.numBodies * 4).fill(0.0);
        var angularMomenta = Array(R.numBodies * 4).fill(0.0);

        // Relative particle positions (cube for now) and rigid body index
        var relativePositions = Array(R.numParticles * 4).fill(-1.0);
        if (R.rigidBodiesEnabled) {
            var index = 0;
            for (var i = 0; i < R.numBodies; i++) {
                for (var x = 0; x < 2; x++) {
                    for (var y = 0; y < 2; y++) {
                        for (var z = 0; z < 2; z++) {
                            relativePositions[index] = x * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 1] = y * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 2] = z * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = R.bodyParticleMass;
                            index += 4;
                        }
                    }
                }
                relativePositions[index] = 0;
                relativePositions[index + 1] = 0;
                relativePositions[index + 2] = 0;
                relativePositions[index + 3] = i;
                R.particlePositions[index + 3] = R.bodyParticleMass;
                linearMomenta[4*i + 3] = particlesPerBody;

                index += 4;
            }
        }
        R.relativePositions = relativePositions;
        R.linearMomenta = linearMomenta;
        R.angularMomenta = angularMomenta;

        computeInertiaTensors();
    }

    // Funnel Init
    var initFunnelParticleData = function() {
        var exp = 12;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp);
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 1,
            max: 2
        };

        var particleMass = 1.5;
        for (var i = 0; i < R.numParticles; i++) {
            //positions.push(0, 0, 0, particleMass);
            //positions.push(- 0.2, 1.5 + (R.numParticles - i) * 0.05, -0.05, particleMass);
            positions.push(-10, -10, -10, particleMass);
        }
        R.particlePositions = positions;

        // Initialize particle velocities
        var velocities = [];
        var velBounds = {
            min: -0.2,
            max: 0.2
        };
        //velocities.push(1.0, 0.0, 0.0, 1.0);
        for (var i = 0; i < R.numParticles; i++) {
            velocities.push(Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min, 0.0);
        }
        R.particleVelocities = velocities;

        // Initialize particle forces
        var forces = [];
        for (var i = 0; i < R.numParticles; i++) {
            forces.push(0.0, 0.0, 0.0, 1.0);
        }
        R.forces = forces;

        // Initialize particle indices
        var indices = [];
        for (var i = 0; i < R.numParticles; i++) {
            indices[i] = i;
        }
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        R.indices = indexBuffer;

        R.timeStep = 0.01;

        R.particleSize = .05;
        R.bound = 1.1;
        R.gridBound = R.bound * 1.1;
        R.time = 0.0;

        R.k = 500.0;
        R.kT = 5.0;
        R.kBody = 2000.0;
        R.kBound = 10000.0;
        R.n = 5.0;
        R.nBody = 20.0;
        R.nBound = 200.0;
        R.u = 1.0;
    }
    var initFunnelRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.rigidBodiesStatic = true;
        R.bodyParticleMass = 0.3;
        var exp = 0;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        var particlesPerBody = 0;
        //var particlesPerBody = 9;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };
        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push(0.0,
                0.4,
                0.0,
                0.0);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyOrientations = orientations;

        // Body forces
        var forces = [];
        for (i = 0; i < R.numBodies; i++) {
            forces.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyForces = forces;

        // Body torques
        var torques = [];
        for (i = 0; i < R.numBodies; i++) {
            torques.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyTorques = torques;

        // Linear and angular velocities
        var linearMomenta = Array(R.numBodies * 4).fill(0.0);
        var angularMomenta = Array(R.numBodies * 4).fill(0.0);

        // Relative particle positions (cube for now) and rigid body index
        var relativePositions = Array(R.numParticles * 4).fill(-1.0);
        if (R.rigidBodiesEnabled) {
            var index = 0;
            var createCircle = function(y, rad, offset) {
                var numParticles = Math.floor(2.0 * Math.PI * rad / R.particleSize);
                var angle = 0.0174533 * 360.0 / numParticles;
                var angleOffset = offset ? angle * 0.5 : 0.0;
                //var angleOffset = 0.0;
                for (var i = 0; i < numParticles; i++) {
                    relativePositions[index] = Math.sin(i * angle + angleOffset) * rad;
                    relativePositions[index + 1] = y;
                    relativePositions[index + 2] = Math.cos(i * angle + angleOffset) * rad;
                    relativePositions[index + 3] = 0;
                    R.particlePositions[index + 3] = R.bodyParticleMass;
                    index += 4;
                }
                particlesPerBody += numParticles;
            }
            //createCircle(0.0, 0.2);
            for (var y = 0; y < 20; y++) {
                //if (y <= 4) {
                //    createCircle(y * R.particleSize, 1.5 * R.particleSize, false);
                //    createCircle(y * R.particleSize - 0.5 * R.particleSize, 2.0 * R.particleSize, false);
                //    createCircle(y * R.particleSize, 2.5 * R.particleSize, false);
                //    createCircle(y * R.particleSize, 1.5 * R.particleSize, true);
                //    createCircle(y * R.particleSize - 0.5 * R.particleSize, 2.0 * R.particleSize, true);
                //    createCircle(y * R.particleSize, 2.5 * R.particleSize, true);
                //}
                if (y >= 6) {
                    createCircle(y * R.particleSize,
                        1.2 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, false);
                    createCircle(y * R.particleSize + 0.5 * R.particleSize,
                        1.5 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, true);
                    createCircle(y * R.particleSize,
                        2.0 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, false);
                    createCircle(y * R.particleSize,
                        1.2 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, true);
                    createCircle(y * R.particleSize + 0.5 * R.particleSize,
                        1.5 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, false);
                    createCircle(y * R.particleSize,
                        2.0 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, true);
                }
            }
        }
        //console.log(relativePositions);

        R.relativePositions = relativePositions;
        linearMomenta[3] = particlesPerBody;
        R.linearMomenta = linearMomenta;
        R.angularMomenta = angularMomenta;

        computeInertiaTensors();
    }

    // Pile Init
    var initPileParticleData = function() {
        var exp = 10;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp);
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 1,
            max: 2
        };

        var particleMass = 1.0;
        for (var i = 0; i < R.numParticles; i++) {
            positions.push( Math.random() * 0.2 - 0.1,
                Math.random() * 1.0 + 0.0,
                Math.random() * 0.2 - 0.1,
                particleMass);
        }
        R.particlePositions = positions;

        // Initialize particle velocities
        var velocities = [];
        var velBounds = {
            min: -0.2,
            max: 0.2
        };
        //velocities.push(1.0, 0.0, 0.0, 1.0);
        for (var i = 0; i < R.numParticles; i++) {
            velocities.push(Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min, 1.0);
        }
        R.particleVelocities = velocities;

        // Initialize particle forces
        var forces = [];
        for (var i = 0; i < R.numParticles; i++) {
            forces.push(0.0, 0.0, 0.0, 1.0);
        }
        R.forces = forces;

        // Initialize particle indices
        var indices = [];
        for (var i = 0; i < R.numParticles; i++) {
            indices[i] = i;
        }
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        R.indices = indexBuffer;

        R.timeStep = 0.01;

        R.particleSize = .1;
        R.bound = 0.5;
        R.gridBound = R.bound * 1.1;

        R.k = 600.0;
        R.kT = 5.0;
        R.kBody = R.k * 1.1;
        R.kBound = 2000.0;
        R.n = 5.0;
        R.nBound = 40.0;
        R.u = 0.4;
    }
    var initPileRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.bodyParticleMass = 0.3;
        var exp = 2;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        var particlesPerBody = 9;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };
        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push( Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                0.8 + i/4.0,
                Math.random() * (gridBounds.max - gridBounds.min) - gridBounds.min / 2.0,
                particlesPerBody * i);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyOrientations = orientations;

        // Body forces
        var forces = [];
        for (i = 0; i < R.numBodies; i++) {
            forces.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyForces = forces;

        // Body torques
        var torques = [];
        for (i = 0; i < R.numBodies; i++) {
            torques.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyTorques = torques;

        // Linear and angular velocities
        var linearMomenta = Array(R.numBodies * 4).fill(0.0);
        var angularMomenta = Array(R.numBodies * 4).fill(0.0);

        // Relative particle positions (cube for now) and rigid body index
        var relativePositions = Array(R.numParticles * 4).fill(-1.0);
        if (R.rigidBodiesEnabled) {
            var index = 0;
            for (var i = 0; i < R.numBodies; i++) {
                for (var x = 0; x < 2; x++) {
                    for (var y = 0; y < 2; y++) {
                        for (var z = 0; z < 2; z++) {
                            relativePositions[index] = x * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 1] = y * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 2] = z * R.particleSize - R.particleSize / 2.0;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = R.bodyParticleMass;
                            index += 4;
                        }
                    }
                }
                relativePositions[index] = 0;
                relativePositions[index + 1] = 0;
                relativePositions[index + 2] = 0;
                relativePositions[index + 3] = i;
                R.particlePositions[index + 3] = R.bodyParticleMass;
                linearMomenta[4*i + 3] = particlesPerBody;

                index += 4;
            }
        }
        R.relativePositions = relativePositions;
        R.linearMomenta = linearMomenta;
        R.angularMomenta = angularMomenta;

        computeInertiaTensors();
    }

    // Push Init
    var initPushParticleData = function() {
        var exp = 10;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp);
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 1,
            max: 2
        };

        var particleMass = 0.8;
        for (var i = 0; i < R.numParticles; i++) {
            positions.push( Math.random() * 2.0 - 1.0,
                Math.random() * 1.0 + 0.5,
                Math.random() * 2.0 - 1.0,
                particleMass);
        }
        R.particlePositions = positions;

        // Initialize particle velocities
        var velocities = [];
        var velBounds = {
            min: 0.0,
            max: 0.0
        };
        //velocities.push(1.0, 0.0, 0.0, 1.0);
        for (var i = 0; i < R.numParticles; i++) {
            velocities.push(Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min,
                Math.random() * (velBounds.max - velBounds.min) + velBounds.min, 1.0);
        }
        R.particleVelocities = velocities;

        // Initialize particle forces
        var forces = [];
        for (var i = 0; i < R.numParticles; i++) {
            forces.push(0.0, 0.0, 0.0, 1.0);
        }
        R.forces = forces;

        // Initialize particle indices
        var indices = [];
        for (var i = 0; i < R.numParticles; i++) {
            indices[i] = i;
        }
        var indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);
        R.indices = indexBuffer;

        R.timeStep = 0.01;

        R.particleSize = .1;
        R.bound = 1.1;
        R.gridBound = R.bound * 1.1;
        R.time = 0.0;

        R.k = 1200.0;
        R.kT = 5.0;
        R.kBody = 1600.0;
        R.kBound = 2000.0;
        R.n = 4.0;
        R.nBody = R.n;
        R.nBound = 40.0;
        R.u = 0.4;
    }
    var initPushRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.rigidBodiesStatic = true;
        R.bodyParticleMass = 0.3;
        var exp = 0;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        //var particlesPerBody = 85;
        var particlesPerBody = 69;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };
        // Body positions
        var positions = [];
        for (var i = 0; i < R.numBodies; i++) {
            positions.push( 0.0, 0.2, 0.0, particlesPerBody * i);
        }
        R.bodyPositions = positions;

        // Body orientations
        var orientations = [];
        for (i = 0; i < R.numBodies; i++) {
            orientations.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyOrientations = orientations;

        // Body forces
        var forces = [];
        for (i = 0; i < R.numBodies; i++) {
            forces.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyForces = forces;

        // Body torques
        var torques = [];
        for (i = 0; i < R.numBodies; i++) {
            torques.push( 0.0, 0.0, 0.0, 1.0);
        }
        R.bodyTorques = torques;

        // Linear and angular velocities
        var linearMomenta = Array(R.numBodies * 4).fill(0.0);
        var angularMomenta = Array(R.numBodies * 4).fill(0.0);

        // Relative particle positions (cube for now) and rigid body index
        var relativePositions = Array(R.numParticles * 4).fill(-1.0);
        if (R.rigidBodiesEnabled) {
            var index = 0;
            for (var i = 0; i < R.numBodies; i++) {
                for (var x = 0; x < 8; x++) {
                    for (var z = 0; z < 3; z++) {
                        for (var y = 0; y < (z == 1 ? 4 : 3); y++) {
                            relativePositions[index] = - R.particleSize / 2.0 - R.particleSize * 3.0 + x * R.particleSize;
                            relativePositions[index + 1] =  - R.particleSize / 2.0 - R.particleSize * 2.0 + y * R.particleSize;
                            relativePositions[index + 2] = - R.particleSize + z * R.particleSize ;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = R.bodyParticleMass;
                            index += 4;
                        }
                    }
                }
                for (var x = 0; x < 7; x++) {
                    for (var y = 0; y < 3; y++) {
                        for (var z = 0; z < 2; z++) {
                            relativePositions[index] = -R.particleSize * 3.0 + x * R.particleSize;
                            relativePositions[index + 1] = -R.particleSize * 2.0 + y * R.particleSize;
                            relativePositions[index + 2] = - R.particleSize / 2.0 + z * R.particleSize;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = R.bodyParticleMass;
                            index += 4;
                        }
                    }
                }
                //relativePositions[index] = 0;
                //relativePositions[index + 1] = 0;
                //relativePositions[index + 2] = 0;
                //relativePositions[index + 3] = i;
                //R.particlePositions[index + 3] = R.bodyParticleMass;
                linearMomenta[4*i + 3] = particlesPerBody;
                index += 4;
            }
        }
        R.relativePositions = relativePositions;
        R.linearMomenta = linearMomenta;
        R.angularMomenta = angularMomenta;

        computeInertiaTensors();
    }

    var computeInertiaTensors = function() {
        var inertiaTensors = [];
        for (var i = 0; i < R.numBodies; i++) {
            var w_idx = 4*i + 3;

            var mass = R.bodyParticleMass;
            //console.log("MASS: " + mass);
            var startIndex = R.bodyPositions[w_idx];
            //console.log("START: " + startIndex);
            var numParticles = R.linearMomenta[w_idx];
            //console.log("NUM PARTICLES: " + numParticles);
            var particleInertia = Array(9).fill(0.0);
            for (var j = startIndex; j < startIndex + numParticles; j++) {
                var rx = R.relativePositions[4*j];
                var ry = R.relativePositions[4*j + 1];
                var rz = R.relativePositions[4*j + 2];
                //console.log("REL: (" + rx + "," + ry + "," + rz + ")");
                particleInertia[0] += mass * (ry * ry + rz * rz);
                particleInertia[1] += -1 * mass * ry * rx;
                particleInertia[2] += -1 * mass * rz * rx;
                particleInertia[3] += -1 * mass * rx * ry;
                particleInertia[4] += mass * (rx * rx + rz * rz);
                particleInertia[5] += -1 * mass * rz * ry;
                particleInertia[6] += -1 * mass * rx * rz;
                particleInertia[7] += -1 * mass * ry * rz;
                particleInertia[8] += mass * (rx * rx + ry * ry);
            }
            //console.log(particleInertia);
            inertiaTensors.push.apply(inertiaTensors, particleInertia);
        }
        //console.log(inertiaTensors);

        R.inertiaTensors = inertiaTensors;
    }

    var initRender = function() {
        gl.clearColor(0.5, 0.5, 0.5, 0.9);
        gl.enable(gl.DEPTH_TEST);
    }

    var setupBuffers = function(id) {
        R["fbo" + id] = gl.createFramebuffer();

        // Particle positions
        R["particlePosTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.particleSideLength, R.particleSideLength, R.particlePositions);

        // Particle velocities
        R["particleVelTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.particleSideLength, R.particleSideLength, R.particleVelocities);

        // Particle forces
        R["forceTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.particleSideLength, R.particleSideLength, R.forces);

        // Can't attach different dimension texture to the bodyFBO
        R["relativePosTex" + id] = createAndBindTexture(R["fbo" + id],
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.particleSideLength, R.particleSideLength, R.relativePositions);

        // Check for framebuffer errors
        abortIfFramebufferIncomplete(R["fbo" + id]);
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL]);

        if (R.rigidBodiesEnabled) {
            R["bodyFBO" + id] = gl.createFramebuffer();
            // Rigid Body Data
            R["bodyPosTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyPositions);

            R["bodyRotTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyOrientations);

            R["bodyForceTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyForces);

            R["bodyTorqueTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL, R.bodySideLength, R.bodySideLength, R.bodyTorques);

            R["linearMomentumTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT4_WEBGL, R.bodySideLength, R.bodySideLength, R.linearMomenta);

            R["angularMomentumTex" + id] = createAndBindTexture(R["bodyFBO" + id],
                gl_draw_buffers.COLOR_ATTACHMENT5_WEBGL, R.bodySideLength, R.bodySideLength, R.angularMomenta);

            abortIfFramebufferIncomplete(R["bodyFBO" + id]);
            gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT3_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT4_WEBGL,
                gl_draw_buffers.COLOR_ATTACHMENT5_WEBGL]);
        }
    }

    var generateGrid = function(id) {
        R["gridFBO" + id] = gl.createFramebuffer();
        R.gridInfo = {};

        R.gridInfo.gridCellSize = R.particleSize;
        R.gridInfo.numCellsPerSide = Math.ceil((R.gridBound) * 2 / R.gridInfo.gridCellSize);

        // gridTexTileDimensions are the dimensions of the flattened out grid texture in terms of individual
        // 2-dimensional "slices." This is necessary for recreating the 3D texture in the shaders
        R.gridInfo.gridTexTileDimensions = Math.ceil(Math.sqrt(R.gridInfo.numCellsPerSide));
        R.gridInfo.gridTexWidth = R.gridInfo.gridTexTileDimensions * R.gridInfo.numCellsPerSide;
        
        // Initialize grid values to 0
        var gridVals = [];
        for (var i = 0; i < Math.pow(R.gridInfo.gridTexWidth, 2.); i++) {
           gridVals.push(0.0, 0.0, 0.0, 0.0);
        }

        R["gridTex" + id] = createAndBindTexture(R["gridFBO" + id],
           gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth, gridVals);

        // Add depth and stencil attachments    
        createAndBindDepthStencilBuffer(R["gridFBO" + id], R.gridInfo.gridTexWidth, R.gridInfo.gridTexWidth);

        abortIfFramebufferIncomplete(R["gridFBO" + id]);
    }

    var generateParticlesFromMesh = function(id, prog, model, gridSideLength) {
        R["meshParticlesFBO" + id] = gl.createFramebuffer();
        var gridTexSideLength = 

        R["meshParticlesTex" + id] = createAndBindTexture(R["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, gridSideLength, gridSideLength, null);

        createAndBindDepthStencilBuffer(R["meshParticlesFBO" + id], gridSideLength, gridSideLength);
        
        // Draw model 2x on two textures. Once with near, once with far
        // Feed those textures (and array of uniform grid) into vertex shader
        // Output 1s or 0s into 3D texture
        
        //readyModelForDraw(prog, model);


        //gl.drawElements(model.gltf.mode, model.gltf.indices.length, model.gltf.indicesComponentType, 0);
    }
    /**
     * Loads all of the shader programs used in the pipeline.
     */
    var loadAllShaderPrograms = function() {

		// Load collision fragment shader
		loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/forces.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };
                //debugger;
				// Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.u_bound = gl.getUniformLocation(prog, 'u_bound');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                //Physics coefficients
                p.u_k  = gl.getUniformLocation(prog, 'u_k');
                p.u_kT  = gl.getUniformLocation(prog, 'u_kT');
                p.u_kBody  = gl.getUniformLocation(prog, 'u_kBody');
                p.u_kBound  = gl.getUniformLocation(prog, 'u_kBound');
                p.u_n  = gl.getUniformLocation(prog, 'u_n');
                p.u_nBody  = gl.getUniformLocation(prog, 'u_nBody');
                p.u_nBound  = gl.getUniformLocation(prog, 'u_nBound');
                p.u_u  = gl.getUniformLocation(prog, 'u_u');

                // Grid uniforms
                p.u_gridTex = gl.getUniformLocation(prog, 'u_gridTex');
                p.u_gridSideLength = gl.getUniformLocation(prog, 'u_gridSideLength');
                p.u_gridNumCellsPerSide = gl.getUniformLocation(prog, 'u_gridNumCellsPerSide');
                p.u_gridTexSize = gl.getUniformLocation(prog, 'u_gridTexSize');
                p.u_gridTexTileDimensions = gl.getUniformLocation(prog, 'u_gridTexTileDimensions');
                p.u_gridCellSize = gl.getUniformLocation(prog, 'u_gridCellSize');
				
                // Save the object into this variable for access later
				R.progPhysics = p;
			}
        );

        // Load particle rendering shader
		loadShaderProgram(gl, 'glsl/particle/particle.vert.glsl', 'glsl/particle/particle.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };

				// Retrieve the uniform and attribute locations
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_cameraPos = gl.getUniformLocation(prog, 'u_cameraPos');
                p.u_fovy = gl.getUniformLocation(prog, 'u_fovy');
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_side');
                p.u_bodySideLength = gl.getUniformLocation(prog, 'u_bodySide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_nearPlaneHeight = gl.getUniformLocation(prog, 'u_nearPlaneHeight');
                p.a_idx  = gl.getAttribLocation(prog, 'a_idx');

				// Save the object into this variable for access later
				R.progParticle = p;
			}
        );

        // Load particle update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/euler.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progEuler = p;
            }
        );

        // Load body update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/bodyEuler.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_bodyForceTex = gl.getUniformLocation(prog, 'u_bodyForceTex');
                p.u_bodyTorqueTex = gl.getUniformLocation(prog, 'u_bodyTorqueTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                //p.prog.u_inertiaTensors = gl.getUniformLocation(prog, 'u_inertiaTensors');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progBodyEuler = p;
            }
        );

        // Load body update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/bodyForces.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_bodyForceTex = gl.getUniformLocation(prog, 'u_bodyForceTex');
                p.u_bodyTorqueTex = gl.getUniformLocation(prog, 'u_bodyTorqueTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progBodyForces = p;
            }
        );

        // Load particle update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/rk2.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex1 = gl.getUniformLocation(prog, 'u_velTex1');
                p.u_forceTex1 = gl.getUniformLocation(prog, 'u_forceTex1');
                p.u_velTex2 = gl.getUniformLocation(prog, 'u_velTex2');
                p.u_forceTex2 = gl.getUniformLocation(prog, 'u_forceTex2');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progRK2 = p;
            }
        );

        // Load body update shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/bodyRK2.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_forceTex_1 = gl.getUniformLocation(prog, 'u_forceTex_1');
                p.u_forceTex_2 = gl.getUniformLocation(prog, 'u_forceTex_2');
                p.u_torqueTex_1 = gl.getUniformLocation(prog, 'u_torqueTex_1');
                p.u_torqueTex_2 = gl.getUniformLocation(prog, 'u_torqueTex_2');
                p.u_linearMomentumTex_1 = gl.getUniformLocation(prog, 'u_linearMomentumTex_1');
                p.u_linearMomentumTex_2 = gl.getUniformLocation(prog, 'u_linearMomentumTex_2');
                p.u_angularMomentumTex_1 = gl.getUniformLocation(prog, 'u_angularMomentumTex_1');
                p.u_angularMomentumTex_2 = gl.getUniformLocation(prog, 'u_angularMomentumTex_2');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progBodyRK2 = p;
            }
        );

        // Load debug shader for viewing textures
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/debug.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_gridTex = gl.getUniformLocation(prog, 'u_gridTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_bodyForceTex = gl.getUniformLocation(prog, 'u_bodyForceTex');
                p.u_bodyTorqueTex = gl.getUniformLocation(prog, 'u_bodyTorqueTex');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progDebug = p;
            }
        );

        // Load rigid body particle setup shader
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/object/setup.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_forceTex = gl.getUniformLocation(prog, 'u_forceTex');
                p.u_bodyPosTex = gl.getUniformLocation(prog, 'u_bodyPosTex');
                p.u_bodyRotTex = gl.getUniformLocation(prog, 'u_bodyRotTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_linearMomentumTex = gl.getUniformLocation(prog, 'u_linearMomentumTex');
                p.u_angularMomentumTex = gl.getUniformLocation(prog, 'u_angularMomentumTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_bodySide = gl.getUniformLocation(prog, 'u_bodySide');
                p.u_time = gl.getUniformLocation(prog, 'u_time');
                p.u_scene = gl.getUniformLocation(prog, 'u_scene');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');

                // Save the object into this variable for access later
                R.progSetup = p;
            }
        );

        // Load ambient shader for viewing models
        loadShaderProgram(gl, 'glsl/object/ambient.vert.glsl', 'glsl/object/ambient.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.a_position  = gl.getAttribLocation(prog, 'a_position');
                p.a_normal = gl.getAttribLocation(prog, 'a_normal');
                p.a_uv = gl.getAttribLocation(prog, 'a_uv');
                // Save the object into this variable for access later
                R.progAmbient = p;
            }
        );

        // Load ambient shader for grid generation
        loadShaderProgram(gl, 'glsl/grid.vert.glsl', 'glsl/grid.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_posTexSize = gl.getUniformLocation(prog, 'u_posTexSize');
                p.u_gridSideLength = gl.getUniformLocation(prog, 'u_gridSideLength');
                p.u_gridNumCellsPerSide = gl.getUniformLocation(prog, 'u_gridNumCellsPerSide');
                p.u_gridTexSize = gl.getUniformLocation(prog, 'u_gridTexSize');
                p.u_gridTexTileDimensions = gl.getUniformLocation(prog, 'u_gridTexTileDimensions'); 
                p.u_gridCellSize = gl.getUniformLocation(prog, 'u_gridCellSize');
                p.a_idx = gl.getAttribLocation(prog, 'a_idx');

                // Save the object into this variable for access later
                R.progGrid = p;
            }
        );
    };

	var createAndBindTexture = function(fbo, attachment, sideLengthx, sideLengthy, data) {
		var tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);

        if (data) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLengthx, sideLengthy, 0, gl.RGBA, gl.FLOAT, new Float32Array(data));
        }
        else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, sideLengthx, sideLengthy, 0, gl.RGBA, gl.FLOAT, null);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        // These are necessary for non-pot textures https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, attachment, gl.TEXTURE_2D, tex, 0);

        return tex;

	}

    var createAndBindDepthStencilBuffer = function(fbo, sideLengthx, sideLengthy) {
        var depthStencil = gl.createRenderbuffer();

        gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencil);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, sideLengthx, sideLengthy);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencil);

        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    }
})();
