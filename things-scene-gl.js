(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geo3d = require('./geo-3d');

var geo = _interopRequireWildcard(_geo3d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = scene.Component;
var Container = scene.Container;
var Layer = scene.Layer;

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type);

  GL.shaderSource(shader, shader_source);
  GL.compileShader(shader);

  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source);
    return;
  }

  return shader;
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram();

  GL.attachShader(program, vertex_shader);
  GL.attachShader(program, fragment_shader);

  GL.linkProgram(program);

  return program;
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

var AMORTIZATION = 0.98; // 감소분

var CubeLayer = function (_Layer) {
  _inherits(CubeLayer, _Layer);

  function CubeLayer(model, context) {
    _classCallCheck(this, CubeLayer);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CubeLayer).call(this, model, context));

    _this.texture = model.texture;
    return _this;
  }

  _createClass(CubeLayer, [{
    key: 'getContext',
    value: function getContext() {
      if (!this._context) this._context = this.canvas.getContext('experimental-webgl', { antialias: true });

      return this._context;
    }
  }, {
    key: 'once',
    value: function once(GL) {
      if (this._once) return;

      this.theta = 0;
      this.phi = 0;

      this.drag = false;
      this.old_x = 0;
      this.old_y = 0;

      this.dx = 0;
      this.dy = 0;

      this.vertexShader = '\nattribute vec3 position;\nuniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object\nuniform mat4 Mmatrix; // Mmatrix is the movement matrix of the cube\nuniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref\nattribute vec2 uv;    // UV coordinates of the point\nvarying vec2 vUV;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n  vUV = uv;           // Transmit UV to fragment shader\n}\n    ';

      this.fragmentShader = '\nprecision mediump float;\nuniform sampler2D sampler;\nvarying vec2 vUV;     // Get UV from vertex shader\n\nvoid main(void) {\n  gl_FragColor = texture2D(sampler, vUV);\n}\n    ';

      this.position = GL.getAttribLocation(this.program, "position");
      this.uv = GL.getAttribLocation(this.program, "uv");
      this.sampler = GL.getUniformLocation(this.program, "sampler");

      this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
      this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
      this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

      GL.enableVertexAttribArray(this.position);
      GL.enableVertexAttribArray(this.uv);

      GL.useProgram(this.program);
      GL.uniform1i(this.sampler, 0); // this.sampler is the texture channel No. 0

      GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);

      GL.clearDepth(1.0);

      this._once = true;
    }
  }, {
    key: 'draw',
    value: function draw() {
      if (this._drawing) return;
      this._drawing = true;

      var GL = this.getContext();

      this.once(GL);

      if (!this.drag) {
        // keep on moving if mouse button is unholding
        this.dx *= AMORTIZATION;
        this.dy *= AMORTIZATION;
        this.theta += this.dx;
        this.phi += this.dy;
      }

      geo.set_I4(MOVEMATRIX);
      geo.rotateY(MOVEMATRIX, this.theta);
      geo.rotateX(MOVEMATRIX, this.phi);

      this._pre_draw(GL);
      this._draw(GL);
      this._post_draw(GL);

      var self = this;

      window.requestAnimationFrame(function () {
        self.draw();
      });

      this._drawing = false;
    }
  }, {
    key: '_pre_draw',
    value: function _pre_draw(GL) {

      GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
    }
  }, {
    key: '_draw',
    value: function _draw(GL) {

      if (this.texture) {
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, this.texture);
      }

      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
      GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4 * (3 + 2), 3 * 4);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

      // 6 faces * 2 triangles per face * 3 points per triangle
      GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);
    }
  }, {
    key: '_post_draw',
    value: function _post_draw(GL) {

      GL.flush();
    }
  }, {
    key: 'contains',
    value: function contains(x, y) {
      return true;
    }
  }, {
    key: 'ondragstart',
    value: function ondragstart(e) {
      this.drag = true;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;

      return false;
    }
  }, {
    key: 'ondragmove',
    value: function ondragmove(e) {
      this.dx = (e.offsetX - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (e.offsetY - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;
    }
  }, {
    key: 'ondragend',
    value: function ondragend(e) {
      this.drag = false;
    }
  }, {
    key: 'ontouchstart',
    value: function ontouchstart(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.drag = true;

      this.old_x = txy.x;
      this.old_y = txy.y;

      return false;
    }
  }, {
    key: 'ontouchmove',
    value: function ontouchmove(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.dx = (txy.x - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (txy.y - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = txy.x;
      this.old_y = txy.y;
    }
  }, {
    key: 'ontouchend',
    value: function ontouchend(e) {
      this.drag = false;
    }
  }, {
    key: 'pmatrix',
    get: function get() {
      if (!this._pmatrix) this._pmatrix = geo.get_projection(40, this.canvas.width / this.canvas.height, 1, 100);

      return this._pmatrix;
    }
  }, {
    key: 'vertexShader',
    get: function get() {
      return this._vertex_shader;
    },
    set: function set(source) {
      this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER);
    }
  }, {
    key: 'fragmentShader',
    get: function get() {
      return this._fragment_shader;
    },
    set: function set(source) {
      this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER);
    }
  }, {
    key: 'program',
    get: function get() {
      if (!this._program) this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader);

      return this._program;
    }
  }, {
    key: 'vertex',
    get: function get() {
      var cube = [
      // back face
      -1, -1, -1, 0, 0, 1, -1, -1, 1, 0, 1, 1, -1, 1, 1, -1, 1, -1, 0, 1,

      // front face
      -1, -1, 1, 0, 0, 1, -1, 1, 1, 0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 1,

      // left face
      -1, -1, -1, 0, 0, -1, 1, -1, 1, 0, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1,

      // right
      1, -1, -1, 0, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 1,

      // bottom
      -1, -1, -1, 0, 0, -1, -1, 1, 1, 0, 1, -1, 1, 1, 1, 1, -1, -1, 0, 1,

      // top face
      -1, 1, -1, 0, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, -1, 0, 1];

      var GL = this.getContext();

      var vertex = GL.createBuffer();

      GL.bindBuffer(GL.ARRAY_BUFFER, vertex);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube), GL.STATIC_DRAW);

      return vertex;
    }
  }, {
    key: 'faces',
    get: function get() {
      var cube = [0, 1, 2, // 2 triangles for back face
      0, 2, 3, 4, 5, 6, // front face
      4, 6, 7, 8, 9, 10, // left face
      8, 10, 11, 12, 13, 14, // right face
      12, 14, 15, 16, 17, 18, // top face
      16, 18, 19, 20, 21, 22, // bottom face
      20, 22, 23];

      var GL = this.getContext();

      var faces = GL.createBuffer();

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube), GL.STATIC_DRAW);

      return faces;
    }
  }, {
    key: 'texture',
    get: function get() {
      return this._texture;
    },
    set: function set(url) {
      var image = new Image();

      image.src = url || this.get('texture');

      var self = this;

      image.onload = function (e) {
        var GL = self.getContext();

        self._texture = GL.createTexture();

        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.bindTexture(GL.TEXTURE_2D, self._texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

        GL.generateMipmap(GL.TEXTURE_2D);

        GL.bindTexture(GL.TEXTURE_2D, null);
      };
    }
  }, {
    key: 'position',
    set: function set(position) {
      this._position = position;
    },
    get: function get() {
      return this._position;
    }
  }, {
    key: 'eventMap',
    get: function get() {
      return {
        '(root)': {
          '(all)': {
            dragstart: this.ondragstart,
            dragmove: this.ondragmove,
            dragend: this.ondragend,
            touchstart: this.ontouchstart,
            touchmove: this.ontouchmove,
            touchend: this.ontouchend
          }
        }
      };
    }
  }]);

  return CubeLayer;
}(Layer);

