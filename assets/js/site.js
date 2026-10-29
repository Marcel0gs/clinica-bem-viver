/* =====================================================================
   Clínica Bem Viver: comportamento das sete páginas.
   Regra: se este arquivo não carregar, a página continua completa e legível.
   Cada bloco só roda se a página tiver o que ele procura.
   ===================================================================== */
(function () {
  "use strict";
  var d = document.documentElement;
  var reduzido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var temObs = "IntersectionObserver" in window;
  var ZAP = "5531989134114";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function linkZap(texto) { return "https://wa.me/" + ZAP + "?text=" + encodeURIComponent(texto); }

  /* ---------- 0. links de WhatsApp com mensagem ----------
     O texto mora em data-zap, legível no HTML. Sem JS o href já leva ao
     WhatsApp da clínica, só sem a mensagem pronta. */
  $$("[data-zap]").forEach(function (a) { a.href = linkZap(a.getAttribute("data-zap")); });

  /* ---------- 1a. abertura ----------
     A tela abre a partir da cabeça do símbolo: o centro da máscara é medido
     na hora da saída, porque muda com o tamanho da tela. */
  var intro = $("#intro");
  if (intro && d.classList.contains("com-intro")) {
    var saiu = false, calma = d.classList.contains("intro-calma");
    var sair = function () {
      if (saiu) return;
      saiu = true;
      var cab = $(".intro__cabeca", intro);
      if (cab) {
        var rc = cab.getBoundingClientRect();
        intro.style.setProperty("--cx", (rc.left + rc.width / 2).toFixed(0) + "px");
        intro.style.setProperty("--cy", (rc.top + rc.height / 2).toFixed(0) + "px");
      }
      intro.classList.add("sai");
      d.classList.add("pronto");
      setTimeout(function () { d.classList.remove("com-intro"); }, 550);
      setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1500);
      try { sessionStorage.setItem("bemviver-abertura", "1"); } catch (e) {}
    };
    setTimeout(sair, calma ? 1300 : 3400);
    setTimeout(sair, 6000);   /* aba em segundo plano ou rede lenta: nunca prender ninguém */
    intro.addEventListener("click", sair);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") sair(); });
  } else if (intro) {
    intro.parentNode.removeChild(intro);
  }

  /* ---------- 1b. capa: as salas passando ----------
     O fim da animação da barrinha ativa é o relógio: pausar a barrinha
     (cursor em cima, aba escondida) pausa a troca sem timer paralelo. */
  var capa = $("[data-capa]");
  if (capa) {
    var slides = $$(".capa__slide", capa), botoes = $$(".capa__ponto", capa);
    var numCapa = $("[data-capa-num]", capa), nomeCapa = $("[data-capa-nome]", capa);
    var atual = 0;
    var vaiPara = function (i) {
      atual = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("ativo", k === atual); });
      botoes.forEach(function (b, k) {
        b.classList.remove("ativo");
        b.setAttribute("aria-pressed", k === atual ? "true" : "false");
      });
      void botoes[atual].offsetWidth;   /* reinicia a barrinha mesmo clicando na mesma */
      botoes[atual].classList.add("ativo");
      if (numCapa) numCapa.textContent = "0" + (atual + 1);
      if (nomeCapa) nomeCapa.textContent = slides[atual].getAttribute("data-nome");
    };
    botoes.forEach(function (b, k) {
      b.addEventListener("click", function () { vaiPara(k); });
      if (!reduzido) b.addEventListener("animationend", function () { if (k === atual) vaiPara(atual + 1); });
    });
    var pausa = function (sim) { capa.classList.toggle("capa--pausa", sim); };
    capa.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pausa(true); });
    capa.addEventListener("pointerleave", function () { pausa(false); });
    document.addEventListener("visibilitychange", function () { pausa(document.hidden); });
    /* durante a abertura a capa espera parada */
    if (d.classList.contains("com-intro")) {
      pausa(true);
      var esperaAbrir = new MutationObserver(function () {
        if (d.classList.contains("pronto")) { pausa(false); vaiPara(0); esperaAbrir.disconnect(); }
      });
      esperaAbrir.observe(d, { attributes: true, attributeFilter: ["class"] });
    }
  }

  /* ---------- 1c. cursor: as três bolinhas da marca em fila ----------
     Cada bolinha persegue a da frente com um atraso; o anel cresce sobre o
     que é clicável e o clique solta um punhado de bolinhas. */
  if (!reduzido && window.matchMedia && matchMedia("(pointer: fine)").matches) {
    var cur = document.createElement("div");
    cur.className = "cursor cursor--fora";
    cur.setAttribute("aria-hidden", "true");
    cur.innerHTML = '<span class="cursor__anel"></span><span class="cursor__bola"></span><span class="cursor__bola"></span><span class="cursor__bola"></span>';
    document.body.appendChild(cur);
    var pecas = Array.prototype.slice.call(cur.children);
    var alvo = { x: -100, y: -100 };
    var pos = pecas.map(function () { return { x: -100, y: -100 }; });
    var VEL = [0.24, 0.42, 0.3, 0.24];   /* anel, e cada bolinha atrás da anterior */
    var rodando = false;
    var CLICAVEL = "a,button,label,summary,input,select,textarea,[role=button]";
    var ESCURO = ".guia-sec,.chamada,.rodape,.pessoa--caa,.esp__card--guia,.faixa,.capa__fotos,.citacao,.intro";
    var passo = function () {
      var mexeu = false;
      pecas.forEach(function (p, i) {
        var guia = i <= 1 ? alvo : pos[i - 1];
        var q = pos[i];
        q.x += (guia.x - q.x) * VEL[i];
        q.y += (guia.y - q.y) * VEL[i];
        if (Math.abs(guia.x - q.x) > .2 || Math.abs(guia.y - q.y) > .2) mexeu = true;
        p.style.transform = "translate3d(" + q.x.toFixed(1) + "px," + q.y.toFixed(1) + "px,0)";
      });
      if (mexeu) requestAnimationFrame(passo); else rodando = false;
    };
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      alvo.x = e.clientX; alvo.y = e.clientY;
      if (cur.classList.contains("cursor--fora")) {
        pos.forEach(function (q) { q.x = alvo.x; q.y = alvo.y; });
        cur.classList.remove("cursor--fora");
      }
      var t = e.target && e.target.closest ? e.target : null;
      cur.classList.toggle("cursor--sobre", !!(t && t.closest(CLICAVEL)));
      cur.classList.toggle("cursor--escuro", !!(t && t.closest(ESCURO)));
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }, { passive: true });
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) cur.classList.add("cursor--fora"); });
    var CORES = ["var(--rosa)", "var(--mel)", "var(--folha)", "var(--salvia)"];
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      for (var k = 0; k < 9; k++) {
        var f = document.createElement("span");
        var ang = (k / 9) * Math.PI * 2 + Math.random() * .5, dist = 28 + Math.random() * 34;
        f.className = "faisca";
        f.style.background = CORES[k % CORES.length];
        f.style.setProperty("--x0", e.clientX + "px");
        f.style.setProperty("--y0", e.clientY + "px");
        f.style.setProperty("--x1", (e.clientX + Math.cos(ang) * dist).toFixed(1) + "px");
        f.style.setProperty("--y1", (e.clientY + Math.sin(ang) * dist).toFixed(1) + "px");
        document.body.appendChild(f);
        setTimeout(function (el) { return function () { if (el.parentNode) el.parentNode.removeChild(el); }; }(f), 800);
      }
    });
  }

  /* ---------- 1. topo e botão flutuante ---------- */
  var topo = $(".topo"), zap = $(".zap");
  function aoRolar() {
    var y = window.pageYOffset || d.scrollTop || 0;
    if (topo) topo.classList.toggle("topo--rolado", y > 24);
    if (zap) zap.classList.toggle("zap--on", y > innerHeight * .6);
  }
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  /* ---------- 2. gaveta do celular ---------- */
  var botaoMenu = $(".menu-btn"), gaveta = $("#gaveta");
  if (botaoMenu && gaveta) {
    var abre = function (sim) {
      gaveta.classList.toggle("gaveta--aberta", sim);
      botaoMenu.setAttribute("aria-expanded", sim ? "true" : "false");
      document.body.style.overflow = sim ? "hidden" : "";
      if (sim) { var f = $(".gaveta__fechar", gaveta); if (f) setTimeout(function () { f.focus(); }, 60); }
      else botaoMenu.focus();
    };
    botaoMenu.addEventListener("click", function () { abre(true); });
    gaveta.addEventListener("click", function (e) {
      if (e.target === gaveta || e.target.closest(".gaveta__fechar") || e.target.closest("a")) abre(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && gaveta.classList.contains("gaveta--aberta")) abre(false);
    });
  }

  /* ---------- 3. hero coberto pelo scroll ----------
     Medidas em cache: por quadro só se lê window.pageYOffset. */
  var hero = $(".hero");
  if (hero) {
    var alturaHero = 0, inicio = 0, pedidoH = false;
    var cobre = function () {
      pedidoH = false;
      var p = ((window.pageYOffset || 0) - inicio) / innerHeight;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      hero.style.setProperty("--cobre", reduzido ? (p >= 1 ? 1 : 0) : p.toFixed(3));
      hero.classList.toggle("hero--coberto", p >= 1);
    };
    var mede = function () {
      alturaHero = hero.offsetHeight;
      hero.style.setProperty("--hero-topo", Math.min(0, innerHeight - alturaHero) + "px");
      inicio = Math.max(0, alturaHero - innerHeight);
      cobre();
    };
    addEventListener("scroll", function () { if (!pedidoH) { pedidoH = true; requestAnimationFrame(cobre); } }, { passive: true });
    addEventListener("resize", mede);
    mede();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mede);
  }

  /* ---------- 4. parallax ----------
     Cada peça anda (distância do centro da tela) x velocidade, na propriedade
     `translate`, que não briga com transform de animação nem de hover.
     As peças do hero usam a rolagem da página: o hero está travado no topo. */
  var camadas = reduzido ? [] : $$("[data-px]").map(function (el) {
    return { el: el, v: parseFloat(el.getAttribute("data-px")) || 0, hero: !!el.closest(".hero"), pai: el.closest("[data-px-pai]") || el.closest("section") || el.parentElement };
  });
  var pedidoP = false;
  function parallax() {
    pedidoP = false;
    var meio = innerHeight / 2, fator = innerWidth < 700 ? .5 : 1, y = window.pageYOffset || 0;
    var desl = camadas.map(function (c) {
      if (c.hero) return y > innerHeight * 1.3 ? null : -y * c.v * fator * 1.3;
      var r = c.pai.getBoundingClientRect();
      if (r.bottom < -300 || r.top > innerHeight + 300) return null;
      return ((r.top + r.height / 2) - meio) * c.v * fator;
    });
    camadas.forEach(function (c, i) { if (desl[i] !== null) c.el.style.translate = "0 " + desl[i].toFixed(1) + "px"; });
  }
  if (camadas.length) {
    var pedeP = function () { if (!pedidoP) { pedidoP = true; requestAnimationFrame(parallax); } };
    addEventListener("scroll", pedeP, { passive: true });
    addEventListener("resize", pedeP);
    parallax();
  }

  /* ---------- 5. bolinhas que fogem do cursor e do toque ----------
     As bolinhas são as da parede da sala infantil. Perto do ponteiro, cada
     uma é empurrada pra longe; quando o ponteiro sai, voltam no lugar com
     uma mola (a transição do CSS). */
  if (!reduzido) {
    $$("[data-pontos]").forEach(function (caixa) {
      var area = caixa.closest("section") || caixa.parentElement;
      var bolas = $$(".ponto i", caixa);
      if (!bolas.length || !area) return;
      var px = 0, py = 0, pedido = false, RAIO = 150, FORCA = 46;
      var empurra = function () {
        pedido = false;
        bolas.forEach(function (b) {
          var r = b.getBoundingClientRect();
          var dx = r.left + r.width / 2 - px, dy = r.top + r.height / 2 - py;
          var dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist > RAIO) { b.style.transform = ""; return; }
          var k = (1 - dist / RAIO) * FORCA;
          b.style.transform = "translate(" + (dx / dist * k).toFixed(1) + "px," + (dy / dist * k).toFixed(1) + "px)";
        });
      };
      var move = function (e) { px = e.clientX; py = e.clientY; if (!pedido) { pedido = true; requestAnimationFrame(empurra); } };
      area.addEventListener("pointermove", move, { passive: true });
      area.addEventListener("pointerdown", move, { passive: true });
      area.addEventListener("pointerleave", function () { bolas.forEach(function (b) { b.style.transform = ""; }); });
    });
  }

  /* ---------- 6. entrada ao rolar ---------- */
  $$("[data-rev-grupo]").forEach(function (g) {
    $$("[data-rev]", g).forEach(function (el, i) { el.style.setProperty("--o", i % 6); });
  });
  var revs = $$("[data-rev]");
  /* Depois de entrar, o elemento larga o data-rev: senão o transform:none da
     entrada vence o transform do hover (o card que levanta). */
  var solta = function (el) {
    setTimeout(function () { el.removeAttribute("data-rev"); el.classList.remove("rev-ok"); }, 1500);
  };
  if (temObs && !reduzido) {
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (it.isIntersecting) { it.target.classList.add("rev-ok"); obs.unobserve(it.target); solta(it.target); }
      });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    revs.forEach(function (el) { obs.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add("rev-ok"); });
  }

  /* ---------- 7. horário: marca o dia de hoje e diz se está aberto ----------
     Horário da ficha do Google: seg a sex 8h às 17h, quarta até 18h. */
  var tabela = $("[data-horas]");
  if (tabela) {
    var agora = new Date(), dia = agora.getDay(), min = agora.getHours() * 60 + agora.getMinutes();
    var linha = $('[data-dia~="' + dia + '"]', tabela);
    if (linha) linha.classList.add("hoje");
    var fecha = dia === 3 ? 18 * 60 : 17 * 60;
    var aberto = dia >= 1 && dia <= 5 && min >= 8 * 60 && min < fecha;
    var selo = $("[data-agora]");
    if (selo) selo.textContent = aberto ? "Aberto agora" : "Fechado agora. Pode mandar mensagem, a recepção responde no próximo horário";
  }

  /* ---------- 8. guia "Por onde começar?" ----------
     Três perguntas e a mensagem do WhatsApp sai pronta: especialidade, pra
     quem, o que chamou atenção e o convênio. A recepção já recebe triado.
     É orientação, não diagnóstico, e o painel diz isso. */
  var guia = $("[data-guia]");
  if (guia) {
    var base = guia.getAttribute("data-base") || "";
    var ESP = {
      "psi-adulto":   { nome: "Psicologia adulto", quem: "Com a psicóloga Carine Pinheiro de Andrade", url: "especialidades/psicologia-adulto/", ic: "i-poltrona", foto: "eq-carine" },
      "psi-infantil": { nome: "Psicologia infantojuvenil", quem: "Com a psicóloga infantil Liliane Martins, às sextas", url: "especialidades/psicologia-infantil/", ic: "i-sorriso", foto: "eq-liliane" },
      "neuro":        { nome: "Avaliação neuropsicológica", quem: "Investiga atenção, memória, linguagem e aprendizagem", url: "especialidades/avaliacao-neuropsicologica/", ic: "i-cerebro" },
      "fono":         { nome: "Fonoaudiologia infantil", quem: "Com a fonoaudióloga Jussara Werner", url: "especialidades/fonoaudiologia-infantil/", ic: "i-fala", foto: "eq-jussara" },
      "orofacial":    { nome: "Reabilitação orofacial", quem: "Com a fonoaudióloga Rita de Cássia", url: "especialidades/reabilitacao-orofacial/", ic: "i-rosto", foto: "eq-rita" },
      "fisio":        { nome: "Fisioterapia", quem: "Com a fisioterapeuta Simone", url: "especialidades/fisioterapia/", ic: "i-corpo", foto: "eq-simone" },
      "nutri":        { nome: "Nutrição", quem: "Com a nutricionista Jordanya Malta", url: "especialidades/nutricao/", ic: "i-maca", foto: "eq-jordanya" }
    };
    // 29/10/2026 (pedido dele: "mais visual"): cada sinal ganhou um ícone, o 4º item.
    var SINAIS = {
      adulto: [
        ["a-ansiedade", "Ansiedade, tristeza ou estresse", ["psi-adulto"], "i-chuva"],
        ["a-fase", "Luto, separação ou uma fase difícil", ["psi-adulto"], "i-coracao"],
        ["a-menopausa", "Menopausa e as mudanças dessa fase", ["psi-adulto", "nutri"], "i-flor"],
        ["a-memoria", "Esquecimentos ou dificuldade de concentração", ["neuro"], "i-cerebro"],
        ["a-dor", "Dor na coluna, no pescoço ou nas articulações", ["fisio"], "i-osso"],
        ["a-lesao", "Recuperação de lesão ou cirurgia", ["fisio"], "i-curativo"],
        ["a-peso", "Alimentação, peso ou exames alterados", ["nutri"], "i-salada"],
        ["a-face", "Recuperação de cirurgia ortognática ou na face", ["orofacial"], "i-rosto"]
      ],
      crianca: [
        ["c-fala", "Fala pouco ou começou a falar tarde", ["fono"], "i-balao"],
        ["c-sons", "Fala difícil de entender, troca ou omite sons", ["fono"], "i-som"],
        ["c-caa", "Ainda não fala e precisa de outro jeito de se comunicar", ["fono"], "i-formas"],
        ["c-birra", "Medos, birras ou choro que atrapalham a rotina", ["psi-infantil"], "i-raio"],
        ["c-mudou", "Mudou de comportamento depois de algo marcante", ["psi-infantil"], "i-mudou"],
        ["c-escola", "Dificuldade na escola: atenção, leitura ou memória", ["neuro", "psi-infantil"], "i-livro"],
        ["c-tea", "A escola ou o médico falou em TEA ou TDAH", ["neuro", "psi-infantil", "fono"], "i-quebra"],
        ["c-come", "Come pouco, é muito seletivo ou tem o peso fora do esperado", ["nutri"], "i-talher"],
        ["c-adolesc", "Ansiedade, tristeza ou isolamento na adolescência", ["psi-infantil"], "i-garoa"]
      ]
    };
    var PRA_QUEM = { eu: "para mim", filho: "para meu filho ou minha filha", familiar: "para uma pessoa da minha família" };
    var ROTULO_QUEM = { eu: "Para mim", filho: "Para meu filho ou filha", familiar: "Para outra pessoa da família" };

    var caixaSinais = $("[data-sinais]", guia), res = $("[data-res]", guia);
    var passo1 = $('[data-passo="1"]', guia), passo2 = $('[data-passo="2"]', guia), passo3 = $('[data-passo="3"]', guia);
    var marcados = {};

    var quem = function () { var r = $('input[name="quem"]:checked', guia); return r ? r.value : ""; };
    var conv = function () { var r = $('input[name="conv"]:checked', guia); return r ? r.value : ""; };

    var montaSinais = function () {
      var q = quem();
      var lista = q === "filho" ? SINAIS.crianca : SINAIS.adulto;
      caixaSinais.innerHTML = lista.map(function (s) {
        return '<label class="chip chip--sinal"><input type="checkbox" name="sinal" value="' + s[0] + '"' + (marcados[s[0]] ? " checked" : "") +
          '><span><i class="chip__ic"><svg class="ic" aria-hidden="true"><use href="#' + s[3] + '"/></svg></i>' + s[1] +
          '<i class="chip__marca"><svg class="ic" aria-hidden="true"><use href="#i-check"/></svg></i></span></label>';
      }).join("");
    };

    var escolhidos = function () {
      var q = quem(), lista = q === "filho" ? SINAIS.crianca : SINAIS.adulto;
      return lista.filter(function (s) { return marcados[s[0]]; });
    };

    var juntaE = function (itens) {
      if (itens.length < 2) return itens.join("");
      return itens.slice(0, -1).join(", ") + " e " + itens[itens.length - 1];
    };

    var desenha = function () {
      var q = quem(), sinais = escolhidos(), c = conv();
      passo2.classList.toggle("passo--espera", !q);
      passo3.classList.toggle("passo--espera", !sinais.length);
      passo1.classList.toggle("passo--feito", !!q);
      passo2.classList.toggle("passo--feito", !!sinais.length);
      passo3.classList.toggle("passo--feito", !!c);

      if (!q || !sinais.length) {
        // a trilha mostra no painel o que já foi respondido, passo a passo
        var trilha = [["Para quem", q ? ROTULO_QUEM[q] : ""],
          ["O que tem chamado atenção", sinais.length ? sinais.length + (sinais.length > 1 ? " marcados" : " marcado") : ""],
          ["Convênio", c]];
        res.innerHTML =
          '<svg class="guia__vazio-fig" viewBox="0 0 100 100" aria-hidden="true"><use href="#bv-simbolo"/></svg>' +
          '<h3>' + (q ? "Agora, o que tem chamado sua atenção?" : "A gente indica por onde começar") + "</h3>" +
          '<p class="guia__vazio">' + (q ? "Marque um ou mais itens no passo 2. A indicação aparece aqui na hora." :
            "Responda as perguntas e aparece aqui qual especialidade procurar, com quem, e a mensagem pronta para a recepção.") + "</p>" +
          '<ol class="guia__trilha">' + trilha.map(function (p, i) {
            return '<li' + (p[1] ? ' class="feito"' : "") + '><span class="guia__trilha-n">' +
              (p[1] ? '<svg class="ic" aria-hidden="true"><use href="#i-check"/></svg>' : i + 1) + "</span><b>" + p[0] + "</b>" +
              (p[1] ? "<small>" + p[1] + "</small>" : "") + "</li>";
          }).join("") + "</ol>";
        return;
      }

      var pontos = {};
      sinais.forEach(function (s, i) {
        s[2].forEach(function (k, j) { pontos[k] = (pontos[k] || 0) + 10 - j * 3 - i * .1; });
      });
      var ordem = Object.keys(pontos).sort(function (a, b) { return pontos[b] - pontos[a]; }).slice(0, 3);
      var nomes = ordem.map(function (k) { var n = ESP[k].nome; return n.charAt(0).toLowerCase() + n.slice(1); });

      var msg = "Olá! Vim pelo site da Bem Viver e gostaria de agendar " + juntaE(nomes) + " " + PRA_QUEM[q] + "." +
        "\nO que tem chamado atenção: " + sinais.map(function (s) { return s[1].charAt(0).toLowerCase() + s[1].slice(1); }).join("; ") + "." +
        (c === "Particular" ? "\nSeria particular." : c === "Ainda não sei" ? "\nAinda não sei se vou usar convênio." : c ? "\nConvênio: " + c + "." : "");

      res.innerHTML =
        "<h3>Por onde começar</h3>" +
        '<p class="guia__vazio">' + (ordem.length > 1 ? "Pelo que você marcou, estas especialidades podem ajudar:" : "Pelo que você marcou, esta especialidade pode ajudar:") + "</p>" +
        '<ul class="guia__lista">' + ordem.map(function (k, i) {
          var e = ESP[k];
          var fig = e.foto ? '<img class="guia__item-foto" src="' + base + "assets/img/" + e.foto + '.webp" alt="" width="56" height="56" loading="lazy" decoding="async">' :
            '<span class="guia__item-ic"><svg class="ic" aria-hidden="true"><use href="#' + e.ic + '"/></svg></span>';
          return '<li class="guia__item" style="--i:' + i + '">' + fig +
            "<b>" + e.nome + "</b><small>" + e.quem + ' · <a href="' + base + e.url + '">ver a página</a></small></li>';
        }).join("") + "</ul>" +
        '<p class="guia__msg"><b>Mensagem que vai pronta:</b>\n' + msg.replace(/</g, "&lt;") + "</p>" +
        '<a class="btn" href="' + linkZap(msg) + '" target="_blank" rel="noopener"><svg class="ic zap-ic" aria-hidden="true"><use href="#i-zap"/></svg>Enviar para a recepção</a>' +
        '<p class="guia__aviso">É uma orientação para facilitar o primeiro contato, não um diagnóstico. Na conversa, a equipe confirma o melhor caminho e a cobertura do seu convênio.</p>' +
        '<button type="button" class="guia__limpar" data-limpar>Começar de novo</button>';
    };

    guia.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "quem") { marcados = {}; montaSinais(); }
      if (t.name === "sinal") marcados[t.value] = t.checked;
      desenha();
    });
    guia.addEventListener("click", function (e) {
      if (!e.target.closest("[data-limpar]")) return;
      guia.reset(); marcados = {}; montaSinais(); desenha();
      var primeiro = $('input[name="quem"]', guia); if (primeiro) primeiro.focus();
    });
    guia.addEventListener("submit", function (e) { e.preventDefault(); });
    montaSinais();
    desenha();
  }
})();
