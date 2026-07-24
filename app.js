/* 이거먼저 — 냉장고 속, 오늘 먼저 챙길 재료 (demo v1) */
"use strict";

/* ---------- 상수 ---------- */
/* 냉장고 칸 기본 배치. section: fridge(냉장실)·freezer(냉동실), kind: shelf·door·drawer */
const DEFAULT_ZONES = [
  { name: "냉장 1칸", section: "fridge", kind: "shelf" },
  { name: "냉장 2칸", section: "fridge", kind: "shelf" },
  { name: "문칸", section: "fridge", kind: "door" },
  { name: "야채칸", section: "fridge", kind: "drawer" },
  { name: "냉동칸", section: "freezer", kind: "drawer" },
];
/* 추가 가능한 칸 종류 */
const ADDABLE = [
  { key: "냉장", label: "냉장칸", base: "냉장", kind: "shelf", section: "fridge" },
  { key: "문칸", label: "문칸", base: "문칸", kind: "door", section: "fridge" },
  { key: "야채", label: "야채칸", base: "야채칸", kind: "drawer", section: "fridge" },
  { key: "과일", label: "과일칸", base: "과일칸", kind: "drawer", section: "fridge" },
  { key: "냉동", label: "냉동칸", base: "냉동칸", kind: "drawer", section: "freezer" },
];
const STORAGE_KEY = "igeomeonjeo-v2";

function fridgeZones() { return state.zones.filter((z) => z.section === "fridge"); }
function freezerZones() { return state.zones.filter((z) => z.section === "freezer"); }
function zoneNames() { return state.zones.map((z) => z.name); }
function addFormZones() { return [...zoneNames(), "기타"]; }
function cloneDefaultZones() { return DEFAULT_ZONES.map((z) => ({ ...z })); }
const FROZEN_DAYS = 30; // 냉동 이동 시 부여하는 권장 기간

/* 품목별 권장 냉장 보관기간 기본값(일).
   식약처 '식품유형별 소비기한 참고치'와 통용 보관 권장값을 근사한 데모용 사전. */
const FOOD_DB = [
  { k: ["애호박", "호박"], d: 7 },
  { k: ["대파", "쪽파", "파"], d: 7 },
  { k: ["양파"], d: 30 },
  { k: ["당근"], d: 21 },
  { k: ["감자"], d: 21 },
  { k: ["고구마"], d: 21 },
  { k: ["두부"], d: 5 },
  { k: ["콩나물", "숙주"], d: 4 },
  { k: ["계란", "달걀"], d: 30 },
  { k: ["우유"], d: 7 },
  { k: ["요거트", "요구르트"], d: 10 },
  { k: ["치즈"], d: 30 },
  { k: ["버터"], d: 60 },
  { k: ["김치"], d: 90 },
  { k: ["상추", "깻잎", "쌈채소"], d: 5 },
  { k: ["시금치", "나물"], d: 5 },
  { k: ["버섯"], d: 7 },
  { k: ["오이"], d: 7 },
  { k: ["토마토", "방울토마토"], d: 7 },
  { k: ["브로콜리"], d: 7 },
  { k: ["파프리카", "피망"], d: 10 },
  { k: ["고추"], d: 14 },
  { k: ["마늘", "다진마늘"], d: 14 },
  { k: ["사과"], d: 30 },
  { k: ["딸기"], d: 3 },
  { k: ["포도"], d: 7 },
  { k: ["바나나"], d: 5 },
  { k: ["돼지고기", "삼겹살", "목살"], d: 3 },
  { k: ["소고기", "쇠고기", "국거리"], d: 3 },
  { k: ["닭고기", "닭가슴살"], d: 2 },
  { k: ["생선", "고등어", "갈치", "연어"], d: 2 },
  { k: ["어묵"], d: 7 },
  { k: ["햄"], d: 14 },
  { k: ["베이컨"], d: 7 },
  { k: ["소시지"], d: 14 },
  { k: ["식빵", "빵"], d: 5 },
  { k: ["떡"], d: 3 },
  { k: ["만두"], d: 5 },
  { k: ["도시락"], d: 1 },
  { k: ["샌드위치"], d: 1 },
  { k: ["김밥", "삼각김밥", "주먹밥"], d: 1 },
  { k: ["샐러드"], d: 2 },
  { k: ["반찬"], d: 5 },
  { k: ["쌈장", "된장", "고추장"], d: 180 },
  { k: ["케첩", "마요네즈", "소스"], d: 90 },
  { k: ["맛술", "간장", "식초"], d: 180 },
  { k: ["잼"], d: 60 },
];
const DEFAULT_DAYS = 7;

/* 품목별 자연스러운 보관 칸 추천. 가장 긴 키워드 일치를 우선. */
const ZONE_HINTS = [
  { z: "야채칸", k: ["애호박", "호박", "대파", "쪽파", "양파", "당근", "감자", "고구마", "상추",
    "깻잎", "쌈채소", "시금치", "나물", "버섯", "오이", "토마토", "방울토마토", "브로콜리",
    "파프리카", "피망", "고추", "마늘", "딸기", "포도", "사과", "배추", "무", "레몬", "아보카도", "셀러리"] },
  { z: "냉장 1칸", k: ["계란", "달걀", "우유", "요거트", "요구르트", "치즈", "버터", "김치", "생크림"] },
  { z: "냉장 2칸", k: ["두부", "콩나물", "숙주", "어묵", "햄", "베이컨", "소시지", "반찬", "만두",
    "떡", "도시락", "샌드위치", "김밥", "삼각김밥", "주먹밥", "샐러드", "돼지고기", "삼겹살", "목살",
    "소고기", "쇠고기", "국거리", "닭고기", "닭가슴살", "생선", "고등어", "갈치", "연어",
    "쌈장", "된장", "고추장", "잼"] },
  { z: "문칸", k: ["케첩", "마요", "소스", "맛술", "간장", "식초", "드레싱", "주스", "생수", "음료"] },
];
function guessZone(name) {
  const n = name.replace(/\s/g, "");
  let best = null;
  for (const h of ZONE_HINTS) {
    for (const kw of h.k) {
      if (n.includes(kw) && (!best || kw.length > best.kw.length)) best = { kw, z: h.z };
    }
  }
  return best ? best.z : null;
}

