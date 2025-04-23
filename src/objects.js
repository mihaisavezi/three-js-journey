import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
// Shared Colors
export const Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xf5986e,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
};

const metalMaterial = new THREE.MeshStandardMaterial({
  color: 0x222222,
  flatShading: true,
  roughness: 0.5,
  metalness: 1.0,
});

class SimpleGun {
  static createMesh() {
    const BODY_RADIUS = 3;
    const BODY_LENGTH = 20;

    const full = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_LENGTH),
      metalMaterial
    );
    body.rotation.z = Math.PI / 2;
    full.add(body);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(BODY_RADIUS / 2, BODY_RADIUS / 2, BODY_LENGTH),
      metalMaterial
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.x = BODY_LENGTH;
    full.add(barrel);

    return full;
  }

  downtime() {
    return 0.1;
  }

  damage() {
    return 1;
  }

  shoot(direction) {
    const BULLET_SPEED = 0.5;
    const RECOIL_DISTANCE = 4;
    const RECOIL_DURATION = this.downtime() / 1.5;

    const position = new THREE.Vector3();
    this.mesh.getWorldPosition(position);
    position.add(new THREE.Vector3(5, 0, 0));
    spawnProjectile(this.damage(), position, direction, BULLET_SPEED, 0.3, 3);

    // Little explosion at exhaust
    spawnParticles(
      position.clone().add(new THREE.Vector3(2, 0, 0)),
      1,
      Colors.orange,
      0.2
    );

    // Recoil of gun
    const initialX = this.mesh.position.x;
    TweenMax.to(this.mesh.position, {
      duration: RECOIL_DURATION,
      x: initialX - RECOIL_DISTANCE,
      onComplete: () => {
        TweenMax.to(this.mesh.position, {
          duration: RECOIL_DURATION,
          x: initialX,
        });
      },
    });
  }
}

// --- Airplane Class ---
export class Airplane {
  constructor() {
    this.mesh = new THREE.Object3D(); // Main container
    this.propeller = null; // Will hold the propeller mesh

    // Create all airplane parts
    this._createCockpit();
    this._createEngine();
    this._createTail();
    this._createWing();
    this._createPropeller();

    this.pilot = new Pilot();
    this.pilot.mesh.position.set(-10, 27, 0);
    this.mesh.add(this.pilot.mesh);
    this.weapon = new SimpleGun();
  }

  shoot() {
    if (!this.weapon) {
      return;
    }

    // rate-limit shooting
    const nowTime = new Date().getTime() / 1000;
    if (nowTime - this.lastShot < this.weapon.downtime()) {
      return;
    }
    this.lastShot = nowTime;

    // fire the shot
    let direction = new THREE.Vector3(10, 0, 0);
    direction.applyEuler(airplane.mesh.rotation);
    this.weapon.shoot(direction);

    // recoil airplane
    const recoilForce = this.weapon.damage();
    TweenMax.to(this.mesh.position, {
      duration: 0.05,
      x: this.mesh.position.x - recoilForce,
    });
  }

  _createCockpit() {
    // Cockpit
    const geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);

