import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import gsap from 'gsap';
import { Player } from './modeljs/Player.js';
import { Cube } from './modeljs/Cube.js';
import { debounce } from 'es-toolkit';
import { setActive } from './utils.js';
import { Barricade } from './modeljs/Barricade.js';
import * as CANNON from 'cannon-es';

const cubeStates = {
  cubeOne: false,
  cubeTwo: false,
  cubeThree: false,
  cubeFour: false,
};

let introLock = false;

const modalData = {
  cubeOne: {
    title: 'Cube One',
    image: '/assets/images/bg.jpg',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi quia molestiae culpa dolore aspernatur officia illum, numquam eaque, cupiditate quidem eos temporibus nobis assumenda nostrum cumque, aut soluta ratione. Assumenda officia amet veniam consectetur commodi provident eius eaque maxime ullam.',
  },
  cubeTwo: {
    title: 'Cube Two',
    image: '/assets/images/bg.jpg',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi quia molestiae culpa dolore aspernatur officia illum, numquam eaque, cupiditate quidem eos temporibus nobis assumenda nostrum cumque, aut soluta ratione. Assumenda officia amet veniam consectetur commodi provident eius eaque maxime ullam.',
  },
  cubeThree: {
    title: 'Cube Three',
    image: '/assets/images/bg.jpg',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi quia molestiae culpa dolore aspernatur officia illum, numquam eaque, cupiditate quidem eos temporibus nobis assumenda nostrum cumque, aut soluta ratione. Assumenda officia amet veniam consectetur commodi provident eius eaque maxime ullam.',
  },
  cubeFour: {
    title: 'Cube Four',
    image: '/assets/images/bg.jpg',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Excepturi quia molestiae culpa dolore aspernatur officia illum, numquam eaque, cupiditate quidem eos temporibus nobis assumenda nostrum cumque, aut soluta ratione. Assumenda officia amet veniam consectetur commodi provident eius eaque maxime ullam.',
  },
};

// Cube 상태 변화 감지 및 처리
function checkCubeStates() {
  const cubes = [
    { spotMesh: spotMeshes[0], targetModel: cubeOne, stateKey: 'cubeOne' },
    { spotMesh: spotMeshes[1], targetModel: cubeTwo, stateKey: 'cubeTwo' },
    { spotMesh: spotMeshes[2], targetModel: cubeThree, stateKey: 'cubeThree' },
    { spotMesh: spotMeshes[3], targetModel: cubeFour, stateKey: 'cubeFour' },
  ];

  cubes.forEach(({ spotMesh, targetModel, stateKey }) => {
    const isInRange =
      Math.abs(spotMesh.position.x - player.modelMesh.position.x) < 5 &&
      Math.abs(spotMesh.position.z - player.modelMesh.position.z) < 5;

    // 상태가 변경된 경우에만 setActive 호출
    if (isInRange !== cubeStates[stateKey]) {
      cubeStates[stateKey] = isInRange;
      setActive({ spotMesh, player, targetModel, camera });
    }
  });
}

const meshes = [];

let isKeydown = false, isJumping = false, pendingDestination = null;


const cannonWorld = new CANNON.World();
cannonWorld.gravity.set(0, -10, 0);

// 물리 재질 설정
const defaultCannonMaterial = new CANNON.Material('default');
const playerCannonMaterial = new CANNON.Material('player');

// 접촉 재질 설정
const defaultContactMaterial = new CANNON.ContactMaterial(defaultCannonMaterial, defaultCannonMaterial, {
  friction: 1,
  restitution: 0.2,
});

const playerContactMaterial = new CANNON.ContactMaterial(playerCannonMaterial, defaultCannonMaterial, {
  friction: 100,
  restitution: 0,
});

// 접촉 재질 등록
cannonWorld.addContactMaterial(playerContactMaterial);
cannonWorld.defaultContactMaterial = defaultContactMaterial;



