import * as THREE from 'three';
import { depth } from 'three/tsl';
import * as planck from 'planck';
const world = new planck.World({gravity: {x:0, y:0}});
/* scene and ship creation */
let forwardSpeed = 0
let maximumSpeed = 6
let forwardHeld = false
let turnLeft = false;
let turnRight = false;
let turnSpeed = 3
let targetTilt = 0;
let recoverAngularVelocity = 0.5;
const mapHeight = 50;
const mapWidth = 50;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let hitWall = false

const timer = new THREE.Timer();
timer.connect(document)


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.BoxGeometry(1, 3, 1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
const group = new THREE.Group();
group.add(cube)
scene.add(group)
camera.position.z = 15;

/* planck js */
let shipBody = world.createBody({
    type: "dynamic",
    position: {x: cube.position.x, y: cube.position.y},
    userData: 'ship',

})

shipBody.createFixture({
    shape: new planck.Box(cube['geometry']['parameters']['width']/2, cube['geometry']['parameters']['height']/2 ),
    density: 1.0,
    friction: 0.3,
})

const localForce = {x: 0, y: 20};

world.on('begin-contact', function(contact){
    const contactAName = (contact.getFixtureA().getBody().getUserData())
    const contactBName = (contact.getFixtureB().getBody().getUserData())
    if (contactAName == 'ship' && contactBName == 'wall' || contactBName == 'ship' && contactAName == 'wall'){
        hitWall = true
        console.log("hit wall")
        setTimeout(() => {hitWall = false}, 500)
    }})

/* animation loop */
function animate(time){
    timer.update(time);
    
    const worldVelocity = shipBody.getLinearVelocity();
    const localVelocity = shipBody.getLocalVector(worldVelocity)
    const sidewaysForce = {
        x: -localVelocity.x * 10,
        y: 0
    }
    const worldSidewaysForce = shipBody.getWorldVector(sidewaysForce)
    shipBody.applyForce(worldSidewaysForce, shipBody.getWorldCenter())  
    //console.log(`Local Velocity: ${localVelocity}`)
    const delta = timer.getDelta()
    if (forwardHeld == true){
        const worldForce = shipBody.getWorldVector(localForce)
        shipBody.applyForce(worldForce, shipBody.getWorldCenter())

    } else{
        
        cube.rotation.y = THREE.MathUtils.damp((cube.rotation.y),0, 2, delta )

    }

    if (turnLeft == true && turnRight != true ){
        shipBody.setAngularVelocity(turnSpeed)

        /* spaceship tilting on the y axis when turning left or right */
        cube.rotation.y = (THREE.MathUtils.damp(cube.rotation.y, -(THREE.MathUtils.degToRad(30)), 1, delta))

    }

    group.rotation.z = shipBody.getAngle();

    if (turnRight == true && turnLeft != true ){
        shipBody.setAngularVelocity(-(turnSpeed))

        /* spaceship tilting on the y axis when turning left or right */
        cube.rotation.y = (THREE.MathUtils.damp(cube.rotation.y, (THREE.MathUtils.degToRad(30)), 1, delta))

    }
    if (turnRight == false && turnLeft == false){
        if (shipBody.getAngularVelocity() > 0){
            shipBody.setAngularVelocity(Math.max(0, shipBody.getAngularVelocity() - recoverAngularVelocity))
        } 
        if (shipBody.getAngularVelocity() < 0){
            shipBody.setAngularVelocity(Math.min(0, shipBody.getAngularVelocity() + recoverAngularVelocity))
        }

        }
    const shipPosition = shipBody.getPosition()
    group.position.x = shipPosition['x']
    group.position.y = shipPosition['y']

    const limitShipPositionX = THREE.MathUtils.clamp(shipPosition.x, -mapWidth /2 , mapWidth / 2)
    const limitShipPositionY = THREE.MathUtils.clamp(shipPosition.y, -mapWidth /2 , mapWidth / 2)

    group.position.set(limitShipPositionX, limitShipPositionY, 0)
    shipBody.setPosition({x: limitShipPositionX, y: limitShipPositionY})

    
    // console.log(`Ship Body position: ${shipBody.getPosition()}`)
    // console.log(`Group Body position: ${group.position.x} ${group.position.y}`)

    // group.position.x = THREE.MathUtils.clamp(group.position.x, -(mapWidth / 2), mapWidth / 2)
    // group.position.y = THREE.MathUtils.clamp(group.position.y, -(mapHeight / 2), (mapHeight / 2))
    

    world.step(delta);
    camera.position.x = group.position.x;
    camera.position.y = group.position.y;
    renderer.render(scene, camera)
    /* console.log(`X position: ${cube.position.x} \n Y position: ${cube.position.y}`) */
    for (const star of stars){
        star.material.opacity = 0.7 + Math.sin(time / 500 + star['pulseOffset']) * 0.3;
    }
};

renderer.setAnimationLoop(animate)


/* input */ 
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

/* background */
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
        'color': 0xFFFFFF,
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

function drawLine(firstPointX, firstPointY, secondPointX, secondPointY, color= 0x000ff, z=0){
    const material = new THREE.LineBasicMaterial({ color: color});
    const points = [];
    points.push(new THREE.Vector3(firstPointX,  firstPointY, z));
    points.push(new THREE.Vector3(secondPointX,  secondPointY, z));
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
        if (row != 0 || row != numberOfRows - 1 || column != 0 || column != numberOfColumns - 1 ){

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
}

function createBorderChain(){
    let chain = new planck.Chain();
    let vs = [

        new planck.Vec2(mapWidth/2, mapHeight/2),
        new planck.Vec2(-mapWidth/2, mapHeight/2),
        new planck.Vec2(-mapWidth/2, -mapHeight/2),
        new planck.Vec2(mapWidth/2, -mapHeight/2)

    ]
    chain = new planck.Chain(vs, true)
    let wallBody = world.createBody({
        userData: 'wall'
    }
    )
    let wallFixture = wallBody.createFixture({
        type: "static",
        shape: chain,
        density: 0,
        restitution: 0.7,
    })


}

createBorderChain()
// drawLine(-(mapWidth/2), mapHeight /2, mapWidth/2, mapHeight/ 2, 0xFFFFFF, 0)
createBorderLine()