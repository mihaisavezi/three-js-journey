import * as THREE from 'three';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TweenMax, Power2 } from 'gsap'; // Assuming gsap is available globally or imported elsewhere

export var Colors = {
	red: 0xf25346,
	orange: 0xffa500,
	white: 0xd8d0d1,
	brown: 0x59332e,
	brownDark: 0x23190f,
	pink: 0xF5986E,
	yellow: 0xf4ce93,
	blue: 0x68c3c0,
}

export const COLOR_COINS = 0xFFD700 // 0x009999
export const COLOR_COLLECTIBLE_BUBBLE = COLOR_COINS

export const COLOR_SEA_LEVEL = [
	0x68c3c0,  // hsl(178deg 43% 59%)
	0x47b3af,  // hsl(178deg 43% 49%)
	0x398e8b,  // hsl(178deg 43% 39%)
	0x2a6a68,  // hsl(178deg 43% 29%)
	0x1c4544,  // hsl(178deg 43% 19%)
	0x0d2120,  // hsl(178deg 43% 09%)
]

export const utils = {
	normalize: function (v, vmin, vmax, tmin, tmax) {
		var nv = Math.max(Math.min(v,vmax), vmin)
		var dv = vmax-vmin
		var pc = (nv-vmin)/dv
		var dt = tmax-tmin
		var tv = tmin + (pc*dt)
		return tv
	},

	findWhere: function (list, properties) {
		for (const elem of list) {
			let all = true
			for (const key in properties) {
				if (elem[key] !== properties[key]) {
					all = false
					break
				}
			}
			if (all) {
				return elem
			}
		}
		return null
	},

	randomOneOf: function (choices) {
		return choices[Math.floor(Math.random() * choices.length)]
	},

	randomFromRange: function (min, max) {
		return min + Math.random() * (max - min)
	},

	collide: function (mesh1, mesh2, tolerance) {
		const diffPos = mesh1.position.clone().sub(mesh2.position.clone())
		const d = diffPos.length()
		return d < tolerance
	},

	makeTetrahedron: function (a, b, c, d) {
		return [
			a[0], a[1], a[2],
			b[0], b[1], b[2],
			c[0], c[1], c[2],
			b[0], b[1], b[2],
			c[0], c[1], c[2],
			d[0], d[1], d[2],
		]
	}
}

// Assuming scene, game, world, ui, audioManager, modelManager, allProjectiles are imported or globally available
// For now, I will assume they are globally available or imported in game.js and passed where needed.
// If they are not globally available, the classes will need to accept them as constructor arguments or through other means.

// Need to import scene, game, world, ui, audioManager, modelManager, allProjectiles from game.js or make them global
// For now, assuming they are accessible. If not, further refactoring will be needed.

// Forward declaration for Airplane, Collectible, Projectile, etc. if needed for type hinting or circular dependencies
// In JavaScript, class declarations are hoisted, so this might not be strictly necessary for basic usage,
// but it's good practice to be aware of dependencies.

// Assuming spawnProjectile, addLife, removeLife are defined in game.js and called from here.
// If they are also to be moved, they should be included here and exported.
// For now, I will assume they remain in game.js and are accessible.

