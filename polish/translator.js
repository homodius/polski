// Translation practice, shared by the Translate page (translate/) and its quiz (translate-quiz/):
// ask a free online translator for a sentence, and compare the visitor's own Polish with a
// reference word by word. Exposed as window.PolishTranslate (and module.exports for tests).
//
//   PolishTranslate.translate(text, from, to)  Promise of {text, by}; from/to are "en", "uk", "pl"
//   PolishTranslate.compare(mine, ref)         word-by-word comparison, see below
//   PolishTranslate.compareView(result)        the comparison drawn: both lines, a score and tips
//   PolishTranslate.links(text, from, to)      the same sentence on Google Translate and DeepL
//
// The site is static and has no key for a paid API, so it uses the translators that answer a
// browser for free: Google Translate's own web endpoint first (the one its web widget uses; the
// site already plays Google's speech audio), and MyMemory (about 5000 characters a day per
// visitor without a key) when Google refuses or is down.
(function (root) {
  var TIMEOUT = 8000;

  function withTimeout(url) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, TIMEOUT) : null;
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function google(text, from, to) {
    var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=" + from + "&tl=" + to +
      "&q=" + encodeURIComponent(text);
    return withTimeout(url).then(function (data) {
      var out = (data && data[0] || []).map(function (s) { return s && s[0] || ""; }).join("").trim();
      if (!out) throw new Error("empty answer");
      return { text: out, by: "Google Translate" };
    });
  }

  function myMemory(text, from, to) {
    var url = "https://api.mymemory.translated.net/get?langpair=" + from + "|" + to + "&q=" + encodeURIComponent(text);
    return withTimeout(url).then(function (data) {
      var out = data && data.responseData && data.responseData.translatedText;
      if (!out || Number(data.responseStatus) !== 200) throw new Error((data && data.responseDetails) || "no answer");
      return { text: String(out).trim(), by: "MyMemory" };
    });
  }

  var cache = {};

  // Resolves to {text, by}; rejects only when both translators fail.
  function translate(text, from, to) {
    text = String(text || "").trim();
    if (!text) return Promise.resolve({ text: "", by: "" });
    var key = from + "|" + to + "|" + text;
    if (cache[key]) return cache[key];
    cache[key] = google(text, from, to).catch(function () { return myMemory(text, from, to); });
    cache[key].catch(function () { delete cache[key]; });
    return cache[key];
  }

  function links(text, from, to) {
    var q = encodeURIComponent(text);
    return [
      { label: "Google Translate", href: "https://translate.google.com/?sl=" + from + "&tl=" + to + "&op=translate&text=" + q },
      { label: "DeepL", href: "https://www.deepl.com/translator#" + from + "/" + to + "/" + q },
    ];
  }

  // ---------- Comparing ----------

  // Polish letters without their marks: ą→a, ł→l, ż→z and so on.
  function fold(word) {
    return word.toLowerCase().replace(/ł/g, "l").normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Words with their edge punctuation taken off; `key` compares, `text` is shown.
  function words(text) {
    return String(text || "").split(/\s+/).map(function (raw) {
      var t = raw.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
      return { text: t, key: t.toLowerCase(), fold: fold(t) };
    }).filter(function (w) { return w.text; }).map(function (w, i) { w.i = i; return w; });
  }

  function sameStem(a, b) {
    var n = Math.min(a.length, b.length);
    if (n < 3) return false;
    var stem = Math.max(3, n - 3);
    return a.slice(0, stem) === b.slice(0, stem);
  }

  // How alike two words are, 0..1, by shared letter pairs (Dice coefficient).
  function similarity(a, b) {
    if (a === b) return 1;
    if (a.length < 2 || b.length < 2) return 0;
    var pairs = {}, shared = 0;
    for (var i = 0; i < a.length - 1; i++) { var p = a.substr(i, 2); pairs[p] = (pairs[p] || 0) + 1; }
    for (i = 0; i < b.length - 1; i++) { var q = b.substr(i, 2); if (pairs[q]) { pairs[q]--; shared++; } }
    return 2 * shared / (a.length + b.length - 2);
  }

  var PRONOUNS = ["ja", "ty", "on", "ona", "ono", "my", "wy", "oni", "one"];

  // Compares `mine` with `ref` word by word (case and punctuation don't count). Returns
  // {parts, score, tips}: parts is the alignment, in order, each {type, mine, ref}:
  //   same     the same word
  //   accent   the same word but for a Polish letter (zolw for żółw)
  //   ending   the same stem with another ending (kawa for kawę)
  //   changed  another word in its place
  //   moved    the same word in another place (shown on both lines)
//   extra    a word only in mine
  //   missing  a word only in ref
  // score is 0..100; tips are rules {en, uk} with {braced} Polish, for PolishPage.ruleBox.
  function compare(mine, ref) {
    var a = words(mine), b = words(ref);
    // Longest common run of words, matching letters without their marks.
    var n = a.length, m = b.length;
    var L = [];
    for (var i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) {
      for (var j = m - 1; j >= 0; j--) {
        L[i][j] = a[i].fold === b[j].fold ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      }
    }
    var parts = [];
    var gapA = [], gapB = [];
    function flush() {
      // Words between two matches: pair the look-alikes first (kawa / kawę), keeping pronouns
      // apart; a one-for-one swap pairs up whatever is left; the rest are extra or missing.
      var freeA = gapA.slice(), freeB = gapB.slice();
      var pairs = [];
      for (;;) {
        var best = null;
        freeA.forEach(function (x) {
          if (PRONOUNS.indexOf(x.key) !== -1) return;
          freeB.forEach(function (y) {
            var sim = similarity(x.fold, y.fold);
            if (sim >= 0.4 && (!best || sim > best.sim)) best = { a: x, b: y, sim: sim };
          });
        });
        if (!best) break;
        pairs.push([best.a, best.b]);
        freeA.splice(freeA.indexOf(best.a), 1);
        freeB.splice(freeB.indexOf(best.b), 1);
      }
      if (freeA.length === freeB.length) {
        freeA.forEach(function (x, k) { pairs.push([x, freeB[k]]); });
        freeA = [];
        freeB = [];
      }
      pairs.forEach(function (pr) {
        parts.push({ type: sameStem(pr[0].fold, pr[1].fold) ? "ending" : "changed", mine: pr[0].text, ref: pr[1].text, ia: pr[0].i, ib: pr[1].i });
      });
      freeA.forEach(function (w) { parts.push({ type: "extra", mine: w.text, ia: w.i }); });
      freeB.forEach(function (w) { parts.push({ type: "missing", ref: w.text, ib: w.i }); });
      gapA = [];
      gapB = [];
    }
    i = 0;
    j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[i].fold === b[j].fold) {
        flush();
        parts.push({ type: a[i].key === b[j].key ? "same" : "accent", mine: a[i].text, ref: b[j].text, ia: i, ib: j });
        i++;
        j++;
      } else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) {
        gapB.push(b[j++]);
      } else {
        gapA.push(a[i++]);
      }
    }
    flush();
    // A word on both sides but in another place: "moved" on both lines.
    parts.forEach(function (x) {
      if (x.type !== "extra") return;
      var other = parts.filter(function (y) { return y.type === "missing" && fold(y.ref) === fold(x.mine); })[0];
      if (!other) return;
      x.type = "moved";
      other.type = "moved";
    });

    var weight = { same: 1, moved: 0.9, accent: 0.75, ending: 0.5 };
    var got = parts.reduce(function (s, p) { return s + (p.type === "moved" ? (p.mine != null ? weight.moved : 0) : weight[p.type] || 0); }, 0);
    // A personal pronoun only on one side (Ja mam kota / Mam kota) is not a mistake: Polish may
    // leave it out or keep it for stress. It doesn't count towards the length either side.
    function isPronoun(word) { return word != null && PRONOUNS.indexOf(word.toLowerCase()) !== -1; }
    var extraPron = parts.filter(function (p) { return p.type === "extra" && isPronoun(p.mine); }).length;
    var missingPron = parts.filter(function (p) { return p.type === "missing" && isPronoun(p.ref); }).length;
    var score = Math.round(100 * got / Math.max(n - extraPron, m - missingPron, 1));
    return { parts: parts, score: score, tips: tips(parts, a, b) };
  }

  function list(items) {
    return items.slice(0, 4).join(", ");
  }

  function tips(parts, a, b) {
    var out = [];
    var by = function (t) { return parts.filter(function (p) { return p.type === t; }); };
    if (!a.length) return out;
    var accents = by("accent"), endings = by("ending"), changed = by("changed"),
      extra = by("extra"), missing = by("missing");
    if (accents.length) {
      var acc = function (word) { return list(accents.map(function (p) { return "**{" + p.ref + "}** " + word + " " + p.mine; })); };
      out.push({
        en: "Only the Polish letters differ: " + acc("not") + ". ą ę ł ó ś ć ń ź ż are letters of their own and change the sound.",
        uk: "Відрізняються лише польські літери: " + acc("замість") + ". ą ę ł ó ś ć ń ź ż — окремі літери, вони змінюють звук.",
      });
    }
    if (endings.length) {
      var end = list(endings.map(function (p) { return p.mine + " → **{" + p.ref + "}**"; }));
      out.push({
        en: "Same word, another ending: " + end + ". Check the case (who or what after a verb like {mam} or {lubię}, after a preposition), the gender or the verb's person.",
        uk: "Те саме слово, інше закінчення: " + end + ". Перевірте відмінок (після дієслова як {mam} чи {lubię}, після прийменника), рід або особу дієслова.",
      });
    }
    if (!parts.some(function (p) { return p.type === "same" || p.type === "accent" || p.type === "moved"; }) && !endings.length) {
      out.push({
        en: "Yours and the reference share no words. Hear the reference, read it slowly, then write it again from memory.",
        uk: "У вашому реченні й у зразку немає спільних слів. Послухайте зразок, прочитайте повільно й напишіть ще раз з пам'яті.",
      });
      return out;
    }
    var extraPronouns = extra.filter(function (p) { return PRONOUNS.indexOf(p.mine.toLowerCase()) !== -1; });
    if (extraPronouns.length) {
      out.push({
        en: "Polish usually leaves out " + list(extraPronouns.map(function (p) { return "{" + p.mine + "}"; })) + ": the verb's ending already says who. Keeping it is not wrong, it just stresses the person.",
        uk: "Польська зазвичай пропускає " + list(extraPronouns.map(function (p) { return "{" + p.mine + "}"; })) + ": закінчення дієслова вже каже, хто. Це не помилка, лише наголос на особі.",
      });
    }
    var otherExtra = extra.filter(function (p) { return extraPronouns.indexOf(p) === -1; });
    if (missing.length) {
      var miss = list(missing.map(function (p) { return "**{" + p.ref + "}**"; }));
      out.push({
        en: "The reference has words yours doesn't: " + miss + ".",
        uk: "У зразку є слова, яких немає у вас: " + miss + ".",
      });
    }
    if (otherExtra.length) {
      var ex = list(otherExtra.map(function (p) { return "{" + p.mine + "}"; }));
      out.push({
        en: "Yours has words the reference doesn't: " + ex + ".",
        uk: "У вас є слова, яких немає у зразку: " + ex + ".",
      });
    }
    if (changed.length) {
      var ch = list(changed.map(function (p) { return p.mine + " / **{" + p.ref + "}**"; }));
      out.push({
        en: "Different words: " + ch + ". It can be a synonym that is just as right: hear both and check the meaning below.",
        uk: "Різні слова: " + ch + ". Це може бути синонім, теж правильний: послухайте обидва й перевірте значення нижче.",
      });
    }
    var moved = by("moved").filter(function (p) { return p.mine != null; });
    if (moved.length) {
      var mv = list(moved.map(function (p) { return "{" + p.mine + "}"; }));
      out.push({
        en: "Some words are in another place: " + mv + ". Polish word order is freer than English, so this is often fine; the end of the sentence carries the stress.",
        uk: "Деякі слова стоять в іншому місці: " + mv + ". Порядок слів у польській вільніший, ніж в англійській, тож часто це нормально; наголос несе кінець речення.",
      });
    }
    return out;
  }

  // ---------- Drawing ----------

  function node(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var LABEL = {
    same: "same", accent: "Polish letter differs", ending: "ending differs",
    changed: "another word", moved: "in another place", extra: "only in yours", missing: "only in the reference",
  };

  // One sentence as word chips coloured by the comparison; `side` is "mine" or "ref".
  function line(parts, side) {
    var p = node("p", "tr-line");
    var idx = side === "mine" ? "ia" : "ib";
    parts.filter(function (part) { return part[side] != null; }).sort(function (x, y) { return x[idx] - y[idx]; }).forEach(function (part) {
      var text = part[side];
      if (text == null) return;
      var w = node("span", "tr-word tr-" + part.type, text);
      w.lang = "pl";
      w.title = LABEL[part.type];
      p.appendChild(w);
      p.appendChild(document.createTextNode(" "));
    });
    return p;
  }

  function sayRow(text, label) {
    var PP = root.PolishPage;
    var box = node("div", "tr-say");
    if (!PP || !text) return box;
    var normal = PP.iconButton(PP.SPEAKER, "Hear it", "Say " + label);
    normal.addEventListener("click", function () { PP.say(text, true); });
    var slow = PP.iconButton(PP.SPEAKER, "Hear it slowly", "Say " + label + " slowly");
    slow.classList.add("tr-slow");
    slow.innerHTML += '<span class="tr-slow-mark" aria-hidden="true">½</span>';
    slow.addEventListener("click", function () { PP.say(text, true, 0.7); });
    box.appendChild(normal);
    box.appendChild(slow);
    return box;
  }

  // The comparison: your Polish and the reference as coloured words, the score and the tips.
  // `refLabel` names the reference ("Translator", "Answer").
  function compareView(result, mine, ref, refLabel) {
    var box = node("div", "tr-compare");
    var rows = [["Yours", "mine", mine], [refLabel || "Reference", "ref", ref]];
    rows.forEach(function (r) {
      var row = node("div", "tr-row");
      var head = node("div", "tr-row-head");
      head.appendChild(node("span", "tr-row-label", r[0]));
      head.appendChild(sayRow(r[2], r[0]));
      row.appendChild(head);
      row.appendChild(line(result.parts, r[1]));
      box.appendChild(row);
    });
    var score = node("p", "tr-score");
    score.appendChild(node("strong", "", result.score + "%"));
    score.appendChild(document.createTextNode(result.score === 100 ? " match: word for word the same." :
      " match, word by word. A different word or order can still be right."));
    box.appendChild(score);
    var legend = node("p", "tr-legend pl-small pl-muted");
    ["accent", "ending", "changed", "moved", "extra", "missing"].forEach(function (t) {
      if (!result.parts.some(function (p) { return p.type === t; })) return;
      legend.appendChild(node("span", "tr-word tr-" + t, LABEL[t]));
      legend.appendChild(document.createTextNode(" "));
    });
    if (legend.childNodes.length) box.appendChild(legend);
    if (root.PolishPage) result.tips.forEach(function (t) { box.appendChild(root.PolishPage.ruleBox(t)); });
    return box;
  }

  var api = {
    translate: translate,
    links: links,
    fold: fold,
    words: words,
    compare: compare,
    compareView: compareView,
    sayRow: sayRow,
  };
  root.PolishTranslate = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
