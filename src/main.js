import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import gsap from "gsap";
import { Player } from "./modeljs/Player.js";
import { Basic } from "./modeljs/Basic.js";
import { debounce } from "es-toolkit";

const meshes = [];

let animationCameraLock = false,
  isKeydown = false,
  isJumping = false,
  pendingDestination = null;

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

const scene = new THREE.Scene();


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


const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2(), // mouse coordinates
  destinationPoint = new THREE.Vector3(); // destination point
let isPressed = false,
  angle = 0;

function calculateMousePosition(e) {
  mouse.x = (e.clientX / canvas.clientWidth) * 2 - 1;
  mouse.y = -((e.clientY / canvas.clientHeight) * 2 - 1);
}


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


// spot
const spotMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshStandardMaterial({
    color: 'red',
    transparent: true,
    opacity: 0.5,
  })
);


// spotMesh.position.set(-5, 0.005, -5);
spotMesh.position.y = 0.005;
spotMesh.rotation.x = -Math.PI/2; // 수평으로 회전
spotMesh.receiveShadow = true;  // 그림자가 표현될 수 있게 설정
scene.add(spotMesh);


// room one
const roomOne = new Basic({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_4__.glb",
  name: "room",
  position: {
    x: -5,
    y: -5,
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
  callback(){

    spotMesh.position.x = roomOne.position.x;
    spotMesh.position.z = roomOne.position.z;

    // console.log(spotMesh.position, roomOne.position);
  }
});


const roomTwo = new Basic({
  scene,
  gltfLoader,
  meshes,
  modelSrc: "/assets/models/Room_7.glb",
  name: "roomTwo",
  position: {
    x: 10,
    y: 0,
    z: -5,
  },
  rotation: {
    x: Math.PI / 2,
    y: 0,
    z: Math.PI / 2,
  },
  scale: {
    x: 0.01,
    y: 0.01,
    z: 0.01,
  },
  callback(){
    const directionalLight = new THREE.DirectionalLight("white", 5);
    directionalLight.castShadow = true;
    this.modelMesh.add(directionalLight);
  }
});



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

      // Player가 spotMesh 범위 영역에 진입했을 때
      if(
        Math.abs(spotMesh.position.x - player.modelMesh.position.x) < 1.5 &&
        Math.abs(spotMesh.position.z - player.modelMesh.position.z) < 1.5
      ){
        
        if(!roomOne.visibile){

          console.log('나오셈');
          
          roomOne.visibile = true;
          
          spotMesh.material.color.set('green');

          // 모델이 위로 올라오고
          const tl = gsap.timeline();
          tl.to(roomOne.modelMesh.position, {
            duration: 1, 
            y: 0.3,
            ease: 'Bounce.easeOut',
          });
          
          // player 위치 조정하고
          tl.to(player.modelMesh.position, {
            duration: 0.5,
            y: 1,
            ease: 'none',
          }, '<+.5');

          // 카메라의 위치 조정하고
          gsap.to(camera.position, {
            duration: 1, 
            y: 3,
          });
        }		    


      }else{ 
        // Player가 spotMesh 범위 영역에 벗어났을 때

        if(roomOne.visibile){ 
        
          console.log('들어가셈');
          
          roomOne.visibile = false;
          
          spotMesh.material.color.set('red');

          const tl = gsap.timeline();

          // 모델이 아래로 들어가고
          tl.to(roomOne.modelMesh.position, {
            duration: 0.5,
            y: -5,
          });

          // player 위치 원상복구 하고
          tl.to(player.modelMesh.position, {
            duration: 0.5,
            y: .3,
            ease: 'none',
          }, '<');
          
          // 카메라 위치 원상복구
          gsap.to(camera.position, {
            duration: 1,
            y: 5,
          });
        } 
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


canvas.addEventListener("mousedown", (e) => {
  isPressed = true;
  calculateMousePosition(e);
});

canvas.addEventListener("mouseup", () => (isPressed = false));

canvas.addEventListener("mousemove", (e) => isPressed && calculateMousePosition(e));


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