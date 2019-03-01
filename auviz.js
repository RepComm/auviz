try {
let get = (id) => document.getElementById(id);
let rect = (e) => e.getBoundingClientRect();
let lerp = (a, b, c) => a + c * (b - a);

let canvas = get("canvas");
let ctx = canvas.getContext("2d");
let cRect = rect(canvas);
let audioCtx = new AudioContext();
let analyser = audioCtx.createAnalyser();
let gain = audioCtx.createGain();
analyser.smoothingTimeConstant = 0.5;
analyser.fftSize = 512;

let circleRadius = cRect.width / 4;

let calcDims = () => {
  cRect = rect(canvas);
  cRect.smallest = cRect.width > cRect.height ? cRect.height : cRect.width;
  canvas.width = cRect.width;
  canvas.height = cRect.height;

  circleRadius = cRect.smallest / 2;
}

window.addEventListener("resize", calcDims);
calcDims();

let freqData;
let audioStream;
let safeToGetFreq = false;

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

let render = () => {

  ctx.fillStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#fff";

  ctx.fillRect(0, 0, cRect.width, cRect.height);

  if (!safeToGetFreq) {
    requestAnimationFrame(render);
    return;
  }
  analyser.getByteFrequencyData(freqData);

  ctx.save();
  ctx.translate(cRect.width / 2, cRect.height / 2);
  ctx.beginPath();
  let x, y, r;
  for (let i = 0; i < freqData.length; i++) {
    r = lerp(circleRadius/12, circleRadius, freqData[i]/256);
    x = r * Math.cos(i / freqData.length * 4*Math.PI);
    y = r * Math.sin(i / freqData.length * 4*Math.PI);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  //ctx.stroke();
  ctx.fillStyle = "#336";
  ctx.fill();
  ctx.restore();

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
} catch (ex) {

}