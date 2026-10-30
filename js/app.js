/* SafeRed · comportamiento del sitio.
   Todo corre en el navegador del visitante: no hay servidor, cookies ni rastreo.
   El formulario solo arma un mensaje y lo abre en WhatsApp; la ubicación se procesa en el propio teléfono. */
(function () {
  "use strict";

  // Número para llamadas (formato 569XXXXXXXX, sin + ni espacios)
  var PHONE = "56926351188";
  // Líneas de WhatsApp: al cotizar, el visitante elige a cuál escribir
  var WA_LINES = [
    { label: "Felipe", num: "56926351188", show: "+56 9 2635 1188" },
    { label: "Eduardo", num: "56984201227", show: "+56 9 8420 1227" }
  ];
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var wa = function (msg) { return "https://wa.me/" + PHONE + (msg ? "?text=" + encodeURIComponent(msg) : ""); };

  // Limpia lo que escribe el visitante: sin caracteres de control, espacios normalizados y largo acotado
  var CONTROL = /[\x00-\x1f\x7f]+/g;
  var clean = function (s, max) { return String(s || "").replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, max); };

  // Enlaces de contacto
  document.querySelectorAll(".js-wa").forEach(function (a) {
    a.href = wa(a.dataset.msg); a.target = "_blank"; a.rel = "noopener noreferrer";
  });
  document.querySelectorAll(".js-tel").forEach(function (a) { a.href = "tel:+" + PHONE; });
  // Todo enlace que abre otra pestaña queda aislado de esta página
  document.querySelectorAll('a[target="_blank"]').forEach(function (a) { a.rel = "noopener noreferrer"; });

  // ---- Selector de WhatsApp: cualquier enlace a wa.me abre el menú para elegir la línea ----
  var pick = $("wa-pick"), opts = $("wa-options");
  var openPick = function (msg) {
    opts.textContent = "";
    WA_LINES.forEach(function (l) {
      var a = document.createElement("a");
      a.className = "wa-opt"; a.target = "_blank"; a.rel = "noopener noreferrer";
      a.href = "https://wa.me/" + l.num + (msg ? "?text=" + encodeURIComponent(msg) : "");
      var ic = document.createElement("span"); ic.className = "i i-wa"; ic.setAttribute("aria-hidden", "true");
      var tx = document.createElement("span"); tx.className = "wa-opt-text";
      var s1 = document.createElement("strong"); s1.textContent = l.label;
      var s2 = document.createElement("span"); s2.textContent = l.show;
      tx.appendChild(s1); tx.appendChild(s2);
      a.appendChild(ic); a.appendChild(tx);
      a.addEventListener("click", function () { setTimeout(function () { if (pick.close) pick.close(); }, 50); });
      opts.appendChild(a);
    });
    if (pick.showModal) pick.showModal(); else pick.setAttribute("open", "");
  };
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="https://wa.me/"]') : null;
    if (!a || a.classList.contains("wa-opt") || a.dataset.direct === "1") return;
    e.preventDefault();
    var t = null;
    try { t = new URL(a.href).searchParams.get("text"); } catch (err) {}
    openPick(t || "");
  });
  $("wa-pick-close").addEventListener("click", function () { if (pick.close) pick.close(); });
  pick.addEventListener("click", function (e) { if (e.target === pick && pick.close) pick.close(); });

  // Foto principal: si no carga, se muestra el respaldo de color
  var hero = document.querySelector(".photo img");
  if (hero) {
    var drop = function () { hero.remove(); };
    if (hero.complete && !hero.naturalWidth) drop(); else hero.addEventListener("error", drop);
  }

  // ---- Comunas: mapa, buscador y formulario ----
  var MAP = window.SAFERED_RM;
  var busca = $("f-busca"), res = $("cov-result"), sel = $("f-comuna");
  var norm = function (s) { return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/\s+/g, " ").trim(); };
  var COMUNAS = MAP ? MAP.c.map(function (c) { return c.n; }).sort(function (a, b) { return a.localeCompare(b, "es"); }) : [];

  var dl = $("comunas-rm");
  COMUNAS.forEach(function (c) {
    sel.add(new Option(c, c));
    var o = document.createElement("option"); o.value = c; dl.appendChild(o);
  });
  if (!COMUNAS.length) sel.add(new Option("Otra comuna de la RM", "Región Metropolitana"));

  function showMiss(text) {
    res.hidden = false; res.className = "cov-result miss"; res.textContent = text;
  }
  function showHit(name, fromGeo) {
    res.hidden = false; res.className = "cov-result"; res.textContent = "";
    var msg = name === "La Granja" ? "Estás en nuestra comuna base: La Granja." :
      (fromGeo ? "Estás en " + name + ". Sí, llegamos." : "Sí, llegamos a " + name + ".");
    res.appendChild(document.createTextNode(msg));
    var a = document.createElement("a");
    a.className = "btn btn-primary"; a.href = wa("Hola SafeRed, necesito un servicio en " + name + ". ");
    a.target = "_blank"; a.rel = "noopener noreferrer";
    var ic = document.createElement("span"); ic.className = "i i-wa"; a.appendChild(ic);
    a.appendChild(document.createTextNode("Cotizar en " + name));
    res.appendChild(a);
  }

  var G = {}, select = function () {};
  if (MAP) {
    var NS = "http://www.w3.org/2000/svg", svg = $("rm-map");
    var mk = function (tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    };
    var FULL = [0, 0, MAP.w, MAP.h], vb = FULL.slice();
    var gAreas = mk("g", {}, svg), gOver = mk("g", {}, svg);

    MAP.c.forEach(function (c) {
      var d = "", big = null, bigA = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      c.r.forEach(function (r) {
        var A = 0;
        d += "M" + r[0] + " " + r[1];
        for (var i = 0; i < r.length; i += 2) {
          if (i) d += "L" + r[i] + " " + r[i + 1];
          x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
          var j = (i + 2) % r.length; A += r[i] * r[j + 1] - r[j] * r[i + 1];
        }
        d += "Z";
        if (Math.abs(A) > bigA) { bigA = Math.abs(A); big = r; }
      });
      // centroide del anillo principal
      var cx = 0, cy = 0, A2 = 0;
      for (var i = 0; i < big.length; i += 2) {
        var j = (i + 2) % big.length, f = big[i] * big[j + 1] - big[j] * big[i + 1];
        A2 += f; cx += (big[i] + big[j]) * f; cy += (big[i + 1] + big[j + 1]) * f;
      }
      var p = mk("path", { d: d, "class": "cm" + (c.n === "La Granja" ? " base" : "") }, gAreas);
      mk("title", {}, p).textContent = c.n;
      p.addEventListener("click", function () { select(c.n); busca.value = c.n; });
      G[c.n] = { el: p, rings: c.r, box: [x0, y0, x1, y1], c: [cx / (3 * A2), cy / (3 * A2)] };
    });

    var BASE = G["La Granja"].c;
    var route = mk("path", { "class": "route", d: "" }, gOver);
    var baseRing = mk("circle", { "class": "pin-ring", cx: BASE[0], cy: BASE[1], r: 6 }, gOver);
    var basePin = mk("circle", { "class": "pin-base", cx: BASE[0], cy: BASE[1], r: 6 }, gOver);
    var userRing = mk("circle", { "class": "pin-ring user", r: 5, visibility: "hidden" }, gOver);
    var userPin = mk("circle", { "class": "pin-user", r: 5, visibility: "hidden" }, gOver);
    var resetBtn = $("map-reset"), current = null;

    var setVB = function (v) {
      vb = v; svg.setAttribute("viewBox", v.join(" "));
      var r = v[2] / 110; // los marcadores mantienen su tamaño en pantalla al hacer zoom
      [baseRing, basePin].forEach(function (e) { e.setAttribute("r", r); });
      [userRing, userPin].forEach(function (e) { e.setAttribute("r", r * 0.85); });
    };
    var zoomTo = function (t) {
      if (reduce) return setVB(t);
      var from = vb.slice(), t0 = performance.now();
      (function step(now) {
        var k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3);
        setVB(from.map(function (v, i) { return v + (t[i] - v) * e; }));
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    };
    var frame = function (box) {
      var ratio = MAP.w / MAP.h, cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
      var w = Math.max(box[2] - box[0], (box[3] - box[1]) * ratio, 150) * 1.5, h = w / ratio;
      return [cx - w / 2, cy - h / 2, w, h];
    };
    select = function (name, userPt) {
      if (current) G[current].el.classList.remove("sel");
      current = name; var g = G[name]; g.el.classList.add("sel");
      gAreas.appendChild(g.el); // trae la comuna al frente para que se vea su borde completo
      var to = userPt || g.c, b = g.box;
      if (name !== "La Granja") {
        var mx = (BASE[0] + to[0]) / 2, my = (BASE[1] + to[1]) / 2, dx = to[0] - BASE[0], dy = to[1] - BASE[1];
        route.setAttribute("d", "M" + BASE[0] + " " + BASE[1] + " Q" + (mx - dy * 0.25) + " " + (my + dx * 0.25) + " " + to[0] + " " + to[1]);
        b = [Math.min(b[0], BASE[0]), Math.min(b[1], BASE[1]), Math.max(b[2], BASE[0]), Math.max(b[3], BASE[1])];
      } else {
        route.setAttribute("d", "");
      }
      [userRing, userPin].forEach(function (e) {
        e.setAttribute("visibility", userPt ? "visible" : "hidden");
        if (userPt) { e.setAttribute("cx", userPt[0]); e.setAttribute("cy", userPt[1]); }
      });
      zoomTo(frame(b)); resetBtn.hidden = false;
      showHit(name, !!userPt);
    };
    resetBtn.addEventListener("click", function () {
      if (current) G[current].el.classList.remove("sel");
      current = null; route.setAttribute("d", "");
      [userRing, userPin].forEach(function (e) { e.setAttribute("visibility", "hidden"); });
      zoomTo(FULL); resetBtn.hidden = true;
    });
    setVB(FULL);
  } else {
    $("rm-map").closest(".map-card").hidden = true;
  }

  // Buscador por nombre (tolera tildes y nombres incompletos)
  busca.addEventListener("input", function () {
    var q = norm(clean(busca.value, 40));
    if (q.length < 3) { res.hidden = true; return; }
    var starts = COMUNAS.filter(function (c) { return norm(c).indexOf(q) === 0; });
    var hit = COMUNAS.filter(function (c) { return norm(c) === q; })[0] || (starts.length === 1 ? starts[0] : null);
    if (hit) select(hit);
    else if (!starts.length) showMiss("No encontramos esa comuna en la Región Metropolitana. Revisa cómo la escribiste o pregúntanos por WhatsApp.");
    else res.hidden = true;
  });

  // Usar mi ubicación: se calcula en qué comuna cae el punto, en el propio teléfono (no se envía ni se guarda)
  var inside = function (pt, r) {
    var c = false;
    for (var i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
      if ((r[i + 1] > pt[1]) !== (r[j + 1] > pt[1]) &&
          pt[0] < (r[j] - r[i]) * (pt[1] - r[i + 1]) / (r[j + 1] - r[i + 1]) + r[i]) c = !c;
    }
    return c;
  };
  var geoBtn = $("geo-btn"), geoLabel = $("geo-label");
  var geoDone = function () { geoBtn.classList.remove("loading"); geoLabel.textContent = "Usar mi ubicación"; };
  geoBtn.addEventListener("click", function () {
    if (!navigator.geolocation || !MAP) return showMiss("Tu navegador no permite usar la ubicación. Escribe tu comuna arriba.");
    geoBtn.classList.add("loading"); geoLabel.textContent = "Buscando tu ubicación...";
    navigator.geolocation.getCurrentPosition(function (pos) {
      geoDone();
      var pt = [(pos.coords.longitude * MAP.k - MAP.minx) * MAP.s, (-pos.coords.latitude - MAP.miny) * MAP.s];
      var hit = null;
      for (var n in G) { if (G[n].rings.some(function (r) { return inside(pt, r); })) { hit = n; break; } }
      if (hit) { busca.value = hit; select(hit, pt); }
      else showMiss("Tu ubicación está fuera de la Región Metropolitana. Escríbenos por WhatsApp y vemos si podemos llegar.");
    }, function () {
      geoDone();
      showMiss("No pudimos obtener tu ubicación. Revisa el permiso de ubicación del navegador o escribe tu comuna arriba.");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
  });

  // ---- Ventanas: foto ampliada y privacidad ----
  var openDialog = function (d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); };
  var closeDialog = function (d) { if (d.close) d.close(); else d.removeAttribute("open"); };
  var lb = $("lightbox"), lbImg = $("lb-img"), lbCap = $("lb-cap");
  document.querySelectorAll(".shot").forEach(function (b) {
    b.addEventListener("click", function () {
      var im = b.querySelector("img");
      lbImg.src = im.currentSrc || im.src; lbImg.alt = im.alt; lbCap.textContent = b.dataset.cap;
      openDialog(lb);
    });
  });
  $("lb-close").addEventListener("click", function () { closeDialog(lb); });
  var priv = $("privacy");
  document.querySelectorAll(".js-privacy").forEach(function (b) { b.addEventListener("click", function () { openDialog(priv); }); });
  $("privacy-close").addEventListener("click", function () { closeDialog(priv); });
  [lb, priv].forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) closeDialog(d); }); });

  // ---- Formulario: arma el mensaje y lo abre en WhatsApp (no se envía a ningún servidor) ----
  var form = $("lead"), detalle = $("f-detalle"), count = $("detalle-count");
  var updateCount = function () { count.textContent = detalle.value.length + " / " + detalle.maxLength; };
  detalle.addEventListener("input", updateCount); updateCount();
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = true;
    var nombre = clean(form.elements.nombre.value, 60);
    var comuna = COMUNAS.indexOf(form.elements.comuna.value) >= 0 ? form.elements.comuna.value : clean(form.elements.comuna.value, 40);
    var servicio = clean(form.elements.servicio.value, 40);
    [["nombre", nombre], ["comuna", comuna], ["servicio", servicio]].forEach(function (f) {
      var el = form.elements[f[0]], bad = !f[1];
      el.closest(".field").classList.toggle("invalid", bad);
      el.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad && ok) { el.focus(); ok = false; }
    });
    if (!ok) return;
    var extra = clean(detalle.value, 500);
    var msg = "Hola SafeRed, soy " + nombre + " de " + comuna + ". Necesito: " + servicio + "." + (extra ? " " + extra : "");
    openPick(msg); // el visitante elige a qué línea de WhatsApp enviar
  });
  form.querySelectorAll("input, select").forEach(function (el) {
    el.addEventListener("input", function () { el.closest(".field").classList.remove("invalid"); el.setAttribute("aria-invalid", "false"); });
  });

  // ---- Aparición de secciones al entrar en pantalla ----
  var items = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Botón WhatsApp: un llamado de atención a los 4 s, una sola vez por visita ----
  var seen = false;
  try { seen = sessionStorage.getItem("sr-tip") === "1"; } catch (e) {}
  if (!reduce && !seen) {
    setTimeout(function () {
      var fab = document.querySelector(".wa-fab"), tip = $("wa-tip");
      fab.classList.add("nudge"); tip.classList.add("show");
      try { sessionStorage.setItem("sr-tip", "1"); } catch (e) {}
      setTimeout(function () { tip.classList.remove("show"); }, 6000);
    }, 4000);
  }

  // ---- Sin señal: las llamadas siguen funcionando, así que lo avisamos ----
  var bar = $("offline-bar");
  var syncOnline = function () { bar.hidden = navigator.onLine !== false; };
  addEventListener("online", syncOnline); addEventListener("offline", syncOnline); syncOnline();

  // Año del pie
  $("year").textContent = String(new Date().getFullYear());

  // ---- Modo sin señal: guarda la página en el teléfono tras la primera visita (solo en el sitio publicado) ----
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").then(function () { return navigator.serviceWorker.ready; }).then(function (reg) {
        var urls = [location.href.split("#")[0]];
        performance.getEntriesByType("resource").forEach(function (r) {
          if (r.name.indexOf(location.origin) === 0) urls.push(r.name);
        });
        if (reg.active) reg.active.postMessage({ type: "cache", urls: urls });
      }).catch(function () {});
    });
  }
})();
