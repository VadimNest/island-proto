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



//light
const ambientLight = new THREE.AmbientLight('#ffffff', 1)
scene.add(ambientLight)


const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(3, 0.5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);


// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

gltfLoader.load(
    'island.glb',
    (gltf)=> {
        const model = gltf.scene;
        model.castShadow = true;
        model.receiveShadow = true;
        scene.add(model)
    }
)

let mixer = null
let fox = null;

gltfLoader.load(
    'glTF/Fox.gltf',
    (gltf) =>
    {
        fox = gltf.scene;
        fox.scale.set(0.005, 0.005, 0.005)
        scene.add(fox)

        // Animation
        mixer = new THREE.AnimationMixer(fox)
        const action = mixer.clipAction(gltf.animations[1])
        action.play()
    }
)

let fox2 = null;
let mixer2 = null;

gltfLoader.load(
    'glTF/Fox.gltf',
    (gltf) =>
    {
        fox2 = gltf.scene;
        fox2.scale.set(0.005, 0.005, 0.005)
        scene.add(fox2)

        // Animation
        mixer2 = new THREE.AnimationMixer(fox2)
        const action = mixer2.clipAction(gltf.animations[2])
        action.play()
    }
)


gltfLoader.load(
    'duck/Duck.gltf',
    (gltf) =>
    {
        let duck = gltf.scene;
        duck.position.x = -5;
        duck.position.z = -6;
        duck.rotation.y = -11;
        scene.add(duck)
    }
)


// point geometry
const firefliesGeometry = new THREE.BufferGeometry()
const firefliesCount = 500
const positionArray = new Float32Array(firefliesCount * 3)
const scaleArray = new Float32Array(firefliesCount)

for(let i = 0; i < firefliesCount; i++) {
    positionArray[i * 3 + 0] = (Math.random() - 0.5) * 50
    positionArray[i * 3 + 1] = Math.random() * 10
    positionArray[i * 3 + 2] = (Math.random() - 0.5) * 50

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
camera.position.y = 0.7
camera.position.z = 3
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Ограничиваем вращение по вертикали
controls.minPolarAngle = Math.PI / 2.5;
controls.maxPolarAngle = Math.PI / 2.2;

// Ограничиваем дальность зума
controls.minDistance = 19; // минимальное расстояние
controls.maxDistance = 30; // максимальное расстояние

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

debugObject.clearColor = '#80d4ff'
renderer.setClearColor(debugObject.clearColor)
gui
    .addColor(debugObject, 'clearColor')
    .onFinishChange(() => {
        renderer.setClearColor(debugObject.clearColor)
    })



// Включение теней в рендерере
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap // default THREE.PCFShadowMap


/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0;
//для скорости анимации второй лисы
let previousAzimuthalAngle = controls.getAzimuthalAngle();

let totalRotation = 0; // Общий угол поворота
let previousRotation = 0; // Предыдущий угол поворота

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    if(fox) {
        fox.position.x = Math.cos(elapsedTime * 0.1) * 12;
        fox.position.z = Math.sin(elapsedTime * 0.1) * 12;

        const nextX = Math.cos((elapsedTime + 0.01) * 0.1) * 12;
        const nextZ = Math.sin((elapsedTime + 0.01) * 0.1) * 12;

        const dx = nextX - fox.position.x;
        const dz = nextZ - fox.position.z;

        const theta = Math.atan2(dz, dx);

        fox.rotation.y = -theta + 1.5;
    }

    if(fox2) {
        const radius = 0.95 * 12; // Уменьшаем радиус
        const azimuthalAngle = controls.getAzimuthalAngle(); // Получаем азимутальный угол без смещения

        // Вычисляем разницу между текущим и предыдущим азимутальными углами
        let deltaAngle = azimuthalAngle - previousRotation;

        // Если угол перескакивает с -π на π (или наоборот), корректируем разницу
        if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
        else if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

        // Обновляем общий угол поворота и сохраняем текущий азимутальный угол для следующего кадра
        totalRotation += deltaAngle;
        previousRotation = azimuthalAngle;

        // Используем общий угол поворота для расчета позиции и ориентации лисы
        fox2.position.x = Math.cos(totalRotation + Math.PI / 0.665) * radius;
        fox2.position.z = -Math.sin(totalRotation + Math.PI / 0.665) * radius;

        const nextX = Math.cos(azimuthalAngle + 0.01) * radius;
        const nextZ = -Math.sin(azimuthalAngle + 0.01) * radius;

        const dx = nextX - fox2.position.x;
        const dz = nextZ - fox2.position.z;

        const theta = Math.atan2(dz, dx);

        fox2.rotation.y = -theta + 0.8;

        // Вычисляем скорость прокрутки как абсолютное значение разницы углов
        const scrollSpeed = Math.abs(deltaAngle) * 100;

        // Обновляем скорость анимации второй лисы
        if (mixer2) mixer2.timeScale = scrollSpeed;

        // Обновляем предыдущий азимутальный угол
        previousAzimuthalAngle = azimuthalAngle;
    }



    //update materials
    firefliesMaterial.uniforms.uTime.value = elapsedTime

    if (mixer) mixer.update(deltaTime)
    if (mixer2) mixer2.update(deltaTime)

    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
