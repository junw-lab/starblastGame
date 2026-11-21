import * as THREE from 'three';
import { depth } from 'three/tsl';

let forwardSpeed = 0
let maximumSpeed = 6
let forwardHeld = false
let turnLeft = false;
let turnRight = false;
let turnSpeed = 1

const mapHeight = 50;
const mapWidth = 50;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const timer = new THREE.Timer();
timer.connect(document)


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 3, 1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube)



camera.position.z = 15;

function animate(time){
    timer.update(time);
    const delta = timer.getDelta()

    if (forwardHeld == true){
        if (forwardSpeed < maximumSpeed){
            forwardSpeed = Math.min(maximumSpeed, forwardSpeed + 0.1)
        }
        
    } else {
        if (forwardSpeed > 0){
            forwardSpeed = Math.max(0, forwardSpeed - 0.1)
        }
    }

    if (turnLeft == true && turnRight != true ){
        cube.rotateZ(turnSpeed* delta)
    }
    

    if (turnRight == true && turnLeft != true){
        cube.rotateZ(-(turnSpeed * delta))
    }
    cube.translateY(delta * forwardSpeed)
    cube.position.x = THREE.MathUtils.clamp(cube.position.x, -(mapWidth / 2), mapWidth / 2)
    cube.position.y = THREE.MathUtils.clamp(cube.position.y, -(mapHeight / 2), (mapHeight / 2))

    camera.position.x = cube.position.x;
    camera.position.y = cube.position.y;
    renderer.render(scene, camera)
    /* console.log(`X position: ${cube.position.x} \n Y position: ${cube.position.y}`) */
    for (const star of stars){
        star.material.opacity = 0.7 + Math.sin(time / 500 + star['pulseOffset']) * 0.3;
    }
};

renderer.setAnimationLoop(animate)


window.addEventListener("keydown", (event) => {
    if (event.key == 'w'){
        forwardHeld = true
    }
    if (event.key == 'a'){
        turnLeft = true
    }
    if (event.key == 'd'){
        turnRight = true
    }
})

window.addEventListener("keyup", (event) => {
    if (event.key == 'w'){
        forwardHeld = false
    }

    if (event.key == 'a'){
        turnLeft = false
    }

    if (event.key == 'd'){
        turnRight = false
    }
})

const stars = []

function createStar(x, y){
    const starCanvas = document.createElement('canvas')
    starCanvas.width = 64;
    starCanvas.height = 64;

    const ctx = starCanvas.getContext('2d')
    ctx.beginPath()
    const gradient = ctx.createRadialGradient(
        starCanvas.width / 2, starCanvas.height / 2, 0,
        starCanvas.width / 2, starCanvas.height / 2, 20
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.beginPath();
    ctx.arc(starCanvas.width/2, starCanvas.height/2, 20, 0, Math.PI*2);
    ctx.fillStyle = gradient
    ctx.fill();

    const starTexture = new THREE.CanvasTexture(starCanvas);
    const starMaterial = new THREE.SpriteMaterial({ map: starTexture });
    const star = new THREE.Sprite(starMaterial);
    const depth = -2 - Math.random() * 8
    star.position.set(x, y, depth);
    scene.add(star);
    return star
};

function createBorderLine(){
    const material = new THREE.LineBasicMaterial({
        'color': 0x0000ff,
    })
    const points = [];
    points.push(new THREE.Vector3(mapWidth/2, mapHeight/2, 0));
    points.push(new THREE.Vector3(-(mapWidth/2), mapHeight/2, 0));
    points.push(new THREE.Vector3(-(mapWidth/2), -(mapHeight/2), 0));
    points.push(new THREE.Vector3(mapWidth/2, -(mapHeight/2), 0));
    

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.LineLoop(geometry, material)
    scene.add(line)
}

function drawLine(firstPointX, firstPointY, secondPointX, secondPointY){
    const material = new THREE.LineBasicMaterial({ color: 0x0000ff});
    const points = [];
    points.push(new THREE.Vector3(firstPointX,  firstPointY, 0));
    points.push(new THREE.Vector3(secondPointX,  secondPointY, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material);
    scene.add(line)
}


const numberOfColumns = 20;
const numberOfRows = 20;

const cell_width = mapWidth / numberOfColumns
const cell_height = mapHeight / numberOfColumns

for (let column = 0; column < numberOfColumns; column ++){
    for (let row = 0; row < numberOfRows; row ++){
        const cellLeft = -(mapWidth/2) + (cell_width * column) 
        const cellBottom = -(mapHeight/2) + (cell_height * row)
        const cellRight = cellLeft + cell_width
        const cellTop = cellBottom + cell_height
        
        const x = cellLeft + Math.random() * cell_width
        const y = cellBottom + Math.random() * cell_height

        const star = createStar(x, y)
        star['pulseOffset'] = Math.random() * Math.PI * 2;
        stars.push(star)


        /* draw top */
        drawLine(cellLeft, cellTop, cellRight, cellTop)
        /* draw bottom */
        drawLine(cellLeft, cellBottom, cellRight, cellBottom)
        /* draw left */
        drawLine(cellLeft, cellTop, cellLeft, cellBottom)
        /* draw right */
        drawLine(cellRight, cellTop, cellRight, cellBottom)

    }
}


createBorderLine()