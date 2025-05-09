import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';



const colorMap = {
	"pink": new THREE.MeshPhongMaterial({ color: 0xffaaaa, specular: 0x111111, shininess: 200 }),
	"orange": new THREE.MeshPhongMaterial({ color: 0xffff00, specular: 0x111111, shininess: 200 }),
	"yellow": new THREE.MeshPhongMaterial({ color: 0xffff00, specular: 0x111111, shininess: 200 }),
	"green": new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0x111111, shininess: 200 }),
	"white": new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 200 }),
	"black": new THREE.MeshPhongMaterial({ color: 0x000000, specular: 0x111111, shininess: 200 }),
	"grey": new THREE.MeshPhongMaterial({ color: 0x555555, specular: 0x111111, shininess: 200 }),
	"red": new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0x111111, shininess: 200 }),
	"blue": new THREE.MeshPhongMaterial({ color: 0x0000ff, specular: 0x111111, shininess: 200 }),
	"purple": new THREE.MeshPhongMaterial({ color: 0xff00ff, specular: 0x111111, shininess: 200 })
}

// Scene setup
const scene = new THREE.Scene();
const renderTarget = document.getElementById('render-target');
const cardTarget = document.getElementById('card-container');
// const camera = new THREE.PerspectiveCamera(75, renderTarget.clientWidth / renderTarget.clientHeight, 0.1, 1000);
const aspect = renderTarget.clientWidth / renderTarget.clientHeight;
const frustumHeight = 500; // You can adjust this to zoom in/out
const frustumWidth = frustumHeight * aspect;
const camera = new THREE.OrthographicCamera(
    -frustumWidth / 2,  // left
    frustumWidth / 2,  // right
    frustumHeight / 2, // top
    -frustumHeight / 2, // bottom
    0.1,               // near
    1000               // far
);

camera.position.set(404, 404, 500); // Set a position looking toward the origin
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);


renderTarget.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);




const buildVolume = 180;

const boxGeometry = new THREE.BoxGeometry(buildVolume, buildVolume, buildVolume);
const edges = new THREE.EdgesGeometry(boxGeometry); // Only outer edges
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const printableArea = new THREE.LineSegments(edges, lineMaterial);
printableArea.position.y = buildVolume/2;
scene.add(printableArea);

const geometry = new THREE.BoxGeometry( buildVolume, 0, buildVolume );
const material = new THREE.MeshBasicMaterial( { color: 0x111111 } );
const basePlate = new THREE.Mesh( geometry, material );
scene.add(basePlate);


const loader = new STLLoader();
let mesh;

let meshOGSizes = [];
let bboxes = [];
let i = 0;


// Camera position
// camera.position.z = 100;

// OrbitControls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth movement
controls.dampingFactor = 0.05;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

//   mesh.rotation.z += 0.01;
  controls.update(); // Required for damping
  renderer.render(scene, camera);
}


function createCard(mesh, filename, id) {
    const card = document.createElement('div');
    card.classList.add('card');
    //todo: image here

    const head = document.createElement('h3');
    head.textContent = filename;

    const foot = document.createElement('div');
    foot.classList.add('card-foot');
    
    const span = document.createElement('span');
    span.classList.add('dimension');
    const label = document.createElement('label');
    label.textContent = "Scale: ";
    const scale = document.createElement('input');
    scale.type = 'number';
    scale.value = 100;
    scale.min = 0;
    scale.step = 5;
    scale.onchange = (e) => {scaleModel(card, id, e)};

    const unit = document.createElement('label');
    unit.textContent = "%";
    span.appendChild(label);
    span.appendChild(scale);
    span.appendChild(unit);
    foot.appendChild(span);

    ["x", "y", "z"].forEach(dim => {
        const span = document.createElement('span');
        span.classList.add('dimension');
        const label = document.createElement('label');
        label.textContent = dim.toUpperCase() + ": ";

        const exact = document.createElement('input');
        exact.type = 'number';
        exact.id = dim;
        exact.value = (mesh.geometry.boundingBox.max[dim] - mesh.geometry.boundingBox.min[dim]).toFixed(2);

        exact.readOnly = true;

        const unit = document.createElement('label');
        unit.textContent = "mm";

        span.appendChild(label);
        span.appendChild(exact);
        span.appendChild(unit);
        foot.appendChild(span);
    });

	const colorSelector = document.createElement("select");
	colorSelector.onchange = (e) => {setModelColor(card, id, e)};
	Object.keys(colorMap).forEach(color => {
		const opt = document.createElement("option");
		opt.value = color;
		opt.textContent = color;
		colorSelector.appendChild(opt);
	})
	foot.appendChild(colorSelector);
    card.appendChild(head);
    card.appendChild(foot);
    cardTarget.appendChild(card);

}

