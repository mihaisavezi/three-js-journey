import * as THREE from 'three';
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TweenMax, Power2 } from 'gsap'; // Assuming gsap is available globally or imported elsewhere
import {
	Colors,
	COLOR_COINS,
	COLOR_COLLECTIBLE_BUBBLE,
	COLOR_SEA_LEVEL,
	utils,
	createAirplaneMesh,
	rotateAroundSea,
	spawnParticles,
	spawnProjectile,
	spawnSimpleGunCollectible,
	spawnBetterGunCollectible,
	spawnDoubleGunCollectible,
	spawnLifeCollectible,
	spawnEnemies,
	spawnCoins,
	Pilot,
	SimpleGun,
	DoubleGun,
	BetterGun,
	Airplane,
	Collectible,
	Cloud,
	Sky,
	Sea,
	Enemy,
	Coin,
	Projectile,
	SceneManager,
} from './objects.js';


///////////////
// GAME VARIABLES
var canDie = true
var world, game
var newTime = new Date().getTime()
var oldTime = new Date().getTime()
let allProjectiles = []; // Added for managing projectiles




let scene, camera, renderer


//SCREEN & MOUSE VARIABLES
var MAX_WORLD_X=1000

let sky;




//INIT THREE JS, SCREEN AND MOUSE EVENTS
function createScene() {
	scene = new THREE.Scene()
	camera = new THREE.PerspectiveCamera(50, ui.width/ui.height, 0.1, 10000)
	audioManager.setCamera(camera)
	scene.fog = new THREE.Fog(0xf7d9aa, 100, 950)

	renderer = new THREE.WebGLRenderer({canvas: ui.canvas, alpha: true, antialias: true})
	renderer.setSize(ui.width, ui.height)
	renderer.setPixelRatio(window.devicePixelRatio? window.devicePixelRatio : 1)

	renderer.shadowMap.enabled = true


	function setupCamera() {
		renderer.setSize(ui.width, ui.height)
		camera.aspect = ui.width / ui.height
		camera.updateProjectionMatrix()

		// setTimeout(() => {
		// 	const rayCaster = new THREE.Raycaster()
		// 	rayCaster.setFromCamera(new THREE.Vector2(1, 1), camera)
		// 	const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
		// 	const intersectPoint = new THREE.Vector3()
		// 	rayCaster.ray.intersectPlane(plane, intersectPoint)
		// 	console.log('max world x:', intersectPoint.x)
		// 	// MAX_WORLD_X = intersectPoint.x  doesn't work with first person view
		// }, 500)
	}

	setupCamera()
	ui.onResize(setupCamera)

	// const controls = new THREE.OrbitControls(camera, renderer.domElement)
	// controls.minPolarAngle = -Math.PI / 2
	// controls.maxPolarAngle = Math.PI
	// controls.addEventListener('change', () => {
	// 	console.log('camera changed', 'camera=', camera.position, ', airplane=', airplane.mesh.position, 'camera.rotation=', camera.rotation)
	// })
	// setTimeout(() => {
	// 	camera.lookAt(airplane.mesh.position)
	// 	controls.target.copy(airplane.mesh.position)
	// }, 100)

	// controls.noZoom = true
	//controls.noPan = true

	// handleWindowResize()
}




// LIGHTS
var ambientLight

function createLights() {
	const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
	ambientLight = new THREE.AmbientLight(0xdc8874, .5)
	const shadowLight = new THREE.DirectionalLight(0xffffff, .9)
	shadowLight.position.set(150, 350, 350)
	shadowLight.castShadow = true
	shadowLight.shadow.camera.left = -400
	shadowLight.shadow.camera.right = 400
	shadowLight.shadow.camera.top = 400
	shadowLight.shadow.camera.bottom = -400
	shadowLight.shadow.camera.near = 1
	shadowLight.shadow.camera.far = 1000
	shadowLight.shadow.mapSize.width = 4096
	shadowLight.shadow.mapSize.height = 4096

	scene.add(hemisphereLight)
	scene.add(shadowLight)
	scene.add(ambientLight)
}




// Managers
let sceneManager; // Declare globally, instantiate later




class LoadingProgressManager {
	constructor() {
		this.promises = []
	}

	add(promise) {
		this.promises.push(promise)
	}

