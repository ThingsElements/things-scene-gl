var Component = scene.Component
var Container = scene.Container
var Layer = scene.Layer

import * as geo from './geo-3d'

function compile_shader(GL, shader_source, type) {

  var shader = GL.createShader(type)

  GL.shaderSource(shader, shader_source)
  GL.compileShader(shader)

  if(!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
    console.log('shader compile error', shader_source)
    return
  }

  return shader
}

function build_program(GL, vertex_shader, fragment_shader) {
  var program = GL.createProgram()

  GL.attachShader(program, vertex_shader)
  GL.attachShader(program, fragment_shader)

  GL.linkProgram(program);

  return program
}

var MOVEMATRIX = geo.get_I4();
var VIEWMATRIX = geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

const AMORTIZATION = 0.98; // 감소분

export default class CubeLayer extends Layer {

  constructor(model) {
    super(model)

    this.texture = model.texture
  }

  getContext() {
    if(!this._context)
      this._context = this.canvas.getContext('experimental-webgl', {antialias: true});

    return this._context
  }

  get pmatrix() {
    if(!this._pmatrix)
      this._pmatrix = geo.get_projection(40, this.canvas.width/this.canvas.height, 1, 100);

    return this._pmatrix
  }

  get vertexShader() {
    return this._vertex_shader
  }

  set vertexShader(source) {
    this._vertex_shader = compile_shader(this.getContext(), source, this.getContext().VERTEX_SHADER)
  }

  get fragmentShader() {
    return this._fragment_shader
  }

  set fragmentShader(source) {
    this._fragment_shader = compile_shader(this.getContext(), source, this.getContext().FRAGMENT_SHADER)
  }

  get program() {
    if(!this._program)
      this._program = build_program(this.getContext(), this.vertexShader, this.fragmentShader)

    return this._program
  }

  get vertex() {
    var cube = [
      // back face
      -1,-1,-1,    0,0,
      1,-1,-1,     1,0,
      1, 1,-1,     1,1,
      -1, 1,-1,    0,1,

      // front face
      -1,-1, 1,    0,0,
      1,-1, 1,     1,0,
      1, 1, 1,     1,1,
      -1, 1, 1,    0,1,

      // left face
      -1,-1,-1,    0,0,
      -1, 1,-1,    1,0,
      -1, 1, 1,    1,1,
      -1,-1, 1,    0,1,

      // right
      1,-1,-1,     0,0,
      1, 1,-1,     1,0,
      1, 1, 1,     1,1,
      1,-1, 1,     0,1,

      // bottom
      -1,-1,-1,    0,0,
      -1,-1, 1,    1,0,
      1,-1, 1,     1,1,
      1,-1,-1,     0,1,

      // top face
      -1, 1,-1,    0,0,
      -1, 1, 1,    1,0,
      1, 1, 1,     1,1,
      1, 1,-1,     0,1,
    ]

    var GL = this.getContext()

    var vertex = GL.createBuffer()

    GL.bindBuffer(GL.ARRAY_BUFFER, vertex)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(cube), GL.STATIC_DRAW)