    // Modern material (flatShading instead of shading:THREE.FlatShading)
    const matCockpit = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });

    // In modern Three.js, vertices are stored in BufferGeometry's position attribute
    // We need to make a copy we can modify
    const position = geomCockpit.getAttribute("position");

    transformMatchingVertices(
      geomCockpit,
      { x: -40, y: 25, z: -25 }, // Match criteria
      { y: (value) => value - 10, z: (value) => value + 20 } // New values
    );

    transformMatchingVertices(
      geomCockpit,
      { x: -40, y: 25, z: 25 }, // Match criteria
      { y: (value) => value - 10, z: (value) => value - 20 } // New values
    );

    transformMatchingVertices(
      geomCockpit,
      { x: -40, y: -25, z: -25 }, // Match criteria
      { y: (value) => value + 30, z: (value) => value + 20 } // New values
    );

    transformMatchingVertices(
      geomCockpit,
      { x: -40, y: -25, z: -25 }, // Match criteria
      { y: (value) => value + 30, z: (value) => value - 20 } // New values
    );

    /**
     * Updates vertices matching criteria with flexible transformations
     *
     * @param {THREE.BufferGeometry} geometry - Geometry to modify
     * @param {Object} matchCriteria - {x, y, z} to match (values or functions)
     * @param {Object} transformations - {x, y, z} as values/functions to apply
     * @param {number} [tolerance=0.001] - Match precision
     * @returns {number} Number of modified vertices
     */
    function transformMatchingVertices(
      geometry,
      matchCriteria,
      transformations,
      tolerance = 0.001
    ) {
      const posAttr = geometry.getAttribute("position");
      let modifiedCount = 0;

      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);

        // Check match criteria
        const matches = Object.entries(matchCriteria).every(([axis, value]) => {
          const current = { x, y, z }[axis];
          if (typeof value === "function") {
            return value(current, { x, y, z });
          }
          return Math.abs(current - value) <= tolerance;
        });

        if (!matches) continue;

        // Apply transformations
        let newX = x;
        let newY = y;
        let newZ = z;

        Object.entries(transformations).forEach(([axis, transform]) => {
          const current = { x, y, z }[axis];
          let newVal;
          if (typeof transform === "function") {
            newVal = transform(current, { x, y, z });
          } else {
            newVal = current + transform;
          }
          // Assign to the correct variable
          if (axis === "x") newX = newVal;
          else if (axis === "y") newY = newVal;
          else if (axis === "z") newZ = newVal;
        });

        // Update positions
        if (newX !== x) posAttr.setX(i, newX);
        if (newY !== y) posAttr.setY(i, newY);
        if (newZ !== z) posAttr.setZ(i, newZ);

        modifiedCount++;
      }

      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      return modifiedCount;
    }

    const cockpit = new THREE.Mesh(geomCockpit, matCockpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);
  }

  _createEngine() {
    const geom = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.white,
      flatShading: true,
    });

    const engine = new THREE.Mesh(geom, mat);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);
  }

  _createTail() {
    const geom = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });

    const tailPlane = new THREE.Mesh(geom, mat);
    tailPlane.position.set(-35, 25, 0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);
  }

  _createWing() {
    const geom = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.red,
      flatShading: true,
    });

    const sideWing = new THREE.Mesh(geom, mat);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);
  }

  _createPropeller() {
    // Propeller Hub
    const geomHub = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    const matHub = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });

    this.propeller = new THREE.Mesh(geomHub, matHub);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;

    // Propeller Blade
    const geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    const matBlade = new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
      flatShading: true,
    });

    const blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8, 0, 0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);

    this.propeller.position.set(50, 0, 0);
    this.mesh.add(this.propeller);
  }
}
export class Sea {
  constructor() {
    // Create cylinder geometry (rotated to horizontal)
    const geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);
    console.log("Original vertex count:", geom.attributes.position.count);
    geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

    // Merge vertices for wave continuity
    const mergedGeom = BufferGeometryUtils.mergeVertices(geom);
    console.log("Merged vertex count:", mergedGeom.attributes.position.count);