exports.default = CubeLayer;


Component.register('cube-layer', CubeLayer);

},{"./geo-3d":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.degToRad = degToRad;
exports.get_projection = get_projection;
exports.get_I4 = get_I4;
exports.set_I4 = set_I4;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.translateZ = translateZ;
function degToRad(angle) {
  return angle * Math.PI / 180;
}

function get_projection(angle, a, zMin, zMax) {
  var tan = Math.tan(degToRad(0.5 * angle)),
      A = -(zMax + zMin) / (zMax - zMin),
      B = -2 * zMax * zMin / (zMax - zMin);

  return [0.5 / tan, 0, 0, 0, 0, 0.5 * a / tan, 0, 0, 0, 0, A, -1, 0, 0, B, 0];
}

function get_I4() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function set_I4(m) {
  m[0] = 1, m[1] = 0, m[2] = 0, m[3] = 0, m[4] = 0, m[5] = 1, m[6] = 0, m[7] = 0, m[8] = 0, m[9] = 0, m[10] = 1, m[11] = 0, m[12] = 0, m[13] = 0, m[14] = 0, m[15] = 1;
}

function rotateX(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv1 = m[1],
      mv5 = m[5],
      mv9 = m[9];
  m[1] = m[1] * c - m[2] * s;
  m[5] = m[5] * c - m[6] * s;
  m[9] = m[9] * c - m[10] * s;

  m[2] = m[2] * c + mv1 * s;
  m[6] = m[6] * c + mv5 * s;
  m[10] = m[10] * c + mv9 * s;
}

function rotateY(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv0 = m[0],
      mv4 = m[4],
      mv8 = m[8];
  m[0] = c * m[0] + s * m[2];
  m[4] = c * m[4] + s * m[6];
  m[8] = c * m[8] + s * m[10];

  m[2] = c * m[2] - s * mv0;
  m[6] = c * m[6] - s * mv4;
  m[10] = c * m[10] - s * mv8;
}

function rotateZ(m, angle) {
  var c = Math.cos(angle);
  var s = Math.sin(angle);
  var mv0 = m[0],
      mv4 = m[4],
      mv8 = m[8];
  m[0] = c * m[0] - s * m[1];
  m[4] = c * m[4] - s * m[5];
  m[8] = c * m[8] - s * m[9];

  m[1] = c * m[1] + s * mv0;
  m[5] = c * m[5] + s * mv4;
  m[9] = c * m[9] + s * mv8;
}

function translateZ(m, t) {
  m[14] += t;
}

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geo3d = require('./geo-3d');

var geo = _interopRequireWildcard(_geo3d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = scene.Component;
var Container = scene.Container;
var Layer = scene.Layer;

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type);

  GL.shaderSource(shader, shader_source);
  GL.compileShader(shader);

  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source);
    return;
  }

  return shader;
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram();

  GL.attachShader(program, vertex_shader);
  GL.attachShader(program, fragment_shader);

  GL.linkProgram(program);

  return program;
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

