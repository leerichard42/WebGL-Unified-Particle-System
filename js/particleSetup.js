(function() {
    'use strict';

    window.R = {};

    R.setupBuffers = function() {
        setupBuffers('A');
        setupBuffers('RK2_A');
        setupBuffers('RK2_B');
        setupBuffers('RK2_C');
        setupBuffers('B');

        generateGrid('A');
        generateGrid('B');
        requestAnimationFrame(R.update);
    }

    R.particleSetup = function() {
        //loadAllShaderPrograms();
        //generateParticlesFromMesh("duck", 16);
        R.scene = 3; // 0 = test, 1 = funnel, 2 = pile, 3 = push, 4 = duck
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
        else if (R.scene == 4) {
            var a = performance.now();
            initDuckParticleData();
            initDuckRigidBodyData();
            var b = performance.now();
            console.log("Duck generation took: " + (b-a) + " ms");
        }
        initRender();
        R.setupBuffers();
        R.toReset = false;
    };

    // Test Init
    var initParticleData = function() {
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
                debugger;
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
                    //createCircle(y * R.particleSize,
                    //    2.0 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, false);
                    createCircle(y * R.particleSize,
                        1.2 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, true);
                    createCircle(y * R.particleSize + 0.5 * R.particleSize,
                        1.5 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, false);
                    //createCircle(y * R.particleSize,
                    //    2.0 * R.particleSize + ((y-4)/12) * 4 * R.particleSize, true);
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
        var exp = 12;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numParticles = Math.pow(2, exp);
        R.particleSideLength = Math.sqrt(R.numParticles);

        // Initialize particle positions
        var positions = [];
        var gridBounds = {
            min: 0,
            max: 2
        };

        var particleMass = 1.0;
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
        R.bound = 2.3;
        R.gridBound = R.bound * 1.1;

        R.k = 1200.0;
        R.kT = 5.0;
        R.kBody = 1300.0;
        R.kBound = 2000.0;
        R.n = 4.0;
        R.nBody = 8.0;
        R.nBound = 40.0;
        R.u = 0.8;
    }
    var initPileRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.bodyParticleMass = 0.6;
        var exp = 8;
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
                0.8 + i/40.0,
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
            positions.push( 0.2, 0.2, -0.2, particlesPerBody * i);
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
                for (var z = 0; z < 8; z++) {
                    for (var x = 0; x < 3; x++) {
                        for (var y = 0; y < (x == 1 ? 4 : 3); y++) {
                            relativePositions[index] = - R.particleSize / 2.0 - R.particleSize * 3.0 + x * R.particleSize;
                            relativePositions[index + 1] =  - R.particleSize / 2.0 - R.particleSize * 2.0 + y * R.particleSize;
                            relativePositions[index + 2] = - R.particleSize + z * R.particleSize ;
                            relativePositions[index + 3] = i;
                            R.particlePositions[index + 3] = R.bodyParticleMass;
                            index += 4;
                        }
                    }
                }
                for (var z = 0; z < 7; z++) {
                    for (var y = 0; y < 3; y++) {
                        for (var x = 0; x < 2; x++) {
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

    // Duck Init
    var initDuckParticleData = function() {
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

        R.particleSize = .08;
        R.bound = 1.8;
        R.gridBound = R.bound * 1.1;
        R.time = 0.0;

        R.k = 1500.0;
        R.kT = 5.0;
        R.kBody = 1600.0;
        R.kBound = 2000.0;
        R.n = 4.0;
        R.nBody = R.n;
        R.nBound = 40.0;
        R.u = 0.4;
    }

    var initDuckRigidBodyData = function() {
        R.rigidBodiesEnabled = true;
        R.rigidBodiesStatic = false;
        R.bodyParticleMass = 0.3;
        var exp = 2;
        if (exp % 2 != 0) {
            throw new Error("Texture side is not a power of two!");
        }
        R.numBodies = R.rigidBodiesEnabled ? Math.pow(2, exp) : 0;
        R.bodySideLength = R.rigidBodiesEnabled ? Math.sqrt(R.numBodies) : 0;
        //var particlesPerBody = 85;
        //var particlesPerBody = 69;
        var particlesPerBody = 0;
        if (particlesPerBody * R.numBodies > R.numParticles) {
            throw new Error("More body particles than available particles!");
        }

        var gridBounds = {
            min: 1,
            max: 2
        };

        // Body positions
        var positions = [];
        //for (var i = 0; i < R.numBodies; i++) {
        //    positions.push( 0.0, 0.2 + i / 4.0, 0.0, particlesPerBody * i);
        //}

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
        gl.bindFramebuffer(gl.FRAMEBUFFER, R["meshParticlesFBOVoxelduck"]);
        var pixels = new Float32Array(R.gridTexSideLength * R.gridTexSideLength * 4);
        gl.readPixels(0, 0, R.gridTexSideLength, R.gridTexSideLength, gl.RGBA, gl.FLOAT, pixels);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (R.rigidBodiesEnabled) {
            for (var i = 0; i < R.numBodies; i++) {
                var index = 0;
                var particlesPerBody = 0;
                for (var k = 0; k < pixels.length; k++) {
                    if (pixels[k] != 0) {
                        var pixelIdx = k / 4;
                        var scale = 1.;
                        var x = pixelIdx % R.gridSideLength;
                        x /= R.gridSideLength;
                        x *= scale;
                        x -= scale/2;

                        var y = Math.floor(pixelIdx / R.gridSideLength) % R.gridSideLength;
                        y /= R.gridSideLength;
                        y *= scale;
                        y -= scale/2;
                        
                        var z = Math.floor(pixelIdx / Math.pow(R.gridSideLength, 2));
                        z /= R.gridSideLength;
                        z *= scale;
                        z -= scale/2;

                        relativePositions[index] = x;
                        relativePositions[index + 1] = y;
                        relativePositions[index + 2] = z;
                        relativePositions[index + 3] = i;
                        R.particlePositions[index + 3] = R.bodyParticleMass;
                        index += 4;
                        particlesPerBody++;
                    }
                }
                positions.push( 0.0, 0.2 + i / 4.0, 0.0, particlesPerBody * i);
                linearMomenta[4*i + 3] = particlesPerBody;
            }
        }

        R.bodyPositions = positions;
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

    var generateParticlesFromMesh = function(id, gridSideLength) {
        // HACKY!
        if (!R.progParticleFromMeshDepth || !R.progDebug || !R.progParticleFromMeshVoxel) {
            window.requestAnimationFrame(function() {
                generateParticlesFromMesh(id, gridSideLength);
            });
            return;
        }
        var localR = {};
        localR["meshParticlesFBO" + id] = gl.createFramebuffer();
        R["meshParticlesFBOVoxel" + id] = gl.createFramebuffer();
        var gridTexTileDimensions = Math.ceil(Math.sqrt(gridSideLength));
        R.gridTexSideLength = gridTexTileDimensions * gridSideLength;
        R.gridSideLength = gridSideLength;

        localR["meshParticlesTex" + id + "0"] = createAndBindTexture(localR["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.gridTexSideLength, R.gridTexSideLength, null);
        localR["meshParticlesTex" + id + "1"] = createAndBindTexture(localR["meshParticlesFBO" + id],
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL, R.gridTexSideLength, R.gridTexSideLength, null);
        R["meshParticlesTex" + id] = createAndBindTexture(R["meshParticlesFBOVoxel" + id],
            gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL, R.gridTexSideLength, R.gridTexSideLength, null);

        abortIfFramebufferIncomplete(localR["meshParticlesFBO" + id]);
        abortIfFramebufferIncomplete(R["meshParticlesFBOVoxel" + id]);
        
        createAndBindDepthStencilBuffer(localR["meshParticlesFBO" + id], R.gridTexSideLength, R.gridTexSideLength);

        // Draw model 2x on two textures. Once with near, once with far
        gl.useProgram(R.progParticleFromMeshDepth.prog);
        gl.viewport(0, 0, R.gridTexSideLength, R.gridTexSideLength);
        gl.bindFramebuffer(gl.FRAMEBUFFER, localR["meshParticlesFBO" + id]);
        
        gl_draw_buffers.drawBuffersWEBGL([gl_draw_buffers.COLOR_ATTACHMENT0_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT1_WEBGL,
            gl_draw_buffers.COLOR_ATTACHMENT2_WEBGL]);

        var orthoMat = new THREE.Matrix4();
        var width = 2;
        var height = 2;
        var camera = new THREE.OrthographicCamera( width / -2, width / 2, 
           height / 2, height / -2, 1, 20);
        camera.position.set(0, 1, 10);
        camera.up = new THREE.Vector3(0, 1, 0);
        camera.lookAt(new THREE.Vector3(0, 1, 0));

        camera.updateMatrixWorld();
        camera.matrixWorldInverse.getInverse(camera.matrixWorld);
        orthoMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

        gl.uniformMatrix4fv(R.progParticleFromMeshDepth.u_cameraMat, false, orthoMat.elements);
        readyModelForDraw(R.progParticleFromMeshDepth, R.model);
        
        // Pass 1
        gl.uniform1i(R.progParticleFromMeshDepth.u_texID, 0);
        gl.depthFunc(gl.LESS);
        gl.drawElements(R.model.gltf.mode, R.model.gltf.indices.length, R.model.gltf.indicesComponentType, 0);
        
        // Pass 2
        gl.uniform1i(R.progParticleFromMeshDepth.u_texID, 1);
        gl.disable(gl.CULL_FACE);
        gl.depthFunc(gl.GREATER);
        gl.drawElements(R.model.gltf.mode, R.model.gltf.indices.length, R.model.gltf.indicesComponentType, 0);
        
        gl.depthFunc(gl.LESS);
        gl.enable(gl.CULL_FACE);

        // Feed those textures into vertex shader, output 3D texture of voxels
        gl.useProgram(R.progParticleFromMeshVoxel.prog);
        gl.viewport(0, 0, R.gridTexSideLength, R.gridTexSideLength);
        gl.bindFramebuffer(gl.FRAMEBUFFER, R["meshParticlesFBOVoxel" + id]);
        gl.disable(gl.BLEND);
        gl.clear(gl.DEPTH_BUFFER_BIT);

        var orthoMatInv = new THREE.Matrix4();
        orthoMatInv.getInverse(orthoMat);

        gl.uniformMatrix4fv(R.progParticleFromMeshVoxel.u_cameraMat, false, orthoMat.elements);
        gl.uniformMatrix4fv(R.progParticleFromMeshVoxel.u_cameraMatInv, false, orthoMatInv.elements);
        gl.uniform1f(R.progParticleFromMeshVoxel.u_gridSideLength, gridSideLength);
        gl.uniform1f(R.progParticleFromMeshVoxel.u_gridTexSideLength, R.gridTexSideLength);
        gl.uniform1f(R.progParticleFromMeshVoxel.u_gridWorldBounds, width);
        gl.uniform2fv(R.progParticleFromMeshVoxel.u_gridWorldLowerLeft, [camera.position.x - width * .5,
                                                                        camera.position.y - height * .5]);
        // Bind textures
        gl.activeTexture(gl['TEXTURE0']);
        gl.bindTexture(gl.TEXTURE_2D, localR["meshParticlesTex" + id + "0"]);
        gl.uniform1i(R.progParticleFromMeshVoxel.u_tex0, 0);

        gl.activeTexture(gl['TEXTURE1']);
        gl.bindTexture(gl.TEXTURE_2D, localR["meshParticlesTex" + id + "1"]);
        gl.uniform1i(R.progParticleFromMeshVoxel.u_tex1, 1);

        renderFullScreenQuad(R.progParticleFromMeshVoxel);
        gl.enable(gl.BLEND);
        // // Temporary debug
        // gl.useProgram(R.progDebug.prog);
        // gl.viewport(0, 0, 128 * 6, 128 * 2);
        // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // // Bind textures
        // gl.activeTexture(gl['TEXTURE0']);
        // gl.bindTexture(gl.TEXTURE_2D, localR["meshParticlesTex" + id + "0"]);
        // gl.uniform1i(R.progDebug.u_depth0, 0);

        // gl.activeTexture(gl['TEXTURE1']);
        // gl.bindTexture(gl.TEXTURE_2D, localR["meshParticlesTex" + id + "1"]);
        // gl.uniform1i(R.progDebug.u_depth1, 1);
        
        // gl.activeTexture(gl['TEXTURE2']);
        // gl.bindTexture(gl.TEXTURE_2D, R["meshParticlesTex" + id]);
        // gl.uniform1i(R.progDebug.u_voxel, 2);

        // renderFullScreenQuad(R.progDebug);
        R.particleSetup();
        // Output 1s or 0s into 3D texture
    }

    // TEMPORARY
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
    ///////////////

    /**
     * Loads all of the shader programs used in the pipeline.
     */
    R.loadAllShaderPrograms = function() {

		// Load collision fragment shader
		loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 'glsl/particle/forces.frag.glsl',
			function(prog) {
				// Create an object to hold info about this shader program
				var p = { prog: prog };

				// Retrieve the uniform and attribute locations
                p.u_posTex = gl.getUniformLocation(prog, 'u_posTex');
                p.u_velTex = gl.getUniformLocation(prog, 'u_velTex');
                p.u_relPosTex = gl.getUniformLocation(prog, 'u_relPosTex');
                p.u_particleSideLength = gl.getUniformLocation(prog, 'u_particleSide');
                p.u_diameter = gl.getUniformLocation(prog, 'u_diameter');
                p.u_dt = gl.getUniformLocation(prog, 'u_dt');
                p.u_bound = gl.getUniformLocation(prog, 'u_bound');
                p.u_scene = gl.getUniformLocation(prog, 'u_scene');
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
                // p.u_depth0 = gl.getUniformLocation(prog, 'u_depth0');
                // p.u_depth1 = gl.getUniformLocation(prog, 'u_depth1');
                // p.u_voxel = gl.getUniformLocation(prog, 'u_voxel');
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

         // Load particle generation depth shader 
        loadShaderProgram(gl, 'glsl/object/particleFromMesh/depth.vert.glsl', 
                                'glsl/object/particleFromMesh/depth.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_texID = gl.getUniformLocation(prog, 'u_texID');
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.a_position = gl.getUniformLocation(prog, 'a_position');                
                // Save the object into this variable for access later
                R.progParticleFromMeshDepth = p;
            }
        );

        // Load particle generation shader 
        loadShaderProgram(gl, 'glsl/particle/quad.vert.glsl', 
                                'glsl/object/particleFromMesh/voxel.frag.glsl',
            function(prog) {
                // Create an object to hold info about this shader program
                var p = { prog: prog };

                // Retrieve the uniform and attribute locations
                p.u_tex0 = gl.getUniformLocation(prog, 'u_tex0');
                p.u_tex1 = gl.getUniformLocation(prog, 'u_tex1');
                p.u_cameraMat = gl.getUniformLocation(prog, 'u_cameraMat');
                p.u_cameraMatInv = gl.getUniformLocation(prog, 'u_cameraMatInv');
                p.u_gridSideLength = gl.getUniformLocation(prog, 'u_gridSideLength');
                p.u_gridTexSideLength = gl.getUniformLocation(prog, 'u_gridTexSideLength');
                p.u_gridWorldBounds = gl.getUniformLocation(prog, 'u_gridWorldBounds');
                p.u_gridWorldLowerLeft = gl.getUniformLocation(prog, 'u_gridWorldLowerLeft');
                //p.u_gridTexTileDimensions = gl.getUniformLocation(prog, 'u_gridTexTileDimensions');
                p.a_position = gl.getUniformLocation(prog, 'a_position');                
                // Save the object into this variable for access later
                R.progParticleFromMeshVoxel = p;
                generateParticlesFromMesh("duck", 12);
    
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
