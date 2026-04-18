 (function() {
    let scene, camera, renderer, clock;
    let particles;
    const container = document.getElementById('canvas-container');

    // --- CONFIGURATION ---
    const config = {
        particleCount: 160,
        maxDistance: 70,    // Distance for line connections
        nodeColor: 0x00d4ff,
        lineColor: 0x00d4ff,
        areaSize: 350,      // Total 3D spread
        nodeSizeBase: 3     // Base size for the pulsing dots
    };

    // Helper: Creates a glowy circular texture for the nodes
    function createCircleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // Hot white center
        gradient.addColorStop(0.2, 'rgba(0, 212, 255, 0.8)');    // Brand Blue
        gradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.2)');    // Subtle Glow
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');        // Transparent edge

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        return new THREE.CanvasTexture(canvas);
    }

    function init() {
        // 1. Scene & Camera Setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 50, 450); // Adds depth fade

        const aspect = window.innerWidth / window.innerHeight;
        camera = new THREE.PerspectiveCamera(60, aspect, 1, 1000);
        camera.position.set(0, 40, 180); 
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        // 2. Generate Random Particles
        const positions = new Float32Array(config.particleCount * 3);
        const velocities = [];

        for (let i = 0; i < config.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * config.areaSize;
            positions[i * 3 + 1] = (Math.random() - 0.5) * (config.areaSize / 2.5);
            positions[i * 3 + 2] = (Math.random() - 0.5) * config.areaSize;

            velocities.push({
                x: (Math.random() - 0.5) * 0.15,
                y: (Math.random() - 0.5) * 0.15,
                z: (Math.random() - 0.5) * 0.15
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // 3. Setup Node Material (Circular & Glowy)
        const dotMat = new THREE.PointsMaterial({
            color: config.nodeColor,
            size: config.nodeSizeBase,
            map: createCircleTexture(),
            transparent: true,
            alphaTest: 0.01,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, dotMat);
        scene.add(points);

        // 4. Setup Line Material (The Mesh)
        const lineMat = new THREE.LineBasicMaterial({
            color: config.lineColor,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        });

        const lineGeometry = new THREE.BufferGeometry();
        const lineMesh = new THREE.LineSegments(lineGeometry, lineMat);
        scene.add(lineMesh);

        particles = { geometry, points, lineGeometry, lineMesh, velocities, positions };

        animate();
    }

    function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const posAttr = particles.geometry.attributes.position;
        const linePositions = [];

        // Gentle Pulse Effect
        particles.points.material.size = config.nodeSizeBase + Math.sin(time * 1.5) * 1.5;

        // Update Particle Positions
        for (let i = 0; i < config.particleCount; i++) {
            let x = posAttr.getX(i) + particles.velocities[i].x;
            let y = posAttr.getY(i) + particles.velocities[i].y;
            let z = posAttr.getZ(i) + particles.velocities[i].z;

            // Boundaries
            if (Math.abs(x) > config.areaSize / 2) particles.velocities[i].x *= -1;
            if (Math.abs(y) > config.areaSize / 5) particles.velocities[i].y *= -1;
            if (Math.abs(z) > config.areaSize / 2) particles.velocities[i].z *= -1;

            posAttr.setXYZ(i, x, y, z);
        }
        posAttr.needsUpdate = true;

        // Draw Dynamic Connections
        for (let i = 0; i < config.particleCount; i++) {
            for (let j = i + 1; j < config.particleCount; j++) {
                const dx = posAttr.getX(i) - posAttr.getX(j);
                const dy = posAttr.getY(i) - posAttr.getY(j);
                const dz = posAttr.getZ(i) - posAttr.getZ(j);
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < config.maxDistance) {
                    linePositions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                    linePositions.push(posAttr.getX(j), posAttr.getY(j), posAttr.getZ(j));
                }
            }
        }

        particles.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        // Final Rotate Scene for subtle movement
        scene.rotation.y += 0.0005;

        renderer.render(scene, camera);
    }

    // Responsive Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    window.onload = init;
})();