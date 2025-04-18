let frame;
let frameHeight = window.innerHeight;
let frameWidth = frameHeight * 0.5625;       //Size
let context;
let birdYVelocity = 0;      //Size
let birdY;
let activeGame = false;
let gameOverFlag = false;
let birdWidth = frameHeight * 0.1;        //Size
let birdHeight = frameHeight * 0.07;        //Size
let gravity = frameHeight * 0.0003225;         //Size ????
let jumpStrength = -frameHeight * 0.013859375;    //Size ???
let tolerance = 5;
let pipeInterval;
let frameRequestInterval;
let score = 0;
let fontsize = frameHeight * 0.112125;
let groundHeight = frameHeight / 12;
let groundX = 0;
let restartJumpIgnore = false;
const birdX = frameHeight * 0.117;          //Size
const birdImage = new Image();
birdImage.src = "img/bird.png";
const groundImage = new Image();
groundImage.src = "img/ground.png"
birdWidth *= 0.5;
birdHeight *= 0.5;
jumpStrength *= 0.7;

if (frameWidth > window.innerWidth) {
    frameWidth = window.innerWidth;
}



document.addEventListener("DOMContentLoaded", () => {
    (() => { // init
        frame = document.querySelector("canvas");
        frame.width = frameWidth;
        frame.height = frameHeight;
        birdY = frameHeight / 2;
        context = frame.getContext("2d");

        let font = new FontFace("Score", 'url("fonts/PixelGame-R9AZe.otf")');
        document.fonts.add(font);
        font.load().then(() => {
            context.font = `${fontsize}px Score`;
            context.save();
        })
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#000000";

        const heading = document.createElement("h2");
        heading.id = "initialStartHeading";
        heading.textContent = "Click to start!";
        heading.style.fontSize = "3rem";
        heading.style.color = "#fff";
        heading.style.textAlign = "center";
        heading.style.position = "absolute";
        heading.style.top = "30%";
        heading.style.left = "50%";
        heading.style.transform = "translate(-50%, -50%)";
        heading.style.maxWidth = "100%";
        heading.style.whiteSpace = "nowrap";
        heading.style.overflow = "hidden";
        heading.style.textOverflow = "ellipsis";
        heading.style.fontFamily = "'Arial', sans-serif";

        heading.style.opacity = "0";
        heading.style.transition = "opacity .5s";

        document.body.append(heading);

        setTimeout(() => {
            heading.style.opacity = "1";
        }, 1);

    })();
    (() => { // draw first frame
        context.clearRect(0, 0, frameWidth, frameHeight);
        context.drawImage(birdImage, birdX, birdY, birdWidth, birdHeight);
    })();
});


document.addEventListener("keydown", (e) => {
    if (!activeGame && !gameOverFlag) {
        startGame();
        clearInitialStartScreen();
    }
    if (e.key === " " || e.code === "Space" && activeGame) jump();
});

document.addEventListener("click", () => {
    if (!activeGame && !gameOverFlag) {
        startGame();
        clearInitialStartScreen();
    }
    if (activeGame) jump();
});



const startGame = () => {
    activeGame = true;
    randomPipeSet();
    pipeInterval = setInterval(randomPipeSet, 1330);
    renderInterval = setInterval(() => renderLoop(), 1000 / 75);
};

const gameOver = () => {
    clearInterval(renderInterval);
    clearInterval(pipeInterval);
    activeGame = false;
    gameOverFlag = true;
    gravity = 0;
    pipeVelocity = 0;
    birdYVelocity = 0;

    gameOverScreen();
};

const clearInitialStartScreen = () => {
    const heading = document.getElementById("initialStartHeading");
    heading.remove();
}

const gameOverScreen = () => {
    if (document.getElementById("container")) return;

    const container = document.createElement("div");
    const heading = document.createElement("h2");
    const button = document.createElement("button");

    container.id = "container";
    container.style.opacity = "0";
    container.style.transition = "opacity .5s";
    container.style.position = "absolute";
    container.style.top = "50%";
    container.style.left = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.padding = "2rem";
    container.style.backgroundColor = "rgba(0, 0, 0, 0.69)";
    container.style.borderRadius = "5%";
    container.style.textAlign = "center";

    heading.textContent = "Game Over";
    heading.style.fontSize = "3rem";
    heading.style.letterSpacing = ".25rem";
    heading.style.color = "#fff";
    heading.style.marginBottom = "20px";
    heading.style.fontFamily = "'Arial', sans-serif";

    button.textContent = "Restart";
    button.style.fontSize = "2rem";
    button.style.color = "#070";
    button.style.backgroundColor = "#0f0";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.padding = "10px 20px";
    button.style.cursor = "pointer";
    button.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.3)";
    button.style.transition = "transform 0.5s";
    button.onclick = restart;

    container.append(heading, button);
    document.body.append(container);

    setTimeout(() => { // bez toho nefunguje transition protoze to potrebuje malej timeout
        container.style.opacity = "1";
    }, 1);
};

const restart = () => {
    location.reload();
}

const checkCollision = () => {
    const pipe = pipeSets[0];
    if (
        pipe &&
        birdX + (birdWidth - tolerance) > pipe.pipeTopX &&
        birdX < pipe.pipeTopX + (pipeWidth - tolerance) &&
        (birdY < pipe.pipeTopY + (pipeHeight - tolerance) ||
        birdY + (birdHeight - tolerance) > pipe.pipeTopY + pipeHeight + pipeOffset)
    ) activeGame = false;
};

//tohle jsem prepsal protoze pri zmacknuti restartu to zaroven jumplo
const jump = () => {
    if (!restartJumpIgnore) {
        birdYVelocity = jumpStrength;
    }
    else {
        restartJumpIgnore = false;
    }
}

const update = () => {
    birdYVelocity += gravity;
    birdY += birdYVelocity;

    groundX -= pipeVelocity;
    if (-1 * groundX >= frameWidth) {
        groundX = 0;
    }



    pipeSets[0]?.pipeTopX + pipeWidth < 0 && pipeSets.shift();
    if (pipeSets[0]?.pipePassed == false && pipeSets[0]?.pipeTopX + pipeWidth < birdX) {
        score++;
        pipeSets[0].pipePassed = true;
        console.log(score);
    }

    checkCollision();

    pipeSets.forEach((pipe) => (pipe.pipeTopX -= pipeVelocity));

    if (birdY + birdHeight + groundHeight > frameHeight) activeGame = false;
};

const draw = () => {
    context.clearRect(0, 0, frameWidth, frameHeight);
    context.drawImage(birdImage, birdX, birdY, birdWidth, birdHeight);



    pipeSets.forEach((pipe) => {
        context.drawImage(pipetop, pipe.pipeTopX, pipe.pipeTopY, pipeWidth, pipeHeight);
        context.drawImage(pipebottom, pipe.pipeTopX, pipe.pipeTopY + pipeHeight + pipeOffset, pipeWidth, pipeHeight);
    });

    context.drawImage(groundImage, groundX, frameHeight - groundHeight, frameWidth, groundHeight * 2)
    context.drawImage(groundImage, groundX + frameWidth - 1, frameHeight - groundHeight, frameWidth, groundHeight * 2)

    context.fillText(score.toString(), frameWidth / 2 - (score.toString().length * fontsize) / 5.2, frameHeight / 4);
    context.strokeText(score.toString(), frameWidth / 2 - (score.toString().length * fontsize) / 5.2, frameHeight / 4);
};


const renderLoop = () => {
    if (!activeGame) return gameOver();
    update();
    draw();
};