var GlLayer = function (_Layer) {
  _inherits(GlLayer, _Layer);

  function GlLayer() {
    _classCallCheck(this, GlLayer);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(GlLayer).apply(this, arguments));
  }

  _createClass(GlLayer, [{
    key: 'getContext',
    value: function getContext() {
      if (!this._context) this._context = this.canvas.getContext('experimental-webgl', { antialias: true });

      return this._context;
    }
  }, {
    key: 'once',
    value: function once(GL) {
      if (this._once) return;

      this.vertexShader = '\nattribute vec3 position;\nuniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object\nuniform mat4 Mmatrix; // Mmatrix is the movement matrix of the triangle\nuniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref\nattribute vec3 color;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n  vColor = color;\n}\n    ';

      this.fragmentShader = '\nprecision mediump float;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_FragColor = vec4(vColor, 1.);\n}\n    ';

      this.color = GL.getAttribLocation(this.program, "color");
      this.position = GL.getAttribLocation(this.program, "position");
      this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
      this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
      this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

      GL.enableVertexAttribArray(this.position);
      GL.enableVertexAttribArray(this.color);

      GL.useProgram(this.program);

      GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);

      GL.clearDepth(1.0);

      this._once = true;
    }
  }, {
    key: 'draw',
    value: function draw() {
      if (this._drawing) return;
      this._drawing = true;

      var GL = this.getContext();

      this.once(GL);

      if (!this.time_old) this.time_old = 0;

      var now = Date.now();
      var dt = now - this.time_old;

      geo.rotateZ(MOVEMATRIX, dt * 0.005);
      geo.rotateY(MOVEMATRIX, dt * 0.004);
      geo.rotateX(MOVEMATRIX, dt * 0.003);

      var dAngle = 0.005 * dt;
      geo.rotateY(MOVEMATRIX, dAngle);
      this.time_old = now;

      this._pre_draw(GL);
      this._draw(GL);
      this._post_draw(GL);

      var self = this;

      window.requestAnimationFrame(function () {
        self.draw();
      });

      this._drawing = false;
    }
  }, {
    key: '_pre_draw',
    value: function _pre_draw(GL) {

      GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
    }
  }, {
    key: '_draw',
    value: function _draw(GL) {
      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 3), 0 /* offset */);
      GL.vertexAttribPointer(this.color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4 /* offset */);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

      GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
    }
  }, {
    key: '_post_draw',
    value: function _post_draw(GL) {

      GL.flush();
    }
  }, {
    key: 'contains',
    value: function contains(x, y) {
      return true;
    }
  }, {
    key: 'pmatrix',
    get: function get() {
      if (!this._pmatrix) this._pmatrix = geo.get_projection(40, this.canvas.width / this.canvas.height, 1, 100);

      return this._pmatrix;
    }
  }, {
    key: 'vertexShader',
    get: function get() {
      return this._vertex_shader;
    },
    set: function set(source) {
      this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER);
    }
  }, {
    key: 'fragmentShader',
    get: function get() {
      return this._fragment_shader;
    },
    set: function set(source) {
      this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER);
    }
  }, {
    key: 'program',
    get: function get() {
      if (!this._program) this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader);

      return this._program;
    }
  }, {
    key: 'vertex',
    get: function get() {
      var triangle = [-1, -1, 0, // first summit -> bottom left of the viewport
      0, 0, 1, // first summit color -> blue
      1, -1, 0, // bottom right of the viewport
      1, 1, 0, // second -> yellow
      1, 1, 0, // top right of the viewport
      1, 0, 0 // third -> red
      ];

      var GL = this.getContext();

      var vertex = GL.createBuffer();

      GL.bindBuffer(GL.ARRAY_BUFFER, vertex);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle), GL.STATIC_DRAW);

      return vertex;
    }
  }, {
    key: 'faces',
    get: function get() {
      var triangle = [0, 1, 2];

      var GL = this.getContext();

      var faces = GL.createBuffer();

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle), GL.STATIC_DRAW);

      return faces;
    }
  }, {
    key: 'position',
    set: function set(position) {
      this._position = position;
    },
    get: function get() {
      return this._position;
    }
  }]);

  return GlLayer;
}(Layer);

exports.default = GlLayer;


Component.register('gl-layer', GlLayer);

},{"./geo-3d":2}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _glLayer = require('./gl-layer');

Object.defineProperty(exports, 'GlLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_glLayer).default;
  }
});

var _cubeLayer = require('./cube-layer');

Object.defineProperty(exports, 'CubeLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_cubeLayer).default;
  }
});

var _threedLayer = require('./threed-layer');

Object.defineProperty(exports, 'ThreeDLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_threedLayer).default;
  }
});

var _qrcubeLayer = require('./qrcube-layer');

Object.defineProperty(exports, 'QrCubeLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_qrcubeLayer).default;
  }
});

var _modelCubeLayer = require('./model-cube-layer');

Object.defineProperty(exports, 'ModelCubeLayer', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_modelCubeLayer).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

},{"./cube-layer":1,"./gl-layer":3,"./model-cube-layer":5,"./qrcube-layer":6,"./threed-layer":7}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geo3d = require('./geo-3d');

