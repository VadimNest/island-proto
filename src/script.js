import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import firefliesVertexShader from './shaders/fireflies/vertex.glsl'
import firefliesFragmentShader from './shaders/fireflies/fragment.glsl'

import portalVertexShader from './shaders/portal/vertex.glsl'
import portalFragmentShader from './shaders/portal/fragment.glsl'

/**
 * Base
 */
// Debug
const debugObject = {}
const gui = new dat.GUI({
    width: 400
})

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


const ambientLight = new THREE.AmbientLight()
ambientLight.color = new THREE.Color(0xffffff)
scene.add(ambientLight)

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader()

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

//textures
const bakedTexture = textureLoader.load('portal-baked.jpg');
bakedTexture.flipY = false;

// //materials
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

//pole light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xFF69EC })


debugObject.portalColorStart='#52e0d7'
debugObject.portalColorEnd = '#1ea2a4'

gui
    .addColor(debugObject, 'portalColorStart')
    .onChange(()=> portalLightMaterial.uniforms.uColorStart.value.set(debugObject.portalColorStart))

gui
    .addColor(debugObject, 'portalColorEnd')
    .onChange(()=> portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd))

const portalLightMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uColorStart: {value: new THREE.Color(0xffffff)},
        uColorEnd: {value: new THREE.Color(0x31bcbf)},
    },
    vertexShader: portalVertexShader,
    fragmentShader: portalFragmentShader,
    side: THREE.DoubleSide
 })



//model
gltfLoader.load(
    'portal-final.glb',
    (gltf)=> {
        const portalLightAMesh = gltf.scene.children.find((child) => child.name === 'море');
        portalLightAMesh.material = portalLightMaterial

        scene.add(gltf.scene)
    }
)

// point geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 30
const positionArray = new Float32Array(firefliesCount *3)
const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 4
    positionArray[i * 3 + 1] = Math.random() * 2
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4

    scaleArray[i] = Math.random()
}

firefliesGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3))
firefliesGeometry.setAttribute('atrScale', new THREE.BufferAttribute(scaleArray, 1))


// point material
const firefliesMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uSize: { value: 100 },
        uTime: { value:0 }
    },
    vertexShader: firefliesVertexShader,
    fragmentShader: firefliesFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
})

gui.add(firefliesMaterial.uniforms.uSize, 'value').min(0).max(200).step(1).name('firefliesSize')

// points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial)
scene.add(fireflies)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    //update fireflies
    firefliesMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 0.3
camera.position.y = 1
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Ограничиваем вращение по вертикали
controls.minPolarAngle = Math.PI / 3;
controls.maxPolarAngle = Math.PI / 2.3;

// Ограничиваем дальность зума
controls.minDistance = 3; // минимальное расстояние
controls.maxDistance = 5; // максимальное расстояние

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#009ceb'
renderer.setClearColor(debugObject.clearColor)
gui
    .addColor(debugObject, 'clearColor')
    .onFinishChange(() => {
        renderer.setClearColor(debugObject.clearColor)
    })


/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //update materials
    firefliesMaterial.uniforms.uTime.value = elapsedTime
    portalLightMaterial.uniforms.uTime.value = elapsedTime

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