function uploadTrigger() {
  document.getElementById("file-upload-input").click();
}

function uploadModel() {
  const fileList = this.files; /* now you can work with the file list */
  Array.from(fileList).forEach(file => {
    loader.load(URL.createObjectURL(file), function (geometry) {
      const material = colorMap["pink"];
      mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI/2;
  
      geometry.center();
      
      // Add to scene
      scene.add(mesh);
      mesh.translateZ((mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z)/2);    // Center the model
      console.log(mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x);
      console.log(mesh.geometry.boundingBox.max.y - mesh.geometry.boundingBox.min.y);
      console.log(mesh.geometry.boundingBox.max.z - mesh.geometry.boundingBox.min.z);
  
      console.log(mesh.geometry);
  
      createCard(mesh, file.name, i);
  
      geometry.computeBoundingBox();
      
      
      const box = new THREE.Box3().setFromObject(mesh);
      const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
      scene.add(boxHelper);
  
      bboxes.push(boxHelper);
  
      meshOGSizes.push(mesh.geometry.boundingBox.clone());
      i++;
      
      animate();
  
  }, undefined, function ( error ) {
      console.error( error );
    });
  });
}

document.querySelector("button#file-upload-button").addEventListener("click", uploadTrigger);
document.querySelector("input#file-upload-input").addEventListener("change", uploadModel, false);

function scaleModel(card, id, e) {
    mesh.geometry.computeBoundingBox();
    // bboxes[id].geometry.computeBoundingBox();
    let value = e.target.value;
    if (value <= 0) { value = 0.0001 }

    const scaleFactor = value / 100;

    const currentBB = mesh.geometry.boundingBox;
    const currentL = (currentBB.max.x - currentBB.min.x);
    const currentW = (currentBB.max.y - currentBB.min.y);
    const currentH = (currentBB.max.z - currentBB.min.z);

    const originalBB = meshOGSizes[id];
    const originalL = (originalBB.max.x - originalBB.min.x);
    const originalW = (originalBB.max.y - originalBB.min.y);
    const originalH = (originalBB.max.z - originalBB.min.z);

    const targetL = originalL * scaleFactor;
    const targetW = originalW * scaleFactor;
    const targetH = originalH * scaleFactor;

    console.log("target size", targetL, targetW, targetH);

    const xInput = card.querySelector('#x');
    const yInput = card.querySelector('#y');
    const zInput = card.querySelector('#z');


    xInput.value = targetL.toFixed(2);
    xInput.style.color = targetL > buildVolume ? 'red' : 'grey';
    
    card.querySelector('#y').value = targetW.toFixed(2);
    yInput.style.color = targetW > buildVolume ? 'red' : 'grey';
    
    card.querySelector('#z').value = targetH.toFixed(2);
    zInput.style.color = targetH > buildVolume ? 'red' : 'grey';

    mesh.geometry.scale(targetL / currentL, targetW / currentW, targetH / currentH);
    mesh.position.y = (targetH/2);

	
    scene.remove(bboxes[id]);
    const box = new THREE.Box3().setFromObject(mesh);
    const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
    scene.add(boxHelper);
    bboxes[id] = boxHelper;
}

function setModelColor(card, id, e) {
	mesh.material = colorMap[e.target.value];

	scene.remove(bboxes[id]);
    const box = new THREE.Box3().setFromObject(mesh);
    const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
    scene.add(boxHelper);
    bboxes[id] = boxHelper;
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = renderTarget.clientWidth / renderTarget.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);
});