# Taglish Product Copy — Para sa Admin Panel & Client Sign-Off

**Para kanino:** Noel AgriTV store owner / admin
**Petsa:** 2026-05-31
**Status:** DRAFT translation — kailangan ng iyong pag-review bago tuluyang i-live

---

## Section 1 — Ano ito, at ang UNANG bagay na dapat i-check

Ang lahat ng text sa website (mga button, menu, checkout, atbp.) ay **Taglish na** ngayon. Kasama rito, isinalin namin sa Taglish ang **4 na produkto** — ang kanilang description, specs (mga detalye), at safety notes. **Draft pa lang ito** — ikaw ang huling magsasabi kung tama ang mga salita (lalo na ang agronomy / mga termino sa pagsasaka).

### ⚠ Ang UNANG dapat i-check: nasaan ang iyong mga produkto?

Ang website ay may dalawang posibleng pinagkukuhanan ng product copy:

1. **Built-in defaults** (nakasulat na sa code) — ito ang bagong Taglish na isinalin namin.
2. **Admin panel (cloud)** — kung nag-edit o nag-add ka na ng produkto sa admin, ang iyong kopya ang lumalabas sa live na site, **hindi** ang built-in defaults.

**Paano malalaman kung alin ang live ngayon — simpleng tanong:**

> **Nag-edit o nag-add ka na ba ng produkto sa Noel AgriTV admin panel? (Kasama na rito ang pag-pindot ng "Seed built-in products" button, o pag-save ng kahit anong produkto.)**
>
> - **OO** → Ang live na site ay gumagamit ng **IYONG kopya mula sa cloud (admin)**. Ito ang nag-o-override sa Taglish defaults. **Kailangan mong i-paste ang Taglish na nasa baba (Section 2) sa bawat produkto sa admin para lumabas ang Taglish sa live na site.** Hangga't hindi mo ginagawa ito, mananatiling English ang produkto sa live site kahit na-deploy na ang update.
>
> - **HINDI** (defaults pa rin ang mga produkto) → **Live na agad ang Taglish** kapag na-deploy ang update na ito. Wala ka nang kailangang gawin sa admin — pero pwede mo pa ring basahin ang Section 3 at 4 para sa sign-off.

> **Bakit ganito?** Sa code, kapag may kahit isang naka-save na (at "visible") na produkto sa admin (`customProducts`), **buong pinapalitan** nito ang built-in defaults sa storefront — hindi pinaghahalo. Kaya kung minsan mo lang in-edit ang isang produkto, ang LAHAT ng apat ay galing na sa admin, at lahat ay kailangang i-paste-an ng Taglish. (Reference: `src/lib/admin-to-product.ts` + ang mga storefront page sa `src/app/(storefront)/`.)

### Tungkol sa maiksing tagline (one-liner)

Sa admin, **wala kang hiwalay na field para sa maiksing tagline** na lumalabas sa ilalim ng pangalan ng produkto. Awtomatik itong kinukuha ng sistema mula sa **unang ~100 na letra ng Description**. Kaya basta i-paste mo ang Taglish na Description, **awtomatikong magiging Taglish din ang tagline** — hindi mo na kailangang ihiwalay. (Kung mahigit 100 letra ang Description, puputulin ito at lalagyan ng "…".)

> Tip: gawin mong malinaw at kompleto ang unang pangungusap ng Description, dahil iyon ang magiging tagline.

---

## Section 2 — Product copy na ipa-paste sa admin (per produkto)

Para sa bawat produkto: **i-paste muna ang Taglish** sa admin editor. Nasa ilalim ang **English original (reference lang)** para makumpara at maitama mo kung may mali sa agronomy.

> Hindi binabago ang **Product name** — English pa rin ito dahil iyon ang brand / pangalan ng uri.

---

### 1. Bio Plant Booster
*(category: Crop Care · ₱575 retail · wholesale tiers: 12pc ₱540, 24pc ₱460, 36pc ₱420)*

**Product name (huwag baguhin):**
```
Bio Plant Booster
```