export function createAirplaneMesh(Colors, utils, Pilot) {
	const mesh = new THREE.Object3D()

	// Cabin
	var matCabin = new THREE.MeshPhongMaterial({color: Colors.red, flatShading: true, side: THREE.DoubleSide})

	const frontUR = [ 40,  25, -25]
	const frontUL = [ 40,  25,  25]
	const frontLR = [ 40, -25, -25]
	const frontLL = [ 40, -25,  25]
	const backUR  = [-40,  15,  -5]
	const backUL  = [-40,  15,   5]
	const backLR  = [-40,   5,  -5]
	const backLL  = [-40,   5,   5]

	const vertices = new Float32Array(
		utils.makeTetrahedron(frontUL, frontUR, frontLL, frontLR).concat(   // front
		utils.makeTetrahedron(backUL, backUR, backLL, backLR)).concat(      // back
		utils.makeTetrahedron(backUR, backLR, frontUR, frontLR)).concat(    // side
		utils.makeTetrahedron(backUL, backLL, frontUL, frontLL)).concat(    // side
		utils.makeTetrahedron(frontUL, backUL, frontUR, backUR)).concat(    // top
		utils.makeTetrahedron(frontLL, backLL, frontLR, backLR))            // bottom
	)
	const geomCabin = new THREE.BufferGeometry()
	geomCabin.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

	var cabin = new THREE.Mesh(geomCabin, matCabin)
	cabin.castShadow = true
	cabin.receiveShadow = true
	mesh.add(cabin)

	// Engine

	var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
	var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, flatShading:true,});
	var engine = new THREE.Mesh(geomEngine, matEngine);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	engine.position.x = 50;
	engine.castShadow = true;
	engine.receiveShadow = true;
	mesh.add(engine);

	// Tail Plane
	var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
	var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true,});
	var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	tailPlane.position.set(-40,20,0);
	tailPlane.castShadow = true;
	tailPlane.receiveShadow = true;
	mesh.add(tailPlane);

	// Wings

	var geomSideWing = new THREE.BoxGeometry(30,5,120,1,1,1);
	var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true,});
	var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	sideWing.position.set(0,15,0);
	sideWing.castShadow = true;
	sideWing.receiveShadow = true;
	mesh.add(sideWing);

	var geomWindshield = new THREE.BoxGeometry(3,15,20,1,1,1);
	var matWindshield = new THREE.MeshPhongMaterial({color:Colors.white,transparent:true, opacity:.3, flatShading:true,});;
	var windshield = new THREE.Mesh(geomWindshield, matWindshield);
	windshield.position.set(20,27,0);

	windshield.castShadow = true;
	windshield.receiveShadow = true;

	mesh.add(windshield);

	var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
	geomPropeller.attributes.position.array[4*3+1] -= 5
	geomPropeller.attributes.position.array[4*3+2] += 5
	geomPropeller.attributes.position.array[5*3+1] -= 5
	geomPropeller.attributes.position.array[5*3+2] -= 5
	geomPropeller.attributes.position.array[6*3+1] += 5
	geomPropeller.attributes.position.array[6*3+2] += 5
	geomPropeller.attributes.position.array[7*3+1] += 5
	geomPropeller.attributes.position.array[7*3+2] -= 5
	var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true,});
	const propeller = new THREE.Mesh(geomPropeller, matPropeller);

	propeller.castShadow = true;
	propeller.receiveShadow = true;

	var geomBlade = new THREE.BoxGeometry(1,80,10,1,1,1);
	var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true,});
	var blade1 = new THREE.Mesh(geomBlade, matBlade);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	blade1.position.set(8,0,0);

	blade1.castShadow = true;
	blade1.receiveShadow = true;

	var blade2 = blade1.clone();
	blade2.rotation.x = Math.PI/2;

	blade2.castShadow = true;
	blade2.receiveShadow = true;

	propeller.add(blade1);
	propeller.add(blade2);
	propeller.position.set(60,0,0);
	mesh.add(propeller);

	var wheelProtecGeom = new THREE.BoxGeometry(30,15,10,1,1,1);
	var wheelProtecMat = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true,});
	var wheelProtecR = new THREE.Mesh(wheelProtecGeom,wheelProtecMat);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	wheelProtecR.position.set(25,-20,25);
	mesh.add(wheelProtecR);

	var wheelTireGeom = new THREE.BoxGeometry(24,24,4);
	var wheelTireMat = new THREE.MeshPhongMaterial({color:Colors.brownDark, flatShading:true,});
	var wheelTireR = new THREE.Mesh(wheelTireGeom,wheelTireMat);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	wheelTireR.position.set(25,-28,25);

	var wheelAxisGeom = new THREE.BoxGeometry(10,10,6);
	var wheelAxisMat = new THREE.MeshPhongMaterial({color:Colors.brown, flatShading:true,});
	var wheelAxis = new THREE.Mesh(wheelAxisGeom,wheelAxisMat);
	wheelTireR.add(wheelAxis);

	mesh.add(wheelTireR);

	var wheelProtecL = wheelProtecR.clone();
	wheelProtecL.position.z = -wheelProtecR.position.z ;
	mesh.add(wheelProtecL);

	var wheelTireL = wheelTireR.clone();
	wheelTireL.position.z = -wheelTireR.position.z;
	mesh.add(wheelTireL);

	var wheelTireB = wheelTireR.clone();
	wheelTireB.scale.set(.5,.5,.5);
	//Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ
	wheelTireB.position.set(-35,-5,0);
	mesh.add(wheelTireB);

	var suspensionGeom = new THREE.BoxGeometry(4,20,4);
	suspensionGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(0,10,0))
	var suspensionMat = new THREE.MeshPhongMaterial({color:Colors.red, flatShading:true,});
	var suspension = new THREE.Mesh(suspensionGeom,suspensionMat);
	suspension.position.set(-35,-5,0);
	suspension.rotation.z = -.3;
	mesh.add(suspension)

	const pilot = new Pilot(Colors)
	pilot.mesh.position.set(5,27,0)
	mesh.add(pilot.mesh)

	mesh.castShadow = true
	mesh.receiveShadow = true

	return [mesh, propeller, pilot]
}


export function rotateAroundSea(object, deltaTime, speed, world, game) { // Added game
	object.angle += deltaTime * game.speed * world.collectiblesSpeed // Use passed game
	if (object.angle > Math.PI*2) {
		object.angle -= Math.PI*2
	}
	object.mesh.position.x = Math.cos(object.angle) * object.distance
	object.mesh.position.y = -world.seaRadius + Math.sin(object.angle) * object.distance
}


export function spawnParticles(pos, count, color, scale, scene) {
	for (let i=0; i<count; i++) {
		const geom = new THREE.TetrahedronGeometry(3, 0)
		const mat = new THREE.MeshPhongMaterial({
			color: 0x009999,
			shininess: 0,
			specular: 0xffffff,
			flatShading: true,
		})
		const mesh = new THREE.Mesh(geom, mat)
		scene.add(mesh)

		mesh.visible = true
		mesh.position.copy(pos)
		mesh.material.color = new THREE.Color(color)
		mesh.material.needsUpdate = true
		mesh.scale.set(scale, scale, scale)
		const targetX = pos.x + (-1 + Math.random()*2)*50
		const targetY = pos.y + (-1 + Math.random()*2)*50
		const targetZ = pos.z + (-1 + Math.random()*2)*50
		const speed = 0.6 + Math.random()*0.2
		TweenMax.to(mesh.rotation, speed, {x:Math.random()*12, y:Math.random()*12})
		TweenMax.to(mesh.scale, speed, {x:.1, y:.1, z:.1})
		TweenMax.to(mesh.position, speed, {x:targetX, y:targetY, z: targetZ, delay:Math.random() *.1, ease:Power2.easeOut, onComplete: () => {
			scene.remove(mesh)
		}})
	}
}

// spawnParticles signature is already correct from previous refactoring steps.

export function spawnProjectile(damage, initialPosition, direction, speed, radius, length, sceneManager, allProjectiles, Projectile) { // Added Projectile
	allProjectiles.push(new Projectile(damage, initialPosition, direction, speed, radius, length, sceneManager, allProjectiles)) // Use passed Projectile
}