/* -------------------------------------------------------------------------- */
/*                                Texture Setting                             */
/* -------------------------------------------------------------------------- */
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load('/assets/images/bg.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.x = 10;
floorTexture.repeat.y = 10;

/* -------------------------------------------------------------------------- */
/*                                Renderer Setting                            */
/* -------------------------------------------------------------------------- */
const canvas = document.querySelector('#three-canvas');
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

const introCameraPosition = new THREE.Vector3(0, 20, 0);
const cameraPosition = new THREE.Vector3(1, 5, 5);

// 개발 모드
const isDevMode = true;

// 개발 모드일 때는 바로 최종 카메라 위치로 설정 아니면 인트로 위치로 설정
camera.position.set(
  isDevMode ? cameraPosition.x : introCameraPosition.x,
  isDevMode ? cameraPosition.y : introCameraPosition.y,
  isDevMode ? cameraPosition.z : introCameraPosition.z
);

camera.zoom = 0.1;
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
const ambientLight = new THREE.AmbientLight('white', 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight('white', 0.2);
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
floorMesh.name = 'floor';
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.receiveShadow = true;
scene.add(floorMesh);
meshes.push(floorMesh);


const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({
  mass: 0, // fixed
  position: new CANNON.Vec3(0, 0, 0),
  shape: floorShape,
  material: defaultCannonMaterial,
});


const floorQuaternion = new CANNON.Quaternion();
floorQuaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
floorBody.quaternion.copy(floorQuaternion);

cannonWorld.addBody(floorBody);

// Loader
const gltfLoader = new GLTFLoader();

/* -------------------------------------------------------------------------- */
/*                                Pointer Objects                               */
/* -------------------------------------------------------------------------- */
const pointer = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({
    color: 'orange',
    transparent: true,
    opacity: 0,
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
  cannonWorld,
  cannonMaterial: playerCannonMaterial,
  cannonShape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
  mass: 1,
  gltfLoader,
  meshes,
  modelSrc: '/assets/models/robot.animated.glb',
  hideMeshNames: ['?', 'smile', 'cry', 'angry', 'curve', 'default_1', 'default_2', 'sweating'],
  name: 'player',
  callback() {
    const directionalLight = new THREE.DirectionalLight('white', 0.4);

    directionalLight.castShadow = true;

    this.modelMesh.add(directionalLight);
    // initY = this.modelMesh.position.y;
  },
  position: {
    x: 0,
    y: -8,
    z: 0,
  },
});

/* -------------------------------------------------------------------------- */
/*                                Spot Mesh Setting                           */
/* -------------------------------------------------------------------------- */



const introSpotMeshTexture = textureLoader.load('/assets/images/robot-image-maked.png');

const introSpotMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshBasicMaterial({
    map: introSpotMeshTexture,
    transparent: true,
  })
);
introSpotMesh.position.y = 0.003;
introSpotMesh.rotation.x = -Math.PI / 2;
introSpotMesh.receiveShadow = true;
scene.add(introSpotMesh);


const introSpotMeshTexture2 = textureLoader.load('/assets/images/robot-image.png');


const spotMeshes = [];


const spotMeshTexture = textureLoader.load('/assets/images/test_room.png');

const spotMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({
    map: spotMeshTexture,
    transparent: true,
  })
);
spotMesh.position.y = 0.005;
spotMesh.rotation.x = -Math.PI / 2;
spotMesh.receiveShadow = true; 

for (let i = 0; i < 5; i++) spotMeshes.push(spotMesh.clone());


/* -------------------------------------------------------------------------- */
/*                                Mesh Objects                                */
/* -------------------------------------------------------------------------- */

// 왼쪽 벽
const barricadeLeft = new Barricade({
  scene,
  cannonWorld,
  cannonMaterial: defaultCannonMaterial,
  cannonShape: new CANNON.Box(new CANNON.Vec3(5, 5, 50)),
  mass: 0, // fixed
  position: {
    x: -25,
    y: 5,
    z: 0,
  },
  scale: {
    x: 0.1,
    y: 1,
    z: 5,
  }
});

// 오른쪽 벽
const barricadeRight = new Barricade({
  scene,
  cannonWorld,
  cannonMaterial: defaultCannonMaterial,
  cannonShape: new CANNON.Box(new CANNON.Vec3(5, 5, 50)),
  mass: 0, // fixed
  position: {
    x: 25,
    y: 5,
    z: 0,
  },
  scale: {
    x: 0.1,
    y: 1,
    z: 5,
  }
});

// 위쪽 벽
const barricadeTop = new Barricade({
  scene,
  cannonWorld,
  cannonMaterial: defaultCannonMaterial,
  cannonShape: new CANNON.Box(new CANNON.Vec3(50, 5, 5)),
  mass: 0, // fixed
  position: {
    x: 0,
    y: 5,
    z: -25,
  },
  scale: {
    x: 5,
    y: 1,
    z: 0.1,
  }
});

// 아래쪽 벽
const barricadeBottom = new Barricade({
  scene,
  cannonWorld,
  cannonMaterial: defaultCannonMaterial,
  cannonShape: new CANNON.Box(new CANNON.Vec3(50, 5, 5)),
  mass: 0, // fixed
  position: {
    x: 0,
    y: 5,
    z: 25,
  },
  scale: {
    x: 5,
    y: 1,
    z: 0.1,
  }
});




