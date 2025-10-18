import { AnimationMixer } from 'three';

export class Player{
  constructor({
    gltfLoader, 
    scene, 
    meshes,
    modelSrc,
    name,
    callback,
  }){
    this.walking = false;
    this.name = name;
    this.scene = scene;
    this.meshes = meshes;
    this.gltfLoader = gltfLoader;
    this.modelSrc = modelSrc;
    this.name = name;
    this.callback = callback;

    this.init();
  }

  async init(){
    const glb = await this.gltfLoader.loadAsync(this.modelSrc);
    
    glb.scene.traverse(child => {
      if(child.isMesh){
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.modelMesh = glb.scene || glb.scene.children[0];
    this.modelMesh.position.set(0, .3, 0);

    this.modelMesh.name = this.name;

    this.scene.add(this.modelMesh);
    this.meshes.push(this.modelMesh);


    this.mixer = new AnimationMixer(this.modelMesh);

    this.actions = glb.animations.map(animation => this.mixer.clipAction(animation));

    this.defaultAction = this.actions[16];
    this.defaultAction.play();
    
    this.jumpAction = this.actions[23];
    this.walkingAction = this.actions[23];
    this.walkingAction.timeScale = 2;
    

    this.callback && this.callback();
  }
}