	then(callback) {
		return Promise.all(this.promises).then(callback)
	}

	catch(callback) {
		return Promise.all(this.promises).catch(callback)
	}
}

const loadingProgressManager = new LoadingProgressManager()




class AudioManager {
	constructor() {
		this.buffers = {}
		this.loader = new THREE.AudioLoader()
		this.listener = new THREE.AudioListener()
		this.categories = {}
	}

	setCamera(camera) {
		camera.add(this.listener)
	}

	load(soundId, category, path) {
		const promise = new Promise((resolve, reject) => {
			this.loader.load(path,
				(audioBuffer) => {
					this.buffers[soundId] = audioBuffer
					if (category !== null) {
						if (!this.categories[category]) {
							this.categories[category] = []
						}
						this.categories[category].push(soundId)
					}
					resolve()
				},
				() => {},
				reject
			)
		})
		loadingProgressManager.add(promise)
	}

	play(soundIdOrCategory, options) {
		options = options || {}

		let soundId = soundIdOrCategory
		const category = this.categories[soundIdOrCategory]
		if (category) {
			soundId = utils.randomOneOf(category)
		}

		const buffer = this.buffers[soundId]
		const sound = new THREE.Audio(this.listener)
		sound.setBuffer(buffer)
		if (options.loop) {
			sound.setLoop(true)
		}
		if (options.volume) {
			sound.setVolume(options.volume)
		}
		sound.play()
	}
}

const audioManager = new AudioManager()




class ModelManager {
	constructor(path) {
		this.path = path
		this.models = {}
	}

	load(modelName) {
		const promise = new Promise((resolve, reject) => {
			const loader = new OBJLoader()
			loader.load(this.path+'/'+modelName+'.obj', (obj) => {
				this.models[modelName] = obj
				resolve()
			}, function() {}, reject)
		})
		loadingProgressManager.add(promise)
	}

	get(modelName) {
		if (typeof this.models[modelName] === 'undefined') {
			throw new Error("Can't find model "+modelName)
		}
		return this.models[modelName]
	}
}

const modelManager = new ModelManager('/models')



// 3D Models
let sea, sea2
let airplane


function createPlane() {
	airplane = new Airplane(createAirplaneMesh, Pilot)
	airplane.mesh.scale.set(.25,.25,.25)
	airplane.mesh.position.y = world.planeDefaultHeight
	scene.add(airplane.mesh)
}


function createSea() {
	// We create a second sea that is not animated because the animation of our our normal sea leaves holes at certain points and I don't know how to get rid of them. These holes did not occur in the original script that used three js version 75 and mergeVertices. However, I tried to reproduce that behaviour in the animation function but without succes - thus this workaround here.
	sea = new Sea(world, COLOR_SEA_LEVEL)
	sea.mesh.position.y = -world.seaRadius
	scene.add(sea.mesh)

	sea2 = new Sea(world, COLOR_SEA_LEVEL)
	sea2.mesh.position.y = -world.seaRadius
	scene.add(sea2.mesh)
}


function createSky() {
	sky = new Sky(Cloud, world)
	sky.mesh.position.y = -world.seaRadius
	scene.add(sky.mesh)
}