/* 영수증 인식에서 기본 제외되는 품목 */
const ROOM_TEMP = ["라면", "컵라면", "과자", "스낵", "초콜릿", "사탕", "젤리", "음료", "콜라", "사이다",
  "생수", "커피", "소주", "맥주", "와인", "통조림", "즉석밥", "햇반", "시리얼", "꿀",
  "기름", "식용유", "설탕", "소금", "밀가루", "국수", "파스타면"];
const NON_FOOD = ["봉투", "휴지", "물티슈", "티슈", "세제", "샴푸", "치약", "칫솔", "건전지", "마스크", "종량제"];
const SKIP_LINE = ["합계", "총액", "부가세", "면세", "과세", "카드", "현금", "승인", "포인트",
  "거스름", "결제", "할인율", "영수증", "점포", "사업자", "대표", "전화", "매장", "감사"];

/* ---------- 상태 ---------- */
let state = load();
let currentView = "home";
let currentZone = null;
let receiptPreview = null; // 영수증 파싱 미리보기

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.zones) || !parsed.zones.length) parsed.zones = cloneDefaultZones(); // 구버전 상태 마이그레이션
      return parsed;
    }
  } catch (e) { /* 손상된 저장값은 무시하고 새로 시작 */ }
  return { items: seedItems(), zones: cloneDefaultZones(), history: [], seeded: true };
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

/* ---------- 날짜 유틸 ---------- */
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function fmt(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function parse(s) { return new Date(s + "T00:00:00"); }
function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return fmt(d); }
function daysAgo(n) { const d = today(); d.setDate(d.getDate() - n); return fmt(d); }
function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
function fmtKo(s) { const d = parse(s); return (d.getMonth() + 1) + "월 " + d.getDate() + "일"; }

/* ---------- 도메인 ---------- */
function expiryOf(it) { return it.expiry || addDays(it.bought, it.shelfDays); }
function remaining(it) { return diffDays(fmt(today()), expiryOf(it)); }
function dInfo(it) {
  const r = remaining(it);
  if (r < 0) return { cls: "d-over", label: "+" + (-r) + "일 지남", sev: "over" };
  if (it.zone === "냉동칸") return { cls: "d-frozen", label: "D-" + r, sev: "ok" };
  if (r <= 1) return { cls: "d-urgent", label: r === 0 ? "D-day" : "D-1", sev: "urgent" };
  if (r <= 3) return { cls: "d-warn", label: "D-" + r, sev: "warn" };
  return { cls: "d-ok", label: "D-" + r, sev: "ok" };
}
function guessFood(name) {
  const n = name.replace(/\s/g, "");
  let best = null;
  for (const f of FOOD_DB) {
    for (const kw of f.k) {
      if (n.includes(kw) && (!best || kw.length > best.kw.length)) best = { kw, d: f.d };
    }
  }
  return best;
}
function matchAny(name, list) {
  const n = name.replace(/\s/g, "");
  return list.some((kw) => n.includes(kw));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function seedItems() {
  return [
    { id: uid(), name: "애호박", zone: "야채칸", bought: daysAgo(6), shelfDays: 7, expiry: null, sale: false },
    { id: uid(), name: "두부", zone: "냉장 2칸", bought: daysAgo(2), shelfDays: 5, expiry: addDays(fmt(today()), 2), sale: true },
    { id: uid(), name: "대파", zone: "야채칸", bought: daysAgo(9), shelfDays: 7, expiry: null, sale: false },
    { id: uid(), name: "양파", zone: "야채칸", bought: daysAgo(9), shelfDays: 30, expiry: null, sale: false },
    { id: uid(), name: "당근", zone: "야채칸", bought: daysAgo(2), shelfDays: 21, expiry: null, sale: false },
    { id: uid(), name: "계란", zone: "냉장 1칸", bought: daysAgo(10), shelfDays: 30, expiry: null, sale: false },
    { id: uid(), name: "김치", zone: "냉장 1칸", bought: daysAgo(30), shelfDays: 90, expiry: null, sale: false },
    { id: uid(), name: "어묵", zone: "냉장 2칸", bought: daysAgo(1), shelfDays: 7, expiry: null, sale: false },
    { id: uid(), name: "우유", zone: "냉장 1칸", bought: daysAgo(3), shelfDays: 7, expiry: null, sale: false },
    { id: uid(), name: "쌈장", zone: "냉장 2칸", bought: daysAgo(40), shelfDays: 180, expiry: null, sale: false },
    { id: uid(), name: "케첩", zone: "문칸", bought: daysAgo(60), shelfDays: 90, expiry: null, sale: false },
    { id: uid(), name: "다진마늘", zone: "냉동칸", bought: daysAgo(5), shelfDays: 14, expiry: addDays(fmt(today()), 25), frozen: true, sale: false },
    { id: uid(), name: "식빵 ½", zone: "냉동칸", bought: daysAgo(4), shelfDays: 5, expiry: addDays(fmt(today()), 26), frozen: true, sale: false },
  ];
}

/* ---------- 공용 DOM ---------- */
const $view = document.getElementById("view");
const $overlay = document.getElementById("overlay");
const $sheet = document.getElementById("sheet");
const $toast = document.getElementById("toast");
let toastTimer = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(msg) {
  $toast.textContent = msg;
  $toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $toast.classList.remove("show"), 2400);
}
function badges(it) {
  let h = "";
  if (it.sale) h += '<span class="tag-sale">마감할인</span>';
  if (it.frozen) h += '<span class="tag-state">냉동됨</span>';
  if (it.partial) h += '<span class="tag-state">일부 사용</span>';
  if (it.prepped) h += '<span class="tag-state">손질됨</span>';
  return h;
}

