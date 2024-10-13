import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let grid = document.querySelector(".grid")
let currSquare;
let currRow;
let resize = document.querySelector(".resize");
let erase = document.querySelector(".erase");
let numPerSide = 17;
let squares;
let erasing = false;
let mouseDown;
let colorList = document.querySelector(".color-list");
let particleName = document.querySelector(".particle-name");
let particleColor = document.querySelector(".particle-color");
let colorPicker = document.querySelector(".color-picker");
let addButton = document.querySelector(".add-particle");
let removeButton = document.querySelector(".remove");
let initialEntry = document.querySelector(".particle-entry")
let entry = initialEntry.cloneNode(true);
let coloring = false;
let selectedEntry = initialEntry;
let particleNum = 1;
let output = document.querySelector(".output");
let outputBox = document.querySelector(".output-box");
let distance = 0.1;
let verticalShift = 0;
let rowCounter;
let squareCounter;
let model3d = document.querySelector(".model-3d");

particleName.addEventListener("input", setParticleName);

function setParticleName(event)
{
    selectedEntry = event.target.parentNode;
    selectedEntry.setAttribute("data-particle-name", event.target.value);
}

colorPicker.addEventListener("input", getColor);

function getColor(event)
{
    selectedEntry = event.target.parentNode.parentNode;
    selectedEntry.setAttribute("data-color", event.target.value);
    colorSquares();
}

function colorSquares()
{
    squares.forEach(square => {
        if (square.getAttribute("data-particle") === selectedEntry.getAttribute("data-particle"))
            square.style.backgroundColor = selectedEntry.getAttribute("data-color");
        
        if (square.classList.contains("on") && !square.hasAttribute("data-particle"))
            square.classList.remove("on");
    });

    colorCubes();
}

function colorCubes()
{
    scene.children.forEach(child => {

        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry &&
            child.userData.particleNum === selectedEntry.getAttribute("data-particle"))
        {
            child.material.color.set(selectedEntry.getAttribute("data-color"));
        }
    })
}

createGrid();

function createGrid()
{
    rowCounter = 0;
    squareCounter = 0;

    for (let i = 0; i < numPerSide; ++i)
    {
        currRow = document.createElement("div")
        currRow.classList.add("row");
        grid.appendChild(currRow);
        rowCounter++;
        squareCounter = 0;

        for (let j = 0; j < numPerSide; ++j)
        {
            currSquare = document.createElement("div");
            currSquare.classList.add("square");
            currRow.appendChild(currSquare);
            squareCounter++;
            currSquare.setAttribute("data-position", squareCounter);
            currSquare.setAttribute("data-row", rowCounter);
        }
    }

    squares = document.querySelectorAll(".square");

    for (let i = 0; i < squares.length; ++i)
    {
        let square = squares[i];

        square.addEventListener("mouseover", () => {

            if (mouseDown && !erasing && coloring)
            {
                square.classList.add("on");
                square.style.backgroundColor = selectedEntry.getAttribute("data-color");
                square.setAttribute("data-particle", selectedEntry.getAttribute("data-particle"));

                addCube(square);
            }

            if (!mouseDown && !erasing)
            {
                square.classList.add("cursor");

                if (!square.classList.contains("on"))
                    square.style.backgroundColor = "black";
            }

            if (erasing)
            {
                square.classList.add("erase-cursor");

                if (!square.classList.contains("on"))
                    square.style.backgroundColor = "transparent";
            }

            if (erasing && mouseDown)
            {
                square.classList.remove("on");
                square.style.backgroundColor = "transparent";

                removeCube(square);
            }
        });

        square.addEventListener("mouseleave", () => {

            square.classList.remove("cursor");
            square.classList.remove("erase-cursor");
        });

        square.addEventListener("mousedown", () => {

            mouseDown = true;

            if (!erasing && coloring)
            {
                square.classList.add("on");
                square.style.backgroundColor = selectedEntry.getAttribute("data-color");
                square.setAttribute("data-particle", selectedEntry.getAttribute("data-particle"));

                addCube(square);
            }

            if (erasing)
            {
                square.classList.remove("on");
                square.style.backgroundColor = "transparent";

                removeCube(square);
            }
        });
    }
}

document.addEventListener("mouseup", () => {
    
    mouseDown = false;
})

function removeGrid(oldNumSide)
{
    for (let i = 0; i < oldNumSide; ++i)
    {
        grid.removeChild(grid.lastElementChild);
    }
}

