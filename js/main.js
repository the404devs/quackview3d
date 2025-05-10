import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const LAYER_HEIGHT = 0.2;// mm
const AVG_LAYER_TIME = 2;// minute
const BUILD_VOLUME = 180;
const HOURLY_RATE = 0.5;
const closeTemplate = document.getElementById("close");

const colorMap = {
	"pink": new THREE.MeshPhongMaterial({ color: 0xffc0cb, specular: 0x111111, shininess: 200 }),
	"red": new THREE.MeshPhongMaterial({ color: 0xff0000, specular: 0x111111, shininess: 200 }),
	"orange": new THREE.MeshPhongMaterial({ color: 0xffa500, specular: 0x111111, shininess: 200 }),
	"yellow": new THREE.MeshPhongMaterial({ color: 0xffff00, specular: 0x111111, shininess: 200 }),
	"green": new THREE.MeshPhongMaterial({ color: 0x008000, specular: 0x111111, shininess: 200 }),
	"blue": new THREE.MeshPhongMaterial({ color: 0x0000ff, specular: 0x111111, shininess: 200 }),
	"purple": new THREE.MeshPhongMaterial({ color: 0x800080, specular: 0x111111, shininess: 200 }),
	"white": new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 200 }),
	"grey": new THREE.MeshPhongMaterial({ color: 0x808080, specular: 0x111111, shininess: 200 }),
	"black": new THREE.MeshPhongMaterial({ color: 0x222222, specular: 0x111111, shininess: 200 })
}

// Scene setup
const scene = new THREE.Scene();
const renderTarget = document.getElementById('render-target');
const cardTarget = document.getElementById('card-container');
// const camera = new THREE.PerspectiveCamera(75, renderTarget.clientWidth / renderTarget.clientHeight, 0.1, 1000);
const camera = new THREE.OrthographicCamera();
const aspect = renderTarget.clientWidth / renderTarget.clientHeight;
const viewSize = BUILD_VOLUME * 1.2; // Add margin (e.g. 20%)
let width, height;
if (aspect >= 1) {
	width = viewSize * aspect;
	height = viewSize;
} else {
	width = viewSize;
	height = viewSize / aspect;
}

// Update orthographic camera frustum
camera.left = -width / 2;
camera.right = width / 2;
camera.top = height / 2;
camera.bottom = -height / 2;
camera.near = -1000;
camera.far = 1000;
camera.updateProjectionMatrix();

// Position camera looking directly at the cube center
camera.position.set(BUILD_VOLUME/2, BUILD_VOLUME/2, BUILD_VOLUME);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);
renderTarget.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);


const boxGeometry = new THREE.BoxGeometry(BUILD_VOLUME, BUILD_VOLUME, BUILD_VOLUME);
const edges = new THREE.EdgesGeometry(boxGeometry); // Only outer edges
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
const printableArea = new THREE.LineSegments(edges, lineMaterial);
printableArea.position.y = BUILD_VOLUME/2;
scene.add(printableArea);

const geometry = new THREE.BoxGeometry( BUILD_VOLUME, 0, BUILD_VOLUME );
const material = new THREE.MeshBasicMaterial( { color: 0x111111 } );
const basePlate = new THREE.Mesh( geometry, material );
scene.add(basePlate);


const loader = new STLLoader();

let meshes = [];
let meshOGSizes = [];
let bboxes = [];
let i = 0;

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

animate();

function createCard(filename, id, initialColor) {
    const card = document.createElement('div');
    card.classList.add('card');
	card.style.backgroundColor = initialColor;
    //todo: image here

    const head = document.createElement('div');
	head.classList.add('card-head');
    const title = document.createElement('h3');
    title.textContent = filename;
	if (initialColor == "black") {
		head.style.color = "white";
		head.style.fill = "white";
	} else {
		head.style.color = "black";
		head.style.fill = "black";
	}
	head.appendChild(title);

	const deleteButton = document.createElement('span');
	deleteButton.classList.add("text-button");
	deleteButton.innerHTML = closeTemplate.outerHTML;
	deleteButton.onclick = (e) => { removeModel(card, id, e) };
	head.appendChild(deleteButton);

    const foot = document.createElement('div');
    foot.classList.add('card-foot');

	const primaryGroup = document.createElement("div");
	primaryGroup.classList.add("prop-grid");
	// primaryGroup.style.gridTemplateColumns = "auto auto";

	const scaleHead = document.createElement("span");
	scaleHead.classList.add("prop-head");
	scaleHead.textContent = "Scale (%):";
	scaleHead.style.gridColumn = "1 / span 2";
	primaryGroup.appendChild(scaleHead);

	const colorHead = document.createElement("span");
	colorHead.classList.add("prop-head");
	colorHead.textContent = "Colour:";
	primaryGroup.appendChild(colorHead);

	const scaleInput = document.createElement("input");
	scaleInput.classList.add("prop");
	scaleInput.type = 'number';
    scaleInput.value = 100;
    scaleInput.min = 0;
    scaleInput.step = 5;
	scaleInput.id = "scale";
	scaleInput.style.gridColumn = "1 / span 2";
    scaleInput.onchange = (e) => {scaleModel(card, id, e)};
	primaryGroup.appendChild(scaleInput);

	const colorSelector = document.createElement("select");
	colorSelector.classList.add("prop");
	Object.keys(colorMap).forEach(color => {
		const opt = document.createElement("option");
		opt.value = color;
		opt.textContent = color;
		colorSelector.appendChild(opt);
	});
	colorSelector.value = initialColor;
	colorSelector.onchange = (e) => {setModelColor(card, id, e)};
	primaryGroup.appendChild(colorSelector);

	foot.appendChild(primaryGroup);
	

	const dimensionGroup = generatePropGrid(["Length (mm)", "Width (mm)", "Height (mm)"], ["x", "y", "z"], "input");
	foot.appendChild(dimensionGroup);

	const estimateGroup = generatePropGrid(["Layers", "Time (minutes)", "Cost"], ["layer-count", "time-estimate", "cost-estimate"], "span");
	foot.appendChild(estimateGroup);

    card.appendChild(head);
    card.appendChild(foot);
    cardTarget.appendChild(card);

	return card;
}