/* ---------- 내비게이션 ---------- */
document.querySelectorAll(".nav-btn").forEach((b) => {
  b.addEventListener("click", () => go(b.dataset.view));
});
function go(view, zone) {
  currentView = view;
  currentZone = zone || null;
  if (view !== "add") receiptPreview = null;
  document.querySelectorAll(".nav-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === (view === "zone" ? "map" : view === "receipt" ? "add" : view));
  });
  render();
  $view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

function render() {
  const views = { home: renderHome, map: renderMap, zone: renderZone, add: renderAdd, receipt: renderReceipt, save: renderSave, settings: renderSettings };
  $view.innerHTML = (views[currentView] || renderHome)();
  bindView();
}

/* ---------- 화면: 오늘 먼저 ---------- */
function renderHome() {
  const d = new Date();
  const week = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const sorted = [...state.items].sort((a, b) => {
    const ra = remaining(a), rb = remaining(b);
    if (ra !== rb) return ra - rb;
    return (b.sale ? 1 : 0) - (a.sale ? 1 : 0);
  });
  const top = sorted.filter((it) => it.zone !== "냉동칸").slice(0, 3);
  const rest = state.items.length - top.length;

  let cards;
  if (state.items.length === 0) {
    cards = '<div class="empty"><b>냉장고가 비어 있어요.</b><br>아래 ＋ 버튼으로 첫 재료를 등록해 보세요.<br>설정에서 샘플 데이터를 불러올 수도 있어요.</div>';
  } else if (top.length === 0) {
    cards = '<div class="empty"><b>오늘 먼저 챙길 재료가 없어요.</b><br>냉장 재료가 모두 여유 있어요 🎉</div>';
  } else {
    cards = top.map((it) => {
      const di = dInfo(it);
      const head = '<div class="row1"><span class="name">' + esc(it.name) + '</span><span class="where">' + esc(it.zone) + "</span>" + badges(it) +
        '<span class="chip-d ' + di.cls + '">' + di.label + "</span></div>" +
        '<div class="meta">' + fmtKo(it.bought) + " 구매 · " +
        (it.expiry ? "소비기한 " + fmtKo(it.expiry) + (it.frozen ? " (냉동)" : " (직접 입력)") : "권장 " + it.shelfDays + "일 (참고치)") + "</div>";
      const act = di.sev === "over"
        ? '<div class="actions"><button class="btn danger-line" data-act="check" data-id="' + it.id + '">버리기 전 상태 확인</button></div>'
        : '<div class="actions">' +
          '<button class="btn primary" data-act="eat" data-id="' + it.id + '">오늘 먹기</button>' +
          '<button class="btn" data-act="freeze" data-id="' + it.id + '">냉동하기</button>' +
          '<button class="btn" data-act="prep" data-id="' + it.id + '">손질하기</button></div>';
      return '<article class="card ' + (di.sev === "urgent" || di.sev === "over" ? "urgent" : "") + '">' + head + act + "</article>";
    }).join("");
  }

  return '<header class="appbar"><h1>이거먼저</h1><span class="sub">' + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + week + "요일</span></header>" +
    '<div class="h-section">오늘 먼저 챙길 재료 <small>' + top.length + "</small></div>" + cards +
    (rest > 0 ? '<div class="quiet">나머지 ' + rest + '개 재료는 아직 여유 있어요 — <button data-goto="map">냉장고에서 보기</button></div>' : "");
}

