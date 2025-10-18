import { Vector3, Euler } from 'three';

export class Basic{
  constructor({
    scene,
    gltfLoader,
    meshes,
    position,
    rotation,
    scale,
    name,
    modelSrc,
  }){
    this.scene = scene;
    this.gltfLoader = gltfLoader;
    this.meshes = meshes;

    const {x: pX = 0, y: pY = 0, z: pZ = 0} = position;
    this.position = {x: pX, y: pY, z: pZ};    
    const {x: rX = 0, y: rY = 0, z: rZ = 0} = rotation;
    this.rotation = {x: rX, y: rY, z: rZ};    
    const {x: sX = 1, y: sY = 1, z: sZ = 1} = scale;
    this.scale = {x: sX, y: sY, z: sZ} ;    

    this.name = name;
    this.modelSrc = modelSrc;

    this.init();
  }

  async init(){
    console.log(this.gltfLoader);
    
    const glb = await this.gltfLoader.loadAsync(this.modelSrc);

    this.modelMesh = glb.scene.children[0];
    this.modelMesh.traverse(child => child.isMesh && (child.castShadow = true));
    
    this.modelMesh.position.set(this.position.x, this.position.y, this.position.z);
    this.modelMesh.position.y = .3

    this.modelMesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    
    this.modelMesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
    
    this.modelMesh.name = this.name;
    
    this.scene.add(this.modelMesh);
    this.meshes.push(this.modelMesh);
  }
}