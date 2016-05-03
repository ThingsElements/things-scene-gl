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
var VIEWMATRIX=geo.get_I4();
geo.translateZ(VIEWMATRIX, -5);

export default class GlLayer extends Layer {

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
    var triangle = [
      -1,-1,0,  // first summit -> bottom left of the viewport
      0,0,1,    // first summit color -> blue
      1,-1,0,   // bottom right of the viewport
      1,1,0,    // second -> yellow
      1,1,0,    // top right of the viewport
      1,0,0     // third -> red
    ]

    var GL = this.getContext()

    var vertex = GL.createBuffer()

    GL.bindBuffer(GL.ARRAY_BUFFER, vertex)
    GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(triangle), GL.STATIC_DRAW)

    return vertex
  }

  get faces() {
    var triangle = [0, 1, 2]

    var GL = this.getContext()

    var faces = GL.createBuffer()

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, faces)
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle), GL.STATIC_DRAW)

    return faces
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

    this.vertexShader = `
attribute vec3 position;
uniform mat4 Pmatrix; // Pmatrix is a uniform variable : its value is constant while rednering an object
uniform mat4 Mmatrix; // Mmatrix is the movement matrix of the triangle
uniform mat4 Vmatrix; // Vmatrix is the movement matrix from object ref to view ref
attribute vec3 color;

varying vec3 vColor;

void main(void) {
  gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);
  vColor = color;
}
    `

    this.fragmentShader = `
precision mediump float;

varying vec3 vColor;

void main(void) {
  gl_FragColor = vec4(vColor, 1.);
}
    `

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

    this._once = true
  }

  draw() {
    if(this._drawing)
      return
    this._drawing = true

    var GL = this.getContext()


    this.once(GL)

    if(!this.time_old)
      this.time_old = 0

    var now = Date.now()
    var dt = now - this.time_old;

    geo.rotateZ(MOVEMATRIX, dt*0.005);
    geo.rotateY(MOVEMATRIX, dt*0.004);
    geo.rotateX(MOVEMATRIX, dt*0.003);

    var dAngle = 0.005 * dt;
    geo.rotateY(MOVEMATRIX, dAngle);
    this.time_old = now;

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
    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertex);

    GL.vertexAttribPointer(this.position, 3, GL.FLOAT, false, 4 * (3 + 3), 0 /* offset */);
    GL.vertexAttribPointer(this.color, 3, GL.FLOAT, false, 4 * (3 + 3), 3 * 4 /* offset */);

    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.faces);

    GL.drawElements(GL.TRIANGLES, 3, GL.UNSIGNED_SHORT, 0);
  }

  _post_draw(GL) {

    GL.flush()
  }

  contains(x, y) {
    return true;
  }

}

Component.register('gl-layer', GlLayer)
