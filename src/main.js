import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { AnimationMixer } from "three";
import gsap from "gsap";
import { Player } from "./modeljs/Player.js";
import { Basic } from "./modeljs/Basic.js";
import { debounce } from "es-toolkit";

const meshes = [];
let animationCameraLock = false,
  isKeydown = false;

const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load("/assets/images/bg.jpg");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 10;
floorTexture.repeat.y = 10;

const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.OrthographicCamera(
  -(window.innerWidth / window.innerHeight),
  window.innerWidth / window.innerHeight,
  1,
  -1,
  -1000,
  1000
);

const introCameraPosition = new THREE.Vector3(0, 1, 0);
const cameraPosition = new THREE.Vector3(1, 5, 5);
camera.position.set(introCameraPosition.x, introCameraPosition.y, introCameraPosition.z);

// gsap.fromTo(camera.position, {
// }, {
//   x: cameraPosition.x,
//   y: cameraPosition.y,
//   z: cameraPosition.z,
//   onComplete() {
//   },
//   duration: 2,
//   delay: 3,
//   ease: 'power2.inOut'
// });

camera.zoom = 0.1;
camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
scene.add(camera);

// Raycaster
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(), // mouse coordinates
  destinationPoint = new THREE.Vector3(); // destination point
let isPressed = false,
  angle = 0;

function calculateMousePosition(e) {
  mouse.x = (e.clientX / canvas.clientWidth) * 2 - 1;
  mouse.y = -((e.clientY / canvas.clientHeight) * 2 - 1);
}

// Light
const ambientLight = new THREE.AmbientLight("white", 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("white", 0.2);
const directionalLightOriginPosition = new THREE.Vector3(1, 1, 1);

// Light Setting
directionalLight.position.x = directionalLightOriginPosition.x;
directionalLight.position.y = directionalLightOriginPosition.y;
directionalLight.position.z = directionalLightOriginPosition.z;

directionalLight.castShadow = true;
directionalLight.receiveShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;

directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.camera.near = -100;
directionalLight.shadow.camera.far = 100;

scene.add(directionalLight);

// footer
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({
    map: floorTexture,
  })
);
floorMesh.name = "floor";
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);
meshes.push(floorMesh);

// Loader
const gltfLoader = new GLTFLoader();

let initY = null;

// Player
const player = new Player({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/robot.animated.glb",
  hideMeshNames: ["?", "smile", "cry", "angry", "curve", "default_1", "default_2", "sweating"],
  name: "player",
  callback() {
    const directionalLight = new THREE.DirectionalLight("white", 1);

    directionalLight.castShadow = true;

    this.modelMesh.add(directionalLight);
    initY = this.modelMesh.position.y;
  },
});

// room one
const roomOne = new Basic({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/room_4.glb",
  name: "room",
  position: {
    x: -10,
    y: 0,
    z: 0,
  },
  rotation: {
    x: Math.PI / 2,
  },
  scale: {
    x: 0.01,
    y: 0.01,
    z: 0.01,
  },
});

// Pointer
const pointer = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({
    color: "orange",
    transparent: true,
    opacity: 0.35,
  })
);
pointer.rotation.x = -Math.PI / 2;
pointer.position.y = 0.01;
pointer.receiveShadow = true;
scene.add(pointer);

function checkIntersects() {
  const intersects = raycaster.intersectObjects(meshes);

  for (const item of intersects) {
    if (item.object.name === "floor") {
      destinationPoint.x = item.point.x;
      destinationPoint.z = item.point.z;
      destinationPoint.y = 0.3;

      player.modelMesh.lookAt(destinationPoint);

      player.walking = true;

      pointer.position.x = destinationPoint.x;
      pointer.position.z = destinationPoint.z;
    }

    break;
  }
}

function raycasting() {
  raycaster.setFromCamera(mouse, camera);
  checkIntersects();
}

const clock = new THREE.Clock();

function draw() {
  const delta = clock.getDelta();

  if (camera.position) {
    camera.updateProjectionMatrix();
  }

  if (player.mixer) {
    player.mixer.update(delta);
  }

  if (player.modelMesh) {
    if (
      player.modelMesh.position.x.toFixed(1) === destinationPoint.x.toFixed(1) &&
      player.modelMesh.position.z.toFixed(1) === destinationPoint.z.toFixed(1)
    ) {
      player.walking = false;
    }

    !animationCameraLock && camera.lookAt(player.modelMesh.position);

    if (isPressed) {
      raycasting();
    }

    if (player.walking) {
      angle = Math.atan2(
        destinationPoint.z - player.modelMesh.position.z,
        destinationPoint.x - player.modelMesh.position.x
      );

      player.modelMesh.position.x += Math.cos(angle) * 0.08;
      player.modelMesh.position.z += Math.sin(angle) * 0.08;

      camera.position.x = cameraPosition.x + player.modelMesh.position.x;
      camera.position.z = cameraPosition.z + player.modelMesh.position.z;

      player.defaultAction.stop();
      player.walkingAction.play();

      if (
        Math.abs(destinationPoint.x - player.modelMesh.position.x) < 0.03 &&
        Math.abs(destinationPoint.z - player.modelMesh.position.z) < 0.03
      ) {
        player.walking = false;
      }
    } else {
      player.walkingAction.stop();
      player.defaultAction.play();
    }
  }

  renderer.render(scene, camera);
  renderer.setAnimationLoop(draw);
}
draw();

// Mouse Event
canvas.addEventListener("mousedown", (e) => {
  isPressed = true;
  calculateMousePosition(e);
});

canvas.addEventListener("mouseup", () => (isPressed = false));

canvas.addEventListener("mousemove", (e) => isPressed && calculateMousePosition(e));

// Touch Event
canvas.addEventListener("touchstart", (e) => {
  isPressed = true;
  calculateMousePosition(e.touches[0]);
});

canvas.addEventListener("touchend", () => (isPressed = false));

canvas.addEventListener("touchmove", (e) => {
  if (isPressed) {
    calculateMousePosition(e.touches[0]);
  }
});

window.addEventListener("keydown", ({ code }) => {
  if (!player.modelMesh) return;

  switch (code.toUpperCase()) {
    case "SPACE":
      if (!isKeydown) {
        animationCameraLock = true;
        isKeydown = true;

        player.walkingAction.stop();
        player.defaultAction.stop();
        player.jumpAction.play();

        const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "none" } });
        tl.to(player.modelMesh.position, { y: 4 });
        tl.to(player.modelMesh.position, { y: initY });
        tl.eventCallback("onComplete", () => player.defaultAction.play());

        setTimeout(() => {
          animationCameraLock = false;
          isKeydown = false;
        }, tl.duration() * 1500);
      }
      break;

    default:
      break;
  }
});


function resize(){
  renderer.setSize(window.innerWidth, window.innerHeight);

  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -aspect;
  camera.right = aspect;
  camera.top = 1;
  camera.bottom = -1;

  camera.updateProjectionMatrix();
}

window.addEventListener("resize", debounce(resize, 100));