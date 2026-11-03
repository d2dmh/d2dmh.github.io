/* Original implementation. No external runtime dependencies. */
(function(root){
 'use strict';
 function validate(data){
  if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,error:'内容应为一个 JSON 对象。'};
  if(!data.profile||typeof data.profile.name!=='string'||!data.profile.name.trim())return {ok:false,error:'请填写个人信息中的姓名。'};
  if(Object.values(data.profile).some(v=>typeof v!=='string'))return {ok:false,error:'个人信息的字段必须填写为文字。'};
  for(const key of ['education','experience','publications','projects','awards','scholarships','underReview','internships','activities']){
   if(data[key]===undefined&&!['education','experience','publications','projects'].includes(key))continue;
   if(!Array.isArray(data[key]))return {ok:false,error:key+' 必须是数组。'};
   if(data[key].some(x=>!x||typeof x!=='object'||Array.isArray(x)))return {ok:false,error:key+' 的条目必须是对象。'};
   if(data[key].some(x=>Object.values(x).some(v=>typeof v!=='string')))return {ok:false,error:key+' 的条目字段必须填写为文字。'};
  }
  return {ok:true};
 }
 function escape(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 function safeURL(value){
  const s=String(value??'').trim();if(!s||/[\u0000-\u0020\u007f]/.test(s))return '';
  if(/^https?:\/\//i.test(s))return s;
  if(/^mailto:[^@]+@[^@]+$/i.test(s))return s;
  if(!/^[a-z][a-z\d+.-]*:/i.test(s)&&!s.startsWith('//')&&!s.includes('\\'))return s.startsWith('/')?s.slice(1):s;
  return '';
 }
 function imageURL(value){const s=String(value??'').trim();if(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s))return s;return safeURL(s);}
 function editableLocation(loc){return loc.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(loc.hostname)||/(?:^|[?&])edit=1(?:&|$)/.test(loc.search||'');}
 root.SiteCore={validate,escape,safeURL,imageURL,editableLocation};
})(typeof window!=='undefined'?window:globalThis);
