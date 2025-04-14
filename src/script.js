import * as THREE from "three";
import { Airplane, Sea, Sky, createLights } from "./objects.js";

window.addEventListener("load", init, false);

function init() { 
    const { scene, camera, renderer } = createScene(); 
    const { hemisphereLight, shadowLight } = createLights();
    const container = document.getElementById("world");

    // Create and add game objects
    const airplane = new Airplane();
    airplane.mesh.scale.set(0.25, 0.25, 0.25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);

    const sea = new Sea();
    sea.mesh.position.y = -600; // Position below the horizon
    scene.add(sea.mesh);

    const sky = new Sky();
    sky.mesh.position.y = -600; // Align sky with the sea level
    scene.add(sky.mesh);

    scene.add(hemisphereLight);
    scene.add(shadowLight);

    // Start the animation loop
    loop({ scene, camera, renderer, airplane, sea, sky });
    
    handleWindowResize({ renderer, camera });
    window.addEventListener("resize", () => {
        handleWindowResize({ renderer, camera });
    }, false);
    
    container.appendChild(renderer.domElement);
}

function createScene() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // Create the main scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950); // Add fog for depth effect

    // Create the camera
    const aspectRatio = windowWidth / windowHeight;
    const fieldOfView = 60; // degrees
    const nearPlane = 1;
    const farPlane = 10000;
    const camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );
    camera.position.set(0, 100, 200); // Position the camera

    // Create the renderer
    const renderer = new THREE.WebGLRenderer({
        alpha: true, // Allow transparency for CSS background
        antialias: true, // Smooth edges
    });
    renderer.setSize(windowWidth, windowHeight);
    renderer.shadowMap.enabled = true; // Enable shadows

    return { scene, camera, renderer };
}

function handleWindowResize({ renderer, camera }) {
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;

  renderer.setSize(windowWidth, windowHeight);
  camera.aspect = windowWidth / windowHeight;
  camera.updateProjectionMatrix();
}

// Main animation loop
function loop({ scene, camera, renderer, airplane, sea, sky }) {
    // Animate objects
    if (airplane && airplane.propeller) {
      airplane.propeller.rotation.x += 0.3;
    }
    sea.mesh.rotation.z += 0.005; // Rotate sea for movement illusion
    sky.mesh.rotation.z += 0.01; // Rotate sky slightly faster

    // Render the scene
    renderer.render(scene, camera);

    // Request the next frame
    requestAnimationFrame(() => loop({ scene, camera, renderer, airplane, sea, sky }));
}
