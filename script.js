/* =========================================================
   1. THREE.JS MULTI-MODE 3D BACKGROUND ENGINE
   ========================================================= */

let scene, camera, renderer, currentMeshGroup;
let activeMode = 'nodes';
let mouseX = 0, mouseY = 0;
let targetX = 0, targetY = 0;

function init3DEngine() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    load3DMode('nodes');

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX - window.innerWidth / 2) * 0.05;
        mouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    });

    window.addEventListener('resize', onWindowResize);
    animate();
}

function clearCurrentScene() {
    if (currentMeshGroup) {
        scene.remove(currentMeshGroup);
        currentMeshGroup.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                else child.material.dispose();
            }
        });
    }
}

function load3DMode(mode) {
    clearCurrentScene();
    activeMode = mode;
    currentMeshGroup = new THREE.Group();

    if (mode === 'nodes') {
        // Mode 1: Node Mesh / Constellation
        const particleCount = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 60;
            positions[i + 1] = (Math.random() - 0.5) * 60;
            positions[i + 2] = (Math.random() - 0.5) * 60;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x00e5ff,
            size: 0.8,
            transparent: true,
            opacity: 0.8
        });

        const points = new THREE.Points(geometry, material);
        currentMeshGroup.add(points);

        // Lines connection
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffaa,
            transparent: true,
            opacity: 0.15
        });

        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = [];

        for (let i = 0; i < particleCount; i++) {
            for (let j = i + 1; j < particleCount; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist < 12) {
                    linePositions.push(
                        positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                        positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                    );
                }
            }
        }

        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        currentMeshGroup.add(lines);

    } else if (mode === 'wave') {
        // Mode 2: Cyber Wave Surface
        const width = 60, height = 60, segments = 45;
        const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.25
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 3;
        currentMeshGroup.add(plane);

    } else if (mode === 'tunnel') {
        // Mode 3: Vortex Particle Tunnel
        const count = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const radius = 5 + Math.random() * 20;
            const theta = Math.random() * Math.PI * 2;
            const z = (Math.random() - 0.5) * 100;

            positions[i * 3] = Math.cos(theta) * radius;
            positions[i * 3 + 1] = Math.sin(theta) * radius;
            positions[i * 3 + 2] = z;

            // Gradient Blue to Green
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            colors[i * 3 + 2] = 0.9;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.7
        });

        const tunnelPoints = new THREE.Points(geometry, material);
        currentMeshGroup.add(tunnelPoints);
    }

    scene.add(currentMeshGroup);
}

function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.05;
    targetY += (-mouseY - targetY) * 0.05;

    if (currentMeshGroup) {
        if (activeMode === 'nodes') {
            currentMeshGroup.rotation.y += 0.002;
            currentMeshGroup.rotation.x = targetY * 0.02;
            currentMeshGroup.rotation.y += targetX * 0.02;
        } else if (activeMode === 'wave') {
            const time = Date.now() * 0.0015;
            const plane = currentMeshGroup.children[0];
            const pos = plane.geometry.attributes.position;

            for (let i = 0; i < pos.count; i++) {
                const u = pos.getX(i);
                const v = pos.getY(i);
                const z = Math.sin(u * 0.2 + time) * 2 + Math.cos(v * 0.2 + time) * 2;
                pos.setZ(i, z);
            }
            pos.needsUpdate = true;
            plane.rotation.z = time * 0.1;
        } else if (activeMode === 'tunnel') {
            const pos = currentMeshGroup.children[0].geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                let z = pos.getZ(i);
                z += 0.4;
                if (z > 50) z = -50;
                pos.setZ(i, z);
            }
            pos.needsUpdate = true;
            currentMeshGroup.rotation.z += 0.005;
        }
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/* =========================================================
   2. DOM & UI LOGIC
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Canvas
    init3DEngine();

    // Mode Switcher Listeners
    const modeBtns = document.querySelectorAll('.mode-btn');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            modeBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            load3DMode(e.target.dataset.mode);
        });
    });

    // Mobile Hamburger Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '100%';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'var(--card-bg)';
                navLinks.style.padding = '1.5rem 2rem';
                navLinks.style.borderBottom = '1px solid var(--border-color)';
            }
        });
    }

    // Competitive Programming Stats
    const MY_STATS = {
        leetcodeSolved: "379",
        codechefRating: "1310"
    };

    const lcElement = document.getElementById('leetcode-count');
    const ccElement = document.getElementById('codechef-rating');

    if (lcElement) lcElement.textContent = MY_STATS.leetcodeSolved;
    if (ccElement) ccElement.textContent = MY_STATS.codechefRating;
});
