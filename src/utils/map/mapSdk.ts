import * as turf from '@turf/turf';
import axios from 'axios';
import state from '@/store/state';
import { useMapStore } from '@/store/common';
import { layerConfigurationParameters } from '@/utils/map/layerConfig';
import { mapCode } from '@/utils/map/mapConfig';
import { chunk, slice } from 'lodash';
import { mapClick, getLayerData, checkboxChecked, addCommonLayer, clearMapMarker } from './map';
import { post, get } from '@/utils/fetch/fetch';
import emitter from '@/utils/emitter';
import MapPopup from '@/utils/map/mapPopup';
import windJson from '../../../public/maps/wind.json';
import mapEffectController from '@/utils/map/mapEffectController';

import {
  parabolaFlowInit,
  WallDiffuseMaterialProperty,
  CustomMaterialLine,
  Spriteline1MaterialProperty,
  CircleDiffusion,
  CircleScanMaterialProperty,
  ScanlineMaterialProperty,
  LineFlickerMaterialProperty,
  TrailLineMaterialProperty,
  WallDiffuseMaterialProperty,
} from '@/utils/cesiumExtend/cesiumTool';

const mapStore = useMapStore();
const polyLineArr = [];
const circleCoordinates = [];
declare const window: any;

const hexToRgba = function (hex, opacity) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}, ${opacity})`;
};

class MapSdk {
  constructor() {
    this.mapStore = useMapStore();
    const { entities, scene, imageryLayers } = window.viewer;
    window.mapSdk = this;
    window.viewer = useMapStore().viewer;
    this.circleList = [];
    this.modelLabelList = [];
    this.leakageModelList = [];
    this.diffusionRoundList = [];
    this.eventPopup = null;
    this.evacuationRoad = [];
    this.rescueRoad = [];
    this.alertPoint = [];
  }

  get viewer() {
    return window.viewer;
  }

  get mapEffectController() {
    return mapEffectController;
  }

  /**
   * 添加图层和点位数据
   * @param params 参数
   * @example addLayer({
   *    layerName: 'testLayer', // 图层名字
   *    list: [], // 点位对象数组, 对象中必须包含经纬度字段
   *    icon: './static/icon/defaultMarker.png', // 点位图标url
   *    height: 20, // icon高度
   *    width: 20, // icon宽度
   *    isShow: true // 是否显示图层
   * })
   */
  addLayer(params?: Object) {
    const { layerName, icon, list, height, width, isShow = true, type = 'POINT', options = {} } = params;
    const layerItem = layerConfigurationParameters.get(options?.groupName)?.filter((layer) => layer.name === options?.layerName)[0] ?? {};
    addCommonLayer({
      layer: layerName,
      list,
      icon,
      height,
      width,
      showLayer: isShow,
      mapTypeArr: [type],
      layerItem,
    });
  }

  /**
   * 移除图层
   * @param layerName 需要移除图层的名字
   */
  removeLayer(layerName?: String) {
    const entity = window.viewer.entities.getById(layerName);
    if (entity) {
      entity?._children?.forEach((child) => {
        window.viewer.entities.remove(child);
      });
      window.viewer.entities.removeById(layerName);
    }
    return this;
  }

  /**
   * 批量移除图层
   * @param layerNameList 图层名称列表
   */
  batchRemoveLayer(layerNameList = []) {
    layerNameList.forEach((item) => this.removeLayer(item));
    mapStore.removeMapList = mapStore.removeMapList.filter((item) => !layerNameList.includes(item));
    return this;
  }

  /**
   * 获取图层数据
   * @param {String} options.groupName 图层组名
   * @param {String} options.layerName 图层名
   * @param {String} options.attributeFilter 过滤数组, iServer: [['AREA','LIKE',"'福田区'"],['ID','=','10086']] ; bigDatabase: [['vc_area','=','南山区'],['vc_name','=','阳光小学']]
   * @param {String} options.pageNo 页码
   * @param {String} options.pageSize 每页返回数据最大值
   * @param {String} options.queryData 需要的传参
   * @param {String} options.restParameter 重置接口
   * @returns 所有点位数据
   * @example mapSdk.getLayerData({
   *    groupName: '应急资源',
   *    layerName: '应急机构',
   *    attributeFilter: [['AREA','LIKE',"'福田区'"],['ID','=',"10086"]], // 数据来源为超图服务
   *    attributeFilter: [['vc_area','=','南山区'],['vc_name','=','阳光小学']], // 数据来源为大数据库
   *    pageNo: 1,
   *    pageSize: 10,
   *    queryData: {},
   *    restParameter: false,
   * })
   */
  async getLayerData(options: Object) {
    const { groupName, layerName, attributeFilter = [], pageNo = null, pageSize = null, queryData = {}, restParameter = false } = options;
    const item = layerConfigurationParameters.get(groupName)?.filter((layer) => layer.name === layerName)[0];
    if (!item) return [];
    item.attributeFilter = attributeFilter ?? [];
    item.pageNo = pageNo;
    item.pageSize = pageSize;
    item.data.queryData = restParameter ? queryData : Object.assign(item.data?.queryData ?? {}, queryData);
    return await getLayerData({ item });
  }

  /**
   * 飞到目标点位
   * @param options 包含参数longitude, latitude, duration, height
   */
  flyToPoint(options: Object) {
    const { longitude = 114.17944310326004, latitude = 22.65386345002168, duration = 2, height = 88132, heading = 0, pitch = -89 } = options;
    window.viewer.scene.camera.flyTo({
      // eslint-disable-next-line no-undef
      destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      orientation: {
        // eslint-disable-next-line no-undef
        heading: Cesium.Math.toRadians(heading),
        // eslint-disable-next-line no-undef
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0.0,
      },
      duration,
    });
  }

  /**
   * 飞行到圆形范围内
   * @param center 中心点
   * @param radius 圆形半径
   * @param units 单位
   */
  flyToCircle(center, radius, units) {
    const circle = turf.circle(center, radius, {
      units: units || 'kilometers',
    });
    const points = turf.envelope(circle).geometry.coordinates[0];
    window.viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(points[0][0], points[0][1], points[2][0], points[2][1]),
    });
  }

  /**
   * 控制图层显隐状态
   * @param groupName 图层组名
   * @param layerName 图层名字
   * @param isShow 显隐状态
   */
  controlLayerShow(groupName: String, layerName: String, isShow: Boolean) {
    const layer = window.viewer.entities.getById(layerName);
    if (isShow && !layer) {
      this.addDataToLayer(groupName, layerName);
    } else if (layer) layer.show = isShow;
  }

  /**
   * 根据图层名称控制图层显隐
   */
  changeLayerVisibleByLayerName(layerName, isShow) {
    if (!layerName) return;
    const layer = window.viewer.entities.getById(layerName);
    if (layer) layer.show = isShow;
  }

  /**
   * 获取或添加数据到对应图层
   * @param groupName 组名
   * @param layerName 图层名
   */
  addDataToLayer(groupName: String, layerName: String) {
    const checkedLayer = layerConfigurationParameters.get(groupName)?.filter((layer) => layer.name === layerName);
    checkboxChecked({ allLayer: checkedLayer, checkedLayer });
  }

  /**
   * 订阅地图事件
   * @param eventType 地图事件类型: 'click', 'mouseMove'
   * @param callback 事件回调, 回调结果中 res.id.src 为获取的点位信息
   */
  subscribeMapEvents(eventType: String, callback: Function) {
    console.log('MapSdk ~ subscribeMapEvents ~ eventType', eventType);
    const eventsMap = new Map([
      ['click', 'LEFT_CLICK'],
      ['mouseMove', 'MOUSE_MOVE'],
    ]);
    mapClick({ clickType: eventsMap.get(eventType), callback });
  }

  // 无人机初始化
  droneInit() {
    // 开启连接
    emitter.emit('connectDrone');
    // 接受返回无人机信息
    emitter.on('updateDroneInformation', (data) => {
      const { longitude, latitude, altitude, altitudeRelative, pitch, roll } = data;
      // 初始化无人机点位
      if (!window.viewer.entities.getById('drone')) {
        this.doScene('/staticRecourse/mapRecourse/model/drone.glb', false, longitude, latitude, altitude, altitudeRelative, pitch / 10, roll / 10);
      }
      const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude); //(经度，纬度，高程)
      polyLineArr.push(longitude, latitude, altitude);
      const hpr = new Cesium.HeadingPitchRoll(altitudeRelative, pitch / 10, roll / 10);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
      //更新位置
      window.viewer.entities.getById('drone').position = position;
      //更新姿态
      window.viewer.entities.getById('drone').orientation = orientation;
    });
  }

  // 无人机关闭
  destroyDrone() {
    // 关闭链接
    emitter.emit('stopConnectDrone');
    // 关闭mspSdk的监听事件
    emitter.off('updateDroneInformation');
    window.viewer.entities.removeById('drone');
    window.viewer.entities.removeById('droneLine');
  }

  // 无人机构造方法
  doScene(
    modelURL: string,
    isShowInfo: boolean = false,
    longitude: number,
    latitude: number,
    height: number,
    heading: number,
    pitch: number,
    roll: number,
  ) {
    //指定位置
    const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
    polyLineArr.push(longitude, latitude, height);

    //指定姿态
    const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(heading), Cesium.Math.toRadians(pitch), Cesium.Math.toRadians(roll));
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    const entityPoint = useMapStore().viewer.entities.add({
      id: 'drone',
      //自己指定的位置
      position: position,

      //使用自己指定的姿态角
      orientation: orientation,

      model: {
        uri: modelURL, //飞机模型
        minimumPixelSize: 64,
        scale: 0.01,
        disableDepthTestDistance: Number.MAX_VALUE,
      },

      //Show the path as a pink line sampled in 1 second increments.
      path: {
        resolution: 1,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 1.0,
          color: Cesium.Color.YELLOW,
        }),
        width: 1,
      },
    });
    const entityLine = window.viewer.entities.add({
      id: 'droneLine',
      polyline: {
        positions: new Cesium.CallbackProperty(() => Cesium.Cartesian3.fromDegreesArrayHeights(polyLineArr), false),
        material: new Cesium.PolylineOutlineMaterialProperty({
          color: Cesium.Color.ORANGE,
          outlineWidth: 2,
          outlineColor: Cesium.Color.BLACK,
        }),
        width: 5,
        disableDepthTestDistance: Number.MAX_VALUE,
      },
    });
  }

  /**
   * 添加事件影响范围圈
   * @param params 事件影响范围参数
   * @param color 事件影响范围圈颜色
   * @param isShowRadiusLabel 是否显示半径文字label
   * @example addEventInfluenceCircle({
   *    eventCenter: [114.08512115478516, 22.578510494507483], // 事件影响范围中心
   *    radius: 5, // 影响半径
   *    units: 'kilometers', // 影响半径的单位
   * },'#eb4242', true)
   */
  async addEventInfluenceCircle(params: Object, color: String, isShowRadiusLabel: boolean = true) {
    const computeCircleCoordinates = function (params) {
      const { eventCenter, radius, units } = params;
      const coordinates = [];
      const circle = turf.circle(eventCenter, radius, {
        steps: 64,
        units,
      });
      circle.geometry.coordinates[0].forEach((point) => {
        coordinates.push(point[0], point[1]);
      });
      return {
        circularCoordinates: coordinates,
        labelCoordinates: circle.geometry.coordinates[0][0],
      };
    };
    const { circularCoordinates, labelCoordinates } = computeCircleCoordinates(params);
    let maximumHeights = 0;
    const line = window.viewer.entities.add({
      id: `EventInfluence${params.radius}`,
      polyline: {
        positions: new Cesium.CallbackProperty(() => Cesium.Cartesian3.fromDegreesArray(circularCoordinates), false),
        // positions: Cesium.Cartesian3.fromDegreesArray(circleCoordinates),
        material: Cesium.Color.fromCssColorString(color),
        width: 2,
        clampToGround: true,
      },
      wall: {
        //坐标点，不指定高度
        positions: new Cesium.CallbackProperty(() => Cesium.Cartesian3.fromDegreesArray(circularCoordinates), false),
        minimumHeights: new Array(circularCoordinates.length / 2).fill(0),
        maximumHeights: new Cesium.CallbackProperty(() => {
          let cameraHeight = Math.ceil(window.viewer.camera.positionCartographic.height);
          const basicHeight = cameraHeight / 500;
          maximumHeights += basicHeight;
          if (maximumHeights > basicHeight * 20) maximumHeights = basicHeight;
          return new Array(circularCoordinates.length / 2).fill(maximumHeights);
        }, false),
        material: new Cesium.WallDiffuseMaterialProperty({
          color: Cesium.Color.fromCssColorString(color),
        }),
      },
      // polygon: {
      //   hierarchy: Cesium.Cartesian3.fromDegreesArray(circularCoordinates),
      //   material: Cesium.Color.fromCssColorString(hexToRgba(color, 0.16)),
      //   clampToGround: true,
      //   show: new Cesium.CallbackProperty(() => {
      //     let height = Math.ceil(window.viewer.camera.positionCartographic.height);
      //     return height > 2000;
      //   }, false),
      // },
    });
    this.circleList.push(line.id);
    if (!isShowRadiusLabel) return;
    let population = 0;
    try {
      const { data } = await axios({
        method: 'GET',
        url: '/api/biz/emg/gis/surrounding/getActivePeople',
        params: {
          lng: params.eventCenter[0],
          lat: params.eventCenter[1],
          radius: params.units === 'kilometers' ? params.radius : params.radius / 1000,
        },
        headers: {
          'Content-Type': 'application/json;charset=utf-8',
          authorization: `Bearer ${JSON.parse(localStorage.getItem('pro_token')).value.token}`,
        },
      });
      population += data.data;
    } catch (error) {
      console.warn(`MapSdk -> addEventInfluenceCircle -> 获取活动人口出错`, error);
    }
    let text = `${params.radius.toFixed(2)} ${params.units === 'kilometers' ? 'km' : 'm'}`;
    text += ` 活动人口：${population}人`;
    // 添加label
    const labelPopup = this.addEventPopup({
      lng: labelCoordinates[0],
      lat: labelCoordinates[1],
      popupType: 'eventInfluence', // 弹窗类型
      text, // 弹窗名字等等
      radius: params.radius,
      unique: params.unique ?? false,
      units: params.units,
      color,
      population,
    });
    this.modelLabelList.push(labelPopup);
    // const label = window.viewer.entities.add({
    //   id: `EventInfluenceLabel${params.radius}`,
    //   position: Cesium.Cartesian3.fromDegrees(labelCoordinates[0], labelCoordinates[1]),
    //   label: {
    //     text,
    //     font: '20pt monospace',
    //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //     outlineWidth: 1,
    //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    //     fillColor: Cesium.Color.fromCssColorString('#fff'),
    //     outlineColor: Cesium.Color.fromCssColorString('#fff'),
    //     pixelOffset: new Cesium.Cartesian2(0, -10),
    //     disableDepthTestDistance: 100000,
    //     showBackground: true,
    //     backgroundColor: Cesium.Color.fromCssColorString(color),
    //   },
    // });
    // this.circleList.push(label.id);
  }

  /**
   * 计算自定义泄漏模型
   * @param options 事件中心点等泄漏模型数据 eventCenter, diffusionDirection, units, AE, AB, CD
   * @returns 经纬度数据及feature
   */
  computeLeakageModel(options) {
    const { eventCenter, diffusionDirection, units, AE, AB, CD } = options;
    const diffusionDirectionMap = ['N', 'NNE', 'NE', 'NEE', 'E', 'SEE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'SWW', 'W', 'NWW', 'NW', 'NNW']; // 十六个风向角度为22.5
    // 获得关键点坐标
    const pointB = turf.rhumbDestination(turf.point(eventCenter), AB, 180, {
      units,
    });
    const pointE = turf.rhumbDestination(turf.point(eventCenter), AE, 180, {
      units,
    });
    const pointD = turf.rhumbDestination(pointB, CD / 2, 90, { units });
    // 计算椭圆的主次半轴长度
    const majorRadius = pointD.geometry.coordinates[0] - pointB.geometry.coordinates[0];
    const minorRadius = pointB.geometry.coordinates[1] - pointE.geometry.coordinates[1];
    const center = pointB.geometry.coordinates;
    // 构造椭圆
    let x;
    let y;
    let angle;
    const points = [];
    for (let i = 0; i <= 102; i += 1) {
      angle = (Math.PI * 2 * i) / 102;
      x = center[0] + majorRadius * Math.cos(angle);
      y = center[1] + minorRadius * Math.sin(angle);
      points.push([x, y]);
    }
    // 构造完整扩散区域
    points.splice(5, 42, eventCenter);
    const polygon = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [points],
      },
    };
    // 旋转模型
    const rotatedPoly = turf.transformRotate(polygon, diffusionDirectionMap.indexOf(diffusionDirection) * 22.5, {
      pivot: eventCenter,
    });
    const coordinates = [];
    rotatedPoly.geometry.coordinates[0].forEach((point) => {
      coordinates.push(point[0], point[1]);
    });
    return { coordinates, rotatedPoly };
  }

  /**
   * 添加泄漏模型
   * @param params 泄漏模型参数
   * @param color 颜色
   * @example addLeakageModel({
   *    name: 'xxx泄漏圈1', // 泄漏模型名字
   *    eventCenter: [114.08512115478516, 22.578510494507483], // 事件影响点
   *    diffusionDirection: 'N', // 风向
   *    units: 'kilometers', // 单位
   *    AE: 40, // 泄漏模型对应线段
   *    AB: 25, // 泄漏模型对应线段
   *    CD: 20, // 泄漏模型对应线段
   *    type: 'params' || 'points', // 参数模式或坐标模式
   *    points: [......], // 坐标模式时传入经纬度数组
   * }, "#eb4242")
   */
  addLeakageModel(params, color) {
    if (this.leakageModelList.indexOf(`LeakageModel-${params.name}`) >= 0) return;
    const originalPoints = params.type === 'points' ? params.points : this.computeLeakageModel(params).coordinates;
    const positions = [];
    if (params.type === 'points') {
      for (let index = 0; index < originalPoints.length; index += 4) {
        positions.push(originalPoints[index], originalPoints[index + 1]);
      }
    } else {
      positions.push(...this.computeLeakageModel(params).coordinates);
    }
    let maximumHeights = 0;
    const line = window.viewer.entities.add({
      id: `LeakageModel-${params.name}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        material: Cesium.Color.fromCssColorString(color),
        width: 5,
        clampToGround: true,
      },
      wall: {
        //坐标点，不指定高度
        positions: Cesium.Cartesian3.fromDegreesArray(positions),
        minimumHeights: new Array(positions.length / 2).fill(0),
        maximumHeights: new Cesium.CallbackProperty(() => {
          let cameraHeight = Math.ceil(window.viewer.camera.positionCartographic.height);
          const basicHeight = cameraHeight / 500;
          maximumHeights += basicHeight;
          if (maximumHeights > basicHeight * 20) maximumHeights = basicHeight;
          return new Array(positions.length / 2).fill(maximumHeights);
        }, false),
        material: new Cesium.WallDiffuseMaterialProperty({
          color: Cesium.Color.fromCssColorString(color),
        }),
      },
    });
    this.leakageModelList.push(line.id);
    if (this.leakageModelList.indexOf(`LeakageModelLabel${params.maxdistance}`) < 0) {
      const list = chunk(positions, 2);
      const labelPopup = this.addEventPopup({
        lng: list[parseInt(list.length / 2)][0],
        lat: list[parseInt(list.length / 2)][1],
        popupType: 'eventInfluence', // 弹窗类型
        text: `${params.maxdistance?.toFixed(2)} ${params.maxdistance?.toFixed(2) > 1000 ? 'km' : 'm'}`, // 弹窗名字等等
        unique: false,
        color,
      });
      this.modelLabelList.push(labelPopup);
      // const label = window.viewer.entities.add({
      //   id: `LeakageModelLabel${params.maxdistance}`,
      //   position: Cesium.Cartesian3.fromDegrees(list[parseInt(list.length / 2)][0], list[parseInt(list.length / 2)][1]),
      //   label: {
      //     text: `${params.maxdistance.toFixed(2)} ${params.maxdistance.toFixed(2) > 1000 ? 'km' : 'm'}`,
      //     font: '20pt monospace',
      //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      //     outlineWidth: 1,
      //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      //     fillColor: Cesium.Color.fromCssColorString('#fff'),
      //     outlineColor: Cesium.Color.fromCssColorString('#fff'),
      //     pixelOffset: new Cesium.Cartesian2(0, (params.index - 1) * 25),
      //     disableDepthTestDistance: 100000,
      //     showBackground: true,
      //     backgroundColor: Cesium.Color.fromCssColorString(color),
      //   },
      // });
      // this.leakageModelList.push(label.id);
    }
  }

  /**
   * // 移除事件范围圈
   * @returns mapSdk
   */
  removeEventInfluenceCircle() {
    this.circleList.forEach((id) => {
      window.viewer.entities.removeById(id);
    });
    this.circleList = [];
    this._removeLabel();
    return this;
  }

  /**
   * 移除泄漏模型
   * @returns mapSdk
   */
  removeLeakageModel() {
    this.leakageModelList.forEach((id) => {
      window.viewer.entities.removeById(id);
    });
    this.leakageModelList = [];
    this._removeLabel();
    return this;
  }

  _removeLabel() {
    this.modelLabelList.forEach((label) => {
      label.removePopup();
    });
    this.modelLabelList = [];
  }

  /**
   * 添加点位弹窗
   * @param params 弹窗详情信息
   * @example addEventPopup({
   *    lng: 114.08512115478516,    // 弹窗经度
   *    lat: 22.578510494507483,    // 弹窗纬度
   *    popupType: "event",         // 弹窗类型
   *    eventName: "测试事件点位",   // 弹窗名字等等
   *    unique: true,   // 是否唯一
   *    ......
   * })
   */
  addEventPopup(params = {}) {
    const unique = params.unique ?? true;
    if (this.eventPopup && unique) this.eventPopup.removePopup();
    const popup = new MapPopup(params);
    if (unique) this.eventPopup = popup;
    return popup;
  }

  /**
   * 过滤点位数据
   * @param params 包含点位数据, 过滤类型, 多边形数据
   * @returns 多边形内的点位数组
   * @example filterPointData({
   *    groupName: '',
   *    layerName: '',
   *    polygonType: "泄漏",
   *    polygonInfo: [
   *       -46.653, -23.543, -46.634, -23.5346, -46.613, -23.543, -46.614, -23.559,
   *       -46.631, -23.567, -46.653, -23.56, -46.653, -23.543,
   *    ],
   * })
   * @example filterPointData({
   *    groupName: '',
   *    layerName: '',
   *    polygonType: "爆炸",
   *    polygonInfo: {
   *        r: 500,
   *        center: ["-46.643", "-23.557"],
   *    },
   * })
   */
  async filterPointData(params) {
    const { points, polygonType, polygonInfo } = params;
    let polygonFeature = null;
    if (polygonType === '爆炸') {
      polygonFeature = turf.circle([parseFloat(polygonInfo.center[0]), parseFloat(polygonInfo.center[1])], polygonInfo.r, {
        steps: 64,
        units: 'meters',
      });
    } else if (polygonType === '泄漏') {
      const coordinates = [];
      for (let i = 0; i < polygonInfo.length / 2; i++) {
        coordinates.push([polygonInfo[i * 2], polygonInfo[i * 2 + 1]]);
      }
      polygonFeature = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates],
        },
      };
    } else if (polygonType === '专家定义泄漏') {
      polygonFeature = this.computeLeakageModel(polygonInfo).rotatedPoly;
    } else return;
    //处理点位
    const { resData } = await this.getLayerData(params);
    const pointsFeature = {
      type: 'FeatureCollection',
      features: [],
    };
    resData.forEach((point) => {
      const lng = point.longitude || point.lng || point.geometry?.coordinates[0];
      const lat = point.latitude || point.lat || point.geometry?.coordinates[1];
      pointsFeature.features.push({
        type: 'Feature',
        properties: point,
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });
    });
    const filterFeature = turf.pointsWithinPolygon(pointsFeature, polygonFeature);
    return filterFeature.features.map((point) => point.properties);
  }

  /**
   * 泄漏模型生成
   * @param params
   */
  createLeakageModel(params) {
    this.removeLeakageModel();
    const colors = ['#ffd200', '#ff6c00', '#FF0000'];
    params.points.forEach((item, index) => {
      this.addLeakageModel(
        {
          name: 'leakModel' + index,
          points: item,
          type: 'points',
          maxdistance: params.maxdistance[index],
          index: index,
        },
        colors[index],
      );
    });
  }

  /**
   * 获取对应图层图标
   * @param params 组名和图层名
   * @returns iconUrl
   * @example getLayerIcon({
   *    groupName,
   *    layerName,
   * })
   */
  getLayerIcon(params) {
    const { groupName, layerName } = params;
    const item = layerConfigurationParameters.get(groupName)?.filter((layer) => layer.name === layerName)[0];
    return item?.icon;
  }

  /**
   * （新版）添加点位扩散效果
   * @param lng 经度
   * @param lat 纬度
   */
  addPointSpreadEffect(params) {
    const { lng, lat, point, isUnique = true } = params;
    const { lastPointSpreadEffect } = mapEffectController;
    const isSameLayer = lastPointSpreadEffect?.mapEffect?.icon?.src?.layerName === point?.layerName;
    const isSamePoint = lastPointSpreadEffect?.mapEffect?.icon?.lng === lng && lastPointSpreadEffect?.mapEffect?.icon?.lat === lat;
    if (lastPointSpreadEffect && isUnique && (!params || !isSameLayer || !isSamePoint))
      mapEffectController.removeMapEffect(lastPointSpreadEffect?.id);
    if (!lng || !lat) return;
    return mapEffectController.addPointSpreadEffect(params);
  }

  /**
   * 添加疏散路线
   * @param name 疏散路线的名字
   * @param list 疏散路线点位数据
   */
  addEvacuationRoute(name, list) {
    const lineWidth = 20;
    const planAList = [];
    list.forEach((point) => {
      planAList.push(...point);
    });
    const lineA = window.viewer.entities.add({
      id: `EvacuationRouteLine-${name}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(planAList),
        width: lineWidth,
        clampToGround: true,
        material: new Cesium.PolylineDashMaterialProperty({
          dashLength: 30,
          color: Cesium.Color.fromCssColorString('#16f6fd'),
        }),
      },
    });
    const bearing = turf.rhumbBearing(turf.point(list[list.length - 2]), turf.point(list[list.length - 1]));
    var destination = turf.rhumbDestination(turf.point(list[list.length - 1]), 10, bearing, { units: 'meters' });
    const arrowLine = window.viewer.entities.add({
      id: `EvacuationRouteArrowLine-${name}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([...list[list.length - 1], ...destination.geometry.coordinates]),
        width: lineWidth * 3,
        clampToGround: true,
        material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.fromCssColorString('#16f6fd')),
      },
    });
  }

  /**
   * 飞到点位并高亮提示
   * @param point 包含经纬度的对象
   * @returns
   */
  flyAndHighlightPoint(point) {
    if (mapCode.has(state.searchPopupName)) {
      const keyCode = mapCode.get(state.searchPopupName);
      const latLngValue = state.storeLatitudeLongitude[state.searchPopupName];
      const getResult = latLngValue?.features.find((item) => item?.fieldValues.at(-1) === point[`${keyCode}`].trim());
      point[`lat`] = getResult?.lat || null;
      point[`lng`] = getResult?.lng || null;
    }
    point.layerGroupName = state.layerGroupName;
    point.searchPopupName = state.searchPopupName;
    const longitude = point.lng || point.longitude || null;
    const latitude = point.lat || point.latitude || null;
    if (!longitude || !latitude) return;
    this.flyToPoint({
      longitude,
      latitude,
      pitch: -89,
      height: point.viewerHeight ?? 70000,
    });
    this.addPointSpreadEffect({ lng: longitude, lat: latitude, radius: point.spreadRadius ?? 5000, point });
  }

  /**
   * 校验数据有效性
   * @param arr
   * @param size
   * @returns
   */
  dataSorting(arr, size = 2) {
    const newArr = chunk(arr, size);
    if (newArr[newArr.length - 1].length !== size) newArr.pop();
    return newArr.flat();
  }

  /**
   * 将json转换为热力图
   * @param json 热力图json数据
   * @param coordinates 在地图上显示的矩形经纬度
   * @param options 其他配置
   */
  jsonToHeatmap(json, coordinates, options) {
    const aaa = {
      '.125': '#1dd232',
      '.250': '#7ccd00',
      '.375': '#cde808',
      '.500': '#fcfd00',
      '.625': '#face00',
      '.750': '#fc9b00',
      '.875': '#fb6300',
      '.999': '#ff0200',
    };
    // 初始化参数
    const [lonMin, latMin, lonMax, latMax] = coordinates;
    let maxValue = 36; // 热力图最大值
    let timeIndex = 0; // 数据下标
    const windMap = ['w01h', 'w03h', 'w06h', 'w12h', 'w24h'];
    const defaultRectangle = Cesium.Rectangle.fromDegrees(lonMin, latMin, lonMax, latMax);

    // 处理数据
    const hetMapPoints = json.map((item) => {
      const point = {
        x: Math.floor(((item.x - lonMin) / (lonMax - lonMin)) * 1000),
        y: Math.floor(((item.y - latMin) / (latMax - latMin)) * 1000),
        value: Math.floor(item[windMap[timeIndex]]),
      };
      return point;
    });

    // 设定计时器
    const timeInterval = setInterval(() => {
      console.log('HJJ 计时器', timeIndex);
      const newPoinst = hetMapPoints.map((point) => {
        point.value = point[windMap[timeIndex]];
        return point;
      });
      window.viewer._cesiumWidget._creditContainer.style.display = '';
      const dom = document.getElementById('heatmap');
      dom.innerHTML = '';
      const heatmapInstance = h337.create({
        container: document.getElementById('heatmap'),
      });
      heatmapInstance.setData({
        maxValue,
        data: newPoinst,
      });
      timeIndex = timeIndex >= windMap.length - 1 ? 0 : timeIndex + 1;
      window.viewer._cesiumWidget._creditContainer.style.display = 'none';
      const entity = window.viewer.entities.getById('heatmap');
      if (entity) return;
      window.viewer.entities.add({
        id: 'heatmap',
        rectangle: {
          coordinates: defaultRectangle,
          material: new Cesium.ImageMaterialProperty({
            image: new Cesium.CallbackProperty((time) => {
              const canvas = document.getElementsByClassName('heatmap-canvas')[0];
              return canvas;
            }, false),
            color: Cesium.Color.WHITE.withAlpha(1),
            transparent: true,
          }),
        },
      });
    }, 2000);
  }

  windTest() {
    let max = 72;
    const valueMap = ['w01h', 'w03h', 'w06h', 'w12h', 'w24h'];
    const hetMapPoints = [];
    const latMin = 22.3619;
    const latMax = 22.9489;
    const lonMin = 113.735;
    const lonMax = 114.935;
    const points = windJson.map((point) => {
      point.value = point.w01h;
      return point;
    });
    for (let i = 0; i < points.length; i++) {
      const dataItem = points[i];
      const point = {
        x: Math.floor(((dataItem.x - lonMin) / (lonMax - lonMin)) * 1000),
        y: Math.floor(((dataItem.y - latMin) / (latMax - latMin)) * 1000),
        value: Math.floor(dataItem.value),
      };
      hetMapPoints.push(point);
    }
    let index = 0;
    window.timeInterval = setInterval(() => {
      console.log('HJJ 计时器', index);

      const newPoinst = hetMapPoints.map((point) => {
        // point.value = point[valueMap[index]];
        // point.value = Math.floor(Math.random() * 16);
        point.value = 36;
        return point;
      });
      window.viewer._cesiumWidget._creditContainer.style.display = '';
      const dom = document.getElementById('heatmap');
      dom.innerHTML = '';
      const heatmapInstance = h337.create({
        container: document.getElementById('heatmap'),
        gradient: {
          // enter n keys between 0 and 1 here
          // for gradient color customization
          '.250': '#1dd232',
          '.625': '#fcfd00',
          '1': '#ff0200',
        },
        blur: 0.5,
        radius: 30,
        // minOpacity: 0,
        maxOpacity: 0.1,
      });
      heatmapInstance.setData({
        max,
        data: newPoinst,
      });
      index = index >= valueMap.length - 1 ? 0 : index + 1;
      window.viewer._cesiumWidget._creditContainer.style.display = 'none';
      const entity = window.viewer.entities.getById('heatmap');
      // const canvas = document.getElementsByClassName("heatmap-canvas")[0];
      // if (entity) window.viewer.entities.removeById("heatmap");
      if (entity) return;
      window.viewer.entities.add({
        id: 'heatmap',
        rectangle: {
          coordinates: Cesium.Rectangle.fromDegrees(113.735, 22.3619, 114.935, 22.9489),
          material: new Cesium.ImageMaterialProperty({
            image: new Cesium.CallbackProperty((time) => {
              const canvas = document.getElementsByClassName('heatmap-canvas')[0];
              return canvas;
            }, false),
            color: Cesium.Color.WHITE.withAlpha(1),
            transparent: true,
          }),
        },
      });
    }, 2000);
    window.viewer.zoomTo(window.viewer.entities);
  }

  test() {
    const lng = 114.3366932675507;
    const lat = 22.69829085850473;
    const color = 'red';
    window.viewer.entities.add({
      id: 'testellipse1',
      name: 'Blue wall with sawtooth heights and outline',
      position: Cesium.Cartesian3.fromDegrees(lng, lat, 0),
      ellipse: {
        semiMinorAxis: 50,
        semiMajorAxis: 50,
        material: new Cesium.CircleDiffusionMaterialProperty({
          duration: 3000,
          gradient: 0,
          color: new Cesium.Color.fromCssColorString(color),
          count: 3,
        }),
      },
    });
    this.flyToPoint({
      longitude: lng,
      latitude: lat,
      height: 5000,
    });
  }
  /*************** 疏散、救援及警戒点 ***************/

  addBaoanAirportOilDepotEvacuationRoad(isShow) {
    if (isShow && this.evacuationRoad.length === 0) {
      const evacuationRoadA = [
        [113.82600367069243, 22.623236106061665],
        [113.8279241323471, 22.62413730324135],
        [113.82820844650269, 22.624087787066152],
        [113.82826745510101, 22.624015988580467],
        [113.82828623056412, 22.623921907749363],
        [113.82820844650269, 22.62338217963205],
        [113.82827550172806, 22.62279293275439],
        [113.82904529571532, 22.620069490007666],
        [113.82923573255539, 22.619547078005795],
        [113.82978290319443, 22.618645850740343],
        [113.83022278547287, 22.618088770493355],
        [113.83047491312026, 22.61777432864647],
        [113.83083432912827, 22.61753911577127],
        [113.83134126663207, 22.617578730599472],
        [113.83254021406174, 22.618133336996156],
        [113.83317589759825, 22.618502248048113],
      ];
      const evacuationRoadB = [
        [113.83180528879164, 22.62546680587695],
        [113.83152633905411, 22.62624172420079],
        [113.83153170347214, 22.62636056112931],
        [113.83160412311553, 22.626417503787824],
        [113.83243829011917, 22.626694789440005],
        [113.83317053318024, 22.626717071298494],
      ];
      const evacuationRoadC = [
        [113.82978022098541, 22.624649794606963],
        [113.82978558540344, 22.625132574580658],
        [113.8299411535263, 22.62559802238597],
        [113.82995992898941, 22.625776278574918],
        [113.82989823818207, 22.6258530276962],
        [113.82967829704285, 22.6258530276962],
        [113.82925182580948, 22.62575152078472],
        [113.82906407117842, 22.62584807614128],
        [113.82901310920715, 22.62607832325633],
        [113.8290399312973, 22.6263333276756],
        [113.82898896932602, 22.626934938168944],
        [113.82881462574005, 22.62746474934483],
        [113.82807970046996, 22.62880907414526],
        [113.82809042930603, 22.629014559098103],
        [113.82828086614607, 22.629177956552198],
        [113.82901042699814, 22.62949732374249],
      ];
      const evacuationRoadD = [
        [113.82696658372879, 22.62537272603869],
        [113.82765054702759, 22.62568962628971],
        [113.82873684167862, 22.625627731766848],
        [113.82898092269897, 22.62585055191876],
        [113.82901310920715, 22.62607832325633],
        [113.8290399312973, 22.6263333276756],
        [113.82898896932602, 22.626934938168944],
        [113.82881462574005, 22.62746474934483],
        [113.82807970046996, 22.62880907414526],
        [113.82809042930603, 22.629014559098103],
        [113.82828086614607, 22.629177956552198],
        [113.82901042699814, 22.62949732374249],
      ];
      const evacuationRoadE = [
        [113.82560402154922, 22.627870771480666],
        [113.82763445377348, 22.62885611289652],
        [113.82779806852339, 22.62908635497306],
        [113.8277605175972, 22.629388392381127],
        [113.82679224014282, 22.63103473215744],
      ];
      this.evacuationRoad.push(mapEffectController.addLineRouteFlowEffect({ line: evacuationRoadA, type: '疏散-白' }));
      this.evacuationRoad.push(mapEffectController.addLineRouteFlowEffect({ line: evacuationRoadB, type: '疏散-白' }));
      this.evacuationRoad.push(mapEffectController.addLineRouteFlowEffect({ line: evacuationRoadC, type: '疏散-白' }));
      this.evacuationRoad.push(mapEffectController.addLineRouteFlowEffect({ line: evacuationRoadD, type: '疏散-白' }));
      this.evacuationRoad.push(mapEffectController.addLineRouteFlowEffect({ line: evacuationRoadE, type: '疏散-白' }));
    }
    if (!isShow) {
      this.evacuationRoad?.forEach((e) => {
        mapEffectController.removeMapEffect(e.id);
      });
      this.evacuationRoad = [];
    }
  }

  addBaoanAirportOilDepotRescueRoad(isShow) {
    if (isShow && this.rescueRoad.length === 0) {
      const rescueRoadA = [
        [113.82411003112792, 22.6142683771553],
        [113.83022546768188, 22.61716029840027],
        [113.8305366039276, 22.617581206525866],
        [113.83038640022278, 22.618076390906676],
        [113.82939398288727, 22.61945299411683],
        [113.82905602455139, 22.620121483510633],
        [113.82825136184692, 22.623290574190804],
        [113.82875561714172, 22.62529102507427],
        [113.8289487361908, 22.62560792551364],
        [113.82930546998978, 22.625711908311132],
        [113.82981240749358, 22.625803512138994],
        [113.82994920015335, 22.625702005190938],
        [113.82984995841979, 22.625335589242695],
        [113.83009135723113, 22.62487261634395],
      ];
      const rescueRoadB = [
        [113.83825063705443, 22.620502768598335],
        [113.83562743663788, 22.619824377514586],
        [113.83458673954009, 22.619522319093893],
        [113.8321727514267, 22.618477488948084],
        [113.83090674877167, 22.61793773945978],
        [113.83038975298405, 22.61807700988604],
      ];
      const rescueRoadC = [
        [113.83633017539978, 22.61630857448778],
        [113.83501052856445, 22.619150934880352],
        [113.83458673954009, 22.619515510392333],
      ];
      const rescueRoadD = [
        [113.82477521896361, 22.634510548655363],
        [113.82871270179749, 22.627380573873882],
        [113.82887363433838, 22.626410076485886],
        [113.82881462574005, 22.62586540658271],
        [113.82894739508629, 22.62560792551364],
      ];
      const rescueRoadE = [
        [113.82842302322388, 22.6342827912916],
        [113.82924914360046, 22.63324302461812],
        [113.83085042238235, 22.63078716352607],
        [113.83077263832092, 22.630366295829283],
        [113.82822185754776, 22.6291705293994],
        [113.82797107100487, 22.628723661634716],
      ];
      const rescueRoadF = [
        [113.83341193199158, 22.6311733703962],
        [113.83139491081238, 22.630608913835346],
        [113.83120179176329, 22.630237559570507],
        [113.83182406425475, 22.628945238907395],
        [113.8323524594307, 22.626875519965783],
        [113.83216738700865, 22.626588331621832],
        [113.83012890815735, 22.625937204102538],
        [113.82994651794434, 22.625704480971063],
      ];
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadA, type: '救援' }));
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadB, type: '救援' }));
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadC, type: '救援' }));
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadD, type: '救援' }));
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadE, type: '救援' }));
      this.rescueRoad.push(mapEffectController.addLineRouteFlowEffect({ line: rescueRoadF, type: '救援' }));
    }
    if (!isShow) {
      this.rescueRoad?.forEach((e) => {
        mapEffectController.removeMapEffect(e.id);
      });
      this.rescueRoad = [];
    }
  }

  addBaoanAirportOilDepotAlertPoint(isShow) {
    if (isShow && this.alertPoint.length === 0) {
      const alertPointA = [113.83061170578003, 22.617536639844126];
      const alertPointB = [113.83477449417114, 22.619438138760053];
      const alertPointC = [113.83262872695923, 22.626746780437525];
      const alertPointD = [113.82786512374878, 22.62904426774057];
      const addPoint = (lng, lat) => {
        return mapEffectController.addPointSpreadEffect({
          lng,
          lat,
          radius: 50,
          isShowPoint: false,
          isShowConvergenceCircleEffect: false,
          isShowSpreadEffect: true,
          duration: 0,
          isUnique: false,
        });
      };
      this.alertPoint.push(addPoint(alertPointA[0], alertPointA[1]));
      this.alertPoint.push(addPoint(alertPointB[0], alertPointB[1]));
      this.alertPoint.push(addPoint(alertPointC[0], alertPointC[1]));
      this.alertPoint.push(addPoint(alertPointD[0], alertPointD[1]));
    }
    if (!isShow) {
      this.alertPoint?.forEach((e) => {
        mapEffectController.removeMapEffect(e.id);
      });
      this.alertPoint = [];
    }
  }

  /*************** 疏散、救援及警戒点 END ***************/
}

export default new MapSdk();
