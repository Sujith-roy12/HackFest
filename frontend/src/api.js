const base=import.meta.env.VITE_API_BASE||'/api';
export async function api(path,options={}){
 const response=await fetch(base+path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
 const body=await response.json().catch(()=>({detail:'Invalid API response'}));
 if(!response.ok){const d=body.detail;throw new Error(typeof d==='string'?d:JSON.stringify(d||body));}
 return body;
}
export function post(path,body,token,method='POST'){return api(path,{method,body:JSON.stringify(body),headers:token?{'X-Admin-Token':token}:{}})}
export const amount=(value,config)=>value==null?'—':config?.output_type==='rate'?Number(value).toLocaleString('en-IN',{maximumFractionDigits:4})+'%':new Intl.NumberFormat('en-IN',{style:'currency',currency:config?.currency||'INR',maximumFractionDigits:2}).format(Number(value));
export const freshExpr=()=>({op:'const',value:'0'});
export const defaultContext=c=>Object.fromEntries(c.attributes.map(a=>[a.key,a.default??(a.type==='boolean'?false:a.type==='category'?a.options[0]:a.type==='date'?'2026-10-15':0)]));
