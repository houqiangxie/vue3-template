export function loadModel(viewer, name, lng, lat, src) {
  const position = Cesium.Cartesian3.fromDegrees(lng, lat, 1);
  //指定姿态
  const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(89), Cesium.Math.toRadians(0), Cesium.Math.toRadians(0));
  const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
  const entityPoint = viewer.entities.add({
    id: name,
    //自己指定的位置
    position,
    //使用自己指定的姿态角
    orientation: orientation,
    model: {
      uri: `/staticRecourse/mapRecourse/model/xiadong/${name}.glb`,
      minimumPixelSize: 1,
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 1.0,
        color: Cesium.Color.YELLOW,
      }),
      width: 1,
    },
    properties: { name, info: '测试模型带参信息' },
    detailTitle: 'model',
    src,
  });
}

export function initModel(scope) {
  const viewer = scope;
  // 加载下洞模型
  loadModel(viewer, 'chanqu', 114.3855, 22.6199955, { name: '厂区模型', height: 100, lng: 114.3855, lat: 22.6199955 });
  loadModel(viewer, 'guanti114', 114.3855, 22.6199955, { name: '罐体114', height: 60, lng: 114.38260227441786, lat: 22.620733024665256 });
  loadModel(viewer, 'guanti115', 114.3855, 22.6199955, { name: '罐体115', height: 60, lng: 114.38261032104492, lat: 22.62028489153483 });
  loadModel(viewer, 'guanti116', 114.3855, 22.6199955, { name: '罐体116', height: 60, lng: 114.38261836767197, lat: 22.619787239219953 });
  // 增加光影
  viewer.scene.globe.enableLighting = true;
  viewer.shadows = true;
  viewer.shadowMap.darkness = 0.85; //阴影透明度--越大越透明
  // 改变时间设置光照效果
  var utc = Cesium.JulianDate.fromDate(new Date('2021/07/04 09:00:00'));
  //北京时间=UTC+8=GMT+8
  viewer.clockViewModel.currentTime = Cesium.JulianDate.addHours(utc, 8, new Cesium.JulianDate());
}