/* ---------- 화면: 냉장고 ---------- */
function zoneClasses(z) {
  // 시각 스타일 클래스 (kind + 특수)
  let c = z.kind; // shelf | door | drawer
  if (z.name === "야채칸" || /야채/.test(z.name)) c += " veg";
  if (/과일/.test(z.name)) c += " fruit";
  if (z.section === "freezer") c += " frost";
  if (z.width === "half") c += " half"; // 한 줄에 나란히
  return c;
}
function renderMap() {
  const itemChips = (items) => items.length
    ? items.map((it) => {
        const di = dInfo(it);
        const dcls = di.sev === "urgent" || di.sev === "over" ? "u" : di.sev === "warn" ? "w" : "";
        const dtxt = di.sev === "ok" && remaining(it) > 7 ? "" : '<span class="d ' + dcls + '">' + di.label + "</span>";
        return '<button class="item" draggable="true" data-item="' + it.id + '" data-sheet="' + it.id + '">' + esc(it.name) + dtxt + "</button>";
      }).join("")
    : '<span class="none">비어 있음</span>';
  // 냉장고 칸(선반/서랍) — 끌어서 정렬, 재료 드롭 대상
  const part = (z) => {
    const items = state.items.filter((it) => it.zone === z.name);
    const nearCnt = items.filter((it) => { const s = dInfo(it).sev; return s === "urgent" || s === "over"; }).length;
    const del = items.length === 0
      ? '<button class="zdel" data-del="' + esc(z.name) + '" aria-label="' + esc(z.name) + ' 삭제" title="빈 칸 삭제">×</button>' : "";
    const wbtn = '<button class="zwidth" data-width="' + esc(z.name) + '" title="한 줄에 두 칸(반칸)으로 배치" aria-label="' + esc(z.name) + ' 너비 전환">' + (z.width === "half" ? "한칸" : "반칸") + "</button>";
    return '<section class="zone-cell ' + zoneClasses(z) + '" draggable="true" data-zone="' + esc(z.name) + '" role="button" tabindex="0" aria-label="' + esc(z.name) + ' 상세 보기">' +
      '<div class="zhead"><span class="grip" aria-hidden="true">⠿</span><span class="zname">' + esc(z.name) + "</span>" +
      '<span class="cnt">' + items.length + "개</span>" + wbtn +
      (nearCnt ? '<span class="alert">' + nearCnt + " 임박</span>" : "") + del + "</div>" +
      '<div class="items">' + itemChips(items) + "</div></section>";
  };
  const fz = fridgeZones(), frz = freezerZones();
  const etcItems = state.items.filter((it) => !zoneNames().includes(it.zone));
  const picker = ADDABLE.map((a) => '<button class="add-zone-opt" data-add="' + a.key + '">＋ ' + esc(a.label) + "</button>").join("");
  const etc = etcItems.length
    ? '<div class="etc-wrap"><section class="zone-cell shelf etc" data-zone="기타" aria-label="기타">' +
        '<div class="zhead"><span class="zname">기타</span><span class="cnt">' + etcItems.length + "개</span></div>" +
        '<div class="items">' + itemChips(etcItems) + "</div></section></div>"
    : "";
  return '<header class="appbar"><h1>냉장고</h1><span class="sub">끌어서 정렬 · 반칸 배치 · 재료 이동</span></header>' +
    '<div class="fridge">' +
      '<div class="fridge-handle" aria-hidden="true"></div>' +
      '<div class="fridge-main" data-section="fridge">' +
        '<div class="compartment"><span class="compartment-tag">냉장실</span></div>' +
        (fz.length ? fz.map(part).join("") : '<div class="none" style="padding:6px 2px">칸이 없어요. 아래에서 추가하세요.</div>') +
      "</div>" +
      (frz.length ? '<div class="fridge-freezer" data-section="freezer"><div class="compartment"><span class="compartment-tag frost-tag">❄ 냉동실 ❄</span></div>' + frz.map(part).join("") + "</div>" : "") +
    "</div>" +
    '<div class="add-zone"><span class="add-zone-lead">칸 추가</span><div class="add-zone-opts">' + picker + "</div></div>" +
    etc;
}

/* 냉장고 편집: 칸 정렬 · 재료 이동 · 칸 추가/삭제 (HTML5 드래그) */
let dragCtx = null;
function bindFridge() {
  const clearDrop = () => $view.querySelectorAll(".drop-target").forEach((x) => x.classList.remove("drop-target"));
  // 재료 칩 드래그 (칸 이동)
  $view.querySelectorAll(".item[data-item]").forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      e.stopPropagation(); // 부모 칸의 정렬 드래그와 분리
      dragCtx = { type: "item", id: el.dataset.item };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.item);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => { el.classList.remove("dragging"); clearDrop(); dragCtx = null; });
  });
  // 칸 드래그 (정렬)
  $view.querySelectorAll('.zone-cell[draggable="true"]').forEach((el) => {
    el.addEventListener("dragstart", (e) => {
      dragCtx = { type: "zone", name: el.dataset.zone };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.zone);
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => { el.classList.remove("dragging"); clearDrop(); dragCtx = null; });
  });
  // 드롭 대상: 모든 칸(기타 포함)
  $view.querySelectorAll(".zone-cell").forEach((el) => {
    el.addEventListener("dragover", (e) => {
      if (!dragCtx) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      el.classList.add("drop-target");
    });
    el.addEventListener("dragleave", () => el.classList.remove("drop-target"));
    el.addEventListener("drop", (e) => {
      if (!dragCtx) return;
      e.preventDefault(); e.stopPropagation();
      el.classList.remove("drop-target");
      const target = el.dataset.zone;
      if (dragCtx.type === "item") moveItemToZone(dragCtx.id, target);
      else if (dragCtx.type === "zone") reorderZone(dragCtx.name, target);
      dragCtx = null;
    });
  });
  // 칸 추가 / 삭제 / 너비 전환
  $view.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addZone(b.dataset.add)));
  $view.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); deleteZone(b.dataset.del); }));
  $view.querySelectorAll("[data-width]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); toggleZoneWidth(b.dataset.width); }));
}

function toggleZoneWidth(name) {
  const z = state.zones.find((x) => x.name === name);
  if (!z) return;
  z.width = z.width === "half" ? "full" : "half";
  save();
  render();
}

function moveItemToZone(id, zoneName) {
  const it = state.items.find((x) => x.id === id);
  if (!it || it.zone === zoneName) return;
  it.zone = zoneName;
  const tz = state.zones.find((z) => z.name === zoneName);
  it.frozen = !!(tz && tz.section === "freezer"); // 냉동실로 옮기면 냉동 표시
  save();
  render();
  toast('"' + it.name + '" → ' + zoneName);
}

