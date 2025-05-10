import * as THREE from 'three';

// Add HTML elements for messages
const messageBox = document.createElement('div');
messageBox.style.position = 'absolute';
messageBox.style.bottom = '20px';
messageBox.style.left = '20px';
messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
messageBox.style.color = 'white';
messageBox.style.fontFamily = 'Arial';
messageBox.style.padding = '20px';
messageBox.style.borderRadius = '10px';
messageBox.style.maxWidth = '300px';
messageBox.style.display = 'none';
messageBox.style.zIndex = '1000';
document.body.appendChild(messageBox);

// Game state
let gameOver = false;
const planets = [];
const rings = [];
const particles = [];
const planetMessages = [
    "Welcome to Planet Alpha!",
    "Danger Zone: Planet Beta",
    "Mysterious Planet Gamma",
    "Ancient Planet Delta",
    "Frozen Planet Epsilon"
];
let ringsCollected = 0;
let startTime = null;
let gameStarted = false;
let currentMessage = null;
let messageTimeout = null;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create starfield
function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1,
        sizeAttenuation: true
    });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

// Create sun
const sunGeometry = new THREE.SphereGeometry(100, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.8
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(500, 200, -800); // Position far away
scene.add(sun);

// Add sun glow
const sunGlowGeometry = new THREE.SphereGeometry(110, 64, 64);
const sunGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0.3
});
const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Enhanced directional light from sun
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.copy(sun.position);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 1000;
scene.add(directionalLight);

// Add point light at sun position for additional glow
const sunLight = new THREE.PointLight(0xffff00, 2.0, 2000);
sunLight.position.copy(sun.position);
scene.add(sunLight);

// Player ship
function createPlayerShip() {
    const shipGroup = new THREE.Group();
    
    // Main body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Front cone (pointing forward)
    const frontGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const frontMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const front = new THREE.Mesh(frontGeometry, frontMaterial);
    front.position.z = 1.15;
    front.rotation.x = Math.PI / 2;
    shipGroup.add(front);
    
    // Back cone (pointing backward)
    const backGeometry = new THREE.ConeGeometry(0.2, 0.8, 8);
    const backMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const back = new THREE.Mesh(backGeometry, backMaterial);
    back.position.z = -1.15;
    back.rotation.x = -Math.PI / 2;
    shipGroup.add(back);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
    const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.6, 0, 0);
    leftWing.rotation.z = Math.PI / 6;
    shipGroup.add(leftWing);
    
    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.6, 0, 0);
    rightWing.rotation.z = -Math.PI / 6;
    shipGroup.add(rightWing);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.2;
    shipGroup.add(cockpit);
    
    // Engine glow
    const engineGlowGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const engineGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5
    });
    const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
    engineGlow.position.z = -1.5;
    shipGroup.add(engineGlow);
    
    // Rotate the entire ship to face the correct direction
    shipGroup.rotation.x = Math.PI / 2;
    shipGroup.rotation.y = 0;
    
    return shipGroup;
}

const playerShip = createPlayerShip();
scene.add(playerShip);

// Camera setup
camera.position.z = 1; 
camera.position.y = 2; // Increased from 3 to 5
camera.lookAt(playerShip.position);

// Movement variables
const moveSpeed = 0.1;
let moveForward = false;
let moveBackward = false;

// Add physics variables
const maxSpeed = 0.5;
const acceleration = 0.02;
const deceleration = 0.0008;
let velocity = new THREE.Vector3(0, 0, 0);

// Mouse control variables
let mousePosition = new THREE.Vector2();
const maxPitch = Math.PI/2; // 90 degrees
const maxYaw = Math.PI*1.5; // 180 degrees

// Add settings variables
let cursorInvertX = -1;
let cursorInvertY = 1;

// Add corner acceleration variables
const cornerAcceleration = 0.005;
const cornerThreshold = 0.8; // How close to corner before acceleration starts

// Add corner rotation variables
const cornerRotationSpeed = 0.02;

// Add settings UI
const settingsIcon = document.createElement('div');
settingsIcon.innerHTML = '⚙️';
settingsIcon.style.position = 'absolute';
settingsIcon.style.top = '20px';
settingsIcon.style.right = '20px';
settingsIcon.style.fontSize = '24px';
settingsIcon.style.cursor = 'pointer';
settingsIcon.style.zIndex = '1000';
document.body.appendChild(settingsIcon);

