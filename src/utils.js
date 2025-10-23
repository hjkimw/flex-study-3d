import gsap from "gsap";

export function setActive({
  spotMesh,
  spotMeshHalfDistanceXZ = 1.5,
  player,
  targetModel,
  camera,
  animationConfig = {},
}) {
  
  // Default Animation Config
  const config = {
    targetModel: {
      activeY: 0.3,
      hiddenY: -5,
      activeDuration: 1,
      hiddenDuration: 0.5,
    },
    player: {
      activeY: 1,
      normalY: 0.3,
      duration: 1,
    },
    camera: {
      activeY: 3,
      normalY: 5,
      duration: 1,
    },
    colors: {
      active: 'seagreen',
      inactive: 'yellow',
    },
    ...animationConfig,
  };

  // Player가 spotMesh 범위 영역에 진입했는지 확인
  const isInRange =
    Math.abs(spotMesh.position.x - player.modelMesh.position.x) < spotMeshHalfDistanceXZ &&
    Math.abs(spotMesh.position.z - player.modelMesh.position.z) < spotMeshHalfDistanceXZ;

  // Player가 spotMesh 범위 영역에 진입했을 때
  if (isInRange) {
    if (!targetModel.visible) {
      targetModel.visible = true;

      spotMesh.material.color.set(config.colors.active);

      const tl = gsap.timeline();

      // 모델이 위로 올라오고
      tl.to(targetModel.modelMesh.position, {
        duration: config.targetModel.activeDuration,
        y: config.targetModel.activeY,
        ease: 'Bounce.easeOut',
});

      // player 위치 조정하고
      tl.to(
        player.modelMesh.position,
        {
          duration: config.player.duration,
          y: config.player.activeY,
          ease: 'Bounce.easeOut',
        },
        '<'
      );

      // 카메라의 위치 조정
      tl.to(
        camera.position,
        {
          duration: config.camera.duration,
          y: config.camera.activeY,
        },
        '<'
      );
    }
  } else {
    
    // Player가 spotMesh 범위 영역에 벗어났을 때
    if (targetModel.visible) {
      targetModel.visible = false;
      spotMesh.material.color.set(config.colors.inactive);

      const tl = gsap.timeline();

      // 모델이 아래로 들어가고
      tl.to(targetModel.modelMesh.position, {
        duration: config.targetModel.hiddenDuration,
        y: config.targetModel.hiddenY,
      });

      // player 위치 원상복구 하고
      tl.to(
        player.modelMesh.position,
        {
          duration: config.player.duration,
          y: config.player.normalY,
          ease: 'Bounce.easeOut',
        },
        '<'
      );

      // 카메라 위치 원상복구
      tl.to(
        camera.position,
        {
          duration: config.camera.duration,
          y: config.camera.normalY,
        },
        '<'
      );
    }
  }
}