function reorderZone(name, targetName) {
  if (name === targetName) return;
  const from = state.zones.findIndex((z) => z.name === name);
  const to = state.zones.findIndex((z) => z.name === targetName);
  if (from < 0 || to < 0) return;
  if (state.zones[from].section !== state.zones[to].section) { toast("같은 칸(냉장실/냉동실)끼리만 정렬돼요"); return; }
  const [moved] = state.zones.splice(from, 1);
  const at = state.zones.findIndex((z) => z.name === targetName);
  state.zones.splice(at, 0, moved); // 대상 앞에 삽입
  save();
  render();
  toast('"' + name + '" 위치를 옮겼어요');
}

function uniqueZoneName(base) {
  if (base === "냉장") {
    let n = 1;
    while (zoneNames().includes("냉장 " + n + "칸")) n++;
    return "냉장 " + n + "칸";
  }
  if (!zoneNames().includes(base)) return base;
  let n = 2;
  while (zoneNames().includes(base + " " + n)) n++;
  return base + " " + n;
}

function addZone(key) {
  const t = ADDABLE.find((a) => a.key === key);
  if (!t) return;
  const z = { name: uniqueZoneName(t.base), section: t.section, kind: t.kind };
  let lastIdx = -1;
  state.zones.forEach((zz, i) => { if (zz.section === t.section) lastIdx = i; });
  state.zones.splice(lastIdx + 1, 0, z); // 해당 실의 맨 끝에 추가
  save();
  render();
  toast('"' + z.name + '" 칸을 추가했어요');
}

function deleteZone(name) {
  if (state.items.some((it) => it.zone === name)) { toast("먼저 재료를 다른 칸으로 옮겨 주세요"); return; }
  state.zones = state.zones.filter((z) => z.name !== name);
  save();
  render();
  toast('"' + name + '" 칸을 지웠어요');
}

/* ---------- 화면: 구획 상세 ---------- */
function renderZone() {
  const z = currentZone || "야채칸";
  const items = state.items.filter((it) => it.zone === z)
    .sort((a, b) => remaining(a) - remaining(b));
  const near = items.filter((it) => { const s = dInfo(it).sev; return s === "urgent" || s === "over"; }).length;
  const rows = items.length
    ? items.map((it) => {
        const di = dInfo(it);
        const total = it.expiry ? Math.max(diffDays(it.bought, it.expiry), 1) : it.shelfDays;
        const elapsed = Math.min(Math.max(diffDays(it.bought, fmt(today())), 0), total);
        const pct = Math.round((elapsed / total) * 100);
        const gcls = di.sev === "urgent" || di.sev === "over" ? "u" : di.sev === "warn" ? "w" : "";
        return '<div class="lrow" data-sheet="' + it.id + '" role="button" tabindex="0">' +
          '<div class="top"><span class="name">' + esc(it.name) + "</span>" + badges(it) +
          '<span class="bought">' + fmtKo(it.bought) + ' 구매</span><span class="chip-d ' + di.cls + '">' + di.label + "</span></div>" +
          '<div class="gauge"><i class="' + gcls + '" style="width:' + pct + '%"></i></div></div>';
      }).join("")
    : '<div class="empty">이 칸은 비어 있어요.</div>';
  return '<header class="appbar"><button class="back" data-goto="map" aria-label="냉장고로 돌아가기">‹</button>' +
    "<h1>" + esc(z) + '</h1><span class="sub">' + items.length + "개" + (near ? " · 임박 " + near : "") + "</span></header>" +
    rows + '<div class="quiet">재료를 누르면 상태를 바꿀 수 있어요</div>';
}

/* ---------- 화면: 등록 ---------- */
function renderAdd() {
  return '<header class="appbar"><h1>재료 추가</h1><span class="sub">필수 입력은 이름과 칸, 둘뿐</span></header>' +
    '<form id="add-form">' +
    '<div class="field"><label for="f-name">이름</label>' +
    '<input type="text" id="f-name" autocomplete="off" placeholder="예: 애호박" required>' +
    '<div id="f-suggest"></div></div>' +
    '<div class="field"><label>어느 칸에 넣었나요?</label><div class="seg" id="f-zone">' +
    addFormZones().map((z) => '<button type="button" class="s' + (z === "야채칸" ? " on" : "") + '" data-z="' + esc(z) + '">' + esc(z) + "</button>").join("") +
    "</div></div>" +
    '<div class="field"><label for="f-bought">구매일 <span class="opt">· 기본값은 오늘</span></label>' +
    '<input type="date" id="f-bought" value="' + fmt(today()) + '"></div>' +
    '<div class="field togglerow"><input type="checkbox" id="f-sale"><label for="f-sale">마감할인 상품 (임박 우선 관리)</label></div>' +
    '<div class="field"><details class="expiry"><summary>소비기한 직접 입력 (선택 — 포장에 적혀 있을 때만)</summary>' +
    '<div class="inner"><input type="date" id="f-expiry"></div></details></div>' +
    '<button class="btn primary big" style="width:100%" type="submit">등록하기</button>' +
    "</form>" +
    '<div class="quiet">장 본 게 많다면 → <button data-goto="receipt">영수증으로 한 번에</button></div>';
}