export function spawnSimpleGunCollectible(Collectible, SimpleGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) { // Added dependencies
	const gun = SimpleGun.createMesh()
	gun.scale.set(0.25, 0.25, 0.25)
	gun.position.x = -2

	new Collectible(gun, () => {
		airplane.equipWeapon(new SimpleGun())
	}, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) // Pass dependencies
}


export function spawnBetterGunCollectible(Collectible, BetterGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) { // Added dependencies
	const gun = BetterGun.createMesh()
	gun.scale.set(0.25, 0.25, 0.25)
	gun.position.x = -7

	new Collectible(gun, () => {
		airplane.equipWeapon(new BetterGun())
	}, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) // Pass dependencies
}


export function spawnDoubleGunCollectible(Collectible, SimpleGun, DoubleGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) { // Added dependencies
	const guns = new THREE.Group()

	const gun1 = SimpleGun.createMesh()
	gun1.scale.set(0.25, 0.25, 0.25)
	gun1.position.x = -2
	gun1.position.y = -2
	guns.add(gun1)

	const gun2 = SimpleGun.createMesh()
	gun2.scale.set(0.25, 0.25, 0.25)
	gun2.position.x = -2
	gun2.position.y = 2
	guns.add(gun2)

	new Collectible(guns, () => {
		airplane.equipWeapon(new DoubleGun(SimpleGun)) // Pass SimpleGun to DoubleGun constructor if needed
	}, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) // Pass dependencies
}


export function spawnLifeCollectible(Collectible, modelManager, addLife, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) { // Added dependencies
	const heart = modelManager.get('heart')
	heart.traverse(function (child) {
		if (child instanceof THREE.Mesh) {
			child.material.color.setHex(0xFF0000)
		}
	})
	heart.position.set(0, -1, -3)
	heart.scale.set(5, 5, 5)

	new Collectible(heart, () => {
		addLife()
	}, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) // Pass dependencies
}


export function spawnEnemies(count, Enemy, world, game, Colors, sceneManager) { // Added Colors, sceneManager
	for (let i=0; i<count; i++) {
		const enemy = new Enemy(Colors, sceneManager) // Pass dependencies
		enemy.angle = - (i*0.1)
		enemy.distance = world.seaRadius + world.planeDefaultHeight + (-1 + Math.random() * 2) * (world.planeAmpHeight-20)
		enemy.mesh.position.x = Math.cos(enemy.angle) * enemy.distance
		enemy.mesh.position.y = -world.seaRadius + Math.sin(enemy.angle)*enemy.distance
	}
	game.statistics.enemiesSpawned += count
}


export function spawnCoins(Coin, world, utils, addCoin, audioManager, sceneManager, spawnParticles, COLOR_COINS, game, scene) { // Added game, scene
	const nCoins = 1 + Math.floor(Math.random()*10)
	const d = world.seaRadius + world.planeDefaultHeight + utils.randomFromRange(-1,1) * (world.planeAmpHeight-20)
	const amplitude = 10 + Math.round(Math.random()*10)
	for (let i=0; i<nCoins; i++) {
		const coin = new Coin(COLOR_COINS, sceneManager) // Pass dependencies
		coin.angle = - (i*0.02)
		coin.distance = d + Math.cos(i*0.5)*amplitude
		coin.mesh.position.y = -world.seaRadius + Math.sin(coin.angle)*coin.distance
		coin.mesh.position.x = Math.cos(coin.angle) * coin.distance
	}
	game.statistics.coinsSpawned += nCoins
}


export class Pilot {
	constructor(Colors) {
		this.mesh = new THREE.Object3D()
		this.angleHairs = 0

		var bodyGeom = new THREE.BoxGeometry(15,15,15)
		var bodyMat = new THREE.MeshPhongMaterial({
			color: Colors.brown,
			flatShading: true,
		})
		var body = new THREE.Mesh(bodyGeom, bodyMat)
		body.position.set(2, -12, 0)
		this.mesh.add(body)

		var faceGeom = new THREE.BoxGeometry(10,10,10)
		var faceMat = new THREE.MeshLambertMaterial({color: Colors.pink})
		var face = new THREE.Mesh(faceGeom, faceMat)
		this.mesh.add(face)

		var hairGeom = new THREE.BoxGeometry(4,4,4)
		var hairMat = new THREE.MeshLambertMaterial({color:Colors.brown})
		var hair = new THREE.Mesh(hairGeom, hairMat)
		hair.geometry.applyMatrix4(new THREE.Matrix4().makeTranslation(0,2,0))
		var hairs = new THREE.Object3D()

		this.hairsTop = new THREE.Object3D()

		for (var i=0; i<12; i++) {
			var h = hair.clone();
			var col = i%3;
			var row = Math.floor(i/3);
			var startPosZ = -4;
			var startPosX = -4;
			h.position.set(startPosX + row*4, 0, startPosZ + col*4);
			h.geometry.applyMatrix4(new THREE.Matrix4().makeScale(1,1,1));
			this.hairsTop.add(h);
		}
		hairs.add(this.hairsTop);

		var hairSideGeom = new THREE.BoxGeometry(12,4,2);
		hairSideGeom.applyMatrix4(new THREE.Matrix4().makeTranslation(-6,0,0));
		var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
		var hairSideL = hairSideR.clone();
		hairSideR.position.set(8,-2,6);
		hairSideL.position.set(8,-2,-6);
		hairs.add(hairSideR);
		hairs.add(hairSideL);

		var hairBackGeom = new THREE.BoxGeometry(2,8,10);
		var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
		hairBack.position.set(-1,-4,0)
		hairs.add(hairBack);
		hairs.position.set(-5,5,0);

		this.mesh.add(hairs);

		var glassGeom = new THREE.BoxGeometry(5,5,5);
		var glassMat = new THREE.MeshLambertMaterial({color:Colors.brown});
		var glassR = new THREE.Mesh(glassGeom,glassMat);
		glassR.position.set(6,0,3);
		var glassL = glassR.clone();
		glassL.position.z = -glassR.position.z

		var glassAGeom = new THREE.BoxGeometry(11,1,11);
		var glassA = new THREE.Mesh(glassAGeom, glassMat);
		this.mesh.add(glassR);
		this.mesh.add(glassL);
		this.mesh.add(glassA);

		var earGeom = new THREE.BoxGeometry(2,3,2);
		var earL = new THREE.Mesh(earGeom,faceMat);
		earL.position.set(0,0,-6);
		var earR = earL.clone();
		earR.position.set(0,0,6);
		this.mesh.add(earL);
		this.mesh.add(earR);
	}