function loop() {
	newTime = new Date().getTime()
	const deltaTime = newTime - oldTime
	oldTime = newTime

	if (game.status == 'playing') {
		if (!game.paused) {
			// Add coins
			if (Math.floor(game.distance)%world.distanceForCoinsSpawn == 0 && Math.floor(game.distance) > game.coinLastSpawn) {
				game.coinLastSpawn = Math.floor(game.distance);
				// Added game, scene args
				spawnCoins(Coin, world, utils, addCoin, audioManager, sceneManager, spawnParticles, COLOR_COINS, game, scene)
			}
			if (Math.floor(game.distance)%world.distanceForSpeedUpdate == 0 && Math.floor(game.distance) > game.speedLastUpdate) {
				game.speedLastUpdate = Math.floor(game.distance);
				game.targetBaseSpeed += world.incrementSpeedByTime * deltaTime;
			}
			if (Math.floor(game.distance)%world.distanceForEnemiesSpawn == 0 && Math.floor(game.distance) > game.enemyLastSpawn) {
				game.enemyLastSpawn = Math.floor(game.distance)
				// Added Colors, sceneManager args
				spawnEnemies(game.level, Enemy, world, game, Colors, sceneManager)
			}
			if (Math.floor(game.distance)%world.distanceForLevelUpdate == 0 && Math.floor(game.distance) > game.levelLastUpdate) {
				game.levelLastUpdate = Math.floor(game.distance)
				game.level += 1
				if (game.level === world.levelCount) {
					game.status = 'finished'
					setFollowView()
					ui.showScoreScreen()
				} else {
					ui.informNextLevel(game.level)
					sea.updateColor(game)
					sea2.updateColor(game)
					ui.updateLevelCount()
					game.targetBaseSpeed = world.initSpeed + world.incrementSpeedByLevel*game.level
				}
			}

			// span collectibles
			if (game.lifes<world.maxLifes && (game.distance-game.lastLifeSpawn)>world.pauseLifeSpawn && Math.random()<0.01) {
				game.lastLifeSpawn = game.distance
				// Added sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene args
				spawnLifeCollectible(Collectible, modelManager, addLife, sceneManager, world, airplane, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene)
			}
			if (!game.spawnedSimpleGun && game.distance>world.simpleGunLevelDrop*world.distanceForLevelUpdate) {
				// Added sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene args
				spawnSimpleGunCollectible(Collectible, SimpleGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene)
				game.spawnedSimpleGun = true
			}
			if (!game.spawnedDoubleGun && game.distance>world.doubleGunLevelDrop*world.distanceForLevelUpdate) {
				// Added sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene args
				spawnDoubleGunCollectible(Collectible, SimpleGun, DoubleGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene)
				game.spawnedDoubleGun = true
			}
			if (!game.spawnedBetterGun && game.distance>world.betterGunLevelDrop*world.distanceForLevelUpdate) {
				// Added sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene args
				spawnBetterGunCollectible(Collectible, BetterGun, airplane, sceneManager, world, utils, spawnParticles, COLOR_COLLECTIBLE_BUBBLE, audioManager, scene)
				game.spawnedBetterGun = true
			}

			if (ui.mouseButtons[0] || ui.keysDown['Space']) {
				// Added Projectile, sceneManager, allProjectiles, scene args
				airplane.shoot(airplane, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)
			}

			// Added ui arg
			airplane.tick(deltaTime, game, utils, world, camera, ui)
			game.distance += game.speed * deltaTime * world.ratioSpeedDistance
			game.baseSpeed += (game.targetBaseSpeed - game.baseSpeed) * deltaTime * 0.02
			game.speed = game.baseSpeed * game.planeSpeed
			ui.updateDistanceDisplay()

			if (game.lifes<=0 && canDie) {
				game.status = "gameover"
			}
		}
	}
	else if (game.status == "gameover") {
		game.speed *= .99
		airplane.mesh.rotation.z += (-Math.PI/2 - airplane.mesh.rotation.z) * 0.0002 * deltaTime
		airplane.mesh.rotation.x += 0.0003 * deltaTime
		game.planeFallSpeed *= 1.05
		airplane.mesh.position.y -= game.planeFallSpeed * deltaTime

		if (airplane.mesh.position.y < -200) {
			ui.showReplay()
			game.status = "waitingReplay"
			audioManager.play('water-splash')
		}
	}
	else if (game.status == "waitingReplay"){
		// nothing to do
	}

	if (!game.paused) {
		// Added ui arg
		airplane.tick(deltaTime, game, utils, world, camera, ui)

		sea.mesh.rotation.z += game.speed*deltaTime
		if (sea.mesh.rotation.z > 2*Math.PI) {
			sea.mesh.rotation.z -= 2*Math.PI
		}
		ambientLight.intensity += (.5 - ambientLight.intensity) * deltaTime * 0.005

		// Removed extra args, only deltaTime needed
		sceneManager.tick(deltaTime)

		// Pass game arg
		sky.tick(deltaTime, game)
		sea.tick(deltaTime) // No change needed
	}

	renderer.render(scene, camera)
	requestAnimationFrame(loop)
}





// COINS
function addCoin() {
	game.coins += 1
	ui.updateCoinsCount(game.coins)

	game.statistics.coinsCollected += 1
}



function addLife() {
	game.lifes = Math.min(world.maxLifes, game.lifes+1)
	ui.updateLifesDisplay()
}