/* ---------- 화면: 영수증 ---------- */
function renderReceipt() {
  let preview = "";
  if (receiptPreview) {
    const inc = receiptPreview.filter((p) => !p.excluded);
    preview =
      '<div class="field"><label>냉장고에 들어갈 재료 ' + inc.length + "개를 찾았어요</label><div>" +
      receiptPreview.map((p, i) =>
        '<label class="checkrow ' + (p.checked ? "" : "off") + '">' +
        '<input type="checkbox" data-ri="' + i + '"' + (p.checked ? " checked" : "") + ">" +
        esc(p.name) + (p.sale ? ' <span class="tag-sale">마감할인</span>' : "") +
        '<span class="sub">' + esc(p.note) + "</span></label>").join("") +
      "</div></div>" +
      '<div class="field"><label for="r-zone">넣을 칸 한 번에 지정</label><select id="r-zone">' +
      addFormZones().map((z) => '<option' + (z === "냉장 2칸" ? " selected" : "") + ">" + esc(z) + "</option>").join("") + "</select></div>" +
      '<button class="btn primary big" style="width:100%" id="r-submit">체크한 재료 등록</button>';
  }
  return '<header class="appbar"><button class="back" data-goto="add" aria-label="등록으로 돌아가기">‹</button>' +
    '<h1>영수증으로 한 번에</h1></header>' +
    '<div class="field"><label for="r-text">전자영수증 내용 붙여넣기</label>' +
    '<textarea id="r-text" placeholder="GS25 마감할인&#10;두부 300g 1,050&#10;애호박 890&#10;신라면 5입 3,980&#10;봉투 100">' +
    (receiptPreview ? esc(receiptPreview.rawText || "") : "") + "</textarea></div>" +
    '<button class="btn big" style="width:100%" id="r-parse">품목 인식하기</button>' + preview +
    '<div class="quiet">기한은 전부 참고치 기반 추정이에요. 실온 보관·비식재료는 자동으로 체크가 풀려요.</div>';
}

/* ---------- 화면: 알뜰 ---------- */
/* 실제 배포 중인 마감임박·유통기한 임박 할인 서비스 (외부 링크) */
const SAVE_SERVICES = [
  { name: "라스트오더", desc: "편의점·음식점 마감할인 · 지도 기반", tag: "앱",
    url: "https://apps.apple.com/kr/app/id1439949453" },
  { name: "떠리몰", desc: "유통기한 임박·리퍼브 식품 쇼핑몰", tag: "웹·앱",
    url: "https://thirtymall.com/" },
  { name: "임박몰", desc: "유통기한 임박상품 전문 쇼핑몰", tag: "웹",
    url: "https://www.imbak.co.kr/" },
];

function renderSave() {
  const rules = [
    "스폰서 상품이라고 임박 목록의 우선순위를 높이지 않습니다.",
    "식품 안전 판단과 처리 권고는 상업적 제휴와 독립적입니다.",
    "아래 서비스는 외부 링크이며, 제휴 여부를 명확히 표기합니다.",
  ];
  const links = SAVE_SERVICES.map((sv) =>
    '<a class="save-link" href="' + sv.url + '" target="_blank" rel="noopener noreferrer">' +
    '<div class="save-info"><span class="save-name">' + esc(sv.name) + '</span>' +
    '<span class="save-desc">' + esc(sv.desc) + "</span></div>" +
    '<span class="save-tag">' + esc(sv.tag) + "</span>" +
    '<span class="save-go" aria-hidden="true">↗</span></a>').join("");
  return '<header class="appbar"><h1>알뜰 구매</h1><span class="sub">선택 기능</span></header>' +
    '<section class="rules" aria-label="신뢰 원칙">' +
    '<div class="rules-title">신뢰 원칙</div>' +
    "<ol>" + rules.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ol>" +
    "</section>" +
    '<div class="h-section">마감 임박 할인 <small>외부</small></div>' +
    '<p class="save-lead">유통기한·마감 임박 상품을 실제로 파는 서비스예요. 사기 전 냉장고에 같은 재료가 있는지 확인하고, 사면 <b>마감할인</b> 태그로 등록해 먼저 처리하세요.</p>' +
    links +
    '<p class="save-foot">※ 위 서비스는 이거먼저와 제휴되지 않은 참고용 외부 링크입니다. 상호·상표는 각 사에 있습니다.</p>';
}

/* ---------- 화면: 설정 ---------- */
function renderSettings() {
  const c = { consumed: 0, frozen: 0, discarded: 0 };
  state.history.forEach((h) => { if (c[h.doneAs] !== undefined) c[h.doneAs]++; });
  const handled = c.consumed + c.frozen;
  const total = handled + c.discarded;
  const rate = total ? Math.round((handled / total) * 100) : null;
  return '<header class="appbar"><h1>설정</h1></header>' +
    '<div class="panel"><h2>나의 처리 기록</h2><div class="stat-grid">' +
    '<div><div class="num">' + c.consumed + '</div><div class="lbl">소비 완료</div></div>' +
    '<div><div class="num">' + c.frozen + '</div><div class="lbl">냉동 처리</div></div>' +
    '<div><div class="num">' + c.discarded + '</div><div class="lbl">폐기</div></div></div>' +
    (rate !== null ? '<p style="margin:10px 0 0; font-size:12.5px; color:var(--ink-soft)">폐기 전 처리율 <b>' + rate + "%</b></p>" : "") +
    "</div>" +
    '<div class="panel"><h2>데이터</h2>' +
    '<div class="actions" style="margin-top:6px">' +
    '<button class="btn" id="s-seed">샘플 데이터 넣기</button>' +
    '<button class="btn danger-line" id="s-clear">전체 비우기</button></div>' +
    '<p style="font-size:11.5px; color:var(--ink-soft); margin:10px 0 0">데이터는 이 브라우저에만 저장돼요(localStorage). 서버로 전송되지 않아요.</p></div>' +
    '<div class="panel"><h2>기한 계산 기준</h2>' +
    "구매일 + 품목별 권장 보관기간으로 남은 기간을 추정해요. 기본값은 식약처 소비기한 참고치를 근사한 값이며, 포장의 소비기한을 직접 입력하면 그 값을 우선해요. 상태가 의심되면 날짜보다 냄새·상태 확인이 먼저예요.</div>";
}

