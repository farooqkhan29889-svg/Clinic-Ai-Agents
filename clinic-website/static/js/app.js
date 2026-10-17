/* ============================================================
   CityCare - browser connector (small & fixed, rarely touched)
   All business logic lives in Python (app.py / chatbot.py).
   This file only: draws UI, sends user input to Python API,
   shows what Python sends back.
   ============================================================ */
"use strict";

const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const nextDays = n => { const o=[],t=new Date(); for(let i=1;i<=n;i++){const d=new Date(t); d.setDate(t.getDate()+i); o.push(d);} return o; };
const fmt = d => DAYS[d.getDay()]+", "+d.getDate()+" "+MONS[d.getMonth()];
/* local calendar date - toISOString() is UTC and would shift the day */
const iso = d => [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"),
                  String(d.getDate()).padStart(2,"0")].join("-");
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g,
  c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials = n => n.replace("Dr. ","").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();

/* ---------- toast ---------- */
function toast(msg, type){
  let t = $(".toast");
  if(!t){ t=document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.className="toast show "+(type||"");
  t.innerHTML=(type==="ok"?"&#10004; ":type==="err"?"&#9888; ":"&#128276; ")+"<span>"+msg+"</span>";
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),3800);
}

/* ---------- navbar ---------- */
const nav=$(".navbar");
addEventListener("scroll",()=>nav&&nav.classList.toggle("scrolled",scrollY>10));
$(".hamburger")&&$(".hamburger").addEventListener("click",()=>$(".nav-links").classList.toggle("open"));
$$(".nav-links a").forEach(a=>a.addEventListener("click",()=>$(".nav-links").classList.remove("open")));
const yr=$("#year"); yr&&(yr.textContent=new Date().getFullYear());

/* ---------- doctors (data comes from Python /api/doctors) ---------- */
let DOCTORS=[];
async function loadDoctors(){
  const r=await fetch("/api/doctors"); DOCTORS=await r.json();
  const preview=$("#doctor-preview");
  if(preview) preview.innerHTML=DOCTORS.slice(0,3).map(docCard).join("");
  const grid=$("#doctor-grid");
  if(grid){
    grid.innerHTML=DOCTORS.map(docCard).join("");
    const specs=["All",...new Set(DOCTORS.map(d=>d.spec))];
    const row=$("#filter-row");
    row.innerHTML=specs.map(s=>`<button class="fchip ${s==="All"?"on":""}" data-s="${s}">${s}</button>`).join("");
    row.onclick=e=>{
      const b=e.target.closest(".fchip"); if(!b)return;
      row.querySelectorAll(".fchip").forEach(c=>c.classList.remove("on")); b.classList.add("on");
      const s=b.dataset.s;
      grid.innerHTML=(s==="All"?DOCTORS:DOCTORS.filter(d=>d.spec===s)).map(docCard).join("");
    };
  }
}
function docCard(d){
  return `<div class="doc-card">
    <div class="doc-avatar" style="background:${d.color}">${initials(d.name)}</div>
    <h3>${d.name}</h3>
    <div class="doc-spec">${d.spec}</div>
    <div class="doc-meta"><span>${d.exp} yrs exp</span><span>&middot;</span><span>${d.slots.length} slots/day</span></div>
    <p class="doc-about">${d.about}</p>
    <div class="doc-foot">
      <div class="doc-fee num">&#8377;${d.fee}<small>per consultation</small></div>
      <a class="btn btn-primary btn-sm" href="/appointment?doc=${d.id}">Book &#128197;</a>
    </div></div>`;
}
const doctorsReady = loadDoctors();