**Description (Taglish) — i-paste ito:**
```
Ang Bio Plant Booster ay isang bio-fertilizer growth enhancer na ginawa para pagandahin ang kalusugan ng lupa at pasiglahin ang paglaki ng halaman. Naglalaman ito ng kapaki-pakinabang na mikroorganismo na tumutulong masira ang organic matter, para mas makuha ng halaman ang sustansya. Ang regular na paggamit ay nagpapatibay ng ugat, nagpapaganda ng pagsipsip ng sustansya, at nagpapataas ng ani.
```

**Specs (Taglish):**

| Label | Value |
|---|---|
| Uri | Likido |
| Paggamit | Foliar / Pagdidilig sa Lupa |
| Angkop Para Sa | Palay, Mais, Gulay |
| Aktibong Sangkap | Bio-fertilizer na mikroorganismo |

**Compatible crops (Taglish):**
```
Palay, Mais, Gulay, Mga Puno ng Prutas, Halamang-ugat
```

**Safety notes (Taglish):**
```
Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.
```

<details><summary><strong>English original (reference lang — huwag i-paste)</strong></summary>

- **Description:** Bio Plant Booster is a bio-fertilizer growth enhancer formulated to improve soil health and stimulate plant growth. It contains beneficial microorganisms that help break down organic matter, making nutrients more available to your crops. Regular use strengthens root systems, improves nutrient uptake, and boosts overall yield.
- **Specs:** Type = Liquid · Application = Foliar / Soil Drench · Suitable For = Rice, Corn, Vegetables · Active Ingredient = Bio-fertilizer microorganisms
- **Compatible crops:** Rice, Corn, Vegetables, Fruit Trees, Root Crops
- **Safety notes:** Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.
</details>

---

### 2. Bio Enzyme
*(category: Crop Care · ₱548 retail · wholesale tiers: 12pc ₱520, 24pc ₱445, 36pc ₱398)*

**Product name (huwag baguhin):**
```
Bio Enzyme
```

**Description (Taglish) — i-paste ito:**
```
Ang Bio Enzyme ay isang konsentradong enzymatic formula na ginawa para palakasin ang taba ng lupa at kalusugan ng halaman. Pinabibilis nito ang pagkabulok ng organic na residue sa lupa, kaya nailalabas ang nakakubling sustansya para masipsip ng halaman. Mainam gamitin kasama ng Bio Plant Booster para sa pinakamabuting resulta.
```

**Specs (Taglish):**

| Label | Value |
|---|---|
| Uri | Solid |
| Paggamit | Pagdidilig sa Lupa |
| Angkop Para Sa | Palay, Mais, Gulay |
| Aktibong Sangkap | Natural na enzyme |

**Compatible crops (Taglish):**
```
Palay, Mais, Gulay, Mga Puno ng Prutas, Halamang-ugat
```

**Safety notes (Taglish):**
```
Ilayo sa mga bata. Itago sa malamig at tuyong lugar, malayo sa direktang sikat ng araw. Alugin nang mabuti bago gamitin.
```

<details><summary><strong>English original (reference lang — huwag i-paste)</strong></summary>

- **Description:** Bio Enzyme is a concentrated enzymatic formula designed to enhance soil fertility and plant health. It accelerates the breakdown of organic residue in the soil, releasing locked nutrients for plant uptake. Ideal for use alongside Bio Plant Booster for best results.
- **Specs:** Type = Solid · Application = Soil Drench · Suitable For = Rice, Corn, Vegetables · Active Ingredient = Natural enzymes
- **Compatible crops:** Rice, Corn, Vegetables, Fruit Trees, Root Crops
- **Safety notes:** Keep out of reach of children. Store in a cool, dry place away from direct sunlight. Shake well before use.
</details>

---

### 3. Jasmine 479 Rice Seeds
*(category: Seeds · presyo: i-message / tumawag — walang naka-set na retail price)*

**Product name (huwag baguhin):**
```
Jasmine 479 Rice Seeds
```

**Description (Taglish) — i-paste ito:**
```
Ang Jasmine 479 ay isang dekalidad at mabangong uri ng palay na angkop sa klima at lupa ng Pilipinas. Kilala sa mabangong butil at maaasahang ani, ito ay sikat na pinipili ng mga Pilipinong magsasaka ng palay.
```