const settingsPanel = document.createElement('div');
settingsPanel.style.position = 'absolute';
settingsPanel.style.top = '60px';
settingsPanel.style.right = '20px';
settingsPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
settingsPanel.style.color = 'white';
settingsPanel.style.padding = '20px';
settingsPanel.style.borderRadius = '10px';
settingsPanel.style.display = 'none';
settingsPanel.style.zIndex = '1000';
settingsPanel.innerHTML = `
    <h3 style="margin: 0 0 15px 0">Settings</h3>
    <div style="margin-bottom: 10px">
        <label style="display: block; margin-bottom: 5px">Cursor Orientation</label>
        <div style="display: flex; gap: 10px">
            <button id="invertX" style="padding: 5px 10px">Invert X</button>
            <button id="invertY" style="padding: 5px 10px">Invert Y</button>
        </div>
    </div>
`;
document.body.appendChild(settingsPanel);

// Settings event listeners
settingsIcon.addEventListener('click', () => {
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('invertX').addEventListener('click', () => {
    cursorInvertX *= -1;
    document.getElementById('invertX').style.backgroundColor = cursorInvertX === -1 ? '#4CAF50' : '';
});

document.getElementById('invertY').addEventListener('click', () => {
    cursorInvertY *= -1;
    document.getElementById('invertY').style.backgroundColor = cursorInvertY === -1 ? '#4CAF50' : '';
});

// Update mouse move handler
document.addEventListener('mousemove', (event) => {
    if (gameOver) return;
    
    // Calculate mouse position relative to center of screen (-1 to 1)
    mousePosition.x = ((event.clientX / window.innerWidth) * 2 - 1) * cursorInvertX;
    mousePosition.y = -((event.clientY / window.innerHeight) * 2 - 1) * cursorInvertY;
});

// Create planets
function createPlanet(x, y, z, radius, message) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: Math.random() * 0xffffff,
        shininess: 30
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    planet.userData.message = message;
    scene.add(planet);
    planets.push(planet);
}

// Create ring function
function createRing(x, y, z, color) {
    const ringGeometry = new THREE.TorusGeometry(8, 0.4, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8,
        emissive: color,
        emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.userData.collected = false;
    
    // Make rings face each other by rotating them
    const angle = Math.atan2(z, x);
    ring.rotation.y = angle + Math.PI/2; // Rotate to face center
    ring.rotation.x = Math.PI/2; // Make rings vertical
    
    // Add glow effect as a child of the ring
    const glowGeometry = new THREE.TorusGeometry(8.2, 0.6, 16, 100);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    // No need to set rotation as it will inherit from parent
    ring.add(glow); // Add glow as child of ring
    
    scene.add(ring);
    rings.push(ring);
}

// Create explosion effect
function createExplosion(position) {
    const particleCount = 200; // Increased particle count
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    // Create multiple materials for variety
    const particleMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x00ffff }), // Cyan
        new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Magenta  
        new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow
        new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
        new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
        new THREE.MeshBasicMaterial({ color: 0xff8800 }), // Orange
        new THREE.MeshBasicMaterial({ color: 0x8800ff }), // Purple
    ];
    
    // Create multiple bursts with different timings
    for (let burst = 0; burst < 8; burst++) {
        const burstPosition = position.clone();
        burstPosition.x += (Math.random() - 0.5) * 5;
        burstPosition.y += (Math.random() - 0.5) * 5;
        burstPosition.z += (Math.random() - 0.5) * 5;
        
        for (let i = 0; i < particleCount; i++) {
            // Randomly select material
            const material = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
            const particle = new THREE.Mesh(particleGeometry, material);
            
            particle.position.copy(burstPosition);
            
            // Create spiral-like movement pattern
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.8;
            const speed = 0.4 + Math.random() * 0.6;
            
            particle.userData.velocity = new THREE.Vector3(
                Math.cos(angle) * speed * radius,
                Math.sin(angle) * speed * radius,
                (Math.random() - 0.5) * speed
            );
            
            // Enhanced rotation
            particle.userData.rotationSpeed = new THREE.Vector3(
                Math.random() * 0.4,
                Math.random() * 0.4,
                Math.random() * 0.4
            );
            
            // Random size variation
            const scale = 0.3 + Math.random() * 0.7;
            particle.scale.set(scale, scale, scale);
            
            // Random life and fade rate
            particle.userData.life = 1.0;
            particle.userData.fadeRate = 0.4 + Math.random() * 0.3;
            
            // Add glow effect
            material.transparent = true;
            material.opacity = 0.8;
            
            scene.add(particle);
            particles.push(particle);
        }
    }
}

