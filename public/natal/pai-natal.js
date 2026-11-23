/* Pai Natal interativo — Soluções Diferentes (original, sem dependências).
   Uso: PaiNatal.mount(elemento, { tamanho: 180, mensagens: [...], link: { href, texto } })
   - Os olhos seguem o rato/dedo, pisca os olhos, o pompom balança.
   - Ao passar o rato acena; ao tocar/clicar salta, solta brilhos dourados e diz uma mensagem.
   - Respeita "reduzir movimento". */
(function () {
  if (window.PaiNatal) return;
  var CSS = '' +
    '.pnx{position:relative;display:inline-block;cursor:pointer;-webkit-tap-highlight-color:transparent;outline:none;user-select:none}' +
    '.pnx svg{display:block;width:100%;height:auto;overflow:visible;filter:drop-shadow(0 10px 18px rgba(0,0,0,.28))}' +
    '.pnx:focus-visible svg{filter:drop-shadow(0 0 0 3px #f3d77a)}' +
    '.pnx .pnx-corpo{transform-origin:110px 260px;animation:pnxRespira 4.2s ease-in-out infinite}' +
    '.pnx .pnx-pompom{transform-origin:160px 64px;animation:pnxPompom 3.4s ease-in-out infinite}' +
    '.pnx .pnx-braco{transform-origin:168px 206px;transform:rotate(0deg);transition:transform .4s}' +
    '.pnx.acena .pnx-braco{animation:pnxAcena .9s ease-in-out infinite}' +
    '.pnx .pnx-palp{transform-box:fill-box;transform-origin:50% 0;transform:scaleY(0)}' +
    '.pnx.pisca .pnx-palp{animation:pnxPisca .22s ease-in-out}' +
    '.pnx .pnx-pupila{transition:transform .18s ease-out}' +
    '.pnx.salta .pnx-corpo{animation:pnxSalta .6s cubic-bezier(.3,1.6,.5,1)}' +
    '.pnx.ri .pnx-boca{transform-box:fill-box;transform-origin:50% 0;animation:pnxRi .5s ease-in-out 2}' +
    '.pnx-balao{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translate(-50%,8px) scale(.92);opacity:0;pointer-events:none;' +
      'background:#fffdf7;color:#1f2937;border:1.5px solid #e7b95f;border-radius:16px;padding:10px 14px;min-width:190px;max-width:250px;' +
      'font:600 13.5px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,.25);transition:opacity .25s,transform .25s;z-index:5}' +
    '.pnx-balao:after{content:"";position:absolute;left:50%;top:100%;margin-left:-8px;border:8px solid transparent;border-top-color:#e7b95f}' +
    '.pnx-balao b{display:block;color:#9f1d24;font-size:15px;letter-spacing:.02em;margin-bottom:2px}' +
    '.pnx-balao a{display:inline-block;margin-top:8px;background:#d4af37;color:#1f2937;text-decoration:none;font-weight:800;font-size:12px;padding:6px 12px;border-radius:999px;pointer-events:auto}' +
    '.pnx.esq .pnx-balao{left:auto;right:calc(100% + 8px);bottom:38%;transform:translate(8px,0) scale(.92)}' +
    '.pnx.esq .pnx-balao:after{left:100%;top:50%;margin:-8px 0 0;border-top-color:transparent;border-left-color:#e7b95f}' +
    '.pnx.esq.fala .pnx-balao{transform:translate(0,0) scale(1)}' +
    '.pnx.fala .pnx-balao{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}' +
    '.pnx-brilho{position:absolute;width:7px;height:7px;border-radius:50%;background:radial-gradient(circle,#fff6d6,#e7b95f 60%,rgba(231,185,95,0));pointer-events:none;animation:pnxBrilho .9s ease-out forwards}' +
    '.pnx-dica{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:4px;white-space:nowrap;font:700 10.5px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#e7b95f;opacity:.85;animation:pnxDica 2.4s ease-in-out infinite}' +
    '@keyframes pnxRespira{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.012)}}' +
    '@keyframes pnxPompom{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(7deg)}}' +
    '@keyframes pnxAcena{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(16deg)}}' +
    '@keyframes pnxPisca{0%,100%{transform:scaleY(0)}50%{transform:scaleY(1)}}' +
    '@keyframes pnxSalta{0%{transform:translateY(0)}35%{transform:translateY(-16px) scale(1.03)}70%{transform:translateY(2px) scale(.99)}100%{transform:translateY(0)}}' +
    '@keyframes pnxRi{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.6)}}' +
    '@keyframes pnxBrilho{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}' +
    '@keyframes pnxDica{0%,100%{opacity:.45}50%{opacity:1}}' +
    '@media (prefers-reduced-motion:reduce){.pnx .pnx-corpo,.pnx .pnx-pompom,.pnx.acena .pnx-braco,.pnx-dica{animation:none}.pnx-brilho{display:none}}';

  var SVG = '' +
  '<svg viewBox="0 0 230 262" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
  '<defs>' +
    '<linearGradient id="pnxVerm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D3252F"/><stop offset="1" stop-color="#7C0F18"/></linearGradient>' +
    '<linearGradient id="pnxCasaco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C81F2A"/><stop offset="1" stop-color="#8A111B"/></linearGradient>' +
    '<radialGradient id="pnxPele" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#F8D8BD"/><stop offset="1" stop-color="#E0A882"/></radialGradient>' +
    '<linearGradient id="pnxBranco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E3E8EF"/></linearGradient>' +
    '<linearGradient id="pnxOuro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7DE92"/><stop offset=".55" stop-color="#D9AE4A"/><stop offset="1" stop-color="#A97E24"/></linearGradient>' +
  '</defs>' +
  '<g class="pnx-corpo">' +
    // casaco
    '<path d="M28 262 C30 218 58 194 84 188 L136 188 C162 194 190 218 192 262 Z" fill="url(#pnxCasaco)"/>' +
    '<path d="M104 214 L116 214 L116 262 L104 262 Z" fill="url(#pnxBranco)"/>' +
    '<rect x="34" y="236" width="152" height="15" rx="3" fill="#1C1917"/>' +
    '<rect x="98" y="232" width="24" height="23" rx="4" fill="none" stroke="url(#pnxOuro)" stroke-width="4"/>' +
    '<path d="M40 252 C42 226 54 208 72 198" stroke="#6E0C14" stroke-width="3" fill="none" stroke-linecap="round" opacity=".55"/>' +
    '<ellipse cx="50" cy="244" rx="12" ry="7" transform="rotate(-25 50 244)" fill="url(#pnxBranco)"/>' +
    '<ellipse cx="60" cy="250" rx="10" ry="9" fill="#14532D"/>' +
    // braço que acena
    '<g class="pnx-braco">' +
      '<path d="M156 198 C172 188 186 172 192 152 L210 158 C204 184 190 204 170 218 Z" fill="url(#pnxCasaco)"/>' +
      '<ellipse cx="201" cy="152" rx="13" ry="7.5" transform="rotate(-18 201 152)" fill="url(#pnxBranco)"/>' +
      '<ellipse cx="206" cy="136" rx="11" ry="12.5" fill="#14532D"/>' +
      '<ellipse cx="195" cy="140" rx="4.5" ry="7" transform="rotate(-30 195 140)" fill="#166534"/>' +
    '</g>' +
    // chapéu
    '<path d="M70 92 C76 46 112 22 150 28 C172 32 188 48 192 66 C180 58 168 58 160 64 C168 74 160 86 154 92 Z" fill="url(#pnxVerm)"/>' +
    '<path d="M88 62 C102 44 122 36 144 36" stroke="#EE5A63" stroke-width="4" fill="none" stroke-linecap="round" opacity=".45"/>' +
    '<g class="pnx-pompom"><circle cx="194" cy="72" r="12.5" fill="url(#pnxBranco)"/></g>' +
    // cara
    '<ellipse cx="110" cy="124" rx="40" ry="36" fill="url(#pnxPele)"/>' +
    '<ellipse cx="85" cy="136" rx="9" ry="5.5" fill="#E8776F" opacity=".38"/>' +
    '<ellipse cx="135" cy="136" rx="9" ry="5.5" fill="#E8776F" opacity=".38"/>' +
    // olhos
    '<g><ellipse cx="96" cy="121" rx="5.2" ry="5.6" fill="#fff"/><g class="pnx-pupila"><circle cx="96" cy="121.5" r="3.4" fill="#2A1B16"/><circle cx="97.2" cy="120.2" r="1.1" fill="#fff"/></g>' +
      '<rect class="pnx-palp" x="90" y="115" width="12" height="12" rx="6" fill="#EBBE9C"/></g>' +
    '<g><ellipse cx="124" cy="121" rx="5.2" ry="5.6" fill="#fff"/><g class="pnx-pupila"><circle cx="124" cy="121.5" r="3.4" fill="#2A1B16"/><circle cx="125.2" cy="120.2" r="1.1" fill="#fff"/></g>' +
      '<rect class="pnx-palp" x="118" y="115" width="12" height="12" rx="6" fill="#EBBE9C"/></g>' +
    // óculos dourados
    '<circle cx="96" cy="121" r="11" fill="rgba(255,255,255,.08)" stroke="url(#pnxOuro)" stroke-width="2.2"/>' +
    '<circle cx="124" cy="121" r="11" fill="rgba(255,255,255,.08)" stroke="url(#pnxOuro)" stroke-width="2.2"/>' +
    '<path d="M107 119 Q110 116 113 119" stroke="url(#pnxOuro)" stroke-width="2" fill="none"/>' +
    // sobrancelhas
    '<path d="M84 106 q11 -7 22 -1" stroke="url(#pnxBranco)" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M114 105 q11 -6 22 1" stroke="url(#pnxBranco)" stroke-width="5.5" fill="none" stroke-linecap="round"/>' +
    // chapéu (aba por cima da testa)
    '<rect x="60" y="82" width="100" height="23" rx="11.5" fill="url(#pnxBranco)"/>' +
    // barba
    '<path d="M68 130 C62 180 84 216 110 224 C136 216 158 180 152 130 C144 152 130 158 110 158 C90 158 76 152 68 130 Z" fill="url(#pnxBranco)"/>' +
    '<path d="M76 162 q8 10 16 4 M98 190 q12 9 24 0 M128 166 q9 -2 15 -9 M88 206 q8 5 14 2 M118 208 q7 2 12 -4" stroke="#D3DAE4" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    // boca e bigode
    '<path class="pnx-boca" d="M102 152 Q110 160 118 152 Z" fill="#9F1D24"/>' +
    '<path d="M110 146 C99 136 82 138 74 150 C87 154 99 152 110 148 C121 152 133 154 146 150 C138 138 121 136 110 146 Z" fill="#fff"/>' +
    '<ellipse cx="110" cy="137" rx="7.2" ry="6" fill="#DC8169"/><ellipse cx="108" cy="135" rx="2.2" ry="1.6" fill="#fff" opacity=".5"/>' +
  '</g>' +
  '</svg>';

  function injectCSS() {
    if (document.getElementById('pnx-css')) return;
    var s = document.createElement('style'); s.id = 'pnx-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  function mount(el, opts) {
    if (!el || el.__pnx) return;
    opts = opts || {};
    injectCSS();
    var reduz = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var msgs = opts.mensagens && opts.mensagens.length ? opts.mensagens : ['Boas Festas!'];
    var w = document.createElement('div');
    w.className = 'pnx' + (opts.balao === 'esquerda' ? ' esq' : ''); w.tabIndex = 0; w.setAttribute('role', 'button');
    w.setAttribute('aria-label', 'Pai Natal — tocar para uma mensagem');
    w.style.width = (opts.tamanho || 180) + 'px';
    w.innerHTML = SVG + '<div class="pnx-balao" role="status" aria-live="polite"></div>' + (opts.dica === false ? '' : '<div class="pnx-dica">' + (opts.dica || 'Toca-me') + '</div>');
    el.appendChild(w); el.__pnx = w;
    var balao = w.querySelector('.pnx-balao');
    var pupilas = w.querySelectorAll('.pnx-pupila');
    var svg = w.querySelector('svg');
    var i = Math.floor(Math.random() * msgs.length), tFala, vivo = true;

    // olhos seguem o rato / dedo
    function olhar(e) {
      var p = e.touches ? e.touches[0] : e; if (!p) return;
      var r = svg.getBoundingClientRect(); if (!r.width) return;
      var cx = r.left + r.width * 110 / 230, cy = r.top + r.height * 121 / 262;
      var dx = p.clientX - cx, dy = p.clientY - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, k = Math.min(1, d / 260);
      var tx = (dx / d) * 2.2 * k, ty = (dy / d) * 2.2 * k;
      for (var j = 0; j < pupilas.length; j++) pupilas[j].setAttribute('transform', 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ')');
    }
    window.addEventListener('pointermove', olhar, { passive: true });

    // pestanejar
    function piscar() {
      if (!vivo) return;
      w.classList.add('pisca'); setTimeout(function () { w.classList.remove('pisca'); }, 240);
      setTimeout(piscar, 2600 + Math.random() * 3800);
    }
    if (!reduz) setTimeout(piscar, 1800);

    // acenar ao passar o rato
    w.addEventListener('pointerenter', function () { w.classList.add('acena'); });
    w.addEventListener('pointerleave', function () { w.classList.remove('acena'); });

    function brilhos() {
      if (reduz) return;
      for (var k = 0; k < 14; k++) {
        var b = document.createElement('span'); b.className = 'pnx-brilho';
        var a = (Math.PI * 2 * k) / 14 + Math.random() * .4, dist = 50 + Math.random() * 50;
        b.style.left = '50%'; b.style.top = '40%';
        b.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(0) + 'px');
        b.style.setProperty('--dy', (Math.sin(a) * dist - 20).toFixed(0) + 'px');
        w.appendChild(b); (function (x) { setTimeout(function () { x.remove(); }, 950); })(b);
      }
    }

    function falar() {
      var m = msgs[i % msgs.length]; i++;
      balao.innerHTML = '<b>Ho ho ho!</b>' + m + (opts.link ? '<br><a href="' + opts.link.href + '"' + (opts.link.novo ? ' target="_blank" rel="noopener"' : '') + '>' + opts.link.texto + '</a>' : '');
      w.classList.remove('salta', 'ri'); void w.offsetWidth;
      w.classList.add('fala', 'salta', 'ri', 'acena');
      brilhos();
      var d = w.querySelector('.pnx-dica'); if (d) d.remove();
      clearTimeout(tFala);
      tFala = setTimeout(function () { w.classList.remove('fala', 'acena'); }, 6500);
      if (opts.aoTocar) try { opts.aoTocar(); } catch (e) {}
    }
    w.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) return; falar(); });
    w.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); falar(); } });

    // saudação automática uma vez, se pedida
    if (opts.saudar) setTimeout(function () { if (vivo) falar(); }, opts.saudar);

    return function desmontar() {
      vivo = false; clearTimeout(tFala);
      window.removeEventListener('pointermove', olhar);
      w.remove(); el.__pnx = null;
    };
  }

  window.PaiNatal = { mount: mount };
})();