**Specs (Taglish):**

| Label | Value |
|---|---|
| Uri | Jasmine 479 |
| Panahon | Tag-ulan at Tag-araw |
| Araw Bago Maani | 110–120 araw |
| Dami ng Binhi | 40–60 kg/ha |

**Compatible crops (Taglish):** *(wala — blangko ito sa data)*

**Safety notes (Taglish):**
```
Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.
```

<details><summary><strong>English original (reference lang — huwag i-paste)</strong></summary>

- **Description:** Jasmine 479 is a high-quality aromatic rice variety well-suited to Philippine growing conditions. Known for its fragrant grains and reliable yield, it's a popular choice among Filipino rice farmers.
- **Specs:** Variety = Jasmine 479 · Season = Wet & Dry · Days to Maturity = 110–120 days · Seed Rate = 40–60 kg/ha
- **Compatible crops:** (none)
- **Safety notes:** Store in a cool, dry place. Use within the recommended planting season for best germination.
</details>

---

### 4. Mayumi Rice Seeds
*(category: Seeds · presyo: i-message / tumawag — walang naka-set na retail price)*

**Product name (huwag baguhin):**
```
Mayumi Rice Seeds
```

**Description (Taglish) — i-paste ito:**
```
Ang Mayumi ay isang maaasahang uri ng palay na kilala sa tibay laban sa sakit at tuloy-tuloy na maayos na ani sa iba't ibang probinsya ng Pilipinas. Nagbibigay ito ng magandang ani kahit sa hindi gaanong maganda ang kondisyon, kaya praktikal itong pagpipilian ng mga maliliit na magsasaka.
```

**Specs (Taglish):**

| Label | Value |
|---|---|
| Uri | Mayumi |
| Panahon | Tag-ulan at Tag-araw |
| Araw Bago Maani | 105–115 araw |
| Dami ng Binhi | 40–60 kg/ha |

**Compatible crops (Taglish):** *(wala — blangko ito sa data)*

**Safety notes (Taglish):**
```
Itago sa malamig at tuyong lugar. Gamitin sa loob ng inirerekomendang panahon ng pagtatanim para sa pinakamabuting pagtubo.
```

<details><summary><strong>English original (reference lang — huwag i-paste)</strong></summary>

- **Description:** Mayumi is a dependable rice variety known for its disease resistance and consistent yields across various Philippine provinces. It provides good harvest even in less-than-ideal conditions, making it a practical choice for smallholder farmers.
- **Specs:** Variety = Mayumi · Season = Wet & Dry · Days to Maturity = 105–115 days · Seed Rate = 40–60 kg/ha
- **Compatible crops:** (none)
- **Safety notes:** Store in a cool, dry place. Use within the recommended planting season for best germination.
</details>

---

## Section 3 — Pakitsek ito (agronomy / vocabulary)

Ikaw ang eksperto sa pagsasaka — ito ang mga salitang pinili namin na **pinakamahalagang i-confirm mo**. Para sa bawat isa: ang English, ang piniling Taglish, at isang tanong. Sabihin lang kung **OK** o ibigay ang **mas gusto mong termino**.

