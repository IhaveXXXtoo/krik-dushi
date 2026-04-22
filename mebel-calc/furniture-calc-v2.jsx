import { useState, useMemo } from "react";

const COLORS = {
  bg: "#0F0F0F",
  card: "#1A1A1A",
  cardHover: "#222222",
  border: "#2A2A2A",
  accent: "#C49448",
  accentDim: "#8B6A33",
  text: "#E8E0D0",
  textDim: "#8A8278",
  green: "#4CAF50",
  red: "#CF6679",
  white: "#FFFFFF",
  inputBg: "#141414",
  blue: "#5B9BD5",
};

// ===== РЕАЛЬНЫЕ ЦЕНЫ ЭКСПОТОРГ (опт) =====

const LDSP_COLORS = [
  { name: "Белый классический W960", code: "W960", structure: "SM", price_sheet: 3655 },
  { name: "Белый платиновый W980", code: "W980", structure: "SM", price_sheet: 3775 },
  { name: "Белый Премиум W1000", code: "W1000", structure: "ST9", price_sheet: 4205 },
  { name: "Альпина белая W1100", code: "W1100", structure: "ST9", price_sheet: 4330 },
  { name: "Дуб Бардолино H1145", code: "H1145", structure: "ST10", price_sheet: 4070 },
  { name: "Дуб Галифакс натур. H1180", code: "H1180", structure: "ST37", price_sheet: 6815 },
  { name: "Дуб Шерман коньяк H1344", code: "H1344", structure: "ST32", price_sheet: 6815 },
  { name: "Берёза песочная H1732", code: "H1732", structure: "ST9", price_sheet: 4070 },
  { name: "Акация Лэйклэнд H1277", code: "H1277", structure: "ST9", price_sheet: 4205 },
  { name: "Сосна Касцина H1401", code: "H1401", structure: "ST22", price_sheet: 4330 },
];

const SHEET_AREA = (2800 * 2070) / 1000000; // 5.796 м²

// Услуги обработки Экспоторг
const PROCESSING = {
  cut_16: 60,       // распил ЛДСП 16-18мм, руб/п.м.
  cut_8: 60,        // распил 8-10мм
  edge_04_16: 69,   // кромление ПВХ 0.4мм 16-18мм, руб/п.м.
  edge_1_16: 76.5,  // кромление ПВХ 1.0мм 16-18мм
  edge_2_16: 82.5,  // кромление ПВХ 2.0мм 16-18мм
  drill_3: 10,      // сверление D3мм
  drill_5: 13,      // сверление D5мм (шкант)
  drill_7: 19,      // сверление D7мм (конфирмат)
  drill_8: 19,      // сверление D8мм
  drill_15: 25,     // сверление D15мм
  drill_35: 58,     // сверление D35мм (петля)
  quarter: 58,      // четверть под ХДФ 3мм, руб/п.м.
  groove: 58,       // паз под ХДФ, руб/п.м.
};

// Фурнитура — оптовые цены Экспоторг
const HW = {
  confirmat: 1.50,       // конфирмат M5×50
  shkant_price: 0.71,    // полкодержатель = шкант по цене (условно)
  samorez_4x16: 0.51,    // саморез 4×16
  samorez_3_5x16: 0.42,  // саморез 3.5×16
  polkoder: 0.71,        // полкодержатель 5×16
  polkoder_nasadka: 1.39, // полкодержатель с насадкой
  hinge_set: 275,        // петля с доводчиком Clip-on (компл 2шт = 275р, значит 1шт = 137.5)
  hinge_one: 137.5,      // одна петля
  excentric_shtok: 2.41, // шток эксцентрика
  rail_400: 737,         // направляющие 400мм полн.выдв. доводч. 3D
  rail_450: 759,         // 450мм
  rail_500: 825,         // 500мм
  tbox_450_94: 1420,     // Slim T-box 4D 450мм h94мм
  tbox_500_94: 1420,     // 500мм h94мм
  tbox_450_132: 1610,    // 450мм h132мм
  tbox_500_132: 1610,    // 500мм h132мм
  shtanga_price: 250,    // штанга за п.м. (примерная)
  shtanga_holder: 35,    // штангодержатель
};