    // Get position attribute
    const posAttr = mergedGeom.getAttribute("position");
    this.positions = new Float32Array(posAttr.array);
    mergedGeom.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );

    // Store wave properties for each vertex
    this.waves = [];
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      this.waves.push({
        x,
        y,
        z,
        ang: Math.random() * Math.PI * 2,
        amp: 5 + Math.random() * 15,
        speed: 0.016 + Math.random() * 0.032,
      });
    }

    // Create material
    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
      transparent: true,
      opacity: 0.8,
      flatShading: true, // Updated from shading: THREE.FlatShading
    });

    this.mesh = new THREE.Mesh(mergedGeom, mat);
    this.mesh.receiveShadow = true;
  }

  moveWaves() {
    const posAttr = this.mesh.geometry.attributes.position;

    for (let i = 0; i < this.waves.length; i++) {
      const vprops = this.waves[i];
      const baseIdx = i * 3;

      // Update positions using wave properties
      const newX = vprops.x + Math.cos(vprops.ang) * vprops.amp;
      const newY = vprops.y + Math.sin(vprops.ang) * vprops.amp;

      this.positions[baseIdx] = newX; // X
      this.positions[baseIdx + 1] = newY; // Y

      vprops.ang += vprops.speed;
    }

    // Update geometry
    posAttr.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
    this.mesh.rotation.z += 0.005;
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
  const ambientLight = new THREE.AmbientLight(0xdc8874, 0.5);

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


  return { hemisphereLight, shadowLight, ambientLight };
}
class Pilot {
  constructor() {
    this.mesh = new THREE.Object3D();
    this.mesh.name = "pilot";
    this.angleHairs = 0;

    // Body
    const bodyGeom = new THREE.BoxGeometry(15, 15, 15);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: Colors.brown,
      flatShading: true,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.set(2, -12, 0);
    this.mesh.add(body);

    // Face
    const faceGeom = new THREE.BoxGeometry(10, 10, 10);
    const faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
    const face = new THREE.Mesh(faceGeom, faceMat);
    this.mesh.add(face);

    // Hair
    const hairGeom = new THREE.BoxGeometry(4, 4, 4);
    const hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
    const baseHair = new THREE.Mesh(hairGeom, hairMat);
    baseHair.geometry.applyMatrix4(
      new THREE.Matrix4().makeTranslation(0, 2, 0)
    );

    this.hairsTop = new THREE.Object3D();

    // Create 3x4 grid of hairs
    for (let i = 0; i < 12; i++) {
      const h = baseHair.clone();
      const col = i % 3;
      const row = Math.floor(i / 3);
      h.position.set(-4 + row * 4, 0, -4 + col * 4);
      this.hairsTop.add(h);
    }

    // Side hairs
    const hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
    hairSideGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6, 0, 0));

    const hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
    const hairSideL = hairSideR.clone();
    hairSideR.position.set(8, -2, 6);
    hairSideL.position.set(8, -2, -6);

    // Back hair
    const hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
    const hairBack = new THREE.Mesh(hairBackGeom, hairMat);
    hairBack.position.set(-1, -4, 0);

    // Combine all hair parts
    const hairs = new THREE.Object3D();
    hairs.add(this.hairsTop, hairSideR, hairSideL, hairBack);
    hairs.position.set(-5, 5, 0);
    this.mesh.add(hairs);

    // Glasses
    const glassGeom = new THREE.BoxGeometry(5, 5, 5);
    const glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });

    const glassR = new THREE.Mesh(glassGeom, glassMat);
    glassR.position.set(6, 0, 3);

    const glassL = glassR.clone();
    glassL.position.z = -glassR.position.z;

    const glassAGeom = new THREE.BoxGeometry(11, 1, 11);
    const glassA = new THREE.Mesh(glassAGeom, glassMat);

    this.mesh.add(glassR, glassL, glassA);

    // Ears
    const earGeom = new THREE.BoxGeometry(2, 3, 2);
    const earL = new THREE.Mesh(earGeom, faceMat);
    earL.position.set(0, 0, -6);

    const earR = earL.clone();
    earR.position.set(0, 0, 6);

    this.mesh.add(earL, earR);
  }

  updateHairs() {
    // Using Array.prototype.forEach for cleaner iteration
    this.hairsTop.children.forEach((hair, index) => {
      hair.scale.y = 0.75 + Math.cos(this.angleHairs + index / 3) * 0.25;
    });

    this.angleHairs += 0.16;
  }
}
