import { routeConfig } from '@/utils/global';
import router from '@/router';
import { startHandleEvent } from '@/service/instruction';
import { kmUnitFormat } from '@/utils/utils';
import mapSdk from '@/utils/map/mapSdk';

// 事件点位信息
const eventKeys = [
  { key: 'event_name', label: '事件名称' },
  { key: 'event_type', label: '事件类型' },
  { key: 'event_level', label: '事件级别' },
  { key: 'occur_time', label: '发生时间' },
  { key: 'addresss', label: '地点' },
  { key: 'report_type', label: '报送类型' },
  { key: 'report_depart', label: '报送单位' },
  { key: 'event_desc', label: '事件描述' },
];

// 三防事件点位信息
const sanfangEventKeys = [
  { key: 'message', label: '事件描述' },
  { key: 'picture', label: '图片地址' },
];

export default class MapPopup {
  constructor(params) {
    const { popupType, id, height } = params;
    this.eventInfo = params;
    this.lng = params?.lng || params?.longitude;
    this.lat = params?.lat || params?.latitude;
    this.height = height || 0;
    this.id = id || '';
    this.popupType = popupType;
    this.el = null;
    this.eventTopic = null;
    this.initPopup();
  }

  initPopup() {
    const el = document.createElement('div');
    el.setAttribute('class', `map-popup-${this.popupType}`);
    el.id = `mapPopup_${this.popupType}${this.id}`;
    el.style.position = 'absolute';
    el.style.cursor = 'pointer';
    switch (this.popupType) {
      case 'event':
        this.initBaseMapPopup(el);
        break;
      case 'sanfangEvent':
        this.initSanfangMapPopup(el);
        break;
      case 'eventInfluence':
        this.initEventInfluenceCircleLabel(el);
        break;
      default:
        this.initDefaultPopup(el);
        break;
    }
    const map = document.getElementsByClassName('cesium-viewer-cesiumWidgetContainer')[0];
    map.style.position = 'relative';
    map.append(el);
    this.el = el;
    this.render();
    this.eventTopic = window.viewer.scene.postRender.addEventListener(this.render, this);
  }

  // 基础弹窗
  initDefaultPopup(el) {
    el.innerHTML = `
      <div class="map-popup-default">
        <i class="close iconfont icon-guanbi"></i>
        <div class="name">${this.eventInfo.name}</div>
      </div>
    `;
    el.style.transform = `translate(-50%, -70px)`;
    el.querySelector('.close').onmousedown = () => {
      this.removePopup();
    };
  }

  // 基础事件点位弹窗
  initBaseMapPopup(el) {
    const eventInfoHtml = eventKeys.reduce(
      (pre, i) => `${pre}<div class="item"><span class="label">${i.label}</span><span class="value">${this.eventInfo[i.key]}</span></div>`,
      '',
    );
    el.innerHTML = `
    <div class="title">事件详情 <i class="close iconfont icon-guanbi-tianchong"></i></div>
    <div class="wrap">${eventInfoHtml}</div>
    <div class="btn">开始处置</div>
    `;
    el.style.transform = `translate(-50%, -110%)`;
    el.querySelector('.close').onmousedown = () => {
      this.removePopup();
    };

    el.querySelector('.btn').onmousedown = () => {
      mapSdk.addPointSpreadEffect({});
      const to = routeConfig.find((i) => i.name === this.eventInfo.jump);
      if (!to) return;
      sessionStorage.setItem(
        'current_event_info',
        JSON.stringify({
          ...this.eventInfo,
          routerInfo: to,
        }),
      );

      startHandleEvent(this.eventInfo.event_id);

      router.push({
        name: 'BigScreen',
        params: { id: to?.id, pageTitle: to?.name, screenType: 0 },
        query: { eventId: this.eventInfo.event_id },
      });
      this.removePopup();
    };
  }

  // 三防事件点位弹窗
  initSanfangMapPopup(el) {
    el.innerHTML = `
    <i class="close iconfont icon-guanbi-tianchong"></i>
    <div class="left"><img src="${this.eventInfo.picture}"/><i class="iconfont icon-fangda"></i></div>
    <div class="right">
      <div class="desc">${this.eventInfo.message}</div>
      <div class="btn">详情信息</div>
    </div>
    `;
    el.style.transform = `translate(-50%, -130%)`;
    el.querySelector('.btn').onmousedown = () => {
      const to = routeConfig.find((i) => i.name === this.eventInfo.type);
      if (!to) return;
      sessionStorage.setItem(
        'current_event_info',
        JSON.stringify({
          ...this.eventInfo,
          routerInfo: to,
        }),
      );

      router.push({
        name: 'BigScreen',
        params: { id: to?.id, pageTitle: to?.name, screenType: 0 },
        query: { eventId: this.eventInfo.id },
      });
      this.removePopup();
    };
    el.querySelector('.close').onmousedown = () => {
      this.removePopup();
    };
  }

  // 危化事件影响范围圈label
  initEventInfluenceCircleLabel(el) {
    const { radius = 0, population = 0, color = '', units } = this.eventInfo;
    let radiusText = kmUnitFormat(radius);
    if (units === 'kilometers') {
      radiusText = `${radius.toFixed(2)} km`;
    }
    el.innerHTML = `
      <div class="map-popup-event-influence-circle-label" style="background: ${color}">
        <div class="name">
          <i class="iconfont icon-a-qidianzhongdian"></i> 
          <span>${radiusText}</span>
          <em></em>
          <i class="iconfont icon-renkou"></i> 
          <span>${population.toLocaleString('en-US')}人</span>
        </div>
      </div>
    `;
    el.style.transform = `translate(-50%, -40px)`;
  }

  render() {
    if (!this.el) return;
    const cartesian = Cesium.Cartesian3.fromDegrees(this.lng, this.lat, this.height);
    const rectangle = Cesium.SceneTransforms.wgs84ToWindowCoordinates(window.viewer.scene, cartesian);
    this.el.style.left = rectangle.x + 'px';
    this.el.style.top = rectangle.y + 'px';
  }

  onClick() {
    this.removePopup();
  }

  removePopup() {
    this.el?.parentNode.removeChild(this.el);
    this.el = null;
  }
}
