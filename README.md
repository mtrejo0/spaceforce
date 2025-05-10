# Space Shooter Game

A 3D space shooter game built with Three.js where you pilot a spaceship through a universe filled with planets and enemy ships.

## Features

- 3D space environment with planets and enemy ships
- Mouse-controlled ship orientation
- Arrow keys for movement
- Space bar to shoot
- Planet messages when approaching
- Enemy ships that chase and attack you
- Collision detection with planets and enemy ships

## Controls

- **Mouse**: Control ship orientation
- **Up Arrow**: Move forward
- **Down Arrow**: Move backward
- **Left Arrow**: Strafe left
- **Right Arrow**: Strafe right
- **Space**: Shoot

## Installation

1. Make sure you have Node.js installed on your system
2. Clone this repository
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the URL shown in the terminal (usually http://localhost:5173)

## Game Rules

- Avoid colliding with planets
- Shoot enemy ships to destroy them
- New enemy ships will spawn when you destroy existing ones
- Get close to planets to read their messages
- The game ends if you crash into a planet

## Technologies Used

- Three.js for 3D rendering
- Vite for development and building 