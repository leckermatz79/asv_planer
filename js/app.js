/* =========================================
   THERAPY PLANNER – CLEAN ARCHITECTURE V2
   (Header + FollowUp + GCSF + Full DrugColors)
========================================= */

(() => {

  /* =========================================
     STATE
  ========================================= */

  const AppState = {
    schemas: {},
    currentSchema: null,
    currentFollowSchema: null
  };

  const DOM = {};

  document.addEventListener("DOMContentLoaded", init);

  function init(){
    loadSchemas();
    cacheDom();
    initDrugColors();
    populateSchemaDropdowns();
    registerEventListeners();
    updateUIVisibility();
  }

  function loadSchemas(){
    AppState.schemas = JSON.parse(
      document.getElementById("schemas").textContent
    );
  }

  function cacheDom(){
    const ids=[
      "therapyForm","schemaInput","schemaList",
      "hasFollowUp","followUpSelect","followUpWrapper",
      "gcsfEnabled","gcsfRow","gcsfSelect","gcsfDay",
      "gcsfEnabledFollow","gcsfRowFollow","gcsfSelectFollow","gcsfDayFollow",
      "plan","graphic","table","patient",
      "vorname","nachname","geburt","startdatum"
    ];
    ids.forEach(id=>DOM[id]=document.getElementById(id));
  }

  /* =========================================
     DRUG COLORS (FULL REGISTRY)
  ========================================= */

  let drugColors={};

  function initDrugColors(){
    drugColors={
      "Paclitaxel":"#059669",
      "Nab-Paclitaxel":"#047857",
      "Docetaxel":"#0d9488",
      "Cyclophosphamid":"#2563eb",
      "Epirubicin":"#b91c1c",
      "Carboplatin":"#f59e0b",
      "Cisplatin":"#d97706",
      "Trastuzumab":"#7c3aed",
      "Pertuzumab":"#a21caf",
      "T-DM1":"#be185d",
      "Pembrolizumab":"#8b5cf6",
      "Atezolizumab":"#9333ea"
    };
  }

  function getDrugColor(drug){
    return drugColors[drug]||"#6b7280";
  }

  /* =========================================
     DROPDOWNS
  ========================================= */

  function populateSchemaDropdowns(){
    Object.entries(AppState.schemas).forEach(([key,schema])=>{
      const opt=document.createElement("option");
      opt.value=schema.label;
      opt.dataset.key=key;
      DOM.schemaList.appendChild(opt);

      const followOpt=document.createElement("option");
      followOpt.value=key;
      followOpt.textContent=schema.label;
      DOM.followUpSelect.appendChild(followOpt);
    });
  }

  /* =========================================
     EVENTS
  ========================================= */

  function registerEventListeners(){
    DOM.hasFollowUp.addEventListener("change",updateUIVisibility);
    DOM.gcsfEnabled.addEventListener("change",updateUIVisibility);
    DOM.gcsfEnabledFollow.addEventListener("change",updateUIVisibility);
    DOM.therapyForm.addEventListener("submit",submitHandler);
  }

  function updateUIVisibility(){
    DOM.followUpWrapper.style.display=
      DOM.hasFollowUp.checked?"block":"none";

    DOM.gcsfRow.style.display=
      DOM.gcsfEnabled.checked?"grid":"none";

    DOM.gcsfRowFollow.style.display=
      (DOM.hasFollowUp.checked&&DOM.gcsfEnabledFollow.checked)
        ?"grid":"none";
  }

  /* =========================================
     BUILD CYCLES
  ========================================= */

  function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x;}

  function buildCycles(startDate,schema,gcsfConfig=null){
    const cycles=[];

    for(let c=0;c<schema.anzahl_zyklen;c++){
      const cycleStart=addDays(startDate,c*schema.zyklus_tage);
      const days=Array.from({length:schema.zyklus_tage},(_,i)=>({
        day:i+1,
        date:addDays(cycleStart,i),
        events:[]
      }));

      schema.events.forEach(ev=>{
        if(ev.day)days[ev.day-1].events.push(ev);
      });

      if(gcsfConfig){
        if(gcsfConfig.multipleDays){
          gcsfConfig.multipleDays.forEach(d=>{
            if(days[d-1])days[d-1].events.push({
              type:"injection",
              drug:gcsfConfig.drug
            });
          });
        }else{
          const d=gcsfConfig.day;
          if(days[d-1])days[d-1].events.push({
            type:"injection",
            drug:gcsfConfig.drug
          });
        }
      }

      cycles.push({index:c+1,days});
    }

    return cycles;
  }

  /* =========================================
     HEADER RENDER
  ========================================= */

  function renderHeader(title,startDate){
    const birth=DOM.geburt.value||"—";

    DOM.patient.innerHTML=`
      <div style="border-bottom:2px solid #333;margin-bottom:20px;padding-bottom:10px;">
        <h1 style="margin:0 0 10px 0;color:#2563eb;font-size:1.8rem;">
          Therapieplan: ${title}
        </h1>
        <p style="margin:0;font-size:1.1rem;line-height:1.5;">
          <strong>Patient:</strong> ${DOM.vorname.value} ${DOM.nachname.value} |
          <strong>Geburtsdatum:</strong> ${birth}<br>
          <strong>Datum erste Therapie:</strong> ${startDate.toLocaleDateString(window.localeMap[currentLang])}<br>
          <span style="font-size:0.9rem;color:#666;">
            Erstellt am: ${new Date().toLocaleDateString(window.localeMap[currentLang])}
          </span>
        </p>
      </div>`;
  }

  /* =========================================
     GRAPHIC RENDER
  ========================================= */

  function renderGraphic(cycle){
    let html=`<div class="grid">`;

    cycle.days.forEach(d=>{
      const therapies=d.events.filter(e=>e.type==="therapy");
      const injections=d.events.filter(e=>e.type==="injection");

      let bars="";
      if(therapies.length){
        bars=`<div class="therapy-bars">`+
          therapies.map(t=>
            `<div class="bar" style="background:${getDrugColor(t.drug)}">${t.short||t.drug[0]}</div>`
          ).join("")+
        `</div>`;
      }

      let inj="";
      if(injections.length){
        inj=`<div style="margin-top:6px;font-size:0.8rem;color:#0ea5e9;">💉 ${injections.map(i=>i.drug).join(", ")}</div>`;
      }

      html+=`
        <div class="day">
          ${bars}
          <div class="day-content">
            ${inj}
            <div class="day-label">d${d.day}</div>
          </div>
        </div>`;
    });

    html+=`</div>`;
    DOM.graphic.innerHTML=html;
  }

  /* =========================================
     TABLE
  ========================================= */

  function renderTable(cycles){
    let html=`<table><tbody>`;

    cycles.forEach(c=>{
      c.days.forEach(d=>{
        if(!d.events.length)return;

        html+=`<tr>
          <td>${d.date.toLocaleDateString(window.localeMap[currentLang])}</td>
          <td>${c.index}</td>
          <td>d${d.day}</td>
          <td>${d.events.map(e=>e.drug||"").join(", ")}</td>
        </tr>`;
      });
    });

    html+=`</tbody></table>`;
    DOM.table.innerHTML=html;
  }

  /* =========================================
     SUBMIT
  ========================================= */

  function submitHandler(e){
    e.preventDefault();

    const selected=Object.entries(AppState.schemas).find(
      ([k,s])=>s.label===DOM.schemaInput.value
    );

    if(!selected){alert("Bitte gültiges Schema wählen.");return;}

    const [,schema]=selected;
    const startDate=new Date(DOM.startdatum.value+"T12:00:00");

    let gcsfMain=null;
    if(DOM.gcsfEnabled.checked){
      const drug=DOM.gcsfSelect.value;
      if(drug==="Filgrastim")
        gcsfMain={drug,multipleDays:[2,3,4,5,6]};
      else
        gcsfMain={drug,day:parseInt(DOM.gcsfDay.value)};
    }

    const cyclesMain=buildCycles(startDate,schema,gcsfMain);

    renderHeader(schema.label,startDate);
    renderGraphic(cyclesMain[0]);
    renderTable(cyclesMain);

    DOM.plan.style.display="block";
    DOM.plan.scrollIntoView({behavior:"smooth"});
  }

})();