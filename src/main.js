import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';

import * as dat from 'dat.gui';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);


const loader = new STLLoader();
/*// STL Loader
loader.load("/models/model.stl", function (geometry) {
  const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0x111111, shininess: 200 });
  const mesh = new THREE.Mesh(geometry, material);

  // Center the model
  geometry.center();

  // Add to scene
  scene.add(mesh);
});
*/
// After loading the STL model
loader.load('/models/model.stl', function (geometry) {
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00, specular: 0x111111, shininess: 200 });
    const mesh = new THREE.Mesh(geometry, material);
  
    // Center the model
    geometry.center();
  
    // Add to scene
    scene.add(mesh);
  
    // Create a GUI
    const gui = new dat.GUI();
  
    // Add controls for position
    const positionFolder = gui.addFolder('Position');
    positionFolder.add(mesh.position, 'x', -10, 10).name('X');
    positionFolder.add(mesh.position, 'y', -10, 10).name('Y');
    positionFolder.add(mesh.position, 'z', -10, 10).name('Z');
    positionFolder.open();
  
    // Add controls for rotation
    const rotationFolder = gui.addFolder('Rotation');
    rotationFolder.add(mesh.rotation, 'x', -Math.PI, Math.PI).name('X');
    rotationFolder.add(mesh.rotation, 'y', -Math.PI, Math.PI).name('Y');
    rotationFolder.add(mesh.rotation, 'z', -Math.PI, Math.PI).name('Z');
    rotationFolder.open();
  
    // Add controls for scale
    const scaleFolder = gui.addFolder('Scale');
    scaleFolder.add(mesh.scale, 'x', 0.1, 5).name('X');
    scaleFolder.add(mesh.scale, 'y', 0.1, 5).name('Y');
    scaleFolder.add(mesh.scale, 'z', 0.1, 5).name('Z');
    scaleFolder.open();

    // Button event listeners
    document.getElementById('rotate-left').addEventListener('click', () => {
      mesh.rotation.y -= 0.1; // Rotate left
    });

    document.getElementById('rotate-right').addEventListener('click', () => {
      mesh.rotation.y += 0.1; // Rotate right
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
      camera.position.z -= 1; // Zoom in
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      camera.position.z += 1; // Zoom out
    });
  });

// Camera position
camera.position.z = 5;

// OrbitControls for interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth movement
controls.dampingFactor = 0.05;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Required for damping
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});