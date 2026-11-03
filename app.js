(() => {
'use strict';
const $=id=>document.getElementById(id), E=SiteCore.escape, U=SiteCore.safeURL;
const clone=x=>JSON.parse(JSON.stringify(x));
$('edit-open').hidden=!SiteCore.editableLocation(location);
const KEY='research-portfolio-draft-v2';let data=clone(window.SITE_CONTENT),lang='zh',focusTimer,observer;
function normalize(input){const base=clone(window.SITE_CONTENT);const result={...base,...input,profile:{...base.profile,...input.profile}};delete result.gallery;if(!result.profile.avatar)result.profile.avatar=base.profile.avatar;return result;}
try{const saved=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('research-portfolio-draft-v1'));if(SiteCore.validate(saved).ok)data=normalize(saved);lang=localStorage.getItem('portfolio-language')||'zh';}catch{}
if(!['zh','en'].includes(lang))lang='zh';
const words={zh:{home:'首页',resume:'简历',publications:'发表',projects:'项目',gallery:'相册',about:'关于',cvButton:'查看简历',education:'教育背景',experience:'研究经历',skills:'研究与技能',edit:'编辑内容',cityHint:'拖动探索城市 · 点击点亮',backTop:'回到顶部 ↑',more:'阅读全文 ↗',image:'待添加研究配图',all:'全部'},en:{home:'Home',resume:'Resume',publications:'Publications',projects:'Projects',gallery:'Gallery',about:'About',cvButton:'View resume',education:'Education',experience:'Research experience',skills:'Research & skills',edit:'Edit content',cityHint:'Drag to explore · Click to illuminate',backTop:'Back to top ↑',more:'Read more ↗',image:'Add a research figure',all:'All'}};
const ids=['home','resume','publications','projects','about'];
const titles={zh:{resume:'简历',publications:'代表性论文',projects:'项目',about:'关于我'},en:{resume:'Resume',publications:'Selected Publications',projects:'Projects',about:'About Me'}};
Object.assign(words.zh,{researchInterests:'研究兴趣',contactTitle:'联系我'});Object.assign(words.en,{researchInterests:'Research Interests',contactTitle:'Get in Touch'});
const t=key=>(words[lang]||words.zh)[key]||key;
const local=(obj,key)=>String((lang==='en'&&obj[key+'En'])||obj[key]||'');
const tags=s=>String(s||'').split(/[,，]/).map(x=>x.trim()).filter(Boolean).map(x=>`<span class="tag">${E(x)}</span>`).join('');
const placeholder=label=>`<div class="art-placeholder"><span>${E(label)}</span></div>`;
function image(src,label,cls=''){const u=SiteCore.imageURL(src);return u?`<img class="${cls}" src="${E(u)}" alt="${E(label)}" loading="lazy">`:placeholder(label);}
function empty(){return '<p class="empty-note">'+(lang==='zh'?'暂未添加内容，可在编辑面板中填写。':'Nothing added yet. Add content in the editor.')+'</p>';}
function markActive(id){document.querySelectorAll('[data-section]').forEach(a=>{const on=a.dataset.section===id;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});document.querySelector('.badge-scene').classList.toggle('visible',id!=='home');$('rail').querySelectorAll('a').forEach((a,i)=>a.classList.toggle('passed',i<=ids.indexOf(id)));const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);$('rail').style.setProperty('--scroll-progress',String(Math.min(1,scrollY/max)));}
function render(){
 const p=data.profile;setMenu(false);document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=local(p,'name')+' · '+(lang==='zh'?'个人主页':'Personal Website');
 $('desktop-nav').innerHTML=ids.map(id=>`<a href="#${id}" data-section="${id}"><span class="nav-word"><span>${E(t(id))}</span><span aria-hidden="true">${E(t(id))}</span></span></a>`).join('');
 $('mobile-nav').innerHTML=ids.map(id=>`<a href="#${id}" data-section="${id}">${E(t(id))}</a>`).join('');
 $('rail').innerHTML=ids.map(id=>`<a href="#${id}" data-section="${id}" aria-label="${E(t(id))}"><span class="rail-dot"><i></i></span><span class="rail-label">${E(t(id))}</span></a>`).join('');
 document.querySelectorAll('[data-label]').forEach(el=>{const key=el.dataset.label;el.textContent=el.tagName==='H2'?(titles[lang][key]||t(key)):t(key);});
 $('lang-zh').classList.toggle('chosen',lang==='zh');$('lang-en').classList.toggle('chosen',lang==='en');
 $('greeting').innerHTML=(local(p,'greeting')||(lang==='zh'?'你好，|我是'+p.name:'Hello,|I’m '+local(p,'name'))).split('|').map((s,i)=>`<span class="focus-word ${i===0?'focused':''}">${E(s)}</span>`).join('');
 clearInterval(focusTimer);let focused=0;focusTimer=setInterval(()=>{if(document.hidden||document.body.classList.contains('motion-off')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const w=$('greeting').children;if(!w.length)return;w[focused%w.length].classList.remove('focused');focused=(focused+1)%w.length;w[focused].classList.add('focused');},2200);
 $('hero-subtitle').textContent=local(p,'subtitle');$('hero-description').textContent=local(p,'description');$('resume-intro').textContent=local(p,'role');
 const cv=U(p.cv);$('cv-link').hidden=!cv;$('cv-link').href=cv||'#';$('cv-link').textContent=lang==='zh'?'下载完整简历 ↗':'Download CV ↗';
 renderResume();
 $('publication-list').innerHTML=data.publications.map((x,i)=>`<article class="pub-card reveal" data-card-pub="${i}"><div class="pub-main"><span class="pub-status">${E(x.year)}</span><h3 class="pub-title"><button class="pub-open" data-pub="${i}">${E(local(x,'title'))}</button></h3><p class="pub-authors">${E(x.authors)}</p><p class="pub-abstract">${E(local(x,'abstract'))}</p><div class="tags">${tags(x.tags)}</div></div><div class="pub-aside"><span class="pub-venue">${E(x.venue)}</span><div class="pub-image">${image(x.image,t('image'))}</div><div class="pub-actions"><button class="text-button" data-pub="${i}">${E(t('more'))}</button>${U(x.link)?`<a target="_blank" rel="noopener noreferrer" href="${E(U(x.link))}">→ PDF</a>`:''}</div></div></article>`).join('')||empty();
 $('project-list').innerHTML=data.projects.map((x,i)=>`<article class="project-card reveal"><span class="project-index">PROJECT / ${String(i+1).padStart(2,'0')}</span>${U(x.image)?image(x.image,local(x,'title'),'project-cover'):''}<h3>${E(local(x,'title'))}</h3><p>${E(local(x,'description'))}</p><div class="project-bottom"><div class="tags">${tags(x.tags)}</div>${U(x.link)?`<a class="project-link" href="${E(U(x.link))}" target="_blank" rel="noopener noreferrer" aria-label="${E(local(x,'title'))}">↗</a>`:''}</div></article>`).join('')||empty();
 $('about-name').innerHTML=(lang==='zh'?'你好，我是':'Hello, I’m ')+`<strong>${E(local(p,'name'))}</strong>`+(lang==='zh'?'。':'.');$('about-text').textContent=local(p,'about');
 $('about-interests').innerHTML=skillPills(p.researchInterests||p.skills);$('contact-text').textContent=local(p,'contactText');$('about-quote').textContent=local(p,'quote');
 window.PortraitScene?.destroy();if(window.PixelPortrait)window.PortraitScene=PixelPortrait.mount($('portrait-canvas'),{src:p.avatar,pixels:monochromePixels(p.portraitPixels||(p.avatar==='assets/portrait.png'?window.DEFAULT_PORTRAIT_PIXELS:null))});
 $('location').textContent=p.location||'';window.ContactDockScene?.destroy();window.ContactDockScene=ContactDock.mount($('contact-links'),p,{lang,onWeChat:showWeChat});
 $('copyright').textContent='© '+new Date().getFullYear()+' '+local(p,'name')+' · Personal Website';$('badge-name').textContent=local(p,'name');$('badge-role').textContent=local(p,'role');$('badge-avatar').innerHTML=SiteCore.imageURL(p.avatar)?image(p.avatar,local(p,'name')):E((p.nameEn||p.name).slice(0,1).toUpperCase());$('badge-avatar').querySelector('img')?.setAttribute('draggable','false');
 observer?.disconnect();observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(x=>observer.observe(x));
 markActive(ids.filter(id=>$(id).getBoundingClientRect().top<=innerHeight*.4).pop()||'home');
}
function monochromePixels(value){try{const obj=typeof value==='string'?JSON.parse(value):value;if(!obj?.rgb)return '';const rgb=atob(obj.rgb),output=[];for(let i=0;i<rgb.length;i+=3){const y=Math.round(rgb.charCodeAt(i)*.2126+rgb.charCodeAt(i+1)*.7152+rgb.charCodeAt(i+2)*.0722);output.push(String.fromCharCode(y,y,y));}return JSON.stringify({...obj,rgb:btoa(output.join(''))});}catch{return '';}}
function skillPills(value){return String(value||'').split(/[,，]/).filter(x=>x.trim()).map(x=>`<span class="skill">${E(x.trim())}</span>`).join('');}
function timelineRows(list){return list.map(x=>`<article class="timeline-item reveal"><div><h4>${E(local(x,'title'))}</h4><p class="organization">${E(local(x,'organization'))}</p><p class="description">${E(local(x,'description'))}</p></div><time>${E(x.date)}</time></article>`).join('')||empty();}
function renderResume(){
 const labels=lang==='zh'?['教育背景','获奖与奖学金','发表论文','在审稿件','项目经历','实习经历','校园活动','专业技能','语言能力','个人兴趣']:['Education','Awards & Scholarships','Publications','Manuscripts Under Review','Project Experience','Internship Experience','Campus Activities','Professional Skills','Language Proficiency','Personal Interests'];
 const group=(i,body)=>`<div class="resume-block"><h3 class="group-title">${labels[i]}</h3>${body}</div>`;
 const pubRows=data.publications.map((x,i)=>`<article class="timeline-item citation-item reveal"><p class="resume-citation"><span class="citation-index">[${i+1}]</span> ${E(x.authors)}. ${E(local(x,'title'))}. <em>${E(x.venue)}</em>, ${E(x.year)}.${U(x.link)?` <a class="citation-link" href="${E(U(x.link))}" target="_blank" rel="noopener noreferrer">↗</a>`:''}</p></article>`).join('')||empty();
 $('resume-sections').innerHTML=group(0,timelineRows(data.education))+group(1,`<h4 class="resume-group-label">${lang==='zh'?'获奖':'Awards'}</h4>${timelineRows(data.awards)}<h4 class="resume-group-label">${lang==='zh'?'奖学金':'Scholarships'}</h4>${timelineRows(data.scholarships)}`)+group(2,pubRows)+group(3,timelineRows(data.underReview))+group(4,timelineRows(data.experience))+group(5,timelineRows(data.internships))+group(6,timelineRows(data.activities))+group(7,`<div class="skills">${skillPills(data.profile.skills)}</div>`)+group(8,`<div class="skills">${skillPills(data.profile.languageSkills)}</div>`)+group(9,`<div class="skills">${skillPills(data.profile.interests)}</div>`);
}
function showWeChat(profile){
 const qr=SiteCore.imageURL(profile.wechatQR),id=String(profile.wechat||'');
 $('detail-content').innerHTML=`<h2 id="detail-title">${lang==='zh'?'微信':'WeChat'}</h2>${id?`<p class="wechat-contact-id">${E(id)}</p><button class="contact-link" id="copy-wechat">${lang==='zh'?'复制微信号':'Copy WeChat ID'}</button>`:''}${qr?`<img class="wechat-contact-qr" src="${E(qr)}" alt="${lang==='zh'?'微信二维码':'WeChat QR code'}">`:''}`;
 $('detail-dialog').setAttribute('aria-labelledby','detail-title');$('detail-dialog').showModal();document.body.style.overflow='hidden';
 const copy=$('copy-wechat');if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(id);notify(lang==='zh'?'微信号已复制':'WeChat ID copied');}catch{notify(lang==='zh'?'浏览器未允许复制，请手动选择微信号。':'Please select and copy the ID manually.');}};
}
function openDetail(kind,index){
 const x=data[kind]?.[index];if(!x)return;const photo=kind==='gallery';
 $('detail-content').innerHTML=photo?`${U(x.image)?`<img class="detail-image" src="${E(U(x.image))}" alt="${E(local(x,'title'))}">`:placeholder(lang==='zh'?'待添加你的照片':'Add your photo')}<h2 id="detail-title">${E(local(x,'title'))}</h2><p class="detail-body">${E(local(x,'description'))}</p>`:`<span class="pub-venue">${E(x.venue)} · ${E(x.year)}</span><h2 id="detail-title">${E(local(x,'title'))}</h2><p class="pub-authors">${E(x.authors)}</p>${U(x.image)?`<img class="detail-image" src="${E(U(x.image))}" alt="${E(local(x,'title'))}">`:''}<p class="detail-body">${E(local(x,'abstract'))}</p><div class="tags">${tags(x.tags)}</div>${U(x.link)?`<a class="contact-link" style="margin-top:25px" href="${E(U(x.link))}" target="_blank" rel="noopener noreferrer">PDF ↗</a>`:''}`;
 $('detail-dialog').setAttribute('aria-labelledby','detail-title');$('detail-dialog').showModal();document.body.style.overflow='hidden';
}
$('detail-close').onclick=()=>$('detail-dialog').close();
$('detail-dialog').addEventListener('close',()=>{document.body.style.overflow='';});
$('detail-dialog').addEventListener('click',e=>{if(e.target===$('detail-dialog')){const r=$('detail-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail-dialog').close();}});
document.addEventListener('click',e=>{
 const pub=e.target.closest('[data-pub]'),card=e.target.closest('[data-card-pub]');if(pub)openDetail('publications',Number(pub.dataset.pub));else if(card&&!e.target.closest('a'))openDetail('publications',Number(card.dataset.cardPub));
 const section=e.target.closest('[data-section]');if(section){markActive(section.dataset.section);setMenu(false);}
});
let scrollPending=false;window.addEventListener('scroll',()=>{if(scrollPending)return;scrollPending=true;requestAnimationFrame(()=>{markActive(ids.filter(id=>$(id).getBoundingClientRect().top<=innerHeight*.4).pop()||'home');scrollPending=false;});},{passive:true});
$('menu-toggle').onclick=()=>setMenu($('mobile-nav').hidden);
function setMenu(open){$('mobile-nav').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));$('menu-toggle').setAttribute('aria-label',lang==='zh'?(open?'关闭导航':'打开导航'):(open?'Close navigation':'Open navigation'));}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('mobile-nav').hidden){setMenu(false);$('menu-toggle').focus();}});
for(const l of ['zh','en'])$('lang-'+l).onclick=()=>{lang=l;try{localStorage.setItem('portfolio-language',l);}catch{}render();};
$('motion-toggle').onclick=()=>{const paused=document.body.classList.toggle('motion-off');$('motion-toggle').setAttribute('aria-pressed',String(paused));$('motion-toggle').textContent=paused?'▷':'Ⅱ';$('motion-toggle').title=paused?'恢复动画':'暂停动画';window.dispatchEvent(new Event('motionchange'));};
let badgeStart=null;const badge=$('badge');badge.addEventListener('pointerdown',e=>{badgeStart={x:e.clientX,y:e.clientY};badge.setPointerCapture(e.pointerId);badge.style.transition='none';badge.style.cursor='grabbing';});
badge.addEventListener('pointermove',e=>{if(!badgeStart)return;const dx=Math.max(-100,Math.min(100,e.clientX-badgeStart.x)),dy=Math.max(-40,Math.min(100,e.clientY-badgeStart.y));badge.style.transform=`translate(${dx}px,${dy}px) rotate(${7+dx*.1}deg)`;});
function releaseBadge(){if(!badgeStart)return;badgeStart=null;badge.style.transition='transform 1.1s cubic-bezier(.2,1.6,.35,1)';badge.style.transform='rotate(7deg)';badge.style.cursor='grab';}badge.addEventListener('pointerup',releaseBadge);badge.addEventListener('pointercancel',releaseBadge);
let draft=null,editorTab='profile';
const fields={
 profile:[['name','姓名'],['nameEn','英文姓名'],['greeting','首屏问候语（用 | 分开聚焦词组）'],['greetingEn','英文问候语'],['role','身份 / 单位'],['roleEn','英文身份 / 单位'],['subtitle','研究方向'],['subtitleEn','英文研究方向'],['description','首屏介绍','area'],['descriptionEn','英文首屏介绍','area'],['about','关于我','area'],['aboutEn','英文关于我','area'],['skills','专业技能（逗号分隔）'],['languageSkills','语言能力（逗号分隔）'],['interests','个人兴趣（逗号分隔）'],['researchInterests','关于我：研究兴趣（逗号分隔）'],['contactText','联系我：介绍文字','area'],['quote','页尾趣味短句','area'],['location','城市'],['email','邮箱'],['github','GitHub 链接'],['scholar','Google Scholar 链接'],['researchgate','ResearchGate 链接'],['bilibili','B站主页链接'],['xiaohongshu','小红书主页链接'],['wechat','微信号'],['wechatQR','微信二维码图片路径（可选）'],['cv','简历 PDF 路径或链接'],['avatar','个人照片路径或链接']],
 education:[['date','起止时间'],['title','学位 / 专业'],['organization','学校 / 院系'],['description','补充说明','area'],['titleEn','英文名称（可留空）'],['organizationEn','英文学校（可留空）'],['descriptionEn','英文说明（可留空）','area']],
 experience:[['date','起止时间'],['title','经历名称'],['organization','所在机构'],['description','职责与贡献','area'],['titleEn','英文名称（可留空）'],['organizationEn','英文机构（可留空）'],['descriptionEn','英文说明（可留空）','area']],
 publications:[['year','年份 / 状态'],['venue','期刊 / 会议'],['title','论文标题','area'],['authors','作者'],['abstract','完整摘要','area'],['tags','标签（逗号分隔）'],['image','配图路径或链接'],['link','论文 / PDF 链接'],['titleEn','英文标题（可留空）','area'],['abstractEn','英文摘要（可留空）','area']],
 projects:[['title','项目名称'],['description','项目介绍','area'],['tags','标签（逗号分隔）'],['link','项目网址'],['image','封面图片路径或链接'],['titleEn','英文名称（可留空）'],['descriptionEn','英文介绍（可留空）','area']],
 awards:[['date','获奖时间'],['title','奖项名称'],['organization','颁奖单位'],['description','补充说明','area']],
 scholarships:[['date','授予时间'],['title','奖学金名称'],['organization','授予单位'],['description','补充说明','area']],
 underReview:[['date','时间 / 稿件状态'],['title','稿件标题'],['organization','期刊 / 会议'],['description','研究内容与本人贡献','area']],
 internships:[['date','起止时间'],['title','岗位 / 职责'],['organization','实习单位'],['description','工作内容','area']],
 activities:[['date','活动时间'],['title','活动 / 学术服务名称'],['organization','组织名称'],['description','职责与贡献','area']]
};
const editorLabels={profile:'个人信息',education:'教育背景',awards:'获奖',scholarships:'奖学金',publications:'论文成果',underReview:'在审稿件',experience:'项目经历',internships:'实习经历',activities:'校园活动',projects:'项目展示'};
function fieldHTML(obj,f,index){const [key,label,type]=f;const path=/image|avatar/.test(key);return `<label class="field ${type==='area'?'full':''}">${E(label)}${type==='area'?`<textarea data-key="${key}" data-index="${index}">${E(obj[key])}</textarea>`:`<input data-key="${key}" data-index="${index}" value="${E(obj[key])}" ${key==='name'?'required':''}>`}${path?'<span class="field-help">例如 assets/your-photo.jpg，或 https:// 开头的图片直链。图片需放在网站 assets 文件夹内。</span>':''}</label>`;}
function collect(){if(!draft)return;$('editor-form').querySelectorAll('[data-key]').forEach(el=>{const obj=editorTab==='profile'?draft.profile:draft[editorTab][Number(el.dataset.index)];if(obj)obj[el.dataset.key]=el.value;});}
function renderEditor(){
 $('editor-tabs').innerHTML=Object.keys(editorLabels).map(k=>`<button data-editor-tab="${k}" class="${editorTab===k?'active':''}">${editorLabels[k]}</button>`).join('');
 if(editorTab==='profile')$('editor-form').innerHTML=`<div class="form-grid">${fields.profile.map(f=>fieldHTML(draft.profile,f,0)).join('')}</div><div class="portrait-upload"><label class="file-button">选择照片，生成像素肖像<input type="file" id="portrait-upload" accept="image/jpeg,image/png,image/webp" hidden></label><span class="field-help">照片在本机处理，不上传；会随 content.js 一起导出。</span></div>`;
 else $('editor-form').innerHTML=draft[editorTab].map((obj,i)=>`<section class="editor-entry"><div class="entry-head"><span>${editorLabels[editorTab]} / ${String(i+1).padStart(2,'0')}</span><button type="button" class="remove-entry" data-remove="${i}">删除这条</button></div><div class="form-grid">${fields[editorTab].map(f=>fieldHTML(obj,f,i)).join('')}</div></section>`).join('')+'<button class="add-entry" type="button" id="add-entry">＋ 添加一条</button>';
}
function notify(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),3500);}
$('edit-open').onclick=()=>{draft=clone(data);editorTab='profile';$('editor-status').textContent='';renderEditor();$('editor').showModal();document.body.style.overflow='hidden';};
$('editor-close').onclick=()=>$('editor').close();$('editor').addEventListener('close',()=>{document.body.style.overflow='';});$('editor-form').onsubmit=e=>e.preventDefault();
$('editor').addEventListener('click',e=>{
 const tab=e.target.closest('[data-editor-tab]');if(tab){collect();editorTab=tab.dataset.editorTab;renderEditor();}
 const del=e.target.closest('[data-remove]');if(del){collect();draft[editorTab].splice(Number(del.dataset.remove),1);renderEditor();}
 if(e.target.closest('#add-entry')){collect();draft[editorTab].push(Object.fromEntries(fields[editorTab].map(([k])=>[k,''])));renderEditor();}
});
function prepared(){collect();if(draft.profile.avatar!==data.profile.avatar&&draft.profile.portraitPixels===data.profile.portraitPixels)draft.profile.portraitPixels='';if(draft.profile.name!==data.profile.name&&String(draft.profile.greeting).includes(data.profile.name))draft.profile.greeting=draft.profile.greeting.replace(data.profile.name,draft.profile.name);if(draft.profile.nameEn!==data.profile.nameEn&&data.profile.nameEn&&String(draft.profile.greetingEn).includes(data.profile.nameEn))draft.profile.greetingEn=draft.profile.greetingEn.replace(data.profile.nameEn,draft.profile.nameEn);return SiteCore.validate(draft);}
$('editor-save').onclick=()=>{const check=prepared();if(!check.ok){$('editor-status').textContent=check.error;return;}let saved=true;try{localStorage.setItem(KEY,JSON.stringify(draft));}catch{saved=false;}data=clone(draft);render();$('editor').close();notify(saved?'已预览并保存本地草稿；请导出 content.js 才能发布。':'已预览，但浏览器未允许保存；请立即导出备份。');};
function download(name,text,type){const blob=new Blob([text],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
$('export-js').onclick=()=>{const check=prepared();if(!check.ok){$('editor-status').textContent=check.error;return;}download('content.js','/* 你的个人网站内容；用此文件替换网站根目录的 content.js。 */\nwindow.SITE_CONTENT = '+JSON.stringify(draft,null,2)+';\n','text/javascript;charset=utf-8');$('editor-status').textContent='已导出。请替换网站文件夹中的 content.js；导出不会自动修改磁盘文件。';};
$('export-json').onclick=()=>{const check=prepared();if(!check.ok){$('editor-status').textContent=check.error;return;}download('website-content.json',JSON.stringify(draft,null,2),'application/json;charset=utf-8');$('editor-status').textContent='已导出 JSON 备份，可在其他浏览器或设备导入。';};
$('editor').addEventListener('change',async e=>{if(e.target.id!=='portrait-upload')return;const file=e.target.files[0];if(!file)return;collect();try{if(!window.PixelPortrait)throw Error('照片组件尚未加载，请刷新后重试。');$('editor-status').textContent='正在本机处理照片…';const result=await PixelPortrait.prepare(file);draft.profile.avatar=result.src;draft.profile.portraitPixels=monochromePixels(result.pixels);renderEditor();$('editor-status').textContent='像素肖像已生成，点击“保存并预览”查看。';}catch(err){$('editor-status').textContent='照片处理失败：'+err.message;}});
$('import-json').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2*1024*1024)throw Error('文件过大，请导入小于 2 MB 的内容 JSON。');const imported=JSON.parse(await f.text());const check=SiteCore.validate(imported);if(!check.ok)throw Error(check.error);draft=normalize(imported);editorTab='profile';renderEditor();$('editor-status').textContent='导入成功，点击“保存并预览”应用。';}catch(err){$('editor-status').textContent='导入失败：'+err.message;}e.target.value='';};
$('reset-draft').onclick=()=>{if(!confirm('清除当前浏览器草稿并恢复 content.js 中的内容？请先导出备份。'))return;try{localStorage.removeItem(KEY);}catch{}data=clone(window.SITE_CONTENT);draft=clone(data);render();renderEditor();$('editor-status').textContent='已恢复 content.js 中的内容。';};
// 公开只读快照，供测试与导出使用。
window.Portfolio={getData:()=>clone(data),render};
render();
})();