function calculateWardrobe(params) {
  const {
    ceilingH, nicheW, depth, isNiche, backType,
    numDoors, numShelves, numDrawers, hasRod,
    facadeGap, selectedLdsp, drawerSystem,
  } = params;

  const details = [];
  const hardware = [];
  const processing = { cuts_m: 0, edge04_m: 0, edge1_m: 0, drill_5: 0, drill_7: 0, drill_35: 0, quarter_m: 0, samorez_qty: 0 };

  const sheetPrice = LDSP_COLORS[selectedLdsp].price_sheet;

  // Габариты корпуса
  const corpusH = ceilingH - 8;
  const corpusW = isNiche ? nicheW - 5 : nicheW;
  const backThickness = backType === "8" ? 8 : 16;
  const innerDepth = depth - backThickness;
  const innerW = corpusW - 32;

  const bottomTopEdge = 60;
  const bottomH = 16;
  const bottomBottom = bottomTopEdge - bottomH; // 44
  const prostavkaH = bottomBottom - 4; // 40

  // ===== КОРПУС =====

  // Боковины (2шт)
  details.push({ name: "Боковина", qty: 2, h: corpusH, w: depth,
    e1: [corpusH], e04: [corpusH, depth, depth] });
  processing.cuts_m += 2 * (corpusH + depth) * 2 / 1000; // периметр × 2шт (условно 2 реза на деталь)

  // Дно
  details.push({ name: "Дно", qty: 1, h: innerW, w: depth,
    e1: [innerW], e04: [depth, depth] });

  // Крыша
  details.push({ name: "Крыша", qty: 1, h: innerW, w: depth,
    e1: [innerW], e04: [depth, depth] });

  // Проставки под опоры
  details.push({ name: "Проставка под опоры", qty: 2, h: prostavkaH, w: depth - 30,
    e1: [prostavkaH], e04: [depth - 30] });

  // Цокольная планка
  details.push({ name: "Цокольная планка", qty: 1, h: innerW, w: bottomBottom,
    e1: [innerW, bottomBottom, bottomBottom], e04: [] });

  // Задняя стенка
  const backW = backType === "8" ? corpusW - 20 : innerW;
  const backH = backType === "8" ? corpusH - 20 : corpusH - bottomTopEdge - 16;
  details.push({ name: `Задняя стенка ${backType}мм`, qty: 1, h: backH, w: backW,
    e1: [], e04: [], isBack: true, backType });

  if (backType === "8") {
    const perim = 2 * (backH + backW) / 1000;
    processing.quarter_m += perim;
    processing.samorez_qty += Math.ceil(perim * 1000 / 200) + 4;
  }

  // ===== НАПОЛНЕНИЕ =====

  const shelfW = innerW;
  const shelfD = innerDepth - 2;

  if (numShelves > 0) {
    details.push({ name: "Полка", qty: numShelves, h: shelfW, w: shelfD,
      e1: [shelfW], e04: [] });
    hardware.push({ name: "Полкодержатель 5×16", qty: numShelves * 4, price: HW.polkoder });
    processing.drill_5 += numShelves * 4; // отверстия под полкодержатели
  }

  if (hasRod) {
    const rodLen = shelfW / 1000;
    hardware.push({ name: `Штанга ${shelfW}мм`, qty: 1, price: Math.ceil(rodLen * HW.shtanga_price) });
    hardware.push({ name: "Штангодержатель", qty: 2, price: HW.shtanga_holder });
  }

  // Ящики
  if (numDrawers > 0) {
    const drawerInnerW = shelfW - 42;
    const drawerH = 150;
    const drawerDepthInner = shelfD - 50;

    // Проставки под направляющие
    const prDrH = numDrawers * (drawerH + 30);
    details.push({ name: "Проставка под направл.", qty: 2, h: prDrH, w: 16,
      e1: [], e04: [prDrH] });

    // Боковины ящика
    details.push({ name: "Боковина ящика", qty: numDrawers * 2, h: drawerDepthInner, w: drawerH,
      e1: [drawerDepthInner], e04: [drawerH, drawerH, drawerDepthInner] });

    // Перед/зад ящика
    details.push({ name: "Перед/зад ящика", qty: numDrawers * 2, h: drawerInnerW - 32, w: drawerH,
      e1: [], e04: [drawerInnerW - 32, drawerH, drawerH] });

    // Дно ящика ДВП
    details.push({ name: "Дно ящика (ДВП 3мм)", qty: numDrawers, h: drawerInnerW - 4, w: drawerDepthInner - 4,
      e1: [], e04: [], isDVP: true });

    // Направляющие по глубине
    let railPrice = HW.rail_500;
    if (depth <= 450) railPrice = HW.rail_400;
    else if (depth <= 500) railPrice = HW.rail_450;
    hardware.push({ name: `Направляющие ${depth <= 450 ? 400 : depth <= 500 ? 450 : 500}мм доводч.`, qty: numDrawers, price: railPrice });
  }

  // ===== ФАСАДЫ =====

  const innerFacadeH = corpusH - bottomTopEdge - 16;
  const totalGaps = (numDoors - 1) * facadeGap;
  let finalFacadeW = Math.floor((corpusW - totalGaps) / numDoors);
  let finalGap = facadeGap;
  const remainder = corpusW - (finalFacadeW * numDoors + totalGaps);
  if (remainder !== 0 && numDoors > 1) {
    const altGap = facadeGap === 3 ? 2 : 3;
    const altTotal = (numDoors - 1) * altGap;
    const altW = Math.floor((corpusW - altTotal) / numDoors);
    const altR = corpusW - (altW * numDoors + altTotal);
    if (Math.abs(altR) < Math.abs(remainder)) {
      finalGap = altGap;
      finalFacadeW = altW;
    }
  }

  const facadeH = innerFacadeH;
  details.push({ name: "Фасад", qty: numDoors, h: facadeH, w: finalFacadeW,
    e1: [facadeH, facadeH, finalFacadeW, finalFacadeW], e04: [], isFacade: true });

  let hingesPerDoor = 2;
  if (facadeH > 850) hingesPerDoor = 3;
  if (facadeH > 1300) hingesPerDoor = 4;
  if (facadeH > 1700) hingesPerDoor = 5;
  if (facadeH > 2200) hingesPerDoor = 6;

  const totalHinges = numDoors * hingesPerDoor;
  hardware.push({ name: "Петля Clip-on довод. (1шт)", qty: totalHinges, price: HW.hinge_one });
  processing.drill_35 += totalHinges; // сверление под чашку

  // Крепёж корпуса
  const pairsPerJoint = depth <= 600 ? 2 : 3;
  const corpusJoints = 4;
  const totalConf = corpusJoints * pairsPerJoint;
  hardware.push({ name: "Конфирмат M5×50", qty: totalConf, price: HW.confirmat });
  processing.drill_7 += totalConf * 2; // в торец + в пласть

  // ===== РАСЧЁТ КРОМКИ =====
  let total04mm = 0, total1mm = 0;
  details.forEach(d => {
    if (d.isBack || d.isDVP) return;
    total04mm += (d.e04 || []).reduce((a, b) => a + b, 0) * d.qty;
    total1mm += (d.e1 || []).reduce((a, b) => a + b, 0) * d.qty;
  });
  const edge04m = Math.ceil(total04mm / 1000 * 1.1);
  const edge1m = Math.ceil(total1mm / 1000 * 1.1);

  // ===== РАСЧЁТ РАСПИЛА =====
  let totalCutLength = 0;
  details.forEach(d => {
    if (d.isBack && d.backType === "8") { totalCutLength += 2 * (d.h + d.w) * d.qty; return; }
    if (d.isDVP) return;
    totalCutLength += (d.h + d.w) * 2 * d.qty; // приблизительно 2 реза на деталь
  });
  const cutMeters = Math.ceil(totalCutLength / 1000 * 0.6); // коэфф ~0.6 тк реальных резов меньше чем периметр

  // ===== СТОИМОСТЬ =====

  // 1. Материал ЛДСП
  let ldspArea = 0;
  details.forEach(d => {
    if (d.isBack || d.isDVP) return;
    ldspArea += (d.h * d.w * d.qty) / 1000000;
  });
  const sheetsNeeded = Math.ceil(ldspArea / SHEET_AREA * 1.15);
  const ldspCost = sheetsNeeded * sheetPrice;

  // Задняя стенка
  const backArea = (backH * backW) / 1000000;
  const DVP_PRICE_SHEET = 865; // ХДФ 3мм 2800×2070
  const LDSP8_PRICE_SHEET = 3555; // ЛДСП 8мм (W960 SM 10мм ≈ 3555)
  const backCost = backType === "8"
    ? Math.ceil(backArea / SHEET_AREA * DVP_PRICE_SHEET * 1.1)
    : Math.ceil(backArea / SHEET_AREA * sheetPrice * 1.1);

  // ДВП дно ящиков
  let dvpArea = 0;
  details.forEach(d => { if (d.isDVP) dvpArea += (d.h * d.w * d.qty) / 1000000; });
  const dvpCost = Math.ceil(dvpArea / SHEET_AREA * DVP_PRICE_SHEET * 1.1);

  // 2. Обработка
  const processingCost =
    cutMeters * PROCESSING.cut_16 +
    edge04m * PROCESSING.edge_04_16 +
    edge1m * PROCESSING.edge_1_16 +
    processing.drill_5 * PROCESSING.drill_5 +
    processing.drill_7 * PROCESSING.drill_7 +
    processing.drill_35 * PROCESSING.drill_35 +
    processing.quarter_m * PROCESSING.quarter +
    processing.samorez_qty * 0; // саморезы считаем в фурнитуре

  // Кромка материал (цена самой кромки, не услуги наклейки)
  // Для простоты: кромка 0.4мм ≈ 12р/п.м., 1мм ≈ 22р/п.м. (средняя цена материала кромки по прайсу)
  const edgeMaterialCost = edge04m * 18 + edge1m * 44; // средние из прайса для древесных

  // 3. Фурнитура
  const hwCost = hardware.reduce((s, h) => s + h.qty * h.price, 0);

  // Саморезы отдельно
  const samorezCost = processing.samorez_qty * HW.samorez_4x16;

  const totalSebest = Math.ceil(ldspCost + backCost + dvpCost + processingCost + edgeMaterialCost + hwCost + samorezCost);

  return {
    details, hardware,
    edges: { "0.4": edge04m, "1": edge1m },
    cutMeters,
    processing,
    costs: {
      ldsp: ldspCost,
      back: backCost,
      dvp: dvpCost,
      processing: Math.ceil(processingCost),
      edgeMaterial: Math.ceil(edgeMaterialCost),
      hardware: Math.ceil(hwCost + samorezCost),
      total: totalSebest,
    },
    sheetsNeeded,
    dimensions: { corpusH, corpusW, innerW, facadeH, finalFacadeW, finalGap, hingesPerDoor },
  };
}