    return vertex
  }

  get faces() {
    var cube = [
      0,1,2,      // 2 triangles for back face
      0,2,3,

      4,5,6,      // front face
      4,6,7,

      8,9,10,     // left face
      8,10,11,

      12,13,14,   // right face
      12,14,15,

      16,17,18,   // top face
      16,18,19,

      20,21,22,   // bottom face
      20,22,23
    ]

    var GL = this.getContext()

    var faces = GL.createBuffer()

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces)
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cube), GL.STATIC_DRAW)

    return faces
  }

  get texture() {
    return this._texture
  }

  set texture(url) {
    var image = new Image()

    image.src = url || this.get('texture')

    var self = this

    image.onload = function(e) {
      var GL = self.getContext()

      self._texture = GL.createTexture();

      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.bindTexture(GL.TEXTURE_2D, self._texture);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      // GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

      GL.generateMipmap(GL.TEXTURE_2D);

      GL.bindTexture(GL.TEXTURE_2D, null);
    }
  }

  set position(position) {
    this._position = position
  }

  get position() {
    return this._position
  }

  once(GL) {
    if(this._once)
      return

    this.theta = 0
    this.phi = 0

    this.drag = false
    this.old_x = 0
    this.old_y = 0

    this.dx = 0
    this.dy = 0

    this.vertexShader = `
attribute vec3 position;
uniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object
uniform mat4 Mmatrix; // Mmatrix is the movement matrix of the cube
uniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref
attribute vec2 uv;    // UV coordinates of the point
varying vec2 vUV;

varying vec3 vColor;

void main(void) {
  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
  vUV = uv;           // Transmit UV to fragment shader
}
    `

    this.fragmentShader = `
precision mediump float;
uniform sampler2D sampler;
varying vec2 vUV;     // Get UV from vertex shader

void main(void) {
  gl_FragColor = texture2D(sampler, vUV);
}
    `

    this.position = GL.getAttribLocation(this.program, "position");
    this.uv = GL.getAttribLocation(this.program, "uv");
    this.sampler = GL.getUniformLocation(this.program, "sampler");

    this.Pmatrix = GL.getUniformLocation(this.program, "Pmatrix");
    this.Vmatrix = GL.getUniformLocation(this.program, "Vmatrix");
    this.Mmatrix = GL.getUniformLocation(this.program, "Mmatrix");

    GL.enableVertexAttribArray(this.position);
    GL.enableVertexAttribArray(this.uv);

    GL.useProgram(this.program);
    GL.uniform1i(this.sampler, 0);  // this.sampler is the texture channel No. 0

    GL.clearColor(0.0, 0.0, 0.0, 0.0); // TODO do this only once

    GL.enable(GL.DEPTH_TEST);
    GL.depthFunc(GL.LEQUAL);

    GL.clearDepth(1.0);

    this._once = true
  }

  draw() {
    if(this._drawing)
      return
    this._drawing = true

    var GL = this.getContext()

    this.once(GL)

    if (!this.drag) {
      // keep on moving if mouse button is unholding
      this.dx *= AMORTIZATION
      this.dy *= AMORTIZATION
      this.theta += this.dx
      this.phi += this.dy
    }

    geo.set_I4(MOVEMATRIX);
    geo.rotateY(MOVEMATRIX, this.theta);
    geo.rotateX(MOVEMATRIX, this.phi);

    this._pre_draw(GL)
    this._draw(GL)
    this._post_draw(GL)

    var self = this

    window.requestAnimationFrame(function() {
      self.draw()
    })

    this._drawing = false;
  }

  _pre_draw(GL) {

    GL.viewport(0.0, 0.0, this.canvas.width, this.canvas.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    GL.uniformMatrix4fv(this.Pmatrix, false, this.pmatrix);
    GL.uniformMatrix4fv(this.Mmatrix, false, MOVEMATRIX);
    GL.uniformMatrix4fv(this.Vmatrix, false, VIEWMATRIX);
  }

  _draw(GL) {

    if (this.texture) {
      GL.activeTexture(GL.TEXTURE0);
      GL.bindTexture(GL.TEXTURE_2D, this.texture);
    }

    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

    GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4*(3+2),0) ;
    GL.vertexAttribPointer(this.uv, 2, GL.FLOAT, false, 4*(3+2), 3*4) ;

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

    // 6 faces * 2 triangles per face * 3 points per triangle
    GL.drawElements(GL.TRIANGLES, 6 * 2 * 3, GL.UNSIGNED_SHORT, 0);
  }

  _post_draw(GL) {

    GL.flush()
  }

  contains(x, y) {
    return true;
  }

  get eventMap() {
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
    }
  }

  ondragstart(e) {
    this.drag = true

    this.old_x = e.offsetX
    this.old_y = e.offsetY

    return false
  }

  ondragmove(e) {
    this.dx = (e.offsetX - this.old_x) * 2 * Math.PI / this.canvas.width
    this.dy = (e.offsetY - this.old_y) * 2 * Math.PI / this.canvas.height
    this.theta += this.dx
    this.phi += this.dy

    this.old_x = e.offsetX
    this.old_y = e.offsetY
  }

  ondragend(e) {
    this.drag = false
  }

  ontouchstart(e) {
    var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft,
      e.touches[0].pageY - e.touches[0].target.offsetTop)

    this.drag = true

    this.old_x = txy.x
    this.old_y = txy.y

    return false
  }

  ontouchmove(e) {
    var txy = this.transcoordC2S(e.touches[0].pageX - e.touches[0].target.offsetLeft,
      e.touches[0].pageY - e.touches[0].target.offsetTop)

    this.dx = (txy.x - this.old_x) * 2 * Math.PI / this.canvas.width
    this.dy = (txy.y - this.old_y) * 2 * Math.PI / this.canvas.height
    this.theta += this.dx
    this.phi += this.dy

    this.old_x = txy.x
    this.old_y = txy.y
  }

  ontouchend(e) {
    this.drag = false
  }

}

Component.register('cube-layer', CubeLayer)
