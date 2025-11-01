import * as THREE from 'three';
import { Vec3, Box, Body, Quaternion } from 'cannon-es';

export class Barricade {
  constructor({ scene, cannonWorld, cannonMaterial, cannonShape, mass, position, rotation, scale }) {
    this.scene = scene;
    const { x: pX = 0, y: pY = 0.3, z: pZ = 0 } = position || {};
    this.position = { x: pX, y: pY, z: pZ };
    const { x: rX = 0, y: rY = 0, z: rZ = 0 } = rotation || {};
    this.rotation = { x: rX, y: rY, z: rZ };
    const { x: sX = 1, y: sY = 1, z: sZ = 1 } = scale || {};
    this.scale = { x: sX, y: sY, z: sZ };

    // 바리케이드의 크기 (BoxGeometry(10, 10, 10)과 일치)
    this.width = 10;
    this.height = 10;
    this.depth = 10;

    this.cannonShape = cannonShape || new Box(new Vec3(this.width / 2, this.height / 2, this.depth / 2));

    this.mass = mass || 0; 
    this.cannonWorld = cannonWorld; 
    this.cannonMaterial = cannonMaterial; 

    this.init();    
  }

  init() {
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ color: 'red', transparent: true, opacity: 0.5 })
    );
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    this.mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
    this.scene.add(this.mesh);
    
    this.setCannonBody()
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
    quatX.setFromAxisAngle(axisX, this.rotation.x);

    // Y축 
    const quatY = new Quaternion();
    const axisY = new Vec3(0, 1, 0);
    quatY.setFromAxisAngle(axisY, this.rotation.y);

    // Z축
    const quatZ = new Quaternion();
    const axisZ = new Vec3(0, 0, 1);
    quatZ.setFromAxisAngle(axisZ, this.rotation.z);

    // 3개의 회전을 결합
    const combinedQuat = quatX.mult(quatY).mult(quatZ);

    this.cannonBody.quaternion = combinedQuat;

    this.cannonWorld.addBody(this.cannonBody);
  }

  // 물리 엔진과 메시 동기화
  updateFromPhysics() {
    if (this.cannonBody && this.mesh) {
      this.mesh.position.copy(this.cannonBody.position);
      this.mesh.quaternion.copy(this.cannonBody.quaternion);
    }
  }
}
