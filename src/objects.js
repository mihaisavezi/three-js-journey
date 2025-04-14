import * as THREE from "three";

// Shared Colors
export const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

// --- Airplane Class ---
export class Airplane {
  constructor() {
    this.mesh = new THREE.Object3D(); // Main container
    this.propeller = null; // Will hold the propeller mesh

    this._createCockpit();
    this._createEngine();
    this._createTail();
    this._createWing();
    this._createPropeller();
  }

  _createCockpit() {
    const geom = new THREE.BoxGeometry(60, 50, 50, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: Colors.red, flatShading: true });
    const cockpit = new THREE.Mesh(geom, mat);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);
  }

  _createEngine() {
    const geom = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: Colors.white, flatShading: true });
    const engine = new THREE.Mesh(geom, mat);
    engine.position.x = 40; // Position relative to cockpit
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);
  }

  _createTail() {
    const geom = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: Colors.red, flatShading: true });
    const tailPlane = new THREE.Mesh(geom, mat);
    tailPlane.position.set(-35, 25, 0); // Position relative to cockpit
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);
  }

  _createWing() {
    const geom = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: Colors.red, flatShading: true });
    const sideWing = new THREE.Mesh(geom, mat);
    // Wing is centered on the mesh's origin by default
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);
  }

  _createPropeller() {
    // Propeller Hub
    const geomHub = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    const matHub = new THREE.MeshPhongMaterial({ color: Colors.brown, flatShading: true });
    this.propeller = new THREE.Mesh(geomHub, matHub); // Assign to class property
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // Propeller Blade
    const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    const matBlade = new THREE.MeshPhongMaterial({ color: Colors.brownDark, flatShading: true });
    const blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0); // Position relative to hub
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade); // Attach blade to hub

    this.propeller.position.set(50, 0, 0); // Position hub relative to cockpit
    this.mesh.add(this.propeller); // Add propeller assembly to the main mesh
  }
}

// --- Sea Class ---
export class Sea {
  constructor() {
    const geometry = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
    // Rotate the geometry to lie flat
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    const material = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: 0.6,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.receiveShadow = true; // Allow the sea surface to receive shadows
  }
}

// --- Cloud Class (Helper for Sky) ---
class Cloud {
  // Constants for cloud generation
  static BLOCK_OFFSET = 15;
  static POSITION_RANDOM_FACTOR = 10;
  static SCALE_MIN = 0.1;
  static SCALE_RANDOM_FACTOR = 0.9;
  static MIN_BLOCKS = 3;
  static EXTRA_BLOCKS_RANDOM = 3;

  constructor() {
    this.mesh = new THREE.Object3D(); // Container for cloud parts

    const geometry = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshPhongMaterial({ color: Colors.white });

    const numBlocks = Cloud.MIN_BLOCKS + Math.floor(Math.random() * Cloud.EXTRA_BLOCKS_RANDOM);

    for (let i = 0; i < numBlocks; i++) {
      const block = new THREE.Mesh(geometry, material);

      // Set random position and rotation for each block
      block.position.x = i * Cloud.BLOCK_OFFSET;
      block.position.y = Math.random() * Cloud.POSITION_RANDOM_FACTOR;
      block.position.z = Math.random() * Cloud.POSITION_RANDOM_FACTOR;
      block.rotation.z = Math.random() * Math.PI * 2;
      block.rotation.y = Math.random() * Math.PI * 2;

      // Set random scale
      const scale = Cloud.SCALE_MIN + Math.random() * Cloud.SCALE_RANDOM_FACTOR;
      block.scale.set(scale, scale, scale);

      block.castShadow = true;
      block.receiveShadow = true;

      this.mesh.add(block);
    }
  }
}

// --- Sky Class ---
export class Sky {
  // Constants for sky generation
  static CLOUD_COUNT = 20;
  static BASE_RADIUS = 750;
  static RADIUS_RANDOM_FACTOR = 200;
  static Z_BASE_POSITION = -400;
  static Z_RANDOM_FACTOR = 400;
  static SCALE_BASE = 1;
  static SCALE_RANDOM_FACTOR = 2;

  constructor() {
    this.mesh = new THREE.Object3D(); // Container for all clouds

    const stepAngle = (Math.PI * 2) / Sky.CLOUD_COUNT;

    for (let i = 0; i < Sky.CLOUD_COUNT; i++) {
      const cloud = new Cloud();

      // Calculate position using polar coordinates converted to Cartesian
      const angle = stepAngle * i;
      const radius = Sky.BASE_RADIUS + Math.random() * Sky.RADIUS_RANDOM_FACTOR;

      cloud.mesh.position.y = Math.sin(angle) * radius;
      cloud.mesh.position.x = Math.cos(angle) * radius;

      // Rotate the cloud to generally face the center
      cloud.mesh.rotation.z = angle + Math.PI / 2;

      // Randomize depth
      cloud.mesh.position.z = Sky.Z_BASE_POSITION - Math.random() * Sky.Z_RANDOM_FACTOR;

      // Randomize scale
      const scale = Sky.SCALE_BASE + Math.random() * Sky.SCALE_RANDOM_FACTOR;
      cloud.mesh.scale.set(scale, scale, scale);

      this.mesh.add(cloud.mesh);
    }
  }
}

// --- Lights Function ---
export function createLights() {
  // Hemisphere light: gradient from sky to ground
  const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

  // Directional light: simulates the sun
  const shadowLight = new THREE.DirectionalLight(0xffffff, 0.9);
  shadowLight.position.set(150, 350, 350);
  shadowLight.castShadow = true;

  // Define the shadow projection area
  shadowLight.shadow.camera.left = -400;
  shadowLight.shadow.camera.right = 400;
  shadowLight.shadow.camera.top = 400;
  shadowLight.shadow.camera.bottom = -400;
  shadowLight.shadow.camera.near = 1;
  shadowLight.shadow.camera.far = 1000;

  // Define shadow map resolution
  shadowLight.shadow.mapSize.width = 2048;
  shadowLight.shadow.mapSize.height = 2048;


  return { hemisphereLight, shadowLight };
}
