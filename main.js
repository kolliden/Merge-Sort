'use strict';

let canvas = document.getElementById('cv');
let ctx = canvas.getContext('2d');
let startButton = document.getElementById('bsstart');
let iframe = document.getElementById("iframe");

canvas.width = 0;
canvas.height = 0;

ctx.fillStyle = '#C0C0C0';
// ctx.lineWidth = 8;

let condition = true;
let allInOrder = true;

let AM_width = 1;
let arr = [];
let index = 0;
let animationBuffer = [];

let ticks = 0;
let speed = 5;

const arrSize = 900;
const ACTIONS = { /* An object that contains the actions that the algorithm does. */
  SORT: "SORT",
  COMPARE: "COMPARE",
  CONTINUE:"CONTINUE",
  INSERT:"INSERT",
  SWAP: "SWAP",
  SHIFT_RIGHT: "SHIFT_RIGHT",
};

let randomArr;
let arrayMembers;


let audioContext;
let mooSound;
let gainNode;
let reverbNode;
let impulseResponse;
let pannerNode;

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const playSound = async (type, rate) => {    //https://stackoverflow.com/questions/6343450/generating-sound-on-the-fly-with-javascript-html5
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  gainNode.gain.exponentialRampToValueAtTime(
    0.00001, audioCtx.currentTime + 0.04
  )

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);


  gainNode.gain.value = 1;
  oscillator.frequency.value = rate;
  oscillator.type = type;

  oscillator.start();

  setTimeout(
    function() {
      oscillator.stop();
    },
    100
  );
}

/**
 * This function takes an array as an argument, and then pushes the numbers 1 through arrSize into the
 * array, and then shuffles the array, and then returns the array.
 * @param arr - the array to be initialised
 * @returns The array is being returned.
 */
const initRandomArr = (arr) => {
  for (let i = 1; i <= arrSize; i++) {
    arr.push(i);
  }
  arr = shuffle(arr);
  return arr;
}

function clear(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * The function initCanvas() is called when the window is resized, and it sets the canvas width and
 * height to the window's width and height, and then calls the clear() function.
 */
function initCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  clear();
  drawAll(arr);
}

/**
 * While the current index is not zero, set the current index to the random index, then subtract one
 * from the current index, and swap the current index with the random index.
 * @param array - the array to shuffle
 * @returns The array gets returned.
 */
function shuffle(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex != 0) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

function determineHeight(v){
  return (v * -1 * canvas.height/arrSize)
}
/**
 * It creates a rectangle with a value, a color, and a few methods to manipulate it
 * @param x - x-coordinate of the rectangle
 * @param y - The y position of the array member
 * @param width - The width of the canvas
 * @param height - the height of the bar
 * @param [color=gray] - The color of the bar.
 */
function ArrayMember(x, y, width, height, color = "gray") {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.color = color;

  this.draw = () => {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
  };

  this.resetColor = () => this.setColor("gray");

  this.setColor = (color) => {
    if (!this.isSorted()) {
      this.color = color;
    }
  };

  this.isSorted = () => this.color === "green";

  this.sorted = () => (this.color = "green");

  this.setValue = (v, color) => {
    if (!this.isSorted()) {
      this.height = v;
      this.setColor(color);
    }
  };
  this.getValue = () => {
    return this.height
  };
}