const cubeInitalSetting = {
  position: {
    y: -8,
  },
  rotation: {
    x: Math.PI / 2,
  },
  scale: {
    x: 1,
    y: 1,
    z: 1,
  },
};

// room one
const cubeOne = new Cube({
  scene,
  gltfLoader,
  meshes,
  name: 'cubeOne',
  position: {
    ...cubeInitalSetting.position,
    x: -13,
    z: -10,
  },
  rotation: {
    ...cubeInitalSetting.rotation,
  },
  scale: {
    ...cubeInitalSetting.scale,
  },
  modalData: modalData.cubeOne,
});

spotMeshes[0].position.x = cubeOne.position.x;
spotMeshes[0].position.z = cubeOne.position.z;
scene.add(spotMeshes[0]);


const cubeTwo = new Cube({
  scene,
  gltfLoader,
  meshes,
  name: 'cubeTwo',
  position: {
    ...cubeInitalSetting.position,
    x: 13.5,
    z: -10,
  },
  rotation: {
    ...cubeInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...cubeInitalSetting.scale,
  },
  callback() {

  },
  // spotMesh: spotMeshes[1],
  modalData: modalData.cubeTwo,
});

spotMeshes[1].position.x = cubeTwo.position.x;
spotMeshes[1].position.z = cubeTwo.position.z;
scene.add(spotMeshes[1]);


const cubeThree = new Cube({
  scene,
  gltfLoader,
  meshes,
  name: 'cubeThree',
  position: {
    ...cubeInitalSetting.position,
    x: -13.5,
    z: 10,
  },
  rotation: {
    ...cubeInitalSetting.rotation,
    z: Math.PI / 2,
  },
  scale: {
    ...cubeInitalSetting.scale,
  },
  callback() {

  },
  modalData: modalData.cubeThree,
});

spotMeshes[2].position.x = cubeThree.position.x;
spotMeshes[2].position.z = cubeThree.position.z;
scene.add(spotMeshes[2]);


const cubeFour = new Cube({
  scene,
  gltfLoader,
  meshes,
  name: 'cubeFour',
  position: {
    ...cubeInitalSetting.position,
    x: 12.5,
    z: 9.5,
  },
  rotation: {
    ...cubeInitalSetting.rotation,
  },
  scale: {
    ...cubeInitalSetting.scale,
  },
  callback() {},
  modalData: modalData.cubeFour,
});

spotMeshes[3].position.x = cubeFour.position.x;
spotMeshes[3].position.z = cubeFour.position.z;
scene.add(spotMeshes[3]);



/* -------------------------------------------------------------------------- */
/*                                Intro Animation                             */
/* -------------------------------------------------------------------------- */


Promise.all([
  player.loadPromise,
  cubeOne.loadPromise,
  cubeTwo.loadPromise,
  cubeThree.loadPromise,
  cubeFour.loadPromise,
]).then(() => {

  if (isDevMode) {
    // 개발 모드일 때는 인트로 스킵하고 바로 최종 상태로 설정
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(0, 0, 0);
    
    if (player.modelMesh) {
      player.modelMesh.position.y = 0.3;
    }
    
    introLock = true;
    pointer.material.opacity = 0.35;
    introSpotMesh.material.opacity = 0;
  
  
  } else {
    // 일반 모드일 때는 인트로 애니메이션 실행
   
    const introTl = gsap.timeline({
      delay: 1.5,
      onComplete: ()=> introLock = true,
    });

    introTl.to(camera.position, {
      z: cameraPosition.z,
    })

    introTl.to(camera.position, {
      x: cameraPosition.x,
      y: cameraPosition.y,
      duration: 3,
      ease: 'none',
      immediateRender: false,
      onUpdate: ()=> camera.lookAt(0, 0, 0),
      onComplete: ()=> introSpotMesh.material.map = introSpotMeshTexture2,
    }, '<')

    introTl.to(player.modelMesh.position, {
      y: 4,
      ease: 'power2.out',
    })
    introTl.to(player.modelMesh.position, {
      y: 0.3,
      duration: .4,
      ease: 'power2.in',
      onComplete() {
        gsap.to(pointer.material, { opacity: .35 })
        gsap.to(introSpotMesh.material, { opacity: 0 })
      },
    })
  }

});

/* -------------------------------------------------------------------------- */
/*                          Raycasting Setting                                */
/* -------------------------------------------------------------------------- */