/* ---------- 이벤트 바인딩 ---------- */
function bindView() {
  // 이동 버튼
  $view.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => go(b.dataset.goto)));
  // 냉장고 칸(선반·서랍) → 상세 (내부 아이템/삭제 버튼 클릭은 제외)
  $view.querySelectorAll("[data-zone]").forEach((zEl) => {
    zEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-sheet]") || e.target.closest("[data-del]") || e.target.closest("[data-width]")) return;
      go("zone", zEl.dataset.zone);
    });
    zEl.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.target.closest("[data-sheet]")) {
        e.preventDefault();
        go("zone", zEl.dataset.zone);
      }
    });
  });
  if (currentView === "map") bindFridge();
  // 시트 열기
  $view.querySelectorAll("[data-sheet]").forEach((el) => {
    const open = (e) => { e.stopPropagation(); openSheet(el.dataset.sheet); };
    el.addEventListener("click", open);
    if (el.classList.contains("lrow")) {
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openSheet(el.dataset.sheet); } });
    }
  });
  // 홈 카드 액션
  $view.querySelectorAll("[data-act]").forEach((b) => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const it = state.items.find((x) => x.id === b.dataset.id);
      if (!it) return;
      const act = b.dataset.act;
      if (act === "eat") finish(it, "consumed");
      else if (act === "freeze") freeze(it);
      else if (act === "prep") prep(it);
      else if (act === "check") openSheet(it.id, true);
    });
  });
  // 등록 폼
  const form = $view.querySelector("#add-form");
  if (form) bindAddForm(form);
  // 영수증
  const parseBtn = $view.querySelector("#r-parse");
  if (parseBtn) bindReceipt();
}

function bindAddForm(form) {
  const nameEl = form.querySelector("#f-name");
  const sugEl = form.querySelector("#f-suggest");
  let zone = "야채칸";
  let zoneTouched = false; // 사용자가 칸을 직접 고르면 자동 추천을 멈춤
  const selectZone = (z) => {
    zone = z;
    form.querySelectorAll("#f-zone .s").forEach((x) => x.classList.toggle("on", x.dataset.z === z));
  };
  nameEl.addEventListener("input", () => {
    const v = nameEl.value.trim();
    const g = guessFood(nameEl.value);
    let gz = guessZone(nameEl.value);
    if (gz && !zoneNames().includes(gz)) gz = null; // 삭제된 칸은 추천하지 않음
    if (v && gz && !zoneTouched) selectZone(gz); // 칸 자동 추천
    const zoneNote = (v && gz && !zoneTouched) ? " · " + esc(gz) + " 추천" : "";
    sugEl.innerHTML = v
      ? '<div class="suggest"><span>' + esc(v) + "</span><small>권장 냉장 " + (g ? g.d : DEFAULT_DAYS) + "일 · 자동 적용" + zoneNote + "</small></div>"
      : "";
  });
  form.querySelectorAll("#f-zone .s").forEach((b) => {
    b.addEventListener("click", () => {
      zoneTouched = true;
      form.querySelectorAll("#f-zone .s").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      zone = b.dataset.z;
    });
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameEl.value.trim();
    if (!name) return;
    const g = guessFood(name);
    const bought = form.querySelector("#f-bought").value || fmt(today());
    const expiry = form.querySelector("#f-expiry").value || null;
    state.items.push({
      id: uid(), name, zone, bought,
      shelfDays: g ? g.d : DEFAULT_DAYS,
      expiry, sale: form.querySelector("#f-sale").checked,
    });
    save();
    toast('"' + name + '" 등록 완료 → ' + zone);
    render(); // 폼 초기화 겸 재렌더
  });
}

function bindReceipt() {
  $view.querySelector("#r-parse").addEventListener("click", () => {
    const text = $view.querySelector("#r-text").value;
    receiptPreview = parseReceipt(text);
    receiptPreview.rawText = text;
    render();
  });
  $view.querySelectorAll('[data-ri]').forEach((cb) => {
    cb.addEventListener("change", () => { receiptPreview[Number(cb.dataset.ri)].checked = cb.checked; });
  });
  const submit = $view.querySelector("#r-submit");
  if (submit) {
    submit.addEventListener("click", () => {
      const zone = $view.querySelector("#r-zone").value;
      const picked = receiptPreview.filter((p) => p.checked);
      if (!picked.length) { toast("체크된 재료가 없어요"); return; }
      picked.forEach((p) => {
        state.items.push({ id: uid(), name: p.name, zone, bought: fmt(today()), shelfDays: p.days, expiry: null, sale: p.sale });
      });
      save();
      toast(picked.length + "개 재료 등록 완료 → " + zone);
      receiptPreview = null;
      go("home");
    });
  }
}

function parseReceipt(text) {
  const sale = /마감|할인|라스트오더/.test(text);
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || SKIP_LINE.some((k) => t.includes(k))) return;
    const m = t.match(/^[^\d]+/);
    if (!m) return;
    const name = m[0].replace(/[.*·…()\-x×@₩,]/g, " ").trim();
    if (name.length < 2 || !/[가-힣]/.test(name)) return;
    if (out.some((p) => p.name === name)) return;
    if (matchAny(name, NON_FOOD)) {
      out.push({ name, checked: false, excluded: true, note: "식재료 아님 — 제외됨", days: DEFAULT_DAYS, sale: false });
    } else if (matchAny(name, ROOM_TEMP)) {
      out.push({ name, checked: false, excluded: true, note: "실온 보관 — 제외됨", days: DEFAULT_DAYS, sale: false });
    } else {
      const g = guessFood(name);
      out.push({
        name, checked: true, excluded: false,
        note: g ? "냉장 · 참고치 " + g.d + "일" : "미인식 · 기본값 " + DEFAULT_DAYS + "일",
        days: g ? g.d : DEFAULT_DAYS, sale,
      });
    }
  });
  return out;
}

