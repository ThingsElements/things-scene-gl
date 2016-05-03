var model = {
  components: [{
    type: 'text',
    top: 30,
    left: 30,
    textAlign: 'left',
    fontSize: '30',
    fontFamily: 'serif',
    text: '이 예제에서는 QR큐브 레이어를 설명합니다. 마우스를 드래깅 해보세요.'
  }]
};

var p = null;

function create() {
  p = scene.create({
    target: 'scene',
    model: model,
    layers: [{
      type: 'qrcube-layer',
      symbol: 'qrcode',
      text: 'http://www.hatiolab.com/site_prod_crm',
      scale_h: 3,
      scale_w: 3
    }]
  });
}

function dispose() {
  p.dispose();
}

function fullscreen() {
  p.fullscreen()
}