function InputField({ label, value, onChange, unit = "мм", min = 0, max = 9999, step = 1 }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: COLORS.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} min={min} max={max} step={step}
          style={{ width: "100%", padding: "10px 12px", background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.white, fontSize: 16, fontFamily: "'JetBrains Mono', monospace", outline: "none" }} />
        <span style={{ fontSize: 12, color: COLORS.textDim, minWidth: 24 }}>{unit}</span>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: COLORS.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", background: COLORS.inputBg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.white, fontSize: 14, outline: "none", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", cursor: "pointer", userSelect: "none" }}>
      <span style={{ fontSize: 13, color: COLORS.text }}>{label}</span>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: value ? COLORS.accent : COLORS.border, position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 18, height: 18, borderRadius: 9, background: COLORS.white, position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s" }} />
      </div>
    </div>
  );
}

function CostRow({ label, value, color, sub }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ fontSize: sub ? 12 : 13, color: sub ? COLORS.textDim : COLORS.text, paddingLeft: sub ? 12 : 0 }}>{label}</span>
      <span style={{ fontSize: sub ? 13 : 14, fontFamily: "'JetBrains Mono', monospace", color: color || COLORS.text }}>{value.toLocaleString("ru")} ₽</span>
    </div>
  );
}

export default function FurnitureCalc() {
  const [tab, setTab] = useState("params");
  const [ceilingH, setCeilingH] = useState(2500);
  const [nicheW, setNicheW] = useState(1800);
  const [depth, setDepth] = useState(600);
  const [isNiche, setIsNiche] = useState(false);
  const [backType, setBackType] = useState("8");
  const [numDoors, setNumDoors] = useState(2);
  const [numShelves, setNumShelves] = useState(5);
  const [numDrawers, setNumDrawers] = useState(2);
  const [hasRod, setHasRod] = useState(true);
  const [facadeGap, setFacadeGap] = useState(3);
  const [selectedLdsp, setSelectedLdsp] = useState(0);
  const [markup, setMarkup] = useState(2.5);

  const result = useMemo(() => calculateWardrobe({
    ceilingH, nicheW, depth, isNiche, backType, numDoors, numShelves, numDrawers, hasRod,
    facadeGap: Number(facadeGap), selectedLdsp, drawerSystem: "rail",
  }), [ceilingH, nicheW, depth, isNiche, backType, numDoors, numShelves, numDrawers, hasRod, facadeGap, selectedLdsp]);

  const retailPrice = Math.ceil(result.costs.total * markup);
  const tabs = [
    { id: "params", label: "Параметры" },
    { id: "details", label: "Детали" },
    { id: "hardware", label: "Фурнитура" },
    { id: "cost", label: "Стоимость" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'Jost', 'Segoe UI', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Jost:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: COLORS.accent, letterSpacing: 2 }}>МЕБЕЛЬ.КАЛК</h1>
          <span style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: 1 }}>TECH7GROUP • v2 • Экспоторг</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim }}>себес</div>
          <div style={{ fontSize: 16, fontFamily: "'JetBrains Mono', monospace", color: COLORS.accent }}>{result.costs.total.toLocaleString("ru")} ₽</div>
          <div style={{ fontSize: 22, fontFamily: "'JetBrains Mono', monospace", color: COLORS.green, fontWeight: 500 }}>{retailPrice.toLocaleString("ru")} ₽</div>
          <div style={{ fontSize: 10, color: COLORS.textDim }}>розница ×{markup}</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, overflow: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: "12px 8px", background: "none", border: "none",
            borderBottom: tab === t.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
            color: tab === t.id ? COLORS.accent : COLORS.textDim,
            fontSize: 12, fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap", fontFamily: "'Jost', sans-serif",
          }}>{t.label}</button>
        ))}
      </div>
      {/* Content */}
      <div style={{ padding: "16px 20px", maxWidth: 480, margin: "0 auto" }}>
        {tab === "params" && (
          <div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Габариты</div>
              <InputField label="Высота потолка" value={ceilingH} onChange={setCeilingH} />
              <InputField label="Ширина (или ниша)" value={nicheW} onChange={setNicheW} />
              <InputField label="Глубина" value={depth} onChange={setDepth} />
              <Toggle label="Встройка в нишу" value={isNiche} onChange={setIsNiche} />
              <div style={{ marginTop: 8, padding: "8px 12px", background: COLORS.inputBg, borderRadius: 8, fontSize: 12, color: COLORS.textDim }}>
                Корпус: {result.dimensions.corpusH}×{result.dimensions.corpusW}×{depth} мм
                {result.dimensions.corpusH > 2770 && <div style={{ color: COLORS.red, marginTop: 4 }}>⚠ Высота {result.dimensions.corpusH}мм &gt; 2770мм — бить на модули!</div>}
              </div>
            </div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Материал</div>
              <SelectField label="ЛДСП 16мм (Экспоторг)" value={selectedLdsp}
                onChange={v => setSelectedLdsp(Number(v))}
                options={LDSP_COLORS.map((c, i) => ({ value: i, label: `${c.name} — ${c.price_sheet.toLocaleString("ru")}₽/лист` }))} />
              <SelectField label="Задняя стенка" value={backType} onChange={setBackType}
                options={[
                  { value: "8", label: "ДВП 8мм (четверть 10×10, саморезы)" },
                  { value: "16", label: "ЛДСП 16мм (конфирмат)" },
                ]} />
            </div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Фасады (распашные)</div>
              <InputField label="Количество дверей" value={numDoors} onChange={setNumDoors} min={1} max={6} />
              <SelectField label="Зазор между фасадами" value={facadeGap} onChange={v => setFacadeGap(Number(v))}
                options={[{ value: 2, label: "2 мм" }, { value: 3, label: "3 мм" }]} />
              <div style={{ padding: "8px 12px", background: COLORS.inputBg, borderRadius: 8, fontSize: 12, color: COLORS.textDim }}>
                Фасад: {result.dimensions.facadeH}×{result.dimensions.finalFacadeW} мм • Зазор: {result.dimensions.finalGap}мм • Петель: {result.dimensions.hingesPerDoor}
              </div>
            </div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Наполнение</div>
              <InputField label="Полки (съёмные)" value={numShelves} onChange={setNumShelves} min={0} max={12} />
              <InputField label="Ящики" value={numDrawers} onChange={setNumDrawers} min={0} max={6} />
              <Toggle label="Штанга для одежды" value={hasRod} onChange={setHasRod} />
            </div>
          </div>
        )}
        {tab === "details" && (
          <div>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>
              Деталировка • ЛДСП 16мм • Листов: {result.sheetsNeeded}
            </div>
            {result.details.map((d, i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 10, padding: "10px 14px", marginBottom: 5, border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {d.h}×{d.w}
                    {d.e1 && d.e1.length > 0 && <span style={{ color: COLORS.accent }}> • 1мм:{d.e1.length}ст</span>}
                    {d.e04 && d.e04.length > 0 && <span> • 0.4:{d.e04.length}ст</span>}
                  </div>
                </div>
                <div style={{ background: COLORS.accent, color: COLORS.bg, borderRadius: 6, padding: "4px 10px", fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>×{d.qty}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: "10px 14px", background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 13 }}>
              <div style={{ color: COLORS.textDim, marginBottom: 4 }}>Кромка / Распил</div>
              0.4мм: ~{result.edges["0.4"]} п.м. • 1мм: ~{result.edges["1"]} п.м. • Распил: ~{result.cutMeters} п.м.
            </div>
          </div>
        )}
        {tab === "hardware" && (
          <div>
            <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 8 }}>Фурнитура и крепёж (опт Экспоторг)</div>
            {result.hardware.map((h, i) => (
              <div key={i} style={{ background: COLORS.card, borderRadius: 10, padding: "10px 14px", marginBottom: 5, border: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{h.name}</div>
                  <div style={{ fontSize: 12, color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>{h.price.toLocaleString("ru")} ₽/шт</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ background: COLORS.accentDim, color: COLORS.white, borderRadius: 6, padding: "3px 8px", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>×{h.qty}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 3 }}>{Math.ceil(h.qty * h.price).toLocaleString("ru")} ₽</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "cost" && (
          <div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Себестоимость</div>
              <CostRow label="ЛДСП 16мм" value={result.costs.ldsp} sub />
              <CostRow label={`Задняя стенка ${backType}мм`} value={result.costs.back} sub />
              <CostRow label="ДВП (дно ящиков)" value={result.costs.dvp} sub />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13, color: COLORS.blue, fontWeight: 500 }}>Материалы итого</span>
                <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: COLORS.blue }}>{(result.costs.ldsp + result.costs.back + result.costs.dvp).toLocaleString("ru")} ₽</span>
              </div>
              <div style={{ height: 8 }} />
              <CostRow label="Обработка (распил+присадка)" value={result.costs.processing} sub />
              <CostRow label="Кромка (материал)" value={result.costs.edgeMaterial} sub />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13, color: COLORS.blue, fontWeight: 500 }}>Обработка итого</span>
                <span style={{ fontSize: 14, fontFamily: "'JetBrains Mono', monospace", color: COLORS.blue }}>{(result.costs.processing + result.costs.edgeMaterial).toLocaleString("ru")} ₽</span>
              </div>
              <div style={{ height: 8 }} />
              <CostRow label="Фурнитура и крепёж" value={result.costs.hardware} sub />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", marginTop: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>СЕБЕСТОИМОСТЬ</span>
                <span style={{ fontSize: 20, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: COLORS.accent }}>{result.costs.total.toLocaleString("ru")} ₽</span>
              </div>
            </div>
            <div style={{ background: COLORS.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Розничная цена</div>
              <InputField label="Коэффициент наценки" value={markup} onChange={setMarkup} unit="×" min={1} max={10} step={0.1} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Цена клиенту</span>
                <span style={{ fontSize: 28, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: COLORS.green }}>{retailPrice.toLocaleString("ru")} ₽</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textDim, textAlign: "right" }}>
                Маржа: {(retailPrice - result.costs.total).toLocaleString("ru")} ₽ ({Math.round((1 - result.costs.total / retailPrice) * 100)}%)
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[2.0, 2.5, 3.0].map(m => (
                <button key={m} onClick={() => setMarkup(m)} style={{
                  padding: "12px 8px", background: markup === m ? COLORS.accent : COLORS.card,
                  color: markup === m ? COLORS.bg : COLORS.text,
                  border: `1px solid ${markup === m ? COLORS.accent : COLORS.border}`, borderRadius: 10, cursor: "pointer", textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>×{m}</div>
                  <div style={{ fontSize: 11, marginTop: 2, opacity: 0.7 }}>{Math.ceil(result.costs.total * m).toLocaleString("ru")} ₽</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
