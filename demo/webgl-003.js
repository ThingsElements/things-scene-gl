var model = {
  components: [{
    type: 'text',
    top: 30,
    left: 30,
    textAlign: 'left',
    fontSize: '30',
    fontFamily: 'serif',
    text: '이 예제에서는 모델 큐브 레이어를 설명합니다.'
  }, {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 0
  },
  {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 0.5
  },
  {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 1
  },
  {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 1.5
  },
  {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 2
  },
  {
    type: 'line',
    x1 : 100, y1: 100, x2: 200, y2: 200, rotation: 2.5
  },
  {
    type: 'ellipse',
    cx : 300, cy: 200, rx: 100, ry: 50, rotation: 0
  },
  {
    type: 'ellipse',
    cx : 300, cy: 200, rx: 100, ry: 50, rotation: 0.5
  },
  {
    type: 'ellipse',
    cx : 300, cy: 200, rx: 100, ry: 50, rotation: 1.0
  },
  {
    type: 'ellipse',
    cx : 300, cy: 200, rx: 100, ry: 50, rotation: 1.5
  },
  {
    type: 'ellipse',
    cx : 300, cy: 200, rx: 100, ry: 50, rotation: 2.0
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 0, width: 200, height: 60
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 0.5, width: 200, height: 60
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 1, width: 200, height: 60
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 1.5, width: 200, height: 60
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 2, width: 200, height: 60
  },
  {
    type: 'rect',
    left: 550, top: 540, rotation: 2.5, width: 200, height: 60
  },
  {
    type: 'triangle',
    x1: 300, y1: 500, x2: 200, y2: 700, x3: 400, y3: 500, rotation: 0
  },
  {
    type: 'triangle',
    x1: 300, y1: 500, x2: 200, y2: 700, x3: 400, y3: 500, rotation: .5
  },
  {
    type: 'triangle',
    x1: 300, y1: 500, x2: 200, y2: 700, x3: 400, y3: 500, rotation: 1
  },
  {
    type: 'triangle',
    x1: 300, y1: 500, x2: 200, y2: 700, x3: 400, y3: 500, rotation: 1.5
  },
  {
    type: 'triangle',
    x1: 300, y1: 500, x2: 200, y2: 700, x3: 400, y3: 500, rotation: 2
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 0,
    strokeStyle: '#FF0000', fillStyle: ''
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 0.5,
    strokeStyle: '#FF00FF', fillStyle: ''
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 1,
    strokeStyle: '#0000FF', fillStyle: ''
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 1.5,
    strokeStyle: '#FFFF00', fillStyle: ''
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 2,
    strokeStyle: '#00FF00', fillStyle: ''
  },
  {
    type: 'polygon',
    path: [100, 200, 150, 500, 350, 400, 700, 300, 600, 250], rotation: 2.5,
    strokeStyle: '#00FFFF', fillStyle: ''
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 0
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 0.5
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 1
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 1.5
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 2
  },
  {
    type: 'polyline',
    path: [600, 730, 250, 580, 450, 490, 800, 400, 700, 350], rotation: 2.5
  },
  {
    type: 'cloud',
    x: 600, y: 150, rotation: 0
  },
  {
    type: 'ruler',
     left: 40, top: 0, origin: 50, margin: 0, width: 1000, height: 40, unit: 'm', rotation: 0, font: '8px Verdana'
  },
  {
    type: 'ruler',
     left: -480, top: 520, origin: -225, margin: 0, width: 1000, height: 40, unit: 'm', rotation: 270 * Math.PI / 180
  }]
};

var p = null;

function create() {
  p = scene.create({
    target: 'scene',
    model: model,
    layers: [{
      type: 'model-cube-layer'
    }]
  });
}

function dispose() {
  p.dispose();
}

function fullscreen() {
  p.fullscreen()
}