var geo = _interopRequireWildcard(_geo3d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = scene.Component;
var Container = scene.Container;
var Layer = scene.Layer;

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type);

  GL.shaderSource(shader, shader_source);
  GL.compileShader(shader);

  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source);
    return;
  }

  return shader;
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram();

  GL.attachShader(program, vertex_shader);
  GL.attachShader(program, fragment_shader);

  GL.linkProgram(program);

  return program;
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -3);

var AMORTIZATION = 0.98; // 감소분

var ModelCubeLayer = function (_Layer) {
  _inherits(ModelCubeLayer, _Layer);

  function ModelCubeLayer() {
    _classCallCheck(this, ModelCubeLayer);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ModelCubeLayer).apply(this, arguments));
  }

  _createClass(ModelCubeLayer, [{
    key: 'getContext',
    value: function getContext() {
      if (!this._context) this._context = this.canvas.getContext('experimental-webgl', { antialias: true });

      return this._context;
    }
  }, {
    key: 'once',
    value: function once(GL) {
      if (this._once) return;

      this.theta = 0;
      this.phi = 0;

      this.drag = false;
      this.old_x = 0;
      this.old_y = 0;

      this.dx = 0;
      this.dy = 0;

      this.vertexShader = '\nattribute vec3 position;\nuniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object\nuniform mat4 Mmatrix; // Mmatrix is the movement matrix of the cube\nuniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref\nattribute vec2 uv;    // UV coordinates of the point\nvarying vec2 vUV;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n  vUV = uv;           // Transmit UV to fragment shader\n}\n    ';

      this.fragmentShader = '\nprecision mediump float;\nuniform sampler2D sampler;\nvarying vec2 vUV;     // Get UV from vertex shader\n\nvoid main(void) {\n  gl_FragColor = texture2D(sampler, vUV);\n}\n    ';

      this.position = GL.getAttribLocation(this.program, "position");
      this.uv = GL.getAttribLocation(this.program, "uv");
      this.sampler = GL.getUniformLocation(this.program, "sampler");

      this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
      this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
      this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

      GL.enableVertexAttribArray(this.position);
      GL.enableVertexAttribArray(this.uv);

      GL.useProgram(this.program);
      GL.uniform1i(this.sampler, 0); // this.sampler is the texture channel No. 0

      GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);

      GL.clearDepth(1.0);

      this._once = true;
    }
  }, {
    key: 'draw',
    value: function draw() {
      if (this._drawing) return;

      this._drawing = true;

      var GL = this.getContext();

      this.once(GL);

      if (!this.drag) {
        // keep on moving if mouse button is unholding
        this.dx *= AMORTIZATION;
        this.dy *= AMORTIZATION;
        this.theta += this.dx;
        this.phi += this.dy;
      }

      geo.set_I4(MOVEMATRIX);
      geo.rotateY(MOVEMATRIX, this.theta);
      geo.rotateX(MOVEMATRIX, this.phi);

      this._pre_draw(GL);
      this._draw(GL);
      this._post_draw(GL);

      var self = this;

      window.requestAnimationFrame(function () {
        self.draw();
      });

      this._drawing = false;
    }
  }, {
    key: '_pre_draw',
    value: function _pre_draw(GL) {

      GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
    }
  }, {
    key: '_draw',
    value: function _draw(GL) {
      if (!this.texture) return;

      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, this.texture);

      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
      GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4 * (3 + 2), 3 * 4);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

      // 6 faces * 2 triangles per face * 3 points per triangle
      GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);
    }
  }, {
    key: '_post_draw',
    value: function _post_draw(GL) {

      GL.flush();
    }
  }, {
    key: 'contains',
    value: function contains(x, y) {
      return true;
    }
  }, {
    key: 'ondragstart',
    value: function ondragstart(e) {
      this.drag = true;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;

      return false;
    }
  }, {
    key: 'ondragmove',
    value: function ondragmove(e) {
      this.dx = (e.offsetX - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (e.offsetY - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;
    }
  }, {
    key: 'ondragend',
    value: function ondragend(e) {
      this.drag = false;
    }
  }, {
    key: 'ontouchstart',
    value: function ontouchstart(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.drag = true;

      this.old_x = txy.x;
      this.old_y = txy.y;

      return false;
    }
  }, {
    key: 'ontouchmove',
    value: function ontouchmove(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.dx = (txy.x - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (txy.y - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = txy.x;
      this.old_y = txy.y;
    }
  }, {
    key: 'ontouchend',
    value: function ontouchend(e) {
      this.drag = false;
    }
  }, {
    key: 'pmatrix',
    get: function get() {
      if (!this._pmatrix) this._pmatrix = geo.get_projection(40, this.canvas.width / this.canvas.height, 1, 100);

      return this._pmatrix;
    }
  }, {
    key: 'vertexShader',
    get: function get() {
      return this._vertex_shader;
    },
    set: function set(source) {
      this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER);
    }
  }, {
    key: 'fragmentShader',
    get: function get() {
      return this._fragment_shader;
    },
    set: function set(source) {
      this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER);
    }
  }, {
    key: 'program',
    get: function get() {
      if (!this._program) this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader);

      return this._program;
    }
  }, {
    key: 'vertex',
    get: function get() {
      var cube = [
      // back face
      -1, -1, -1, 0, 0, 1, -1, -1, 1, 0, 1, 1, -1, 1, 1, -1, 1, -1, 0, 1,

      // front face
      -1, -1, 1, 0, 0, 1, -1, 1, 1, 0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 1,

      // left face
      -1, -1, -1, 0, 0, -1, 1, -1, 1, 0, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1,

      // right
      1, -1, -1, 0, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 1,

      // bottom
      -1, -1, -1, 0, 0, -1, -1, 1, 1, 0, 1, -1, 1, 1, 1, 1, -1, -1, 0, 1,

      // top face
      -1, 1, -1, 0, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, -1, 0, 1];

      var GL = this.getContext();

      var vertex = GL.createBuffer();

      GL.bindBuffer(GL.ARRAY_BUFFER, vertex);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube), GL.STATIC_DRAW);

      return vertex;
    }
  }, {
    key: 'faces',
    get: function get() {
      var cube = [0, 1, 2, // 2 triangles for back face
      0, 2, 3, 4, 5, 6, // front face
      4, 6, 7, 8, 9, 10, // left face
      8, 10, 11, 12, 13, 14, // right face
      12, 14, 15, 16, 17, 18, // top face
      16, 18, 19, 20, 21, 22, // bottom face
      20, 22, 23];

      var GL = this.getContext();

      var faces = GL.createBuffer();

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube), GL.STATIC_DRAW);

      return faces;
    }
  }, {
    key: 'texture',
    get: function get() {
      if (this._texture) return this._texture;

      var target_canvas = this.parent.model_layer.canvas;
      target_canvas.style.display = 'none';

      var image = new Image();

      var self = this;

      image.onload = function (e) {
        var GL = self.getContext();

        self._texture = GL.createTexture();

        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.bindTexture(GL.TEXTURE_2D, self._texture);

        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

        // GL.generateMipmap(GL.TEXTURE_2D);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

        GL.bindTexture(GL.TEXTURE_2D, null);
      };

      image.src = target_canvas.toDataURL();

      return this._texture;
    }
  }, {
    key: 'position',
    set: function set(position) {
      this._position = position;
    },
    get: function get() {
      return this._position;
    }
  }, {
    key: 'eventMap',
    get: function get() {
      return {
        '(root)': {
          '(all)': {
            dragstart: this.ondragstart,
            dragmove: this.ondragmove,
            dragend: this.ondragend,
            touchstart: this.ontouchstart,
            touchmove: this.ontouchmove,
            touchend: this.ontouchend
          }
        }
      };
    }
  }]);

  return ModelCubeLayer;
}(Layer);

