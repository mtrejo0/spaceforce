import * as THREE from 'three';

// Game state
let gameOver = false;
const planets = [];
const rings = [];
const bullets = [];
const stars = [];
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

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

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
const maxYaw = Math.PI*1.25; // 180 degrees

// Add mouse move handler
document.addEventListener('mousemove', (event) => {
    if (gameOver) return;
    
    // Calculate mouse position relative to center of screen (-1 to 1)
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -((event.clientY / window.innerHeight) * 2 - 1);
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
function createRing(x, y, z) {
    const ringGeometry = new THREE.TorusGeometry(8, 0.4, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(x, y, z);
    ring.userData.collected = false;
    
    // Make rings face each other by rotating them
    const angle = Math.atan2(z, x);
    ring.rotation.y = angle + Math.PI/2; // Rotate to face center
    ring.rotation.x = Math.PI/2; // Make rings vertical
    
    scene.add(ring);
    rings.push(ring);
}

// Create explosion effect
function createExplosion(position) {
    const particles = [];
    const particleCount = 50; // Increased particle count
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    
    // Create multiple materials for variety
    const particleMaterials = [
        new THREE.MeshBasicMaterial({ color: 0x00ffff }), // Cyan
        new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Magenta  
        new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow
    ];
    
    for (let i = 0; i < particleCount; i++) {
        // Randomly select material
        const material = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
        const particle = new THREE.Mesh(particleGeometry, material);
        
        particle.position.copy(position);
        
        // Increased velocity range
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4, 
            (Math.random() - 0.5) * 0.4
        );
        
        // Random rotation
        particle.userData.rotationSpeed = new THREE.Vector3(
            Math.random() * 0.2,
            Math.random() * 0.2,
            Math.random() * 0.2
        );
        
        // Random size variation
        const scale = 0.8 + Math.random() * 0.4;
        particle.scale.set(scale, scale, scale);
        
        particle.userData.life = 1.0;
        particle.userData.fadeRate = 0.8 + Math.random() * 0.4; // Random fade rate
        
        scene.add(particle);
        particles.push(particle);
    }
    
    return particles;
}

// Add HTML elements for game over and messages
const gameOverDiv = document.createElement('div');
gameOverDiv.id = 'gameOver';
gameOverDiv.style.position = 'absolute';
gameOverDiv.style.top = '50%';
gameOverDiv.style.left = '50%';
gameOverDiv.style.transform = 'translate(-50%, -50%)';
gameOverDiv.style.color = 'white';
gameOverDiv.style.fontFamily = 'Arial';
gameOverDiv.style.fontSize = '32px';
gameOverDiv.style.display = 'none';
document.body.appendChild(gameOverDiv);

const messageDiv = document.createElement('div');
messageDiv.id = 'message';
messageDiv.style.position = 'absolute';
messageDiv.style.top = '50%';
messageDiv.style.left = '50%';
messageDiv.style.transform = 'translate(-50%, -50%)';
messageDiv.style.color = 'white';
messageDiv.style.fontFamily = 'Arial';
messageDiv.style.fontSize = '24px';
messageDiv.style.display = 'none';
document.body.appendChild(messageDiv);

// Initialize game objects
createStarfield();

// Create planets with larger spread
for (let i = 0; i < 8; i++) {
    createPlanet(
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300,
        (Math.random() - 0.5) * 300,
        3 + Math.random() * 5,
        planetMessages[i % planetMessages.length]
    );
}

// Create rings in a path
for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const radius = 50;
    createRing(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle) * radius
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
document.body.appendChild(uiDiv);

// Update UI
function updateUI() {
    if (!gameStarted) {
        uiDiv.textContent = 'Press W to start';
        return;
    }
    
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;
    uiDiv.textContent = `Rings: ${ringsCollected}/10 | Time: ${elapsedTime.toFixed(1)}s`;
}

// Update event listeners
document.addEventListener('keydown', (event) => {
    if (gameOver && event.key === 'r') {
        location.reload();
        return;
    }
    
    if (!gameStarted && event.key.toLowerCase() === 'w') {
        gameStarted = true;
        startTime = Date.now();
    }
    
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
            document.getElementById('gameOver').style.display = 'block';
            document.getElementById('gameOver').textContent = 'GAME OVER - Press R to restart';
            return;
        }
        
        if (distance < 10) {
            document.getElementById('message').style.display = 'block';
            document.getElementById('message').textContent = planet.userData.message;
        } else {
            document.getElementById('message').style.display = 'none';
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
                const explosionParticles = createExplosion(ring.position);
                setTimeout(() => {
                    explosionParticles.forEach(particle => scene.remove(particle));
                }, 1000);
                
                if (ringsCollected === 10) {
                    gameOver = true;
                    const finalTime = ((Date.now() - startTime) / 1000).toFixed(1);
                    document.getElementById('gameOver').style.display = 'block';
                    document.getElementById('gameOver').textContent = `You Win! Time: ${finalTime}s - Press R to restart`;
                }
            }
        }
    }
}

// Update the animate function
function animate() {
    if (!gameOver) {
        requestAnimationFrame(animate);
        
        // Calculate target rotation based on mouse position
        const targetPitch = mousePosition.y * maxPitch;
        const targetYaw = mousePosition.x * maxYaw;
        
        // Create quaternions for pitch and yaw
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), targetPitch);
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetYaw);
        
        // Combine rotations
        const finalQuat = yawQuat.multiply(pitchQuat);
        
        // Apply rotation
        playerShip.quaternion.copy(finalQuat);
        
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

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 