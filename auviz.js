
//Alias functions cause browser API is too long..
let get = (id) => document.getElementById(id);
let rect = (e) => e.getBoundingClientRect();
let lerp = (a, b, c) => a + c * (b - a);

//Audio and canvas
let canvas = get("canvas");
let ctx = canvas.getContext("2d");
let cRect = rect(canvas);
let audioCtx = new AudioContext();
let analyser = audioCtx.createAnalyser();
let gain = audioCtx.createGain();
analyser.smoothingTimeConstant = 0.2;
analyser.fftSize = 1024;

let circleRadius = cRect.width / 4;

//Recalculate dimensions for rendering
let calcDims = () => {
  cRect = rect(canvas);
  cRect.smallest = cRect.width > cRect.height ? cRect.height : cRect.width;
  canvas.width = cRect.width;
  canvas.height = cRect.height;

  circleRadius = cRect.smallest / 2;
}

window.addEventListener("resize", calcDims);
calcDims(); //Force recalc once

let freqData;
let audioStream;
let safeToGetFreq = false;
let visualizerColor = "#88f";

let gainCtrl = get("gainSlider");
gainCtrl.addEventListener("change", ()=>{
  console.log("Changed", gainCtrl, gain);
  gain.gain.value = parseFloat(gainCtrl.value);
});

let start = () => {
  navigator.mediaDevices.getUserMedia({
    audio: true
  }).then((stream)=> {
    console.log(stream);
    audioStream = audioCtx.createMediaStreamSource(stream);
    audioStream.connect(gain);
    gain.connect(analyser);
    //audioStream.connect(analyser);
    freqData = new Uint8Array(analyser.frequencyBinCount);
    safeToGetFreq = true;
  }).catch((err)=> {
    console.log("Couldn't capture audio", err);
  });
}

start();

let averageAmp = 0;
let hexVal = "ff";

let render = () => {

  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#fff";

  ctx.fillRect(0, 0, cRect.width, cRect.height);

  if (!safeToGetFreq) {
    requestAnimationFrame(render);
    return;
  }
  //Get FFT transformed audio frequency information
  analyser.getByteFrequencyData(freqData);

  ctx.save();
  ctx.translate(cRect.width / 2, cRect.height / 2);
  ctx.rotate(Math.PI/2);
  ctx.beginPath();
  let x, y, r;
  for (let i = 0; i < freqData.length; i++) {
    averageAmp += freqData[i];
    r = lerp(circleRadius/12, circleRadius, freqData[i]/256);
    x = r * Math.cos(i / freqData.length * Math.PI);
    y = r * Math.sin(i / freqData.length * Math.PI);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  //ctx.stroke();
  hexVal = parseInt(( averageAmp / freqData.length )).toString(16);
  //console.log(hexVal);
  if (hexVal.length === 2) {
    ctx.fillStyle = "#" + hexVal + hexVal + hexVal;
  } else {
    hexVal = "0" + hexVal;
    ctx.fillStyle = "#" + hexVal + hexVal + hexVal;
  }
  ctx.fill();

  ctx.scale(1,-1);
  ctx.beginPath();

  for (let i = 0; i < freqData.length; i++) {
    r = lerp(circleRadius/12, circleRadius, freqData[i]/256);
    x = r * Math.cos(i / freqData.length * Math.PI);
    y = r * Math.sin(i / freqData.length * Math.PI);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  averageAmp = 0;
  ctx.fill();
  //ctx.stroke();
  ctx.restore();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);