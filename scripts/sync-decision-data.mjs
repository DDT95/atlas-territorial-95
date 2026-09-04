import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root=path.resolve(import.meta.dirname,"..");
const out=path.join(root,"public","data","decision");
const sources=JSON.parse(await fs.readFile(path.join(root,"config","decision-sources.json"),"utf8"));
await fs.mkdir(out,{recursive:true});

async function probe(source){
  const started=Date.now();
  try{
    const response=await fetch(source.url,{signal:AbortSignal.timeout(25000),headers:{"User-Agent":"DDT95-Atlas-Source-Monitor/1.0"}});
    return {...source,status:response.ok?"ok":"error",httpStatus:response.status,checkedAt:new Date().toISOString(),durationMs:Date.now()-started};
  }catch(error){
    return {...source,status:"error",httpStatus:null,checkedAt:new Date().toISOString(),durationMs:Date.now()-started,error:String(error?.message||error)};
  }
}

const health=await Promise.all(sources.map(probe));
const serviceSource=sources.find(source=>source.id==="services");
const serviceResponse=await fetch(serviceSource.url,{signal:AbortSignal.timeout(60000)});
if(!serviceResponse.ok)throw new Error(`Services: HTTP ${serviceResponse.status}`);
const serviceData=await serviceResponse.json();
if(!Array.isArray(serviceData.records)||serviceData.records.length<1000)throw new Error("Services: contenu incomplet");

const mobilityResponse=await fetch("https://raw.githubusercontent.com/DDT95/transport95/main/mobility95.js",{signal:AbortSignal.timeout(120000)});
if(!mobilityResponse.ok)throw new Error(`Transport95: HTTP ${mobilityResponse.status}`);
const mobilityText=await mobilityResponse.text();
const mobilityScope={window:{}};
vm.createContext(mobilityScope);
vm.runInContext(mobilityText,mobilityScope);
const mobility=mobilityScope.window.MOBILITY95;
const busRoutes=Object.values(mobility.routes||{}).filter(route=>String(route.type)==="3"&&Array.isArray(route.geometry));
const busIds=new Set(busRoutes.map(route=>route.id));
const busNetwork={generatedAt:new Date().toISOString(),sourceDate:mobility.date,stops:(mobility.stops||[]).filter(stop=>(stop.routes||[]).some(id=>busIds.has(id))).map(stop=>({id:stop.id,name:stop.name,lat:stop.lat,lon:stop.lon,routes:stop.routes.filter(id=>busIds.has(id))})),routes:busRoutes.map(route=>({id:route.id,short:route.short,long:route.long,color:route.color||"000091",geometry:route.geometry}))};

async function fetchText(url){const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(`${url}: HTTP ${response.status}`);return response.text();}
function parseDelimited(text,separator=";"){const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const char=text[i];if(char==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(char==='"')quoted=!quoted;else if(char===separator&&!quoted){row.push(cell);cell="";}else if((char==='\n'||char==='\r')&&!quoted){if(char==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=char;}if(cell||row.length){row.push(cell);rows.push(row);}const headers=rows.shift()||[];return rows.map(values=>Object.fromEntries(headers.map((header,index)=>[header,values[index]??""])));}
const rawBase="https://raw.githubusercontent.com/DDT95/val-doise-logement-habitat/main/data/raw";
const [lovacText,sruText,sitadelText,dpeResponse]=await Promise.all([fetchText(`${rawBase}/lovac_95.csv`),fetchText(`${rawBase}/sru_95.csv`),fetchText(`${rawBase}/sitadel_95.csv`),fetch("https://raw.githubusercontent.com/DDT95/transition-energetique95/main/data/dpe.json",{signal:AbortSignal.timeout(60000)})]);
if(!dpeResponse.ok)throw new Error(`DPE: HTTP ${dpeResponse.status}`);const dpeRows=await dpeResponse.json();const studyProfiles={};
for(const item of parseDelimited(lovacText)){const code=item.CODGEO_26;if(!code)continue;const vacant=Number(item.pp_vacant_26),longVacant=Number(item.pp_vacant_plus_2ans_26),total=Number(item.ff_pp_total_25);studyProfiles[code]={...(studyProfiles[code]||{}),vacant:Number.isFinite(vacant)?vacant:null,longVacant:Number.isFinite(longVacant)?longVacant:null,vacancyRate:Number.isFinite(vacant)&&Number.isFinite(total)&&total?Math.round(vacant/total*1000)/10:null};}
for(const item of parseDelimited(sruText)){const code=item.Code_INSEE_commune;if(!code)continue;studyProfiles[code]={...(studyProfiles[code]||{}),sruApplicable:item.Commune_sru_au_01_01_2025==="1",sruRate:item.Taux_SRU_au_01_01_2024||null,sruDeficit:item.commune_deficitaire==="1",sruDeficient:item["Commune_carencée"]==="1",sruTarget:item.Taux_cible_commune_2023_2025||null};}
for(const item of parseDelimited(sitadelText)){if(item.ANNEE!=="2025"||item.TYPE_LGT!=="Tous Logements")continue;studyProfiles[item.COMM]={...(studyProfiles[item.COMM]||{}),housingAuthorized:Number(item.LOG_AUT)||0,housingStarted:Number(item.LOG_COM)||0,floorAreaAuthorized:Number(item.SDP_AUT)||0,floorAreaStarted:Number(item.SDP_COM)||0};}
for(const item of dpeRows){studyProfiles[item.code]={...(studyProfiles[item.code]||{}),dpeTotal:item.total||0,dpeFG:(item.classes?.F||0)+(item.classes?.G||0),dpeFGRate:item.total?Math.round(((item.classes?.F||0)+(item.classes?.G||0))/item.total*1000)/10:null};}

await fs.writeFile(path.join(out,"services-95.json"),JSON.stringify(serviceData));
await fs.writeFile(path.join(out,"bus-network-95.json"),JSON.stringify(busNetwork));
await fs.writeFile(path.join(out,"housing-study-95.json"),JSON.stringify({generatedAt:new Date().toISOString(),profiles:studyProfiles}));
await fs.writeFile(path.join(out,"health.json"),JSON.stringify({generatedAt:new Date().toISOString(),status:health.some(x=>x.critical&&x.status!=="ok")?"degraded":"ok",sources:health},null,2)+"\n");
console.log(JSON.stringify({services:serviceData.records.length,busStops:busNetwork.stops.length,busRoutes:busNetwork.routes.length,housingProfiles:Object.keys(studyProfiles).length,statuses:Object.fromEntries(health.map(x=>[x.id,x.status]))},null,2));
