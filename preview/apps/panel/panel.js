const ICONS = { sun:"☀️", partly:"⛅", cloud:"☁️", rain:"🌧️", storm:"⛈️", snow:"❄️", fog:"🌫️" };
let DATA = window.PANEL_MOCK;            // se sustituye por datos reales en Fase 3
let viewMonth = new Date(2026, 5, 1);    // mes visible; en runtime = mes actual
let selDay = null;

function pad(n){ return (n<10?"0":"")+n; }

function renderWeather(){
  const el = document.getElementById("wdays"); el.innerHTML = "";
  (DATA.weather?.days||[]).forEach(d=>{
    el.insertAdjacentHTML("beforeend",
      `<div class="wday"><div class="dow">${d.dow}</div><div class="ic">${ICONS[d.icon]||"❓"}</div>
       <div class="temp">${d.max}°<span class="min"> / ${d.min}°</span></div>
       <div class="rain">💧 ${d.rainProb}%</div></div>`);
  });
  document.getElementById("wcity").textContent = DATA.weather?.city || "Vigo";
}

function renderRace(){
  const races = (DATA.races && DATA.races.length) ? DATA.races : (DATA.race ? [DATA.race] : []);
  const el = document.getElementById("raceList");
  if(!races.length){ el.innerHTML = "<div class='dim'>—</div>"; return; }
  const now = new Date();
  el.innerHTML = races.map(r=>{
    const diff = new Date(r.startUtc) - now;
    const dd = Math.max(0,Math.floor(diff/86400000)), hh = Math.max(0,Math.floor((diff%86400000)/3600000));
    const cd = diff>0 ? `faltan ${dd}d ${hh}h` : "¡en curso!";
    const lg = r.league ? ` <span class="lg">· liga ${r.league.pos}º (${r.league.pts}pts)</span>` : "";
    return `<div class="raceItem"><div class="rname">${r.series} · ${r.name}</div><div class="rcd">${cd}${lg}</div></div>`;
  }).join("");
}

function renderShop(){
  document.getElementById("shopList").innerHTML =
    (DATA.shopping||[]).slice(0,8).map(x=>`<li>${x}</li>`).join("") || "<li class='dim'>—</li>";
}

function renderClock(){
  const n = new Date();
  document.getElementById("clock").textContent = pad(n.getHours())+":"+pad(n.getMinutes());
  document.getElementById("cdate").textContent =
    n.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  document.body.classList.toggle("night", n.getHours()>=0 && n.getHours()<7);
}

let lastGood = window.PANEL_MOCK;
async function refreshData(){
  const c = window.PANEL_CFG; if(!c){ return; }
  const month = ymd(viewMonth).slice(0,7);
  try{
    const res = await fetch(`${c.READ_URL}?token=${encodeURIComponent(c.TOKEN)}&month=${month}`,{cache:"no-store"});
    if(!res.ok) throw new Error(res.status);
    const j = await res.json();
    if(j && j.error) throw new Error(j.error);
    DATA = j; lastGood = j;
    document.getElementById("offline").classList.remove("show");
  }catch(e){
    DATA = lastGood;                       // mantener último dato bueno
    document.getElementById("offline").classList.add("show");
  }
  renderWeather(); renderRace(); renderShop(); renderCalendar();
}

function init(){
  viewMonth = new Date(); viewMonth.setDate(1);     // mes actual
  renderWeather(); renderRace(); renderShop(); renderClock(); renderCalendar(); // pinta mock al instante
  refreshData();                                    // y trae datos reales
  setInterval(renderClock, 1000);
  setInterval(refreshData, (window.PANEL_CFG && window.PANEL_CFG.REFRESH_MS) || 300000);
}
document.addEventListener("DOMContentLoaded", init);

const DOW = ["L","M","X","J","V","S","D"];
function ymd(d){ return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }

function renderCalendar(){
  const grid = document.getElementById("calGrid");
  const y = viewMonth.getFullYear(), m = viewMonth.getMonth();
  document.getElementById("calTitle").textContent =
    viewMonth.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const events = (DATA.calendar?.events)||[];
  const hasEvt = new Set(events.map(e=>e.date));
  const first = new Date(y,m,1);
  const startIdx = (first.getDay()+6)%7;          // lunes=0
  const daysInMonth = new Date(y,m+1,0).getDate();
  const todayStr = ymd(new Date());
  grid.innerHTML = DOW.map(d=>`<div class="cal-dow">${d}</div>`).join("");
  for(let i=0;i<startIdx;i++) grid.insertAdjacentHTML("beforeend",`<div class="cal-cell dim"></div>`);
  for(let day=1;day<=daysInMonth;day++){
    const ds = y+"-"+pad(m+1)+"-"+pad(day);
    const cls = ["cal-cell", ds===todayStr?"today":"", ds===selDay?"sel":""].join(" ");
    grid.insertAdjacentHTML("beforeend",
      `<div class="${cls}" data-date="${ds}">${day}${hasEvt.has(ds)?'<span class="dot"></span>':''}</div>`);
  }
}

