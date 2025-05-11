import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { DragControls } from 'three/addons/controls/DragControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0,0,1);

const LAYER_HEIGHT = 0.2;// mm
const AVG_MM_TIME = 0.055;
const INFILL = 0.15;
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
cameraSetup(camera);

// Position camera looking directly at the cube center
camera.position.set(-BUILD_VOLUME/2+10, -BUILD_VOLUME/2-10, BUILD_VOLUME/2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);
renderTarget.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-1, -1, 1).normalize();
scene.add(directionalLight);

const boxGeometry = new THREE.BoxGeometry(BUILD_VOLUME, BUILD_VOLUME, BUILD_VOLUME);
const edges = new THREE.EdgesGeometry(boxGeometry); // Only outer edges
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
const printableArea = new THREE.LineSegments(edges, lineMaterial);
printableArea.position.z = BUILD_VOLUME/2;
scene.add(printableArea);

const geometry = new THREE.BoxGeometry( BUILD_VOLUME, BUILD_VOLUME, 0 );
const material = new THREE.MeshBasicMaterial( { color: 0x111111 } );
const basePlate = new THREE.Mesh( geometry, material );
scene.add(basePlate);

const axesHelper = new THREE.AxesHelper( 10 );
// axesHelper.position.set(-BUILD_VOLUME/2 -1 , -BUILD_VOLUME/2 -1, 0);
scene.add( axesHelper );

const loader = new STLLoader();

let meshes = [];
let meshOGSizes = [];
let bboxes = [];
let i = 0;

// Animation loop
function animate() {
	requestAnimationFrame(animate);
	
	//   mesh.rotation.z += 0.01;
	// controls.update(); // Required for damping
	renderer.render(scene, camera);
}

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
		opt.textContent = color.charAt(0).toUpperCase() + color.slice(1);
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
			// mesh.rotation.x = -Math.PI/2;
  
      		geometry.center();
			geometry.computeVertexNormals();
			const bb = mesh.geometry.boundingBox;
			const l = bb.max.x - bb.min.x;
			const w = bb.max.y - bb.min.y;
			const h = bb.max.z - bb.min.z;
      
			mesh.translateZ(h / 2);    // Center the model

			const card = createCard(file.name, i, key);
			calculateModelProperties( card, l, w, h, geometry.attributes.position.array );
			geometry.computeBoundingBox();

			const boxHelper = new THREE.BoxHelper(mesh, mesh.material.color);
			bboxes.push(boxHelper);
			meshes.push(mesh);
			meshOGSizes.push(bb.clone());
			scene.add(mesh, boxHelper);
			i++;  
		}, undefined, function ( error ) {
			console.error( error );
		});
 	});
	document.getElementById("file-upload-input").value = "";
}

function calculateModelProperties(card, l, w, h, positions) {
	const layers = card.querySelector('#layer-count');
	const time = card.querySelector('#time-estimate');
	const cost = card.querySelector('#cost-estimate');
	const xInput = card.querySelector('#x');
    const yInput = card.querySelector('#y');
    const zInput = card.querySelector('#z');

	const layerCount = Math.ceil(h.toFixed(2) / LAYER_HEIGHT);
	layers.textContent = `${layerCount}`;

	const timeEstimate = computeTimeEstimate(layerCount, positions);
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

function computeTimeEstimate(layerCount, positions) {
	let minZ = Infinity;
	let maxZ = -Infinity;
	// Determine model Z bounds
	for (let i = 2; i < positions.length; i += 3) {
		const z = positions[i];
		if (z < minZ) minZ = z;
		if (z > maxZ) maxZ = z;
	}

	let cumulativeArea = 0;
	for (let i = 0; i < positions.length; i += 9) {
		const a = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
		const b = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
		const c = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

		const zMin = Math.min(a.z, b.z, c.z);
		const zMax = Math.max(a.z, b.z, c.z);

		const startLayer = Math.floor((zMin - minZ) / LAYER_HEIGHT);
		const endLayer = Math.floor((zMax - minZ) / LAYER_HEIGHT);
		
		const area = computeTriangleArea(a, b, c);
		const layersSpanned = endLayer - startLayer + 1;

		// Distribute area equally over layers the triangle spans
		for (let layer = startLayer; layer <= endLayer; layer++) {
			if (layer >= 0 && layer < layerCount) {
				cumulativeArea += (area / layersSpanned) * INFILL;
			}
		}
	}

	return Math.floor(cumulativeArea * AVG_MM_TIME);
}

function computeTriangleArea(a, b, c) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const cross = new THREE.Vector3().crossVectors(ab, ac);
    return 0.5 * cross.length();
}

