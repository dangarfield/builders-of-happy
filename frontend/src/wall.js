import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
// import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import * as TWEEN from '@tweenjs/tween.js'
import { backendUrl } from './utils'

const Z_HEIGHT = 40

const initScene = async (certificationData) => {
  const getBrickCameraPositions = (i, certificationData) => {
    const certification = certificationData.certifications[i]
    const cameraOffset = 6
    // const rowWidth = (imageData.width - (BRICK_SIZE.width / 2)) / BRICK_SIZE.width
    // const row = Math.floor(i / rowWidth)

    console.log('getBrickCameraPositions', i, certification)
    const c = {
      x: certification.x + Math.floor(certificationData.width / 2),
      y: certification.y - Math.floor(certificationData.height / 2)
    }
    const tl = { x: c.x - cameraOffset, y: c.y + cameraOffset }
    const tr = { x: c.x + cameraOffset, y: c.y + cameraOffset }
    const bl = { x: c.x - cameraOffset, y: c.y - cameraOffset }
    const br = { x: c.x + cameraOffset, y: c.y - cameraOffset }
    return { c, tl, tr, bl, br }
  }
  const rotateCamera = (i, certificationData, disableRotate) => {
    return new Promise(resolve => {
      console.log('rotateCamera', i, certificationData)
      const { c, tl, tr, bl, br } = getBrickCameraPositions(i, certificationData)
      console.log('cameraTo: START', i, '->', tl, bl)

      camera.position.x = bl.x
      camera.position.y = bl.y
      camera.position.z = Z_HEIGHT
      const centreTarget = new THREE.Vector3(c.x, c.y, 0)
      camera.lookAt(centreTarget)

      const cert = certificationData.certifications[i]
      // console.log('cert', cert)
      document.querySelector('.wall .label .certification-name').textContent = cert.name
      document.querySelector('.wall .label .certification-provider').textContent = cert.provider
      document.querySelector('.wall .label .certification-category').textContent = cert.category

      if (disableRotate) {
        resolve()
      } else {
        document.querySelector('.wall .label').style.opacity = 1
        new TWEEN.Tween(camera.position).to({
          x: [tl.x, tr.x, br.x, bl.x],
          y: [tl.y, tr.y, br.y, bl.y]
        }, 4000)
          .onUpdate(function (object) {
            camera.lookAt(centreTarget)
            // console.log('light', light.position)
            // light.position.copy(camera.position)
            // light.lookAt(centreTarget)
          })
        // .easing(TWEEN.Easing.Sinusoidal.InOut)r
        // .repeat(1)
          .interpolation(TWEEN.Interpolation.CatmullRom)
          .onStop(() => {
            console.log('cameraTo: END')
            document.querySelector('.wall .label').style.opacity = 0
            resolve()
          }).onComplete(() => {
            console.log('moveCameraTo: END')
            document.querySelector('.wall .label').style.opacity = 0
            resolve()
          })
        // .delay(1000)
          .start()
      }
    })
  }
  const moveCameraTo = (fromI, toI, certificationData) => {
    console.log('moveCameraTo: START')
    return new Promise(resolve => {
      const targetC = getBrickCameraPositions(fromI, certificationData).c
      const { c, bl } = getBrickCameraPositions(toI, certificationData)
      // console.log('camera', camera)
      const tweenTarget = {
        x: camera.position.x,
        y: camera.position.y,
        targetX: targetC.x,
        targetY: targetC.y,
        z: Z_HEIGHT
      }
      new TWEEN.Tween(tweenTarget).to({
        x: bl.x,
        y: bl.y,
        targetX: c.x,
        targetY: c.y,
        z: [Z_HEIGHT * 2, Z_HEIGHT]
      }, 2000)
        .onUpdate(function (object) {
          camera.position.x = tweenTarget.x
          camera.position.y = tweenTarget.y
          camera.position.z = tweenTarget.z
          camera.lookAt(new THREE.Vector3(tweenTarget.targetX, tweenTarget.targetY, 0))
          // console.log('light', light.position)
        //   light.position.copy(camera.position)
          // light.lookAt(centreTarget)
        })
        .easing(TWEEN.Easing.Quartic.InOut)
        .onStop(() => {
          console.log('moveCameraTo: END')
          resolve()
        }).onComplete(() => {
          console.log('moveCameraTo: END')
          resolve()
        })
        .start()
    })
  }

  console.log('initScene')
  // ------------------------------------------------
  // BASIC SETUP
  // ------------------------------------------------

  // Create an empty scene
  const scene = new THREE.Scene()

  // Create a basic perspective camera
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(300, -300, 500)
  window.camera = camera

  const light = new THREE.DirectionalLight(0xFFFFFF, 20)
  light.position.set(0.5, 1, 1).normalize()
  scene.add(light)

  // const am = new THREE.AmbientLight(0xffffff, 12)
  // scene.add(am)

  // Create a renderer with Antialiasing
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })

  // Configure renderer clear color
  renderer.setClearColor('rgb(100,100,100)')

  // Configure renderer size
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.gammaFactor = 2.2
  renderer.outputEncoding = THREE.sRGBEncoding

  // Append Renderer to DOM
  document.querySelector('.view.wall .canvas-container').appendChild(renderer.domElement)

  const stats = Stats()
  document.body.appendChild(stats.dom)

  const material = new THREE.MeshLambertMaterial({
    color: '#433F81',
    shininess: 100
  })
  material.color.convertSRGBToLinear()

  const boxGeometry = new THREE.BoxGeometry(1, 2, 1)
  const box = new THREE.Mesh(boxGeometry, material)
  const cylinderGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 15)
  const cylinder = new THREE.Mesh(cylinderGeometry, material)
  cylinder.position.set(0, 1, 0)

  const legoGeometry = mergeBufferGeometries([box, cylinder].map(b => {
    b.updateMatrixWorld()
    return b.geometry.applyMatrix4(b.matrixWorld)
  }), true)

  const matrix = new THREE.Matrix4()
  const rotation = new THREE.Euler()
  rotation.x = Math.PI / 2
  rotation.y = 0
  rotation.z = 0
  const quaternion = new THREE.Quaternion()
  quaternion.setFromEuler(rotation)

  const border = 40
  const borderPositionsLeft = []
  const baseL = -border
  const maxL = certificationData.width

  const baseBottom = -certificationData.height * certificationData.cols
  for (let x = baseL; x < maxL / 2; x++) {
    for (let y = 0; y > baseBottom; y--) {
      const r = Math.floor((y - 1) / certificationData.height) % 2 === 0
      if (x >= 0 && !r) continue
      // console.log('x y', x, y, 'r', r)
      borderPositionsLeft.push({ x, y })
    }
  }
  const borderPositionsRight = []
  const baseR = certificationData.width * certificationData.rows
  const maxR = baseR + (certificationData.width / 2) + border
  for (let x = baseR; x < maxR; x++) {
    for (let y = 0; y > baseBottom; y--) {
      const r = Math.floor((y - 1) / certificationData.height) % 2 === 0
      if (x < baseR + (certificationData.width / 2) && r) continue
      // console.log('x y', x, y, 'r', r)
      borderPositionsRight.push({ x, y })
    }
  }
  const borderPositionTop = []
  for (let x = baseL; x < maxR; x++) {
    for (let y = 1; y < border; y++) {
      borderPositionTop.push({ x, y })
    }
  }
  const maxBottom = baseBottom - border
  console.log('b', baseBottom, maxBottom)
  const borderPositionBottom = []
  for (let x = baseL; x < maxR; x++) {
    for (let y = baseBottom; y > maxBottom; y--) {
      borderPositionTop.push({ x, y })
    }
  }

  const borderPositionsAll = [borderPositionsLeft, borderPositionsRight, borderPositionTop, borderPositionBottom]
  // const borderPositionsAll = []
  for (const borderPositions of borderPositionsAll) {
    const borderMesh = new THREE.InstancedMesh(legoGeometry, material, borderPositions.length)
    const borderColor = new THREE.Color('rgb(100,100,100)')
    borderColor.convertSRGBToLinear()
    for (const [i, borderPosition] of borderPositions.entries()) {
      const position = new THREE.Vector3()
      position.x = borderPosition.x
      position.y = borderPosition.y
      position.z = 0
      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1))
      borderMesh.setMatrixAt(i, matrix)
      borderMesh.setColorAt(i, borderColor)
    }
    scene.add(borderMesh)
  }
  console.log('total instances', certificationData.certifications[0].imageData.width * certificationData.certifications[0].imageData.height * certificationData.certifications.length)
  // const count = certificationData.certifications[0].imageData.width * certificationData.certifications[0].imageData.height * certificationData.certifications.length
  // const mesh = new THREE.InstancedMesh(legoGeometry, material, count)
  // let i = 0
  for (const certification of certificationData.certifications) {
    const count = certification.imageData.width * certification.imageData.height
    const mesh = new THREE.InstancedMesh(legoGeometry, material, count)
    // console.log(i, certification, count)

    for (let j = 0; j < certification.imageData.width * certification.imageData.height; j++) {
      const x = Math.floor(j % certification.imageData.width)
      const y = Math.floor(j / certification.imageData.width)
      const z = Math.random() * 0
      const colorIndex = j * 4
      const r = certification.imageData.data[colorIndex]
      const g = certification.imageData.data[colorIndex + 1]
      const b = certification.imageData.data[colorIndex + 2]
      const color = new THREE.Color(`rgb(${r},${g},${b})`)
      color.convertSRGBToLinear()
      // console.log('color', i, 'index', colorIndex, colorIndex+1, colorIndex+2, 'rgb', r,g,b)
      // randomizeMatrix( i, matrix );
      const position = new THREE.Vector3()
      position.x = x
      position.y = -y
      position.z = z

      matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1))
      mesh.setMatrixAt(j, matrix)
      mesh.setColorAt(j, color)
      // i++
    }
    mesh.position.set(certification.x, certification.y, 0)
    scene.add(mesh)
  }
  // scene.add(mesh)
  // scene.add(borderMesh)
  scene.add(new THREE.AxesHelper(5))
  // Add cube to Scene

  // const imgTexture = new THREE.TextureLoader().load('lego-tile-bg.jpg')
  // imgTexture.wrapS = THREE.RepeatWrapping;
  // imgTexture.wrapT = THREE.RepeatWrapping;
  // imgTexture.repeat.set( 1680/100, 1394/100 );

  // var img = new THREE.MeshBasicMaterial({ //CHANGED to MeshBasicMaterial
  //     map: imgTexture
  // });
  // img.map.needsUpdate = true; //ADDED

  // var plane = new THREE.Mesh(new THREE.PlaneGeometry(imageData.width*2, imageData.height*2),img)
  // plane.position.x = imageData.width/2
  // plane.position.y = imageData.height/2
  // plane.position.z = -40
  // plane.overdraw = true;
  // scene.add(plane);
  // const clock = new THREE.Clock()

  const render = function () {
    window.requestAnimationFrame(render)
    // const delta = clock.getDelta()
    TWEEN.default.update()
    // controls.update(delta)
    renderer.render(scene, camera)
    stats.update()
  }
  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onWindowResize, false)

  render()

  // await rotateCamera(17, certificationData, false)

  const max = certificationData.certifications.length
  console.log('max', max)
  let current = Math.floor(Math.random() * max)
  let next = Math.floor(Math.random() * max)
  await rotateCamera(current, certificationData, true)
  while (true) {
    await moveCameraTo(current, next, certificationData)
    await rotateCamera(next, certificationData)
    current = next
    next = Math.floor(Math.random() * max)
  }
}
const calculateRowsForSquare = (count, tileWidth, tileHeight) => {
  let prev = {}
  for (let cols = 0; cols <= count; cols++) {
    const rows = Math.ceil(count / cols)
    const extra = (rows * cols) - count
    const h = cols * tileHeight
    const w = (rows * tileWidth) + (Math.floor(tileWidth / 2))
    const asp = h / w
    // console.log('rows', rows, 'cols', cols, 'extra', extra, 'h', h, 'w', w, 'asp', asp)
    if (asp > 1) {
      // console.log('prev', Math.abs(prev.asp - 1), prev.extra, 'this', Math.abs(asp - 1), extra)
      if (Math.abs(prev.asp - 1) < Math.abs(asp - 1)) {
      // if (prev.extra < extra) {
        // console.log('prev closer')
        return { cols: prev.cols, rows: prev.rows }
      } else {
        // console.log('this closer')
        return { cols, rows }
      }
    }
    prev = { cols, rows, asp, extra }
  }
  return { cols: 0, rows: 0 }
}
const addImageData = async (certificationData) => {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.setAttribute('crossorigin', 'anonymous')
    img.onload = function () {
      const count = certificationData.certifications.length
      const width = this.width
      const height = Math.floor(this.height / count)
      console.log('onload', this, this.width, this.height, count, '->', width, height)
      const canvas = document.createElement('canvas')
      canvas.setAttribute('width', this.width)
      canvas.setAttribute('height', this.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const { rows, cols } = calculateRowsForSquare(count, width, height)
      certificationData.rows = rows
      certificationData.cols = cols
      certificationData.width = width
      certificationData.height = height
      certificationData.count = count

      for (const [i, certification] of certificationData.certifications.entries()) {
        // console.log(i, certification)
        certification.imageData = ctx.getImageData(0, i * height, width, height)
        certification.row = Math.floor(i % rows)
        certification.col = Math.floor(i / rows)
        certification.x = certification.row * width + ((certification.col % 2) * Math.floor(width / 2))
        certification.y = -certification.col * height
      }
      resolve()
    }
    img.src = `${backendUrl}/certification-bricks/all-bricks.png`
  })
}
const loadCertificationData = async () => {
  const req = await window.fetch(`${backendUrl}/certification-bricks/certification-data.json`)
  const res = await req.json()
  return res
}
export const initWall = async () => {
  console.log('initWall')
  const certificationData = await loadCertificationData()
  await addImageData(certificationData)
  // console.log('imageData', imageData)
  console.log('certificationData', certificationData)
  initScene(certificationData)
}
