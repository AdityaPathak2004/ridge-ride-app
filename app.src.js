import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { DATA, DEFAULTS, ROUTE_MODEL, addDays, conflicts, daily, dateLabel, epoch, localParts, ready, time, upcoming } from './schedule.js';
const $=id=>document.getElementById(id);
const storage={get(k){try{return localStorage.getItem(k);}catch{return null;}},set(k,v){try{localStorage.setItem(k,v);}catch{}}};
const settings={...DEFAULTS};
let direction=storage.get('ridge-direction')==='home'?'home':'campus';let selectedRoute='campus';let plan=null;
function when(t,now){const d=localParts(new Date(t.at));return d.date===localParts(new Date(now)).date?'Today':dateLabel(d.date);}
function rows(trips,now){return trips.map((t,i)=>{const p=localParts(new Date(t.at));const mins=Math.max(0,Math.ceil((t.at-now)/60000));return `<div class="trip-row"><div><strong>${time(p.minute)}</strong><small>${when(t,now)}${t.estimated?' · Estimated':''}${t.uncertain?' · Red time: unconfirmed':''}${t.arrival?` · Est. arrival ${time(localParts(new Date(t.arrival)).minute)}${localParts(new Date(t.arrival)).date!==p.date?' next day':''}`:''}</small></div><span class="badge">${mins===0?'Scheduled now':mins<60?`${mins} min`:i===0?'Next bus':'Later'}</span></div>`;}).join('');}
function setDirection(value){direction=value;storage.set('ridge-direction',value);render();if(plan)renderPlan();}
function render(){const now=Date.now(),p=localParts();$('today').textContent=dateLabel(p.date);$('campusDirection').setAttribute('aria-pressed',direction==='campus');$('homeDirection').setAttribute('aria-pressed',direction==='home');$('nextLabel').textContent=direction==='campus'?'NEXT AT THE VILLAS':'NEXT FROM COLLEGE · ESTIMATE';$('fromStop').textContent=direction==='campus'?'Villas at Chestnut Ridge':'College · stop to confirm';$('toStop').textContent=direction==='campus'?'College · stop to confirm':'Villas at Chestnut Ridge';const trips=upcoming(now,direction,settings);const next=trips[0];
if(false){}
else if(next){const np=localParts(new Date(next.at)),mins=Math.max(0,Math.ceil((next.at-now)/60000));let title=mins===0?'Scheduled now':mins<60?`${mins} <small>min away</small>`:mins<1440?`${Math.floor(mins/60)}<small>h</small> ${mins%60}<small>m away</small>`:`${Math.floor(mins/1440)} <small>days away</small>`;const ended=np.date!==p.date;$('hero').innerHTML=`<div class="countdown"${mins===0?' style="font-size:40px;letter-spacing:-1px"':''}>${title}</div><p class="departure">${ended?'Next service · ':''}${time(np.minute)}${ended?' · '+dateLabel(np.date):' today'}${direction==='home'?' · estimated':''}</p>${ended?'<p class="small">No more scheduled trips today.</p>':''}`;$('upcoming').innerHTML=rows(trips,now);}
else{$('hero').innerHTML='<h2 class="hero-empty">No scheduled trips</h2>';$('upcoming').innerHTML='<p class="empty">Check the schedule or your settings.</p>';}
const c=conflicts(settings);$('assumptions').textContent=`Automatic route estimate: ${ROUTE_MODEL.minutes} minutes from the Villas to the campus loop and back, inferred from ${ROUTE_MODEL.matches}/${ROUTE_MODEL.observations} matching Saturday observations (${Math.round(ROUTE_MODEL.confidence*100)}% smoothed pattern confidence). College departures are estimated; red weekday trips are skipped.`+(c.length?` ${c.length} turnaround conflicts were detected.`:'');
const printed=DATA.villas.map(m=>({base:m,minute:m+settings.villasWait+(direction==='home'&&ready(settings)?settings.outbound+settings.wait:0)}));$('fullSchedule').innerHTML=printed.map(t=>{const br=DATA.breaks.includes(t.base);return `<span class="time-cell${br?' break':next&&next.base===t.base&&next.serviceDate===p.date?' highlight':''}" title="${br?'Red break marker; '+(settings.breakMode==='skip'?'trip skipped':'boarding uncertain'):direction==='home'?'Estimated college departure':'Printed Villas boarding time'}">${br?'Ⅱ ':''}${time(t.minute)}${t.minute>=1440?' +1d':''}</span>`;}).join('');
$('connection').textContent=navigator.onLine?'Timetable · not live tracking':'Offline · using the saved timetable';}
function renderPlan(){if(!plan)return;const at=epoch(plan.date,plan.minute);const trips=upcoming(at,direction,settings,3,true);$('planResults').innerHTML=(trips[0]&&localParts(new Date(trips[0].at)).date!==plan.date?'<p class="small muted">No trips after your selected time that day. Next available service:</p>':'')+rows(trips,at)+'<p class="small muted">Uses the weekly pattern; holidays and service changes are unconfirmed. Red break trips are excluded.</p>';}
$('campusDirection').onclick=()=>setDirection('campus');$('homeDirection').onclick=()=>setDirection('home');
$('alarmBtn').onclick=()=>{
  const trips = upcoming(Date.now(), direction, settings);
  const next = trips[0];
  if(!next) return alert("No upcoming trips to set an alarm for.");

  function scheduleAlarm() {
    const alarmTime = next.at - (10 * 60 * 1000);
    const msUntilAlarm = alarmTime - Date.now();
    const depTime = time(localParts(new Date(next.at)).minute);
    
    if (msUntilAlarm > 0) {
      new Notification("Alarm Set!", { body: `We'll remind you 10 mins before the ${depTime} shuttle.`, icon: 'clean_bus.svg' });
      setTimeout(() => {
        new Notification("Shuttle Departing Soon", { body: `Your shuttle departs at ${depTime}. Time to get ready!`, icon: 'clean_bus.svg' });
      }, msUntilAlarm);
    } else {
      new Notification("Shuttle Departing Now", { body: `Your shuttle departs at ${depTime}!`, icon: 'clean_bus.svg' });
    }

    const p=$('alarmPopup');
    p.classList.remove('hidden');
    void p.offsetWidth;
    p.classList.add('show');
    setTimeout(()=>{
      p.classList.remove('show');
      setTimeout(()=>p.classList.add('hidden'), 300);
    }, 2000);
  }

  const handlePermission = (permission) => {
    if (permission === "granted") scheduleAlarm();
  };

  if (Capacitor.isNativePlatform()) {
    LocalNotifications.requestPermissions().then((result) => {
      if (result.display === 'granted') {
        const alarmTime = next.at - (10 * 60 * 1000);
        const depTime = time(localParts(new Date(next.at)).minute);
        
        LocalNotifications.schedule({
          notifications: [{
            title: "Shuttle Departing Soon",
            body: `Your shuttle departs at ${depTime}. Time to get ready!`,
            id: 1,
            schedule: { at: new Date(alarmTime > Date.now() ? alarmTime : Date.now() + 1000) }
          }]
        });

        const p=$('alarmPopup');
        p.classList.remove('hidden');
        void p.offsetWidth;
        p.classList.add('show');
        setTimeout(()=>{ p.classList.remove('show'); setTimeout(()=>p.classList.add('hidden'), 300); }, 2000);
      }
    });
  } else {
    // Web fallback
    if (!("Notification" in window)) {
      alert("This browser does not support web notifications.");
    } else if (Notification.permission === "granted") {
      scheduleAlarm();
    } else if (Notification.permission !== "denied") {
      const permPromise = Notification.requestPermission(handlePermission);
      if (permPromise) {
        permPromise.then(handlePermission);
      }
    } else {
      alert("Please enable notifications in your browser settings to use the alarm.");
    }
  }
};
$('showTimetableBtn').onclick=()=>{
  const p=$('timetablePopup');
  p.classList.remove('hidden');
  void p.offsetWidth;
  p.classList.add('show');
};
$('closeTimetableBtn').onclick=()=>{
  const p=$('timetablePopup');
  p.classList.remove('show');
  setTimeout(()=>p.classList.add('hidden'), 300);
};
function setRoute(r){selectedRoute=r;$('campus').hidden=r!=='campus';$('market').hidden=r!=='market';$('weekdayTab').setAttribute('aria-pressed',r==='campus');$('marketTab').setAttribute('aria-pressed',r==='market');}
$('weekdayTab').onclick=()=>setRoute('campus');$('marketTab').onclick=()=>setRoute('market');
$('marketStops').innerHTML=DATA.market.stops.map((s,i)=>`<span>${i+1}. ${s}</span>`).join('');$('marketTable').innerHTML=DATA.market.rows.map((row,i)=>`<section class="market-round"><h3>${i===3?'Final printed round · boarding unconfirmed':`Round ${i+1}`}</h3><div class="market-grid">${row.map((m,j)=>`<div${i===2&&j<2?' class="red"':''}><small>${DATA.market.stops[j]}</small><strong>${m===null?'—':time(m)}</strong>${i===2&&j<2?'<em>Final departure</em>':''}</div>`).join('')}</div></section>`).join('');
const p=localParts();$('planDate').value=p.date;$('planTime').value=`${String(Math.floor(p.minute/60)).padStart(2,'0')}:${String(p.minute%60).padStart(2,'0')}`;$('plannerForm').onsubmit=e=>{e.preventDefault();const [h,m]=$('planTime').value.split(':').map(Number);plan={date:$('planDate').value,minute:h*60+m};renderPlan();};
render();setInterval(render,1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});window.addEventListener('pageshow',render);window.addEventListener('online',render);window.addEventListener('offline',render);
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
const mc=document.modelContext;if(mc?.registerTool){try{Promise.resolve(mc.registerTool({name:'plan_shuttle_trip',title:'Plan a shuttle trip',description:'Set direction, date and ready-at time, and display the next three weekday departures using the automatic 5-minute campus route estimate.',inputSchema:{type:'object',properties:{direction:{type:'string',enum:['campus','home']},date:{type:'string',description:'YYYY-MM-DD in America/New_York'},time:{type:'string',description:'HH:MM, 24-hour Eastern time'}},required:['direction','date','time'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!['campus','home'].includes(input.direction)||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)||Number.isNaN(Date.parse(input.date+'T12:00:00Z'))||new Date(input.date+'T12:00:00Z').toISOString().slice(0,10)!==input.date)throw new Error('Provide a valid direction, date, and time.');const [h,m]=input.time.split(':').map(Number);setRoute('campus');setDirection(input.direction);$('planDate').value=input.date;$('planTime').value=input.time;plan={date:input.date,minute:h*60+m};renderPlan();return {requiresTravelTimes:false,routeEstimateMinutes:ROUTE_MODEL.minutes,patternConfidence:ROUTE_MODEL.confidence,departures:upcoming(epoch(plan.date,plan.minute),direction,settings,3,true).map(t=>({departure:new Date(t.at).toISOString(),estimated:t.estimated})),timezone:DATA.timezone};}})).catch(()=>{});}catch{}}