	// updateHairs signature already includes game, no change needed here.
	updateHairs(deltaTime, game) {
		var hairs = this.hairsTop.children
		var l = hairs.length
		for (var i=0; i<l; i++) {
			var h = hairs[i]
			h.scale.y = .75 + Math.cos(this.angleHairs+i/3)*.25
		}
		this.angleHairs += game.speed * deltaTime * 40
	}
}


export class SimpleGun {
	constructor() {
		this.mesh = SimpleGun.createMesh()
		this.mesh.position.z = 28
		this.mesh.position.x = 25
		this.mesh.position.y = -8
	}

	static createMesh() {
		const metalMaterial = new THREE.MeshStandardMaterial({color: 0x222222, flatShading: true, roughness: 0.5, metalness: 1.0})
		const BODY_RADIUS = 3
		const BODY_LENGTH = 20
		const full = new THREE.Group()
		const body = new THREE.Mesh(
			new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_LENGTH),
			metalMaterial,
		)
		body.rotation.z = Math.PI/2
		full.add(body)

		const barrel = new THREE.Mesh(
			new THREE.CylinderGeometry(BODY_RADIUS/2, BODY_RADIUS/2, BODY_LENGTH),
			metalMaterial,
		)
		barrel.rotation.z = Math.PI/2
		barrel.position.x = BODY_LENGTH
		full.add(barrel)
		return full
	}

	downtime() {
		return 0.1
	}

	damage() {
		return 1
	}

	shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene) { // Added Projectile, sceneManager, allProjectiles, scene
		const BULLET_SPEED = 0.5
		const RECOIL_DISTANCE = 4
		const RECOIL_DURATION = this.downtime() / 1.5

		const position = new THREE.Vector3()
		this.mesh.getWorldPosition(position)
		position.add(new THREE.Vector3(5, 0, 0))
		// Pass Projectile, sceneManager, allProjectiles to spawnProjectile
		spawnProjectile(this.damage(), position, direction, BULLET_SPEED, 0.3, 3, sceneManager, allProjectiles, Projectile)

		// Little explosion at exhaust
		// Pass scene to spawnParticles
		spawnParticles(position.clone().add(new THREE.Vector3(2,0,0)), 1, Colors.orange, 0.2, scene)

		// audio
		audioManager.play('shot-soft')

		// Recoil of gun
		const initialX = this.mesh.position.x
		TweenMax.to(this.mesh.position, {
			duration: RECOIL_DURATION/2,
			x: initialX - RECOIL_DISTANCE,
			onComplete: () => {
				TweenMax.to(this.mesh.position, {
					duration: RECOIL_DURATION/2,
					x: initialX,
				})
			},
		})
	}
}


export class DoubleGun {
	constructor(SimpleGun) {
		this.gun1 = new SimpleGun()
		this.gun2 = new SimpleGun()
		this.gun2.mesh.position.add(new THREE.Vector3(0, 14, 0))
		this.mesh = new THREE.Group()
		this.mesh.add(this.gun1.mesh)
		this.mesh.add(this.gun2.mesh)
	}

	downtime() {
		return 0.15
	}

	damage() {
		return this.gun1.damage() + this.gun2.damage()
	}

	shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene) { // Added Projectile, sceneManager, allProjectiles, scene
		// Pass dependencies down to individual gun shots
		this.gun1.shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)
		this.gun2.shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)
	}
}


export class BetterGun {
	constructor() {
		this.mesh = BetterGun.createMesh()
		this.mesh.position.z = 28
		this.mesh.position.x = -3
		this.mesh.position.y = -5
	}

	static createMesh() {
		const metalMaterial = new THREE.MeshStandardMaterial({color: 0x222222, flatShading: true, roughness: 0.5, metalness: 1.0})
		const BODY_RADIUS = 5
		const BODY_LENGTH = 30
		const full = new THREE.Group()
		const body = new THREE.Mesh(
			new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_LENGTH),
			metalMaterial,
		)
		body.rotation.z = Math.PI/2
		body.position.x = BODY_LENGTH/2
		full.add(body)

		const BARREL_RADIUS = BODY_RADIUS/2
		const BARREL_LENGTH = BODY_LENGTH * 0.66
		const barrel = new THREE.Mesh(
			new THREE.CylinderGeometry(BARREL_RADIUS, BARREL_RADIUS, BARREL_LENGTH),
			metalMaterial,
		)
		barrel.rotation.z = Math.PI/2
		barrel.position.x = BODY_LENGTH + BARREL_LENGTH/2
		full.add(barrel)

