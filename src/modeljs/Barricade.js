export class Barricade {
  constructor({
    scene,
    position,
    rotation,
    scale,
  }) {
    this.scene = scene;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
  }

  init() {
    const barricade = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 'red' })
    );
    barricade.position.set(this.position.x, this.position.y, this.position.z);
    barricade.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    barricade.scale.set(this.scale.x, this.scale.y, this.scale.z);
    this.scene.add(barricade);
  }
}