function generatePropGrid(headers, elemIds, type) {
	const grid = document.createElement("div");
	grid.classList.add("prop-grid");

	headers.forEach(header => {
		const h = document.createElement("span");
		h.classList.add("prop-head");
		h.textContent = header+":";
		grid.appendChild(h);
	});	

	elemIds.forEach(id => {
		const e = document.createElement(type);
		e.classList.add("prop");
		e.id = id;
		grid.appendChild(e);
	});

	return grid;
}


function uploadTrigger() {
	document.getElementById("file-upload-input").click();
}

function uploadModel() {
  	const fileList = this.files; 
  	Array.from(fileList).forEach(file => {
    	loader.load(URL.createObjectURL(file), function (geometry) {
			const index = Math.floor(Math.random() * Object.keys(colorMap).length);
			const key = Object.keys(colorMap)[index];
			const material = colorMap[key];
			
			let mesh = new THREE.Mesh(geometry, material);
			mesh.rotation.x = -Math.PI/2;
  
      		geometry.center();
			const bb = mesh.geometry.boundingBox;
			const l = bb.max.x - bb.min.x;
			const w = bb.max.y - bb.min.y;
			const h = bb.max.z - bb.min.z;
      
			// Add to scene
			scene.add(mesh);
			mesh.translateZ(h / 2);    // Center the model

			const card = createCard(file.name, i, key);
			calculateModelProperties( card, l, w, h );
			geometry.computeBoundingBox();

			const box = new THREE.Box3().setFromObject(mesh);
			const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
			scene.add(boxHelper);
			bboxes.push(boxHelper);
			meshes.push(mesh);
			meshOGSizes.push(bb.clone());
			i++;  
		}, undefined, function ( error ) {
			console.error( error );
		});
 	});
}

document.querySelector("button#file-upload-button").addEventListener("click", uploadTrigger);
document.querySelector("input#file-upload-input").addEventListener("change", uploadModel, false);

function calculateModelProperties(card, l, w, h) {
	const layers = card.querySelector('#layer-count');
	const time = card.querySelector('#time-estimate');
	const cost = card.querySelector('#cost-estimate');
	const xInput = card.querySelector('#x');
    const yInput = card.querySelector('#y');
    const zInput = card.querySelector('#z');

	const layerCount = Math.ceil(h.toFixed(2) / LAYER_HEIGHT);
	layers.textContent = `${layerCount}`;

	const timeEstimate = Math.floor(layerCount / AVG_LAYER_TIME);
	time.textContent = `${timeEstimate}`;
	const costEstimate = Math.floor((timeEstimate + 14) / 15) * HOURLY_RATE;
	cost.textContent = `$${costEstimate.toFixed(2)}`;

	xInput.value = l.toFixed(2);
    xInput.style.color = l > BUILD_VOLUME ? 'red' : 'grey';
    
    yInput.value = w.toFixed(2);
    yInput.style.color = w > BUILD_VOLUME ? 'red' : 'grey';
    
    zInput.value = h.toFixed(2);
    zInput.style.color = h > BUILD_VOLUME ? 'red' : 'grey';
}

function scaleModel(card, id, e) {
	const mesh = meshes[id];
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

    mesh.geometry.scale(targetL / currentL, targetW / currentW, targetH / currentH);
    mesh.position.y = (targetH/2);

	calculateModelProperties(card, targetL, targetW, targetH);
	
    scene.remove(bboxes[id]);
    const box = new THREE.Box3().setFromObject(mesh);
    const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
    scene.add(boxHelper);
    bboxes[id] = boxHelper;
}

function removeModel(card, id, e) {
	const mesh = meshes[id];
	scene.remove(mesh);
	scene.remove(bboxes[id]);
	card.remove();
}

function setModelColor(card, id, e) {
	const mesh = meshes[id];
	mesh.material = colorMap[e.target.value];

	scene.remove(bboxes[id]);
    const box = new THREE.Box3().setFromObject(mesh);
    const boxHelper = new THREE.Box3Helper(box, mesh.material.color);
    scene.add(boxHelper);
    bboxes[id] = boxHelper;

	card.style.backgroundColor = e.target.value;
	const head = card.querySelector(".card-head");
	if (e.target.value == "black") {
		head.style.color = "white";
		head.style.fill = "white";
	} else {
		head.style.color = "black";
		head.style.fill = "black";
	}
}

// Handle window resize
window.addEventListener('resize', () => {
	camera.aspect = renderTarget.clientWidth / renderTarget.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);
});
