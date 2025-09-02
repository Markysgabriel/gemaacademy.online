// main.js - Countdown and exit intent behavior
document.addEventListener('DOMContentLoaded', function(){
  // Año en el footer
  var yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Timer de 15 minutos
  (function(){
    var el = document.getElementById('countdown');
    if(!el) return;
    var end = Date.now() + 15 * 60 * 1000; // 15 min
    var t = setInterval(function(){
      var diff = Math.max(0, end - Date.now());
      var m = Math.floor(diff / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      el.textContent = (String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0'));
      if(diff <= 0){ clearInterval(t); }
    }, 1000);
  })();

  // Exit intent simple (desktop)
  var exitShown = false;
  document.addEventListener('mouseout', function(e){
    if(exitShown) return;
    if(e.clientY <= 0){
      exitShown = true;
      var backdrop = document.getElementById('exitBackdrop');
      if(backdrop){
        backdrop.style.display = 'flex';
        backdrop.setAttribute('aria-hidden','false');
      }
    }
  });
  var closeExit = document.getElementById('closeExit');
  if(closeExit){
    closeExit.addEventListener('click', function(){
      var backdrop = document.getElementById('exitBackdrop');
      if(backdrop){
        backdrop.style.display = 'none';
        backdrop.setAttribute('aria-hidden','true');
      }
    });
  }

  // Simple click logs (reemplaza con tracking real si deseas)
  var aceptarBtn = document.getElementById('cta-aceptar');
  var rechazarBtn = document.getElementById('cta-rechazar');
  if(aceptarBtn) aceptarBtn.addEventListener('click', function(){ console.log('CTA ACEPTAR clicado'); });
  if(rechazarBtn) rechazarBtn.addEventListener('click', function(){ console.log('CTA RECHAZAR clicado'); });
});