(function () {
  const state = {
    active: false,
    style: 0,
    intensity: .62,
    svg: null,
    groups: [],
    sprites: [],
  };

  const artwork = `
    <defs>
      <linearGradient id="vector-dragon-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff3f8f"/>
        <stop offset=".48" stop-color="#ffcc1f"/>
        <stop offset="1" stop-color="#16cfe5"/>
      </linearGradient>
      <linearGradient id="vector-prism-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ff2e8b"/>
        <stop offset=".5" stop-color="#ffca2b"/>
        <stop offset="1" stop-color="#17d8ef"/>
      </linearGradient>
      <filter id="vector-soft-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>

      <g id="vector-daisy" stroke="#15131d" stroke-width="8" stroke-linejoin="round">
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#ffffff"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#ff3c94" transform="rotate(45)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#ffdf24" transform="rotate(90)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#26d8e8" transform="rotate(135)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#ffffff" transform="rotate(180)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#ff4c33" transform="rotate(225)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#6fe150" transform="rotate(270)"/>
        <ellipse cx="0" cy="-58" rx="27" ry="49" fill="#4667ff" transform="rotate(315)"/>
        <circle r="55" fill="#ffd629"/>
        <circle cx="-18" cy="-8" r="6" fill="#15131d" stroke="none"/>
        <circle cx="18" cy="-8" r="6" fill="#15131d" stroke="none"/>
        <path d="M-25 14 Q0 39 28 12" fill="none" stroke="#15131d" stroke-width="8" stroke-linecap="round"/>
      </g>

      <g id="vector-blossom" stroke="#15131d" stroke-width="6" stroke-linejoin="round">
        <circle cx="0" cy="-35" r="31" fill="#ff4d9b"/>
        <circle cx="33" cy="-10" r="31" fill="#ffffff"/>
        <circle cx="20" cy="29" r="31" fill="#25d5e8"/>
        <circle cx="-20" cy="29" r="31" fill="#ffdb26"/>
        <circle cx="-33" cy="-10" r="31" fill="#ff623d"/>
        <circle r="29" fill="#7be34d"/>
        <circle cx="-9" cy="-4" r="4" fill="#15131d" stroke="none"/>
        <circle cx="9" cy="-4" r="4" fill="#15131d" stroke="none"/>
        <path d="M-12 8 Q0 20 13 8" fill="none" stroke-width="5" stroke-linecap="round"/>
      </g>

      <g id="vector-mascot" stroke="#15131d" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-72 29 C-91-15-71-76-22-90 C32-106 83-69 87-14 C92 44 53 88 0 90 C-32 91-58 70-72 29Z" fill="#ff4f9b"/>
        <path d="M-52 43 C-34 13-8-1 26 5 C55 10 70 32 64 60 C34 91-23 96-52 43Z" fill="#ffcf33"/>
        <path d="M-72-18 Q-110-42-104-74 Q-65-74-48-47" fill="#21d1e8"/>
        <path d="M66-35 Q104-60 112-28 Q100 2 77 7" fill="#75df4d"/>
        <ellipse cx="-25" cy="-25" rx="19" ry="24" fill="#fff"/>
        <ellipse cx="28" cy="-25" rx="19" ry="24" fill="#fff"/>
        <circle cx="-20" cy="-21" r="7" fill="#15131d" stroke="none"/>
        <circle cx="33" cy="-21" r="7" fill="#15131d" stroke="none"/>
        <path d="M-29 19 Q3 48 39 14" fill="none"/>
        <path d="M-70 35 Q-112 50-111 82" fill="none"/>
        <path d="M72 35 Q111 49 105 82" fill="none"/>
        <path d="M-31 85 L-48 116 M35 85 L51 116" fill="none"/>
        <path d="M-68-4 L62-66" fill="none" stroke="#fff" stroke-width="13" opacity=".78"/>
      </g>

      <g id="vector-dragon" stroke="#15131d" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-300 45 C-226-52-154 105-68 19 C8-58 73 83 150 14 C205-34 244-16 285 23" fill="none" stroke="#15131d" stroke-width="101"/>
        <path d="M-300 45 C-226-52-154 105-68 19 C8-58 73 83 150 14 C205-34 244-16 285 23" fill="none" stroke="url(#vector-dragon-gradient)" stroke-width="78"/>
        <path d="M-237 10 L-205-79 L-155-20 M-100 45 L-56-65 L-7 9 M52 40 L95-58 L137 7" fill="#21d1e8" stroke-width="10"/>
        <path d="M224-22 C270-75 343-49 350 13 C357 73 297 106 244 71 C217 53 204 13 224-22Z" fill="#ffce2c" stroke-width="10"/>
        <path d="M252-51 L263-108 L291-57 M299-49 L332-96 L333-31" fill="#ff4d96" stroke-width="10"/>
        <ellipse cx="309" cy="6" rx="25" ry="29" fill="#fff" stroke-width="8"/>
        <circle cx="317" cy="9" r="9" fill="#15131d" stroke="none"/>
        <path d="M314 48 Q342 37 349 16" fill="none" stroke-width="8"/>
        <path d="M-301 45 Q-351 79-375 36" fill="none" stroke="#15131d" stroke-width="27"/>
        <path d="M-301 45 Q-351 79-375 36" fill="none" stroke="#55df51" stroke-width="15"/>
      </g>

      <g id="vector-vinyl" stroke="#15131d" stroke-width="8">
        <circle r="83" fill="#171722"/>
        <circle r="66" fill="none" stroke="#4b4d68" stroke-width="5"/>
        <circle r="48" fill="none" stroke="#34364b" stroke-width="4"/>
        <circle r="31" fill="#ff3f91"/>
        <circle r="9" fill="#ffdf27" stroke-width="5"/>
        <path d="M-61-37 Q-40-67-5-74" fill="none" stroke="#70def0" stroke-width="7"/>
      </g>

      <g id="vector-speaker" stroke="#15131d" stroke-width="9" stroke-linejoin="round">
        <rect x="-65" y="-98" width="130" height="196" rx="22" fill="#32d2e3"/>
        <circle cy="37" r="44" fill="#ff4e98"/>
        <circle cy="37" r="20" fill="#ffdb22"/>
        <circle cy="-51" r="22" fill="#f8f4e8"/>
        <circle cy="-51" r="8" fill="#15131d" stroke="none"/>
        <path d="M-39-13 H39"/>
      </g>

      <g id="vector-spark" fill="#fff" stroke="#15131d" stroke-width="6" stroke-linejoin="round">
        <path d="M0-72 C8-24 24-8 72 0 C24 8 8 24 0 72 C-8 24-24 8-72 0 C-24-8-8-24 0-72Z"/>
        <circle r="12" fill="#ffda25"/>
      </g>

      <g id="vector-sun" stroke="#15131d" stroke-width="8" stroke-linecap="round">
        <circle r="61" fill="#ffcf1d"/>
        <g fill="none">
          <path d="M0-103 V-137 M0 103 V137 M-103 0 H-137 M103 0 H137"/>
          <path d="M-73-73 L-98-98 M73 73 L98 98 M73-73 L98-98 M-73 73 L-98 98"/>
        </g>
        <circle cx="-19" cy="-9" r="6" fill="#15131d" stroke="none"/>
        <circle cx="19" cy="-9" r="6" fill="#15131d" stroke="none"/>
        <path d="M-26 17 Q0 42 29 15" fill="none"/>
      </g>

      <g id="vector-eye" stroke="#15131d" stroke-width="8" stroke-linejoin="round">
        <path d="M-105 0 Q0-92 105 0 Q0 92-105 0Z" fill="#fff"/>
        <circle r="48" fill="#29d4e8"/>
        <circle r="25" fill="#ffcf24"/>
        <circle r="11" fill="#15131d"/>
        <path d="M-79-42 L-98-70 M-41-67 L-47-101 M0-78 V-113 M41-67 L47-101 M79-42 L98-70" fill="none" stroke-linecap="round"/>
      </g>

      <g id="vector-cassette" stroke="#15131d" stroke-width="9" stroke-linejoin="round">
        <rect x="-118" y="-76" width="236" height="152" rx="25" fill="#ffcf26"/>
        <rect x="-92" y="-51" width="184" height="83" rx="15" fill="#ff4c98"/>
        <circle cx="-48" cy="-9" r="27" fill="#fff"/>
        <circle cx="48" cy="-9" r="27" fill="#fff"/>
        <circle cx="-48" cy="-9" r="10" fill="#15131d"/>
        <circle cx="48" cy="-9" r="10" fill="#15131d"/>
        <path d="M-49-9 C-24 16 24 16 49-9" fill="none"/>
        <path d="M-66 48 H66 L86 72 H-86Z" fill="#25d5e7"/>
      </g>

      <g id="vector-palm" stroke="#15131d" stroke-width="10" stroke-linejoin="round" stroke-linecap="round">
        <path d="M-18 130 C-4 68 7 16 0-55" fill="none" stroke="#ffb92b" stroke-width="34"/>
        <path d="M0-53 C-18-105-74-124-116-102 C-65-64-32-51 0-53Z" fill="#58df4e"/>
        <path d="M2-55 C28-111 84-121 121-89 C69-59 38-47 2-55Z" fill="#25d5e7"/>
        <path d="M0-57 C-12-119 20-157 58-165 C58-111 39-75 0-57Z" fill="#ff4d98"/>
        <path d="M-2-53 C-43-98-89-82-112-47 C-65-32-31-34-2-53Z" fill="#ffda24"/>
        <circle cy="-52" r="18" fill="#ff7a2f"/>
      </g>

      <g id="vector-dancer" stroke="#15131d" stroke-width="11" stroke-linejoin="round" stroke-linecap="round">
        <circle cy="-100" r="30" fill="#ffcf24"/>
        <path d="M0-68 C-50-48-55 30-13 58 C29 81 68 38 48-12 C37-42 21-62 0-68Z" fill="#ff4c98"/>
        <path d="M-31-36 L-100-77 L-125-43 M34-37 L92-91 L123-70" fill="none"/>
        <path d="M-17 54 L-62 131 L-91 122 M31 50 L78 120 L108 103" fill="none"/>
        <path d="M-32-4 Q5 22 46-8" fill="none" stroke="#25d5e7" stroke-width="17"/>
        <path d="M-47 8 L50 8" stroke="#ffdc25" stroke-width="12"/>
      </g>
    </defs>

    <g data-vector-style="0">
      <g opacity=".26"><path d="M80 112H1520M80 788H1520" stroke="#61f3ff" stroke-width="3"/><path d="M104 136H420M1180 136H1496M104 764H420M1180 764H1496" stroke="#ff315f" stroke-width="9"/><path d="M800 70V830" stroke="#fff36a" stroke-width="2" stroke-dasharray="18 26"/></g>
      <g data-vector-sprite data-x="268" data-y="278" data-scale="1" data-phase=".4" data-speed=".12" data-drift="30" data-spin="-1.4">
        <path d="M-42-168H42V-66H122V18H42V174H-42V18H-122V-66H-42Z" fill="#ff315f" stroke="#140816" stroke-width="15" stroke-linejoin="bevel"/><path d="M-20-144H20V-42H94V-8H20V146H-20V-8H-94V-42H-20Z" fill="#fff4df" opacity=".82"/><path d="M-122-66L-86-102H-42V-66ZM42-66H122L86-102H42Z" fill="#61f3ff"/>
      </g>
      <g data-vector-sprite data-x="610" data-y="302" data-scale="1" data-phase="1.7" data-speed=".1" data-drift="24" data-spin=".7" fill="none" stroke-linecap="square">
        <path d="M0-176L-102-106L-54-18L-126 70L0 174L126 70L54-18L102-106Z" stroke="#61f3ff" stroke-width="6"/><path d="M0-176V174M-102-106L102-106M-54-18H54M-126 70H126M-102-106L54-18L-126 70M102-106L-54-18L126 70" stroke="#fff4df" stroke-width="3" opacity=".74"/>
        <g fill="#fff36a" stroke="#140816" stroke-width="6"><rect x="-17" y="-193" width="34" height="34"/><rect x="-119" y="-123" width="34" height="34"/><rect x="85" y="-123" width="34" height="34"/><rect x="-71" y="-35" width="34" height="34"/><rect x="37" y="-35" width="34" height="34"/><rect x="-143" y="53" width="34" height="34"/><rect x="109" y="53" width="34" height="34"/><rect x="-17" y="157" width="34" height="34"/></g>
      </g>
      <g data-vector-sprite data-x="1010" data-y="244" data-scale="1" data-phase="2.8" data-speed=".13" data-drift="28" data-spin="1.1"><path d="M0-148L58-88L0-10L-58-88ZM0-10V154M-78 48H78" fill="none" stroke="#fff36a" stroke-width="20" stroke-linejoin="bevel"/><path d="M0-116L28-84L0-42L-28-84Z" fill="#ff315f"/><path d="M-78 48L-48 18M78 48L48 18" stroke="#61f3ff" stroke-width="8"/></g>
      <g data-vector-sprite data-x="1324" data-y="278" data-scale="1" data-phase="4" data-speed=".11" data-drift="26" data-spin="-1.2"><path d="M0-142L42-54L136-42L66 22L88 118L0 72L-88 118L-66 22L-136-42L-42-54Z" fill="#61f3ff" stroke="#140816" stroke-width="13" stroke-linejoin="bevel"/><path d="M0-104L34-34L104-28L50 18L68 88L0 54L-68 88L-50 18L-104-28L-34-34Z" fill="#193a8d" stroke="#fff4df" stroke-width="6"/><rect x="-24" y="-24" width="48" height="48" fill="#fff36a" transform="rotate(45)"/></g>
      <g data-vector-sprite data-x="790" data-y="642" data-scale=".83" data-phase="5.2" data-speed=".09" data-drift="22" data-spin=".4">
        <g fill="#fff4df" stroke="#140816" stroke-width="8"><rect x="-42" y="-176" width="84" height="42"/><rect x="-84" y="-134" width="168" height="42"/><rect x="-112" y="-92" width="224" height="42"/><rect x="-140" y="-50" width="280" height="42"/><rect x="-112" y="-8" width="224" height="42"/><rect x="-154" y="34" width="308" height="42"/><rect x="-196" y="76" width="392" height="42"/><rect x="-238" y="118" width="476" height="42"/></g><rect x="-22" y="-134" width="44" height="44" fill="#ff315f"/><rect x="-126" y="-8" width="42" height="42" fill="#61f3ff"/><rect x="84" y="-8" width="42" height="42" fill="#61f3ff"/>
      </g>
      <g data-vector-sprite data-x="264" data-y="654" data-scale=".88" data-phase="6.4" data-speed=".14" data-drift="28" data-spin="1.6" fill="none" stroke-linejoin="bevel"><path d="M0-132L94-94L132 0L94 94L0 132L-94 94L-132 0L-94-94Z" stroke="#fff36a" stroke-width="16"/><path d="M0-82L58-58L82 0L58 58L0 82L-58 58L-82 0L-58-58Z" stroke="#ff315f" stroke-width="9"/><path d="M0-132V132M-132 0H132M-94-94L94 94M94-94L-94 94" stroke="#61f3ff" stroke-width="8"/><rect x="-22" y="-22" width="44" height="44" fill="#fff4df" stroke="#140816" stroke-width="8" transform="rotate(45)"/></g>
    </g>

    <g data-vector-style="1">
      <ellipse cx="800" cy="450" rx="565" ry="275" fill="none" stroke="#55dcf0" stroke-width="4" opacity=".35"/>
      <ellipse cx="800" cy="450" rx="390" ry="185" fill="none" stroke="#ff4a91" stroke-width="3" opacity=".3"/>
      <use href="#vector-vinyl" data-vector-sprite data-x="280" data-y="300" data-scale=".82" data-phase="0" data-speed=".24" data-drift="42" data-spin="12"/>
      <use href="#vector-daisy" data-vector-sprite data-x="1320" data-y="280" data-scale=".68" data-phase="2" data-speed=".2" data-drift="36" data-spin="-8"/>
      <use href="#vector-mascot" data-vector-sprite data-x="1120" data-y="690" data-scale=".92" data-phase="4" data-speed=".18" data-drift="45"/>
      <use href="#vector-speaker" data-vector-sprite data-x="470" data-y="700" data-scale=".72" data-phase="1" data-speed=".21" data-drift="35"/>
      <use href="#vector-blossom" data-vector-sprite data-x="800" data-y="170" data-scale=".58" data-phase="5" data-speed=".16" data-drift="30" data-spin="9"/>
      <use href="#vector-spark" data-vector-sprite data-x="1480" data-y="565" data-scale=".45" data-phase="3" data-speed=".24" data-drift="25" data-spin="14"/>
      <use href="#vector-cassette" data-vector-sprite data-x="1400" data-y="640" data-scale=".55" data-phase="6" data-speed=".19" data-drift="31" data-spin="-2"/>
      <use href="#vector-eye" data-vector-sprite data-x="780" data-y="720" data-scale=".42" data-phase="7" data-speed=".17" data-drift="30"/>
      <use href="#vector-blossom" data-vector-sprite data-x="190" data-y="585" data-scale=".48" data-phase="8" data-speed=".22" data-drift="28" data-spin="7"/>
      <use href="#vector-dancer" data-vector-sprite data-x="1190" data-y="385" data-scale=".43" data-phase="9" data-speed=".18" data-drift="34"/>
    </g>

    <g data-vector-style="2">
      <path d="M80 690 C350 480 400 100 730 250 C1030 390 1110 70 1530 205" fill="none" stroke="#425eff" stroke-width="7" opacity=".34" stroke-dasharray="19 28"/>
      <use href="#vector-dragon" data-vector-sprite data-x="760" data-y="245" data-scale=".92" data-phase="1" data-speed=".13" data-drift="30"/>
      <use href="#vector-daisy" data-vector-sprite data-x="180" data-y="670" data-scale=".9" data-phase="3" data-speed=".1" data-drift="24" data-spin="-4"/>
      <use href="#vector-mascot" data-vector-sprite data-x="1370" data-y="655" data-scale="1.05" data-phase="5" data-speed=".12" data-drift="28"/>
      <use href="#vector-spark" data-vector-sprite data-x="1320" data-y="160" data-scale=".72" data-phase="2" data-speed=".14" data-drift="22" data-spin="7"/>
      <use href="#vector-spark" data-vector-sprite data-x="310" data-y="160" data-scale=".42" data-phase="4" data-speed=".17" data-drift="18" data-spin="-8"/>
      <use href="#vector-blossom" data-vector-sprite data-x="1050" data-y="715" data-scale=".72" data-phase="6" data-speed=".11" data-drift="20" data-spin="5"/>
      <use href="#vector-eye" data-vector-sprite data-x="790" data-y="680" data-scale=".52" data-phase="7" data-speed=".13" data-drift="23"/>
      <use href="#vector-dancer" data-vector-sprite data-x="215" data-y="330" data-scale=".45" data-phase="8" data-speed=".15" data-drift="24"/>
      <use href="#vector-cassette" data-vector-sprite data-x="1270" data-y="380" data-scale=".48" data-phase="9" data-speed=".14" data-drift="21" data-spin="2"/>
      <use href="#vector-sun" data-vector-sprite data-x="1460" data-y="540" data-scale=".48" data-phase="10" data-speed=".21" data-drift="27" data-spin="28"/>
      <use href="#vector-dragon" data-vector-sprite data-vector-extra=".58" data-x="420" data-y="690" data-scale=".46" data-phase="11" data-speed=".23" data-drift="38"/>
      <use href="#vector-blossom" data-vector-sprite data-vector-extra=".82" data-x="1450" data-y="190" data-scale=".54" data-phase="12" data-speed=".27" data-drift="36" data-spin="-18"/>
    </g>

    <g data-vector-style="3">
      <g opacity=".24">
        <polygon points="120,760 510,70 780,720" fill="#ff318c"/>
        <polygon points="510,820 860,100 1170,790" fill="#ffcf2b"/>
        <polygon points="840,780 1190,80 1530,720" fill="#19d7ec"/>
      </g>
      <polygon points="800,85 1230,790 365,790" fill="none" stroke="url(#vector-prism-gradient)" stroke-width="22" opacity=".8"/>
      <polygon points="790,220 1075,700 505,700" fill="none" stroke="#fff" stroke-width="5" opacity=".48"/>
      <use href="#vector-mascot" data-vector-sprite data-x="255" data-y="480" data-scale="1.15" data-phase="2" data-speed=".11" data-drift="25"/>
      <use href="#vector-daisy" data-vector-sprite data-x="1335" data-y="280" data-scale=".9" data-phase="4" data-speed=".13" data-drift="24" data-spin="5"/>
      <use href="#vector-vinyl" data-vector-sprite data-x="1300" data-y="700" data-scale=".72" data-phase="1" data-speed=".15" data-drift="20" data-spin="12"/>
      <use href="#vector-blossom" data-vector-sprite data-x="280" data-y="160" data-scale=".7" data-phase="5" data-speed=".12" data-drift="22" data-spin="-6"/>
      <use href="#vector-spark" data-vector-sprite data-x="800" data-y="450" data-scale=".52" data-phase="3" data-speed=".18" data-drift="14" data-spin="9"/>
      <use href="#vector-eye" data-vector-sprite data-x="795" data-y="695" data-scale=".46" data-phase="6" data-speed=".14" data-drift="18"/>
      <use href="#vector-cassette" data-vector-sprite data-x="1240" data-y="480" data-scale=".46" data-phase="7" data-speed=".17" data-drift="22" data-spin="-3"/>
      <use href="#vector-dancer" data-vector-sprite data-x="365" data-y="680" data-scale=".43" data-phase="8" data-speed=".16" data-drift="20"/>
    </g>

    <g data-vector-style="4">
      <path d="M0 790 C245 650 380 890 610 720 C820 565 930 815 1150 690 C1320 590 1440 650 1600 540" fill="none" stroke="#ffcf20" stroke-width="18" opacity=".88"/>
      <use href="#vector-dragon" data-vector-sprite data-x="430" data-y="430" data-scale=".83" data-phase="1" data-speed=".24" data-drift="42"/>
      <use href="#vector-sun" data-vector-sprite data-x="1330" data-y="195" data-scale=".82" data-phase="2" data-speed=".18" data-drift="28" data-spin="3"/>
      <use href="#vector-mascot" data-vector-sprite data-x="1230" data-y="610" data-scale="1.12" data-phase="4" data-speed=".22" data-drift="38"/>
      <use href="#vector-speaker" data-vector-sprite data-x="190" data-y="680" data-scale=".74" data-phase="5" data-speed=".28" data-drift="32"/>
      <use href="#vector-vinyl" data-vector-sprite data-x="1130" data-y="150" data-scale=".58" data-phase="3" data-speed=".3" data-drift="26" data-spin="18"/>
      <use href="#vector-daisy" data-vector-sprite data-x="180" data-y="165" data-scale=".72" data-phase="0" data-speed=".21" data-drift="30" data-spin="-8"/>
      <use href="#vector-daisy" data-vector-sprite data-x="1430" data-y="755" data-scale=".55" data-phase="6" data-speed=".25" data-drift="22" data-spin="9"/>
      <use href="#vector-blossom" data-vector-sprite data-x="760" data-y="125" data-scale=".66" data-phase="7" data-speed=".23" data-drift="28" data-spin="-11"/>
      <use href="#vector-blossom" data-vector-sprite data-x="890" data-y="745" data-scale=".54" data-phase="8" data-speed=".19" data-drift="24" data-spin="10"/>
      <use href="#vector-spark" data-vector-sprite data-x="1030" data-y="330" data-scale=".48" data-phase="9" data-speed=".29" data-drift="20" data-spin="15"/>
      <use href="#vector-spark" data-vector-sprite data-x="600" data-y="705" data-scale=".4" data-phase="10" data-speed=".31" data-drift="24" data-spin="-13"/>
      <use href="#vector-palm" data-vector-sprite data-x="1470" data-y="470" data-scale=".62" data-phase="11" data-speed=".18" data-drift="30" data-spin="1"/>
      <use href="#vector-dancer" data-vector-sprite data-x="760" data-y="480" data-scale=".55" data-phase="12" data-speed=".3" data-drift="38"/>
      <use href="#vector-cassette" data-vector-sprite data-x="420" data-y="160" data-scale=".46" data-phase="13" data-speed=".24" data-drift="28" data-spin="-3"/>
      <use href="#vector-eye" data-vector-sprite data-x="1120" data-y="750" data-scale=".42" data-phase="14" data-speed=".27" data-drift="29"/>
      <use href="#vector-blossom" data-vector-sprite data-x="340" data-y="745" data-scale=".5" data-phase="15" data-speed=".26" data-drift="25" data-spin="12"/>
    </g>
  `;

  const amendedTempleArtwork = `
    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".92" data-phase="0" filter="url(#vector-soft-glow)">
      <g fill="#d9ff35" stroke="#f7ffe8" stroke-width="3" stroke-linejoin="miter">
        <path d="M-18-330L18-330L12-55L220-7L12 24L8 330L-8 330L-12 24L-220-7L-12-55Z" opacity=".72"/>
        <path d="M-18-268L18-268L10-48L150-8L10 13L7 270L-7 270L-10 13L-150-8L-10-48Z" fill="#ecff9c" opacity=".34"/>
        <path d="M-12-144L-42-108M10-102L44-62M-11 76L-46 119M9 131L43 166" fill="none" stroke="#183436" stroke-width="7" opacity=".76"/>
      </g>
      <g fill="#a7ff31" stroke="#efffc8" stroke-width="2" opacity=".5">
        <path d="M-330 245L-318 245L-322 80L-232 69L-322 58Z"/><path d="M330 245L318 245L322 80L232 69L322 58Z"/>
      </g>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".78" data-phase="1" filter="url(#vector-soft-glow)">
      <g transform="skewX(-7) scale(1 .9)" fill="none" stroke="#ff83bc" stroke-linecap="square">
        <path d="M0-334V334M-212-215L212-215M-172-82L172-82M-238 80L238 80M-148 210L148 210" stroke-width="5" opacity=".8"/>
        <path d="M0-310L-212-215L-172-82L-238 80L-148 210L0 326L148 210L238 80L172-82L212-215Z" stroke-width="4"/>
        <path d="M-212-215L172-82L-238 80L148 210M212-215L-172-82L238 80L-148 210M-172-82L172-82M-238 80L238 80" stroke="#ffd2e8" stroke-width="2" opacity=".74"/>
        <g fill="#ff9eca" stroke="#fff0f7" stroke-width="4">
          <circle cy="-310" r="24"/><circle cx="-212" cy="-215" r="22"/><circle cx="212" cy="-215" r="22"/>
          <circle cx="-172" cy="-82" r="22"/><circle cx="172" cy="-82" r="22"/><circle cy="16" r="25"/>
          <circle cx="-238" cy="80" r="22"/><circle cx="238" cy="80" r="22"/><circle cy="210" r="24"/><circle cy="326" r="26"/>
        </g>
        <path d="M-290-315H290M-330-286H330M-360-254H360" stroke="#ffb8d8" stroke-width="2" stroke-dasharray="9 15" opacity=".42"/>
      </g>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".9" data-phase="2" filter="url(#vector-soft-glow)">
      <path d="M0-296C-126-240-116-92 0-16C116-92 126-240 0-296ZM0-16V288M-154 64H154" fill="none" stroke="#71ecff" stroke-width="12"/>
      <path d="M0-250C-75-212-72-126 0-72C72-126 75-212 0-250Z" fill="#69dff0" opacity=".16" stroke="#f4ffff" stroke-width="4"/>
      <path d="M-154 64L-108 18M154 64L108 18M0 112L-38 156M0 160L42 204" fill="none" stroke="#ff82bc" stroke-width="6" opacity=".7"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".84" data-phase="3" filter="url(#vector-soft-glow)">
      <g fill="none" stroke-linejoin="miter">
        <path d="M0-290L88-92L290 0L88 92L0 290L-88 92L-290 0L-88-92Z" stroke="#f6de72" stroke-width="7"/>
        <path d="M0-218L66-66L218 0L66 66L0 218L-66 66L-218 0L-66-66Z" stroke="#56e4ef" stroke-width="5"/>
        <path d="M-205-205L205 205M205-205L-205 205M0-290V290M-290 0H290" stroke="#fff7d0" stroke-width="3" opacity=".68"/>
        <rect x="-112" y="-112" width="224" height="224" stroke="#ff7fb7" stroke-width="5" transform="rotate(45)"/>
      </g>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".82" data-phase="4" filter="url(#vector-soft-glow)">
      <g fill="#b9f8ff" stroke="#effeff" stroke-width="3" opacity=".82">
        <rect x="-36" y="-286" width="72" height="38"/><rect x="-80" y="-248" width="160" height="38"/><rect x="-116" y="-210" width="232" height="38"/>
        <rect x="-150" y="-172" width="300" height="38"/><rect x="-116" y="-134" width="232" height="38"/><rect x="-162" y="-96" width="324" height="38"/>
        <rect x="-205" y="-58" width="410" height="38"/><rect x="-250" y="-20" width="500" height="38"/>
      </g>
      <path d="M-248 36H248M-214 84H214M-174 132H174M-126 180H126M-72 228H72" stroke="#ff84bd" stroke-width="18" opacity=".74"/>
      <rect x="-22" y="-248" width="44" height="44" fill="#dcff3d"/><rect x="-126" y="-134" width="40" height="40" fill="#ff6da8"/><rect x="86" y="-134" width="40" height="40" fill="#67eaf5"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".86" data-phase="5" filter="url(#vector-soft-glow)">
      <g fill="none">
        <circle r="286" stroke="#f4e8b8" stroke-width="4" opacity=".55"/><circle r="214" stroke="#66e7ef" stroke-width="4"/><circle r="132" stroke="#ff82ba" stroke-width="6"/>
        <path d="M0-286V286M-286 0H286M-202-202L202 202M202-202L-202 202M-109-264L109 264M109-264L-109 264M-264-109L264 109M264-109L-264 109" stroke="#fff9d7" stroke-width="4"/>
        <path d="M0-214L132-132L214 0L132 132L0 214L-132 132L-214 0L-132-132Z" stroke="#dfff41" stroke-width="8"/>
      </g>
      <circle r="34" fill="#fff2bb" stroke="#ff77b2" stroke-width="8"/>
    </g>`;

  const literalTempleArtwork = `
    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".82" data-phase="0" filter="url(#vector-soft-glow)">
      <path d="M-42-330H42V-72H214V24H42V330H-42V24H-214V-72H-42Z" fill="#dfff38" fill-opacity=".5" stroke="#f7ffe9" stroke-width="8"/>
      <path d="M-20-302H20V-44H184V-4H20V302H-20V-4H-184V-44H-20Z" fill="none" stroke="#dfff38" stroke-width="7"/>
      <path d="M-37-196L-5-164M34-142L3-108M-37 104L-4 137M35 181L3 212" stroke="#142f34" stroke-width="8" opacity=".82"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".86" data-phase="1" filter="url(#vector-soft-glow)" fill="none" stroke-linecap="square">
      <g stroke="#ff8dbc" stroke-width="6">
        <path d="M0-304L-146-204L-170-54L0 22L170-54L146-204Z"/>
        <path d="M-170-54L-190 92L-126 198L0 304L126 198L190 92L170-54"/>
        <path d="M0-304V304M-146-204L146-204M-170-54H170M-190 92H190M-126 198H126"/>
        <path d="M-146-204L170-54L-190 92L126 198M146-204L-170-54L190 92L-126 198" stroke="#ffe0ec" stroke-width="3" opacity=".82"/>
      </g>
      <g fill="#ff9dc8" stroke="#fff1f8" stroke-width="5">
        <circle cy="-304" r="25"/><circle cx="-146" cy="-204" r="24"/><circle cx="146" cy="-204" r="24"/>
        <circle cx="-170" cy="-54" r="24"/><circle cx="170" cy="-54" r="24"/><circle cy="22" r="27"/>
        <circle cx="-190" cy="92" r="24"/><circle cx="190" cy="92" r="24"/><circle cy="198" r="25"/><circle cy="304" r="27"/>
      </g>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".86" data-phase="2" filter="url(#vector-soft-glow)">
      <path d="M0-300C-118-300-146-174-78-91C-54-62-29-37 0-14C29-37 54-62 78-91C146-174 118-300 0-300Z" fill="#66e6f0" fill-opacity=".18" stroke="#eaffff" stroke-width="10"/>
      <path d="M0-14V302M-166 72H166" fill="none" stroke="#6eeaf3" stroke-width="18"/>
      <path d="M-166 72L-121 27M166 72L121 27M-9 116L-48 158M9 188L48 231" fill="none" stroke="#ff88b9" stroke-width="7" opacity=".72"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".82" data-phase="3" filter="url(#vector-soft-glow)">
      <path d="M86-286A302 302 0 1 0 86 286A238 238 0 1 1 86-286Z" fill="#7cebf3" fill-opacity=".42" stroke="#f3ffff" stroke-width="7"/>
      <path d="M154-92L176-32L240-30L190 9L208 70L154 35L100 70L118 9L68-30L132-32Z" fill="#fff0a2" stroke="#fffbe6" stroke-width="6"/>
      <path d="M0-318L86-172L252-172L166-25L252 122L86 122L0 268L-86 122L-252 122L-166-25L-252-172L-86-172Z" fill="none" stroke="#ff87b9" stroke-width="4" opacity=".62"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".8" data-phase="4" filter="url(#vector-soft-glow)">
      <g fill="#c7f8fb" stroke="#f4ffff" stroke-width="4">
        <rect x="-38" y="-302" width="76" height="56"/><rect x="-82" y="-244" width="164" height="46"/>
        <rect x="-126" y="-196" width="252" height="48"/><rect x="-166" y="-146" width="332" height="48"/>
        <rect x="-202" y="-96" width="404" height="48"/><rect x="-152" y="-46" width="304" height="48"/>
      </g>
      <path d="M-206 28H206M-248 84H248M-202 140H202M-146 196H146M-86 252H86" stroke="#ff8bbb" stroke-width="28" stroke-linecap="square"/>
      <path d="M-126 2L-212 84M126 2L212 84M-102 140L-178 214M102 140L178 214" stroke="#72e7f0" stroke-width="20"/>
      <rect x="-20" y="-244" width="40" height="40" fill="#deff3d" stroke="none"/><rect x="-124" y="-96" width="38" height="38" fill="#ff6fa8" stroke="none"/><rect x="86" y="-96" width="38" height="38" fill="#61e6ef" stroke="none"/>
    </g>

    <g data-vector-sprite data-temple-object data-x="800" data-y="450" data-scale=".84" data-phase="5" filter="url(#vector-soft-glow)" fill="none">
      <circle r="294" stroke="#fff5bf" stroke-width="7"/><circle r="212" stroke="#70e7ef" stroke-width="7"/><circle r="88" stroke="#ff88b8" stroke-width="9"/>
      <path d="M0-294V294M-294 0H294M-208-208L208 208M208-208L-208 208" stroke="#fff9dc" stroke-width="8"/>
      <path d="M0-212L150-150L212 0L150 150L0 212L-150 150L-212 0L-150-150Z" stroke="#dfff3e" stroke-width="12"/>
      <circle r="30" fill="#fff1af" stroke="#ff7db3" stroke-width="8"/>
    </g>`;

  const purpleWormArtwork = `
    <linearGradient id="vector-purple-worm-gradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7e84ff"/><stop offset=".52" stop-color="#b990ff"/><stop offset="1" stop-color="#f28ac8"/>
    </linearGradient>
    <g id="vector-purple-worm" stroke="#17131f" stroke-linejoin="round" stroke-linecap="round">
      <path d="M-340 28C-278-66-212 100-142 22C-76-52-9 88 60 15C122-50 188 62 246 8" fill="none" stroke="#17131f" stroke-width="122"/>
      <path d="M-340 28C-278-66-212 100-142 22C-76-52-9 88 60 15C122-50 188 62 246 8" fill="none" stroke="url(#vector-purple-worm-gradient)" stroke-width="94"/>
      <path d="M-292 7L-260-70L-214-15M-158 38L-120-58L-74 4M-22 32L20-53L61 5M103 20L139-48L181 0" fill="#72e7f2" stroke-width="10"/>
      <path d="M214-37C254-91 330-67 347-5C365 60 312 111 250 86C201 66 186 4 214-37Z" fill="#b995ff" stroke-width="11"/>
      <path d="M218-62L260-132L310-62Z" fill="#17131f" stroke-width="9"/>
      <ellipse cx="299" cy="-4" rx="31" ry="36" fill="#fff" stroke-width="9"/><circle cx="309" cy="1" r="12" fill="#17131f" stroke="none"/>
      <path d="M302 51Q334 38 344 7" fill="none" stroke-width="9"/><path d="M-340 28Q-386 63-404 17" fill="none" stroke="#d7ff44" stroke-width="21"/>
    </g>
    <g id="vector-rave-smiley" stroke="#17131f" stroke-width="12" stroke-linejoin="round">
      <circle r="124" fill="currentColor"/><circle cx="-42" cy="-28" r="14" fill="#17131f" stroke="none"/><circle cx="42" cy="-28" r="14" fill="#17131f" stroke="none"/>
      <path d="M-62 25Q0 91 64 24" fill="none" stroke="#17131f" stroke-width="16" stroke-linecap="round"/>
      <path d="M-86-84L-56-108M86-84L56-108" fill="none" stroke="#fff" stroke-width="9" opacity=".58"/>
    </g>`;

  function installAmendedArtwork() {
    const templeGroup = state.svg.querySelector('[data-vector-style="0"]');
    if (templeGroup) templeGroup.innerHTML = literalTempleArtwork;

    const definitions = state.svg.querySelector("defs");
    if (definitions && !definitions.querySelector("#vector-purple-worm")) definitions.insertAdjacentHTML("beforeend", purpleWormArtwork);

    const raveGroup = state.svg.querySelector('[data-vector-style="2"]');
    const secondDragon = raveGroup?.querySelector('use[href="#vector-dragon"][data-vector-extra]');
    if (secondDragon) {
      secondDragon.setAttribute("href", "#vector-purple-worm");
      secondDragon.removeAttribute("data-vector-extra");
      secondDragon.dataset.x = "470";
      secondDragon.dataset.y = "405";
      secondDragon.dataset.scale = ".72";
      secondDragon.dataset.speed = ".12";
      secondDragon.dataset.drift = "14";
    }

    raveGroup?.querySelectorAll("[data-vector-extra]").forEach((sprite) => sprite.remove());
    const placeAtEdge = (selector, x, y, scale, drift) => {
      const sprite = raveGroup?.querySelector(selector);
      if (!sprite) return;
      sprite.dataset.x = String(x);
      sprite.dataset.y = String(y);
      sprite.dataset.scale = String(scale);
      sprite.dataset.drift = String(drift);
    };
    placeAtEdge('use[href="#vector-dragon"]', 785, 285, .72, 14);
    placeAtEdge('use[href="#vector-daisy"]', 135, 690, .82, 10);
    placeAtEdge('use[href="#vector-mascot"]', 1400, 685, .9, 10);
    placeAtEdge('use[href="#vector-sun"]', 1370, 235, .78, 8);
    placeAtEdge('use[href="#vector-blossom"]', 1040, 600, .52, 8);
    placeAtEdge('use[href="#vector-eye"]', 790, 610, .44, 8);
    placeAtEdge('use[href="#vector-dancer"]', 160, 360, .4, 10);
    placeAtEdge('use[href="#vector-cassette"]', 1300, 415, .44, 8);
    const sparkPlacements = [
      [250, 145, .34, 7],
      [1365, 135, .46, 7],
      [1210, 255, .18, 5],
      [1460, 545, .22, 5],
    ];
    raveGroup?.querySelectorAll('use[href="#vector-spark"]').forEach((sprite, index) => {
      const [x, y, scale, drift] = sparkPlacements[index % sparkPlacements.length];
      sprite.dataset.x = String(x);
      sprite.dataset.y = String(y);
      sprite.dataset.scale = String(scale);
      sprite.dataset.drift = String(drift);
    });

    raveGroup?.querySelectorAll("[data-vector-sprite]").forEach((sprite) => {
      const source = String(sprite.getAttribute("href") || "").replace("#vector-", "");
      const roles = {
        dragon: "dragon", "purple-worm": "worm", daisy: "daisy", mascot: "monster",
        spark: "spark", eye: "eye", dancer: "dancer", cassette: "cassette", sun: "smiley",
      };
      sprite.dataset.raveRole = source === "blossom"
        ? (sprite.hasAttribute("data-vector-extra") ? "guest" : "small-daisy")
        : (roles[source] || "spark");
    });
  }

  function init() {
    if (state.svg) return state.svg;
    state.svg = document.querySelector("[data-emdr-vector-world]");
    if (!state.svg) return null;
    state.svg.innerHTML = artwork;
    installAmendedArtwork();
    state.groups = Array.from(state.svg.querySelectorAll("[data-vector-style]"));
    setStyle(state.style);
    return state.svg;
  }

  function setActive(value) {
    state.active = Boolean(value);
    init()?.classList.toggle("is-active", state.active && (state.style === 0 || state.style === 2));
    return state.active;
  }

  function setStyle(value) {
    state.style = Math.max(0, Math.min(6, Math.round(Number(value) || 0)));
    init();
    const vectorStyle = state.style === 0 || state.style === 2;
    state.groups.forEach((group) => {
      const groupStyle = Math.round(Number(group.dataset.vectorStyle));
      group.classList.toggle("is-active", vectorStyle && groupStyle === state.style);
    });
    const activeGroup = state.groups.find((group) => Math.round(Number(group.dataset.vectorStyle)) === state.style);
    state.sprites = Array.from(activeGroup?.querySelectorAll("[data-vector-sprite]") || []);
    state.svg?.classList.toggle("is-active", state.active && vectorStyle);
    return state.style;
  }

  function setIntensity(value) {
    state.intensity = Math.max(0, Math.min(1, Number(value) || 0));
    return state.intensity;
  }

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function eased(value) {
    const x = clamp(value);
    return x * x * (3 - 2 * x);
  }

  function renderTemple({ time, intensity, motion }) {
    const count = state.sprites.length;
    if (!count) return;
    const position = time * motion * (.075 + intensity * .285);
    const current = Math.floor(position) % count;
    const progress = position - Math.floor(position);
    const transition = eased((progress - .72) / .28);
    const next = (current + 1) % count;
      const rotationSpeed = .16 + intensity * .44;

    state.sprites.forEach((sprite, index) => {
      const weight = index === current ? 1 - transition : index === next ? transition : 0;
      if (weight <= .008) {
        sprite.style.display = "none";
        return;
      }
      sprite.style.display = "";
      sprite.style.opacity = String(weight);
      const baseScale = Number(sprite.dataset.scale || 1);
      const rotation = Math.sin(time * motion * rotationSpeed + index * .72) * (1.5 + intensity * 5.5);
      const pulse = 1 + Math.sin(time * motion * (1 + intensity * 2.8) + index) * (.012 + intensity * .035);
      const scale = baseScale * (.8 + weight * .2) * pulse;
      sprite.setAttribute("transform", `translate(800 450) rotate(${rotation.toFixed(2)}) scale(${scale.toFixed(4)})`);
    });
  }

  const raveScenes = [
    new Set(["dragon", "eye", "cassette", "spark"]),
    new Set(["daisy", "monster", "dancer", "smiley", "small-daisy"]),
    new Set(["worm", "eye", "cassette", "spark"]),
    new Set(["dragon", "worm", "daisy", "monster", "eye", "cassette", "smiley", "dancer", "small-daisy", "spark", "guest"]),
  ];

  function renderRave({ time, rhythm, intensity, motion }) {
    const localTime = Math.max(0, (Number(time) || 0) * (Number(motion) || 1));
    const storyPosition = localTime * (.09 + intensity * .145);
    const sceneIndex = ((Math.floor(storyPosition) % raveScenes.length) + raveScenes.length) % raveScenes.length;
    const storyProgress = storyPosition - Math.floor(storyPosition);
    const transition = eased((storyProgress - .74) / .26);
    const currentScene = raveScenes[sceneIndex];
    const nextScene = raveScenes[(sceneIndex + 1) % raveScenes.length];
    const kick = rhythm?.[1] || 0;
    const snare = rhythm?.[2] || 0;

    state.sprites.forEach((sprite, index) => {
      const role = sprite.dataset.raveRole || "spark";
      const currentWeight = currentScene.has(role) ? 1 : 0;
      const nextWeight = nextScene.has(role) ? 1 : 0;
      let weight = currentWeight * (1 - transition) + nextWeight * transition;
      if (role === "guest" && intensity < .72) weight = 0;
      if (weight <= .012) {
        sprite.style.display = "none";
        return;
      }

      sprite.style.display = "";
      sprite.style.opacity = String(weight);
      const baseX = Number(sprite.dataset.x || 0);
      const baseY = Number(sprite.dataset.y || 0);
      const baseScale = Number(sprite.dataset.scale || 1);
      const phase = Number(sprite.dataset.phase || index);
      const beat = localTime * (1.25 + intensity * 4.8) + phase;
      const energy = intensity * intensity;
      let x = baseX;
      let y = baseY;

      if (role === "dragon") {
        x += (storyProgress - .5) * (250 + intensity * 720);
        y += Math.sin(storyProgress * Math.PI * 2) * (24 + intensity * 92);
      } else if (role === "worm") {
        x += (.5 - storyProgress) * (220 + intensity * 650);
        y += Math.sin(storyProgress * Math.PI * 3 + .8) * (30 + intensity * 108);
      } else if (["dancer", "monster"].includes(role)) {
        y -= Math.abs(Math.sin(beat)) * (18 + intensity * 128);
        x += Math.sin(beat * .47) * (12 + intensity * 72);
      } else if (["daisy", "small-daisy", "smiley"].includes(role)) {
        x += Math.cos(beat * .52) * (18 + intensity * 86);
        y += Math.sin(beat * .7) * (16 + intensity * 74);
      } else if (role === "eye") {
        x += Math.sin(beat * .38) * (40 + intensity * 220);
        y += Math.cos(beat * .26) * (10 + intensity * 48);
      } else if (role === "cassette") {
        x += Math.sin(beat * .61) * (12 + intensity * 76);
        y += Math.cos(beat * .92) * (22 + intensity * 94);
      } else {
        x += Math.sin(beat * .83) * (22 + intensity * 112);
        y += Math.cos(beat * .68) * (18 + intensity * 96);
      }

      const spin = Number(sprite.dataset.spin || 0);
      let rotation = spin * localTime * (.55 + intensity * 2.9) + Math.sin(beat * .55) * (5 + intensity * 38 + snare * 7);
      if (["dancer", "monster", "smiley"].includes(role)) rotation += Math.sin(beat) * (8 + intensity * 32);
      const squash = Math.sin(beat) * intensity * (["dragon", "worm"].includes(role) ? .1 : .16);
      const pulse = 1 + kick * intensity * .16 + Math.sin(beat * .72) * (.018 + energy * .065);
      const scaleX = baseScale * pulse * (1 + squash) * (.82 + weight * .18);
      const scaleY = baseScale * pulse * (1 - squash * .65) * (.82 + weight * .18);
      const skew = Math.sin(beat * .44) * intensity * (["dragon", "worm", "dancer"].includes(role) ? 12 : 5);
      sprite.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)}) skewX(${skew.toFixed(2)}) scale(${scaleX.toFixed(4)} ${scaleY.toFixed(4)})`);
    });
  }

  function renderRaveGentle({ time, rhythm, intensity, motion }) {
    const localTime = Math.max(0, (Number(time) || 0) * (Number(motion) || 1));
    const kick = rhythm?.[1] || 0;
    const background = state.sprites.filter((sprite) => !sprite.hasAttribute("data-rave-centerpiece"));
    const centre = state.sprites.filter((sprite) => sprite.hasAttribute("data-rave-centerpiece"));

    background.forEach((sprite, index) => {
      sprite.style.display = "";
      sprite.style.opacity = "1";
      const x = Number(sprite.dataset.x || 0);
      const y = Number(sprite.dataset.y || 0);
      const baseScale = Number(sprite.dataset.scale || 1);
      const phase = Number(sprite.dataset.phase || index);
      const speed = Number(sprite.dataset.speed || .1) * (.64 + intensity * .34);
      const drift = Number(sprite.dataset.drift || 12) * (.3 + intensity * .28);
      const px = x + Math.sin(localTime * speed + phase) * drift;
      const verticalDrift = y >= 620 ? .25 : .42;
      const py = y + Math.cos(localTime * speed * .76 + phase * 1.31) * drift * verticalDrift;
      const pulse = 1 + kick * intensity * .02 + Math.sin(localTime * speed * 1.4 + phase) * .006;
      const rotation = Number(sprite.dataset.spin || 0) * localTime * (.3 + intensity * .2) + Math.sin(localTime * speed + phase) * (.8 + intensity * 1.6);
      sprite.setAttribute("transform", `translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(${(baseScale * pulse).toFixed(4)})`);
    });

    if (!centre.length) return;
    const position = localTime;
    const current = Math.floor(position) % centre.length;
    const progress = position - Math.floor(position);
    const transition = eased((progress - .38) / .62);
    const next = (current + 1) % centre.length;
    centre.forEach((sprite, index) => {
      const weight = index === current ? 1 - transition : index === next ? transition : 0;
      if (weight <= .008) {
        sprite.style.display = "none";
        return;
      }
      sprite.style.display = "";
      sprite.style.opacity = String(weight);
      const pulse = 1 + Math.sin(localTime * Math.PI * 2) * (.1 + intensity * .06);
      const rotation = Math.sin(localTime * Math.PI * 2 + index * .35) * (3 + intensity * 6);
      const scale = .92 * (.82 + weight * .18) * pulse;
      sprite.setAttribute("transform", `translate(800 450) rotate(${rotation.toFixed(2)}) scale(${scale.toFixed(4)})`);
    });
  }

  function render({ time, rhythm, intensity, motion }) {
    if (!state.active || (state.style !== 0 && state.style !== 2) || !init()) return;
    state.intensity = clamp(intensity);
    if (state.style === 0) renderTemple({ time, intensity: state.intensity, motion });
    else renderRaveGentle({ time, rhythm, intensity: state.intensity, motion });
  }

  init();
  window.IAMVectorWorlds = { setActive, setStyle, setIntensity, render };
})();
