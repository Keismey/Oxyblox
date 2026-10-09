
/* ---------- planète en rotation (WebGL) ---------- */
const PLANET_MAPS=/*MAPS*/[];
const ROT_PERIOD=300; // secondes pour un tour complet
let GLB={ok:false};
function initGlobe(){
 try{
  const cv=document.createElement('canvas');cv.id='pgl';cv.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  $('v-planet').insertBefore(cv,$('pc'));
  const gl=cv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:false});
  if(!gl||gl.getParameter(gl.MAX_TEXTURE_SIZE)<2560)return;
  const vs=`attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
  const fs=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uA,uB;uniform float uMix,uRot,uR;uniform vec2 uC;uniform vec3 uTint;
void main(){
 vec2 p=(gl_FragCoord.xy-uC)/uR;float d=length(p);
 if(d>1.0)discard;
 float z=sqrt(max(0.,1.-d*d));
 const float CA=.5736,SA=.8192;
 vec3 b=vec3(p.x,p.y*CA-z*SA,p.y*SA+z*CA);
 float lat=asin(clamp(b.y,-1.,1.));
 float lon=atan(b.x,b.z)+uRot;
 vec2 uv=vec2(fract(lon/6.2831853),clamp(.5-lat/3.1415927,0.,1.));
 vec3 c=mix(texture2D(uA,uv).rgb,texture2D(uB,uv).rgb,uMix);
 float g=dot(c,vec3(.299,.587,.114));c=clamp(mix(vec3(g),c,1.22),0.,1.);c=(c-.5)*1.06+.5;
 vec3 n=vec3(p.x,p.y,z);vec3 L=normalize(vec3(-.45,.55,.7));
 c*=.55+.55*max(dot(n,L),0.);
 float rim=smoothstep(.95,1.,d);c=mix(c,c*.6+uTint*.4,rim*.5);
 float aa=1.-smoothstep(1.-1.5/uR,1.,d);
 gl_FragColor=vec4(c*aa,aa);
}`;
  const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw new Error('link');
  gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const U={};['uA','uB','uMix','uRot','uR','uC','uTint'].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
  gl.uniform1i(U.uA,0);gl.uniform1i(U.uB,1);
  const tex=PLANET_MAPS.map(src=>{const t={id:gl.createTexture(),ready:false};const im=new Image();im.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,t.id);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,im);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);t.ready=true};im.src=src;return t});
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();GLB.ok=false;cv.style.display='none'});
  GLB={ok:true,cv,gl,U,tex,cur:-1,prev:-1,mix:1,rot:2.1};
 }catch(e){console.warn('Planète 3D indisponible',e);GLB={ok:false}}
}
function drawGlobe(dt,tint){
 if(!GLB.ok||!PG)return false;
 const st=stageOf(viab()),t=GLB.tex[st];if(!t||!t.ready)return false;
 if(GLB.cur!==st){if(GLB.cur>=0&&GLB.tex[GLB.cur].ready){GLB.prev=GLB.cur;GLB.mix=0}else GLB.mix=1;GLB.cur=st}
 GLB.mix=Math.min(1,GLB.mix+dt/2.5);GLB.rot=(GLB.rot+dt*2*Math.PI/ROT_PERIOD)%(Math.PI*2);
 const{gl,cv,U}=GLB,w=Math.round(PW*DPR),h=Math.round(PH*DPR);
 if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h}
 gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 const a=GLB.mix<1?GLB.tex[GLB.prev]:t;
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,a.id);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,t.id);
 gl.uniform1f(U.uMix,GLB.mix<1?GLB.mix*GLB.mix*(3-2*GLB.mix):1);gl.uniform1f(U.uRot,GLB.rot);gl.uniform1f(U.uR,PG.R*DPR);
 gl.uniform2f(U.uC,PG.cx*DPR,(PH-PG.cy)*DPR);gl.uniform3f(U.uTint,tint[0]/255,tint[1]/255,tint[2]/255);
 gl.drawArrays(gl.TRIANGLES,0,3);
 return true;
}

/* ---------- fonds de secteur (vol) ---------- */
const SEC_BG=/*BGS*/[];
const BGI=SEC_BG.map(src=>{const im=new Image();im.src=src;return im});
const BGS={a:1,b:1,mix:1,y:0};
function bgSet(k,instant){if(instant){BGS.a=BGS.b=k;BGS.mix=1;return}if(k===BGS.b)return;BGS.a=BGS.b;BGS.b=k;BGS.mix=0}
function drawSecBg(g,dt,moving){
 BGS.mix=Math.min(1,BGS.mix+dt/3.5);if(moving)BGS.y+=dt*16;
 const draw=(k,al)=>{const im=BGI[k-1];if(!im||!im.complete||!im.naturalWidth||al<=0)return;
  const sc=Math.max(BW/im.naturalWidth,BH/im.naturalHeight),w=im.naturalWidth*sc,h=im.naturalHeight*sc,x=(BW-w)/2,o=BGS.y%(2*h);
  g.globalAlpha=al*.9;
  for(let j=0;j<4;j++){const y=o-2*h+j*h;if(y>BH||y+h<0)continue;if(j%2){g.save();g.translate(0,y+h);g.scale(1,-1);g.drawImage(im,x,0,w,h);g.restore()}else g.drawImage(im,x,y,w,h)}
  g.globalAlpha=1};
 const e=BGS.mix*BGS.mix*(3-2*BGS.mix);
 if(BGS.mix<1)draw(BGS.a,1);draw(BGS.b,BGS.mix<1?e:1);
}
