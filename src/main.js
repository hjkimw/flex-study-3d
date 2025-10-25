import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import gsap from "gsap";
import { Player } from "./modeljs/Player.js";
import { Room } from "./modeljs/Room.js";
import { debounce } from "es-toolkit";
import { setActive } from "./utils.js";

const meshes = [];

let animationCameraLock = false,
  isKeydown = false,
  isJumping = false,
  pendingDestination = null;

/* -------------------------------------------------------------------------- */
/*                                Texture Setting                             */
/* -------------------------------------------------------------------------- */
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load("/assets/images/bg.jpg");
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 10;
floorTexture.repeat.y = 10;


/* -------------------------------------------------------------------------- */
/*                                Renderer Setting                            */
/* -------------------------------------------------------------------------- */
const canvas = document.querySelector("#three-canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/* -------------------------------------------------------------------------- */
/*                                Scene Setting                               */
/* -------------------------------------------------------------------------- */
const scene = new THREE.Scene();


/* -------------------------------------------------------------------------- */
/*                                Camera Setting                              */
/* -------------------------------------------------------------------------- */
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

// intro
// gsap.fromTo(camera.position, {
//   x: introCameraPosition.x,
//   y: introCameraPosition.y,
//   z: introCameraPosition.z,
// }, {
//   x: cameraPosition.x,
//   y: cameraPosition.y,
//   z: cameraPosition.z,
//   onComplete() {
//   },
//   duration: 2,
//   delay: 1,
//   ease: 'power2.inOut'
// });

camera.zoom = 0.1;
camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();
scene.add(camera);


/* -------------------------------------------------------------------------- */
/*                                Raycaster Setting                           */
/* -------------------------------------------------------------------------- */
const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(), // mouse coordinates
  destinationPoint = new THREE.Vector3(); // destination point
let isPressed = false,
  angle = 0;

function calculateMousePosition(e) {
  mouse.x = (e.clientX / canvas.clientWidth) * 2 - 1;
  mouse.y = -((e.clientY / canvas.clientHeight) * 2 - 1);
}


/* -------------------------------------------------------------------------- */
/*                                Light Setting                               */
/* -------------------------------------------------------------------------- */
const ambientLight = new THREE.AmbientLight("white", 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight("white", 0.2);
const directionalLightOriginPosition = new THREE.Vector3(1, 1, 1);

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


/* -------------------------------------------------------------------------- */
/*                                Footer Objects                               */
/* -------------------------------------------------------------------------- */
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


/* -------------------------------------------------------------------------- */
/*                                Pointer Objects                               */
/* -------------------------------------------------------------------------- */
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


/* -------------------------------------------------------------------------- */
/*                                Player Setting                              */
/* -------------------------------------------------------------------------- */
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
    const directionalLight = new THREE.DirectionalLight("white", .4);

    directionalLight.castShadow = true;

    this.modelMesh.add(directionalLight);
    initY = this.modelMesh.position.y;
  },
});


/* -------------------------------------------------------------------------- */
/*                                Spot Mesh Setting                           */
/* -------------------------------------------------------------------------- */
const spotMeshes = [];

const spotMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    color: 'yellow',
    transparent: true,
    opacity: 0.5,
  })
);

// spotMesh.position.set(-5, 0.005, -5);
spotMesh.position.y = 0.005;
spotMesh.rotation.x = -Math.PI/2; // 수평으로 회전
spotMesh.receiveShadow = true;  // 그림자가 표현될 수 있게 설정

for(let i=0; i<5; i++) spotMeshes.push(spotMesh.clone());

scene.add(...spotMeshes);

/* -------------------------------------------------------------------------- */
/*                                Mesh Objects                                */
/* -------------------------------------------------------------------------- */

const roomInitalSetting = {
  position: {
    y: -8,
  },
  rotation: {
    x: Math.PI / 2,
  },
  scale: {
    x: 0.016,
    y: 0.016,
    z: 0.016,
  },
};


// room one
const roomOne = new Room({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_7.glb",
  name: "room",
  position: {
    ...roomInitalSetting.position,
    x: -10,
    z: -20,
  },
  rotation: {
    ...roomInitalSetting.rotation,
  },
  scale: {
    ...roomInitalSetting.scale,
  },
  spotMesh: spotMeshes[0],
});


const roomTwo = new Room({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_7.glb",
  name: "roomTwo",
  position: {
    ...roomInitalSetting.position,
    x: 10,
    z: -20,
  },
  rotation: {
    ...roomInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...roomInitalSetting.scale,
  },
  callback(){
    const directionalLight = new THREE.DirectionalLight("white", 5);
    directionalLight.castShadow = true;
    this.modelMesh.add(directionalLight);
  },
  spotMesh: spotMeshes[1],
});


const roomThree = new Room({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_20.glb",
  name: "roomThree",
  position: {
    ...roomInitalSetting.position,
    x: 0,
    z: 15,
  },
  rotation: {
    ...roomInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...roomInitalSetting.scale,
  },
  callback(){
    const directionalLight = new THREE.DirectionalLight("white", 5);
    directionalLight.castShadow = true;
    this.modelMesh.add(directionalLight);
  },
  spotMesh: spotMeshes[2],
});


const roomFour = new Room({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_20.glb",
  name: "roomFour",
  position: {
    ...roomInitalSetting.position,
    x: 15,
    z: -5
  },
  rotation: {
    ...roomInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...roomInitalSetting.scale,
  },
  callback(){

  },
  spotMesh: spotMeshes[3],
});