exports.default = ModelCubeLayer;


Component.register('model-cube-layer', ModelCubeLayer);

},{"./geo-3d":2}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geo3d = require('./geo-3d');

var geo = _interopRequireWildcard(_geo3d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = scene.Component;
var Container = scene.Container;
var Layer = scene.Layer;

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type);

  GL.shaderSource(shader, shader_source);
  GL.compileShader(shader);

  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source);
    return;
  }

  return shader;
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram();

  GL.attachShader(program, vertex_shader);
  GL.attachShader(program, fragment_shader);

  GL.linkProgram(program);

  return program;
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

var AMORTIZATION = 0.95; // 감소분

var QrCubeLayer = function (_Layer) {
  _inherits(QrCubeLayer, _Layer);

  function QrCubeLayer() {
    _classCallCheck(this, QrCubeLayer);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(QrCubeLayer).apply(this, arguments));
  }

  _createClass(QrCubeLayer, [{
    key: 'getContext',
    value: function getContext() {
      if (!this._context) this._context = this.canvas.getContext('experimental-webgl', { antialias: true });

      return this._context;
    }
  }, {
    key: 'once',
    value: function once(GL) {
      if (this._once) return;

      this.theta = 0;
      this.phi = 0;

      this.drag = false;
      this.old_x = 0;
      this.old_y = 0;

      this.dx = 0;
      this.dy = 0;

      this.vertexShader = '\nattribute vec3 position;\nuniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object\nuniform mat4 Mmatrix; // Mmatrix is the movement matrix of the cube\nuniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref\nattribute vec2 uv;    // UV coordinates of the point\nvarying vec2 vUV;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n  vUV = uv;           // Transmit UV to fragment shader\n}\n    ';

      this.fragmentShader = '\nprecision mediump float;\nuniform sampler2D sampler;\nvarying vec2 vUV;     // Get UV from vertex shader\n\nvoid main(void) {\n  gl_FragColor = texture2D(sampler, vUV);\n}\n    ';

      this.position = GL.getAttribLocation(this.program, "position");
      this.uv = GL.getAttribLocation(this.program, "uv");
      this.sampler = GL.getUniformLocation(this.program, "sampler");

      this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
      this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
      this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

      GL.enableVertexAttribArray(this.position);
      GL.enableVertexAttribArray(this.uv);

      GL.useProgram(this.program);
      GL.uniform1i(this.sampler, 0); // this.sampler is the texture channel No. 0

      GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);

      GL.clearDepth(1.0);

      this._once = true;
    }
  }, {
    key: 'draw',
    value: function draw() {
      if (this._drawing) return;
      this._drawing = true;

      var GL = this.getContext();

      this.once(GL);

      if (!this.drag) {
        // keep on moving if mouse button is unholding
        this.dx *= AMORTIZATION;
        this.dy *= AMORTIZATION;
        this.theta += this.dx;
        this.phi += this.dy;
      }

      geo.set_I4(MOVEMATRIX);
      geo.rotateY(MOVEMATRIX, this.theta);
      geo.rotateX(MOVEMATRIX, this.phi);

      this._pre_draw(GL);
      this._draw(GL);
      this._post_draw(GL);

      var self = this;

      window.requestAnimationFrame(function () {
        self.draw();
      });

      this._drawing = false;
    }
  }, {
    key: '_pre_draw',
    value: function _pre_draw(GL) {

      GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
    }
  }, {
    key: '_draw',
    value: function _draw(GL) {
      if (!this.texture) return;

      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, this.texture);

      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
      GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4 * (3 + 2), 3 * 4);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

      // 6 faces * 2 triangles per face * 3 points per triangle
      GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);
    }
  }, {
    key: '_post_draw',
    value: function _post_draw(GL) {

      GL.flush();
    }
  }, {
    key: 'contains',
    value: function contains(x, y) {
      return true;
    }
  }, {
    key: 'ondragstart',
    value: function ondragstart(e) {
      this.drag = true;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;

      return false;
    }
  }, {
    key: 'ondragmove',
    value: function ondragmove(e) {
      this.dx = (e.offsetX - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (e.offsetY - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;
    }
  }, {
    key: 'ondragend',
    value: function ondragend(e) {
      this.drag = false;
    }
  }, {
    key: 'ontouchstart',
    value: function ontouchstart(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.drag = true;

      this.old_x = txy.x;
      this.old_y = txy.y;

      return false;
    }
  }, {
    key: 'ontouchmove',
    value: function ontouchmove(e) {
      var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft, e.touches[0].pageY - e.touches[0].target.offsetTop);

      this.dx = (txy.x - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (txy.y - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = txy.x;
      this.old_y = txy.y;
    }
  }, {
    key: 'ontouchend',
    value: function ontouchend(e) {
      this.drag = false;
    }
  }, {
    key: 'pmatrix',
    get: function get() {
      if (!this._pmatrix) this._pmatrix = geo.get_projection(40, this.canvas.width / this.canvas.height, 1, 100);

      return this._pmatrix;
    }
  }, {
    key: 'vertexShader',
    get: function get() {
      return this._vertex_shader;
    },
    set: function set(source) {
      this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER);
    }
  }, {
    key: 'fragmentShader',
    get: function get() {
      return this._fragment_shader;
    },
    set: function set(source) {
      this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER);
    }
  }, {
    key: 'program',
    get: function get() {
      if (!this._program) this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader);

      return this._program;
    }
  }, {
    key: 'vertex',
    get: function get() {
      var cube = [
      // back face
      -1, -1, -1, 0, 0, 1, -1, -1, 1, 0, 1, 1, -1, 1, 1, -1, 1, -1, 0, 1,

      // front face
      -1, -1, 1, 0, 0, 1, -1, 1, 1, 0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 1,

      // left face
      -1, -1, -1, 0, 0, -1, 1, -1, 1, 0, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1,

      // right
      1, -1, -1, 0, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 1,

      // bottom
      -1, -1, -1, 0, 0, -1, -1, 1, 1, 0, 1, -1, 1, 1, 1, 1, -1, -1, 0, 1,

      // top face
      -1, 1, -1, 0, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, -1, 0, 1];

      var GL = this.getContext();

      var vertex = GL.createBuffer();

      GL.bindBuffer(GL.ARRAY_BUFFER, vertex);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube), GL.STATIC_DRAW);

      return vertex;
    }
  }, {
    key: 'faces',
    get: function get() {
      var cube = [0, 1, 2, // 2 triangles for back face
      0, 2, 3, 4, 5, 6, // front face
      4, 6, 7, 8, 9, 10, // left face
      8, 10, 11, 12, 13, 14, // right face
      12, 14, 15, 16, 17, 18, // top face
      16, 18, 19, 20, 21, 22, // bottom face
      20, 22, 23];

      var GL = this.getContext();

      var faces = GL.createBuffer();

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube), GL.STATIC_DRAW);

      return faces;
    }
  }, {
    key: 'texture',
    get: function get() {
      if (this._texture || this._ready) return this._texture;

      this._ready = true;

      var image = new Image();

      var self = this;

      image.onload = function (e) {
        var GL = self.getContext();

        self._texture = GL.createTexture();

        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.bindTexture(GL.TEXTURE_2D, self._texture);

        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

        // GL.generateMipmap(GL.TEXTURE_2D);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE);

        GL.bindTexture(GL.TEXTURE_2D, null);
      };

      var _model = this.model;
      var symbol = _model.symbol;
      var text = _model.text;
      var alttext = _model.alttext;
      var scale_h = _model.scale_h;
      var scale_w = _model.scale_w;
      var rot = _model.rot;


      image.src = bwip.imageUrl({
        symbol: symbol,
        text: text,
        alttext: alttext,
        scale_h: scale_h,
        scale_w: scale_w,
        rotation: rot // rotation 속성 이름 충돌되므로 rot로 변경함.
      });

      return this._texture;
    }
  }, {
    key: 'position',
    set: function set(position) {
      this._position = position;
    },
    get: function get() {
      return this._position;
    }
  }, {
    key: 'eventMap',
    get: function get() {
      return {
        '(root)': {
          '(all)': {
            dragstart: this.ondragstart,
            dragmove: this.ondragmove,
            dragend: this.ondragend,
            touchstart: this.ontouchstart,
            touchmove: this.ontouchmove,
            touchend: this.ontouchend
          }
        }
      };
    }
  }]);

  return QrCubeLayer;
}(Layer);