| # | English | Pinili naming Taglish | Tanong |
|---|---|---|---|
| 1 | Soil Drench | **Pagdidilig sa Lupa** | Ito ba ang sinasabi ng mga buyer mo, o "soil drench" / "pagbubuhos sa lupa"? |
| 2 | Foliar | **Foliar** (iniwang English) | Iniwan naming "Foliar" — naiintindihan ba ito ng buyer mo, o gusto mong "spray sa dahon"? |
| 3 | Type = Liquid | **Uri = Likido** | OK ba ang "Likido", o "Liquid" na lang? |
| 4 | Type = Solid | **Uri = Solid** (iniwang English) | Iniwan naming "Solid" — gusto mo bang gawing "Tuyo" / "Powder" / "Buo"? |
| 5 | Active Ingredient | **Aktibong Sangkap** | OK ba ang "Aktibong Sangkap" bilang label? |
| 6 | Bio-fertilizer microorganisms | **Bio-fertilizer na mikroorganismo** | Tama ba ang termino, o may mas pamilyar na salita ang buyer mo? |
| 7 | Natural enzymes | **Natural na enzyme** | OK ba ito? |
| 8 | Days to Maturity | **Araw Bago Maani** | Ito ba ang gamit mo, o "edad bago anihin" / "days to harvest"? |
| 9 | Seed Rate | **Dami ng Binhi** | OK ba ang "Dami ng Binhi" para sa kg/ha, o "rate ng binhi"? |
| 10 | Season = Wet & Dry | **Panahon = Tag-ulan at Tag-araw** | OK ba ito? |
| 11 | Root Crops | **Halamang-ugat** | Ito ba ang gamit ng buyer mo (hal. kamote, gabi), o "ugat na pananim" / "root crops"? |
| 12 | Fruit Trees | **Mga Puno ng Prutas** | OK ba ito? |
| 13 | Suitable For: Rice/Corn/Vegetables | **Palay, Mais, Gulay** | Tama ang **Palay** (hindi "Bigas") para sa pananim? Confirm lang. |

---

## Section 4 — UI wording na i-approve (mabilis lang)

Ilang interface text na judgment call — sabihin lang **keep** o **palitan ng ____**.

| # | Saan lumalabas | Kasalukuyang wording | Tanong |
|---|---|---|---|
| 1 | Category (Crop Care) | **Pangalaga sa Pananim** | Keep, o "Crop Care" / "Pag-aalaga sa Pananim"? |
| 2 | Category (Seeds) | **Mga Binhi** | Keep, o "Binhi" / "Seeds"? |
| 3 | Checkout form label | **Mobile number** (iniwang English) | Iniwan naming English ang label na ito. Keep, o "Numero ng cellphone"? |
| 4 | Search suggestions (trending) | **"Rice Seeds"** (kasama ng Bio Plant Booster, Jasmine, Mayumi) | Ang "Rice Seeds" ay English sa listahan ng sikat na hinahanap. Keep, o "Binhi ng Palay"? |
| 5 | Category subtitle (Crop Care) | **Mga Booster at Enzyme** | Keep, o iba? |
| 6 | Category subtitle (Seeds) | **Mga Uri ng Palay** | Keep, o iba? |
| 7 | FAQ phrasing | 4 na tanong-sagot, naka-Taglish na (hal. "Naghahatid ba kayo sa buong bansa?") | Basahin sa live site / about-contact page — sabihin kung may gustong baguhin. |

> Tandaan: ang admin panel mismo ay nananatiling **English** (by design) — Taglish lang ang storefront na nakikita ng customer.

---

## Section 5 — Paano i-apply, at ang susunod na hakbang

**Kung gumagamit ka ng admin panel para sa produkto (OO sa Section 1):**
1. Mag-login sa Noel AgriTV admin.
2. Buksan ang bawat produkto (4 silang lahat).
3. I-paste ang **Description (Taglish)**, **Specs**, **Compatible crops**, at **Safety notes** mula sa Section 2.
4. I-save.
5. Basahin ng cloud ang bagong kopya kaagad — **walang re-deploy na kailangan**. Ilang sandali pagkatapos mag-save, dapat Taglish na ang lumalabas sa product page.

**Kung defaults pa rin ang mga produkto (HINDI sa Section 1):**
- Wala kang kailangang gawin. Awtomatik na lalabas ang Taglish kapag na-deploy ang update na ito.

**Mahalagang tandaan:**
- Ang Taglish na default/seed copy ay **naka-commit na bilang fallback**. Kaya kung mag-reset ang admin config, o gumawa kayo ng bagong environment, **Taglish kaagad** ang lalabas nang hindi na kailangang mag-paste ulit.
- Pagkatapos mong i-review ang Section 3 at 4, ibalik mo lang sa amin ang mga gusto mong baguhin, at i-update namin ang seed defaults para tugma sa iyong mga termino.

---

*Reference files (para sa dev team): `src/data/products.ts`, `src/data/categories.ts`, `src/lib/copy.ts`, `src/lib/admin-to-product.ts`, `src/lib/admin-store.ts`.*