function checkIntersects() {

  if (!introLock) return;

  const intersects = raycaster.intersectObjects(meshes);

  for (const item of intersects) {

    if (item.object.name === 'floor') {
      const newDestination = {
        x: item.point.x,
        z: item.point.z,
        y: 0.3,
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

  // 물리 엔진 업데이트
  cannonWorld.step(1 / 60, delta, 3);

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
    
    // 물리 바디가 있으면 중력의 영향을 항상 방지 <- 점프 중이 아닐 때
    if (player.cannonBody && !isJumping) {
      player.cannonBody.velocity.set(0, 0, 0);
      player.cannonBody.angularVelocity.set(0, 0, 0);
    }

    // 목적지에 도달했을 때 걷기 애니메이션 정지
    if (
      player.modelMesh.position.x.toFixed(1) === destinationPoint.x.toFixed(1) &&
      player.modelMesh.position.z.toFixed(1) === destinationPoint.z.toFixed(1)
    ) {
      player.walking = false;
    }

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

      // 물리 바디가 있으면 물리 바디의 위치를 업데이트
      if (player.cannonBody) {
        player.cannonBody.position.x += Math.cos(angle) * 0.08;
        player.cannonBody.position.z += Math.sin(angle) * 0.08;

        // 메시를 물리 바디와 동기화
        player.modelMesh.position.copy(player.cannonBody.position);
      } else {
        // 물리 바디가 없으면 기존 방식대로
        player.modelMesh.position.x += Math.cos(angle) * 0.08;
        player.modelMesh.position.z += Math.sin(angle) * 0.08;
      }

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

      // Room 상태 변화 감지
      checkCubeStates();
    } else {
      player.walkingAction.stop();
      player.defaultAction.play();
    }
  }

  // 바리케이드 물리 동기화 (고정 물체이므로 동기화 불필요)
  // [barricadeLeft, barricadeRight, barricadeTop, barricadeBottom].forEach(barricade => {
  //   if (barricade && barricade.cannonBody) {
  //     barricade.updateFromPhysics();
  //   }
  // });

  // 큐브들 물리 동기화 (고정 물체이고 GSAP으로 애니메이션 되므로 동기화 불필요)
  // [cubeOne, cubeTwo, cubeThree, cubeFour].forEach(cube => {
  //   if (cube && cube.cannonBody) {
  //     cube.updateFromPhysics();
  //   }
  // });

  renderer.render(scene, camera);
  renderer.setAnimationLoop(draw);
}
draw();

/* -------------------------------------------------------------------------- */
/*                                 Mouse Event                                */
/* -------------------------------------------------------------------------- */
canvas.addEventListener('mousedown', (e) => {
  isPressed = true;
  calculateMousePosition(e);
});

canvas.addEventListener('mouseup', () => (isPressed = false));

canvas.addEventListener('mousemove', (e) => isPressed && calculateMousePosition(e));

/* -------------------------------------------------------------------------- */
/*                                Touch Event                                */
/* -------------------------------------------------------------------------- */
canvas.addEventListener('touchstart', (e) => {
  isPressed = true;
  calculateMousePosition(e.touches[0]);
});

canvas.addEventListener('touchend', () => (isPressed = false));

canvas.addEventListener('touchmove', (e) => {
  if (isPressed) {
    calculateMousePosition(e.touches[0]);
  }
});

/* -------------------------------------------------------------------------- */
/*                                Keydown Event                                */
/* -------------------------------------------------------------------------- */
window.addEventListener('keydown', ({ code }) => {
  if (!player.modelMesh || !introLock) return;

  switch (code.toUpperCase()) {
    case 'SPACE':
      if (!isKeydown) {
        // animationCameraLock = true;
        isKeydown = true;
        isJumping = true;

        player.walkingAction.stop();
        player.defaultAction.stop();
        player.jumpAction.play();

        const tl = gsap.timeline({ defaults: { duration: 0.5, ease: 'power2.intOut' } });

        // 물리 바디가 있으면 물리 바디도 함께 애니메이션
        if (player.cannonBody) {
          tl.to(player.cannonBody.position, { y: 3 });
          tl.to(player.cannonBody.position, { y: 0 });
          tl.to(player.modelMesh.position, { y: 3 }, 0);
          tl.to(player.modelMesh.position, { y: 0 }, 0.5);
        } else {
          tl.to(player.modelMesh.position, { y: 3 });
          tl.to(player.modelMesh.position, { y: 0 });
        }

        setTimeout(() => {
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
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -aspect;
  camera.right = aspect;
  camera.top = 1;
  camera.bottom = -1;

  camera.updateProjectionMatrix();
}

window.addEventListener('resize', debounce(resize, 100));

const modalOverlay = document.querySelector('.modal-overlay');

window.addEventListener('click', ({ target }) => {
  if (target.classList.contains('modal-close')) {
    modalOverlay.classList.remove('active');
  }
});