// Show message function
function showMessage(text, duration = 5000) {
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    currentMessage = text;
    
    if (duration > 0) {
        messageTimeout = setTimeout(() => {
            if (currentMessage === text) {
                messageBox.style.display = 'none';
                currentMessage = null;
            }
        }, duration);
    }
}

// Initialize game objects
createStarfield();

// Create planets with larger spread and size
for (let i = 0; i < 8; i++) {
    createPlanet(
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        (Math.random() - 0.5) * 500,
        8 + Math.random() * 12,
        planetMessages[i % planetMessages.length]
    );
}

// Create rings in a path with different colors
const ringColors = [
    0xff0000, // Red
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xff8800, // Orange
    0x8800ff, // Purple
    0xff0088, // Pink
    0x88ff00  // Lime
];

// Create rings in a wider path
for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 100; // Increased from 50 to 100
    createRing(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle) * radius,
        ringColors[i]
    );
}

// Add UI elements
const uiDiv = document.createElement('div');
uiDiv.style.position = 'absolute';
uiDiv.style.top = '10px';
uiDiv.style.left = '10px';
uiDiv.style.color = 'white';
uiDiv.style.fontFamily = 'Arial';
uiDiv.style.fontSize = '20px';
uiDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
uiDiv.style.padding = '10px';
uiDiv.style.borderRadius = '5px';
document.body.appendChild(uiDiv);

// Update UI
function updateUI() {
    if (!gameStarted) {
        uiDiv.textContent = 'Press SPACE to start';
        return;
    }
    
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    uiDiv.textContent = `Time: ${elapsedTime.toFixed(1)}s | Rings: ${ringsCollected}/10`;
}

// Update event listeners
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        if (gameOver) {
            document.body.style.cursor = 'default'; // Show cursor on game over
            location.reload();
            return;
        }
        
        if (!gameStarted) {
            gameStarted = true;
            startTime = Date.now();
            document.body.style.cursor = 'none'; // Hide cursor when game starts
            showMessage("Game Started! Press W to move forward and collect all rings as fast as you can!", 3000);
        }
        
        // Hide current message when space is pressed
        if (currentMessage) {
            messageBox.style.display = 'none';
            currentMessage = null;
            if (messageTimeout) {
                clearTimeout(messageTimeout);
            }
        }
    }
    
    // Only allow movement if game has started
    if (!gameStarted) return;
    
    switch (event.key.toLowerCase()) {
        case 'w':
            moveForward = true;
            break;
        case 's':
            moveBackward = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key.toLowerCase()) {
        case 'w':
            moveForward = false;
            break;
        case 's':
            moveBackward = false;
            break;
    }
});

// Check collisions
function checkCollisions() {
    // Check planet collisions
    for (const planet of planets) {
        const distance = playerShip.position.distanceTo(planet.position);
        if (distance < planet.geometry.parameters.radius + 1) {
            gameOver = true;
            document.body.style.cursor = 'default'; // Show cursor on game over
            showMessage("Game Over! You crashed into a planet. Press SPACE to restart.", 0);
            return;
        }
        
        if (distance < 10) {
            showMessage(planet.userData.message);
        }
    }
    
    // Check ring collisions
    for (const ring of rings) {
        if (!ring.userData.collected) {
            // Get ring's normal vector (direction it's facing)
            const ringNormal = new THREE.Vector3(0, 0, 1);
            ringNormal.applyQuaternion(ring.quaternion);
            
            // Calculate distance from ship to ring's plane
            const ringToShip = new THREE.Vector3().subVectors(playerShip.position, ring.position);
            const distanceToPlane = Math.abs(ringToShip.dot(ringNormal));
            
            // Calculate distance from ship to ring's center in the ring's plane
            const distanceInPlane = ringToShip.length() * Math.sqrt(1 - Math.pow(distanceToPlane / ringToShip.length(), 2));
            
            // Check if ship is close to ring's plane and within ring's radius
            if (distanceToPlane < 2 && distanceInPlane < 8) {
                ring.userData.collected = true;
                ringsCollected++;
                ring.visible = false;
                
                // Create explosion effect
                createExplosion(ring.position);
                
                if (ringsCollected === 10) {
                    gameOver = true;
                    document.body.style.cursor = 'default'; // Show cursor on win
                    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
                    showMessage(`You Win! Time: ${finalTime}s - Press SPACE to restart`, 0);
                } else {
                    showMessage(`Ring collected! ${10 - ringsCollected} rings remaining.`, 2000);
                }
            }
        }
    }
}

