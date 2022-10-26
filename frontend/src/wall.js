import * as THREE from 'three'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as TWEEN from '@tweenjs/tween.js'
import { backendUrl } from './utils'

const BRICK_SIZE = {
  width: 48,
  height: 27
}
const Z_HEIGHT = 40

const initScene = async (imageData, certificationData) => {
  const getBrickCameraPositions = (i) => {
    const cameraOffset = 6
    const rowWidth = (imageData.width - (BRICK_SIZE.width / 2)) / BRICK_SIZE.width
    const row = (Math.floor(i / rowWidth))

    const c = {
      x: (i % rowWidth) * BRICK_SIZE.width + ((row % 2) * BRICK_SIZE.width / 2) + BRICK_SIZE.width / 2,
      y: -(row * BRICK_SIZE.height) - BRICK_SIZE.height / 2
    }
    const tl = { x: c.x - cameraOffset, y: c.y + cameraOffset }
    const tr = { x: c.x + cameraOffset, y: c.y + cameraOffset }
    const bl = { x: c.x - cameraOffset, y: c.y - cameraOffset }
    const br = { x: c.x + cameraOffset, y: c.y - cameraOffset }
    return { c, tl, tr, bl, br }
  }
  const rotateCamera = (i, certificationData, disableRotate) => {
    return new Promise(resolve => {
      const { c, tl, tr, bl, br } = getBrickCameraPositions(i)
      console.log('cameraTo: START', i, '->', tl, bl)

      camera.position.x = bl.x
      camera.position.y = bl.y
      camera.position.z = Z_HEIGHT
      const centreTarget = new THREE.Vector3(c.x, c.y, 0)
      camera.lookAt(centreTarget)

      if (disableRotate) {
        resolve()
      } else {
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
            resolve()
          }).onComplete(() => {
            console.log('moveCameraTo: END')
            resolve()
          })
        // .delay(1000)
          .start()
      }
    })
  }
  const moveCameraTo = (fromI, toI) => {
    console.log('moveCameraTo: START')
    return new Promise(resolve => {
      const targetC = getBrickCameraPositions(fromI).c
      const { c, bl } = getBrickCameraPositions(toI)
      console.log('camera', camera)
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

  const light = new THREE.DirectionalLight(0xFFFFFF, 20)
  light.position.set(0, 1, 0).normalize()

  // light.position.x = imageData.width / 2
  // light.position.y = imageData.height / 2
  // light.position.z = Z_HEIGHT
  scene.add(light)

  const am = new THREE.AmbientLight(0xffffff, 8)
  scene.add(am)

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

  // ------------------------------------------------
  // FUN STARTS HERE
  // ------------------------------------------------

  // const light = new THREE.AmbientLight(0xFFFFFF); // soft white light
  // scene.add(light);

  // scene.add(new THREE.AmbientLight(0x404040))
  // const pointLight = new THREE.PointLight(0xffffff, 0.5);
  // pointLight.position.x = 2;
  // pointLight.position.y = 3;
  // pointLight.position.z = 4;
  // scene.add(pointLight);

  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 20);
  // const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 6);
  // hemiLight.position.set(-1, -1, 1)
  // hemiLight.position.set(1, 0.5, 0)
  // hemiLight.position.set( 0, 0, 0 );
  // hemiLight.position.set(0, 0, 1)
  // scene.add(hemiLight);
  // scene.add(hemiLight);

  // Create a Cube Mesh with basic material
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

  // scene.add(box);
  // const group = new THREE.Group();
  // group.add( box );
  // group.add( cylinder );
  // scene.add( group );

  const legoGeometry = mergeBufferGeometries([box, cylinder].map(b => {
    b.updateMatrixWorld()
    return b.geometry.applyMatrix4(b.matrixWorld)
  }), true)

  console.log('THREE', THREE, mergeBufferGeometries, legoGeometry)

  const count = imageData.width * imageData.height
  console.log('count', count)
  const matrix = new THREE.Matrix4()
  const mesh = new THREE.InstancedMesh(legoGeometry, material, count)

  const rotation = new THREE.Euler()

  rotation.x = Math.PI / 2
  rotation.y = 0
  rotation.z = 0
  const quaternion = new THREE.Quaternion()
  quaternion.setFromEuler(rotation)
  for (let i = 0; i < count; i++) {
    const x = i % imageData.width
    const y = i / imageData.width
    const z = Math.random() * 0
    const colorIndex = i * 4
    const r = imageData.data[colorIndex]
    const g = imageData.data[colorIndex + 1]
    const b = imageData.data[colorIndex + 2]
    const color = new THREE.Color(`rgb(${r},${g},${b})`)
    color.convertSRGBToLinear()
    // console.log('color', i, 'index', colorIndex, colorIndex+1, colorIndex+2, 'rgb', r,g,b)
    // randomizeMatrix( i, matrix );
    const position = new THREE.Vector3()
    position.x = x
    position.y = -y
    position.z = z

    matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1))

    mesh.setMatrixAt(i, matrix)
    // color = new THREE.Color( 0xffffff );
    // color.setHex( Math.random() * 0xffffff );
    mesh.setColorAt(i, color)
  }
  scene.add(mesh)

  // scene.add(new THREE.AxesHelper(5))wdsaw
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

  const render = function () {
    window.requestAnimationFrame(render)
    TWEEN.default.update()
    renderer.render(scene, camera)
  }

  render()

  const rows = Math.floor(imageData.width / BRICK_SIZE.width)
  const cols = imageData.height / BRICK_SIZE.height
  const max = rows * cols
  console.log('max', rows, cols, rows * cols, certificationData.length)
  let current = Math.floor(Math.random() * max)
  let next = Math.floor(Math.random() * max)

  // await cameraTo(0)
  await rotateCamera(current, certificationData, true)

  while (true) {
    await moveCameraTo(current, next)
    await rotateCamera(next, certificationData)
    current = next
    next = Math.floor(Math.random() * max)
  }
}

const loadImageData = async () => {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.setAttribute('crossorigin', 'anonymous')
    img.onload = function () {
      console.log('onload', this, this.width, this.height)
      const canvas = document.createElement('canvas')
      canvas.setAttribute('width', this.width)
      canvas.setAttribute('height', this.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, this.width, this.height)
      console.log(imageData)
      // document.body.appendChild(canvas)
      console.log('canvas', canvas)
      resolve(imageData)
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
  const imageData = await loadImageData()
  const certificationData = await loadCertificationData()
  console.log('imageData', imageData)
  console.log('certificationData', certificationData)
  initScene(imageData, certificationData)
}