/* ---------- booking wizard ---------- */
(function(){
  const panel=$("#wizard"); if(!panel) return;
  const bk={doctor_id:null,date:null,time:null,name:"",phone:"",email:"",reason:"",id:null};
  let step=1;
  let AVAIL=null;              /* {date, free:[times]} from /api/availability */
  const q=new URLSearchParams(location.search).get("doc");
  if(q) bk.doctor_id=+q;
  const stepNames=["Doctor","Date & time","Your details","Confirmed"];

  const dots=()=>`<div class="wiz-steps">${[1,2,3,4].map(i=>
      `<div class="wiz-dot ${i<step?"done":i===step?"on":""}">${i<step?"&#10004;":i}</div>${i<4?`<div class="wiz-line ${i<step?"done":""}"></div>`:""}`).join("")}</div>
    <div class="wiz-step-labels">${stepNames.map((s,i)=>`<span class="${i+1===step?"on":""}">${s}</span>`).join("")}</div>`;

  const note = msg => `<p style="color:var(--ink-3);font-size:14px;">${msg}</p>`;

  /* real availability from /api/availability, not a cosmetic guess */
  function slotsBlock(doc){
    if(bk.date===null) return note("Select a date to see slots.");
    const day=iso(nextDays(10)[bk.date]);
    if(!AVAIL || AVAIL.date!==day) return note("Checking live availability...");
    if(!AVAIL.free.length) return note("No free slots on this date - please pick another day.");
    return doc.slots.map(s=>{
      const free=AVAIL.free.includes(s);
      return `<button class="slot ${bk.time===s?"on":""} ${free?"":"off"}" data-s="${s}"${free?"":" disabled"}>${s}</button>`;
    }).join("");
  }

  async function loadAvailability(){
    AVAIL=null; bk.time=null; render();
    const day=iso(nextDays(10)[bk.date]);
    try{
      const r=await fetch(`/api/availability?doctor_id=${bk.doctor_id}&date=${encodeURIComponent(day)}`);
      const d=await r.json();
      AVAIL={date:day, free:(d && d.free) || []};
    }catch(e){
      /* network trouble: show the doctor's full list - the server still validates */
      const doc=DOCTORS.find(x=>x.id===bk.doctor_id) || {slots:[]};
      toast("Could not check live availability","err");
      AVAIL={date:day, free:doc.slots};
    }
    render();
  }

  function render(){
    let body="";
    if(step===1){
      body=`<h3>Select a doctor</h3><div class="pick-grid">`+DOCTORS.map(d=>
        `<button class="pick-card ${bk.doctor_id===d.id?"on":""}" data-id="${d.id}">
           <div class="doc-avatar" style="background:${d.color}">${initials(d.name)}</div>
           <div><b>${d.name}</b><span>${d.spec} &middot; &#8377;${d.fee}</span></div></button>`).join("")+`</div>`;
    }else if(step===2){
      const days=nextDays(10), doc=DOCTORS.find(d=>d.id===bk.doctor_id);
      body=`<h3>${doc.name} - pick a date</h3><div class="date-strip">`+
        days.map((d,i)=>`<button class="date-cell ${bk.date===i?"on":""}" data-i="${i}">
          <span>${DAYS[d.getDay()]}</span><b class="num">${d.getDate()}</b><span>${MONS[d.getMonth()]}</span></button>`).join("")+`</div>
        <h3>Available slots</h3><div class="slot-grid">`+slotsBlock(doc)+`</div>`;
    }else if(step===3){
      body=`<h3>Patient details</h3><div class="form-grid">
        <div class="field"><label>Full name *</label><input id="f-name" value="${esc(bk.name)}" placeholder="e.g. Ravi Kumar"><div class="err">Enter your name</div></div>
        <div class="field"><label>Mobile (10 digits) *</label><input id="f-phone" class="num" maxlength="10" value="${esc(bk.phone)}" placeholder="98765 43210"><div class="err">Enter a valid 10-digit number</div></div>
        <div class="field"><label>Email (optional)</label><input id="f-email" value="${esc(bk.email)}" placeholder="you@email.com"></div>
        <div class="field"><label>Reason for visit (optional)</label><input id="f-reason" value="${esc(bk.reason)}" placeholder="e.g. fever since 2 days"></div></div>
        <div class="reminder-note">&#128276;<span>Instant <b>WhatsApp + SMS</b> confirmation, then automatic reminders <b>24h</b> and <b>2h</b> before your visit.</span></div>`;
    }else{
      const d=nextDays(10)[bk.date], doc=DOCTORS.find(x=>x.id===bk.doctor_id);
      body=`<div class="success-wrap">
        <div class="success-icon">&#10004;</div>
        <h3>Appointment confirmed</h3>
        <div class="bid num">${bk.id}</div>
        <div class="review-box">
          <div class="hc-row"><span>Doctor</span><b>${doc.name} &middot; ${doc.spec}</b></div>
          <div class="hc-row"><span>When</span><b class="num">${fmt(d)} &middot; ${bk.time}</b></div>
          <div class="hc-row"><span>Patient</span><b>${esc(bk.name)}</b></div>
          <div class="hc-row"><span>Fee</span><b class="num">&#8377;${doc.fee}</b></div></div>
        <div class="msg-preview"><b>WhatsApp + SMS sent by Python</b>
          Hi ${esc(bk.name.split(" ")[0])}, your appointment with ${doc.name} is confirmed for ${fmt(d)} at ${bk.time}. Booking ID ${bk.id}. Reply C to cancel. - CityCare<br>
          <small style="color:var(--ink-3)">Check your terminal - reminders.py printed the real message there in demo mode.</small></div>
        <div class="wiz-nav">
          <a class="btn btn-outline" href="/" style="flex:1;justify-content:center;">Back to home</a>
          <a class="btn btn-wa" style="flex:1;justify-content:center;" target="_blank" rel="noopener"
             href="https://wa.me/919876543210?text=${encodeURIComponent("Hi, I booked appointment "+bk.id)}">Chat on WhatsApp</a>
        </div></div>`;
    }
    const navBtns=step<4?`<div class="wiz-nav">
        ${step>1?'<button class="btn btn-outline" id="w-back">Back</button>':""}
        <button class="btn btn-primary btn-block" id="w-next">${step===3?"Confirm booking":"Continue"}</button></div>`:"";
    panel.innerHTML=dots()+'<div class="wiz-panel">'+body+navBtns+'</div>';
    bind();
  }

  function bind(){
    $$(".pick-card").forEach(c=>c.onclick=()=>{bk.doctor_id=+c.dataset.id;AVAIL=null;render();});
    $$(".date-cell").forEach(c=>c.onclick=()=>{bk.date=+c.dataset.i;loadAvailability();});
    $$(".slot:not(.off)").forEach(c=>c.onclick=()=>{bk.time=c.dataset.s;render();});
    const back=$("#w-back"); back&&(back.onclick=()=>{step--;render();});
    const next=$("#w-next");
    next&&(next.onclick=async()=>{
      if(step===1){ if(!bk.doctor_id) return toast("Please select a doctor first","err"); step=2; }
      else if(step===2){
        if(bk.date===null) return toast("Pick a date","err");
        if(!bk.time) return toast("Pick a time slot","err");
        step=3;
      }else if(step===3){
        bk.name=$("#f-name").value.trim(); bk.phone=$("#f-phone").value.trim();
        bk.email=$("#f-email").value.trim(); bk.reason=$("#f-reason").value.trim();
        let ok=true;
        const mark=(id,bad)=>{$(id).closest(".field").classList.toggle("invalid",bad); if(bad)ok=false;};
        mark("#f-name",bk.name.length<3);
        mark("#f-phone",!/^\d{10}$/.test(bk.phone));
        if(!ok) return toast("Please fix the highlighted fields","err");
        const d=nextDays(10)[bk.date];
        next.disabled=true; next.textContent="Booking...";
        const r=await fetch("/api/book",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({doctor_id:bk.doctor_id,date:iso(d),time:bk.time,name:bk.name,phone:bk.phone,email:bk.email,reason:bk.reason})});
        const data=await r.json();
        next.disabled=false; next.textContent="Confirm booking";
        if(!data.ok){
          toast(data.error,"err");
          if(r.status===409){ step=2; loadAvailability(); return; }  /* slot went - re-pick */
          return;
        }
        bk.id=data.booking_id; step=4;
        setTimeout(()=>toast("WhatsApp + SMS confirmation sent to +91 "+bk.phone,"ok"),600);
      }
      render();
    });
  }
  /* wait for doctors to load before first render */
  doctorsReady.then(render);
})();