function removeLife() {
	game.lifes = Math.max(0, game.lifes-1)
	ui.updateLifesDisplay()

	game.statistics.lifesLost += 1
}




function setSideView() {
	game.fpv = false
	camera.position.set(0, world.planeDefaultHeight, 200)
	camera.setRotationFromEuler(new THREE.Euler(0, 0, 0))
}


function setFollowView() {
	game.fpv = true
	camera.position.set(-89, airplane.mesh.position.y+20, 0)
	camera.setRotationFromEuler(new THREE.Euler(-1.490248, -1.4124514, -1.48923231))
	camera.updateProjectionMatrix ()
}






class UI {
	constructor(onStart) {
		this._elemDistanceCounter = document.getElementById("distValue")
		this._elemReplayMessage = document.getElementById("replayMessage")
		this._elemLevelCounter = document.getElementById("levelValue")
		this._elemLevelCircle = document.getElementById("levelCircleStroke")
		this._elemsLifes = document.querySelectorAll('#lifes img')
		this._elemCoinsCount = document.getElementById('coinsValue')

		document.querySelector('#intro-screen button').onclick = () => {
			document.getElementById('intro-screen').classList.remove('visible')
			onStart()
		}

		document.addEventListener('keydown', this.handleKeyDown.bind(this), false)
		document.addEventListener('keyup', this.handleKeyUp.bind(this), false)
		document.addEventListener('mousedown', this.handleMouseDown.bind(this), false)
		document.addEventListener('mouseup', this.handleMouseUp.bind(this), false)
		document.addEventListener('mousemove', this.handleMouseMove.bind(this), false)
		document.addEventListener('blur', this.handleBlur.bind(this), false)

		document.oncontextmenu = document.body.oncontextmenu = function() {return false;}

		window.addEventListener('resize', this.handleWindowResize.bind(this), false)

		this.width = window.innerWidth
		this.height = window.innerHeight
		this.mousePos = {x: 0, y: 0}
		this.canvas = document.getElementById('threejs-canvas')

		this.mouseButtons = [false, false, false]
		this.keysDown = {}

		this._resizeListeners = []
	}


	onResize(callback) {
		this._resizeListeners.push(callback)
	}


	handleWindowResize(event) {
		this.width = window.innerWidth
		this.height = window.innerHeight

		for (const listener of this._resizeListeners) {
			listener()
		}
	}


	handleMouseMove(event) {
		var tx = -1 + (event.clientX / this.width)*2
		var ty = 1 - (event.clientY / this.height)*2
		this.mousePos = {x:tx, y:ty}
	}

	handleTouchMove(event) {
		event.preventDefault()
		var tx = -1 + (event.touches[0].pageX / this.width)*2
		var ty = 1 - (event.touches[0].pageY / this.height)*2
		this.mousePos = {x: tx, y: ty}
	}

	handleMouseDown(event) {
		this.mouseButtons[event.button] = true

		if (event.button===1 && game.status==='playing') {
			// Added Projectile, sceneManager, allProjectiles, scene args
			airplane.shoot(airplane, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)
		}
	}

	handleKeyDown(event) {
		this.keysDown[event.code] = true
		if (event.code === 'KeyP') {
			game.paused = !game.paused
		}
		if (event.code === 'Space') {
			// Added Projectile, sceneManager, allProjectiles, scene args
			airplane.shoot(airplane, spawnProjectile, spawnParticles, Colors, audioManager, Projectile, sceneManager, allProjectiles, scene)
		}
		if (event.code === 'Enter') {
			if (game.fpv) {
				setSideView()
			} else {
				setFollowView()
			}
		}
	}

	handleKeyUp(event) {
		this.keysDown[event.code] = false
	}

	handleMouseUp(event) {
		this.mouseButtons[event.button] = false
		event.preventDefault()

		if (game && game.status == "waitingReplay") {
			resetMap()
			ui.informNextLevel(1)
			game.paused = false
			sea.updateColor(game)
			sea2.updateColor(game)

			ui.updateDistanceDisplay()
			ui.updateLevelCount()
			ui.updateLifesDisplay()
			ui.updateCoinsCount()

			ui.hideReplay()
		}
	}

	handleBlur(event) {
		this.mouseButtons = [false, false, false]
	}