removeButton.addEventListener("click", () => {

    if (initialEntry.getAttribute("data-particle") === selectedEntry.getAttribute("data-particle"))
            coloring = false;

    squares.forEach(square => {
    if (square.getAttribute("data-particle") === initialEntry.getAttribute("data-particle"))
        square.removeAttribute("data-particle");
    });

    for (let i = scene.children.length - 1; i >= 0; i--) {
        const child = scene.children[i];
        if (isCube(child) && child.userData.particleNum === initialEntry.getAttribute("data-particle"))
        {
            scene.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    }

    colorSquares();
    initialEntry.remove();
});

addButton.addEventListener("click", () => {

    let newEntry = entry.cloneNode(true);

    newEntry.querySelector(".particle-name").addEventListener("input", setParticleName);
    newEntry.querySelector(".color-picker").addEventListener("input", getColor);

    particleNum++;
    newEntry.setAttribute("data-particle", particleNum);

    removeButton = newEntry.querySelector(".remove");

    removeButton.addEventListener("click", () => {

        if (newEntry.getAttribute("data-particle") === selectedEntry.getAttribute("data-particle"))
            coloring = false;

        squares.forEach(square => {
            if (square.getAttribute("data-particle") === newEntry.getAttribute("data-particle"))
                square.removeAttribute("data-particle");
        });

        for (let i = scene.children.length - 1; i >= 0; i--) {
            const child = scene.children[i];
            if (isCube(child) && child.userData.particleNum === newEntry.getAttribute("data-particle"))
            {
                scene.remove(child);
                child.geometry.dispose();
                child.material.dispose();
            }
        }

        colorSquares();
        newEntry.remove();
    });

    particleColor = newEntry.querySelector(".particle-color");
    particleColor.addEventListener("click", clickParticleColor);

    // Clear inputs
    let inputs = newEntry.querySelectorAll('input');
    inputs.forEach(input => {
        input.value = "";
    });

    colorList.insertBefore(newEntry, addButton);
})

particleColor.addEventListener("click", clickParticleColor);

function clickParticleColor(event)
{
    let allColorButtons = colorList.querySelectorAll(".particle-color");

    allColorButtons.forEach(btn => btn.classList.remove("pressed"));
    event.currentTarget.classList.add("pressed");

    coloring = true;
    selectedEntry = event.currentTarget.parentNode;
}

resize.addEventListener("click", () => {
    let oldNumSide = numPerSide;

    numPerSide = prompt("*Note: this will clear everything\n\n" +
                        "Enter number of squares per side: (Max 100) (Current: " + numPerSide + ")");
    while (numPerSide > 100 || numPerSide < 0)
    {
        numPerSide = prompt("Enter number of squares per side: (Max 100)");
    }
    
    if (numPerSide == null || numPerSide == "" || isNaN(numPerSide))
    {
        numPerSide = oldNumSide;
        return;
    }

    camera.position.x = numPerSide * 0;
    camera.position.y = numPerSide * 0.5 + verticalShift;
    camera.position.z = numPerSide * 0.8;

    removeGrid(oldNumSide);
    removeAllCubes();
    createGrid();
});

erase.addEventListener("click", () => {    
    erase.classList.toggle("pressed");
        if (erasing == false)
            erasing = true;
        else
            erasing = false;
});

document.querySelector(".distance").addEventListener("input", setDistance);

function setDistance()
{
    distance = document.querySelector(".distance").value;
}

document.querySelector(".vertical-shift").addEventListener("input", setVerticalShift);

function setVerticalShift()
{
    let oldShift = verticalShift;
    verticalShift = +document.querySelector(".vertical-shift").value;

    // Remove old shift from cubes, add new shift
    scene.children.forEach(child => {

        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.BoxGeometry)
        {
            child.position.y -= oldShift;
            child.position.y += verticalShift;
        }
    })
    camera.position.y = numPerSide * 0.5 + verticalShift;
}

document.querySelectorAll("input[name='orientation']").forEach(input => {

    input.addEventListener("input", () => {

        refreshAllCubes();
    });
});

outputBox.addEventListener("click", () => {

    navigator.clipboard.writeText(outputBox.textContent);
    alert("Copied output!");
});

document.querySelector(".generate").addEventListener("click", generateFunction);

function generateFunction()
{   
    let orientation = document.querySelector("input[name='orientation']:checked").value;

    output.scrollIntoView({behavior: "smooth"});

    outputBox.replaceChildren();

    squares.forEach(square => {

        if (square.classList.contains("on")) 
        {
            let lineOutput = document.createElement("div");
            let squareParticleNumber = square.getAttribute("data-particle");
            let entryParticle = document.querySelector('.particle-entry[data-particle="' + squareParticleNumber + '"]');
            let entryParticleName = entryParticle.getAttribute("data-particle-name");

            outputBox.appendChild(lineOutput);

            if (orientation == "vertical")
            {
                lineOutput.textContent += "execute at @s run particle " + entryParticleName + 
                " ^" + (Math.round((Math.floor(numPerSide / 2) * distance - ((numPerSide - square.getAttribute("data-position")) * distance)) * 1000) / 1000) +
                " ^" + (Math.round((distance * (numPerSide - square.getAttribute("data-row")) + verticalShift) * 1000) / 1000) + 
                " ^\n";
            }

            if (orientation == "horizontal")
            {
                lineOutput.textContent += "execute at @s run particle " + entryParticleName + 
                " ^" + (Math.round((Math.floor(numPerSide / 2) * distance - ((numPerSide - square.getAttribute("data-position")) * distance)) * 1000) / 1000) +
                " ^" + verticalShift +
                " ^" + (Math.round((Math.floor(numPerSide / 2) * distance - ((numPerSide - square.getAttribute("data-row")) * distance)) * 1000) / 1000) + "\n";
            }
        }
    });
}

