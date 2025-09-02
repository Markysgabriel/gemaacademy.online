
document.addEventListener('DOMContentLoaded', function(){
  // Countdown 10 minutes (example)
  var el = document.getElementById('countdown');
  if(el){
    var end = Date.now() + 10*60*1000;
    var t = setInterval(function(){
      var diff = Math.max(0, end - Date.now());
      var m = Math.floor(diff/60000);
      var s = Math.floor((diff%60000)/1000);
      el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
      if(diff<=0) clearInterval(t);
    },1000);
  }
  // simple click logs
  var a = document.querySelectorAll('.btn');
  a.forEach(function(btn){
    btn.addEventListener('click', function(){ console.log('clicou:', btn.textContent.trim()); });
  });
  // exit intent (desktop)
  var shown=false;
  document.addEventListener('mouseout', function(e){
    if(shown) return;
    if(e.clientY<=0){
      shown=true;
      var m=document.getElementById('exitBackdrop');
      if(m) m.style.display='flex';
    }
  });
  var closeExit = document.getElementById('closeExit');
  if(closeExit) closeExit.addEventListener('click', function(){ document.getElementById('exitBackdrop').style.display='none'; });
});
