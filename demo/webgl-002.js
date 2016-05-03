var model = {
  components: [{
    type: 'text',
    top: 30,
    left: 30,
    textAlign: 'left',
    fontSize: '30',
    fontFamily: 'serif',
    text: '이 예제에서는 WEBGL CUBE를 설명합니다. 마우스를 드래깅 해보세요.'
  }, {

    type: 'line',

    x1: 100,
    y1: 100,
    x2: 200,
    y2: 200,
  }]
};

var p = null;

function create() {
  p = scene.create({
    target: 'scene',
    model: model,
    layers: [{
      type: 'cube-layer',
      texture: 'resources/texture.png'
    }]
  });
}

function dispose() {
  p.dispose();
}

function fullscreen() {
  p.fullscreen()
}