exports.default = QrCubeLayer;


Component.register('qrcube-layer', QrCubeLayer);

},{"./geo-3d":2}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geo3d = require('./geo-3d');

var geo = _interopRequireWildcard(_geo3d);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Component = scene.Component;
var Container = scene.Container;
var Layer = scene.Layer;

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type);

  GL.shaderSource(shader, shader_source);
  GL.compileShader(shader);

  if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source);
    return;
  }

  return shader;
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram();

  GL.attachShader(program, vertex_shader);
  GL.attachShader(program, fragment_shader);

  GL.linkProgram(program);

  return program;
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

var AMORTIZATION = 0.98; // 감소분

var ThreeDLayer = function (_Layer) {
  _inherits(ThreeDLayer, _Layer);

  function ThreeDLayer(model, context) {
    _classCallCheck(this, ThreeDLayer);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ThreeDLayer).call(this, model, context));

    _this.texture = model.texture;
    return _this;
  }

  _createClass(ThreeDLayer, [{
    key: 'getContext',
    value: function getContext() {
      if (!this._context) this._context = this.canvas.getContext('experimental-webgl', { antialias: true });

      return this._context;
    }
  }, {
    key: 'texturexx',
    value: function texturexx(GL) {
      this.fb = GL.createFramebuffer();
      GL.bindFramebuffer(GL.FRAMEBUFFER, this.fb);

      var rb = GL.createRenderbuffer();
      GL.bindRenderbuffer(GL.RENDERBUFFER, rb);
      GL.renderbufferStorage(GL.RENDERBUFFER, GL.DEPTH_COMPONENT16, 512, 512);

      this._texture_rtt = GL.createTexture();
      GL.bindTexture(GL.TEXTURE_2D, this._texture_rtt);

      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, 512, 512, 0, GL.RGBA, GL.UNSIGNED_BYTE, null);

      GL.framebufferTexture2D(GL.FRAMEBUFFER, GL.COLOR_ATTACHMENT0, GL.TEXTURE_2D, this._texture_rtt, 0);

      GL.framebufferRenderbuffer(GL.FRAMEBUFFER, GL.DEPTH_ATTACHMENT, GL.RENDERBUFFER, rb);

      GL.bindTexture(GL.TEXTURE_2D, null);
      GL.bindRenderbuffer(GL.RENDERBUFFER, null);
      GL.bindFramebuffer(GL.FRAMEBUFFER, null);
    }
  }, {
    key: 'once',
    value: function once(GL) {
      if (this._once) return;

      this.theta = 0;
      this.phi = 0;

      this.drag = false;
      this.old_x = 0;
      this.old_y = 0;

      this.dx = 0;
      this.dy = 0;

      this.vertexShader = '\nattribute vec3 position;\nuniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object\nuniform mat4 Mmatrix; // Mmatrix is the movement matrix of the cube\nuniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref\nattribute vec2 uv;    // UV coordinates of the point\nvarying vec2 vUV;\n\nvarying vec3 vColor;\n\nvoid main(void) {\n  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n  vUV = uv;           // Transmit UV to fragment shader\n}\n    ';

      this.fragmentShader = '\nprecision mediump float;\nuniform sampler2D sampler;\nvarying vec2 vUV;     // Get UV from vertex shader\n\nvoid main(void) {\n  gl_FragColor = texture2D(sampler, vUV);\n}\n    ';

      this.position = GL.getAttribLocation(this.program, "position");
      this.uv = GL.getAttribLocation(this.program, "uv");
      this.sampler = GL.getUniformLocation(this.program, "sampler");

      this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
      this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
      this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

      GL.enableVertexAttribArray(this.position);
      GL.enableVertexAttribArray(this.uv);

      GL.useProgram(this.program);
      GL.uniform1i(this.sampler, 0); // this.sampler is the texture channel No. 0

      GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

      GL.enable(GL.DEPTH_TEST);
      GL.depthFunc(GL.LEQUAL);

      GL.clearDepth(1.0);

      this.texturexx(GL);

      this._once = true;
    }
  }, {
    key: 'draw',
    value: function draw() {
      if (this._drawing) return;
      this._drawing = true;

      var GL = this.getContext();

      this.once(GL);

      if (!this.drag) {
        // keep on moving if mouse button is unholding
        this.dx *= AMORTIZATION;
        this.dy *= AMORTIZATION;
        this.theta += this.dx;
        this.phi += this.dy;
      }

      //===== DRAWING ON THE TEXTURE =====
      GL.bindFramebuffer(GL.FRAMEBUFFER, this.fb);
      GL.viewport(0.0, 0.0, 512, 512);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      //draw the rotating cube
      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);

      if (this.texture) {
        GL.activeTexture(GL.TEXTURE0);
        GL.bindTexture(GL.TEXTURE_2D, this.texture);
      }

      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);
      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
      GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4 * (3 + 2), 3 * 4);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);
      GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);

      GL.flush();
      GL.bindTexture(GL.TEXTURE_2D, null);

      //===== DRAWING THE MAIN 3D SCENE =====

      GL.bindFramebuffer(GL.FRAMEBUFFER, null);

      geo.set_I4(MOVEMATRIX);
      geo.rotateY(MOVEMATRIX, this.theta);
      geo.rotateX(MOVEMATRIX, this.phi);

      this._pre_draw(GL);
      this._draw(GL);
      this._post_draw(GL);

      var self = this;

      window.requestAnimationFrame(function () {
        self.draw();
      });

      this._drawing = false;
    }
  }, {
    key: '_pre_draw',
    value: function _pre_draw(GL) {

      GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
      GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

      GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
      GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
      GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
    }
  }, {
    key: '_draw',
    value: function _draw(GL) {

      // if (this.texture) {
      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, this._texture_rtt);
      // }

      GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

      GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 2), 0);
      GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4 * (3 + 2), 3 * 4);

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

      // 6 faces * 2 triangles per face * 3 points per triangle
      GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);
    }
  }, {
    key: '_post_draw',
    value: function _post_draw(GL) {

      GL.flush();
    }
  }, {
    key: 'contains',
    value: function contains(x, y) {
      return true;
    }
  }, {
    key: 'onmousedown',
    value: function onmousedown(e) {
      this.drag = true;
      this.old_x = e.offsetX;
      this.old_y = e.offsetY;

      // e.preventDefault()

      return false;
    }
  }, {
    key: 'onmouseup',
    value: function onmouseup(e) {
      this.drag = false;
    }
  }, {
    key: 'onmousemove',
    value: function onmousemove(e) {
      if (!this.drag) return false;

      this.dx = (e.offsetX - this.old_x) * 2 * Math.PI / this.canvas.width;
      this.dy = (e.offsetY - this.old_y) * 2 * Math.PI / this.canvas.height;
      this.theta += this.dx;
      this.phi += this.dy;

      this.old_x = e.offsetX;
      this.old_y = e.offsetY;

      // e.preventDefault()
    }
  }, {
    key: 'onmouseout',
    value: function onmouseout(e) {
      this.drag = false;
    }
  }, {
    key: 'pmatrix',
    get: function get() {
      if (!this._pmatrix) this._pmatrix = geo.get_projection(40, this.canvas.width / this.canvas.height, 1, 100);

      return this._pmatrix;
    }
  }, {
    key: 'vertexShader',
    get: function get() {
      return this._vertex_shader;
    },
    set: function set(source) {
      this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER);
    }
  }, {
    key: 'fragmentShader',
    get: function get() {
      return this._fragment_shader;
    },
    set: function set(source) {
      this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER);
    }
  }, {
    key: 'program',
    get: function get() {
      if (!this._program) this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader);

      return this._program;
    }
  }, {
    key: 'vertex',
    get: function get() {
      var cube = [
      // back face
      -1, -1, -1, 0, 0, 1, -1, -1, 1, 0, 1, 1, -1, 1, 1, -1, 1, -1, 0, 1,

      // front face
      -1, -1, 1, 0, 0, 1, -1, 1, 1, 0, 1, 1, 1, 1, 1, -1, 1, 1, 0, 1,

      // left face
      -1, -1, -1, 0, 0, -1, 1, -1, 1, 0, -1, 1, 1, 1, 1, -1, -1, 1, 0, 1,

      // right
      1, -1, -1, 0, 0, 1, 1, -1, 1, 0, 1, 1, 1, 1, 1, 1, -1, 1, 0, 1,

      // bottom
      -1, -1, -1, 0, 0, -1, -1, 1, 1, 0, 1, -1, 1, 1, 1, 1, -1, -1, 0, 1,

      // top face
      -1, 1, -1, 0, 0, -1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, -1, 0, 1];

      var GL = this.getContext();

      var vertex = GL.createBuffer();

      GL.bindBuffer(GL.ARRAY_BUFFER, vertex);
      GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube), GL.STATIC_DRAW);

      return vertex;
    }
  }, {
    key: 'faces',
    get: function get() {
      var cube = [0, 1, 2, // 2 triangles for back face
      0, 2, 3, 4, 5, 6, // front face
      4, 6, 7, 8, 9, 10, // left face
      8, 10, 11, 12, 13, 14, // right face
      12, 14, 15, 16, 17, 18, // top face
      16, 18, 19, 20, 21, 22, // bottom face
      20, 22, 23];

      var GL = this.getContext();

      var faces = GL.createBuffer();

      GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces);
      GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube), GL.STATIC_DRAW);

      return faces;
    }
  }, {
    key: 'texture',
    get: function get() {
      return this._texture;
    },
    set: function set(url) {
      var image = new Image();

      image.src = url || this.get('texture');
      image.webglTexture = false;

      var self = this;

      image.onload = function (e) {
        var GL = self.getContext();

        self._texture = GL.createTexture();

        GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
        GL.bindTexture(GL.TEXTURE_2D, self._texture);
        GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
        // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
        GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

        GL.generateMipmap(GL.TEXTURE_2D);

        GL.bindTexture(GL.TEXTURE_2D, null);
      };
    }
  }, {
    key: 'position',
    set: function set(position) {
      this._position = position;
    },
    get: function get() {
      return this._position;
    }
  }, {
    key: 'eventMap',
    get: function get() {
      return {
        '(root)': {
          '(all)': {
            mousedown: this.onmousedown,
            mouseup: this.onmouseup,
            mouseout: this.onmouseout,
            mousemove: this.onmousemove
          }
        }
      };
    }
  }]);

  return ThreeDLayer;
}(Layer);

exports.default = ThreeDLayer;


Component.register('3d-layer', ThreeDLayer);

},{"./geo-3d":2}]},{},[3,4]);