	// function handleTouchEnd(event) {
	// 	if (game.status == "waitingReplay"){
	// 		resetGame()
	// 		ui.hideReplay()
	// 	}
	// }


	showReplay() {
		this._elemReplayMessage.style.display = 'block'
	}

	hideReplay() {
		this._elemReplayMessage.style.display = 'none'
	}


	updateLevelCount() {
		this._elemLevelCounter.innerText = game.level
	}

	updateCoinsCount() {
		this._elemCoinsCount.innerText = game.coins
	}

	updateDistanceDisplay() {
		this._elemDistanceCounter.innerText = Math.floor(game.distance)
		const d = 502 * (1-(game.distance%world.distanceForLevelUpdate) / world.distanceForLevelUpdate)
		this._elemLevelCircle.setAttribute("stroke-dashoffset", d)
	}

	updateLifesDisplay() {
		for (let i=0, len=this._elemsLifes.length; i<len; i+=1) {
			const hasThisLife = i < game.lifes
			const elem = this._elemsLifes[i]
			if (hasThisLife && !elem.classList.contains('visible')) {
				elem.classList.remove('invisible')
				elem.classList.add('visible')
			}
			else if (!hasThisLife && !elem.classList.contains('invisible')) {
				elem.classList.remove('visible')
				elem.classList.add('invisible')
			}
		}
	}


	informNextLevel(level) {
		const ANIMATION_DURATION = 1.0

		const elem = document.getElementById('new-level')
		elem.style.visibility = 'visible'
		elem.style.animationDuration = Math.round(ANIMATION_DURATION * 1000)+'ms'
		elem.children[1].innerText = level
		elem.classList.add('animating')
		setTimeout(() => {
			document.getElementById('new-level').style.visibility = 'hidden'
			elem.classList.remove('animating')
		}, 1000)
	}


	showScoreScreen() {
		const elemScreen = document.getElementById('score-screen')

		// make visible
		elemScreen.classList.add('visible')

		// fill in statistics
		document.getElementById('score-coins-collected').innerText = game.statistics.coinsCollected
		document.getElementById('score-coins-total').innerText = game.statistics.coinsSpawned
		document.getElementById('score-enemies-killed').innerText = game.statistics.enemiesKilled
		document.getElementById('score-enemies-total').innerText = game.statistics.enemiesSpawned
		document.getElementById('score-shots-fired').innerText = game.statistics.shotsFired
		document.getElementById('score-lifes-lost').innerText = game.statistics.lifesLost
	}


	showError(message) {
		document.getElementById('error').style.visibility = 'visible'
		document.getElementById('error-message').innerText = message
	}
}
let ui



function createWorld() {
	world = {
		initSpeed: 0.00035,
		incrementSpeedByTime: 0.0000025,
		incrementSpeedByLevel: 0.000005,
		distanceForSpeedUpdate: 100,
		ratioSpeedDistance: 50,

		simpleGunLevelDrop: 1.1,
		doubleGunLevelDrop: 2.3,
		betterGunLevelDrop: 3.5,

		maxLifes: 3,
		pauseLifeSpawn: 400,

		levelCount: 6,
		distanceForLevelUpdate: 500,

		planeDefaultHeight: 100,
		planeAmpHeight: 80,
		planeAmpWidth: 75,
		planeMoveSensivity: 0.005,
		planeRotXSensivity: 0.0008,
		planeRotZSensivity: 0.0004,
		planeMinSpeed: 1.2,
		planeMaxSpeed: 1.6,

		seaRadius: 600,
		seaLength: 800,
		wavesMinAmp: 5,
		wavesMaxAmp: 20,
		wavesMinSpeed: 0.001,
		wavesMaxSpeed: 0.003,

		cameraSensivity: 0.002,

		coinDistanceTolerance: 15,
		coinsSpeed: 0.5,
		distanceForCoinsSpawn: 50,

		collectibleDistanceTolerance: 15,
		collectiblesSpeed: 0.6,

		enemyDistanceTolerance: 10,
		enemiesSpeed: 0.6,
		distanceForEnemiesSpawn: 50,
	}

	// create the world
	createScene()
	createSea()
	createSky()
	createLights()
	createPlane()

	resetMap()

	// Instantiate SceneManager after all dependencies are created/initialized
	sceneManager = new SceneManager(scene, game, world, airplane, utils, allProjectiles, spawnParticles, audioManager, removeLife, MAX_WORLD_X, ambientLight, addCoin, camera);
}