// Update the animate function
function animate() {
    if (!gameOver) {
        requestAnimationFrame(animate);
        
        // Make sun glow pulse
        const time = Date.now() * 0.001;
        sunGlow.scale.set(
            1 + Math.sin(time) * 0.1,
            1 + Math.sin(time) * 0.1,
            1 + Math.sin(time) * 0.1
        );
        
        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            particle.position.add(particle.userData.velocity);
            
            // Add gravity effect
            particle.userData.velocity.y -= 0.001;
            
            // Update rotation
            particle.rotation.x += particle.userData.rotationSpeed.x;
            particle.rotation.y += particle.userData.rotationSpeed.y;
            particle.rotation.z += particle.userData.rotationSpeed.z;
            
            // Update life and opacity
            particle.userData.life -= particle.userData.fadeRate * 0.016;
            particle.material.opacity = particle.userData.life * 0.8;
            
            // Remove dead particles
            if (particle.userData.life <= 0) {
                scene.remove(particle);
                particles.splice(i, 1);
            }
        }
        
        // Calculate base rotation from mouse position
        let targetPitch = mousePosition.y * maxPitch;
        let targetYaw = mousePosition.x * maxYaw;
        
        // Add continuous rotation when in corners
        if (Math.abs(mousePosition.x) > cornerThreshold) {
            const cornerFactor = (Math.abs(mousePosition.x) - cornerThreshold) / (1 - cornerThreshold);
            targetYaw += Math.sign(mousePosition.x) * cornerRotationSpeed * cornerFactor;
        }
        if (Math.abs(mousePosition.y) > cornerThreshold) {
            const cornerFactor = (Math.abs(mousePosition.y) - cornerThreshold) / (1 - cornerThreshold);
            targetPitch += Math.sign(mousePosition.y) * cornerRotationSpeed * cornerFactor;
        }
        
        // Create quaternions for pitch and yaw
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetPitch);
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetYaw);
        
        // Combine rotations
        const finalQuat = yawQuat.multiply(pitchQuat);
        
        // Apply rotation
        playerShip.quaternion.copy(finalQuat);
        
        // Only apply movement if game has started
        if (gameStarted) {
            // Get ship's forward direction
            const direction = new THREE.Vector3();
            playerShip.getWorldDirection(direction);
            direction.negate();
            
            // Apply acceleration when moving forward or backward
            if (moveForward) {
                velocity.add(direction.multiplyScalar(acceleration));
            }
            if (moveBackward) {
                velocity.add(direction.multiplyScalar(-acceleration));
            }
            
            // Apply deceleration when not moving
            if (!moveForward && !moveBackward) {
                const currentSpeed = velocity.length();
                if (currentSpeed > 0) {
                    const decelVector = velocity.clone().normalize().multiplyScalar(deceleration);
                    velocity.sub(decelVector);
                    
                    // Stop completely if speed is very low
                    if (velocity.length() < deceleration) {
                        velocity.set(0, 0, 0);
                    }
                }
            }
            
            // Limit maximum speed
            if (velocity.length() > maxSpeed) {
                velocity.normalize().multiplyScalar(maxSpeed);
            }
            
            // Apply velocity to position
            playerShip.position.add(velocity);
        }
        
        // Update camera position
        const cameraOffset = new THREE.Vector3(0, 5, 15);
        cameraOffset.applyQuaternion(playerShip.quaternion);
        camera.position.copy(playerShip.position).add(cameraOffset);
        camera.lookAt(playerShip.position);
        
        // Update UI
        updateUI();
        
        checkCollisions();
    }
    
    renderer.render(scene, camera);
}

// Start the game
animate();

// Show initial game rules
showMessage("Welcome to Space Race!\n\nRules:\n- Collect all 10 rings\n- Avoid planets\n- Press W to move forward\n- Use mouse to steer\n- Press SPACE to start", 0);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 