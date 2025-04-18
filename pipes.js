let pipeSets = [];
let pipeWidth = frameHeight*0.078;    //Size
let pipeHeight = pipeWidth*10;  //Size
let pipeOffset = frameHeight*0.200;   //Size
let pipeVelocity = frameHeight*0.0035625;   //Size

const pipetop = new Image(300,1600);
pipetop.src = "img/pipe_top.png";

const pipebottom = new Image(300,1600);
pipebottom.src = "img/pipe_bottom.png";

function getRandomIntInclusive(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); 
  }
  

const randomPipeSet = () => {
    let pipeSet = {
        pipeTopX : frameWidth,
        pipeTopY : getRandomIntInclusive(-pipeHeight*0.8,-pipeHeight*0.25),
        pipePassed : false
    }
    pipeSets.push(pipeSet);
}

// 