/* ---------- AI chat (brain lives in Python /api/chat) ---------- */
(function(){
  const fab=document.createElement("button");
  fab.className="chat-fab"; fab.innerHTML='<span class="pulse"></span>&#129302;'; fab.title="Chat with us";
  document.body.appendChild(fab);
  const win=document.createElement("div");
  win.className="chat-window closed";
  win.innerHTML=`
    <div class="chat-head">
      <div class="chat-av">AI</div>
      <div><b>Carebot assistant</b><small>Online - replies instantly</small></div>
      <button class="chat-close" aria-label="Close">&#10005;</button>
    </div>
    <div class="chat-log" id="chat-log"></div>
    <div class="chat-chips" id="chat-chips"></div>
    <div class="chat-input">
      <input id="chat-in" placeholder="Ask about doctors, fees, timings..." autocomplete="off">
      <button class="chat-send" aria-label="Send">&#10148;</button>
    </div>`;
  document.body.appendChild(win);
  const log=win.querySelector("#chat-log"),chips=win.querySelector("#chat-chips"),input=win.querySelector("#chat-in");
  const SID="s"+Math.random().toString(36).slice(2,10);
  const QUICK=["Book appointment","Doctors","Fees","Timings"];

  fab.onclick=()=>{
    win.classList.toggle("closed");
    if(!win.classList.contains("closed")&&!log.children.length){
      ask("Hi","__hello__");   /* server greets back */
    }
  };
  win.querySelector(".chat-close").onclick=()=>win.classList.add("closed");
  chips.innerHTML=QUICK.map(q=>`<button>${q}</button>`).join("");
  chips.onclick=e=>{
    const b=e.target.closest("button");
    if(b) userSay(b.textContent==="Book appointment"?"I want to book an appointment":b.textContent);
  };
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&input.value.trim()){userSay(input.value.trim());input.value="";}});
  win.querySelector(".chat-send").onclick=()=>{if(input.value.trim()){userSay(input.value.trim());input.value="";}};

  function addMsg(html,who){const m=document.createElement("div");m.className="chat-msg "+who;m.innerHTML=html;log.appendChild(m);log.scrollTop=log.scrollHeight;}
  function addActs(acts){
    if(!acts||!acts.length)return;
    const w=document.createElement("div");w.className="chat-acts";
    w.innerHTML=acts.map(a=>`<button data-m="${a.m.replace(/"/g,"&quot;")}">${a.t}</button>`).join("");
    w.onclick=e=>{const b=e.target.closest("button");if(b)userSay(b.dataset.m);};
    log.appendChild(w);log.scrollTop=log.scrollHeight;
  }
  function typing(cb){
    const t=document.createElement("div");t.className="typing";t.innerHTML="<i></i><i></i><i></i>";
    log.appendChild(t);log.scrollTop=log.scrollHeight;
    setTimeout(()=>{t.remove();cb();},650+Math.random()*550);
  }
  async function ask(message){
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({session_id:SID,message})});
    return r.json();
  }
  async function userSay(text){
    addMsg(esc(text),"me");
    typing(async()=>{const d=await ask(text);addMsg(d.reply,"bot");addActs(d.actions);});
  }
})();