		const TIP_RADIUS = BARREL_RADIUS * 1.3
		const TIP_LENGTH = BODY_LENGTH/4
		const tip = new THREE.Mesh(
			new THREE.CylinderGeometry(TIP_RADIUS, TIP_RADIUS, TIP_LENGTH),
			metalMaterial,
		)
		tip.rotation.z = Math.PI/2
		tip.position.x = BODY_LENGTH + BARREL_LENGTH + TIP_LENGTH/2
		full.add(tip)
		return full
	}

	downtime() {
		return 0.1
	}

	damage() {
		return 5
	}

	shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene) { // Added Projectile, sceneManager, allProjectiles, scene
		const BULLET_SPEED = 0.5
		const RECOIL_DISTANCE = 4
		const RECOIL_DURATION = this.downtime() / 3

		// position = position.clone().add(new THREE.Vector3(11.5, -1.3, 7.5))
		const position = new THREE.Vector3()
		this.mesh.getWorldPosition(position)
		position.add(new THREE.Vector3(12, 0, 0))
		// Pass Projectile, sceneManager, allProjectiles to spawnProjectile
		spawnProjectile(this.damage(), position, direction, BULLET_SPEED, 0.8, 6, sceneManager, allProjectiles, Projectile)

		// Little explosion at exhaust
		// Pass scene to spawnParticles
		spawnParticles(position.clone().add(new THREE.Vector3(2,0,0)), 3, Colors.orange, 0.5, scene)

		// audio
		audioManager.play('shot-hard')

		// Recoil of gun
		const initialX = this.mesh.position.x
		TweenMax.to(this.mesh.position, {
			duration: RECOIL_DURATION,
			x: initialX - RECOIL_DISTANCE,
			onComplete: () => {
				TweenMax.to(this.mesh.position, {
					duration: RECOIL_DURATION,
					x: initialX,
				})
			},
		})
	}
}


export class Airplane {
	constructor(createAirplaneMesh, Pilot) {
		const [mesh, propeller, pilot] = createAirplaneMesh(Colors, utils, Pilot)
		this.mesh = mesh
		this.propeller = propeller
		this.pilot = pilot
		this.weapon = null
		this.lastShot = 0
	}


	equipWeapon(weapon) {
		if (this.weapon) {
			this.mesh.remove(this.weapon.mesh)
		}
		this.weapon = weapon
		if (this.weapon) {
			this.mesh.add(this.weapon.mesh)
		}
	}


	shoot(airplane, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene) { // Added Projectile, sceneManager, allProjectiles, scene
		if (!this.weapon) {
			return
		}

		// rate-limit the shooting
		const nowTime = new Date().getTime() / 1000
		const ready = nowTime-this.lastShot > this.weapon.downtime()
		if (!ready) {
			return
		}
		this.lastShot = nowTime

		// fire the shot
		let direction = new THREE.Vector3(10, 0, 0)
		direction.applyEuler(airplane.mesh.rotation)
		// Pass dependencies down to weapon shoot
		this.weapon.shoot(direction, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)

		// recoil airplane
		const recoilForce = this.weapon.damage()
		TweenMax.to(this.mesh.position, {
			duration: 0.05,
			x: this.mesh.position.x - recoilForce,
		})
	}


	tick(deltaTime, game, utils, world, camera, ui) { // Added ui
		this.propeller.rotation.x += 0.2 + game.planeSpeed * deltaTime*.005

		if (game.status === 'playing') {
			// Use passed ui object
			game.planeSpeed = utils.normalize(ui.mousePos.x, -0.5, 0.5, world.planeMinSpeed, world.planeMaxSpeed)
			let targetX = utils.normalize(ui.mousePos.x, -1, 1, -world.planeAmpWidth*0.7, -world.planeAmpWidth)
			let targetY = utils.normalize(ui.mousePos.y, -0.75, 0.75, world.planeDefaultHeight-world.planeAmpHeight, world.planeDefaultHeight+world.planeAmpHeight)

			game.planeCollisionDisplacementX += game.planeCollisionSpeedX
			targetX += game.planeCollisionDisplacementX

			game.planeCollisionDisplacementY += game.planeCollisionSpeedY
			targetY += game.planeCollisionDisplacementY

			this.mesh.position.x += (targetX - this.mesh.position.x) * deltaTime * world.planeMoveSensivity
			this.mesh.position.y += (targetY - this.mesh.position.y) * deltaTime * world.planeMoveSensivity

			this.mesh.rotation.x = (this.mesh.position.y - targetY) * deltaTime * world.planeRotZSensivity
			this.mesh.rotation.z = (targetY - this.mesh.position.y) * deltaTime * world.planeRotXSensivity

			if (game.fpv) {
				camera.position.y = this.mesh.position.y + 20
				// camera.setRotationFromEuler(new THREE.Euler(-1.490248, -1.4124514, -1.48923231))
				// camera.updateProjectionMatrix ()
			} else {
				// Use passed ui object
				camera.fov = utils.normalize(ui.mousePos.x, -30, 1, 40, 80)
				camera.updateProjectionMatrix()
				camera.position.y += (this.mesh.position.y - camera.position.y) * deltaTime * world.cameraSensivity
			}
		}

		game.planeCollisionSpeedX += (0-game.planeCollisionSpeedX)*deltaTime * 0.03;
		game.planeCollisionDisplacementX += (0-game.planeCollisionDisplacementX)*deltaTime *0.01;
		game.planeCollisionSpeedY += (0-game.planeCollisionSpeedY)*deltaTime * 0.03;
		game.planeCollisionDisplacementY += (0-game.planeCollisionDisplacementY)*deltaTime *0.01;

		this.pilot.updateHairs(deltaTime, game)
	}


