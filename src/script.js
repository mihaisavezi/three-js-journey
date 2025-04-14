import * as THREE from "three";
import { Airplane, Sea, Sky, createLights } from "./objects.js";

window.addEventListener("load", init, false);

function init() {
  // 1. Set up the core scene, camera, and renderer
  createScene();

  // 2. Add lighting
  const {hemisphereLight, shadowLight} = createLights();

  // 3. Create and add game objects
  airplane = new Airplane();
  airplane.mesh.scale.set(0.25, 0.25, 0.25);
  airplane.mesh.position.y = 100;
  scene.add(airplane.mesh);

  sea = new Sea();
  sea.mesh.position.y = -600; // Position below the horizon
  scene.add(sea.mesh);

  sky = new Sky();
  sky.mesh.position.y = -600; // Align sky with the sea level
  scene.add(sky.mesh);

  scene.add(hemisphereLight);
  scene.add(shadowLight);

  // 4. Start the animation loop
  loop();
}

// Scene variables (initialized in createScene)
let scene,
  camera,
  fieldOfView,
  aspectRatio,
  nearPlane,
  farPlane,
  windowHeight, // Renamed from HEIGHT
  windowWidth,  // Renamed from WIDTH
  renderer,
  container;

// Game object variables (initialized in init)
let airplane, sea, sky;

function createScene() {
  // Get window dimensions
  windowHeight = window.innerHeight;
  windowWidth = window.innerWidth;

  // Create the main scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf7d9aa, 100, 950); // Add fog for depth effect

  // Create the camera
  aspectRatio = windowWidth / windowHeight;
  fieldOfView = 60; // degrees
  nearPlane = 1;
  farPlane = 10000;
  camera = new THREE.PerspectiveCamera(
    fieldOfView,
    aspectRatio,
    nearPlane,
    farPlane
  );
  camera.position.set(0, 100, 200); // Position the camera

  // Create the renderer
  renderer = new THREE.WebGLRenderer({
    alpha: true, // Allow transparency for CSS background
    antialias: true, // Smooth edges
  });
  renderer.setSize(windowWidth, windowHeight);
  renderer.shadowMap.enabled = true; // Enable shadows

  // Add the renderer's canvas element to the HTML container
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  // Add listener for window resize events
  window.addEventListener("resize", handleWindowResize, false);
}

// Handles window resize events
function handleWindowResize() {
  windowHeight = window.innerHeight;
  windowWidth = window.innerWidth;

  // Update renderer and camera aspect ratio
  renderer.setSize(windowWidth, windowHeight);
  camera.aspect = windowWidth / windowHeight;
  camera.updateProjectionMatrix(); // Important after changing aspect ratio
}

// Main animation loop
function loop() {
  // Animate objects
  airplane.propeller.rotation.x += 0.3; // Rotate propeller
  sea.mesh.rotation.z += 0.005; // Rotate sea for movement illusion
  sky.mesh.rotation.z += 0.01; // Rotate sky slightly faster

  // Render the scene
  renderer.render(scene, camera);

  // Request the next frame
  requestAnimationFrame(loop);
}
