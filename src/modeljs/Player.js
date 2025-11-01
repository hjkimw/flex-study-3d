import { AnimationMixer } from "three";
import { Vec3, Box, Body, Quaternion } from 'cannon-es';

export class Player {
  constructor({ gltfLoader, scene, meshes, modelSrc, name, callback, cannonWorld, cannonMaterial, cannonShape, mass, hideMeshNames = [], position = {} }) {
    this.walking = false;
    this.name = name;
    this.scene = scene;
    this.meshes = meshes;
    this.gltfLoader = gltfLoader;
    this.modelSrc = modelSrc;
    this.callback = callback;
    this.name = name;
    this.hideMeshNames = hideMeshNames;

    const {x: pX = 0, y: pY = 0.3, z: pZ = 0} = position;
    this.position = {x: pX, y: pY, z: pZ};

    this.cannonShape = cannonShape || new Box(new Vec3(this.width / 2, this.height / 2, this.depth / 2));

    this.mass = mass || 0; // 질량 (기본값 0: 고정 물체)
    this.cannonWorld = cannonWorld; // 물리 세계 참조
    this.cannonMaterial = cannonMaterial; // 물리 재질 참조

    this.loadPromise = this.init();
  }

  init() {
    return new Promise(async (resolve) => {
      const glb = await this.gltfLoader.loadAsync(this.modelSrc);

      glb.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          // console.log("Child Name:", child.name);
          if (this.hideMeshNames && this.hideMeshNames.includes(child.name)) {
            child.visible = false;
          }
          child.name = this.name;
        }
      });

    this.modelMesh = glb.scene || glb.scene.children[0];
    this.modelMesh.position.set(this.position.x, this.position.y, this.position.z);

      this.modelMesh.name = this.name;

      this.scene.add(this.modelMesh);
      this.meshes.push(this.modelMesh);

      this.mixer = new AnimationMixer(this.modelMesh);

      this.actions = glb.animations.map((animation) => this.mixer.clipAction(animation));

      this.defaultAction = this.actions[16];
      this.defaultAction.play();

      this.jumpAction = this.actions[23];
      this.walkingAction = this.actions[23];
      this.walkingAction.timeScale = 2;

      this.callback && this.callback();

      this.setCannonBody();

      resolve();
    });
  }

  setCannonBody() {
    this.cannonBody = new Body({
      mass: this.mass,
      position: new Vec3(this.position.x, this.position.y, this.position.z),
      shape: this.cannonShape,
      material: this.cannonMaterial, // 물리 재질 설정
    });

    // X축
    const quatX = new Quaternion();
    const axisX = new Vec3(1, 0, 0);
    quatX.setFromAxisAngle(axisX, 0);

    // Y축
    const quatY = new Quaternion();
    const axisY = new Vec3(0, 1, 0);
    quatY.setFromAxisAngle(axisY, 0);

    // Z축
    const quatZ = new Quaternion();
    const axisZ = new Vec3(0, 0, 1);
    quatZ.setFromAxisAngle(axisZ, 0);

    const combinedQuat = quatX.mult(quatY).mult(quatZ);

    this.cannonBody.quaternion = combinedQuat;

    this.cannonWorld.addBody(this.cannonBody);
  }

  // 물리 엔진과 메시 동기화
  updateFromPhysics() {
    if (this.cannonBody && this.modelMesh) {
      this.modelMesh.position.copy(this.cannonBody.position);
      this.modelMesh.quaternion.copy(this.cannonBody.quaternion);
    }
  }
}
