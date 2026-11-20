export type Tire = 'eco'|'sport'|'semi'|'slick';
export type Drivetrain = 'FR'|'FF'|'AWD';
export interface Vehicle {powerHp:number;torqueNm:number;redlineRpm:number;finalDrive:number;gears:[number,number,number,number,number,number];weightKg:number;cd:number;frontalArea:number;downforce:number;tire:Tire;drivetrain:Drivetrain}
export interface Sample {time:number;speedKmh:number;distanceM:number;rpm:number;gear:number}
export interface GearPoint {gear:number;startKmh:number;endKmh:number;rpmDrop:number}
export interface Metrics {zeroTo100:number|null;zeroTo200:number|null;quarterMile:number|null;trapSpeedKmh:number|null;topSpeedKmh:number;lateralG:number;brakeDistanceM:number;powerToWeight:number}
export interface Result {samples:Sample[];metrics:Metrics;gearPoints:GearPoint[]}
export const DEFAULT_VEHICLE:Vehicle={powerHp:300,torqueNm:400,redlineRpm:7500,finalDrive:3.7,gears:[3.1,2.15,1.56,1.21,1,.82],weightKg:1400,cd:.30,frontalArea:2.1,downforce:25,tire:'sport',drivetrain:'FR'};
export const PRESETS:Record<string,Vehicle>={
'경량 로드스터':{...DEFAULT_VEHICLE,powerHp:210,torqueNm:240,weightKg:950,cd:.33,frontalArea:1.85,downforce:15,gears:[3.3,2.2,1.55,1.18,.94,.76]},
'고출력 GT카':{...DEFAULT_VEHICLE,powerHp:680,torqueNm:820,weightKg:1730,redlineRpm:8000,finalDrive:3.42,cd:.31,frontalArea:2.35,downforce:30,tire:'semi',gears:[2.98,2.05,1.51,1.18,.95,.78]},
'트랙 하이퍼카':{...DEFAULT_VEHICLE,powerHp:1180,torqueNm:1050,weightKg:1220,redlineRpm:9500,finalDrive:3.58,cd:.38,frontalArea:2.05,downforce:90,tire:'slick',drivetrain:'AWD',gears:[2.9,2.12,1.65,1.34,1.09,.89]}
};
export const TIRE_MU:Record<Tire,number>={eco:.85,sport:1.05,semi:1.25,slick:1.5};
const DT=.05,G=9.81,AIR=1.225,EFF=.88,R=.33,HP=745.7;
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
function safe(v:Vehicle):Vehicle{return {...v,powerHp:clamp(v.powerHp,100,1500),torqueNm:clamp(v.torqueNm,100,1500),redlineRpm:clamp(v.redlineRpm,5000,12000),finalDrive:clamp(v.finalDrive,2.5,5.5),weightKg:clamp(v.weightKg,600,2500),cd:clamp(v.cd,.2,.6),frontalArea:clamp(v.frontalArea,1.5,3),downforce:clamp(v.downforce,0,100),gears:v.gears.map(x=>clamp(x,.4,5.5)) as Vehicle['gears'],tire:TIRE_MU[v.tire]?v.tire:'sport',drivetrain:['FR','FF','AWD'].includes(v.drivetrain)?v.drivetrain:'FR'}}
function torque(v:Vehicle,rpm:number){const r=clamp(rpm,1000,v.redlineRpm),ratio=r/v.redlineRpm;const shape=ratio<.35?.6+.4*ratio/.35:ratio<.72?1:1-.18*(ratio-.72)/.28;return Math.min(v.torqueNm*shape,v.powerHp*HP/(r*2*Math.PI/60))}
function rpmAt(v:Vehicle,speed:number,gear:number){return speed/(2*Math.PI*R)*60*v.gears[gear]*v.finalDrive}
function shiftSpeed(v:Vehicle,gear:number){return v.redlineRpm/(v.gears[gear]*v.finalDrive)*2*Math.PI*R/60}
function drag(v:Vehicle,speed:number){return .5*AIR*speed*speed*v.cd*v.frontalArea*(1+.4*v.downforce/100)}
function downforce(v:Vehicle,speed:number){return v.weightKg*G*.65*v.downforce/100*(speed/(200/3.6))**2}
function roll(v:Vehicle){return .015*v.weightKg*G}
function traction(v:Vehicle,speed:number){const share=v.drivetrain==='AWD'?1:v.drivetrain==='FR'?.6:.52;const transfer=v.drivetrain==='FR'?.08:v.drivetrain==='FF'?-.08:0;return ((share+transfer)*v.weightKg*G+share*downforce(v,speed))*TIRE_MU[v.tire]}
function drive(v:Vehicle,speed:number,gear:number){const rpm=clamp(Math.max(3500,rpmAt(v,speed,gear)),1000,v.redlineRpm);return torque(v,rpm)*v.gears[gear]*v.finalDrive*EFF/R}
function cross(before:number,after:number,target:number,t:number){if(before>=target)return t;if(after<target||after<=before)return null;return t+DT*(target-before)/(after-before)}
function maxSpeed(v:Vehicle){let best=0;for(let gear=0;gear<6;gear++){const cap=shiftSpeed(v,gear);for(let s=0;s<=cap;s+=.15){if(drive(v,s,gear)>drag(v,s)+roll(v))best=Math.max(best,s)}}return best*3.6}
function braking(v:Vehicle){let s=100/3.6,d=0;for(let i=0;i<2000&&s>0;i++){const dec=(TIRE_MU[v.tire]*(v.weightKg*G+downforce(v,s))+drag(v,s)+roll(v))/v.weightKg;const next=Math.max(0,s-dec*DT);d+=(s+next)*.5*DT;s=next}return d}
export function simulate(input:Vehicle):Result {
const v=safe(input);const samples:Sample[]=[{time:0,speedKmh:0,distanceM:0,rpm:1000,gear:1}];
let speed=0,distance=0,gear=0,shiftLeft=0,t100:number|null=null,t200:number|null=null,t400:number|null=null,trap:number|null=null;
const gearPoints:GearPoint[]=v.gears.map((ratio,i)=>({gear:i+1,startKmh:i===0?0:shiftSpeed(v,i-1)*3.6,endKmh:shiftSpeed(v,i)*3.6,rpmDrop:i===0?0:v.redlineRpm*ratio/v.gears[i-1]}));
for(let i=1;i<=3600;i++){
const time=(i-1)*DT,oldSpeed=speed,oldDistance=distance;
if(gear<5&&rpmAt(v,speed,gear)>=v.redlineRpm*.995){gear++;shiftLeft=.20}
const force=shiftLeft>0?0:Math.min(drive(v,speed,gear),traction(v,speed));
shiftLeft=Math.max(0,shiftLeft-DT);
const accel=(force-drag(v,speed)-roll(v))/v.weightKg;
speed=Math.max(0,speed+accel*DT);distance+=(oldSpeed+speed)*DT/2;
if(t100===null)t100=cross(oldSpeed,speed,100/3.6,time);
if(t200===null)t200=cross(oldSpeed,speed,200/3.6,time);
if(t400===null){t400=cross(oldDistance,distance,402.336,time);if(t400!==null){const f=(t400-time)/DT;trap=(oldSpeed+(speed-oldSpeed)*f)*3.6}}
samples.push({time:i*DT,speedKmh:speed*3.6,distanceM:distance,rpm:Math.min(v.redlineRpm,Math.max(1000,rpmAt(v,speed,gear))),gear:gear+1});
if(time>25&&Math.abs(speed-oldSpeed)<.000001&&t400!==null)break;
}
return {samples,gearPoints,metrics:{zeroTo100:t100,zeroTo200:t200,quarterMile:t400,trapSpeedKmh:trap,topSpeedKmh:maxSpeed(v),lateralG:TIRE_MU[v.tire]*(1+.65*v.downforce/100*.3),brakeDistanceM:braking(v),powerToWeight:v.powerHp/(v.weightKg/1000)}};
}