	gethit(position, game, ambientLight, audioManager) { // ambientLight is already passed
		const diffPos = this.mesh.position.clone().sub(position)
		const d = diffPos.length()
		game.planeCollisionSpeedX = 100 * diffPos.x / d
		game.planeCollisionSpeedY = 100 * diffPos.y / d
		ambientLight.intensity = 2
		audioManager.play('airplane-crash')
	}
}


export class Collectible {
	constructor(mesh, onApply, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene) {
		this.angle = 0
		this.distance = 0
		this.onApply = onApply

		this.mesh = new THREE.Object3D()
		const bubble = new THREE.Mesh(
			new THREE.SphereGeometry(10, 100, 100),
			new THREE.MeshPhongMaterial({
				color: COLOR_COLLECTIBLE_BUBBLE,
				transparent: true,
				opacity: .4,
				flatShading: true,
			})
		)
		this.mesh.add(bubble)
		this.mesh.add(mesh)
		this.mesh.castShadow = true

		// for the angle:
		//   Math.PI*2 * 0.0  => on the right side of the sea cylinder
		//   Math.PI*2 * 0.1  => on the top right
		//   Math.PI*2 * 0.2  => directly in front of the plane
		//   Math.PI*2 * 0.3  => directly behind the plane
		//   Math.PI*2 * 0.4  => on the top left
		//   Math.PI*2 * 0.5  => on the left side
		this.angle = Math.PI*2 * 0.1
		this.distance = world.seaRadius + world.planeDefaultHeight + (-1 + 2*Math.random()) * (world.planeAmpHeight-20)
		this.mesh.position.y = -world.seaRadius + Math.sin(this.angle) * this.distance
		this.mesh.position.x = Math.cos(this.angle) * this.distance

		sceneManager.add(this)

		// Store dependencies for tick and explode
		this._sceneManager = sceneManager;
		this._world = world;
		this._airplane = airplane;
		this._utils = utils;
		this._spawnParticles = spawnParticles;
		this._COLOR_COLLECTIBLE_BUBBLE = COLOR_COLLECTIBLE_BUBBLE;
		this._audioManager = audioManager;
		this._scene = scene;
	}


	tick(deltaTime, game) { // game is already passed
		// Pass game to rotateAroundSea
		rotateAroundSea(this, deltaTime, this._world.collectiblesSpeed, this._world, game)

		// rotate collectible for visual effect
		this.mesh.rotation.y += deltaTime * 0.002 * Math.random()
		this.mesh.rotation.z += deltaTime * 0.002 * Math.random()

		// collision?
		if (this._utils.collide(this._airplane.mesh, this.mesh, this._world.collectibleDistanceTolerance)) {
			this.onApply()
			this.explode()
		}
		// passed-by?
		else if (this.angle > Math.PI) {
			this._sceneManager.remove(this)
		}
	}


	explode() { // scene is already stored as this._scene
		// Use this._scene for spawnParticles
		this._spawnParticles(this.mesh.position.clone(), 15, this._COLOR_COLLECTIBLE_BUBBLE, 3, this._scene)
		this._sceneManager.remove(this)
		this._audioManager.play('bubble')

		const DURATION = 1

		setTimeout(() => {
			const itemMesh = new THREE.Group()
			for (let i=1; i<this.mesh.children.length; i+=1) {
				itemMesh.add(this.mesh.children[i])
			}
			this._scene.add(itemMesh)
			itemMesh.position.y = 120
			itemMesh.position.z = 50

			const initialScale = itemMesh.scale.clone()
			TweenMax.to(itemMesh.scale, {
				duration: DURATION / 2,
				x: initialScale.x * 4,
				y: initialScale.y * 4,
				z: initialScale.z * 4,
				ease: 'Power2.easeInOut',
				onComplete: () => {
					TweenMax.to(itemMesh.scale, {
						duration: DURATION / 2,
						x: 0,
						y: 0,
						z: 0,
						ease: 'Power2.easeInOut',
						onComplete: () => {
							this._scene.remove(itemMesh)
						},
					})
				},
			})
		}, 200)
	}
}


export class Cloud {
	constructor(Colors) {
		this.mesh = new THREE.Object3D()
		const geom = new THREE.BoxGeometry(20, 20, 20)
		const mat = new THREE.MeshPhongMaterial({
			color: Colors.white,
		})
		const nBlocs = 3+Math.floor(Math.random()*3)
		for (let i=0; i<nBlocs; i++) {
			const m = new THREE.Mesh(geom.clone(), mat)
			m.position.x = i*15
			m.position.y = Math.random()*10
			m.position.z = Math.random()*10
			m.rotation.y = Math.random()*Math.PI*2
			m.rotation.z = Math.random()*Math.PI*2
			const s = 0.1 + Math.random()*0.9
			m.scale.set(s, s, s)
			this.mesh.add(m)
			m.castShadow = true
			m.receiveShadow = true

		}
	}

	tick(deltaTime) {
		const l = this.mesh.children.length
		for(let i=0; i<l; i++) {
			let m = this.mesh.children[i]
			m.rotation.y += Math.random() * 0.002*(i+1)
			m.rotation.z += Math.random() * 0.005*(i+1)
		}
	}
}