/* ---------- 처리 액션 ---------- */
function finish(it, doneAs, reason) {
  state.items = state.items.filter((x) => x.id !== it.id);
  state.history.push({ name: it.name, doneAs, reason: reason || null, doneAt: fmt(today()) });
  save();
  closeSheet();
  toast(doneAs === "consumed" ? '"' + it.name + '" 소비 완료! 잘 먹었어요 🎉' : '"' + it.name + '" 폐기로 기록했어요');
  render();
}
function freeze(it) {
  it.zone = "냉동칸";
  it.frozen = true;
  it.expiry = addDays(fmt(today()), FROZEN_DAYS);
  state.history.push({ name: it.name, doneAs: "frozen", doneAt: fmt(today()) });
  save();
  closeSheet();
  toast('"' + it.name + '" 냉동칸으로 이동 (+' + FROZEN_DAYS + "일)");
  render();
}
function prep(it) {
  it.prepped = true;
  it.expiry = addDays(expiryOf(it), 2);
  save();
  closeSheet();
  toast('"' + it.name + '" 손질됨 — 보관 여유 +2일');
  render();
}
function partialUse(it) {
  it.partial = true;
  save();
  closeSheet();
  toast('"' + it.name + '" 일부 사용으로 기록했어요');
  render();
}
function extend(it, days) {
  it.expiry = addDays(fmt(today()), days);
  save();
  closeSheet();
  toast('"' + it.name + '" 상태 양호 — ' + days + "일 더 지켜봐요");
  render();
}

/* ---------- 바텀 시트 ---------- */
function openSheet(id, checkMode) {
  const it = state.items.find((x) => x.id === id);
  if (!it) return;
  const di = dInfo(it);
  const over = di.sev === "over";
  const hint = over || checkMode
    ? "💡 권장 기간이 지났어요. 색·냄새·질감을 확인하고, 괜찮다면 오늘 안에 드세요."
    : it.zone === "냉동칸"
      ? "💡 냉동 재료는 해동 후 바로 사용하는 게 좋아요."
      : "💡 손질해서 냉동하면 약 1개월 보관할 수 있어요.";
  const discardBlock = over || checkMode
    ? '<div class="field" style="margin:0"><label>폐기한다면 이유를 하나만 알려주세요</label><div class="actions">' +
      '<button class="btn danger-line" data-sa="discard" data-r="상함">상해서</button>' +
      '<button class="btn danger-line" data-sa="discard" data-r="너무 많음">너무 많아서</button>' +
      '<button class="btn danger-line" data-sa="discard" data-r="기타">기타</button></div></div>'
    : '<button class="btn danger-line" data-sa="discard" data-r="">폐기</button>';
  $sheet.innerHTML =
    '<div class="grab"></div>' +
    '<div class="row1"><span class="name" style="font-size:17px">' + esc(it.name) + '</span>' +
    '<span class="where">' + esc(it.zone) + "</span>" + badges(it) +
    '<span class="chip-d ' + di.cls + '">' + di.label + "</span></div>" +
    '<div class="meta">' + fmtKo(it.bought) + " 구매 · " +
    (it.expiry ? "소비기한 " + fmtKo(it.expiry) : "권장 " + it.shelfDays + "일 (식약처 참고치 근사)") + "</div>" +
    '<div class="hint">' + hint + "</div>" +
    ((over || checkMode)
      ? '<div class="grid2">' +
        '<button class="btn primary" data-sa="eat">오늘 먹기</button>' +
        '<button class="btn" data-sa="extend">아직 괜찮아요 (+2일)</button></div>' + discardBlock
      : '<div class="grid2">' +
        '<button class="btn" data-sa="partial">일부 사용</button>' +
        '<button class="btn primary" data-sa="eat">소비 완료</button>' +
        (it.zone === "냉동칸" ? "" : '<button class="btn" data-sa="freeze">냉동으로 이동</button>') +
        discardBlock + "</div>") +
    '<div class="small-note">폐기도 솔직하게 기록해요 — 다음 장보기가 좋아져요.</div>';
  $overlay.hidden = false;
  $sheet.querySelectorAll("[data-sa]").forEach((b) => {
    b.addEventListener("click", () => {
      const a = b.dataset.sa;
      if (a === "eat") finish(it, "consumed");
      else if (a === "partial") partialUse(it);
      else if (a === "freeze") freeze(it);
      else if (a === "extend") extend(it, 2);
      else if (a === "discard") finish(it, "discarded", b.dataset.r || null);
    });
  });
  $sheet.querySelector("[data-sa]").focus();
}
function closeSheet() { $overlay.hidden = true; }
$overlay.addEventListener("click", (e) => { if (e.target === $overlay) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$overlay.hidden) closeSheet(); });

/* ---------- 설정 액션 (위임) ---------- */
$view.addEventListener("click", (e) => {
  if (e.target.id === "s-seed") {
    state.items = state.items.concat(seedItems().filter((s) => !state.items.some((x) => x.name === s.name)));
    save(); toast("샘플 데이터를 넣었어요"); render();
  } else if (e.target.id === "s-clear") {
    if (confirm("모든 재료와 기록을 지울까요?")) {
      state = { items: [], history: [], seeded: false };
      save(); toast("비웠어요"); render();
    }
  }
});

/* ---------- 시작 ---------- */
go("home");
