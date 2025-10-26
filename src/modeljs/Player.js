import { AnimationMixer } from "three";

export class Player {
  constructor({ gltfLoader, scene, meshes, modelSrc, name, callback, hideMeshNames = [], position = {} }) {
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

      resolve();
    });
  }
}