export class Sky {
	constructor(Cloud, world) {
		this.mesh = new THREE.Object3D()
		this.nClouds = 20
		this.clouds = []
		const stepAngle = Math.PI*2 / this.nClouds
		for (let i=0; i<this.nClouds; i++) {
			const c = new Cloud(Colors) // Pass Colors to Cloud constructor
			this.clouds.push(c)
			var a = stepAngle * i
			var h = world.seaRadius + 150 + Math.random()*200
			c.mesh.position.y = Math.sin(a)*h
			c.mesh.position.x = Math.cos(a)*h
			c.mesh.position.z = -300 - Math.random()*500
			c.mesh.rotation.z = a + Math.PI/2
			const scale = 1+Math.random()*2
			c.mesh.scale.set(scale, scale, scale)
			this.mesh.add(c.mesh)
		}
	}

	// tick signature already includes game, no change needed here.
	tick(deltaTime, game) {
		for(var i=0; i<this.nClouds; i++) {
			var c = this.clouds[i]
			c.tick(deltaTime)
		}
		this.mesh.rotation.z += game.speed * deltaTime
	}
}


export class Sea {
	constructor(world, COLOR_SEA_LEVEL) {
		var geom = new THREE.CylinderGeometry(world.seaRadius, world.seaRadius, world.seaLength, 40, 10)
		geom.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2))
		this.waves = [];
		const arr = geom.attributes.position.array
		for (let i=0; i<arr.length/3; i++) {
			this.waves.push({
				x: arr[i*3+0],
				y: arr[i*3+1],
				z: arr[i*3+2],
				ang: Math.random()*Math.PI*2,
				amp: world.wavesMinAmp + Math.random()*(world.wavesMaxAmp-world.wavesMinAmp),
				speed: world.wavesMinSpeed + Math.random()*(world.wavesMaxSpeed - world.wavesMinSpeed)
			})
		}
		var mat = new THREE.MeshPhongMaterial({
			color: COLOR_SEA_LEVEL[0],
			transparent: true,
			opacity: 0.8,
			flatShading: true,
		})
		this.mesh = new THREE.Mesh(geom, mat)
		this.mesh.receiveShadow = true

		// Store dependencies for updateColor
		this._COLOR_SEA_LEVEL = COLOR_SEA_LEVEL;
	}

	tick(deltaTime) {
		var arr = this.mesh.geometry.attributes.position.array
		for (let i=0; i<arr.length/3; i++) {
			var wave = this.waves[i]
			arr[i*3+0] = wave.x + Math.cos(wave.ang) * wave.amp
			arr[i*3+1] = wave.y + Math.sin(wave.ang) * wave.amp
			wave.ang += wave.speed * deltaTime
		}
		this.mesh.geometry.attributes.position.needsUpdate = true
	}

	// updateColor signature already includes game, no change needed here.
	updateColor(game) {
		this.mesh.material = new THREE.MeshPhongMaterial({
			color: this._COLOR_SEA_LEVEL[(game.level - 1) % this._COLOR_SEA_LEVEL.length],
			transparent: true,
			opacity: .8,
			flatShading: true,
		})
	}
}


export class Enemy {
	constructor(Colors, sceneManager) {
		var geom = new THREE.TetrahedronGeometry(8, 2)
		var mat = new THREE.MeshPhongMaterial({
			color: Colors.red,
			shininess: 0,
			specular: 0xffffff,
			flatShading: true,
		})
		this.mesh = new THREE.Mesh(geom, mat)
		this.mesh.castShadow = true
		this.angle = 0
		this.distance = 0
		this.hitpoints = 3
		sceneManager.add(this)

		// Store dependencies for tick and explode
		this._sceneManager = sceneManager;
		this._Colors = Colors;
	}


	// Added ambientLight, scene to signature
	tick(deltaTime, world, game, airplane, utils, allProjectiles, spawnParticles, audioManager, removeLife, ambientLight, scene) {
		// Pass game to rotateAroundSea
		rotateAroundSea(this, deltaTime, world.enemiesSpeed, world, game)
		this.mesh.rotation.y += Math.random() * 0.1
		this.mesh.rotation.z += Math.random() * 0.1

		// collision?
		if (utils.collide(airplane.mesh, this.mesh, world.enemyDistanceTolerance) && game.status!=='finished') {
			// Pass scene, game to explode
			this.explode(spawnParticles, this._Colors, audioManager, this._sceneManager, game, scene)
			// Pass ambientLight to gethit
			airplane.gethit(this.mesh.position, game, ambientLight, audioManager)
			// Use passed removeLife
			removeLife()
		}
		// passed-by?
		else if (this.angle > Math.PI) {
			this._sceneManager.remove(this)
		}

		const thisAabb = new THREE.Box3().setFromObject(this.mesh)
		for (const projectile of allProjectiles) { // Use passed allProjectiles
			const projectileAabb = new THREE.Box3().setFromObject(projectile.mesh)
			if (thisAabb.intersectsBox(projectileAabb)) {
				// Pass scene to spawnParticles
				spawnParticles(projectile.mesh.position.clone(), 5, this._Colors.brownDark, 1, scene)
				projectile.remove() // Projectile.remove uses stored dependencies
				this.hitpoints -= projectile.damage
				audioManager.play('bullet-impact', {volume: 0.3})
			}
		}
		if (this.hitpoints <= 0) {
			// Pass scene, game to explode
			this.explode(spawnParticles, this._Colors, audioManager, this._sceneManager, game, scene)
		}
	}


	// Added scene, game to signature
	explode(spawnParticles, Colors, audioManager, sceneManager, game, scene) {
		audioManager.play('rock-shatter', {volume: 3})
		// Pass scene to spawnParticles
		spawnParticles(this.mesh.position.clone(), 15, Colors.red, 3, scene)
		sceneManager.remove(this)
		game.statistics.enemiesKilled += 1
	}
}