function moveSel(deltaDays){
  const base = selDay ? new Date(selDay) : new Date();
  base.setDate(base.getDate()+deltaDays);
  if(base.getMonth()!==viewMonth.getMonth()||base.getFullYear()!==viewMonth.getFullYear()){
    viewMonth = new Date(base.getFullYear(), base.getMonth(), 1);
    if(typeof refreshData==="function") refreshData();   // Fase 3: re-pedir mes
  }
  selDay = ymd(base); renderCalendar();
}

document.addEventListener("keydown", (e)=>{
  if(document.getElementById("dayModal").classList.contains("show")) return; // modal gestiona sus teclas
  switch(e.keyCode){
    case 37: e.preventDefault(); moveSel(-1); break;   // ←
    case 39: e.preventDefault(); moveSel(1);  break;   // →
    case 38: e.preventDefault(); moveSel(-7); break;   // ↑
    case 40: e.preventDefault(); moveSel(7);  break;   // ↓
    case 13: e.preventDefault(); if(selDay) openDay(selDay); break; // OK (Task 4.x)
  }
});
document.querySelectorAll("[data-nav]").forEach(b=>{
  b.onclick=()=>{ viewMonth.setMonth(viewMonth.getMonth()+parseInt(b.dataset.nav,10));
    if(typeof refreshData==="function") refreshData(); renderCalendar(); };
});
// --- Modal del día: ver/añadir/borrar notas y citas ---
async function saveEvent(ev){
  const c = window.PANEL_CFG; if(!c) return;
  try{
    await fetch(`${c.WRITE_URL}?token=${encodeURIComponent(c.TOKEN)}`,{
      method:"POST", headers:{"Content-Type":"text/plain"}, body:JSON.stringify(ev)});
  }catch(e){ /* offline: el refresh mostrará el indicador */ }
  await refreshData();
}

function openDay(date){
  const box = document.getElementById("modalBox");
  const pretty = new Date(date+"T00:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"});
  const evs = (DATA.calendar?.events||[]).filter(e=>e.date===date)
              .sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  box.innerHTML =
    `<h2>${pretty}</h2>` +
    (evs.map(e=>`<div class="evt"><span>${e.type==="cita"&&e.time?e.time+" · ":""}${e.text}</span>`+
      `<button data-del="${e.id}">🗑️</button></div>`).join("")
      || "<div class='dim' style='font-size:28px;padding:10px 0'>Sin notas ni citas</div>") +
    `<div style="margin-top:20px;display:flex;gap:10px;align-items:center">
       <select id="evType"><option value="nota">Nota</option><option value="cita">Cita</option></select>
       <input id="evTime" placeholder="hh:mm" maxlength="5" style="width:120px">
       <input id="evText" placeholder="Escribe aquí…" style="flex:1">
       <button id="evAdd">➕ Añadir</button>
     </div>
     <div class="dim" style="margin-top:14px;font-size:22px">Pulsa ATRÁS en el mando para cerrar</div>`;
  document.getElementById("dayModal").classList.add("show");

  const txt = box.querySelector("#evText"); if(txt) txt.focus();
  async function doAdd(){
    const t = box.querySelector("#evText").value.trim(); if(!t) return;
    await saveEvent({ action:"add", date,
      type: box.querySelector("#evType").value,
      time: box.querySelector("#evTime").value || null,
      text: t, createdBy:"tv" });
    openDay(date);                          // re-render con el nuevo evento
  }
  box.querySelector("#evAdd").onclick = doAdd;
  txt.addEventListener("keydown", e=>{ if(e.keyCode===13){ e.stopPropagation(); doAdd(); } });
  box.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = async ()=>{ await saveEvent({action:"delete", id:b.dataset.del}); openDay(date); };
  });
}
function closeDay(){ document.getElementById("dayModal").classList.remove("show"); }

// Atrás (461) cierra el modal cuando está abierto
document.addEventListener("keydown",(e)=>{
  if(e.keyCode===461 && document.getElementById("dayModal").classList.contains("show")){
    e.preventDefault(); closeDay();
  }
});
