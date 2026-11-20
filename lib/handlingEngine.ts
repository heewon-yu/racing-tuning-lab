import {DEFAULT_VEHICLE,type Vehicle} from './physicsEngine';

export interface HandlingSetup {
 frontPsi:number;rearPsi:number;
 frontCamber:number;rearCamber:number;
 frontToe:number;rearToe:number;
 frontSpring:number;rearSpring:number;
 frontBar:number;rearBar:number;
 frontDamper:number;rearDamper:number;
 frontRide:number;rearRide:number;
 frontWing:number;rearWing:number;
}
export const DEFAULT_HANDLING:HandlingSetup={frontPsi:30,rearPsi:30,frontCamber:-2.2,rearCamber:-1.8,frontToe:-.08,rearToe:.12,frontSpring:85,rearSpring:75,frontBar:5,rearBar:5,frontDamper:5,rearDamper:5,frontRide:65,rearRide:70,frontWing:3,rearWing:4};
export type HandlingKey=keyof HandlingSetup;
export const HANDLING_CONTROLS:{key:HandlingKey;label:string;min:number;max:number;step:number;unit:string;group:string}[]=[
{key:'frontPsi',label:'전륜 공기압',min:22,max:40,step:.5,unit:'psi',group:'타이어 / 얼라인먼트'},
{key:'rearPsi',label:'후륜 공기압',min:22,max:40,step:.5,unit:'psi',group:'타이어 / 얼라인먼트'},
{key:'frontCamber',label:'전륜 캠버',min:-5,max:0,step:.1,unit:'°',group:'타이어 / 얼라인먼트'},
{key:'rearCamber',label:'후륜 캠버',min:-5,max:0,step:.1,unit:'°',group:'타이어 / 얼라인먼트'},
{key:'frontToe',label:'전륜 토 (− 토아웃)',min:-.4,max:.4,step:.01,unit:'°',group:'타이어 / 얼라인먼트'},
{key:'rearToe',label:'후륜 토 (+ 토인)',min:-.4,max:.4,step:.01,unit:'°',group:'타이어 / 얼라인먼트'},
{key:'frontSpring',label:'전륜 스프링 레이트',min:30,max:180,step:5,unit:'N/mm',group:'서스펜션'},
{key:'rearSpring',label:'후륜 스프링 레이트',min:30,max:180,step:5,unit:'N/mm',group:'서스펜션'},
{key:'frontBar',label:'전륜 안티롤바',min:1,max:10,step:1,unit:'/10',group:'서스펜션'},
{key:'rearBar',label:'후륜 안티롤바',min:1,max:10,step:1,unit:'/10',group:'서스펜션'},
{key:'frontDamper',label:'전륜 댐퍼',min:1,max:10,step:1,unit:'/10',group:'서스펜션'},
{key:'rearDamper',label:'후륜 댐퍼',min:1,max:10,step:1,unit:'/10',group:'서스펜션'},
{key:'frontRide',label:'전륜 차고',min:35,max:130,step:5,unit:'mm',group:'에어로'},
{key:'rearRide',label:'후륜 차고',min:35,max:130,step:5,unit:'mm',group:'에어로'},
{key:'frontWing',label:'프런트 윙 레벨',min:0,max:10,step:1,unit:'/10',group:'에어로'},
{key:'rearWing',label:'리어 윙 레벨',min:0,max:10,step:1,unit:'/10',group:'에어로'},
];
export interface TrackPoint {distance:number;time:number;speed:number;longG:number;latG:number;sumG:number;yawDps:number;corner:string;radius:number}
export interface HandlingResult {lapTime:number;track:TrackPoint[];entry:number;middle:number;exit:number;frontGrip:number;rearGrip:number;gripG:number;maxGSum:number;balance:number;cornerSpeed:number;dragCdA:number}
const gravity=9.81;
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,Number.isFinite(v)?v:lo));
const segments:{length:number;radius:number;name:string}[]=[
{length:360,radius:0,name:'메인 스트레이트'},
{length:105,radius:88,name:'1코너 진입'},
{length:95,radius:55,name:'1코너 에이펙스'},
{length:110,radius:105,name:'1코너 탈출'},
{length:250,radius:0,name:'백 스트레이트'},
{length:115,radius:48,name:'헤어핀 진입'},
{length:100,radius:33,name:'헤어핀'},
{length:105,radius:70,name:'헤어핀 탈출'},
{length:150,radius:0,name:'연결 직선'},
{length:130,radius:110,name:'고속 코너 진입'},
{length:170,radius:145,name:'고속 코너'},
{length:155,radius:130,name:'고속 코너 탈출'},
{length:300,radius:0,name:'최종 직선'},
];
const course=segments.flatMap(seg=>Array.from({length:Math.ceil(seg.length/10)},(_,i)=>({ds:seg.length/Math.ceil(seg.length/10),radius:seg.radius,name:seg.name,index:i})));
function pressureFactor(psi:number){return clamp(1-.0009*(psi-30)**2,.84,1)}
function camberFactor(deg:number,target:number){return clamp(1-.012*(deg-target)**2,.86,1)}
export function analyzeHandling(setup:HandlingSetup,vehicle:Vehicle=DEFAULT_VEHICLE):HandlingResult {
const frontStiff=setup.frontSpring*.65+setup.frontBar*14;
const rearStiff=setup.rearSpring*.65+setup.rearBar*14;
const frontRoll=frontStiff/(frontStiff+rearStiff);
const wingFront=setup.frontWing*14,wingRear=setup.rearWing*14;
const aeroBalance=(wingFront+wingRear)>0?wingFront/(wingFront+wingRear):.46;
const rideFactor=clamp(1-.0018*(Math.abs(setup.frontRide-65)+Math.abs(setup.rearRide-70))*.5,.88,1.03);
const rake=setup.rearRide-setup.frontRide;
const baseMu={eco:.85,sport:1.05,semi:1.25,slick:1.5}[vehicle.tire];
const frontMu=baseMu*pressureFactor(setup.frontPsi)*camberFactor(setup.frontCamber,-2.5)*clamp(1-.10*(frontRoll-.50),.90,1.1)*clamp(1-.16*Math.abs(setup.frontToe),.92,1);
const rearMu=baseMu*pressureFactor(setup.rearPsi)*camberFactor(setup.rearCamber,-2.0)*clamp(1+.10*(frontRoll-.50),.90,1.1)*clamp(1-.16*Math.abs(setup.rearToe),.92,1);
const aeroLoad=(vehicle.downforce/100*.5+(wingFront+wingRear)/220)*rideFactor;
const frontGrip=frontMu*(1+aeroLoad*(aeroBalance/.5)*.16);
const rearGrip=rearMu*(1+aeroLoad*((1-aeroBalance)/.5)*.16);
const avgGrip=2*frontGrip*rearGrip/(frontGrip+rearGrip);
const balance=clamp((rearGrip-frontGrip)*100, -45,45);
const entry=clamp(balance+(.12-setup.rearToe)*13-(setup.frontDamper-setup.rearDamper)*1.2,-45,45);
const middle=clamp(balance+(frontRoll-.5)*25,-45,45);
const exit=clamp(balance+(setup.rearDamper-setup.frontDamper)*.8+((vehicle.drivetrain==='FR')?-4:(vehicle.drivetrain==='FF')?5:0),-45,45);
const maxSpeed=vehicle.redlineRpm/(vehicle.gears[5]*vehicle.finalDrive)*(2*Math.PI*.33/60);
const total=course.length;const speedCap=course.map(p=>{
if(!p.radius)return maxSpeed;
const aeroFactor=1+Math.max(0,(p.radius>100?aeroLoad*.23:aeroLoad*.08));
const phase=p.name.includes('진입')?entry:p.name.includes('탈출')?exit:middle;
const phaseLoss=clamp(1-Math.abs(phase)*.003,.82,1);
return Math.min(maxSpeed,Math.sqrt(p.radius*gravity*avgGrip*aeroFactor)*phaseLoss);
});
const speed=new Array<number>(total).fill(0);
const powerW=vehicle.powerHp*745.7*.88;
const dragArea=vehicle.cd*vehicle.frontalArea*(1+(wingFront+wingRear)*.009+Math.max(0,5-rake)*.002);
const mass=vehicle.weightKg;
const tractionShare=vehicle.drivetrain==='AWD'?1:vehicle.drivetrain==='FR'?.62:.54;
for(let i=0;i<total;i++){const prev=i===0?0:speed[i-1],aPower=powerW/(mass*Math.max(5,prev)),aTraction=avgGrip*gravity*tractionShare;const resist=(.5*1.225*dragArea*prev*prev+.015*mass*gravity)/mass;const accel=Math.max(0,Math.min(aPower,aTraction)-resist);speed[i]=Math.min(speedCap[i],Math.sqrt(prev*prev+2*accel*course[i].ds))}
for(let i=total-2;i>=0;i--){const decel=avgGrip*gravity*.82;speed[i]=Math.min(speed[i],Math.sqrt(speed[i+1]*speed[i+1]+2*decel*course[i].ds))}
let distance=0,time=0,maximum=0;
const track:TrackPoint[]=course.map((p,i)=>{const prev=i===0?0:speed[i-1],next=speed[i],avg=Math.max(.5,(prev+next)/2);const dt=p.ds/avg;time+=dt;distance+=p.ds;const longG=(next*next-prev*prev)/(2*p.ds*gravity);const latG=p.radius===0?0:next*next/(p.radius*gravity);const sumG=Math.hypot(longG,latG);maximum=Math.max(maximum,sumG);return {distance,time,speed:next*3.6,longG,latG,sumG,yawDps:p.radius?next/p.radius*180/Math.PI:0,corner:p.name,radius:p.radius}});
return {lapTime:time,track,entry,middle,exit,frontGrip,rearGrip,gripG:avgGrip,maxGSum:maximum,balance,cornerSpeed:Math.sqrt(55*gravity*avgGrip)*3.6,dragCdA:dragArea};
}
export function modelLimit(g:number){return Array.from({length:73},(_,i)=>{const a=2*Math.PI*i/72;return {x:g*Math.cos(a),y:g*Math.sin(a)}})}