export class Coin {
	constructor(COLOR_COINS, sceneManager) {
		var geom = new THREE.CylinderGeometry(4, 4, 1, 10)
		var mat = new THREE.MeshPhongMaterial({
			color: COLOR_COINS,
			shininess: 1,
			specular: 0xffffff,
			flatShading: true,
		});
		this.mesh = new THREE.Mesh(geom, mat)
		this.mesh.castShadow = true
		this.angle = 0
		this.dist = 0
		sceneManager.add(this)

		// Store dependencies for tick
		this._sceneManager = sceneManager;
		this._COLOR_COINS = COLOR_COINS;
	}


	// Added scene to signature
	tick(deltaTime, world, game, airplane, utils, spawnParticles, audioManager, addCoin, scene) {
		// Pass game to rotateAroundSea
		rotateAroundSea(this, deltaTime, world.coinsSpeed, world, game)

		this.mesh.rotation.z += Math.random() * 0.1
		this.mesh.rotation.y += Math.random() * 0.1

		// collision?
		if (utils.collide(airplane.mesh, this.mesh, world.coinDistanceTolerance)) {
			// Pass scene to spawnParticles
			spawnParticles(this.mesh.position.clone(), 5, this._COLOR_COINS, 0.8, scene);
			// Use passed addCoin
			addCoin()
			audioManager.play('coin', {volume: 0.5})
			this._sceneManager.remove(this)
		}
		// passed-by?
		else if (this.angle > Math.PI) {
			this._sceneManager.remove(this)
		}
	}
}


export class Projectile {
	constructor(damage, initialPosition, direction, speed, radius, length, sceneManager, allProjectiles) {
		const PROJECTILE_COLOR = Colors.brownDark  // 0x333333

		this.damage = damage
		this.mesh = new THREE.Mesh(
			new THREE.CylinderGeometry(radius, radius, length),
			new THREE.LineBasicMaterial({color: PROJECTILE_COLOR})
		)
		this.mesh.position.copy(initialPosition)
		this.mesh.rotation.z = Math.PI/2
		this.direction = direction.clone()
		this.direction.setLength(1)
		this.speed = speed
		sceneManager.add(this)

		// Store dependencies for remove
		this._sceneManager = sceneManager;
		this._allProjectiles = allProjectiles;
	}

	// tick signature already includes MAX_WORLD_X, no change needed here.
	tick(deltaTime, MAX_WORLD_X) {
		this.mesh.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime))
		this.mesh.position.z *= 0.9
		// out of screen? => remove
		if (this.mesh.position.x > MAX_WORLD_X) {
			this.remove()
		}
	}

	remove() {
		this._sceneManager.remove(this)
		this._allProjectiles.splice(this._allProjectiles.indexOf(this), 1)
	}
}


export class SceneManager {
	constructor(scene, game, world, airplane, utils, allProjectiles, spawnParticles, audioManager, removeLife, MAX_WORLD_X, ambientLight, addCoin, camera) {
		this.list = new Set()
		this._scene = scene;
		this._game = game;
		this._world = world;
		this._airplane = airplane;
		this._utils = utils;
		this._allProjectiles = allProjectiles;
		this._spawnParticles = spawnParticles;
		this._audioManager = audioManager;
		this._removeLife = removeLife;
		this._MAX_WORLD_X = MAX_WORLD_X;
		this._ambientLight = ambientLight;
		this._addCoin = addCoin;
		this._camera = camera; // Added camera
	}

	add(obj) {
		this._scene.add(obj.mesh)
		this.list.add(obj)
	}

	remove(obj) {
		this._scene.remove(obj.mesh)
		this.list.delete(obj)
	}

	clear() {
		for (const entry of this.list) {
			this.remove(entry)
		}
	}

	tick(deltaTime) {
		for (const entry of this.list) {
			if (entry.tick) {
				// Pass necessary dependencies stored in 'this' to the tick method
				if (entry instanceof Airplane) {
					// Airplane tick needs: deltaTime, game, utils, world, camera
					entry.tick(deltaTime, this._game, this._utils, this._world, this._camera);
				} else if (entry instanceof Collectible) {
					// Collectible tick needs: deltaTime, game (game is not used in Collectible.tick, but keeping for now)
					// Collectible constructor/methods already store dependencies like world, airplane, utils, etc.
					entry.tick(deltaTime, this._game);
				} else if (entry instanceof Cloud) {
					// Cloud tick needs: deltaTime
					entry.tick(deltaTime);
				} else if (entry instanceof Sky) {
					// Sky tick needs: deltaTime, game
					entry.tick(deltaTime, this._game);
				} else if (entry instanceof Sea) {
					// Sea tick needs: deltaTime
					entry.tick(deltaTime);
				} else if (entry instanceof Enemy) {
					// Enemy tick needs: deltaTime, world, game, airplane, utils, allProjectiles, spawnParticles, audioManager, removeLife, ambientLight, scene
					entry.tick(deltaTime, this._world, this._game, this._airplane, this._utils, this._allProjectiles, this._spawnParticles, this._audioManager, this._removeLife, this._ambientLight, this._scene);
				} else if (entry instanceof Coin) {
					// Coin tick needs: deltaTime, world, game, airplane, utils, spawnParticles, audioManager, addCoin, scene
					entry.tick(deltaTime, this._world, this._game, this._airplane, this._utils, this._spawnParticles, this._audioManager, this._addCoin, this._scene);
				} else if (entry instanceof Projectile) {
					// Projectile tick needs: deltaTime, MAX_WORLD_X
					entry.tick(deltaTime, this._MAX_WORLD_X);
				} else {
					// Default tick call if no specific dependencies are known
					entry.tick(deltaTime);
				}
			}
		}
	}
}