const roomFive = new Room({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_20.glb",
  name: "roomFive",
  position: {
    ...roomInitalSetting.position,
    x: -15,
    z: -5
  },
  rotation: {
    ...roomInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...roomInitalSetting.scale,
  },
  callback(){

  },
  spotMesh: spotMeshes[4],
});


/* -------------------------------------------------------------------------- */
/*                          Raycasting Setting                                */
/* -------------------------------------------------------------------------- */

function checkIntersects() {
  const intersects = raycaster.intersectObjects(meshes);

  for (const item of intersects) {

    if(item.object.name === "room"){     
      console.log('room');
      break;
    }

    if(item.object.name === "player"){     
      console.log('player');      
      break;
    }

    if (item.object.name === "floor") {
      const newDestination = {
        x: item.point.x,
        z: item.point.z,
        y: 0.3
      };

      // 점프 중에는 목적지만 저장하고 즉시 회전/이동 X
      if (isJumping) {
        pendingDestination = newDestination;
      } else {
        destinationPoint.x = newDestination.x;
        destinationPoint.z = newDestination.z;
        destinationPoint.y = newDestination.y;
        player.modelMesh.lookAt(destinationPoint);
        player.walking = true;
        pendingDestination = null;
      }

      pointer.position.x = newDestination.x;
      pointer.position.z = newDestination.z;
    }

    break;
  }
}

function raycasting() {
  raycaster.setFromCamera(mouse, camera);
  checkIntersects();
}

const clock = new THREE.Clock();

/* -------------------------------------------------------------------------- */
/*                                Draw Loop                                   */
/* -------------------------------------------------------------------------- */
function draw() {
  const delta = clock.getDelta();

  // 카메라 업데이트
  if (camera.position) {
    camera.updateProjectionMatrix();
  }

  // Player 애니메이션 업데이트
  if (player.mixer) {
    player.mixer.update(delta);
  }

  // Player 애니메이션 동작
  if (player.modelMesh) {

    // 목적지에 도달했을 때 걷기 애니메이션 정지
    if (
      player.modelMesh.position.x.toFixed(1) === destinationPoint.x.toFixed(1) &&
      player.modelMesh.position.z.toFixed(1) === destinationPoint.z.toFixed(1)
    ) {
      player.walking = false;
    }

    !animationCameraLock && camera.lookAt(player.modelMesh.position);

    // 클릭/터치 이벤트 발생 시 레이캐스팅 동작 실행
    if (isPressed) {
      raycasting();
    }

    // Player 걷고 있을 때
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

      // 목적지에 도착 시 정지
      if (
        Math.abs(destinationPoint.x - player.modelMesh.position.x) < 0.03 &&
        Math.abs(destinationPoint.z - player.modelMesh.position.z) < 0.03
      ) {
        player.walking = false;
      }

      // roomOne 모델 활성화
      setActive({ spotMesh: spotMeshes[0], player, targetModel: roomOne, camera });

      // roomTwe 모델 활성화
      setActive({ spotMesh: spotMeshes[1], player, targetModel: roomTwo, camera });

      // roomThree 모델 활성화
      setActive({ spotMesh: spotMeshes[2], player, targetModel: roomThree, camera });
      
      // roomFour 모델 활성화
      setActive({ spotMesh: spotMeshes[3], player, targetModel: roomFour, camera });

      // roomFive 모델 활성화
      setActive({ spotMesh: spotMeshes[4], player, targetModel: roomFive, camera });




    } else {
      player.walkingAction.stop();
      player.defaultAction.play();
    }
  }

  renderer.render(scene, camera);
  renderer.setAnimationLoop(draw);
}
draw();


/* -------------------------------------------------------------------------- */
/*                                 Mouse Event                                */
/* -------------------------------------------------------------------------- */
canvas.addEventListener("mousedown", (e) => {
  isPressed = true;
  calculateMousePosition(e);
});

canvas.addEventListener("mouseup", () => (isPressed = false));

canvas.addEventListener("mousemove", (e) => isPressed && calculateMousePosition(e));


/* -------------------------------------------------------------------------- */
/*                                Touch Event                                */
/* -------------------------------------------------------------------------- */
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


/* -------------------------------------------------------------------------- */
/*                                Keydown Event                                */
/* -------------------------------------------------------------------------- */
window.addEventListener("keydown", ({ code }) => {
  if (!player.modelMesh) return;

  switch (code.toUpperCase()) {
    case "SPACE":
      if (!isKeydown) {
        animationCameraLock = true;
        isKeydown = true;
        isJumping = true;

        player.walkingAction.stop();
        player.defaultAction.stop();
        player.jumpAction.play();

        const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "none" } });
        tl.to(player.modelMesh.position, { y: 4 });
        tl.to(player.modelMesh.position, { y: initY });

        setTimeout(() => {
          animationCameraLock = false;
          isKeydown = false;
          isJumping = false;

          // 점프 중에 클릭한 목적지가 있으면 이동 시작하게 서ㄹ정
          if (pendingDestination) {
            destinationPoint.x = pendingDestination.x;
            destinationPoint.z = pendingDestination.z;
            destinationPoint.y = pendingDestination.y;

            player.modelMesh.lookAt(destinationPoint);
            
            player.walking = true;
            pendingDestination = null;
          }
        }, tl.duration() * 1500);
      }
      break;
  }
});


/* -------------------------------------------------------------------------- */
/*                                 Resize Event                                */
/* -------------------------------------------------------------------------- */
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