document.addEventListener("keydown", (event) =>
{
    if (event.key == "Control" || event.key == "Meta")
        erase.click();

    updateCursor();
})

document.addEventListener("keyup", (event) =>
{
    if (event.key == "Control" || event.key == "Meta")
        erase.click();

    updateCursor();
})

function updateCursor()
{
    let hoveredSquare = document.querySelector(".square:hover");

    if (!mouseDown && !erasing && hoveredSquare != null)
    {
        hoveredSquare.classList.add("cursor");
        hoveredSquare.classList.remove("erase-cursor");

        if (!hoveredSquare.classList.contains("on"))
            hoveredSquare.style.backgroundColor = "black";   
    }

    if (erasing && hoveredSquare != null)
    {
        hoveredSquare.classList.add("erase-cursor");
        hoveredSquare.classList.remove("cursor");

        if (!hoveredSquare.classList.contains("on"))
            hoveredSquare.style.backgroundColor = "transparent";
    }
}

// Three.js starts here

const scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(244, 210, 255)");

const camera = new THREE.PerspectiveCamera( 75, model3d.clientWidth / model3d.clientHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( model3d.clientWidth, model3d.clientHeight );
renderer.setAnimationLoop( animate );
model3d.appendChild( renderer.domElement );

camera.position.x = numPerSide * 0;
camera.position.y = numPerSide * 0.5 + verticalShift;
camera.position.z = numPerSide * 0.8;

// Add light
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(ambientLight);

const gridHelper = new THREE.GridHelper(200, 50);
scene.add(gridHelper);

const controls = new OrbitControls(camera, renderer.domElement);

function animate() {

    let orientation = document.querySelector("input[name='orientation']:checked").value;

    controls.update();

    if (orientation == "vertical")
    {
        camera.lookAt(
            0,
            numPerSide * 0.5 + verticalShift,
            0
        );
    }

    if (orientation == "horizontal")
    {
        camera.lookAt(
            0,
            verticalShift,
            0
        );
    }

	renderer.render( scene, camera );
}

function addCube(square)
{
    let cubeColor = square.style.backgroundColor;

    // Add cube
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry( 1, 1, 1 ),
        new THREE.MeshStandardMaterial({ color: cubeColor })
    );
    scene.add(cube);

    // Add outlines to cube
    const outlines = new THREE.LineSegments(
        new THREE.EdgesGeometry(cube.geometry),
        new THREE.LineBasicMaterial({ color: 0x000000 }) // Black color for the outlines
    );
    cube.add(outlines);

    setCubePosition(square, cube);
    
    cube.userData = {
        particleNum: selectedEntry.getAttribute("data-particle"),
        row: square.getAttribute("data-row"),
        position: square.getAttribute("data-position")
    };
}

function removeCube(square)
{
    scene.children.forEach(child => {

        if (isCube(child) &&
            child.userData.row === square.getAttribute("data-row") &&
            child.userData.position === square.getAttribute("data-position"))
        {
            scene.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    })
}

function isCube(object)
{
    return object instanceof THREE.Mesh && object.geometry instanceof THREE.BoxGeometry;
}

function refreshAllCubes()
{
    // Remove all old cubes
    removeAllCubes();

    // Add all new cubes
    squares.forEach(square => {

        if (square.classList.contains("on")) 
            addCube(square);
    })
}

function removeAllCubes()
{
    for (let i = scene.children.length - 1; i >= 0; i--)
    {
        const child = scene.children[i];

        if (isCube(child))
        {
            scene.remove(child);
            child.geometry.dispose();
            child.material.dispose();
        }
    }
}

function setCubePosition(square, cube)
{
    let orientation = document.querySelector("input[name='orientation']:checked").value;

    // Set cube position if vertical
    if (orientation == "vertical")
    {
        cube.position.set(
            (Math.round((Math.floor(numPerSide / 2) - ((numPerSide - square.getAttribute("data-position")))) * 1000) / 1000),
            (Math.round((numPerSide - square.getAttribute("data-row") + verticalShift) * 1000) / 1000) + 0.5,
            0
        );
    }

    // Set cube position if horizontal
    if (orientation == "horizontal")
    {
        cube.position.set(
            (Math.round((Math.floor(numPerSide / 2) - (numPerSide - square.getAttribute("data-position"))) * 1000) / 1000),
            verticalShift,
            (Math.round((Math.floor(numPerSide / 2) - (numPerSide - square.getAttribute("data-row"))) * 1000) / 1000)
        );
    }
}