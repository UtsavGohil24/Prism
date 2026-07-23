import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AnimatedBackground() {
  const shaderCanvasRef = useRef(null)
  const threeMountRef = useRef(null)

  // Layer 1: WebGL shader background
  useEffect(() => {
    const canvas = shaderCanvasRef.current
    function syncSize() {
      const w = canvas.clientWidth || window.innerWidth
      const h = canvas.clientHeight || window.innerHeight
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }
    const resizeObserver = new ResizeObserver(syncSize)
    resizeObserver.observe(canvas)
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const vs = `attribute vec2 a_position;
    varying vec2 v_texCoord;
    void main() {
      v_texCoord = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }`
    const fs = `precision highp float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    varying vec2 v_texCoord;
    void main() {
        vec2 uv = v_texCoord;
        vec2 mouse = u_mouse / u_resolution;
        float t = u_time * 0.2;
        vec2 shift = vec2(
            sin(uv.y * 10.0 + t) * 0.05,
            cos(uv.x * 10.0 + t) * 0.05
        );
        uv += shift;
        vec3 color1 = vec3(0.020, 0.078, 0.141);
        vec3 color2 = vec3(0.071, 0.129, 0.192);
        vec3 accent = vec3(0.388, 0.4, 0.945);
        float dist = distance(uv, mouse);
        float glow = smoothstep(0.5, 0.0, dist) * 0.2;
        float noise = sin(uv.x * 2.0 + uv.y * 3.0 + t) * 0.5 + 0.5;
        vec3 finalColor = mix(color1, color2, uv.y + noise * 0.1);
        finalColor += accent * glow;
        gl_FragColor = vec4(finalColor, 1.0);
    }`

    function compileShader(type, src) {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const posLoc = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(posLoc)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')
    const uMouse = gl.getUniformLocation(prog, 'u_mouse')

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 }
    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      if (rect.width && rect.height) {
        mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width
        mouse.y = (1 - (e.clientY - rect.top) / rect.height) * canvas.height
      }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let rafId
    function render(t) {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(uTime, t * 0.001)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      rafId = requestAnimationFrame(render)
    }
    render(0)

    return () => {
      cancelAnimationFrame(rafId)
      resizeObserver.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Layer 2: Three.js floating wireframe group
  useEffect(() => {
    const mount = threeMountRef.current
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)

    const group = new THREE.Group()
    const geometry = new THREE.IcosahedronGeometry(1, 1)
    const material = new THREE.MeshPhongMaterial({
      color: 0x8083ff,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      shininess: 100,
    })
    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.setScalar(1.5 + i * 0.8)
      mesh.rotation.x = Math.random() * Math.PI
      mesh.rotation.y = Math.random() * Math.PI
      group.add(mesh)
    }
    scene.add(group)

    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const pointLight = new THREE.PointLight(0xc0c1ff, 1)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)

    let rafId
    function animate() {
      rafId = requestAnimationFrame(animate)
      group.rotation.y += 0.0015
      group.rotation.x += 0.0008
      group.position.y = Math.sin(Date.now() * 0.0008) * 0.3
      group.position.x = Math.cos(Date.now() * 0.0005) * 0.15
      renderer.render(scene, camera)
    }
    animate()

    function handleResize() {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <>
      <canvas
        ref={shaderCanvasRef}
        className="fixed inset-0 w-full h-full -z-20 pointer-events-none"
      />
      <div
        ref={threeMountRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      />
    </>
  )
}
