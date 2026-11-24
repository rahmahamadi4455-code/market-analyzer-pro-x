import express from 'express';
import {randomBytes,createHash,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';

const app=express();
const redirectUri=()=>process.env.DERIV_REDIRECT_URI || new URL('/api/auth/callback',process.env.DEPLOY_PRIME_URL || process.env.URL || 'https://market-analyzer-pro.netlify.app').href;
const origin=()=>new URL(redirectUri()).origin;
const configured=()=>!!(process.env.DERIV_CLIENT_ID && process.env.SESSION_SECRET?.length>=32);
const key=()=>createHash('sha256').update(process.env.SESSION_SECRET).digest();

function seal(data){
 const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key(),iv);
 return Buffer.concat([iv,c.update(JSON.stringify(data)),c.final(),c.getAuthTag()]).toString('base64url');
}

function read(req,name){
 try {
  const raw=req.headers.cookie?.split('; ').find(x=>x.startsWith(name+'='))?.slice(name.length+1);
  if(!raw)return null;
  const b=Buffer.from(raw,'base64url'),d=createDecipheriv('aes-256-gcm',key(),b.subarray(0,12));
  d.setAuthTag(b.subarray(-16));
  const p=JSON.parse(Buffer.concat([d.update(b.subarray(12,-16)),d.final()]).toString());
  return p.exp>Date.now()?p:null;
 }catch{return null;}
}

const cookie=(res,name,value,age)=>res.cookie(name,value,{
 httpOnly:true,secure:true,sameSite:'lax',path:'/api',maxAge:age*1000
});

app.use('/api',(_req,res,next)=>{
 res.set('Cache-Control','no-store');
 next();
});

app.get('/api/config',(_req,res)=>res.json({
 appId:process.env.DERIV_PUBLIC_APP_ID||'1089',
 oauthConfigured:configured()
}));

app.get('/api/auth/session',(req,res)=>res.json({
 connected:!!(configured()&&read(req,'__Secure-map_session'))
}));

app.get('/api/auth/start',(req,res)=>{
 if(!configured())return res.redirect('/?auth=setup');
 const verifier=randomBytes(48).toString('base64url');
 const state=randomBytes(32).toString('base64url');
 cookie(res,'__Secure-map_flow',seal({verifier,state,exp:Date.now()+600000}),600);
 const url=new URL('https://auth.deriv.com/oauth2/auth');
 url.search=new URLSearchParams({
  response_type:'code',
  client_id:process.env.DERIV_CLIENT_ID,
  redirect_uri:redirectUri(),
  scope:'application_read',
  state,
  code_challenge:createHash('sha256').update(verifier).digest('base64url'),
  code_challenge_method:'S256'
 }).toString();
 res.redirect(url.href);
});

app.get('/api/auth/callback',async(req,res)=>{
 const flow=configured()&&read(req,'__Secure-map_flow');
 cookie(res,'__Secure-map_flow','',0);
 try{
  if(!flow||typeof req.query.state!=='string'||typeof req.query.code!=='string'||req.query.code.length>4096)throw Error();
  const a=Buffer.from(flow.state),b=Buffer.from(req.query.state);
  if(a.length!==b.length||!timingSafeEqual(a,b))throw Error();
  const r=await fetch('https://auth.deriv.com/oauth2/token',{
   method:'POST',
   headers:{'Content-Type':'application/x-www-form-urlencoded'},
   body:new URLSearchParams({
    grant_type:'authorization_code',
    client_id:process.env.DERIV_CLIENT_ID,
    code:req.query.code,
    code_verifier:flow.verifier,
    redirect_uri:redirectUri()
   }),
   signal:AbortSignal.timeout(12000)
  });
  const token=await r.json();
  if(!r.ok||!token.access_token)throw Error();
  const lifetime=Number(token.expires_in??3600);
  if(!Number.isFinite(lifetime)||lifetime<=0)throw Error();
  const age=Math.min(lifetime,3600);
  const value=seal({token:token.access_token,exp:Date.now()+age*1000});
  if(value.length>3800)throw Error();
  cookie(res,'__Secure-map_session',value,age);
  res.redirect('/?auth=connected');
 }catch{
  res.redirect('/?auth=failed');
 }
});

app.post('/api/auth/logout',(req,res)=>{
 if(req.headers.origin!==origin())return res.sendStatus(403);
 cookie(res,'__Secure-map_session','',0);
 res.json({ok:true});
});

app.use('/api',(_req,res)=>res.status(404).json({error:'Endpoint not found'}));

app.listen(process.env.PORT);
