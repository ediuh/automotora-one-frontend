const API_URL = 'https://automotora-one-backend.onrender.com/vehicles'; 
let vehicles = [];
const WHATSAPP_NUMBER = "56944693976";

const vehicleGrid = document.getElementById("vehicleGrid");
const searchInput = document.getElementById("searchInput");
const brandFilter = document.getElementById("brandFilter");
const yearFilter = document.getElementById("yearFilter");
const sortFilter = document.getElementById("sortFilter");
const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

async function loadCatalog() {
  try {
    vehicleGrid.innerHTML = '<div class="no-results" style="font-weight: bold; font-size: 1.1rem;">Cargando autos...<br>Agradecemos tu paciencia.</div>';

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    
    vehicles = await response.json();
    
    populateFilters();
    renderVehicles();
  } catch (error) {
    console.error('Error al cargar el catálogo:', error);
    vehicleGrid.innerHTML = '<div class="no-results">Error al cargar los vehículos. Intenta más tarde.</div>';
  }
}

function moneyCLP(value){
  return new Intl.NumberFormat("es-CL", {
    style:"currency", currency:"CLP", maximumFractionDigits:0
  }).format(value);
}

function kmFormat(value){
  return new Intl.NumberFormat("es-CL").format(value) + " km";
}

function populateFilters(){
  brandFilter.innerHTML = '<option value="">Todas las marcas</option>';
  yearFilter.innerHTML = '<option value="">Todos los años</option>';

  [...new Set(vehicles.map(v=>v.brand))].sort().forEach(brand=>{
    const o=document.createElement("option");
    o.value=brand;o.textContent=brand;
    brandFilter.appendChild(o);
  });

  [...new Set(vehicles.map(v=>v.year))].sort((a,b)=>b-a).forEach(year=>{
    const o=document.createElement("option");
    o.value=year;o.textContent=year;
    yearFilter.appendChild(o);
  });
}

function getFilteredVehicles(){
  let list=[...vehicles];
  const q=searchInput.value.trim().toLowerCase();
  const brand=brandFilter.value;
  const year=yearFilter.value;

  if(q) list=list.filter(v => `${v.brand} ${v.model}`.toLowerCase().includes(q));
  if(brand) list=list.filter(v => v.brand===brand);
  if(year) list=list.filter(v => String(v.year)===year);

  switch(sortFilter.value){
    case "price-asc": list.sort((a,b)=>a.price-b.price); break;
    case "price-desc": list.sort((a,b)=>b.price-a.price); break;
    case "km-asc": list.sort((a,b)=>a.km-b.km); break;
    default: list.sort((a,b)=>(a.brand || '').localeCompare(b.brand || ''));
  }
  return list;
}

function renderVehicles(){
  const list=getFilteredVehicles();
  if(!list.length){
    vehicleGrid.innerHTML='<div class="no-results">No encontramos vehículos con esos filtros.</div>';
    return;
  }

  vehicleGrid.innerHTML=list.map(v=> {
    const coverObj = v.images?.find(img => img.is_cover) || v.images?.[0];
    const coverImage = coverObj ? coverObj.url : 'assets/no-image.jpg';

    return `
    <article class="vehicle-card" data-id="${v.id}">
      <div class="vehicle-image">
        <img src="${coverImage}" alt="${v.brand} ${v.model}" loading="lazy">
        <span class="status-badge">${v.status}</span>
      </div>
      <div class="vehicle-content">
        <div class="vehicle-topline">
          <span>${v.year}</span>
          <span>${v.transmission}</span>
        </div>
        <h3>${v.brand} ${v.model}</h3>
        <div class="vehicle-specs">
          <span>${kmFormat(v.km)}</span>
          <span>${v.fuel}</span>
        </div>
        <p class="vehicle-price">${moneyCLP(v.price)}</p>
      </div>
    </article>
  `}).join("");

  document.querySelectorAll(".vehicle-card").forEach(card=>{
    card.addEventListener("click",()=>openModal(Number(card.dataset.id)));
  });
}

function openModal(id){
  const v=vehicles.find(x=>x.id===id);
  if(!v) return;

  const coverObj = v.images?.find(img => img.is_cover) || v.images?.[0];
  const coverImage = coverObj ? coverObj.url : 'assets/no-image.jpg';

  document.getElementById("modalImage").src=coverImage;
  document.getElementById("modalImage").alt=`${v.brand} ${v.model}`;
  document.getElementById("modalYear").textContent=v.year;
  document.getElementById("modalStatus").textContent=v.status;
  document.getElementById("modalTitle").textContent=`${v.brand} ${v.model}`;
  document.getElementById("modalPrice").textContent=moneyCLP(v.price);
  document.getElementById("modalDescription").textContent=v.description || 'Sin descripción detallada.';

  document.getElementById("modalSpecs").innerHTML=`
    <div><strong>Kilometraje</strong><br>${kmFormat(v.km)}</div>
    <div><strong>Transmisión</strong><br>${v.transmission}</div>
    <div><strong>Combustible</strong><br>${v.fuel}</div>
    <div><strong>Año</strong><br>${v.year}</div>
  `;

  let gallery = document.getElementById("modalGallery");
  if (!gallery) {
    gallery = document.createElement("div");
    gallery.id = "modalGallery";
    gallery.style.display = "flex";
    gallery.style.gap = "10px";
    gallery.style.marginTop = "20px";
    gallery.style.overflowX = "auto";

    const modalSpecs = document.getElementById("modalSpecs");
    modalSpecs.parentNode.insertBefore(gallery, modalSpecs);
  }
  
  gallery.innerHTML = ''; 
  
  if (v.images && v.images.length > 1) {
    v.images.forEach(img => {
      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.style.height = "60px";
      thumb.style.width = "90px";
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "6px";
      thumb.style.cursor = "pointer";
      thumb.style.opacity = img.url === coverImage ? "1" : "0.4";
      thumb.style.transition = "opacity 0.2s";
      
      thumb.onclick = () => {
        document.getElementById("modalImage").src = img.url;
        Array.from(gallery.children).forEach(c => c.style.opacity = "0.4");
        thumb.style.opacity = "1";
      };
      
      gallery.appendChild(thumb);
    });
  }

  const text=encodeURIComponent(`Hola Automotora One, quiero consultar por el ${v.brand} ${v.model} ${v.year}.`);
  document.getElementById("modalWhatsapp").href=`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

  document.getElementById("vehicleModal").classList.add("open");
  document.body.style.overflow="hidden";
}

function closeModal(){
  document.getElementById("vehicleModal").classList.remove("open");
  document.body.style.overflow="";
}

[searchInput,brandFilter,yearFilter,sortFilter].forEach(el=>{
  el.addEventListener("input",renderVehicles);
  el.addEventListener("change",renderVehicles);
});

document.querySelectorAll("[data-close-modal]").forEach(el=>el.addEventListener("click",closeModal));
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeModal(); });

menuBtn.addEventListener("click",()=>navMenu.classList.toggle("open"));
navMenu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>navMenu.classList.remove("open")));

document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('contactName').value;
  const userEmail = document.getElementById('contactEmail').value;
  const subject = document.getElementById('contactSubject').value;
  const message = document.getElementById('contactMessage').value;

  const targetEmail = 'ventas@automotoraone.cl'; 

  const bodyText = `Nombre: ${name}\nCorreo de contacto: ${userEmail}\n\nMensaje:\n${message}`;

  const mailtoLink = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  window.location.href = mailtoLink;
});

document.addEventListener('DOMContentLoaded', loadCatalog);