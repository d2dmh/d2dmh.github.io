(function () {
  'use strict';
  const W=300,H=450,STEP=3,DOT=2.7,COUNT=15000;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const decode=value=>{
    if(typeof value==='string') value=JSON.parse(value);
    if(!value||value.width!==100||value.height!==150||typeof value.rgb!=='string') throw Error('Portrait pixels must contain 100x150 RGB base64 data');
    const raw=atob(value.rgb); if(raw.length!==45000) throw Error('Portrait RGB data must be 45000 bytes');
    const out=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i); return out;
  };
  function sample(image){
    const c=document.createElement('canvas'); c.width=100;c.height=150;
    const x=c.getContext('2d',{willReadFrequently:true}); const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height,scale=Math.max(100/iw,150/ih);x.drawImage(image,(100-iw*scale)/2,(150-ih*scale)/2,iw*scale,ih*scale);
    const data=x.getImageData(0,0,100,150).data, rgb=new Uint8Array(45000);
    for(let i=0,j=0;i<data.length;i+=4){const y=Math.round(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722);rgb[j++]=y;rgb[j++]=y;rgb[j++]=y;}
    let binary=''; for(let i=0;i<rgb.length;i+=0x8000) binary+=String.fromCharCode(...rgb.subarray(i,Math.min(i+0x8000,rgb.length)));
    return {width:100,height:150,rgb:btoa(binary)};
  }
  function paintPixels(ctx,pixels,mouse,active,time){
    ctx.clearRect(0,0,W,H);
    let n=0, maxDisplacement=0;
    for(let gy=0;gy<150;gy++) for(let gx=0;gx<100;gx++){
      const hash=((gx*73856093)^(gy*19349663))>>>0;
      // Stable ~20% sparse dropout, reduced around edges to retain facial contours.
      const edge=Math.min(1,(Math.abs(pixels[(gy*100+gx)*3]-pixels[(gy*100+gx+1<100?gy*100+gx+1:gy*100+gx)*3])+8)/80);
      if(((hash%10000)/10000)<0.2*(1-0.28*edge)) continue;
      const idx=(gy*100+gx)*3, ox=gx*STEP+1.5, oy=gy*STEP+1.5;
      let dx=ox-mouse.x,dy=oy-mouse.y,dist=Math.hypot(dx,dy), influence=Math.exp(-(dist*dist)/(2*40*40))*active;
      const angle=0.15*influence, cs=Math.cos(angle), sn=Math.sin(angle);
      let px=mouse.x+cs*dx-sn*dy,py=mouse.y+sn*dx+cs*dy;
      const seed=hash/4294967295*Math.PI*2, jitter=4*influence;
      px+=Math.sin(time*0.004+seed)*jitter;py+=Math.cos(time*0.004+seed*1.13)*jitter;
      maxDisplacement=Math.max(maxDisplacement,Math.hypot(px-ox,py-oy));
      ctx.fillStyle=`rgb(${pixels[idx]},${pixels[idx+1]},${pixels[idx+2]})`;
      ctx.fillRect(px-DOT/2,py-DOT/2,DOT,DOT);n++;
    }
    return {n,maxDisplacement};
  }
  function mount(canvas,{src,pixels}={}){
    if(!(canvas instanceof HTMLCanvasElement)) throw TypeError('mount expects a canvas');
    let data=null, destroyed=false, raf=0, visible=false, playing=false, failed=false;
    let target={x:-9999,y:-9999},mouse={x:-9999,y:-9999},activity=0,activityTarget=0,points=0,displacement=0;
    const ctx=canvas.getContext('2d'); if(!ctx) throw Error('2D canvas unavailable');
    canvas.width=W;canvas.height=H;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Pixelated portrait');
    const resize=()=>{const rect=canvas.getBoundingClientRect();canvas.style.width=rect.width?rect.width+'px':'300px';canvas.style.height=rect.height?rect.height+'px':'450px';};
    const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):null;observer?.observe(canvas);resize();
    const staticDraw=()=>{if(data){const r=paintPixels(ctx,data,{x:-9999,y:-9999},0,0);points=r.n;displacement=0;}};
    const activeNow=()=>!destroyed&&!failed&&visible&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!document.body.classList.contains('motion-off');
    function frame(t){raf=0;if(!activeNow()){playing=false;return;} playing=true;
      mouse.x+=(target.x-mouse.x)*0.2;mouse.y+=(target.y-mouse.y)*0.2;activity+=(activityTarget-activity)*0.1;
      const r=paintPixels(ctx,data,mouse,activity,t);points=r.n;displacement=r.maxDisplacement;raf=requestAnimationFrame(frame);
    }
    const start=()=>{if(data&&!raf&&activeNow())raf=requestAnimationFrame(frame);};
    const onMove=e=>{const r=canvas.getBoundingClientRect();target={x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};activityTarget=1;};
    const leave=()=>{activityTarget=0;};
    const motion=()=>{if(activeNow())start();else if(raf){cancelAnimationFrame(raf);raf=0;playing=false;}};
    const visibility=()=>motion();
    const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;motion();},{threshold:.01});intersection.observe(canvas);
    canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerleave',leave);
    document.addEventListener('visibilitychange',visibility);window.addEventListener('motionchange',motion);
    const mq=matchMedia('(prefers-reduced-motion: reduce)');mq.addEventListener?.('change',motion);
    const fallback=()=>{failed=true;canvas.setAttribute('data-portrait-error','Image could not be sampled; showing the original image.'); if(src){const img=new Image();img.onload=()=>{ctx.clearRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);};img.src=src;}};
    try { if(pixels) data=decode(pixels); else if(src==='assets/portrait.jpg'&&window.DEFAULT_PORTRAIT_PIXELS) data=decode(window.DEFAULT_PORTRAIT_PIXELS); } catch(e){canvas.setAttribute('data-portrait-error',e.message);}
    if(data){canvas.removeAttribute('data-portrait-error');staticDraw();start();}
    else if(src){const image=new Image();image.crossOrigin='anonymous';image.onload=()=>{try{data=decode(sample(image));staticDraw();start();}catch(e){fallback();}};image.onerror=fallback;image.src=src;}
    else fallback();
    return {destroy(){if(destroyed)return;destroyed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();intersection.disconnect();canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('motionchange',motion);mq.removeEventListener?.('change',motion);},get pointCount(){return points;},get active(){return playing;},get displacement(){return displacement;}};
  }
  async function prepare(file){
    if(!file||!/^image\/(jpeg|png|webp)$/i.test(file.type)) throw TypeError('Choose a JPEG, PNG, or WebP image.');
    const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error||Error('Could not read image'));reader.readAsDataURL(file);});
    const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(Error('Could not decode image'));image.src=src;});
    const p=sample(img);return {src,pixels:JSON.stringify(p)};
  }
  window.PixelPortrait={mount,prepare};
})();