/* A map of functions that are called when the bubbleSort function is called. */
const actionsMap = {
  [ACTIONS.SORT]: (action, members) => {
    members[action.data].sorted();
    playSound('sawtooth', members[action.data].getValue());
  },
  [ACTIONS.SWAP]: (action, members) => {
    const [i, j] = action.data;
    let tmp = members[i].getValue();
    members[i].setValue(members[j].getValue(), "red");
    members[j].setValue(tmp, "yellow");
    playSound('sine', members[i].getValue());
    playSound('sine', members[j].getValue());
  },
  [ACTIONS.COMPARE]: (action, members) => {
    const [i, j] = action.data;
    members[i].setColor("blue");
    if(j){
      members[j].setColor("blue");
    }
    playSound('sine', members[i].getValue());
  },
  [ACTIONS.CONTINUE]: (action, members) => {
    const i = action.data;
    members[i].setColor("pink");
  },
  [ACTIONS.INSERT]: (action, members) => {
    const [i , v] = action.data;
    members[i].setValue(determineHeight(v), "pink");
    playSound('sine', members[i].getValue());
    playSound('sine', members[i].getValue()*2);
    playSound('sine', members[i].getValue()*1.8);
    playSound('sine', members[i].getValue()*1.5);
  },
  [ACTIONS.SHIFT_RIGHT]: (action, members) => {
    const i = action.data;
    members[i+1].setValue(members[i].getValue(), "blue");
    playSound('sine', members[i+1].getValue());
  },
};

const drawAll = () => {if(arrayMembers){arrayMembers.forEach((m) => m.draw());}}

const onAction = async (action) => {
  ticks++;
  setTimeout(() => {
    actionsMap[action.type](action, arrayMembers);
    clear();
    drawAll(arrayMembers);
    arrayMembers.forEach((m) => m.resetColor());
  }, ticks * speed);
}

const check = async (array) => {
  for (let i = 0; i < array.length; i++) {
    if(array[i] < array[i+1]){
      onAction({ type: ACTIONS.SORT, data: i });
      onAction({ type: ACTIONS.SORT, data: array.length-1 });
    }else if (array[i] > array[i+1]){
      return false;
    }
  }
  return true;
}

async function swap(arr, leftIndex, rightIndex){
    var temp = arr[leftIndex];
    arr[leftIndex] = arr[rightIndex];
    arr[rightIndex] = temp;
}

const CopyArray = (A, iBegin, iEnd, B) => {
  for (let k = iBegin; k < iEnd; k++){
      B[k] = A[k];
  }
}

function merge(left, right, step) {
  let arr = [];
  // Break out of loop if any one of the array gets empty
  while (left.length && right.length) {
      // Pick the smaller among the smallest element of left and right sub arrays
      if (left[0] < right[0]) {
          arr.push(left.shift());
      } else {
          arr.push(right.shift());
      }
  }
  // Concatenating the leftover elements
  // (in case we didn't go through the entire left or right array)
  let endArr = [ ...arr, ...left, ...right ];

  //Animate
  if(!(step in animationBuffer)){
    for(let i = 0; i <= step; i++){
      animationBuffer.push([]);
    }
  }

  for (let i = 0; i < endArr.length; i++) {
    animationBuffer[step].push(endArr[i]);
  }

  return endArr;
}

function mergeSort(array, step) {
  const half = array.length / 2;

  // Base case or terminating case
  if(array.length < 2){
    return array;
  }

  //Recursion
  const left = array.splice(0, half);

  let arrayL = mergeSort(left, step + 1);
  let arrayR = mergeSort(array, step + 1);

  return merge(arrayL,arrayR, step);
}

const start = () => {
  initCanvas();
  startButton.remove();
  iframe.remove();

  arr = initRandomArr(arr);
  arrayMembers = arr.map((v, i) => {
    return new ArrayMember((AM_width * i + i), canvas.height, AM_width, determineHeight(v));
  });

  drawAll();

  var startTime = performance.now()

  console.log(arr);

  arr = mergeSort(arr, 0);


  for(let j = animationBuffer.length - 1; j > 0; j--){
    for(let i = 0; i < animationBuffer[j].length; i++){
      onAction({type: ACTIONS.INSERT, data: [i, animationBuffer[j][i]]});
    }
  }
  for(let i = 0; i < arr.length; i++){
    onAction({type: ACTIONS.INSERT, data: [i, arr[i]]});
  }

  // speed = 5;
  // check(arr);

  var endTime = performance.now()

  console.log(`Took ${endTime - startTime} milliseconds`)
}