function scaleModel(card, id, e) {
	const mesh = meshes[id];
    mesh.geometry.computeBoundingBox();
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

    mesh.geometry.scale(targetL / currentL, targetW / currentW, targetH / currentH);
    mesh.position.z = (targetH/2);

	calculateModelProperties(card, targetL, targetW, targetH, mesh.geometry.attributes.position.array);
	
    scene.remove(bboxes[id]);
    const boxHelper = new THREE.BoxHelper(mesh, mesh.material.color);
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

function cameraSetup(camera) {
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
}

// Handle window resize
window.addEventListener('resize', () => {
	cameraSetup(camera);
	renderer.setSize(renderTarget.clientWidth, renderTarget.clientHeight);
});

document.querySelector("button#file-upload-button").addEventListener("click", uploadTrigger);
document.querySelector("input#file-upload-input").addEventListener("change", uploadModel, false);

// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // Smooth movement
// controls.dampingFactor = 0.05;

const raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let latestClientX = 0;
let latestClientY = 0;
let lastValidPosition = new THREE.Vector3();

const orbitControls = new OrbitControls( camera, renderer.domElement );
		
const dragControls = new DragControls( meshes, camera, renderer.domElement );
dragControls.addEventListener( 'dragstart', function (e) { orbitControls.enabled = false; });
dragControls.addEventListener( 'dragend', function () { orbitControls.enabled = true; } );
dragControls.addEventListener( 'drag', function(e) {
	const mesh = e.object;

	// Ray from camera through mouse
	raycaster.setFromCamera(mouse, camera);
	const bb = mesh.geometry.boundingBox;
	const offsetX = (bb.max.x - bb.min.x)/2;
	const offsetY = (bb.max.y - bb.min.y)/2;
	const offsetZ = (bb.max.z - bb.min.z)/2;
	const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -offsetZ); 

	const intersection = new THREE.Vector3();
	if (raycaster.ray.intersectPlane(dragPlane, intersection)) { 
		const boundary = BUILD_VOLUME/2;
		// Clamp to bounding box centered at origin in X-Y
    	intersection.x = Math.max(-boundary+offsetX, Math.min(boundary-offsetX, intersection.x));
    	intersection.y = Math.max(-boundary+offsetY, Math.min(boundary-offsetY, intersection.y));
		intersection.z = offsetZ;
		mesh.position.copy(intersection);
		lastValidPosition.copy(intersection);
		const i = meshes.indexOf(mesh);
		bboxes[i].update();
	} else {
		mesh.position.copy(lastValidPosition);
	}
});


dragControls.addEventListener('hoveron', (e) => {
	// e.object.material.shininess = 255;
	e.object.material.specular.setHex(0x222222);
});

// Hover end
dragControls.addEventListener('hoveroff', (e) => {
	// e.object.material.shininess = 200;
	e.object.material.specular.setHex(0x1111111);
});

// Track mouse position globally
window.addEventListener('mousemove', (e) => {
	latestClientX = e.clientX;
	latestClientY = e.clientY;

	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((latestClientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -((latestClientY - rect.top) / rect.height) * 2 + 1;
});

animate();