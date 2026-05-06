(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const p=(s,e="ARS")=>new Intl.NumberFormat("es-AR",{style:"currency",currency:e,minimumFractionDigits:2}).format(s),h=s=>{const e=new Date(s);return new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(e)},v=s=>["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][s],u=(s,e="info")=>{const t=document.getElementById("toast-container"),a=document.createElement("div");a.className=`toast toast-${e}`,a.textContent=s,t.appendChild(a),setTimeout(()=>{a.style.opacity="0",a.style.transform="translateY(20px)",setTimeout(()=>a.remove(),300)},3e3)},r=(s,e="Guardando...")=>{const t=document.getElementById("loading-overlay"),a=document.getElementById("loading-text");a&&(a.textContent=e),t&&(s?t.classList.remove("hidden"):t.classList.add("hidden"))};class y{constructor(){this.apiUrl=localStorage.getItem("appgastos_api_url")||"",this.isDemo=!this.apiUrl,this.checkManifest()}async checkManifest(){if(!this.apiUrl)try{const t=await(await fetch("manifest.json")).json();t.api_url&&!t.api_url.includes("PEGAR_AQUI")&&(this.setApiUrl(t.api_url),console.log("API URL cargada desde manifest"))}catch{console.warn("No se pudo leer el manifest para la URL")}}setApiUrl(e){this.apiUrl=e,this.isDemo=!e,localStorage.setItem("appgastos_api_url",e)}async fetch(e,t={}){if(this.isDemo)return this.mockFetch(e,t);try{const a=new URL(this.apiUrl);a.searchParams.append("action",e);for(const[i,d]of Object.entries(t))a.searchParams.append(i,d);return await(await fetch(a.toString(),{redirect:"follow"})).json()}catch(a){throw console.error(`API Error (${e}):`,a),a}}async post(e,t={}){if(this.isDemo)return this.mockPost(e,t);try{const a=await fetch(this.apiUrl,{method:"POST",mode:"no-cors",body:JSON.stringify({action:e,...t})});return{status:"success"}}catch(a){throw console.error(`API Error (${e}):`,a),a}}mockFetch(e,t){const a=JSON.parse(localStorage.getItem("appgastos_demo_db"))||this.getInitialDemoDB();return e==="getall"?{status:"success",data:a}:{status:"success",data:a[e]||[]}}mockPost(e,t){const a=JSON.parse(localStorage.getItem("appgastos_demo_db"))||this.getInitialDemoDB(),o={addGasto:"gastos",addIngreso:"ingresos",addTransferencia:"transferencias",addCuenta:"cuentas",addPeriodo:"periodos",addTipoIngreso:"tiposIngreso",addCategoria:"categorias"};if(o[e]){const i=o[e];return a[i].unshift({id:t.id||Date.now(),...t}),localStorage.setItem("appgastos_demo_db",JSON.stringify(a)),{status:"success"}}if(e.startsWith("update")){const i=e.replace("update",""),d=i.charAt(0).toLowerCase()+i.slice(1)+(i.endsWith("s")?"":"s"),g={tipoIngreso:"tiposIngreso",categoria:"categorias"}[i.charAt(0).toLowerCase()+i.slice(1)]||d,f=a[g].findIndex(b=>b.id.toString()===t.id.toString());if(f!==-1)return a[g][f]={...a[g][f],...t},localStorage.setItem("appgastos_demo_db",JSON.stringify(a)),{status:"success"}}if(e.startsWith("delete")){const i=e.replace("delete",""),m={tipoIngreso:"tiposIngreso",categoria:"categorias"}[i.charAt(0).toLowerCase()+i.slice(1)]||i.charAt(0).toLowerCase()+i.slice(1)+"s";return a[m]=a[m].filter(g=>g.id.toString()!==t.id.toString()),localStorage.setItem("appgastos_demo_db",JSON.stringify(a)),{status:"success"}}return{status:"success"}}getInitialDemoDB(){return{periodos:[{id:1,año:2024,estado:"Abierto"},{id:2,año:2025,estado:"Abierto"}],cuentas:[{id:1,nombre:"Efectivo",moneda:"ARS",saldoInicial:5e3,activa:!0},{id:2,nombre:"Banco Galicia",moneda:"ARS",saldoInicial:15e4,activa:!0}],tiposIngreso:[{id:1,nombre:"Sueldo"},{id:2,nombre:"Venta"}],formasPago:[{id:1,nombre:"Efectivo"},{id:2,nombre:"Débito"},{id:3,nombre:"Transferencia"}],categorias:[{id:1,nombre:"Comida",icono:"🍔"},{id:2,nombre:"Transporte",icono:"🚗"},{id:3,nombre:"Servicios",icono:"💡"}],gastos:[],ingresos:[],transferencias:[]}}}const c=new y;class w{constructor(){this.state={periodos:[],cuentas:[],tiposIngreso:[],formasPago:[],categorias:[],gastos:[],ingresos:[],transferencias:[],isLoading:!1,initialized:!1},this.listeners=[]}subscribe(e){return this.listeners.push(e),()=>{this.listeners=this.listeners.filter(t=>t!==e)}}notify(){this.listeners.forEach(e=>e(this.state))}async init(){this.state.initialized||(await this.refreshAll(),this.state.initialized=!0,this.notify())}async refreshAll(){this.state.isLoading=!0,this.notify();try{const e=await c.fetch("getall");console.log("Store Refresh Response:",e),e.status==="success"&&(this.state={...this.state,...e.data,isLoading:!1},console.log("New State Cuentas:",this.state.cuentas))}catch(e){this.state.isLoading=!1,console.error("Store Refresh Error:",e)}this.notify()}getBalances(){const e={};return this.state.cuentas.forEach(t=>{e[t.nombre]={id:t.id,moneda:t.moneda,saldo:parseFloat(t.saldoInicial)||0}}),this.state.ingresos.forEach(t=>{e[t.cuentaDestino]&&(e[t.cuentaDestino].saldo+=parseFloat(t.importe))}),this.state.gastos.forEach(t=>{e[t.cuentaOrigen]&&(e[t.cuentaOrigen].saldo-=parseFloat(t.importe))}),this.state.transferencias.forEach(t=>{if(e[t.cuentaOrigen]&&(e[t.cuentaOrigen].saldo-=parseFloat(t.importe)),e[t.cuentaDestino]){const a=t.tipoCambio?t.importe/t.tipoCambio:t.importe;e[t.cuentaDestino].saldo+=parseFloat(a)}}),e}getFilteredGastos(e,t){return this.state.gastos.filter(a=>{const o=new Date(a.fecha);return o.getMonth()===e&&o.getFullYear()===t})}getGastosByCategory(e,t){const a=this.getFilteredGastos(e,t),o={};return a.forEach(i=>{o[i.categoria]=(o[i.categoria]||0)+parseFloat(i.importe)}),o}async addGasto(e){r(!0,"Guardando gasto...");try{(await c.post("addGasto",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Gasto registrado"))}finally{r(!1)}}async addIngreso(e){r(!0,"Registrando ingreso...");try{(await c.post("addIngreso",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Ingreso registrado"))}finally{r(!1)}}async addTransferencia(e){r(!0,"Procesando transferencia...");try{(await c.post("addTransferencia",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Transferencia realizada"))}finally{r(!1)}}async addCuenta(e){r(!0,"Creando cuenta...");try{(await c.post("addCuenta",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Cuenta creada con éxito"))}finally{r(!1)}}async addPeriodo(e){r(!0,"Abriendo período...");try{(await c.post("addPeriodo",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Período abierto con éxito"))}finally{r(!1)}}async addTipoIngreso(e){r(!0,"Agregando tipo de ingreso...");try{(await c.post("addTipoIngreso",{id:Date.now(),nombre:e})).status==="success"&&(await this.refreshAll(),u("Tipo de ingreso agregado"))}finally{r(!1)}}async updateTipoIngreso(e,t){r(!0,"Actualizando tipo de ingreso...");try{(await c.post("updateTipoIngreso",{id:e,nombre:t})).status==="success"&&(await this.refreshAll(),u("Tipo de ingreso actualizado"))}finally{r(!1)}}async deleteTipoIngreso(e){if(confirm("¿Estás seguro de eliminar este tipo de ingreso?")){r(!0,"Eliminando tipo de ingreso...");try{(await c.post("deleteTipoIngreso",{id:e})).status==="success"&&(await this.refreshAll(),u("Tipo de ingreso eliminado"))}finally{r(!1)}}}async addCategoria(e){r(!0,"Agregando categoría...");try{(await c.post("addCategoria",{id:Date.now(),...e})).status==="success"&&(await this.refreshAll(),u("Categoría agregada"))}finally{r(!1)}}async updateCategoria(e,t){r(!0,"Actualizando categoría...");try{(await c.post("updateCategoria",{id:e,...t})).status==="success"&&(await this.refreshAll(),u("Categoría actualizada"))}finally{r(!1)}}async deleteCategoria(e){if(confirm("¿Estás seguro de eliminar esta categoría?")){r(!0,"Eliminando categoría...");try{(await c.post("deleteCategoria",{id:e})).status==="success"&&(await this.refreshAll(),u("Categoría eliminada"))}finally{r(!1)}}}}const n=new w;class E{constructor(e){this.routes=e,this.contentElement=document.getElementById("page-content"),this.titleElement=document.getElementById("page-title"),window.addEventListener("hashchange",()=>this.resolve()),this.resolve()}resolve(){var a,o;const e=window.location.hash.slice(1)||"dashboard",t=this.routes[e]||this.routes.dashboard;document.querySelectorAll("[data-route]").forEach(i=>{i.classList.toggle("active",i.dataset.route===e)}),this.titleElement&&(this.titleElement.textContent=t.title),t.render&&(this.contentElement.innerHTML="",t.render(this.contentElement)),(a=document.getElementById("sidebar-overlay"))==null||a.classList.add("hidden"),(o=document.getElementById("sidebar"))==null||o.classList.remove("mobile-active")}navigate(e){window.location.hash=e}}const I={title:"Dashboard",render(s){const e=n.getBalances(),t=new Date,a=t.getMonth(),o=t.getFullYear(),i=n.getGastosByCategory(a,o);s.innerHTML=`
      <div class="dashboard-header">
        <div class="date-display">${v(a)} ${o}</div>
      </div>

      <div class="dashboard-grid">
        <div class="stat-card main-balance">
          <div class="stat-label">Total Disponible (ARS)</div>
          <div class="stat-value" id="total-ars">...</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ahorros (USD)</div>
          <div class="stat-value" id="total-usd">...</div>
        </div>
      </div>

      <h3 style="margin: 32px 0 16px;">Mis Cuentas</h3>
      <div class="dashboard-grid" id="cuentas-grid">
        ${Object.entries(e).map(([d,m])=>`
          <div class="stat-card">
            <div class="stat-label">${d}</div>
            <div class="stat-value ${m.saldo<0?"negative":""}">
              ${p(m.saldo,m.moneda)}
            </div>
          </div>
        `).join("")}
      </div>

      <h3 style="margin: 32px 0 16px;">Gastos por Categoría</h3>
      <div class="stat-card">
        <canvas id="category-chart" style="max-height: 300px;"></canvas>
      </div>
    `,this.updateTotals(e),this.renderChart(i)},updateTotals(s){let e=0,t=0;Object.values(s).forEach(a=>{a.moneda==="ARS"&&(e+=a.saldo),a.moneda==="USD"&&(t+=a.saldo)}),document.getElementById("total-ars").textContent=p(e,"ARS"),document.getElementById("total-usd").textContent=p(t,"USD")},renderChart(s){const e=document.getElementById("category-chart").getContext("2d"),t=Object.keys(s),a=Object.values(s);if(t.length===0){e.font="14px Inter",e.fillStyle="#a0a0b8",e.textAlign="center",e.fillText("Sin gastos en este período",e.canvas.width/2,e.canvas.height/2);return}new Chart(e,{type:"doughnut",data:{labels:t,datasets:[{data:a,backgroundColor:["#6c63ff","#4ecdc4","#ffb142","#ff5252","#00d2ff","#9c27b0"],borderWidth:0}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{position:"right",labels:{color:"#a0a0b8",font:{family:"Inter"}}}}}})}},l={show(s,e){const t=document.getElementById("modal-overlay"),a=document.getElementById("modal-title"),o=document.getElementById("modal-body");a.textContent=s,typeof e=="string"?o.innerHTML=e:(o.innerHTML="",o.appendChild(e)),t.classList.remove("hidden"),document.body.style.overflow="hidden"},hide(){document.getElementById("modal-overlay").classList.add("hidden"),document.body.style.overflow=""}},x={title:"Gastos",render(s){s.innerHTML=`
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2>Registro de Gastos</h2>
        <button id="add-gasto-btn" class="btn btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Gasto
        </button>
      </div>

      <div class="list-container" id="gastos-list">
        ${this.renderList()}
      </div>
    `,document.getElementById("add-gasto-btn").addEventListener("click",()=>this.showAddModal())},renderList(){const s=n.state.gastos;return s.length===0?'<div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-secondary);">No hay gastos registrados.</div>':s.map(e=>{var t;return`
      <div class="item-card">
        <div class="item-info">
          <h4>${e.categoria} - ${e.descripcion||"Sin descripción"}</h4>
          <p>${h(e.fecha)} | ${e.cuentaOrigen} | ${e.esServicio?"Servicio":"Gasto"}</p>
        </div>
        <div class="item-value negative" style="font-weight: 700;">
          -${p(e.importe,((t=n.state.cuentas.find(a=>a.nombre===e.cuentaOrigen))==null?void 0:t.moneda)||"ARS")}
        </div>
      </div>
    `}).join("")},showAddModal(){const s=document.createElement("form");s.id="gasto-form",s.innerHTML=`
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="g-fecha" class="form-input" value="${new Date().toISOString().split("T")[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe</label>
        <input type="number" id="g-importe" class="form-input" step="0.01" placeholder="0.00" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen</label>
        <select id="g-cuenta" class="form-input" required>
          ${n.state.cuentas.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Categoría</label>
        <select id="g-categoria" class="form-input" required>
          ${n.state.categorias.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Forma de Pago</label>
        <select id="g-formapago" class="form-input" required>
          ${n.state.formasPago.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group" style="display: flex; align-items: center; gap: 10px; margin: 20px 0;">
        <input type="checkbox" id="g-esservicio" style="width: 20px; height: 20px;">
        <label class="form-label" style="margin-bottom: 0;">¿Es un Servicio?</label>
      </div>
      <div class="form-group">
        <label class="form-label">Descripción (Opcional)</label>
        <input type="text" id="g-descripcion" class="form-input" placeholder="Ej: Supermercado">
      </div>
      <button type="submit" class="btn btn-primary btn-full" style="margin-top: 10px;">Guardar Gasto</button>
    `,s.addEventListener("submit",async e=>{e.preventDefault();const t={fecha:document.getElementById("g-fecha").value,importe:document.getElementById("g-importe").value,cuentaOrigen:document.getElementById("g-cuenta").value,categoria:document.getElementById("g-categoria").value,formaPago:document.getElementById("g-formapago").value,esServicio:document.getElementById("g-esservicio").checked,descripcion:document.getElementById("g-descripcion").value,periodo:new Date(document.getElementById("g-fecha").value).getFullYear()};await n.addGasto(t),l.hide()}),l.show("Nuevo Gasto",s)}},C={title:"Ingresos y Transferencias",render(s){s.innerHTML=`
      <div class="view-header" style="display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
        <button id="add-ingreso-btn" class="btn btn-primary">Nuevo Ingreso</button>
        <button id="add-trans-btn" class="btn btn-ghost">Transferencia</button>
        <button id="add-usd-btn" class="btn btn-ghost">Compra USD</button>
      </div>

      <h3>Movimientos Recientes</h3>
      <div class="list-container" id="ingresos-list" style="margin-top: 16px;">
        ${this.renderList()}
      </div>
    `,document.getElementById("add-ingreso-btn").addEventListener("click",()=>this.showIngresoModal()),document.getElementById("add-trans-btn").addEventListener("click",()=>this.showTransferModal()),document.getElementById("add-usd-btn").addEventListener("click",()=>this.showUsdModal())},renderList(){const s=[...n.state.ingresos.map(e=>({...e,tipo:"ingreso"})),...n.state.transferencias.map(e=>({...e,tipo:"transferencia"}))].sort((e,t)=>new Date(t.fecha)-new Date(e.fecha));return s.length===0?'<div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-secondary);">No hay movimientos registrados.</div>':s.map(e=>`
      <div class="item-card">
        <div class="item-info">
          <h4>${e.tipo==="ingreso"?e.tipoIngreso||"Ingreso":"Transferencia"}</h4>
          <p>${h(e.fecha)} | ${e.tipo==="ingreso"?e.cuentaDestino:`${e.cuentaOrigen} ➔ ${e.cuentaDestino}`}</p>
        </div>
        <div class="item-value ${e.tipo==="ingreso"?"positive":""}" style="font-weight: 700;">
          ${e.tipo==="ingreso"?"+":""}${p(e.importe,"ARS")}
        </div>
      </div>
    `).join("")},showIngresoModal(){const s=document.createElement("form");s.innerHTML=`
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="i-fecha" class="form-input" value="${new Date().toISOString().split("T")[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe</label>
        <input type="number" id="i-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino</label>
        <select id="i-cuenta" class="form-input" required>
          ${n.state.cuentas.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Ingreso</label>
        <select id="i-tipo" class="form-input" required>
          ${n.state.tiposIngreso.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Registrar Ingreso</button>
    `,s.addEventListener("submit",async e=>{e.preventDefault(),await n.addIngreso({fecha:document.getElementById("i-fecha").value,importe:document.getElementById("i-importe").value,cuentaDestino:document.getElementById("i-cuenta").value,tipoIngreso:document.getElementById("i-tipo").value,periodo:new Date(document.getElementById("i-fecha").value).getFullYear()}),l.hide()}),l.show("Nuevo Ingreso",s)},showTransferModal(){const s=document.createElement("form");s.innerHTML=`
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" id="t-fecha" class="form-input" value="${new Date().toISOString().split("T")[0]}" required>
      </div>
      <div class="form-group">
        <label class="form-label">Importe (ARS)</label>
        <input type="number" id="t-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen</label>
        <select id="t-origen" class="form-input" required>
          ${n.state.cuentas.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino</label>
        <select id="t-destino" class="form-input" required>
          ${n.state.cuentas.map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Realizar Transferencia</button>
    `,s.addEventListener("submit",async e=>{e.preventDefault(),await n.addTransferencia({fecha:document.getElementById("t-fecha").value,importe:document.getElementById("t-importe").value,cuentaOrigen:document.getElementById("t-origen").value,cuentaDestino:document.getElementById("t-destino").value}),l.hide()}),l.show("Transferencia",s)},showUsdModal(){const s=document.createElement("form");s.innerHTML=`
      <div class="form-group">
        <label class="form-label">Importe Pesos (ARS)</label>
        <input type="number" id="u-importe" class="form-input" step="0.01" required>
      </div>
      <div class="form-group">
        <label class="form-label">Tipo de Cambio (ARS/USD)</label>
        <input type="number" id="u-tc" class="form-input" step="0.01" placeholder="Ej: 1100" required>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Origen (ARS)</label>
        <select id="u-origen" class="form-input" required>
          ${n.state.cuentas.filter(e=>e.moneda==="ARS").map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Cuenta Destino (USD)</label>
        <select id="u-destino" class="form-input" required>
          ${n.state.cuentas.filter(e=>e.moneda==="USD").map(e=>`<option value="${e.nombre}">${e.nombre}</option>`).join("")}
        </select>
      </div>
      <button type="submit" class="btn btn-primary btn-full">Confirmar Compra USD</button>
    `,s.addEventListener("submit",async e=>{e.preventDefault(),await n.addTransferencia({fecha:new Date().toISOString().split("T")[0],importe:document.getElementById("u-importe").value,tipoCambio:document.getElementById("u-tc").value,cuentaOrigen:document.getElementById("u-origen").value,cuentaDestino:document.getElementById("u-destino").value,descripcion:"Compra de USD"}),l.hide()}),l.show("Compra de USD",s)}},B={title:"Mis Cuentas",render(s){const e=n.getBalances();s.innerHTML=`
      <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2>Gestión de Cuentas</h2>
        <button id="add-cuenta-btn" class="btn btn-primary">Nueva Cuenta</button>
      </div>

      <div class="list-container">
        ${n.state.cuentas.map(t=>{var o;const a=((o=e[t.nombre])==null?void 0:o.saldo)||0;return`
            <div class="item-card">
              <div class="item-info">
                <h4>${t.nombre}</h4>
                <p>Moneda: ${t.moneda} | ${t.activa?"Activa":"Inactiva"}</p>
              </div>
              <div class="item-value ${a<0?"negative":"positive"}" style="font-weight: 700;">
                ${p(a,t.moneda)}
              </div>
            </div>
          `}).join("")}
      </div>
    `,document.getElementById("add-cuenta-btn").addEventListener("click",()=>this.showAddModal())},showAddModal(){const s=document.createElement("form");s.innerHTML=`
      <div class="form-group">
        <label class="form-label">Nombre de la Cuenta</label>
        <input type="text" id="c-nombre" class="form-input" placeholder="Ej: Mercado Pago" required>
      </div>
      <div class="form-group">
        <label class="form-label">Moneda</label>
        <select id="c-moneda" class="form-input">
          <option value="ARS">Pesos (ARS)</option>
          <option value="USD">Dólares (USD)</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Saldo Inicial</label>
        <input type="number" id="c-saldo" class="form-input" value="0" step="0.01">
      </div>
      <button type="submit" class="btn btn-primary btn-full">Crear Cuenta</button>
    `,s.addEventListener("submit",async e=>{e.preventDefault(),await n.addCuenta({nombre:document.getElementById("c-nombre").value,moneda:document.getElementById("c-moneda").value,saldoInicial:document.getElementById("c-saldo").value,activa:!0}),l.hide()}),l.show("Nueva Cuenta",s)}},A={title:"Administración",render(s){s.innerHTML=`
      <div class="admin-sections">
        
        <!-- Períodos -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Apertura de Período</h3>
            <button id="add-periodo-btn" class="btn btn-primary btn-sm">Abrir Ejercicio 2026</button>
          </div>
          <p class="stat-label">Define el año de ejercicio actual y futuros.</p>
          <div class="list-container" style="margin: 16px 0;">
            ${n.state.periodos.map(e=>`
              <div class="item-card" style="padding: 10px 16px;">
                <span>Ejercicio ${e.año}</span>
                <span class="badge" style="background: var(--success); color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">${e.estado}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Tipos de Ingreso -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Tipos de Ingreso</h3>
            <button id="add-tipo-ingreso-btn" class="btn btn-ghost btn-sm" title="Agregar Tipo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${n.state.tiposIngreso.map(e=>`
              <div class="item-card" style="padding: 10px 16px;">
                <span>${e.nombre}</span>
                <div class="item-actions">
                  <button class="edit-tipo-btn" data-id="${e.id}" data-nombre="${e.nombre}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="delete-tipo-btn" data-id="${e.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Categorías -->
        <div class="stat-card" style="margin-bottom: 24px;">
          <div class="flex-between">
            <h3>Categorías</h3>
            <button id="add-categoria-btn" class="btn btn-ghost btn-sm" title="Agregar Categoría">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
          <div class="list-container" style="margin: 16px 0;">
            ${n.state.categorias.map(e=>`
              <div class="item-card" style="padding: 10px 16px;">
                <div class="flex-center" style="gap: 12px;">
                  <span style="font-size: 1.2rem;">${e.icono||"📁"}</span>
                  <span>${e.nombre}</span>
                </div>
                <div class="item-actions">
                  <button class="edit-cat-btn" data-id="${e.id}" data-nombre="${e.nombre}" data-icono="${e.icono||""}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button class="delete-cat-btn" data-id="${e.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="stat-card">
          <h3>Formas de Pago</h3>
          <div class="list-container" style="margin: 16px 0;">
            ${n.state.formasPago.map(e=>`
              <div class="item-card" style="padding: 10px 16px;">
                <span>${e.nombre}</span>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    `,this.setupEventListeners(s)},setupEventListeners(s){document.getElementById("add-periodo-btn").addEventListener("click",async()=>{await n.addPeriodo({año:2026,estado:"Abierto"}),this.render(s)}),document.getElementById("add-tipo-ingreso-btn").addEventListener("click",()=>{this.showTipoForm(s)}),s.querySelectorAll(".edit-tipo-btn").forEach(e=>{e.addEventListener("click",()=>{this.showTipoForm(s,{id:e.dataset.id,nombre:e.dataset.nombre})})}),s.querySelectorAll(".delete-tipo-btn").forEach(e=>{e.addEventListener("click",async()=>{await n.deleteTipoIngreso(e.dataset.id),this.render(s)})}),document.getElementById("add-categoria-btn").addEventListener("click",()=>{this.showCategoriaForm(s)}),s.querySelectorAll(".edit-cat-btn").forEach(e=>{e.addEventListener("click",()=>{this.showCategoriaForm(s,{id:e.dataset.id,nombre:e.dataset.nombre,icono:e.dataset.icono})})}),s.querySelectorAll(".delete-cat-btn").forEach(e=>{e.addEventListener("click",async()=>{await n.deleteCategoria(e.dataset.id),this.render(s)})})},showTipoForm(s,e=null){const t=!!e,a=`
      <form id="tipo-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre del Tipo de Ingreso</label>
          <input type="text" id="tipo-nombre" class="form-input" value="${e?e.nombre:""}" required placeholder="Ej: Sueldo, Regalo, Venta...">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${t?"Actualizar":"Guardar"}</button>
        </div>
      </form>
    `;l.show(t?"Editar Tipo de Ingreso":"Nuevo Tipo de Ingreso",a),document.getElementById("cancel-btn").onclick=()=>l.hide(),document.getElementById("tipo-form").onsubmit=async o=>{o.preventDefault();const i=document.getElementById("tipo-nombre").value;t?await n.updateTipoIngreso(e.id,i):await n.addTipoIngreso(i),l.hide(),this.render(s)}},showCategoriaForm(s,e=null){const t=!!e,a=`
      <form id="cat-form" class="modal-form">
        <div class="form-group">
          <label class="form-label">Nombre de la Categoría</label>
          <input type="text" id="cat-nombre" class="form-input" value="${e?e.nombre:""}" required placeholder="Ej: Comida, Salud, Ocio...">
        </div>
        <div class="form-group">
          <label class="form-label">Emoji / Icono</label>
          <input type="text" id="cat-icono" class="form-input" value="${e?e.icono:"📁"}" placeholder="Ej: 🍔, 🚗, 💡...">
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" id="cancel-btn">Cancelar</button>
          <button type="submit" class="btn btn-primary">${t?"Actualizar":"Guardar"}</button>
        </div>
      </form>
    `;l.show(t?"Editar Categoría":"Nueva Categoría",a),document.getElementById("cancel-btn").onclick=()=>l.hide(),document.getElementById("cat-form").onsubmit=async o=>{o.preventDefault();const i=document.getElementById("cat-nombre").value,d=document.getElementById("cat-icono").value;t?await n.updateCategoria(e.id,{nombre:i,icono:d}):await n.addCategoria({nombre:i,icono:d}),l.hide(),this.render(s)}}},$={dashboard:I,gastos:x,ingresos:C,cuentas:B,admin:A};class S{constructor(){this.router=null,this.init()}async init(){this.setupEventListeners(),!c.apiUrl&&!localStorage.getItem("appgastos_demo_mode")?this.showConfigScreen():await this.startApp()}showConfigScreen(){document.getElementById("splash").classList.add("hidden"),document.getElementById("config-screen").classList.remove("hidden")}async startApp(){document.getElementById("config-screen").classList.add("hidden"),document.getElementById("splash").classList.remove("hidden");try{await n.init(),this.router=new E($),n.subscribe(()=>{this.router&&this.router.resolve()}),document.getElementById("splash").classList.add("hidden"),document.getElementById("main-layout").classList.remove("hidden")}catch(e){console.error("App start error:",e),this.showConfigScreen()}}setupEventListeners(){document.getElementById("mobile-menu-btn").addEventListener("click",()=>{const e=document.getElementById("sidebar"),t=document.getElementById("sidebar-overlay");e.classList.add("mobile-active"),t.classList.remove("hidden")}),document.getElementById("sidebar-overlay").addEventListener("click",()=>{const e=document.getElementById("sidebar"),t=document.getElementById("sidebar-overlay");e.classList.remove("mobile-active"),t.classList.add("hidden")}),document.getElementById("modal-close").addEventListener("click",()=>l.hide()),document.getElementById("modal-overlay").addEventListener("click",e=>{e.target.id==="modal-overlay"&&l.hide()})}}window.app=new S;
