/* Vanilla implementation of the reference's seven-icon contact Dock. */
(()=>{'use strict';
const items=[['email','Email'],['github','GitHub'],['scholar','Google Scholar'],['researchgate','ResearchGate'],['bilibili','Bilibili'],['xiaohongshu','小红书'],['wechat','微信']];
function mount(container,profile,{lang='zh',onWeChat=()=>{}}={}){
 const E=SiteCore.escape,U=SiteCore.safeURL;const missing=lang==='zh'?'待填写':'Not configured';
 container.innerHTML=`<div class="contact-dock-panel" role="group" aria-label="${lang==='zh'?'联系方式':'Contact links'}">${items.map(([key,label])=>{
  const text=key==='wechat'&&lang==='en'?'WeChat':label;const value=String(profile[key]||'').trim();let href='';if(key==='email'&&value)href=U('mailto:'+value);else if(key!=='wechat'&&/^https?:\/\//i.test(value))href=U(value);
  const ready=key==='wechat'?!!(value||profile.wechatQR):!!href;const tip=text+(ready?'':' · '+missing);const body=`<span class="contact-dock-glyph">${window.CONTACT_ICONS[key]}</span><span class="contact-dock-tooltip" role="tooltip">${E(tip)}</span>`;
  return href?`<a class="contact-dock-icon" data-contact="${key}" href="${E(href)}" target="_blank" rel="noopener noreferrer" aria-label="${E(text)}">${body}</a>`:`<button type="button" class="contact-dock-icon${ready?'':' is-empty'}" data-contact="${key}" aria-label="${E(tip)}" ${ready?'':'aria-disabled="true" tabindex="-1"'}>${body}</button>`;
 }).join('')}</div>`;
 const panel=container.firstElementChild,buttons=[...panel.children],state=buttons.map(()=>({size:48,target:48,velocity:0}));const mq=matchMedia('(prefers-reduced-motion: reduce)');let raf=0,last=0,destroyed=false;
 const stopped=()=>mq.matches||document.body.classList.contains('motion-off');
 function apply(){buttons.forEach((el,i)=>{const size=state[i].size;el.style.width=size+'px';el.style.height=size+'px';el.querySelector('.contact-dock-glyph').style.width=size/2+'px';el.querySelector('.contact-dock-glyph').style.height=size/2+'px';});}
 function animate(now){raf=0;if(destroyed)return;const dt=Math.min((now-last)/1000||1/60,1/30)/4;last=now;let moving=false;for(const s of state){for(let step=0;step<4;step++){const acceleration=(150*(s.target-s.size)-12*s.velocity)/.1;s.velocity+=acceleration*dt;s.size+=s.velocity*dt;}if(Math.abs(s.target-s.size)<.04&&Math.abs(s.velocity)<.04){s.size=s.target;s.velocity=0;}else moving=true;}apply();if(moving)raf=requestAnimationFrame(animate);}
 function start(){if(!raf){last=performance.now();raf=requestAnimationFrame(animate);}}
 function reset(immediate=false){state.forEach(s=>{s.target=48;if(immediate){s.size=48;s.velocity=0;}});if(immediate){cancelAnimationFrame(raf);raf=0;apply();}else start();}
 function point(clientX){if(stopped()){reset(true);return;}buttons.forEach((el,i)=>{const r=el.getBoundingClientRect();state[i].target=48+30*Math.max(0,1-Math.abs(clientX-r.left-r.width/2)/140);});start();}
 const move=e=>{if(e.pointerType==='mouse')point(e.clientX);};const leave=()=>reset(stopped());const focus=e=>{const el=e.target.closest('.contact-dock-icon');if(el){const r=el.getBoundingClientRect();point(r.left+r.width/2);}};const focusOut=e=>{if(!panel.contains(e.relatedTarget))leave();};const motion=()=>{if(stopped())reset(true);};
 const click=e=>{const el=e.target.closest('.contact-dock-icon');if(!el)return;if(el.getAttribute('aria-disabled')==='true'){e.preventDefault();return;}if(el.dataset.contact==='wechat'){e.preventDefault();onWeChat(profile);}};
 panel.addEventListener('pointermove',move);panel.addEventListener('pointerleave',leave);panel.addEventListener('focusin',focus);panel.addEventListener('focusout',focusOut);panel.addEventListener('click',click);window.addEventListener('motionchange',motion);const resize=()=>reset(true);window.addEventListener('resize',resize);mq.addEventListener('change',motion);apply();
 return {destroy(){destroyed=true;cancelAnimationFrame(raf);panel.removeEventListener('pointermove',move);panel.removeEventListener('pointerleave',leave);panel.removeEventListener('focusin',focus);panel.removeEventListener('focusout',focusOut);panel.removeEventListener('click',click);window.removeEventListener('motionchange',motion);window.removeEventListener('resize',resize);mq.removeEventListener('change',motion);}};
}
window.ContactDock={mount};
})();