function resetMap() {
	game = {
		status: 'playing',

		speed: 0,
		paused: false,
		baseSpeed: 0.00035,
		targetBaseSpeed: 0.00035,
		speedLastUpdate: 0,

		distance: 0,

		coins: 0,
		fpv: false,

		// gun spawning
		spawnedSimpleGun: false,
		spawnedDoubleGun: false,
		spawnedBetterGun: false,

		lastLifeSpawn: 0,
		lifes: world.maxLifes,

		level: 1,
		levelLastUpdate: 0,

		planeFallSpeed: 0.001,
		planeSpeed: 0,
		planeCollisionDisplacementX: 0,
		planeCollisionSpeedX: 0,
		planeCollisionDisplacementY: 0,
		planeCollisionSpeedY: 0,

		coinLastSpawn: 0,
		enemyLastSpawn: 0,

		statistics: {
			coinsCollected: 0,
			coinsSpawned: 0,
			enemiesKilled: 0,
			enemiesSpawned: 0,
			shotsFired: 0,
			lifesLost: 0,
		}
	}

	// update ui
	ui.updateDistanceDisplay()
	ui.updateLevelCount()
	ui.updateLifesDisplay()
	ui.updateCoinsCount()

	sceneManager && sceneManager.clear()

	sea.updateColor(game)
	sea2.updateColor(game)

	setSideView()

	airplane.equipWeapon(null)

	// airplane.equipWeapon(new SimpleGun())
	// airplane.equipWeapon(new DoubleGun())
	// airplane.equipWeapon(new BetterGun())
}



let soundPlaying = false

function startMap() {
	if (!soundPlaying) {
		audioManager.play('propeller', {loop: true, volume: 1})
		audioManager.play('ocean', {loop: true, volume: 1})
		soundPlaying = true
	}

	createWorld()
	loop()

	ui.informNextLevel(1)
	game.paused = false
}



function onWebsiteLoaded(event) {
	// load audio
	audioManager.load('ocean', null, '/audio/ocean.mp3')
	audioManager.load('propeller', null, '/audio/propeller.mp3')

	audioManager.load('coin-1', 'coin', '/audio/coin-1.mp3')
	audioManager.load('coin-2', 'coin', '/audio/coin-2.mp3')
	audioManager.load('coin-3', 'coin', '/audio/coin-3.mp3')
	audioManager.load('jar-1', 'coin', '/audio/jar-1.mp3')
	audioManager.load('jar-2', 'coin', '/audio/jar-2.mp3')
	audioManager.load('jar-3', 'coin', '/audio/jar-3.mp3')
	audioManager.load('jar-4', 'coin', '/audio/jar-4.mp3')
	audioManager.load('jar-5', 'coin', '/audio/jar-5.mp3')
	audioManager.load('jar-6', 'coin', '/audio/jar-6.mp3')
	audioManager.load('jar-7', 'coin', '/audio/jar-7.mp3')

	audioManager.load('airplane-crash-1', 'airplane-crash', '/audio/airplane-crash-1.mp3')
	audioManager.load('airplane-crash-2', 'airplane-crash', '/audio/airplane-crash-2.mp3')
	audioManager.load('airplane-crash-3', 'airplane-crash', '/audio/airplane-crash-3.mp3')

	audioManager.load('bubble', 'bubble', '/audio/bubble.mp3')

	audioManager.load('shot-soft', 'shot-soft', '/audio/shot-soft.mp3')

	audioManager.load('shot-hard', 'shot-hard', '/audio/shot-hard.mp3')

	audioManager.load('bullet-impact', 'bullet-impact', '/audio/bullet-impact-rock.mp3')

	audioManager.load('water-splash', 'water-splash', '/audio/water-splash.mp3')
	audioManager.load('rock-shatter-1', 'rock-shatter', '/audio/rock-shatter-1.mp3')
	audioManager.load('rock-shatter-2', 'rock-shatter', '/audio/rock-shatter-2.mp3')

	// load models
	modelManager.load('heart')

	ui = new UI(startMap)
	loadingProgressManager
		.catch((err) => {
			ui.showError(err.message)
		})
}


window.addEventListener('load', onWebsiteLoaded, false)
