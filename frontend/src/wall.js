import * as THREE from 'three'
import {
    mergeBufferGeometries
} from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import * as TWEEN from '@tweenjs/tween.js'

const BRICK_SIZE = {
    width: 48,
    height: 27
}
let Z_HEIGHT = 900
const initScene = (imageData) => {


    const cameraTo = (i, rotate) => {
        return new Promise(resolve => {
            const cameraOffset = 6
            const rowWidth = (imageData.width - (BRICK_SIZE.width / 2)) / BRICK_SIZE.width
            const row = (Math.floor(i / rowWidth))
            const c = {
                x: (i % rowWidth) * BRICK_SIZE.width + ((row % 2) * BRICK_SIZE.width / 2) + BRICK_SIZE.width / 2,
                y: -(row * BRICK_SIZE.height) - BRICK_SIZE.height / 2
            }

            const tl = {
                x: c.x - cameraOffset,
                y: c.y + cameraOffset,
            }
            const tr = {
                x: c.x + cameraOffset,
                y: c.y + cameraOffset,
            }
            const bl = {
                x: c.x - cameraOffset,
                y: c.y - cameraOffset,
            }
            const br = {
                x: c.x + cameraOffset,
                y: c.y - cameraOffset,
            }
            console.log('cameraTo', i, '->', tl, bl, 'rowWidth', rowWidth, row)

            camera.position.x = bl.x
            camera.position.y = bl.y
            camera.position.z = Z_HEIGHT
            const centreTarget = new THREE.Vector3(c.x, c.y, 0)
            camera.lookAt(centreTarget)

            if (rotate) {
                const tween = new TWEEN.Tween(camera.position).to({
                        x: [tl.x, tr.x, br.x, bl.x],
                        y: [tl.y, tr.y, br.y, bl.y]
                    }, 4000)
                    .onUpdate(function(object) {
                        camera.lookAt(centreTarget)
                    })
                    // .easing(TWEEN.Easing.Sinusoidal.InOut)r
                    .repeat(2)
                    .interpolation(TWEEN.Interpolation.CatmullRom)
                    .onStop(() => {
                        resolve()
                    })
                    .start()
            } else {
                resolve()
            }
        })

    }

    console.log('initScene')
    // ------------------------------------------------
    // BASIC SETUP
    // ------------------------------------------------

    // Create an empty scene
    var scene = new THREE.Scene();

    // Create a basic perspective camera
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraTo(138)


    // Create a renderer with Antialiasing
    var renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    // Configure renderer clear color
    renderer.setClearColor("#ffffff");

    // Configure renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Append Renderer to DOM
    document.querySelector('.view.wall').appendChild(renderer.domElement);

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

    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 3);
    hemiLight.position.set(0, 1, 0)
    scene.add(hemiLight);
    // scene.add(hemiLight);

    // Create a Cube Mesh with basic material
    const material = new THREE.MeshLambertMaterial({
        color: "#433F81",
        shininess: 30
    });

    const boxGeometry = new THREE.BoxGeometry(1, 2, 1)
    const box = new THREE.Mesh(boxGeometry, material)
    const cylinderGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 15)
    const cylinder = new THREE.Mesh(cylinderGeometry, material)
    cylinder.position.set(0, 1, 0)

    scene.add(box);
    // const group = new THREE.Group();
    // group.add( box );
    // group.add( cylinder );
    // scene.add( group );

    const legoGeometry = mergeBufferGeometries([box, cylinder].map(b => {
        b.updateMatrixWorld()
        return b.geometry.applyMatrix4(b.matrixWorld);
    }), true);


    console.log('THREE', THREE, mergeBufferGeometries, legoGeometry)

    const count = imageData.width * imageData.height
    console.log('count', count)
    const matrix = new THREE.Matrix4();
    const mesh = new THREE.InstancedMesh(legoGeometry, material, count);

    const rotation = new THREE.Euler();

    rotation.x = Math.PI / 2
    rotation.y = 0
    rotation.z = 0
    const quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(rotation);
    for (let i = 0; i < count; i++) {

        const x = i % imageData.width
        const y = i / imageData.width
        const z = Math.random() * 0
        const colorIndex = i * 4
        const r = imageData.data[colorIndex]
        const g = imageData.data[colorIndex + 1]
        const b = imageData.data[colorIndex + 2]
        const color = new THREE.Color(`rgb(${r},${g},${b})`)
        // console.log('color', i, 'index', colorIndex, colorIndex+1, colorIndex+2, 'rgb', r,g,b)
        // randomizeMatrix( i, matrix );
        const position = new THREE.Vector3();
        position.x = x
        position.y = -y
        position.z = z



        matrix.compose(position, quaternion, new THREE.Vector3(1, 1, 1))

        mesh.setMatrixAt(i, matrix);
        // color = new THREE.Color( 0xffffff );
        // color.setHex( Math.random() * 0xffffff );
        mesh.setColorAt(i, color);

    }
    scene.add(mesh)


    scene.add(new THREE.AxesHelper(5))
    // Add cube to Scene

    // Render Loop
    var render = function() {
        requestAnimationFrame(render)
        TWEEN.default.update()
        // group.rotation.x += 0.01;
        // group.rotation.y += 0.01;
        // cylinder.rotation.x += 0.01;
        // cylinder.rotation.y += 0.01;

        // Render the scene
        renderer.render(scene, camera);
    };

    render();
}
const loadData = async () => {
    return new Promise((resolve) => {
        const img = new Image()
        img.setAttribute('crossorigin', 'anonymous')
        img.onload = function() {
            console.log('onload', this, this.width, this.height)
            const canvas = document.createElement('canvas');
            canvas.setAttribute('width', this.width)
            canvas.setAttribute('height', this.height)
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0)
            const imageData = ctx.getImageData(0, 0, this.width, this.height)
            console.log(imageData)
            // document.body.appendChild(canvas)
            console.log('canvas', canvas)
            resolve(imageData)

        }
        img.src = `http://localhost:3001/certification-bricks/all-bricks.png`

    })

    return {}
}

export const initWall = async () => {

    // window.onload = async function () {
    console.log('initWall')
    const imageData = await loadData()
    console.log('imageData', imageData)
    initScene(imageData)
    // }

}