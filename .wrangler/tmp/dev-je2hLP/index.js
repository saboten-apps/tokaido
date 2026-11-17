var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/roomDO.ts
import { DurableObject } from "cloudflare:workers";

// src/data/balance.json
var balance_default = {
  game: {
    playerCount: 4,
    maxDays: 40,
    diceFaces: 6,
    eventChance: 0.85,
    shukuEventChance: 0.5
  },
  limits: {
    money: {
      min: 0,
      max: 99999
    },
    stamina: {
      min: 0,
      max: 100
    },
    memories: {
      min: 0,
      max: 999
    },
    reputation: {
      min: 0,
      max: 100
    }
  },
  start: {
    money: 3e3,
    stamina: 80,
    memories: 0,
    reputation: 30
  },
  travel: {
    staminaPerStep: 2,
    tiredStamina: 20,
    tiredMaxFace: 3,
    innCost: 120,
    campStamina: -8,
    campReputation: 0,
    teahouseCost: 40,
    teahouseStamina: 12,
    teahouseMemories: 1,
    scenicMemories: 4,
    workMoney: 300,
    workStamina: -8,
    workReputation: 1,
    cpuWorkBelowMoney: 300,
    hurryBonus: 2,
    hurryStamina: 10,
    hurryMinStamina: 35
  },
  scoring: {
    moneyPerPoint: 50,
    memoriesWeight: 1,
    reputationWeight: 0.5,
    meibutsuPoints: 8,
    arrivedBonus: 20,
    arrivalRankBonus: [
      58,
      36,
      20,
      10,
      5,
      0
    ]
  },
  cpuPersonalities: [
    {
      id: "steady",
      name: "\u5805\u5B9F\u306A\u65C5",
      weights: {
        money: 1.3,
        stamina: 0.6,
        memories: 1.35,
        reputation: 1.1
      },
      meibutsuLove: 4,
      detourLove: 0.3,
      hurryLove: 0.15
    },
    {
      id: "gourmet",
      name: "\u98DF\u3044\u9053\u697D",
      weights: {
        money: 0.8,
        stamina: 0.5,
        memories: 1.15,
        reputation: 0.6
      },
      meibutsuLove: 14,
      detourLove: 0.6,
      hurryLove: 0.1
    },
    {
      id: "hasty",
      name: "\u6025\u304E\u65C5",
      weights: {
        money: 1.4,
        stamina: 0.8,
        memories: 0.6,
        reputation: 0.8
      },
      meibutsuLove: 2,
      detourLove: 0.1,
      hurryLove: 0.8
    },
    {
      id: "social",
      name: "\u4EBA\u60C5\u5BB6",
      weights: {
        money: 1,
        stamina: 0.5,
        memories: 1.1,
        reputation: 1.8
      },
      meibutsuLove: 6,
      detourLove: 0.5,
      hurryLove: 0.2
    }
  ],
  reputation: {
    goodAt: 45,
    goodInnRate: 0.75,
    badBelow: 20,
    badInnRate: 1.25
  },
  lodging: {
    kichin: {
      name: "\u6728\u8CC3\u5BBF",
      costRate: 0.5,
      stamina: 12
    },
    hatago: {
      name: "\u65C5\u7C60",
      costRate: 1,
      stamina: 22
    },
    honjin: {
      name: "\u672C\u9663",
      reputationAt: 60,
      stamina: 30,
      memories: 2
    }
  },
  roles: {
    ippan: {
      name: "\u3075\u3064\u3046\u306E\u65C5\u4EBA",
      desc: "\u7279\u5225\u306A\u6301\u3061\u5473\u306F\u306A\u3044\u3001\u3054\u304F\u3075\u3064\u3046\u306E\u65C5\u4EBA\u3002",
      personality: "steady",
      start: {
        money: 300
      },
      workMoneyBonus: 0,
      workMemories: 0,
      scenicBonus: 0,
      hurryStamina: null,
      innRate: 1
    },
    shonin: {
      name: "\u5546\u4EBA",
      desc: "\u5546\u3044\u3067\u65C5\u3092\u3059\u308B\u3002\u8DEF\u9280\u306F\u591A\u3081\u3060\u304C\u3001\u8377\u304C\u91CD\u304F\u4F53\u529B\u306F\u5C11\u306A\u3081\u3002\u300C\u50CD\u304F\u300D\u3068\u3001\u591A\u304F\u7A3C\u3052\u308B\u3002",
      personality: "steady",
      start: {
        money: 200,
        stamina: -10
      },
      workMoneyBonus: 60,
      workMemories: 0,
      scenicBonus: 0,
      hurryStamina: null,
      innRate: 1
    },
    ise: {
      name: "\u4F0A\u52E2\u53C2\u308A\u306E\u65C5\u4EBA",
      desc: "\u4FE1\u5FC3\u306E\u65C5\u3002\u4EBA\u67C4\u304C\u3088\u304F\u77E5\u3089\u308C\u3001\u8A55\u5224\u304C\u9AD8\u3081\u3002\u540D\u6240\u3084\u8336\u5C4B\u3067\u3001\u601D\u3044\u51FA\u304C\u5897\u3048\u3084\u3059\u3044\u3002",
      personality: "social",
      start: {
        reputation: 4
      },
      workMoneyBonus: 0,
      workMemories: 0,
      scenicBonus: 0,
      hurryStamina: null,
      innRate: 1
    },
    hikyaku: {
      name: "\u98DB\u811A",
      desc: "\u8DB3\u304C\u81EA\u6162\u3002\u4F53\u529B\u304C\u591A\u304F\u3001\u65E9\u8DB3\u306E\u4F53\u529B\u306E\u6D88\u8CBB\u304C\u5C0F\u3055\u3044\u3002\u305D\u306E\u304B\u308F\u308A\u3001\u8DEF\u9280\u306F\u5C11\u306A\u3081\u3002",
      personality: "hasty",
      start: {
        stamina: 20,
        money: 260
      },
      workMoneyBonus: 0,
      workMemories: 0,
      scenicBonus: 0,
      hurryStamina: 4,
      innRate: 1
    },
    geinin: {
      name: "\u65C5\u82B8\u4EBA",
      desc: "\u82B8\u3092\u898B\u305B\u3066\u65C5\u3092\u3059\u308B\u3002\u300C\u50CD\u304F\u300D\u3068\u3001\u8DEF\u9280\u306B\u52A0\u3048\u3066\u601D\u3044\u51FA\u3082\u5897\u3048\u308B\u3002\u8DEF\u9280\u306F\u5C11\u306A\u3081\u3002",
      personality: "gourmet",
      start: {
        money: -500,
        reputation: 5
      },
      workMoneyBonus: 0,
      workMemories: 2,
      scenicBonus: 0,
      hurryStamina: null,
      innRate: 1
    },
    bushi: {
      name: "\u6B66\u58EB",
      desc: "\u304A\u5F79\u76EE\u306E\u65C5\u3002\u8DEF\u9280\u306F\u591A\u304F\u3001\u95A2\u6240\u306F\u624B\u5F62\u3092\u793A\u3057\u3066\u901A\u308C\u308B\u3002\u305D\u306E\u304B\u308F\u308A\u3001\u5BBF\u4EE3\u306F\u9AD8\u3081\u3002",
      personality: "steady",
      start: {
        money: 950
      },
      workMoneyBonus: 0,
      workMemories: 0,
      scenicBonus: 0,
      hurryStamina: null,
      innRate: 1.25
    }
  }
};

// src/data/board.json
var board_default = {
  main: [
    {
      type: "start",
      name: "\u65E5\u672C\u6A4B"
    },
    {
      type: "event",
      name: "\u9AD8\u8F2A\u306E\u5927\u6728\u6238"
    },
    {
      type: "shuku",
      name: "\u54C1\u5DDD",
      meibutsu: {
        id: "shinagawa_nori",
        name: "\u54C1\u5DDD\u6D77\u82D4",
        price: 120,
        memories: 3
      },
      eventId: "shinagawa_miokuri"
    },
    {
      type: "scenic",
      name: "\u516D\u90F7\u306E\u6E21\u3057"
    },
    {
      type: "shuku",
      name: "\u5DDD\u5D0E",
      meibutsu: {
        id: "kawasaki_kuzumochi",
        name: "\u4E45\u5BFF\u9905",
        price: 90,
        memories: 3
      },
      eventId: "kawasaki_daishi"
    },
    {
      type: "shuku",
      name: "\u795E\u5948\u5DDD",
      eventId: "kanagawa_daimachi"
    },
    {
      type: "shuku",
      name: "\u4FDD\u571F\u30F6\u8C37",
      eventId: "hodogaya_gonta"
    },
    {
      type: "shuku",
      name: "\u6238\u585A",
      eventId: "totsuka_hatsunichi"
    },
    {
      type: "shuku",
      name: "\u85E4\u6CA2",
      eventId: "fujisawa_yugyoji"
    },
    {
      type: "shuku",
      name: "\u5E73\u585A",
      eventId: "hiratsuka_bannyu"
    },
    {
      type: "shuku",
      name: "\u5927\u78EF",
      eventId: "oiso_tora"
    },
    {
      type: "event",
      name: "\u5927\u78EF\u306E\u677E\u4E26\u6728"
    },
    {
      type: "shuku",
      name: "\u5C0F\u7530\u539F",
      meibutsu: {
        id: "odawara_kamaboko",
        name: "\u5C0F\u7530\u539F\u304B\u307E\u307C\u3053",
        price: 180,
        memories: 4
      },
      eventId: "odawara_uiro"
    },
    {
      type: "event",
      name: "\u7BB1\u6839\u306E\u5C71\u9053"
    },
    {
      type: "shuku",
      name: "\u7BB1\u6839",
      mustStop: true,
      eventId: "hakone_sekisho",
      meibutsu: {
        id: "hakone_yosegi",
        name: "\u5BC4\u6728\u7D30\u5DE5",
        price: 300,
        memories: 6
      }
    },
    {
      type: "scenic",
      name: "\u82A6\u30CE\u6E56\u3068\u5BCC\u58EB"
    },
    {
      type: "shuku",
      name: "\u4E09\u5CF6",
      meibutsu: {
        id: "mishima_unagi",
        name: "\u4E09\u5CF6\u306E\u3046\u306A\u304E",
        price: 240,
        memories: 5
      },
      eventId: "mishima_taisha"
    },
    {
      type: "shuku",
      name: "\u6CBC\u6D25",
      meibutsu: {
        id: "numazu_himono",
        name: "\u6CBC\u6D25\u306E\u5E72\u7269",
        price: 130,
        memories: 3
      },
      eventId: "numazu_senbon"
    },
    {
      type: "shuku",
      name: "\u539F",
      eventId: "hara_fuji"
    },
    {
      type: "shuku",
      name: "\u5409\u539F",
      eventId: "yoshiwara_hidarifuji"
    },
    {
      type: "shuku",
      name: "\u84B2\u539F",
      eventId: "kanbara_yuki"
    },
    {
      type: "shuku",
      name: "\u7531\u6BD4",
      meibutsu: {
        id: "yui_sakuraebi",
        name: "\u7531\u6BD4\u306E\u685C\u3048\u3073",
        price: 140,
        memories: 4
      },
      eventId: "yui_sakuraebi"
    },
    {
      type: "event",
      name: "\u85A9\u57F5\u5CE0"
    },
    {
      type: "shuku",
      name: "\u8208\u6D25",
      eventId: "okitsu_seikenji"
    },
    {
      type: "shuku",
      name: "\u6C5F\u5C3B",
      eventId: "ejiri_miho"
    },
    {
      type: "shuku",
      name: "\u5E9C\u4E2D",
      meibutsu: {
        id: "abekawa_mochi",
        name: "\u5B89\u500D\u5DDD\u3082\u3061",
        price: 80,
        memories: 3
      },
      eventId: "fuchu_sunpu"
    },
    {
      type: "teahouse",
      name: "\u4E38\u5B50\u306E\u8336\u5C4B"
    },
    {
      type: "shuku",
      name: "\u97A0\u5B50",
      meibutsu: {
        id: "maruko_tororo",
        name: "\u3068\u308D\u308D\u6C41",
        price: 100,
        memories: 4
      },
      eventId: "maruko_tororo"
    },
    {
      type: "shuku",
      name: "\u5CA1\u90E8",
      eventId: "okabe_utsunoya"
    },
    {
      type: "shuku",
      name: "\u85E4\u679D",
      eventId: "fujieda_someimeshi"
    },
    {
      type: "shuku",
      name: "\u5CF6\u7530",
      eventId: "shimada_kawakaisho"
    },
    {
      type: "fork",
      name: "\u5927\u4E95\u5DDD",
      mustStop: true
    },
    {
      type: "shuku",
      name: "\u91D1\u8C37",
      eventId: "kanaya_ishidatami"
    },
    {
      type: "event",
      name: "\u5C0F\u591C\u306E\u4E2D\u5C71"
    },
    {
      type: "shuku",
      name: "\u65E5\u5742",
      meibutsu: {
        id: "nissaka_warabi",
        name: "\u65E5\u5742\u306E\u308F\u3089\u3073\u9905",
        price: 70,
        memories: 3
      },
      eventId: "nissaka_yonaki"
    },
    {
      type: "shuku",
      name: "\u639B\u5DDD",
      meibutsu: {
        id: "kakegawa_kuzufu",
        name: "\u639B\u5DDD\u306E\u845B\u5E03",
        price: 160,
        memories: 4
      },
      eventId: "kakegawa_castle"
    },
    {
      type: "shuku",
      name: "\u888B\u4E95",
      eventId: "fukuroi_domanaka"
    },
    {
      type: "shuku",
      name: "\u898B\u9644",
      eventId: "mitsuke_tenryu"
    },
    {
      type: "shuku",
      name: "\u6D5C\u677E",
      meibutsu: {
        id: "hamana_unagi",
        name: "\u6D5C\u540D\u6E56\u306E\u3046\u306A\u304E",
        price: 260,
        memories: 5
      },
      eventId: "hamamatsu_shusse"
    },
    {
      type: "shuku",
      name: "\u821E\u5742",
      eventId: "maisaka_watashi"
    },
    {
      type: "event",
      name: "\u6D5C\u540D\u306E\u4ECA\u5207"
    },
    {
      type: "shuku",
      name: "\u65B0\u5C45",
      mustStop: true,
      eventId: "arai_sekisho"
    },
    {
      type: "shuku",
      name: "\u767D\u9808\u8CC0",
      eventId: "shirasuka_shiomizaka"
    },
    {
      type: "shuku",
      name: "\u4E8C\u5DDD",
      meibutsu: {
        id: "futagawa_kashiwamochi",
        name: "\u4E8C\u5DDD\u306E\u67CF\u9905",
        price: 70,
        memories: 3
      },
      eventId: "futagawa_honjin"
    },
    {
      type: "shuku",
      name: "\u5409\u7530",
      eventId: "yoshida_tezutsu"
    },
    {
      type: "shuku",
      name: "\u5FA1\u6CB9",
      eventId: "goyu_matsunamiki"
    },
    {
      type: "shuku",
      name: "\u8D64\u5742",
      eventId: "akasaka_hatago"
    },
    {
      type: "shuku",
      name: "\u85E4\u5DDD",
      eventId: "fujikawa_bohana"
    },
    {
      type: "shuku",
      name: "\u5CA1\u5D0E",
      meibutsu: {
        id: "okazaki_hatchomiso",
        name: "\u516B\u4E01\u5473\u564C",
        price: 150,
        memories: 4
      },
      eventId: "okazaki_yahagi"
    },
    {
      type: "scenic",
      name: "\u5CA1\u5D0E\u306E\u57CE\u4E0B"
    },
    {
      type: "shuku",
      name: "\u6C60\u9BC9\u9B92",
      eventId: "chiryu_umaichi"
    },
    {
      type: "shuku",
      name: "\u9CF4\u6D77",
      meibutsu: {
        id: "narumi_shibori",
        name: "\u9CF4\u6D77\u7D5E\u308A",
        price: 220,
        memories: 5
      },
      eventId: "narumi_arimatsu"
    },
    {
      type: "shuku",
      name: "\u5BAE",
      eventId: "miya_shichiri",
      meibutsu: {
        id: "atsuta_kishimen",
        name: "\u304D\u3057\u3081\u3093",
        price: 90,
        memories: 3
      }
    },
    {
      type: "event",
      name: "\u4E03\u91CC\u306E\u6E21\u3057"
    },
    {
      type: "shuku",
      name: "\u6851\u540D",
      meibutsu: {
        id: "kuwana_hamaguri",
        name: "\u713C\u304D\u86E4",
        price: 150,
        memories: 4
      },
      eventId: "kuwana_funatsuki"
    },
    {
      type: "shuku",
      name: "\u56DB\u65E5\u5E02",
      meibutsu: {
        id: "yokkaichi_nagamochi",
        name: "\u306A\u304C\u9905",
        price: 70,
        memories: 3
      },
      eventId: "yokkaichi_oiwake"
    },
    {
      type: "shuku",
      name: "\u77F3\u85AC\u5E2B",
      eventId: "ishiyakushi_tera"
    },
    {
      type: "shuku",
      name: "\u5E84\u91CE",
      eventId: "shono_haku"
    },
    {
      type: "shuku",
      name: "\u4E80\u5C71",
      eventId: "kameyama_joka"
    },
    {
      type: "teahouse",
      name: "\u95A2\u306E\u8336\u5C4B"
    },
    {
      type: "shuku",
      name: "\u95A2",
      meibutsu: {
        id: "seki_sekinoto",
        name: "\u95A2\u306E\u6238",
        price: 100,
        memories: 3
      },
      eventId: "seki_machinami"
    },
    {
      type: "shuku",
      name: "\u5742\u4E0B",
      eventId: "sakanoshita_fudesute"
    },
    {
      type: "event",
      name: "\u9234\u9E7F\u5CE0"
    },
    {
      type: "shuku",
      name: "\u571F\u5C71",
      meibutsu: {
        id: "tsuchiyama_cha",
        name: "\u571F\u5C71\u8336",
        price: 110,
        memories: 3
      },
      eventId: "tsuchiyama_ame"
    },
    {
      type: "shuku",
      name: "\u6C34\u53E3",
      meibutsu: {
        id: "minakuchi_kanpyo",
        name: "\u6C34\u53E3\u306E\u304B\u3093\u3074\u3087\u3046",
        price: 80,
        memories: 3
      },
      eventId: "minakuchi_kanpyo"
    },
    {
      type: "shuku",
      name: "\u77F3\u90E8",
      eventId: "ishibe_kyodachi"
    },
    {
      type: "scenic",
      name: "\u7435\u7436\u6E56\u306E\u307B\u3068\u308A"
    },
    {
      type: "shuku",
      name: "\u8349\u6D25",
      meibutsu: {
        id: "kusatsu_ubagamochi",
        name: "\u3046\u3070\u304C\u3082\u3061",
        price: 70,
        memories: 3
      },
      eventId: "kusatsu_gouryu"
    },
    {
      type: "shuku",
      name: "\u5927\u6D25",
      meibutsu: {
        id: "otsu_otsue",
        name: "\u5927\u6D25\u7D75",
        price: 200,
        memories: 5
      },
      eventId: "otsu_osaka"
    },
    {
      type: "goal",
      name: "\u4EAC\u90FD \u4E09\u6761\u5927\u6A4B"
    }
  ],
  forks: [
    {
      tileIndex: 31,
      mergeIndex: 32,
      laneTiles: [
        {
          type: "event",
          name: "\u5CF6\u7530\u306E\u5DDD\u6B62\u3081\u5BBF"
        },
        {
          type: "scenic",
          name: "\u5DDD\u660E\u3051\u3092\u5F85\u3064\u6CB3\u539F"
        },
        {
          type: "event",
          name: "\u5DDD\u8D8A\u3057\u306E\u671D"
        }
      ],
      main: {
        label: "\u5DDD\u8D8A\u3057\u4EBA\u8DB3\u3092\u96C7\u3046",
        desc: "\u8DEF\u9280\u3092\u6255\u3063\u3066\u3001\u3059\u3050\u306B\u6E21\u308B\uFF08\u65E9\u3044\uFF09",
        story: "\u80A9\u8ECA\u306E\u4EBA\u8DB3\u306B\u62C5\u304C\u308C\u3066\u3001\u5927\u4E95\u5DDD\u3092\u6E21\u3063\u305F\u3002",
        effects: {
          money: -300
        }
      },
      lane: {
        label: "\u5DDD\u660E\u3051\u3092\u5F85\u3064",
        desc: "\u5BBF\u3067\u6C34\u304C\u5F15\u304F\u306E\u3092\u5F85\u3064\uFF08\u9045\u3044\u304C\u3001\u51FA\u4F1A\u3044\u3068\u601D\u3044\u51FA\uFF09",
        story: "\u5DDD\u6B62\u3081\u306E\u5BBF\u3067\u3001\u307B\u304B\u306E\u65C5\u4EBA\u305F\u3061\u3068\u8A9E\u308A\u660E\u304B\u3057\u305F\u3002",
        effects: {
          memories: 4
        }
      }
    }
  ]
};

// src/data/titles.json
var titles_default = [
  {
    id: "ichibannori",
    name: "\u4E00\u756A\u4E57\u308A",
    desc: "\u4EAC\u90FD\u30FB\u4E09\u6761\u5927\u6A4B\u306B\u3001\u3044\u3061\u3070\u3093\u5148\u306B\u7740\u3044\u305F\u3002",
    when: {
      arrivalRank: 1
    }
  },
  {
    id: "sekisho_kao",
    name: "\u95A2\u6240\u306E\u9854",
    desc: "\u7BB1\u6839\u304B\u65B0\u5C45\u306E\u95A2\u6240\u3092\u3001\u8A55\u5224\u306E\u3088\u3055\u3067\u901A\u3063\u305F\u3002",
    when: {
      hasFlags: [
        "sekisho:kao"
      ]
    }
  },
  {
    id: "kawadome",
    name: "\u5DDD\u6B62\u3081\u306E\u5BA2",
    desc: "\u5927\u4E95\u5DDD\u3067\u5DDD\u660E\u3051\u3092\u5F85\u3061\u3001\u5BBF\u306E\u65C5\u4EBA\u3068\u8A9E\u308A\u660E\u304B\u3057\u305F\u3002",
    when: {
      hasFlags: [
        "took:lane"
      ]
    }
  },
  {
    id: "meibutsu_tsu",
    name: "\u540D\u7269\u901A",
    desc: "\u540D\u7269\u30927\u3064\u4EE5\u4E0A\u5473\u308F\u3063\u305F\u3002",
    when: {
      minMeibutsu: 7
    }
  },
  {
    id: "omoide_tabi",
    name: "\u601D\u3044\u51FA\u306E\u65C5\u4EBA",
    desc: "\u601D\u3044\u51FA\u309280\u4EE5\u4E0A\u96C6\u3081\u305F\u3002",
    when: {
      minMemories: 80
    }
  },
  {
    id: "omoide_bukuro",
    name: "\u601D\u3044\u51FA\u3076\u304F\u308D",
    desc: "\u601D\u3044\u51FA\u3092120\u4EE5\u4E0A\u96C6\u3081\u305F\u3002",
    when: {
      minMemories: 120
    }
  },
  {
    id: "jinbo",
    name: "\u4EBA\u671B\u306E\u65C5\u4EBA",
    desc: "\u9053\u4E2D\u3067\u3001\u8A55\u5224\u309250\u4EE5\u4E0A\u306B\u9AD8\u3081\u305F\u3002",
    when: {
      minReputation: 50
    }
  },
  {
    id: "kenyaku",
    name: "\u5039\u7D04\u306E\u65C5\u4EBA",
    desc: "\u8DEF\u9280\u30921000\u6587\u4EE5\u4E0A\u6B8B\u3057\u3066\u7740\u3044\u305F\u3002",
    when: {
      minMoney: 1e3
    }
  }
];

// src/events/road.json
var road_default = [
  {
    id: "oihagi",
    title: "\u8FFD\u3044\u5265\u304E\u304C\u51FA\u305F\uFF01",
    description: "\u4EBA\u901A\u308A\u306E\u5C11\u306A\u3044\u5C71\u9053\u3067\u3001\u602A\u3057\u3044\u7537\u304C\u9053\u3092\u3075\u3055\u3044\u3060\u3002",
    weight: 6,
    conditions: {
      minMoney: 200
    },
    choices: [
      {
        label: "\u8DEF\u9280\u3092\u5C11\u3057\u6E21\u3057\u3066\u901A\u3057\u3066\u3082\u3089\u3046",
        effects: {
          money: -200
        }
      },
      {
        label: "\u8D70\u3063\u3066\u9003\u3052\u308B",
        effects: {
          stamina: -5
        },
        gamble: {
          chance: 0.6,
          failEffects: {
            money: -400,
            stamina: -10
          }
        }
      },
      {
        label: "\u5927\u58F0\u3067\u52A9\u3051\u3092\u547C\u3076",
        effects: {
          reputation: 4
        },
        requires: {
          minReputation: 40
        }
      }
    ]
  },
  {
    id: "tabibito_deai",
    title: "\u65C5\u4EBA\u3068\u306E\u51FA\u4F1A\u3044",
    description: "\u540C\u3058\u65B9\u89D2\u3078\u5411\u304B\u3046\u65C5\u4EBA\u304C\u3001\u9053\u9023\u308C\u306B\u306A\u308D\u3046\u3068\u58F0\u3092\u304B\u3051\u3066\u304D\u305F\u3002",
    weight: 8,
    choices: [
      {
        label: "\u9053\u9023\u308C\u306B\u306A\u3063\u3066\u3001\u8A9E\u308A\u306A\u304C\u3089\u6B69\u304F",
        effects: {
          memories: 5,
          stamina: -2
        }
      },
      {
        label: "\u4F1A\u91C8\u3057\u3066\u3001\u81EA\u5206\u306E\u6B69\u307F\u3067\u884C\u304F",
        effects: {
          stamina: 2
        }
      },
      {
        label: "\u8A55\u5224\u3092\u805E\u304D\u3064\u3051\u305F\u65C5\u4EBA\u305F\u3061\u304C\u52A0\u308F\u308A\u3001\u306B\u304E\u3084\u304B\u306A\u9053\u9023\u308C\u306B\u306A\u308B",
        effects: {
          memories: 8,
          stamina: -2
        },
        requires: {
          minReputation: 45
        }
      }
    ]
  },
  {
    id: "wasuremono",
    title: "\u843D\u3068\u3057\u7269\u306E\u8CA1\u5E03",
    description: "\u9053\u3070\u305F\u306B\u3001\u305A\u3057\u308A\u3068\u91CD\u3044\u8CA1\u5E03\u304C\u843D\u3061\u3066\u3044\u305F\u3002",
    weight: 5,
    choices: [
      {
        label: "\u6B21\u306E\u5BBF\u5834\u306E\u5F79\u4EBA\u306B\u5C4A\u3051\u308B",
        effects: {
          reputation: 8,
          memories: 1
        }
      },
      {
        label: "\u6301\u3061\u4E3B\u3092\u63A2\u3057\u3066\u3001\u6765\u305F\u9053\u3092\u623B\u308B",
        effects: {
          reputation: 5,
          money: 150,
          stamina: -8
        }
      }
    ]
  },
  {
    id: "kago",
    title: "\u99D5\u7C60\u304B\u304D\u306E\u8A98\u3044",
    description: "\u300C\u65E6\u90A3\u3001\u4E57\u3063\u3066\u3044\u304D\u306A\u305B\u3048\u300D\u3002\u99D5\u7C60\u304B\u304D\u304C\u58F0\u3092\u304B\u3051\u3066\u304D\u305F\u3002",
    weight: 5,
    conditions: {
      minMoney: 150
    },
    choices: [
      {
        label: "\u4E57\u3063\u3066\u3001\u8DB3\u3092\u4F11\u3081\u308B",
        effects: {
          money: -150,
          stamina: 15
        }
      },
      {
        label: "\u81EA\u5206\u306E\u8DB3\u3067\u6B69\u304F",
        effects: {}
      }
    ]
  },
  {
    id: "ame",
    title: "\u306B\u308F\u304B\u96E8",
    description: "\u7A7A\u304C\u6025\u306B\u6697\u304F\u306A\u308A\u3001\u5927\u7C92\u306E\u96E8\u304C\u964D\u3063\u3066\u304D\u305F\u3002",
    weight: 6,
    choices: [
      {
        label: "\u7B20\u3092\u304B\u3076\u3063\u3066\u3001\u5148\u3092\u6025\u3050",
        effects: {
          stamina: -8
        }
      },
      {
        label: "\u8ED2\u5148\u3067\u96E8\u5BBF\u308A\u3057\u3066\u3001\u4E00\u65E5\u4F11\u3080",
        effects: {
          stamina: 6,
          memories: 1
        },
        restDays: 1
      }
    ]
  },
  {
    id: "haiku",
    title: "\u53E5\u4F1A\u306B\u62DB\u304B\u308C\u308B",
    description: "\u8336\u5C4B\u306E\u7E01\u53F0\u3067\u3001\u65C5\u306E\u4FF3\u4EBA\u305F\u3061\u304C\u53E5\u3092\u3072\u306D\u3063\u3066\u3044\u305F\u3002",
    weight: 4,
    choices: [
      {
        label: "\u4E00\u53E5\u8A60\u3093\u3067\u307F\u308B",
        effects: {
          memories: 3
        },
        gamble: {
          chance: 0.5,
          failEffects: {
            memories: 2,
            reputation: -1
          }
        }
      },
      {
        label: "\u805E\u304D\u5F79\u306B\u307E\u308F\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "mamemaki",
    title: "\u8DB3\u306B\u307E\u3081\u304C\u3067\u304D\u305F",
    description: "\u308F\u3089\u3058\u304C\u5408\u308F\u305A\u3001\u8DB3\u306E\u88CF\u304C\u75DB\u3080\u3002",
    weight: 5,
    choices: [
      {
        label: "\u65B0\u3057\u3044\u308F\u3089\u3058\u3092\u8CB7\u3046",
        effects: {
          money: -40,
          stamina: 3
        }
      },
      {
        label: "\u6211\u6162\u3057\u3066\u6B69\u304F",
        effects: {
          stamina: -10
        }
      }
    ]
  },
  {
    id: "komarimono",
    title: "\u56F0\u3063\u3066\u3044\u308B\u65C5\u4EBA",
    description: "\u8DEF\u9280\u3092\u843D\u3068\u3057\u305F\u65C5\u4EBA\u304C\u3001\u9014\u65B9\u306B\u66AE\u308C\u3066\u3044\u308B\u3002",
    weight: 5,
    conditions: {
      minMoney: 100
    },
    choices: [
      {
        label: "\u8DEF\u9280\u3092\u5206\u3051\u3066\u3042\u3052\u308B",
        effects: {
          money: -100,
          reputation: 7,
          memories: 2
        }
      },
      {
        label: "\u6B21\u306E\u5BBF\u5834\u306E\u5834\u6240\u3092\u6559\u3048\u308B",
        effects: {
          reputation: 1
        }
      }
    ]
  },
  {
    id: "matsuri",
    title: "\u5BBF\u5834\u306E\u796D\u308A",
    description: "\u592A\u9F13\u306E\u97F3\u304C\u805E\u3053\u3048\u308B\u3002\u4ECA\u65E5\u306F\u571F\u5730\u306E\u796D\u308A\u306E\u65E5\u3089\u3057\u3044\u3002",
    weight: 4,
    choices: [
      {
        label: "\u796D\u308A\u306B\u52A0\u308F\u3063\u3066\u8E0A\u308B",
        effects: {
          memories: 6,
          stamina: -6,
          money: -50
        }
      },
      {
        label: "\u5C11\u3057\u3060\u3051\u898B\u7269\u3059\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "netsu",
    title: "\u71B1\u3092\u51FA\u3057\u305F",
    description: "\u65C5\u306E\u75B2\u308C\u304B\u3001\u4F53\u304C\u91CD\u3044\u3002",
    weight: 3,
    conditions: {
      maxStamina: 35
    },
    choices: [
      {
        label: "\u5BBF\u3067\u4E00\u65E5\u5BDD\u8FBC\u3093\u3067\u6CBB\u3059",
        effects: {
          stamina: 25,
          money: -100
        },
        restDays: 1
      },
      {
        label: "\u85AC\u3092\u98F2\u3093\u3067\u6B69\u304D\u7D9A\u3051\u308B",
        effects: {
          money: -60,
          stamina: 8
        }
      }
    ]
  },
  {
    id: "hikyaku",
    title: "\u98DB\u811A\u306B\u9053\u3092\u3086\u305A\u308B",
    description: "\u300C\u307B\u3044\u3055\u3001\u307B\u3044\u3055\u300D\u3002\u98DB\u811A\u304C\u571F\u7159\u3092\u4E0A\u3052\u3066\u99C6\u3051\u3066\u304F\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u9053\u3070\u305F\u306B\u5BC4\u3063\u3066\u3001\u8D70\u308A\u53BB\u308B\u306E\u3092\u898B\u9001\u308B",
        effects: {
          memories: 2
        }
      },
      {
        label: "\u3042\u3068\u3092\u8FFD\u3063\u3066\u3001\u3057\u3070\u3089\u304F\u4E00\u7DD2\u306B\u8D70\u308B",
        effects: {
          stamina: -8,
          memories: 4
        }
      }
    ]
  },
  {
    id: "jizo",
    title: "\u9053\u3070\u305F\u306E\u5730\u8535",
    description: "\u82D4\u3080\u3057\u305F\u5730\u8535\u304C\u3001\u65C5\u306E\u5B89\u5168\u3092\u898B\u5B88\u3063\u3066\u3044\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u8CFD\u92AD\u3092\u4F9B\u3048\u3066\u3001\u624B\u3092\u5408\u308F\u305B\u308B",
        effects: {
          money: -20,
          stamina: 5,
          reputation: 1
        }
      },
      {
        label: "\u4F1A\u91C8\u3060\u3051\u3057\u3066\u901A\u308B",
        effects: {}
      }
    ]
  },
  {
    id: "ukiyoe",
    title: "\u7D75\u5E2B\u3068\u306E\u51FA\u4F1A\u3044",
    description: "\u8857\u9053\u306E\u666F\u8272\u3092\u5199\u3059\u7D75\u5E2B\u304C\u3001\u7B46\u3092\u6B62\u3081\u3066\u8A71\u3057\u304B\u3051\u3066\u304D\u305F\u3002",
    weight: 3,
    choices: [
      {
        label: "\u7D75\u3092\u4E00\u679A\u3001\u8CB7\u3044\u6C42\u3081\u308B",
        effects: {
          money: -150,
          memories: 6
        }
      },
      {
        label: "\u7D75\u3092\u63CF\u304F\u3068\u3053\u308D\u3092\u3001\u3057\u3070\u3089\u304F\u773A\u3081\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "hatagoya",
    title: "\u65C5\u7C60\u306E\u5BA2\u5F15\u304D",
    description: "\u300C\u65E6\u90A3\u3001\u3046\u3061\u306F\u6E6F\u304C\u305F\u3063\u3077\u308A\u51FA\u307E\u3059\u3088\uFF01\u300D\u3002\u5BA2\u5F15\u304D\u304C\u8896\u3092\u5F15\u304F\u3002",
    weight: 4,
    conditions: {
      minMoney: 120
    },
    choices: [
      {
        label: "\u8A98\u3044\u306B\u4E57\u3063\u3066\u3001\u65E9\u3081\u306B\u5BBF\u3092\u53D6\u308B",
        effects: {
          money: -120,
          stamina: 12
        }
      },
      {
        label: "\u65AD\u3063\u3066\u3001\u5148\u3078\u9032\u3080",
        effects: {}
      }
    ]
  },
  {
    id: "fujisan",
    title: "\u96F2\u9593\u306E\u5BCC\u58EB",
    description: "\u96F2\u304C\u5207\u308C\u3066\u3001\u771F\u3063\u767D\u306A\u5BCC\u58EB\u306E\u5C71\u304C\u59FF\u3092\u898B\u305B\u305F\u3002",
    weight: 3,
    choices: [
      {
        label: "\u7ACB\u3061\u6B62\u307E\u3063\u3066\u3001\u3057\u3070\u3089\u304F\u898B\u5165\u308B",
        effects: {
          memories: 5,
          stamina: 2
        }
      },
      {
        label: "\u6B69\u304D\u306A\u304C\u3089\u3001\u3061\u3089\u308A\u3068\u773A\u3081\u308B",
        effects: {
          memories: 1
        }
      }
    ]
  },
  {
    id: "michi_mayoi",
    title: "\u9053\u306B\u8FF7\u3063\u305F",
    description: "\u5206\u304B\u308C\u9053\u3067\u3001\u3069\u3061\u3089\u3078\u884C\u3051\u3070\u3088\u3044\u306E\u304B\u5206\u304B\u3089\u306A\u304F\u306A\u3063\u305F\u3002",
    weight: 4,
    choices: [
      {
        label: "\u901A\u308A\u304C\u304B\u308A\u306E\u4EBA\u306B\u9053\u3092\u5C0B\u306D\u308B",
        effects: {
          stamina: -2,
          reputation: 1
        }
      },
      {
        label: "\u52D8\u3092\u983C\u308A\u306B\u9032\u3080",
        effects: {
          stamina: -4
        },
        gamble: {
          chance: 0.5,
          failEffects: {
            stamina: -14
          }
        }
      }
    ]
  },
  {
    id: "tabigeinin",
    title: "\u65C5\u82B8\u4EBA\u306E\u4E00\u5EA7",
    description: "\u8857\u9053\u306E\u5E83\u5834\u3067\u3001\u65C5\u82B8\u4EBA\u306E\u4E00\u5EA7\u304C\u82B8\u3092\u898B\u305B\u3066\u3044\u308B\u3002\u592A\u9F13\u3068\u7B1B\u306E\u97F3\u306B\u3001\u4EBA\u3060\u304B\u308A\u304C\u3067\u304D\u3066\u3044\u305F\u3002",
    weight: 5,
    choices: [
      {
        label: "\u4EBA\u57A3\u306B\u52A0\u308F\u3063\u3066\u3001\u6700\u5F8C\u307E\u3067\u898B\u7269\u3059\u308B",
        effects: {
          memories: 4,
          stamina: -3,
          money: -30
        }
      },
      {
        label: "\u9060\u304F\u304B\u3089\u3001\u97F3\u3060\u3051\u697D\u3057\u3093\u3067\u901A\u308A\u904E\u304E\u308B",
        effects: {
          memories: 1
        }
      }
    ]
  },
  {
    id: "michishirube",
    title: "\u9053\u6A19\u306E\u524D\u3067",
    description: "\u5206\u304B\u308C\u9053\u306B\u3001\u53E4\u3044\u9053\u6A19\u304C\u7ACB\u3063\u3066\u3044\u308B\u3002\u6587\u5B57\u304C\u8584\u308C\u3066\u3001\u3059\u3050\u306B\u306F\u8AAD\u3081\u306A\u3044\u3002",
    weight: 4,
    choices: [
      {
        label: "\u3058\u3063\u304F\u308A\u8AAD\u3093\u3067\u3001\u884C\u304F\u5148\u3092\u78BA\u304B\u3081\u308B",
        effects: {
          stamina: -1,
          reputation: 1
        }
      },
      {
        label: "\u901A\u308A\u304B\u304B\u3063\u305F\u4EBA\u306B\u9053\u3092\u5C0B\u306D\u308B",
        effects: {
          memories: 2,
          stamina: -2
        }
      }
    ]
  },
  {
    id: "chaya_mukashi",
    title: "\u8336\u5C4B\u306E\u4E3B\u4EBA\u306E\u6614\u8A71",
    description: "\u8336\u5C4B\u306E\u4E3B\u4EBA\u304C\u3001\u56E3\u5B50\u3092\u51FA\u3057\u306A\u304C\u3089\u3001\u82E5\u3044\u3053\u308D\u306B\u898B\u305F\u8857\u9053\u306E\u8A71\u3092\u805E\u304B\u305B\u3066\u304F\u308C\u308B\u3002",
    weight: 5,
    choices: [
      {
        label: "\u56E3\u5B50\u3092\u98DF\u3079\u306A\u304C\u3089\u3001\u8A71\u306B\u805E\u304D\u5165\u308B",
        effects: {
          money: -30,
          memories: 4,
          stamina: 4
        }
      },
      {
        label: "\u793C\u3092\u8A00\u3063\u3066\u3001\u5148\u3092\u6025\u3050",
        effects: {
          stamina: 2
        }
      }
    ]
  },
  {
    id: "zoumizu",
    title: "\u5897\u6C34\u3057\u305F\u5C0F\u5DDD",
    description: "\u524D\u306E\u6669\u306E\u96E8\u3067\u3001\u5C0F\u5DDD\u304C\u601D\u3044\u306E\u307B\u304B\u5897\u6C34\u3057\u3066\u3044\u308B\u3002\u6A4B\u306F\u6D41\u3055\u308C\u305F\u3089\u3057\u3044\u3002",
    weight: 4,
    choices: [
      {
        label: "\u4E0A\u6D41\u306E\u6D45\u3044\u6240\u307E\u3067\u56DE\u3063\u3066\u6E21\u308B",
        effects: {
          stamina: -8
        }
      },
      {
        label: "\u6C34\u304C\u5F15\u304F\u307E\u3067\u3001\u5CB8\u3067\u5F85\u3064",
        effects: {
          stamina: 6,
          memories: 1
        },
        restDays: 1
      }
    ]
  },
  {
    id: "waraji_shuri",
    title: "\u308F\u3089\u3058\u306E\u624B\u5165\u308C",
    description: "\u308F\u3089\u3058\u306E\u7D10\u304C\u5207\u308C\u304B\u3051\u3066\u3044\u308B\u3002\u3053\u306E\u307E\u307E\u6B69\u304F\u3068\u3001\u8DB3\u3092\u75DB\u3081\u305D\u3046\u3060\u3002",
    weight: 5,
    choices: [
      {
        label: "\u9053\u3070\u305F\u3067\u3001\u81EA\u5206\u3067\u7D50\u3073\u76F4\u3059",
        effects: {
          stamina: -2
        }
      },
      {
        label: "\u5E97\u3067\u3001\u65B0\u3057\u3044\u308F\u3089\u3058\u3092\u8CB7\u3044\u6C42\u3081\u308B",
        effects: {
          money: -40,
          stamina: 4
        }
      }
    ]
  },
  {
    id: "oikaze",
    title: "\u8FFD\u3044\u98A8\u306E\u671D",
    description: "\u3088\u304F\u6674\u308C\u305F\u671D\u3001\u5F8C\u308D\u304B\u3089\u98A8\u304C\u5439\u3044\u3066\u3001\u8DB3\u53D6\u308A\u304C\u8EFD\u3044\u3002",
    weight: 3,
    choices: [
      {
        label: "\u3053\u306E\u8ABF\u5B50\u3067\u3001\u5148\u3092\u6025\u3050",
        effects: {
          stamina: 4,
          memories: 1
        }
      },
      {
        label: "\u3086\u3063\u304F\u308A\u666F\u8272\u3092\u697D\u3057\u307F\u306A\u304C\u3089\u6B69\u304F",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "tomikuji",
    title: "\u5BFA\u306E\u5BCC\u304F\u3058",
    description: "\u8FD1\u304F\u306E\u5BFA\u3067\u3001\u5BCC\u304F\u3058\u304C\u58F2\u3089\u308C\u3066\u3044\u308B\u3002\u300C\u5F53\u305F\u308C\u3070\u5927\u91D1\u300D\u3068\u3001\u4EBA\u3005\u304C\u5217\u3092\u4F5C\u3063\u3066\u3044\u308B\u3002",
    weight: 3,
    choices: [
      {
        label: "\u4E00\u679A\u8CB7\u3063\u3066\u3001\u904B\u3092\u8A66\u3059",
        effects: {
          money: -60
        },
        gamble: {
          chance: 0.2,
          failEffects: {
            money: -60,
            memories: 1
          }
        }
      },
      {
        label: "\u898B\u7269\u3060\u3051\u3057\u3066\u3001\u7ACB\u3061\u53BB\u308B",
        effects: {
          memories: 1
        }
      }
    ],
    conditions: {
      minMoney: 200
    }
  },
  {
    id: "aibeya",
    title: "\u5BBF\u306E\u76F8\u90E8\u5C4B",
    description: "\u5BBF\u306F\u6E80\u5BA4\u3067\u3001\u76F8\u90E8\u5C4B\u306B\u306A\u3063\u305F\u3002\u540C\u3058\u90E8\u5C4B\u306B\u306F\u3001\u8377\u3092\u80CC\u8CA0\u3063\u305F\u5546\u4EBA\u304C\u3044\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u5546\u4EBA\u3068\u8A9E\u308A\u660E\u304B\u3057\u3066\u3001\u4EF2\u826F\u304F\u306A\u308B",
        effects: {
          memories: 4,
          stamina: -4,
          reputation: 2
        }
      },
      {
        label: "\u8377\u7269\u3092\u6795\u3082\u3068\u306B\u7F6E\u3044\u3066\u3001\u65E9\u304F\u7720\u308B",
        effects: {
          stamina: 8
        }
      }
    ]
  },
  {
    id: "nobana",
    title: "\u9053\u3070\u305F\u306E\u91CE\u82B1",
    description: "\u8DB3\u3082\u3068\u306B\u3001\u898B\u6163\u308C\u306A\u3044\u91CE\u306E\u82B1\u304C\u54B2\u3044\u3066\u3044\u308B\u3002",
    weight: 3,
    choices: [
      {
        label: "\u3057\u3083\u304C\u3093\u3067\u3001\u3058\u3063\u304F\u308A\u773A\u3081\u308B",
        effects: {
          memories: 2,
          stamina: 2
        }
      },
      {
        label: "\u6458\u3093\u3067\u3001\u65C5\u306E\u8A18\u5FF5\u306B\u3059\u308B",
        effects: {
          memories: 1,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "sendo_banashi",
    title: "\u8239\u982D\u306E\u8A71",
    description: "\u6E21\u3057\u821F\u306E\u8239\u982D\u304C\u3001\u5DDD\u306E\u6D41\u308C\u3084\u5929\u6C17\u306B\u3064\u3044\u3066\u3001\u307D\u3064\u307D\u3064\u8A71\u3057\u3066\u304F\u308C\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u8A71\u3092\u805E\u3044\u3066\u3001\u660E\u65E5\u306E\u5929\u6C17\u306E\u898B\u5F53\u3092\u3064\u3051\u308B",
        effects: {
          memories: 2,
          stamina: 2
        }
      },
      {
        label: "\u821F\u3079\u308A\u3067\u3001\u5C45\u7720\u308A\u3092\u3059\u308B",
        effects: {
          stamina: 6
        }
      }
    ]
  },
  {
    id: "kane_no_oto",
    title: "\u5915\u66AE\u308C\u306E\u9418",
    description: "\u5BBF\u3078\u5411\u304B\u3046\u9053\u3067\u3001\u9060\u304F\u306E\u5BFA\u306E\u9418\u304C\u9CF4\u3063\u305F\u3002\u65E5\u304C\u50BE\u304D\u3001\u9053\u304C\u831C\u8272\u306B\u67D3\u307E\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u8DB3\u3092\u6B62\u3081\u3066\u3001\u9418\u306E\u97F3\u306B\u8033\u3092\u3059\u307E\u3059",
        effects: {
          memories: 3
        }
      },
      {
        label: "\u9418\u3092\u5408\u56F3\u306B\u3001\u5BBF\u3078\u6025\u3050",
        effects: {
          stamina: -3,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "dango_yatai",
    title: "\u9053\u3070\u305F\u306E\u5C4B\u53F0",
    description: "\u8857\u9053\u6CBF\u3044\u306E\u5C4B\u53F0\u304B\u3089\u3001\u7518\u8F9B\u3044\u305F\u308C\u306E\u9999\u308A\u304C\u6F02\u3063\u3066\u304F\u308B\u3002",
    weight: 5,
    choices: [
      {
        label: "\u4E00\u4E32\u8CB7\u3063\u3066\u3001\u6B69\u304D\u306A\u304C\u3089\u98DF\u3079\u308B",
        effects: {
          money: -20,
          stamina: 6
        }
      },
      {
        label: "\u5302\u3044\u3060\u3051\u697D\u3057\u3093\u3067\u901A\u308A\u904E\u304E\u308B",
        effects: {
          memories: 1
        }
      }
    ]
  },
  {
    id: "hikyaku_kotozute",
    title: "\u98DB\u811A\u306E\u3053\u3068\u3065\u3066",
    description: "\u6025\u304E\u306E\u98DB\u811A\u304C\u3001\u3059\u308C\u9055\u3044\u3056\u307E\u306B\u300C\u6B21\u306E\u5BBF\u5834\u306E\u8005\u3078\u3001\u3053\u306E\u624B\u7D19\u3092\u300D\u3068\u9810\u3051\u3066\u3044\u3063\u305F\u3002",
    weight: 3,
    choices: [
      {
        label: "\u5BBF\u5834\u3067\u3001\u5B9B\u5148\u306E\u4EBA\u3092\u63A2\u3057\u3066\u624B\u7D19\u3092\u5C4A\u3051\u308B",
        effects: {
          stamina: -4,
          reputation: 5,
          memories: 1
        }
      },
      {
        label: "\u6025\u304E\u306E\u8EAB\u3060\u3068\u3001\u7533\u3057\u8A33\u306A\u304F\u65AD\u308B",
        effects: {}
      }
    ]
  },
  {
    id: "yoake_shuttatsu",
    title: "\u591C\u660E\u3051\u306E\u51FA\u7ACB",
    description: "\u5BBF\u306E\u4EBA\u305F\u3061\u304C\u3001\u307E\u3060\u6697\u3044\u3046\u3061\u304B\u3089\u8D77\u304D\u3066\u3001\u671D\u9909\u306E\u7528\u610F\u3092\u3057\u3066\u3044\u308B\u3002",
    weight: 4,
    choices: [
      {
        label: "\u671D\u9909\u3092\u3057\u3063\u304B\u308A\u98DF\u3079\u3066\u3001\u65E9\u3081\u306B\u51FA\u308B",
        effects: {
          money: -20,
          stamina: 8
        }
      },
      {
        label: "\u3082\u3046\u5C11\u3057\u7720\u3063\u3066\u304B\u3089\u3001\u3086\u3063\u304F\u308A\u51FA\u308B",
        effects: {
          stamina: 4
        }
      }
    ]
  }
];

// src/events/special.json
var special_default = [
  {
    id: "hakone_sekisho",
    title: "\u7BB1\u6839\u306E\u95A2\u6240",
    description: "\u300C\u5165\u308A\u9244\u7832\u306B\u51FA\u5973\u300D\u3002\u5F79\u4EBA\u304C\u901A\u884C\u624B\u5F62\u3092\u3042\u3089\u305F\u3081\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u624B\u5F62\u3092\u898B\u305B\u3066\u3001\u6B63\u76F4\u306B\u7B54\u3048\u308B",
        effects: {
          reputation: 3
        }
      },
      {
        label: "\u5F79\u4EBA\u306B\u8336\u83D3\u5B50\u3092\u5DEE\u3057\u5165\u308C\u3066\u3001\u548C\u3084\u304B\u306B\u901A\u308B",
        effects: {
          money: -100,
          reputation: 1,
          memories: 2
        }
      },
      {
        label: "\u540D\u306E\u77E5\u308C\u305F\u65C5\u4EBA\u3068\u3057\u3066\u3001\u9854\u306A\u3058\u307F\u306E\u5F79\u4EBA\u306B\u3059\u3093\u306A\u308A\u901A\u3055\u308C\u308B",
        effects: {
          memories: 3,
          stamina: 4
        },
        requires: {
          minReputation: 40
        },
        addFlags: [
          "sekisho:kao"
        ]
      },
      {
        label: "\u6B66\u58EB\u3068\u3057\u3066\u3001\u901A\u884C\u624B\u5F62\u3092\u793A\u3057\u3001\u6EDE\u308A\u306A\u304F\u901A\u308B",
        effects: {
          memories: 1,
          stamina: 6
        },
        requires: {
          hasFlags: [
            "role:bushi"
          ]
        }
      }
    ]
  },
  {
    id: "miya_shichiri",
    title: "\u4E03\u91CC\u306E\u6E21\u3057\u306E\u8239",
    description: "\u5BAE\u304B\u3089\u6851\u540D\u3078\u306F\u3001\u6D77\u3092\u8239\u3067\u6E21\u308B\u3002\u8239\u982D\u304C\u5BA2\u3092\u96C6\u3081\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u8239\u65C5\u3092\u697D\u3057\u3080",
        effects: {
          money: -120,
          memories: 5
        }
      },
      {
        label: "\u8239\u9154\u3044\u306B\u5099\u3048\u3066\u3001\u3072\u3068\u7720\u308A\u3059\u308B",
        effects: {
          money: -120,
          stamina: 10
        }
      }
    ]
  },
  {
    id: "arai_sekisho",
    title: "\u65B0\u5C45\u306E\u95A2\u6240",
    description: "\u6D5C\u540D\u6E56\u306E\u6E21\u3057\u3092\u8D8A\u3048\u308B\u3068\u3001\u65B0\u5C45\u306E\u95A2\u6240\u3002\u5973\u6539\u3081\u3082\u53B3\u3057\u3044\u3068\u805E\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u624B\u5F62\u3092\u898B\u305B\u3001\u5F79\u4EBA\u306E\u554F\u3044\u306B\u4E01\u5BE7\u306B\u7B54\u3048\u308B",
        effects: {
          reputation: 3
        }
      },
      {
        label: "\u5F85\u3064\u3042\u3044\u3060\u3001\u6E56\u3092\u773A\u3081\u3066\u904E\u3054\u3059",
        effects: {
          memories: 3,
          stamina: 4
        }
      },
      {
        label: "\u8A55\u5224\u306E\u3088\u3055\u3067\u3001\u53D6\u308A\u8ABF\u3079\u3082\u307B\u3069\u306A\u304F\u6E08\u3080",
        effects: {
          memories: 3,
          stamina: 6
        },
        requires: {
          minReputation: 40
        },
        addFlags: [
          "sekisho:kao"
        ]
      },
      {
        label: "\u6B66\u58EB\u3068\u3057\u3066\u3001\u901A\u884C\u624B\u5F62\u3092\u793A\u3057\u3001\u6EDE\u308A\u306A\u304F\u901A\u308B",
        effects: {
          memories: 1,
          stamina: 6
        },
        requires: {
          hasFlags: [
            "role:bushi"
          ]
        }
      }
    ]
  },
  {
    id: "shinagawa_miokuri",
    title: "\u54C1\u5DDD\u306E\u898B\u9001\u308A",
    description: "\u6C5F\u6238\u3092\u767A\u3064\u65C5\u4EBA\u3092\u3001\u53CB\u304C\u54C1\u5DDD\u307E\u3067\u898B\u9001\u308A\u306B\u6765\u3066\u304F\u308C\u305F\u3002\u6700\u521D\u306E\u5BBF\u3067\u3001\u5225\u308C\u306E\u76C3\u3092\u4EA4\u308F\u3059\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u76C3\u3092\u4EA4\u308F\u3057\u3066\u3001\u65C5\u306E\u7121\u4E8B\u3092\u8A93\u3046",
        effects: {
          money: -60,
          memories: 4,
          reputation: 2
        }
      },
      {
        label: "\u65E9\u3081\u306B\u4F11\u3093\u3067\u3001\u660E\u65E5\u306B\u5099\u3048\u308B",
        effects: {
          stamina: 8
        }
      }
    ]
  },
  {
    id: "mishima_taisha",
    title: "\u4E09\u5D8B\u5927\u793E\u306B\u53C2\u308B",
    description: "\u4E09\u5CF6\u5BBF\u306F\u3001\u4E09\u5D8B\u5927\u793E\u306E\u9580\u524D\u753A\u3002\u65C5\u306E\u5B89\u5168\u3092\u7948\u308B\u4EBA\u3067\u306B\u304E\u308F\u3063\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u304A\u53C2\u308A\u3057\u3066\u3001\u304A\u5B88\u308A\u3092\u53D7\u3051\u308B",
        effects: {
          money: -30,
          stamina: 6,
          reputation: 1
        }
      },
      {
        label: "\u5883\u5185\u306E\u6C60\u3092\u306E\u3093\u3073\u308A\u773A\u3081\u308B",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "fuchu_sunpu",
    title: "\u99FF\u5E9C\u306E\u57CE\u4E0B",
    description: "\u5E9C\u4E2D\u306F\u99FF\u5E9C\u57CE\u306E\u57CE\u4E0B\u753A\u3002\u5FB3\u5DDD\u5BB6\u5EB7\u304C\u6669\u5E74\u3092\u904E\u3054\u3057\u305F\u571F\u5730\u3068\u3057\u3066\u77E5\u3089\u308C\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u57CE\u4E0B\u3092\u3072\u3068\u56DE\u308A\u3057\u3066\u3001\u753A\u306E\u306B\u304E\u308F\u3044\u3092\u898B\u308B",
        effects: {
          memories: 4,
          stamina: -3
        }
      },
      {
        label: "\u5B89\u500D\u5DDD\u306E\u6CB3\u539F\u3067\u3001\u8DB3\u3092\u4F11\u3081\u308B",
        effects: {
          stamina: 8
        }
      }
    ]
  },
  {
    id: "maruko_tororo",
    title: "\u3068\u308D\u308D\u6C41\u306E\u8336\u5C4B",
    description: "\u97A0\u5B50\u5BBF\u306F\u3001\u3068\u308D\u308D\u6C41\u306E\u8336\u5C4B\u3067\u540D\u9AD8\u3044\u3002\u677E\u5C3E\u82AD\u8549\u3082\u53E5\u306B\u8A60\u3093\u3060\u3068\u4F1D\u308F\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u540D\u7269\u306E\u3068\u308D\u308D\u6C41\u3092\u3001\u3086\u3063\u304F\u308A\u5473\u308F\u3046",
        effects: {
          money: -50,
          stamina: 10,
          memories: 3
        }
      },
      {
        label: "\u5E97\u5148\u3067\u4E00\u53E5\u3072\u306D\u3063\u3066\u307F\u308B",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "nissaka_yonaki",
    title: "\u591C\u6CE3\u304D\u77F3\u306E\u8A00\u3044\u4F1D\u3048",
    description: "\u65E5\u5742\u306E\u5148\u306E\u5C0F\u591C\u306E\u4E2D\u5C71\u306B\u306F\u3001\u591C\u6CE3\u304D\u77F3\u306E\u8A00\u3044\u4F1D\u3048\u304C\u3042\u308B\u3002\u8336\u5C4B\u306E\u4E3B\u4EBA\u304C\u3001\u6614\u8A71\u3092\u805E\u304B\u305B\u3066\u304F\u308C\u305F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u8A71\u306B\u8033\u3092\u304B\u305F\u3080\u3051\u3001\u77F3\u3092\u898B\u306B\u884C\u304F",
        effects: {
          stamina: -4,
          memories: 5
        }
      },
      {
        label: "\u793C\u3092\u8A00\u3063\u3066\u3001\u5148\u3092\u6025\u3050",
        effects: {
          reputation: 1
        }
      }
    ]
  },
  {
    id: "hamamatsu_shusse",
    title: "\u51FA\u4E16\u57CE\u306E\u3044\u308F\u308C",
    description: "\u6D5C\u677E\u306F\u3001\u82E5\u304D\u65E5\u306E\u5FB3\u5DDD\u5BB6\u5EB7\u304C\u904E\u3054\u3057\u305F\u57CE\u4E0B\u3002\u300C\u51FA\u4E16\u57CE\u300D\u306E\u547C\u3073\u540D\u304C\u3042\u308B\u3068\u805E\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u57CE\u3092\u4EF0\u3044\u3067\u3001\u51FA\u4E16\u306B\u3042\u3084\u304B\u308B",
        effects: {
          memories: 3,
          reputation: 3
        }
      },
      {
        label: "\u5BBF\u306E\u4E3B\u4EBA\u304B\u3089\u3001\u571F\u5730\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 2,
          stamina: 3
        }
      }
    ]
  },
  {
    id: "okazaki_yahagi",
    title: "\u77E2\u4F5C\u6A4B\u3092\u308F\u305F\u308B",
    description: "\u5CA1\u5D0E\u306F\u5BB6\u5EB7\u751F\u8A95\u306E\u57CE\u4E0B\u3002\u77E2\u4F5C\u5DDD\u306B\u306F\u3001\u6771\u6D77\u9053\u3067\u5C48\u6307\u306E\u9577\u3044\u6A4B\u304C\u304B\u304B\u3063\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u6A4B\u306E\u4E0A\u304B\u3089\u3001\u5DDD\u3068\u57CE\u3092\u773A\u3081\u308B",
        effects: {
          memories: 4
        }
      },
      {
        label: "\u6A4B\u306E\u305F\u3082\u3068\u306E\u8336\u5C4B\u3067\u3001\u3072\u3068\u4F11\u307F\u3059\u308B",
        effects: {
          money: -30,
          stamina: 8
        }
      }
    ]
  },
  {
    id: "kuwana_funatsuki",
    title: "\u6851\u540D\u306E\u8239\u7740\u304D\u5834",
    description: "\u4E03\u91CC\u306E\u6E21\u3057\u3092\u8D8A\u3048\u3066\u3001\u6851\u540D\u306E\u8239\u7740\u304D\u5834\u306B\u7740\u3044\u305F\u3002\u6D5C\u8FBA\u3067\u306F\u86E4\u3092\u713C\u304F\u7159\u304C\u7ACB\u3063\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u713C\u304D\u86E4\u3092\u305D\u306E\u5834\u3067\u98DF\u3079\u308B",
        effects: {
          money: -60,
          stamina: 8,
          memories: 3
        }
      },
      {
        label: "\u8239\u65C5\u306E\u75B2\u308C\u3092\u3001\u5BBF\u3067\u7652\u3059",
        effects: {
          stamina: 10
        }
      }
    ]
  },
  {
    id: "seki_machinami",
    title: "\u95A2\u306E\u753A\u4E26\u307F",
    description: "\u95A2\u5BBF\u306F\u3001\u4F0A\u52E2\u3084\u5927\u548C\u3078\u5411\u304B\u3046\u9053\u304C\u5206\u304B\u308C\u308B\u5BBF\u5834\u3002\u65C5\u4EBA\u306E\u884C\u304D\u6765\u304C\u7D76\u3048\u306A\u3044\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u4F0A\u52E2\u53C2\u308A\u306E\u4E00\u884C\u3068\u3001\u9053\u9023\u308C\u306B\u306A\u308B",
        effects: {
          memories: 5,
          reputation: 2,
          stamina: -3
        }
      },
      {
        label: "\u753A\u4E26\u307F\u3092\u6B69\u3044\u3066\u3001\u571F\u7523\u7269\u3092\u773A\u3081\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "kusatsu_gouryu",
    title: "\u4E8C\u3064\u306E\u8857\u9053\u306E\u5408\u6D41\u70B9",
    description: "\u8349\u6D25\u306F\u3001\u6771\u6D77\u9053\u3068\u4E2D\u5C71\u9053\u304C\u5408\u308F\u3055\u308B\u5BBF\u5834\u3002\u4E2D\u5C71\u9053\u3092\u6765\u305F\u65C5\u4EBA\u305F\u3061\u3068\u3001\u9854\u3092\u5408\u308F\u305B\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u4E2D\u5C71\u9053\u3092\u6765\u305F\u65C5\u4EBA\u304B\u3089\u3001\u9053\u4E2D\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 5,
          reputation: 1
        }
      },
      {
        label: "\u59E5\u30F6\u9905\u306E\u5E97\u3067\u3001\u3086\u3063\u304F\u308A\u4F11\u3080",
        effects: {
          money: -30,
          stamina: 8
        }
      }
    ]
  }
];

// src/events/shuku.json
var shuku_default = [
  {
    id: "kawasaki_daishi",
    title: "\u5DDD\u5D0E\u5927\u5E2B\u306B\u304A\u53C2\u308A",
    description: "\u5DDD\u5D0E\u5BBF\u306E\u8FD1\u304F\u306B\u306F\u3001\u5384\u9664\u3051\u3067\u77E5\u3089\u308C\u308B\u5DDD\u5D0E\u5927\u5E2B\u304C\u3042\u308B\u3002\u6C5F\u6238\u304B\u3089\u306E\u53C2\u8A63\u5BA2\u3082\u591A\u3044\u3068\u805E\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5384\u9664\u3051\u306E\u304A\u672D\u3092\u53D7\u3051\u308B",
        effects: {
          money: -40,
          stamina: 5,
          reputation: 1
        }
      },
      {
        label: "\u5883\u5185\u306E\u8CD1\u308F\u3044\u3092\u3001\u3072\u3068\u3081\u3050\u308A\u3057\u3066\u773A\u3081\u308B",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "kanagawa_daimachi",
    title: "\u53F0\u753A\u306E\u8336\u5C4B",
    description: "\u795E\u5948\u5DDD\u5BBF\u306E\u53F0\u753A\u306F\u3001\u6D77\u3092\u898B\u4E0B\u308D\u3059\u9AD8\u53F0\u3002\u8336\u5C4B\u306E\u5EA7\u6577\u304B\u3089\u3001\u8239\u306E\u884C\u304D\u4EA4\u3046\u5165\u6C5F\u304C\u898B\u3048\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5EA7\u6577\u306B\u4E0A\u304C\u3063\u3066\u3001\u6D77\u3092\u773A\u3081\u306A\u304C\u3089\u4E00\u670D\u3059\u308B",
        effects: {
          money: -40,
          stamina: 8,
          memories: 2
        }
      },
      {
        label: "\u7E01\u5148\u304B\u3089\u3001\u666F\u8272\u3060\u3051\u773A\u3081\u3066\u5148\u3078\u9032\u3080",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "hodogaya_gonta",
    title: "\u6A29\u592A\u5742\u306E\u4E0A\u308A",
    description: "\u4FDD\u571F\u30F6\u8C37\u5BBF\u3092\u51FA\u308B\u3068\u3001\u9577\u3044\u5742\u9053\u304C\u7D9A\u304F\u3002\u8377\u3092\u62C5\u3044\u3060\u65C5\u4EBA\u305F\u3061\u304C\u3001\u606F\u3092\u5207\u3089\u3057\u3066\u4E0A\u3063\u3066\u3044\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u3086\u3063\u304F\u308A\u3068\u3001\u4F11\u307F\u306A\u304C\u3089\u4E0A\u308B",
        effects: {
          stamina: -4,
          memories: 1
        }
      },
      {
        label: "\u52E2\u3044\u3092\u3064\u3051\u3066\u3001\u4E00\u6C17\u306B\u4E0A\u308A\u304D\u308B",
        effects: {
          stamina: -10,
          reputation: 2
        }
      }
    ]
  },
  {
    id: "totsuka_hatsunichi",
    title: "\u6C5F\u6238\u304B\u3089\u4E00\u65E5\u76EE\u306E\u5BBF",
    description: "\u6238\u585A\u5BBF\u306F\u3001\u6C5F\u6238\u3092\u767A\u3063\u305F\u65C5\u4EBA\u304C\u6700\u521D\u306E\u6669\u306B\u6CCA\u307E\u308B\u3053\u3068\u306E\u591A\u3044\u5BBF\u5834\u3002\u300E\u6771\u6D77\u9053\u4E2D\u819D\u6817\u6BDB\u300F\u306E\u4E8C\u4EBA\u3082\u3001\u3053\u3053\u3067\u4E00\u6CCA\u76EE\u3092\u8FCE\u3048\u305F\u3068\u3044\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u65C5\u306E\u6700\u521D\u306E\u6669\u3092\u795D\u3063\u3066\u3001\u3055\u3055\u3084\u304B\u306A\u5BB4\u3092\u958B\u304F",
        effects: {
          money: -60,
          memories: 4,
          reputation: 1
        }
      },
      {
        label: "\u660E\u65E5\u304B\u3089\u306B\u5099\u3048\u3066\u3001\u65E9\u3081\u306B\u5E8A\u306B\u3064\u304F",
        effects: {
          stamina: 10
        }
      }
    ]
  },
  {
    id: "fujisawa_yugyoji",
    title: "\u904A\u884C\u5BFA\u306E\u9580\u524D",
    description: "\u85E4\u6CA2\u5BBF\u306B\u306F\u3001\u6642\u5B97\u306E\u7DCF\u672C\u5C71\u30FB\u904A\u884C\u5BFA\u304C\u3042\u308B\u3002\u3053\u3053\u304B\u3089\u3001\u6C5F\u306E\u5CF6\u3078\u5411\u304B\u3046\u9053\u3082\u5206\u304B\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u904A\u884C\u5BFA\u306E\u5927\u304D\u306A\u9580\u3068\u5883\u5185\u3092\u898B\u3066\u56DE\u308B",
        effects: {
          memories: 3,
          stamina: -2
        }
      },
      {
        label: "\u6C5F\u306E\u5CF6\u8A63\u3067\u306E\u4EBA\u3005\u304B\u3089\u3001\u5CF6\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 4
        }
      }
    ]
  },
  {
    id: "hiratsuka_bannyu",
    title: "\u99AC\u5165\u5DDD\u306E\u6E21\u3057",
    description: "\u5E73\u585A\u5BBF\u306E\u305D\u3070\u306B\u306F\u99AC\u5165\u5DDD\uFF08\u76F8\u6A21\u5DDD\uFF09\u304C\u6D41\u308C\u3001\u65C5\u4EBA\u306F\u821F\u3067\u6E21\u3063\u305F\u3002\u5DDD\u5411\u3053\u3046\u306B\u306F\u3001\u9AD8\u9E97\u5C71\u304C\u898B\u3048\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u6E21\u3057\u821F\u306B\u4E57\u3063\u3066\u3001\u5DDD\u98A8\u3092\u611F\u3058\u308B",
        effects: {
          money: -20,
          memories: 3
        }
      },
      {
        label: "\u821F\u3092\u5F85\u3064\u3042\u3044\u3060\u3001\u5DDD\u539F\u3067\u8DB3\u3092\u4F11\u3081\u308B",
        effects: {
          stamina: 8
        }
      }
    ]
  },
  {
    id: "oiso_tora",
    title: "\u864E\u5FA1\u524D\u306E\u8A00\u3044\u4F1D\u3048",
    description: "\u5927\u78EF\u306E\u5BBF\u306B\u306F\u3001\u938C\u5009\u6642\u4EE3\u306E\u904A\u5973\u30FB\u864E\u5FA1\u524D\u3068\u66FD\u6211\u5341\u90CE\u306E\u604B\u306E\u8A00\u3044\u4F1D\u3048\u304C\u6B8B\u308B\u3002\u5BBF\u306E\u4EBA\u304C\u3001\u305D\u306E\u8A71\u3092\u805E\u304B\u305B\u3066\u304F\u308C\u305F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5316\u7CA7\u4E95\u6238\u3092\u8A2A\u306D\u3066\u3001\u6614\u8A71\u306B\u8033\u3092\u304B\u305F\u3080\u3051\u308B",
        effects: {
          stamina: -3,
          memories: 5
        }
      },
      {
        label: "\u8A71\u306E\u793C\u3092\u8A00\u3063\u3066\u3001\u5BBF\u3067\u3086\u3063\u304F\u308A\u4F11\u3080",
        effects: {
          stamina: 8,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "odawara_uiro",
    title: "\u5916\u90CE\u306E\u5E97\u5148",
    description: "\u5C0F\u7530\u539F\u306E\u753A\u306B\u306F\u3001\u85AC\u306E\u5916\u90CE\uFF08\u3046\u3044\u308D\u3046\uFF09\u3092\u5546\u3046\u5E97\u304C\u3042\u308B\u3002\u65C5\u306E\u5FC5\u9700\u54C1\u3068\u3057\u3066\u3001\u8CB7\u3044\u6C42\u3081\u308B\u65C5\u4EBA\u3082\u591A\u3044\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u65C5\u306E\u85AC\u3092\u8CB7\u3044\u6C42\u3081\u308B",
        effects: {
          money: -80,
          stamina: 12
        }
      },
      {
        label: "\u5E97\u5148\u306E\u898B\u4E8B\u306A\u5EFA\u7269\u3092\u773A\u3081\u3066\u901A\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "numazu_senbon",
    title: "\u5343\u672C\u677E\u539F",
    description: "\u6CBC\u6D25\u306E\u6D77\u8FBA\u306B\u306F\u3001\u677E\u6797\u304C\u9577\u304F\u7D9A\u304F\u3002\u6CE2\u306E\u97F3\u3092\u805E\u304D\u306A\u304C\u3089\u6B69\u304F\u3068\u3001\u8DB3\u3082\u8EFD\u304F\u306A\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u677E\u6797\u3092\u6B69\u3044\u3066\u3001\u6F6E\u98A8\u3092\u6D74\u3073\u308B",
        effects: {
          stamina: 6,
          memories: 2
        }
      },
      {
        label: "\u6D5C\u8FBA\u306B\u51FA\u3066\u3001\u8C9D\u304C\u3089\u3092\u62FE\u3046",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "hara_fuji",
    title: "\u539F\u304B\u3089\u4EF0\u3050\u5BCC\u58EB",
    description: "\u539F\u5BBF\u306E\u3042\u305F\u308A\u306F\u3001\u5BCC\u58EB\u306E\u59FF\u304C\u5927\u304D\u304F\u898B\u3048\u308B\u3002\u5E83\u91CD\u3082\u3001\u671D\u306E\u5BCC\u58EB\u306E\u7D75\u3092\u63CF\u3044\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u7ACB\u3061\u6B62\u307E\u3063\u3066\u3001\u5BCC\u58EB\u3092\u3058\u3063\u304F\u308A\u773A\u3081\u308B",
        effects: {
          memories: 5,
          stamina: 2
        }
      },
      {
        label: "\u5BBF\u306E\u4EBA\u306B\u3001\u5BCC\u58EB\u306E\u898B\u3069\u3053\u308D\u3092\u5C0B\u306D\u308B",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "yoshiwara_hidarifuji",
    title: "\u5DE6\u5BCC\u58EB",
    description: "\u5409\u539F\u306E\u3042\u305F\u308A\u3067\u8857\u9053\u304C\u5927\u304D\u304F\u66F2\u304C\u308A\u3001\u4EAC\u3078\u5411\u304B\u3046\u65C5\u4EBA\u306E\u5DE6\u624B\u306B\u5BCC\u58EB\u304C\u898B\u3048\u308B\u3002\u5DE6\u5BCC\u58EB\u3068\u547C\u3070\u308C\u308B\u73CD\u3057\u3044\u666F\u8272\u3060\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u677E\u4E26\u6728\u306E\u9053\u3067\u8DB3\u3092\u6B62\u3081\u3001\u5DE6\u624B\u306E\u5BCC\u58EB\u3092\u773A\u3081\u308B",
        effects: {
          memories: 5
        }
      },
      {
        label: "\u540C\u3058\u9053\u3092\u884C\u304F\u65C5\u4EBA\u3068\u3001\u666F\u8272\u306E\u3053\u3068\u3092\u8A9E\u308A\u5408\u3046",
        effects: {
          memories: 3,
          reputation: 2
        }
      }
    ]
  },
  {
    id: "kanbara_yuki",
    title: "\u96EA\u306E\u84B2\u539F",
    description: "\u84B2\u539F\u306F\u3001\u5E83\u91CD\u304C\u591C\u306E\u96EA\u666F\u8272\u3092\u63CF\u3044\u305F\u5BBF\u3002\u6E29\u6696\u306A\u571F\u5730\u3067\u3001\u96EA\u306F\u73CD\u3057\u3044\u3068\u3082\u3044\u308F\u308C\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u7D75\u306E\u3088\u3046\u306A\u96EA\u666F\u8272\u3092\u601D\u3044\u6D6E\u304B\u3079\u306A\u304C\u3089\u6B69\u304F",
        effects: {
          memories: 3,
          stamina: 2
        }
      },
      {
        label: "\u5BBF\u3067\u3001\u7D75\u306E\u8A71\u3092\u805E\u304B\u305B\u3066\u3082\u3089\u3046",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "yui_sakuraebi",
    title: "\u685C\u3048\u3073\u306E\u6D5C",
    description: "\u7531\u6BD4\u306E\u6D5C\u3067\u306F\u3001\u685C\u3048\u3073\u306E\u5E72\u3057\u5834\u304C\u5E83\u304C\u3063\u3066\u3044\u308B\u3002\u8584\u7D05\u306E\u8272\u304C\u3001\u967D\u306B\u6620\u3048\u3066\u7F8E\u3057\u3044\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5E72\u3057\u305F\u3066\u306E\u685C\u3048\u3073\u3092\u3001\u5206\u3051\u3066\u3082\u3089\u3046",
        effects: {
          money: -30,
          stamina: 6,
          memories: 2
        }
      },
      {
        label: "\u6D5C\u306E\u50CD\u304D\u624B\u3068\u3001\u7ACB\u3061\u8A71\u3092\u3059\u308B",
        effects: {
          memories: 3,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "okitsu_seikenji",
    title: "\u6E05\u898B\u5BFA\u306E\u9418",
    description: "\u8208\u6D25\u5BBF\u3092\u898B\u4E0B\u308D\u3059\u9AD8\u53F0\u306B\u3001\u6E05\u898B\u5BFA\u304C\u3042\u308B\u3002\u6D77\u3068\u4E09\u4FDD\u306E\u677E\u539F\u306E\u773A\u3081\u304C\u3088\u304F\u3001\u671D\u9BAE\u901A\u4FE1\u4F7F\u304C\u6CCA\u307E\u3063\u305F\u3053\u3068\u3082\u3042\u308B\u3068\u3044\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u77F3\u6BB5\u3092\u4E0A\u3063\u3066\u3001\u5883\u5185\u304B\u3089\u6D77\u3092\u773A\u3081\u308B",
        effects: {
          stamina: -4,
          memories: 5
        }
      },
      {
        label: "\u5BFA\u306E\u9418\u306E\u97F3\u3092\u805E\u304D\u306A\u304C\u3089\u3001\u5883\u5185\u3067\u4F11\u3080",
        effects: {
          stamina: 8,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "ejiri_miho",
    title: "\u4E09\u4FDD\u306E\u677E\u539F\u3092\u671B\u3080",
    description: "\u6C5F\u5C3B\u5BBF\u306E\u5148\u306B\u306F\u3001\u4E09\u4FDD\u306E\u677E\u539F\u304C\u898B\u3048\u308B\u3002\u7FBD\u8863\u4F1D\u8AAC\u306E\u821E\u53F0\u3068\u3057\u3066\u77E5\u3089\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u7FBD\u8863\u306E\u4F1D\u8AAC\u3092\u601D\u3044\u6D6E\u304B\u3079\u306A\u304C\u3089\u3001\u773A\u3081\u308B",
        effects: {
          memories: 4
        }
      },
      {
        label: "\u8239\u7740\u304D\u5834\u3067\u3001\u5730\u5143\u306E\u6F01\u5E2B\u306B\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "okabe_utsunoya",
    title: "\u5B87\u6D25\u30CE\u8C37\u5CE0\u306E\u53E4\u9053",
    description: "\u5CA1\u90E8\u5BBF\u306E\u624B\u524D\u306E\u5B87\u6D25\u30CE\u8C37\u5CE0\u306B\u306F\u3001\u300E\u4F0A\u52E2\u7269\u8A9E\u300F\u306B\u51FA\u3066\u304F\u308B\u8526\u306E\u7D30\u9053\u304C\u6B8B\u308B\u3068\u3044\u3046\u3002\u6C5F\u6238\u306E\u6771\u6D77\u9053\u306F\u3001\u5225\u306E\u65B0\u3057\u3044\u9053\u3092\u901A\u3063\u3066\u3044\u305F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u6614\u306E\u9053\u3092\u5C11\u3057\u3060\u3051\u6B69\u3044\u3066\u307F\u308B",
        effects: {
          stamina: -5,
          memories: 5
        }
      },
      {
        label: "\u65B0\u3057\u3044\u8857\u9053\u3092\u3001\u305D\u306E\u307E\u307E\u9032\u3080",
        effects: {
          stamina: 2
        }
      }
    ]
  },
  {
    id: "fujieda_someimeshi",
    title: "\u67D3\u98EF\u306E\u5C4B\u53F0",
    description: "\u85E4\u679D\u5BBF\u306E\u540D\u7269\u306F\u3001\u304F\u3061\u306A\u3057\u3067\u9EC4\u8272\u304F\u67D3\u3081\u305F\u98EF\u3002\u75B2\u308C\u3092\u3068\u308A\u3001\u8DB3\u3092\u8EFD\u304F\u3059\u308B\u3068\u3044\u308F\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u67D3\u98EF\u3092\u8CB7\u3063\u3066\u3001\u6B69\u304D\u306A\u304C\u3089\u98DF\u3079\u308B",
        effects: {
          money: -30,
          stamina: 10
        }
      },
      {
        label: "\u67D3\u98EF\u306E\u4F5C\u308A\u65B9\u3092\u3001\u5E97\u306E\u4EBA\u306B\u805E\u304F",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "shimada_kawakaisho",
    title: "\u5DDD\u4F1A\u6240\u3068\u5DDD\u672D",
    description: "\u5CF6\u7530\u5BBF\u306B\u306F\u3001\u5927\u4E95\u5DDD\u306E\u5DDD\u8D8A\u3057\u3092\u53D6\u308A\u4ED5\u5207\u308B\u5DDD\u4F1A\u6240\u304C\u3042\u308B\u3002\u6E21\u308B\u306B\u306F\u3001\u6C34\u306E\u6DF1\u3055\u306B\u5FDC\u3058\u305F\u5DDD\u672D\u3092\u8CB7\u308F\u306A\u3051\u308C\u3070\u306A\u3089\u306A\u3044\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5DDD\u672D\u306E\u3057\u304F\u307F\u3092\u3001\u5F79\u4EBA\u306B\u6559\u3048\u3066\u3082\u3089\u3046",
        effects: {
          memories: 3,
          reputation: 1
        }
      },
      {
        label: "\u4EBA\u8DB3\u306E\u69D8\u5B50\u3092\u3001\u5CB8\u8FBA\u304B\u3089\u773A\u3081\u308B",
        effects: {
          memories: 2
        }
      }
    ]
  },
  {
    id: "kanaya_ishidatami",
    title: "\u91D1\u8C37\u5742\u306E\u77F3\u7573",
    description: "\u91D1\u8C37\u5BBF\u306E\u5148\u306B\u306F\u3001\u77F3\u7573\u306E\u6025\u306A\u5742\u9053\u304C\u7D9A\u304F\u3002\u96E8\u306E\u65E5\u306F\u3001\u7279\u306B\u8DB3\u3082\u3068\u304C\u6ED1\u308A\u3084\u3059\u3044\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u77F3\u7573\u3092\u3001\u614E\u91CD\u306B\u8E0F\u307F\u3057\u3081\u3066\u4E0A\u308B",
        effects: {
          stamina: -4,
          memories: 2
        }
      },
      {
        label: "\u5742\u306E\u9014\u4E2D\u306E\u8336\u5C4B\u3067\u3001\u3072\u3068\u606F\u3064\u304F",
        effects: {
          money: -30,
          stamina: 8
        }
      }
    ]
  },
  {
    id: "kakegawa_castle",
    title: "\u639B\u5DDD\u57CE\u306E\u57CE\u4E0B",
    description: "\u639B\u5DDD\u5BBF\u306F\u3001\u639B\u5DDD\u57CE\u306E\u57CE\u4E0B\u753A\u3002\u753A\u306B\u306F\u3001\u845B\u5E03\u3092\u7E54\u308B\u97F3\u304C\u304B\u3059\u304B\u306B\u805E\u3053\u3048\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u57CE\u306E\u5929\u5B88\u3092\u4EF0\u3044\u3067\u3001\u753A\u3092\u6B69\u304F",
        effects: {
          memories: 3,
          stamina: -2
        }
      },
      {
        label: "\u845B\u5E03\u306E\u7E54\u308A\u624B\u306E\u4ED5\u4E8B\u3092\u3001\u898B\u305B\u3066\u3082\u3089\u3046",
        effects: {
          memories: 3,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "fukuroi_domanaka",
    title: "\u6771\u6D77\u9053\u306E\u3069\u307E\u3093\u4E2D",
    description: "\u888B\u4E95\u5BBF\u306F\u3001\u6C5F\u6238\u304B\u3089\u3082\u4EAC\u304B\u3089\u308227\u756A\u76EE\u3067\u3001\u4E94\u5341\u4E09\u6B21\u306E\u4E2D\u9593\u306B\u3042\u305F\u308B\u3002\u300C\u3069\u307E\u3093\u4E2D\u300D\u3068\u3001\u5BBF\u5834\u306E\u4EBA\u304C\u81EA\u6162\u3052\u306B\u8A00\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u6298\u308A\u8FD4\u3057\u3092\u795D\u3063\u3066\u3001\u8336\u3092\u3075\u308B\u307E\u308F\u308C\u308B",
        effects: {
          stamina: 8,
          memories: 3
        }
      },
      {
        label: "\u3053\u3053\u307E\u3067\u306E\u65C5\u3092\u3001\u5BBF\u306E\u4E3B\u4EBA\u3068\u8A9E\u308A\u5408\u3046",
        effects: {
          memories: 4,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "mitsuke_tenryu",
    title: "\u5929\u7ADC\u5DDD\u306E\u821F\u6E21\u3057",
    description: "\u898B\u9644\u5BBF\u306E\u5148\u306E\u5929\u7ADC\u5DDD\u306B\u306F\u6A4B\u304C\u306A\u304F\u3001\u821F\u3067\u6E21\u308B\u3002\u5927\u4E95\u5DDD\u3068\u9055\u3044\u3001\u5DDD\u6B62\u3081\u306F\u5C11\u306A\u3044\u3068\u805E\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u821F\u306B\u4E57\u3063\u3066\u3001\u5DDD\u306E\u6D41\u308C\u3092\u611F\u3058\u308B",
        effects: {
          money: -20,
          memories: 3
        }
      },
      {
        label: "\u821F\u3092\u5F85\u3064\u3042\u3044\u3060\u3001\u5CB8\u8FBA\u3067\u4F11\u3080",
        effects: {
          stamina: 8
        }
      }
    ]
  },
  {
    id: "maisaka_watashi",
    title: "\u6D5C\u540D\u6E56\u306E\u6E21\u3057\u821F",
    description: "\u821E\u5742\u306E\u8239\u7740\u304D\u5834\u304B\u3089\u306F\u3001\u6D5C\u540D\u6E56\u3092\u821F\u3067\u6E21\u3063\u3066\u65B0\u5C45\u3078\u5411\u304B\u3046\u3002\u6E56\u9762\u306B\u3001\u9060\u304F\u306E\u5C71\u5F71\u304C\u6620\u3063\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u821F\u306B\u63FA\u3089\u308C\u3066\u3001\u6E56\u306E\u666F\u8272\u3092\u697D\u3057\u3080",
        effects: {
          money: -30,
          memories: 4
        }
      },
      {
        label: "\u8239\u982D\u306B\u3001\u6E56\u306E\u8A71\u3092\u805E\u3044\u3066\u304A\u304F",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "shirasuka_shiomizaka",
    title: "\u6F6E\u898B\u5742\u306E\u773A\u3081",
    description: "\u767D\u9808\u8CC0\u5BBF\u306F\u3001\u5B9D\u6C38\u306E\u5730\u9707\u3068\u6D25\u6CE2\u306E\u3042\u3068\u3001\u9AD8\u53F0\u306B\u79FB\u3063\u305F\u3068\u4F1D\u308F\u308B\u3002\u6F6E\u898B\u5742\u304B\u3089\u306F\u3001\u9060\u5DDE\u7058\u304C\u5E83\u304C\u3063\u3066\u898B\u3048\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5742\u306E\u4E0A\u304B\u3089\u3001\u5927\u6D77\u539F\u3092\u773A\u3081\u308B",
        effects: {
          memories: 5
        }
      },
      {
        label: "\u5BBF\u306E\u4EBA\u304B\u3089\u3001\u6614\u306E\u6D25\u6CE2\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 3,
          reputation: 2
        }
      }
    ]
  },
  {
    id: "futagawa_honjin",
    title: "\u4E8C\u5DDD\u306E\u672C\u9663",
    description: "\u4E8C\u5DDD\u5BBF\u306B\u306F\u3001\u65C5\u306E\u5927\u540D\u304C\u6CCA\u307E\u308B\u672C\u9663\u304C\u3042\u308B\u3002\u4ECA\u3067\u306F\u3001\u305D\u306E\u5EFA\u7269\u304C\u6B8B\u308B\u5BBF\u5834\u3068\u3057\u3066\u77E5\u3089\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u672C\u9663\u306E\u9580\u69CB\u3048\u3092\u898B\u5B66\u3057\u3066\u3001\u5BBF\u5834\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 4
        }
      },
      {
        label: "\u5BBF\u5834\u306E\u8336\u5E97\u3067\u3001\u67CF\u9905\u3092\u98DF\u3079\u308B",
        effects: {
          money: -30,
          stamina: 6
        }
      }
    ]
  },
  {
    id: "yoshida_tezutsu",
    title: "\u5409\u7530\u306E\u82B1\u706B",
    description: "\u5409\u7530\u5BBF\u306E\u796D\u308A\u3067\u306F\u3001\u624B\u7B52\u82B1\u706B\u304C\u5949\u7D0D\u3055\u308C\u308B\u3002\u66F2\u4EAD\u99AC\u7434\u3082\u3001\u5409\u7530\u306E\u82B1\u706B\u3092\u5929\u4E0B\u4E00\u3068\u8A18\u3057\u305F\u3068\u3044\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u7B52\u3092\u62B1\u3048\u308B\u4EBA\u3005\u306E\u59FF\u3092\u3001\u9593\u8FD1\u3067\u898B\u5B88\u308B",
        effects: {
          memories: 6,
          stamina: -3
        }
      },
      {
        label: "\u9060\u304F\u304B\u3089\u3001\u82B1\u706B\u306E\u97F3\u3068\u5149\u3092\u697D\u3057\u3080",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "goyu_matsunamiki",
    title: "\u5FA1\u6CB9\u306E\u677E\u4E26\u6728",
    description: "\u5FA1\u6CB9\u5BBF\u306E\u5916\u308C\u306B\u306F\u3001\u7ACB\u6D3E\u306A\u677E\u4E26\u6728\u304C\u7D9A\u304F\u3002\u5BB6\u5EB7\u306E\u547D\u3067\u690D\u3048\u3089\u308C\u305F\u3068\u4F1D\u308F\u308B\u5927\u6728\u304C\u3001\u9053\u306B\u5F71\u3092\u843D\u3068\u3057\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u677E\u306E\u6728\u9670\u3067\u3001\u6DBC\u307F\u306A\u304C\u3089\u6B69\u304F",
        effects: {
          stamina: 6,
          memories: 2
        }
      },
      {
        label: "\u677E\u306E\u592A\u3055\u306B\u9A5A\u3044\u3066\u3001\u5E79\u306B\u624B\u3092\u3042\u3066\u3066\u307F\u308B",
        effects: {
          memories: 3
        }
      }
    ]
  },
  {
    id: "akasaka_hatago",
    title: "\u8D64\u5742\u306E\u65C5\u7C60",
    description: "\u5FA1\u6CB9\u304B\u3089\u3001\u6771\u6D77\u9053\u3067\u3082\u6700\u3082\u8FD1\u3044\u5BBF\u30FB\u8D64\u5742\u307E\u3067\u306F\u3001\u308F\u305A\u304B1.7km\u307B\u3069\u3002\u65C5\u7C60\u306E\u4E3B\u4EBA\u304C\u3001\u306B\u3053\u3084\u304B\u306B\u58F0\u3092\u304B\u3051\u3066\u304F\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u52E7\u3081\u3089\u308C\u308B\u307E\u307E\u306B\u3001\u65C5\u7C60\u306B\u6CCA\u307E\u308B",
        effects: {
          money: -80,
          stamina: 14,
          memories: 2
        }
      },
      {
        label: "\u4E01\u5BE7\u306B\u65AD\u3063\u3066\u3001\u5148\u3092\u6025\u3050",
        effects: {
          reputation: 1
        }
      }
    ]
  },
  {
    id: "fujikawa_bohana",
    title: "\u68D2\u9F3B\u306E\u51FA\u8FCE\u3048",
    description: "\u85E4\u5DDD\u5BBF\u306E\u5165\u53E3\uFF08\u68D2\u9F3B\uFF09\u306B\u306F\u3001\u5BBF\u5834\u306E\u5F79\u4EBA\u304C\u4E26\u3076\u3002\u516B\u6714\u306E\u9803\u306B\u306F\u3001\u671D\u5EF7\u3078\u99AC\u3092\u732E\u4E0A\u3059\u308B\u884C\u5217\u3092\u8FCE\u3048\u308B\u7FD2\u308F\u3057\u304C\u3042\u3063\u305F\u3068\u3044\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u68D2\u9F3B\u306E\u305F\u305F\u305A\u307E\u3044\u3092\u3001\u3086\u3063\u304F\u308A\u773A\u3081\u308B",
        effects: {
          memories: 3
        }
      },
      {
        label: "\u5BBF\u5834\u306E\u4EBA\u306B\u3001\u6614\u306E\u884C\u5217\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 3,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "chiryu_umaichi",
    title: "\u99AC\u5E02\u306E\u8CD1\u308F\u3044",
    description: "\u6C60\u9BC9\u9B92\u306B\u306F\u3001\u99AC\u5E02\u304C\u7ACB\u3064\u3068\u3044\u308F\u308C\u308B\u3002\u5E83\u91CD\u3082\u3001\u521D\u590F\u306E\u99AC\u5E02\u3092\u63CF\u3044\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u99AC\u306E\u4E26\u3076\u69D8\u5B50\u3092\u898B\u7269\u3059\u308B",
        effects: {
          memories: 4,
          stamina: -2
        }
      },
      {
        label: "\u5E02\u306E\u5C4B\u53F0\u3067\u3001\u571F\u5730\u306E\u5473\u3092\u8A66\u3059",
        effects: {
          money: -40,
          stamina: 6,
          memories: 1
        }
      }
    ]
  },
  {
    id: "narumi_arimatsu",
    title: "\u6709\u677E\u306E\u7D5E\u308A\u67D3\u3081",
    description: "\u9CF4\u6D77\u5BBF\u306E\u8FD1\u304F\u306E\u6709\u677E\u306F\u3001\u7D5E\u308A\u67D3\u3081\u3067\u77E5\u3089\u308C\u308B\u3002\u5E97\u5148\u306B\u3001\u8272\u3068\u308A\u3069\u308A\u306E\u5E03\u304C\u4E26\u3093\u3067\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u7D5E\u308A\u306E\u624B\u306C\u3050\u3044\u3092\u8CB7\u3063\u3066\u3001\u65C5\u306E\u8A18\u5FF5\u306B\u3059\u308B",
        effects: {
          money: -60,
          memories: 4
        }
      },
      {
        label: "\u67D3\u3081\u4E0A\u304C\u308A\u306E\u5E03\u3092\u3001\u898B\u305B\u3066\u3082\u3089\u3046",
        effects: {
          memories: 2,
          reputation: 1
        }
      }
    ]
  },
  {
    id: "yokkaichi_oiwake",
    title: "\u4F0A\u52E2\u8857\u9053\u306E\u8FFD\u5206",
    description: "\u56DB\u65E5\u5E02\u5BBF\u306E\u5148\u306E\u65E5\u6C38\u306B\u306F\u3001\u6771\u6D77\u9053\u3068\u4F0A\u52E2\u8857\u9053\u306E\u5206\u304B\u308C\u9053\uFF08\u8FFD\u5206\uFF09\u304C\u3042\u308B\u3002\u4F0A\u52E2\u53C2\u308A\u306E\u65C5\u4EBA\u304C\u3001\u305D\u3061\u3089\u3078\u6298\u308C\u3066\u3044\u304F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u4F0A\u52E2\u3078\u5411\u304B\u3046\u65C5\u4EBA\u3068\u3001\u9053\u4E2D\u306E\u8A71\u3092\u3059\u308B",
        effects: {
          memories: 4,
          reputation: 1
        }
      },
      {
        label: "\u5206\u304B\u308C\u9053\u306E\u9053\u6A19\u3092\u773A\u3081\u3066\u3001\u5148\u3078\u9032\u3080",
        effects: {
          memories: 1
        }
      }
    ]
  },
  {
    id: "ishiyakushi_tera",
    title: "\u77F3\u85AC\u5E2B\u5BFA\u306E\u9580\u524D",
    description: "\u77F3\u85AC\u5E2B\u306E\u5BBF\u306E\u540D\u306F\u3001\u77F3\u85AC\u5E2B\u5BFA\u306B\u3061\u306A\u3080\u3068\u4F1D\u308F\u308B\u3002\u9580\u524D\u3067\u306F\u3001\u65C5\u4EBA\u304C\u9759\u304B\u306B\u624B\u3092\u5408\u308F\u305B\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u304A\u53C2\u308A\u3057\u3066\u3001\u65C5\u306E\u7121\u4E8B\u3092\u7948\u308B",
        effects: {
          money: -20,
          stamina: 5,
          reputation: 1
        }
      },
      {
        label: "\u9580\u524D\u306E\u8336\u5C4B\u3067\u3001\u3072\u3068\u4F11\u307F\u3059\u308B",
        effects: {
          money: -30,
          stamina: 8
        }
      }
    ]
  },
  {
    id: "shono_haku",
    title: "\u306B\u308F\u304B\u96E8\u306E\u5E84\u91CE",
    description: "\u5E84\u91CE\u5BBF\u306F\u3001\u5E83\u91CD\u304C\u6FC0\u3057\u3044\u5915\u7ACB\u306E\u4E2D\u3092\u6025\u3050\u4EBA\u3005\u3092\u63CF\u3044\u305F\u5BBF\u3002\u7A7A\u304C\u6697\u304F\u306A\u308A\u3001\u96E8\u7C92\u304C\u843D\u3061\u3066\u304D\u305F\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u8FD1\u304F\u306E\u8ED2\u4E0B\u306B\u99C6\u3051\u8FBC\u3093\u3067\u3001\u96E8\u3092\u3084\u308A\u904E\u3054\u3059",
        effects: {
          stamina: 5,
          memories: 2
        }
      },
      {
        label: "\u5098\u3092\u5E83\u3052\u3066\u3001\u96E8\u306E\u4E2D\u3092\u9032\u3080",
        effects: {
          stamina: -8,
          memories: 3
        }
      }
    ]
  },
  {
    id: "kameyama_joka",
    title: "\u4E80\u5C71\u306E\u57CE\u4E0B",
    description: "\u4E80\u5C71\u5BBF\u306F\u3001\u57CE\u4E0B\u753A\u3002\u5742\u306E\u591A\u3044\u753A\u3067\u3001\u767D\u58C1\u306E\u57CE\u304C\u9AD8\u53F0\u306B\u898B\u3048\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u57CE\u4E0B\u306E\u5742\u9053\u3092\u306E\u3093\u3073\u308A\u6B69\u304F",
        effects: {
          memories: 3,
          stamina: -2
        }
      },
      {
        label: "\u57CE\u4E0B\u306E\u5E97\u3067\u3001\u65C5\u306E\u652F\u5EA6\u3092\u6574\u3048\u308B",
        effects: {
          money: -50,
          stamina: 8
        }
      }
    ]
  },
  {
    id: "sakanoshita_fudesute",
    title: "\u7B46\u6368\u5C71\u306E\u8A00\u3044\u4F1D\u3048",
    description: "\u5742\u4E0B\u5BBF\u306E\u8FD1\u304F\u306B\u306F\u3001\u7B46\u6368\u5C71\u3068\u547C\u3070\u308C\u308B\u5C71\u304C\u3042\u308B\u3002\u7D75\u5E2B\u30FB\u72E9\u91CE\u5143\u4FE1\u304C\u3001\u3042\u307E\u308A\u306E\u666F\u8272\u306B\u7B46\u3092\u6368\u3066\u305F\u3068\u4F1D\u308F\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u8A00\u3044\u4F1D\u3048\u3092\u601D\u3044\u306A\u304C\u3089\u3001\u5C71\u3092\u898B\u4E0A\u3052\u308B",
        effects: {
          memories: 4
        }
      },
      {
        label: "\u9234\u9E7F\u8D8A\u3048\u306B\u5099\u3048\u3066\u3001\u65E9\u304F\u4F11\u3080",
        effects: {
          stamina: 10
        }
      }
    ]
  },
  {
    id: "tsuchiyama_ame",
    title: "\u3042\u3044\u306E\u571F\u5C71\u3001\u96E8\u304C\u964D\u308B",
    description: "\u9234\u9E7F\u5CE0\u3092\u8D8A\u3048\u305F\u571F\u5C71\u5BBF\u306F\u3001\u96E8\u306E\u591A\u3044\u571F\u5730\u3068\u3057\u3066\u77E5\u3089\u308C\u308B\u3002\u99AC\u5B50\u5504\u306B\u3082\u300C\u3042\u3044\u306E\u571F\u5C71\u300D\u3068\u6B4C\u308F\u308C\u308B\u3068\u3044\u3046\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u96E8\u5BBF\u308A\u304C\u3066\u3089\u3001\u99AC\u5B50\u5504\u306E\u8A71\u3092\u805E\u304F",
        effects: {
          memories: 4,
          stamina: 4
        }
      },
      {
        label: "\u7B20\u3092\u304B\u3076\u3063\u3066\u3001\u96E8\u306E\u4E2D\u3092\u9032\u3080",
        effects: {
          stamina: -6,
          memories: 1
        }
      }
    ]
  },
  {
    id: "minakuchi_kanpyo",
    title: "\u304B\u3093\u3074\u3087\u3046\u306E\u5E72\u3057\u5834",
    description: "\u6C34\u53E3\u5BBF\u306E\u5468\u308A\u3067\u306F\u3001\u5915\u9854\u306E\u5B9F\u3092\u7D30\u304F\u5265\u3044\u3066\u5E72\u3059\u304B\u3093\u3074\u3087\u3046\u4F5C\u308A\u304C\u76DB\u3093\u3060\u3002\u8ED2\u5148\u306B\u3001\u767D\u3044\u5E2F\u304C\u63FA\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u5E72\u3057\u5834\u3092\u898B\u305B\u3066\u3082\u3089\u3044\u3001\u4F5C\u308A\u65B9\u3092\u805E\u304F",
        effects: {
          memories: 3,
          reputation: 1
        }
      },
      {
        label: "\u304B\u3093\u3074\u3087\u3046\u3092\u5206\u3051\u3066\u3082\u3089\u3044\u3001\u65C5\u306E\u98DF\u3079\u7269\u306B\u3059\u308B",
        effects: {
          money: -30,
          stamina: 6
        }
      }
    ]
  },
  {
    id: "ishibe_kyodachi",
    title: "\u4EAC\u7ACB\u3061\u77F3\u90E8\u6CCA\u307E\u308A",
    description: "\u77F3\u90E8\u5BBF\u306F\u3001\u4EAC\u3092\u767A\u3063\u305F\u65C5\u4EBA\u304C\u6700\u521D\u306E\u6669\u3092\u904E\u3054\u3059\u5BBF\u5834\u3068\u3057\u3066\u6804\u3048\u305F\u3068\u805E\u304F\u3002\u4EAC\u304B\u3089\u6765\u305F\u65C5\u4EBA\u304C\u3001\u5BBF\u3067\u4E00\u606F\u3064\u3044\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u4EAC\u304B\u3089\u6765\u305F\u65C5\u4EBA\u306B\u3001\u90FD\u306E\u69D8\u5B50\u3092\u5C0B\u306D\u308B",
        effects: {
          memories: 4,
          reputation: 1
        }
      },
      {
        label: "\u3082\u3046\u3059\u3050\u4EAC\u3060\u3068\u3001\u6C17\u6301\u3061\u3092\u65B0\u305F\u306B\u3057\u3066\u4F11\u3080",
        effects: {
          stamina: 8,
          memories: 1
        }
      }
    ]
  },
  {
    id: "otsu_osaka",
    title: "\u9022\u5742\u306E\u95A2\u3068\u5927\u6D25\u7D75",
    description: "\u5927\u6D25\u5BBF\u306E\u624B\u524D\u306E\u9022\u5742\u306E\u95A2\u306F\u3001\u767E\u4EBA\u4E00\u9996\u306E\u8749\u4E38\u306E\u6B4C\u3067\u77E5\u3089\u308C\u308B\u3002\u8857\u9053\u6CBF\u3044\u3067\u306F\u3001\u7D20\u6734\u306A\u5927\u6D25\u7D75\u304C\u58F2\u3089\u308C\u3066\u3044\u308B\u3002",
    weight: 1,
    once: true,
    special: true,
    choices: [
      {
        label: "\u8749\u4E38\u306E\u6B4C\u3092\u601D\u3044\u306A\u304C\u3089\u3001\u95A2\u306E\u8DE1\u3092\u6B69\u304F",
        effects: {
          memories: 4
        }
      },
      {
        label: "\u5927\u6D25\u7D75\u3092\u4E00\u679A\u8CB7\u3063\u3066\u3001\u4EAC\u3078\u306E\u571F\u7523\u306B\u3059\u308B",
        effects: {
          money: -60,
          memories: 3,
          reputation: 1
        }
      }
    ]
  }
];

// src/events/lane.json
var lane_default = [
  {
    id: "kawadome_yado",
    title: "\u5DDD\u6B62\u3081\u306E\u5BBF",
    description: "\u5DDD\u6B62\u3081\u3067\u3001\u5BBF\u306F\u65C5\u4EBA\u3067\u3042\u3075\u308C\u3066\u3044\u308B\u3002\u76F8\u90E8\u5C4B\u306B\u306A\u3063\u305F\u3002",
    weight: 10,
    conditions: { hasFlags: ["lane:31"] },
    choices: [
      { label: "\u76F8\u90E8\u5C4B\u306E\u65C5\u4EBA\u3068\u3001\u56FD\u306E\u8A71\u3067\u76DB\u308A\u4E0A\u304C\u308B", effects: { memories: 4, reputation: 2 } },
      { label: "\u65E9\u3081\u306B\u5BDD\u3066\u3001\u4F53\u3092\u4F11\u3081\u308B", effects: { stamina: 12 } }
    ]
  },
  {
    id: "kawadome_shogi",
    title: "\u9000\u5C48\u3057\u306E\u304E\u306E\u5C06\u68CB",
    description: "\u6C34\u304C\u5F15\u304F\u306E\u3092\u5F85\u3064\u9593\u3001\u5BBF\u306E\u4E3B\u4EBA\u304C\u5C06\u68CB\u3092\u6307\u305D\u3046\u3068\u8A00\u3063\u3066\u304D\u305F\u3002",
    weight: 8,
    conditions: { hasFlags: ["lane:31"] },
    choices: [
      { label: "\u4E00\u5C40\u6307\u3059", effects: { memories: 3 }, gamble: { chance: 0.5, failEffects: { memories: 2 } } },
      { label: "\u5BBF\u306E\u624B\u4F1D\u3044\u3092\u3057\u3066\u3001\u99C4\u8CC3\u3092\u3082\u3089\u3046", effects: { money: 150, reputation: 2 } }
    ]
  }
];

// src/engine/config.ts
var DEFAULT_CONFIG = {
  balance: balance_default,
  board: board_default,
  events: [...road_default, ...special_default, ...shuku_default, ...lane_default],
  titles: titles_default
};
function getEvent(config, id) {
  const e = config.events.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown event: ${id}`);
  return e;
}
__name(getEvent, "getEvent");
function getPersonality(config, id) {
  const p = config.balance.cpuPersonalities.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown personality: ${id}`);
  return p;
}
__name(getPersonality, "getPersonality");
var ROLE_IDS = Object.keys(DEFAULT_CONFIG.balance.roles);
function getRole(config, id) {
  const r = config.balance.roles[id];
  if (!r) throw new Error(`Unknown role: ${id}`);
  return r;
}
__name(getRole, "getRole");

// src/engine/rng.ts
function createRng(state) {
  let s = state >>> 0;
  return {
    next() {
      s = s + 1831565813 >>> 0;
      let t = s;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    },
    getState() {
      return s;
    }
  };
}
__name(createRng, "createRng");
function randomSeed() {
  return Math.floor(Math.random() * 4294967295) >>> 0;
}
__name(randomSeed, "randomSeed");
function randomInt(rng, min, max) {
  return min + Math.floor(rng.next() * (max - min + 1));
}
__name(randomInt, "randomInt");
function chance(rng, probability) {
  return rng.next() < probability;
}
__name(chance, "chance");
function weightedPick(rng, items, weightOf) {
  const total = items.reduce((sum, item) => sum + Math.max(0, weightOf(item)), 0);
  if (items.length === 0 || total <= 0) return null;
  let roll = rng.next() * total;
  for (const item of items) {
    roll -= Math.max(0, weightOf(item));
    if (roll < 0) return item;
  }
  return items[items.length - 1];
}
__name(weightedPick, "weightedPick");

// src/engine/board.ts
function createInitialBoardState(players, config) {
  const tiles = config.board.main.map((t) => ({ ...t }));
  const mainLength = tiles.length;
  const forks = config.board.forks.map((f) => {
    const laneStart = tiles.length;
    tiles.push(...f.laneTiles.map((t) => ({ ...t })));
    return { tileIndex: f.tileIndex, laneStart, laneLength: f.laneTiles.length, mergeIndex: f.mergeIndex, main: f.main, lane: f.lane };
  });
  const playerStates = {};
  for (const p of players) playerStates[p.id] = { position: 0 };
  return { mainLength, tiles, forks, playerStates };
}
__name(createInitialBoardState, "createInitialBoardState");
function goalIndex(board) {
  return board.mainLength - 1;
}
__name(goalIndex, "goalIndex");
function forkAt(board, index) {
  return board.forks.find((f) => f.tileIndex === index);
}
__name(forkAt, "forkAt");
function laneOf(board, pos) {
  return board.forks.find((f) => pos >= f.laneStart && pos < f.laneStart + f.laneLength);
}
__name(laneOf, "laneOf");
function nextTileIndex(board, pos, route) {
  if (pos < board.mainLength) {
    if (pos >= goalIndex(board)) return null;
    const fork2 = forkAt(board, pos);
    if (fork2 && route === "lane") return fork2.laneStart;
    return pos + 1;
  }
  const fork = laneOf(board, pos);
  if (!fork) return null;
  return pos === fork.laneStart + fork.laneLength - 1 ? fork.mergeIndex : pos + 1;
}
__name(nextTileIndex, "nextTileIndex");
function pathFrom(board, pos, steps, route) {
  const path = [];
  let cur = pos;
  for (let i = 0; i < steps; i++) {
    const nx = nextTileIndex(board, cur, i === 0 ? route : void 0);
    if (nx === null) break;
    cur = nx;
    path.push(cur);
    if (board.tiles[cur].mustStop || cur === goalIndex(board)) break;
  }
  return path;
}
__name(pathFrom, "pathFrom");
function isTired(player, config) {
  return player.stats.stamina < config.balance.travel.tiredStamina || player.flags.includes("camped2");
}
__name(isTired, "isTired");
function maxFaceFor(player, config) {
  return isTired(player, config) ? config.balance.travel.tiredMaxFace : config.balance.game.diceFaces;
}
__name(maxFaceFor, "maxFaceFor");
function canHurry(player, config) {
  return player.stats.stamina >= config.balance.travel.hurryMinStamina;
}
__name(canHurry, "canHurry");
function recordCamp(player, camped) {
  const before = player.flags.includes("camped") || player.flags.includes("camped2");
  player.flags = player.flags.filter((f) => f !== "camped" && f !== "camped2");
  if (camped) player.flags.push(before ? "camped2" : "camped");
}
__name(recordCamp, "recordCamp");
function rollFace(player, config, rng) {
  return randomInt(rng, 1, maxFaceFor(player, config));
}
__name(rollFace, "rollFace");
function syncLaneFlag(board, player, pos) {
  const lane = laneOf(board, pos);
  const want = lane ? `lane:${lane.tileIndex}` : null;
  player.flags = player.flags.filter((f) => !f.startsWith("lane:"));
  if (want) player.flags.push(want);
}
__name(syncLaneFlag, "syncLaneFlag");
function innCostFor(player, config, lodging = player.lodging) {
  const base = config.balance.travel.innCost * config.balance.lodging[lodging].costRate * config.balance.roles[player.role].innRate;
  const r = config.balance.reputation;
  if (player.stats.reputation >= r.goodAt) return Math.round(base * r.goodInnRate);
  if (player.stats.reputation < r.badBelow) return Math.round(base * r.badInnRate);
  return Math.round(base);
}
__name(innCostFor, "innCostFor");
function invitedToHonjin(player, config) {
  return player.stats.reputation >= config.balance.lodging.honjin.reputationAt;
}
__name(invitedToHonjin, "invitedToHonjin");

// src/engine/stats.ts
var STAT_KEYS = ["money", "stamina", "memories", "reputation"];
var STAT_LABELS = { money: "\u8DEF\u9280", stamina: "\u4F53\u529B", memories: "\u601D\u3044\u51FA", reputation: "\u8A55\u5224" };
function clampStats(stats, limits) {
  const out = { ...stats };
  for (const k of STAT_KEYS) out[k] = Math.min(limits[k].max, Math.max(limits[k].min, Math.round(out[k])));
  return out;
}
__name(clampStats, "clampStats");
function applyDelta(stats, delta, limits) {
  const next = { ...stats };
  for (const k of STAT_KEYS) next[k] += delta[k] ?? 0;
  return clampStats(next, limits);
}
__name(applyDelta, "applyDelta");
function formatDelta(delta) {
  return STAT_KEYS.filter((k) => delta[k]).map((k) => `${STAT_LABELS[k]}${delta[k] > 0 ? "+" : ""}${delta[k]}${k === "money" ? "\u6587" : ""}`).join(" / ");
}
__name(formatDelta, "formatDelta");

// src/types/game.ts
var SCHEMA_VERSION = 3;

// src/engine/setup.ts
var MIN_PLAYERS = 2;
var MAX_PLAYERS = 6;
var CPU_NAMES = ["\u304A\u6885", "\u4E0E\u5E73", "\u304A\u677E", "\u6A29\u516B", "\u6E05\u5409", "\u304A\u9DB4"];
function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
__name(shuffle, "shuffle");
function createPlayer(id, name, personality, role, config) {
  const def = getRole(config, role);
  return {
    id,
    name,
    isHuman: personality === null,
    personality,
    role,
    stats: applyDelta(clampStats({ ...config.balance.start }, config.balance.limits), def.start, config.balance.limits),
    meibutsu: [],
    flags: [`role:${role}`],
    usedOnceEvents: [],
    lodging: "hatago",
    restDays: 0,
    arrivedDay: null,
    arrivalRank: null
  };
}
__name(createPlayer, "createPlayer");
function createGame(options = {}, config = DEFAULT_CONFIG) {
  const seed = (options.seed ?? randomSeed()) >>> 0;
  const rng = createRng(seed);
  const humanNames = options.humanNames?.length ? options.humanNames.slice(0, MAX_PLAYERS) : null;
  const humanCount = humanNames ? humanNames.length : options.includeHuman ?? true ? 1 : 0;
  const wanted = Math.round(options.playerCount ?? config.balance.game.playerCount);
  const count = Math.max(MIN_PLAYERS, humanCount, Math.min(MAX_PLAYERS, wanted));
  const names = shuffle(CPU_NAMES, rng);
  const cpuRoles = shuffle(ROLE_IDS, rng);
  const players = [];
  for (let i = 0; i < count; i++) {
    const id = `p${i}`;
    if (i < humanCount) {
      const name = humanNames ? humanNames[i] : options.playerName || "\u3042\u306A\u305F";
      players.push(createPlayer(id, name, null, options.humanRoles?.[i] ?? "ippan", config));
    } else {
      const role = cpuRoles[(i - humanCount) % cpuRoles.length];
      players.push(createPlayer(id, names[i % names.length], getRole(config, role).personality, role, config));
    }
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    seed,
    rngState: rng.getState(),
    phase: "playing",
    day: 1,
    players,
    board: createInitialBoardState(players, config),
    pendingEvent: null,
    turnCtl: { activeIndex: 0, awaiting: null, meibutsuAfterEvent: false },
    log: [{ day: 1, playerId: null, message: "\u65E5\u672C\u6A4B\u3092\u767A\u3064\u3002\u76EE\u6307\u3059\u306F\u4EAC\u90FD\u30FB\u4E09\u6761\u5927\u6A4B\u3002" }],
    diary: []
  };
}
__name(createGame, "createGame");

// src/engine/events.ts
function isConditionMet(player, cond) {
  if (!cond) return true;
  const s = player.stats;
  if (cond.minMoney !== void 0 && s.money < cond.minMoney) return false;
  if (cond.minStamina !== void 0 && s.stamina < cond.minStamina) return false;
  if (cond.maxStamina !== void 0 && s.stamina > cond.maxStamina) return false;
  if (cond.minReputation !== void 0 && s.reputation < cond.minReputation) return false;
  if (cond.hasFlags && !cond.hasFlags.every((f) => player.flags.includes(f))) return false;
  if (cond.notFlags && cond.notFlags.some((f) => player.flags.includes(f))) return false;
  return true;
}
__name(isConditionMet, "isConditionMet");
function isChoiceAvailable(player, choice) {
  return isConditionMet(player, choice.requires);
}
__name(isChoiceAvailable, "isChoiceAvailable");
function isEventEligible(player, event) {
  if (event.once && player.usedOnceEvents.includes(event.id)) return false;
  if (!isConditionMet(player, event.conditions)) return false;
  return event.choices.some((c) => isChoiceAvailable(player, c));
}
__name(isEventEligible, "isEventEligible");
function drawEvent(player, config, rng) {
  if (!chance(rng, config.balance.game.eventChance)) return null;
  const eligible = config.events.filter((e) => !e.special && isEventEligible(player, e));
  return weightedPick(rng, eligible, (e) => e.weight);
}
__name(drawEvent, "drawEvent");
function markEventUsed(player, event) {
  if (event.once && !player.usedOnceEvents.includes(event.id)) player.usedOnceEvents.push(event.id);
}
__name(markEventUsed, "markEventUsed");
function applyChoice(player, choice, config, rng) {
  const limits = config.balance.limits;
  const parts = [];
  let delta = choice.effects;
  if (choice.gamble) {
    const won = chance(rng, choice.gamble.chance);
    delta = won ? choice.effects : choice.gamble.failEffects;
    parts.push(won ? "\u3046\u307E\u304F\u3044\u3063\u305F\uFF01" : "\u3046\u307E\u304F\u3044\u304B\u306A\u304B\u3063\u305F\u2026\u2026");
  }
  player.stats = applyDelta(player.stats, delta, limits);
  const d = formatDelta(delta);
  if (d) parts.push(d);
  if (choice.restDays && choice.restDays > 0) {
    player.restDays += choice.restDays;
    parts.push(`${choice.restDays}\u65E5\u8DB3\u6B62\u3081`);
  }
  for (const f of choice.addFlags ?? []) if (!player.flags.includes(f)) player.flags.push(f);
  if (choice.removeFlags) player.flags = player.flags.filter((f) => !choice.removeFlags.includes(f));
  return parts.length ? `\u300C${choice.label}\u300D\u2192 ${parts.join(" / ")}` : `\u300C${choice.label}\u300D`;
}
__name(applyChoice, "applyChoice");

// src/engine/cpu.ts
var MONEY_SCALE = 100;
var NOISE = 3;
var REST_DAY_COST = 6;
function personalityOf(player, config) {
  return getPersonality(config, player.personality ?? "steady");
}
__name(personalityOf, "personalityOf");
function deltaValue(delta, p) {
  let v = 0;
  for (const k of STAT_KEYS) {
    const d = delta[k] ?? 0;
    v += (k === "money" ? d / MONEY_SCALE : d) * p.weights[k];
  }
  return v;
}
__name(deltaValue, "deltaValue");
function evaluateChoice(player, choice, p) {
  let v = choice.gamble ? choice.gamble.chance * deltaValue(choice.effects, p) + (1 - choice.gamble.chance) * deltaValue(choice.gamble.failEffects, p) : deltaValue(choice.effects, p);
  v -= (choice.restDays ?? 0) * REST_DAY_COST;
  if (player.stats.stamina + (choice.effects.stamina ?? 0) <= 10) v -= 10;
  return v;
}
__name(evaluateChoice, "evaluateChoice");
function chooseCpuChoice(player, event, config, rng) {
  const p = personalityOf(player, config);
  let best = -1;
  let bestValue = -Infinity;
  event.choices.forEach((choice, i) => {
    if (!isChoiceAvailable(player, choice)) return;
    const v = evaluateChoice(player, choice, p) + (rng.next() - 0.5) * NOISE;
    if (v > bestValue) {
      bestValue = v;
      best = i;
    }
  });
  return Math.max(0, best);
}
__name(chooseCpuChoice, "chooseCpuChoice");
function shouldCpuWork(player, config) {
  return player.stats.money < config.balance.travel.cpuWorkBelowMoney;
}
__name(shouldCpuWork, "shouldCpuWork");
function chooseCpuLodging(player, config) {
  return player.stats.money < config.balance.travel.innCost * 4 ? "kichin" : "hatago";
}
__name(chooseCpuLodging, "chooseCpuLodging");
function chooseCpuMove(player, config, rng) {
  if (shouldCpuWork(player, config)) return "work";
  if (canHurry(player, config) && player.stats.stamina >= config.balance.travel.hurryMinStamina + 15) {
    if (rng.next() < personalityOf(player, config).hurryLove) return "hurry";
  }
  return "roll";
}
__name(chooseCpuMove, "chooseCpuMove");
function chooseCpuBuyMeibutsu(player, m, config) {
  const reserve = innCostFor(player, config) * 2;
  if (player.stats.money - m.price < reserve) return false;
  const p = personalityOf(player, config);
  const value = p.meibutsuLove + m.memories * p.weights.memories - m.price / MONEY_SCALE * p.weights.money;
  return value > 0;
}
__name(chooseCpuBuyMeibutsu, "chooseCpuBuyMeibutsu");
function chooseCpuRoute(player, fork, config, rng) {
  const mainCost = -(fork.main.effects.money ?? 0);
  if (player.stats.money - mainCost < innCostFor(player, config)) return "lane";
  return rng.next() < personalityOf(player, config).detourLove ? "lane" : "main";
}
__name(chooseCpuRoute, "chooseCpuRoute");

// src/engine/session.ts
var SessionError = class extends Error {
  static {
    __name(this, "SessionError");
  }
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
var MAX_AUTO_STEPS = 5e3;
function note(s, p, kind, text) {
  s.diary.push({ day: s.day, playerId: p.id, place: s.board.tiles[s.board.playerStates[p.id].position].name, kind, text });
}
__name(note, "note");
function log(s, player, message) {
  s.log.push({ day: s.day, playerId: player?.id ?? null, message });
}
__name(log, "log");
function activePlayer(state) {
  return state.players[state.turnCtl.activeIndex];
}
__name(activePlayer, "activePlayer");
function hasArrived(player) {
  return player.arrivedDay !== null;
}
__name(hasArrived, "hasArrived");
function getAwaiting(state) {
  if (state.phase !== "playing") return null;
  if (state.pendingEvent) return { kind: "event", playerId: state.pendingEvent.playerId, eventId: state.pendingEvent.eventId };
  const a = state.turnCtl.awaiting;
  if (a) return { kind: a.kind, playerId: a.playerId, tileIndex: a.tileIndex };
  const p = activePlayer(state);
  if (p.isHuman && !hasArrived(p) && p.restDays === 0) return { kind: "roll", playerId: p.id };
  return null;
}
__name(getAwaiting, "getAwaiting");
function endOfDay(c) {
  const { s, config } = c;
  const t = config.balance.travel;
  for (const p of s.players) {
    if (hasArrived(p)) continue;
    const tile = s.board.tiles[s.board.playerStates[p.id].position];
    const inTown = tile.type === "shuku" || tile.type === "start";
    if (inTown && invitedToHonjin(p, config)) {
      const h = config.balance.lodging.honjin;
      p.stats = applyDelta(p.stats, { stamina: h.stamina, memories: h.memories }, config.balance.limits);
      recordCamp(p, false);
      log(s, p, `${p.name}\u306F\u8A55\u5224\u3092\u805E\u304D\u3064\u3051\u305F${tile.name}\u306E${h.name}\u306B\u62DB\u304B\u308C\u3001\u624B\u539A\u304F\u3082\u3066\u306A\u3055\u308C\u305F\u3002\uFF08\u601D\u3044\u51FA+${h.memories}\uFF09`);
      note(s, p, "inn", `${h.name}\u306B\u62DB\u304B\u308C\u3001\u624B\u539A\u304F\u3082\u3066\u306A\u3055\u308C\u305F\u3002`);
      continue;
    }
    const lodging = p.isHuman ? p.lodging : chooseCpuLodging(p, config);
    const cost = innCostFor(p, config, lodging);
    if (inTown && p.stats.money >= cost) {
      p.stats = applyDelta(p.stats, { money: -cost, stamina: config.balance.lodging[lodging].stamina }, config.balance.limits);
      recordCamp(p, false);
    } else {
      p.stats = applyDelta(p.stats, { stamina: t.campStamina, reputation: t.campReputation }, config.balance.limits);
      recordCamp(p, true);
      log(s, p, `${p.name}\u306F${tile.type === "shuku" ? "\u5BBF\u4EE3\u304C\u8DB3\u308A\u305A\u3001" : ""}\u91CE\u5BBF\u3057\u305F\u3002${p.flags.includes("camped2") ? "\uFF08\u91CE\u5BBF\u304C\u7D9A\u3044\u3066\u3001\u8DB3\u304C\u91CD\u3044\uFF09" : ""}`);
    }
  }
  c.events.push({ type: "day_end", day: s.day });
  s.day += 1;
  if (s.day > config.balance.game.maxDays) finishGame(c, `${config.balance.game.maxDays}\u65E5\u304C\u904E\u304E\u3001\u65C5\u306F\u3053\u3053\u307E\u3067\u3002`);
}
__name(endOfDay, "endOfDay");
function finishGame(c, message) {
  const { s } = c;
  if (s.phase === "finished") return;
  s.phase = "finished";
  s.pendingEvent = null;
  s.turnCtl.awaiting = null;
  log(s, null, message);
  c.events.push({ type: "finished" });
}
__name(finishGame, "finishGame");
function endTurn(c) {
  const { s } = c;
  const t = s.turnCtl;
  const from = t.activeIndex;
  c.events.push({ type: "turn_end", playerId: s.players[from].id });
  t.awaiting = null;
  t.meibutsuAfterEvent = false;
  const n = s.players.length;
  let next = -1;
  let wrapped = false;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (idx <= from) wrapped = true;
    if (!hasArrived(s.players[idx])) {
      next = idx;
      break;
    }
  }
  if (next < 0) {
    finishGame(c, "\u5168\u54E1\u304C\u4EAC\u90FD\u30FB\u4E09\u6761\u5927\u6A4B\u306B\u7740\u3044\u305F\u3002");
    return;
  }
  if (wrapped) endOfDay(c);
  t.activeIndex = next;
}
__name(endTurn, "endTurn");
function buyMeibutsu(c, p, tileIndex) {
  const m = c.s.board.tiles[tileIndex].meibutsu;
  p.stats = applyDelta(p.stats, { money: -m.price, memories: m.memories }, c.config.balance.limits);
  p.meibutsu.push(m.id);
  log(c.s, p, `${p.name}\u306F\u540D\u7269\u300C${m.name}\u300D\u3092\u8CB7\u3063\u305F\u3002\uFF08\u8DEF\u9280-${m.price}\u6587 / \u601D\u3044\u51FA+${m.memories}\uFF09`);
  note(c.s, p, "meibutsu", `\u540D\u7269\u300C${m.name}\u300D\u3092\u8CB7\u3063\u305F\u3002`);
}
__name(buyMeibutsu, "buyMeibutsu");
function canBuyMeibutsu(state, player, tileIndex) {
  const m = state.board.tiles[tileIndex]?.meibutsu;
  return Boolean(m && !player.meibutsu.includes(m.id) && player.stats.money >= m.price);
}
__name(canBuyMeibutsu, "canBuyMeibutsu");
function offerMeibutsu(c, p, tileIndex) {
  if (!canBuyMeibutsu(c.s, p, tileIndex)) return endTurn(c);
  if (p.isHuman) {
    c.s.turnCtl.awaiting = { kind: "meibutsu", playerId: p.id, tileIndex };
    c.events.push({ type: "awaiting", awaiting: getAwaiting(c.s) });
    return;
  }
  if (chooseCpuBuyMeibutsu(p, c.s.board.tiles[tileIndex].meibutsu, c.config)) buyMeibutsu(c, p, tileIndex);
  endTurn(c);
}
__name(offerMeibutsu, "offerMeibutsu");
function applyFork(c, p, fork, route) {
  const choice = fork[route];
  p.stats = applyDelta(p.stats, choice.effects, c.config.balance.limits);
  c.s.board.playerStates[p.id].route = route;
  if (!p.flags.includes(`took:${route}`)) p.flags.push(`took:${route}`);
  const d = formatDelta(choice.effects);
  log(c.s, p, `${p.name}\u306F\u300C${choice.label}\u300D\u3092\u9078\u3093\u3060\u3002${choice.story}${d ? `\uFF08${d}\uFF09` : ""}`);
  note(c.s, p, "fork", `\u300C${choice.label}\u300D\u3092\u9078\u3093\u3060\u3002${choice.story}`);
}
__name(applyFork, "applyFork");
function startEvent(c, p, ev, meibutsuAfter, tileIndex) {
  markEventUsed(p, ev);
  if (p.isHuman) {
    c.s.pendingEvent = { playerId: p.id, eventId: ev.id };
    c.s.turnCtl.meibutsuAfterEvent = meibutsuAfter;
    c.events.push({ type: "awaiting", awaiting: getAwaiting(c.s) });
    return;
  }
  const idx = chooseCpuChoice(p, ev, c.config, c.rng);
  log(c.s, p, `\u3010${ev.title}\u3011${p.name}\uFF1A${applyChoice(p, ev.choices[idx], c.config, c.rng)}`);
  note(c.s, p, ev.id.endsWith("sekisho") ? "sekisho" : "event", `${ev.title}\uFF1A${ev.choices[idx].label}`);
  if (meibutsuAfter) offerMeibutsu(c, p, tileIndex);
  else endTurn(c);
}
__name(startEvent, "startEvent");
function land(c, p, idx) {
  const { s, config } = c;
  const t = config.balance.travel;
  const tile = s.board.tiles[idx];
  c.events.push({ type: "landed", playerId: p.id, tileIndex: idx, tileType: tile.type });
  switch (tile.type) {
    case "goal": {
      const rank = s.players.filter(hasArrived).length + 1;
      p.arrivedDay = s.day;
      p.arrivalRank = rank;
      log(s, p, `${p.name}\u306F${s.day}\u65E5\u76EE\u306B\u4EAC\u90FD\u30FB\u4E09\u6761\u5927\u6A4B\u306B\u7740\u3044\u305F\uFF01\uFF08${rank}\u756A\u76EE\uFF09`);
      note(s, p, "arrive", `\u4EAC\u90FD\u30FB\u4E09\u6761\u5927\u6A4B\u306B\u7740\u3044\u305F\u3002${s.day}\u65E5\u76EE\u3001${rank}\u756A\u76EE\u3002`);
      c.events.push({ type: "arrived", playerId: p.id, rank, day: s.day });
      return endTurn(c);
    }
    case "fork": {
      const fork = forkAt(s.board, idx);
      if (p.isHuman) {
        s.turnCtl.awaiting = { kind: "fork", playerId: p.id, tileIndex: idx };
        c.events.push({ type: "awaiting", awaiting: getAwaiting(s) });
        return;
      }
      applyFork(c, p, fork, chooseCpuRoute(p, fork, config, c.rng));
      return endTurn(c);
    }
    case "shuku": {
      if (tile.eventId && !p.usedOnceEvents.includes(tile.eventId)) return startEvent(c, p, getEvent(config, tile.eventId), true, idx);
      if (chance(c.rng, config.balance.game.shukuEventChance)) {
        const ev = drawEvent(p, config, c.rng);
        if (ev) return startEvent(c, p, ev, true, idx);
      }
      return offerMeibutsu(c, p, idx);
    }
    case "event": {
      const ev = drawEvent(p, config, c.rng);
      if (ev) return startEvent(c, p, ev, false, idx);
      return endTurn(c);
    }
    case "teahouse": {
      if (p.stats.money >= t.teahouseCost) {
        p.stats = applyDelta(p.stats, { money: -t.teahouseCost, stamina: t.teahouseStamina, memories: t.teahouseMemories + getRole(config, p.role).scenicBonus }, config.balance.limits);
        log(s, p, `${p.name}\u306F${tile.name}\u3067\u3072\u3068\u4F11\u307F\u3002\uFF08\u8DEF\u9280-${t.teahouseCost}\u6587 / \u4F53\u529B+${t.teahouseStamina}\uFF09`);
      }
      return endTurn(c);
    }
    case "scenic": {
      const gain = t.scenicMemories + getRole(config, p.role).scenicBonus;
      p.stats = applyDelta(p.stats, { memories: gain }, config.balance.limits);
      log(s, p, `${p.name}\u306F${tile.name}\u3092\u773A\u3081\u305F\u3002\uFF08\u601D\u3044\u51FA+${gain}\uFF09`);
      return endTurn(c);
    }
    default:
      return endTurn(c);
  }
}
__name(land, "land");
function doRoll(c, forcedFace, hurry = false) {
  const { s, config } = c;
  const p = activePlayer(s);
  const pb = s.board.playerStates[p.id];
  const face = forcedFace ?? rollFace(p, config, c.rng);
  const from = pb.position;
  const path = pathFrom(s.board, from, face + (hurry ? config.balance.travel.hurryBonus : 0), pb.route);
  delete pb.route;
  const to = path.at(-1) ?? from;
  pb.position = to;
  syncLaneFlag(s.board, p, to);
  const extra = hurry ? getRole(config, p.role).hurryStamina ?? config.balance.travel.hurryStamina : 0;
  p.stats = applyDelta(p.stats, { stamina: -path.length * config.balance.travel.staminaPerStep - extra }, config.balance.limits);
  log(s, p, `${p.name}\u306F${hurry ? "\u65E9\u8DB3\u3067" : ""}\u300C${face}\u300D\u3092\u51FA\u3057\u3066\u3001${s.board.tiles[to].name}\u3078\u3002`);
  c.events.push({ type: "rolled", playerId: p.id, face, from, to, path, hurry });
  land(c, p, to);
}
__name(doRoll, "doRoll");
function doWork(c) {
  const { s, config } = c;
  const t = config.balance.travel;
  const p = activePlayer(s);
  const role = getRole(config, p.role);
  const earned = t.workMoney + role.workMoneyBonus;
  p.stats = applyDelta(p.stats, { money: earned, stamina: t.workStamina, reputation: t.workReputation, memories: role.workMemories }, config.balance.limits);
  log(s, p, `${p.name}\u306F\u4E00\u65E5\u50CD\u3044\u3066\u3001\u8DEF\u9280\u3092${earned}\u6587\u7A3C\u3044\u3060\u3002${role.workMemories ? `\uFF08\u601D\u3044\u51FA+${role.workMemories}\uFF09` : ""}`);
  c.events.push({ type: "worked", playerId: p.id, money: earned });
  endTurn(c);
}
__name(doWork, "doWork");
function stepOne(c) {
  const { s } = c;
  if (s.phase !== "playing" || s.pendingEvent || s.turnCtl.awaiting) return false;
  const p = activePlayer(s);
  if (hasArrived(p)) {
    endTurn(c);
    return true;
  }
  if (p.restDays > 0) {
    p.restDays -= 1;
    log(s, p, `${p.name}\u306F\u8DB3\u6B62\u3081\u4E2D\u3002\uFF08\u3042\u3068${p.restDays}\u65E5\uFF09`);
    c.events.push({ type: "rested", playerId: p.id, daysLeft: p.restDays });
    endTurn(c);
    return true;
  }
  if (p.isHuman) return false;
  const move = chooseCpuMove(p, c.config, c.rng);
  if (move === "work") doWork(c);
  else doRoll(c, void 0, move === "hurry");
  return true;
}
__name(stepOne, "stepOne");
function settle(c) {
  for (let guard = 0; guard < MAX_AUTO_STEPS; guard++) if (!stepOne(c)) return;
  throw new Error("\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u9032\u307F\u7D9A\u3051\u3066\u3044\u307E\u3059\uFF08\u7121\u9650\u30EB\u30FC\u30D7\u306E\u7591\u3044\uFF09");
}
__name(settle, "settle");
function start(state, config, rng) {
  return { s: structuredClone(state), rng: rng ?? createRng(state.rngState), config, events: [] };
}
__name(start, "start");
function finish(c, hadRng) {
  if (!hadRng) c.s.rngState = c.rng.getState();
  return { state: c.s, events: c.events };
}
__name(finish, "finish");
function runUntilHuman(state, config = DEFAULT_CONFIG, rng) {
  const c = start(state, config, rng);
  settle(c);
  return finish(c, Boolean(rng));
}
__name(runUntilHuman, "runUntilHuman");
function advanceOne(state, config = DEFAULT_CONFIG, rng) {
  const c = start(state, config, rng);
  stepOne(c);
  return finish(c, Boolean(rng));
}
__name(advanceOne, "advanceOne");
function submitAction(state, playerId, action, config = DEFAULT_CONFIG, rng, forcedFace) {
  if (state.phase !== "playing") throw new SessionError("finished", "\u65C5\u306F\u7D42\u308F\u3063\u3066\u3044\u307E\u3059");
  const aw = getAwaiting(state);
  if (!aw || aw.playerId !== playerId) throw new SessionError("not_your_turn", "\u3042\u306A\u305F\u306E\u756A\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  const c = start(state, config, rng);
  const s = c.s;
  const p = s.players.find((x) => x.id === playerId);
  switch (action.type) {
    case "roll":
    case "hurry":
    case "work":
      if (aw.kind !== "roll") throw new SessionError("wrong_action", "\u3044\u307E\u306F\u305D\u306E\u884C\u52D5\u306F\u3067\u304D\u307E\u305B\u3093");
      if (action.type === "hurry" && !canHurry(p, config)) throw new SessionError("invalid_choice", "\u4F53\u529B\u304C\u8DB3\u308A\u305A\u3001\u65E9\u8DB3\u306B\u306F\u3067\u304D\u307E\u305B\u3093");
      if (action.type === "work") doWork(c);
      else doRoll(c, forcedFace, action.type === "hurry");
      break;
    case "lodging":
      if (aw.kind !== "roll") throw new SessionError("wrong_action", "\u3044\u307E\u306F\u305D\u306E\u884C\u52D5\u306F\u3067\u304D\u307E\u305B\u3093");
      if (action.value !== "kichin" && action.value !== "hatago") throw new SessionError("invalid_choice", "\u305D\u306E\u5BBF\u306F\u3042\u308A\u307E\u305B\u3093");
      p.lodging = action.value;
      break;
    case "event": {
      if (aw.kind !== "event") throw new SessionError("wrong_action", "\u3044\u307E\u306F\u305D\u306E\u884C\u52D5\u306F\u3067\u304D\u307E\u305B\u3093");
      const ev = getEvent(config, aw.eventId);
      const choice = ev.choices[action.choiceIndex];
      if (!choice || !isChoiceAvailable(p, choice)) throw new SessionError("invalid_choice", "\u305D\u306E\u9078\u629E\u80A2\u306F\u9078\u3079\u307E\u305B\u3093");
      log(s, p, `\u3010${ev.title}\u3011${p.name}\uFF1A${applyChoice(p, choice, config, c.rng)}`);
      note(s, p, ev.id.endsWith("sekisho") ? "sekisho" : "event", `${ev.title}\uFF1A${choice.label}`);
      s.pendingEvent = null;
      if (s.turnCtl.meibutsuAfterEvent) {
        s.turnCtl.meibutsuAfterEvent = false;
        offerMeibutsu(c, p, s.board.playerStates[p.id].position);
      } else endTurn(c);
      break;
    }
    case "meibutsu":
      if (aw.kind !== "meibutsu") throw new SessionError("wrong_action", "\u3044\u307E\u306F\u305D\u306E\u884C\u52D5\u306F\u3067\u304D\u307E\u305B\u3093");
      if (action.buy) buyMeibutsu(c, p, aw.tileIndex);
      endTurn(c);
      break;
    case "fork":
      if (aw.kind !== "fork") throw new SessionError("wrong_action", "\u3044\u307E\u306F\u305D\u306E\u884C\u52D5\u306F\u3067\u304D\u307E\u305B\u3093");
      if (action.route !== "main" && action.route !== "lane") throw new SessionError("invalid_choice", "\u305D\u306E\u9053\u306F\u3042\u308A\u307E\u305B\u3093");
      applyFork(c, p, forkAt(s.board, aw.tileIndex), action.route);
      endTurn(c);
      break;
    default:
      throw new SessionError("wrong_action", "\u77E5\u3089\u306A\u3044\u884C\u52D5\u3067\u3059");
  }
  return finish(c, Boolean(rng));
}
__name(submitAction, "submitAction");
function autoAct(state, config = DEFAULT_CONFIG) {
  const aw = getAwaiting(state);
  if (!aw) return runUntilHuman(state, config);
  const p = state.players.find((x) => x.id === aw.playerId);
  const rng = createRng(state.rngState);
  let action;
  switch (aw.kind) {
    case "roll":
      action = shouldCpuWork(p, config) ? { type: "work" } : { type: "roll" };
      break;
    case "event":
      action = { type: "event", choiceIndex: chooseCpuChoice({ ...p, personality: "steady" }, getEvent(config, aw.eventId), config, rng) };
      break;
    case "meibutsu":
      action = { type: "meibutsu", buy: chooseCpuBuyMeibutsu({ ...p, personality: "steady" }, state.board.tiles[aw.tileIndex].meibutsu, config) };
      break;
    case "fork":
      action = { type: "fork", route: chooseCpuRoute({ ...p, personality: "steady" }, forkAt(state.board, aw.tileIndex), config, rng) };
      break;
  }
  return submitAction({ ...state, rngState: rng.getState() }, p.id, action, config);
}
__name(autoAct, "autoAct");

// src/engine/room.ts
var ROOM_MIN_PLAYERS = 2;
var ROOM_MAX_PLAYERS = 6;
var AUTO_AFTER_MISSES = 2;
var AUTO_SEAT_DELAY_MS = 1500;
var RoomError = class extends Error {
  static {
    __name(this, "RoomError");
  }
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
function createRoom(options) {
  const capacity = options.capacity ?? 4;
  if (!Number.isInteger(capacity) || capacity < ROOM_MIN_PLAYERS || capacity > ROOM_MAX_PLAYERS) {
    throw new RoomError("bad_capacity", `\u4EBA\u6570\u306F${ROOM_MIN_PLAYERS}\u301C${ROOM_MAX_PLAYERS}\u4EBA\u3067\u3059`);
  }
  return {
    code: options.code,
    hostId: options.hostId,
    capacity,
    status: "lobby",
    seats: [{ userId: options.hostId, name: options.hostName, role: "ippan", ready: false, connected: true }],
    seed: options.seed >>> 0,
    turnTimeoutMs: options.turnTimeoutMs ?? 3e4,
    deadline: null,
    version: 1,
    game: null
  };
}
__name(createRoom, "createRoom");
function bump(room, patch) {
  return { ...room, ...patch, version: room.version + 1 };
}
__name(bump, "bump");
function seatOf(room, userId) {
  const i = room.seats.findIndex((s) => s.userId === userId);
  if (i < 0) throw new RoomError("not_in_room", "\u90E8\u5C4B\u306B\u3044\u307E\u305B\u3093");
  return i;
}
__name(seatOf, "seatOf");
function joinRoom(room, userId, name) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u306F\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u307E\u3059");
  if (room.seats.some((s) => s.userId === userId)) throw new RoomError("already_joined", "\u3059\u3067\u306B\u53C2\u52A0\u3057\u3066\u3044\u307E\u3059");
  if (room.seats.length >= room.capacity) throw new RoomError("room_full", "\u90E8\u5C4B\u304C\u6E80\u54E1\u3067\u3059");
  return bump(room, { seats: [...room.seats, { userId, name, role: "ippan", ready: false, connected: true }] });
}
__name(joinRoom, "joinRoom");
function leaveRoom(room, userId) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u4E2D\u306F\u51FA\u3089\u308C\u307E\u305B\u3093\uFF08\u5207\u65AD\u3068\u3057\u3066\u6271\u3044\u307E\u3059\uFF09");
  const i = seatOf(room, userId);
  const seats = room.seats.filter((_, k) => k !== i);
  if (seats.length === 0) return null;
  return bump(room, { seats, hostId: room.hostId === userId ? seats[0].userId : room.hostId });
}
__name(leaveRoom, "leaveRoom");
function setReady(room, userId, ready) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u306F\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u307E\u3059");
  const i = seatOf(room, userId);
  return bump(room, { seats: room.seats.map((s, k) => k === i ? { ...s, ready } : s) });
}
__name(setReady, "setReady");
function setCapacity(room, userId, capacity) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u306F\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u307E\u3059");
  if (userId !== room.hostId) throw new RoomError("not_host", "\u30DB\u30B9\u30C8\u3060\u3051\u304C\u5909\u3048\u3089\u308C\u307E\u3059");
  if (!Number.isInteger(capacity) || capacity < Math.max(ROOM_MIN_PLAYERS, room.seats.length) || capacity > ROOM_MAX_PLAYERS) {
    throw new RoomError("bad_capacity", "\u4EBA\u6570\u304C\u7BC4\u56F2\u5916\u3067\u3059");
  }
  return bump(room, { capacity });
}
__name(setCapacity, "setCapacity");
function setRole(room, userId, role) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u306F\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u307E\u3059");
  if (!ROLE_IDS.includes(role)) throw new RoomError("bad_role", "\u305D\u306E\u8EAB\u5206\u306F\u3042\u308A\u307E\u305B\u3093");
  const i = seatOf(room, userId);
  return bump(room, { seats: room.seats.map((s, k) => k === i ? { ...s, role, ready: false } : s) });
}
__name(setRole, "setRole");
function setDeadline(room, now) {
  if (!room.game || room.game.phase !== "playing") return null;
  const aw = getAwaiting(room.game);
  if (aw && room.seats[Number(aw.playerId.slice(1))]?.auto) return now + AUTO_SEAT_DELAY_MS;
  return getAwaiting(room.game) ? now + room.turnTimeoutMs : null;
}
__name(setDeadline, "setDeadline");
function startRoom(room, userId, now, config = DEFAULT_CONFIG) {
  if (room.status !== "lobby") throw new RoomError("not_in_lobby", "\u30B2\u30FC\u30E0\u306F\u3059\u3067\u306B\u59CB\u307E\u3063\u3066\u3044\u307E\u3059");
  if (userId !== room.hostId) throw new RoomError("not_host", "\u30DB\u30B9\u30C8\u3060\u3051\u304C\u59CB\u3081\u3089\u308C\u307E\u3059");
  if (room.seats.length < 1) throw new RoomError("not_enough_players", "\u4EBA\u304C\u8DB3\u308A\u307E\u305B\u3093");
  if (!room.seats.every((s) => s.ready)) throw new RoomError("not_ready", "\u5168\u54E1\u306E\u6E96\u5099\u304C\u3067\u304D\u3066\u3044\u307E\u305B\u3093");
  const created = createGame(
    { humanNames: room.seats.map((s) => s.name), humanRoles: room.seats.map((s) => s.role), playerCount: room.capacity, seed: room.seed },
    config
  );
  const game = runUntilHuman(created, config).state;
  const next = { ...room, status: "playing", game };
  return bump(next, { status: "playing", game, deadline: setDeadline(next, now) });
}
__name(startRoom, "startRoom");
function playerIdOf(room, userId) {
  return `p${seatOf(room, userId)}`;
}
__name(playerIdOf, "playerIdOf");
function applyResult(room, game, events, steps, now) {
  const status = game.phase === "finished" ? "finished" : "playing";
  const next = { ...room, game, status };
  return { room: bump(next, { game, status, deadline: setDeadline(next, now) }), events, steps };
}
__name(applyResult, "applyResult");
function roomAction(room, userId, action, now, config = DEFAULT_CONFIG) {
  if (room.status !== "playing" || !room.game) throw new RoomError("not_started", "\u30B2\u30FC\u30E0\u306F\u9032\u884C\u4E2D\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
  const playerId = playerIdOf(room, userId);
  const first = submitAction(room.game, playerId, action, config);
  room = markPlayed(room, userId);
  const steps = [{ events: first.events, state: first.state }];
  let cur = first.state;
  for (let guard = 0; guard < 2e3 && cur.phase === "playing"; guard++) {
    const r = advanceOne(cur, config);
    if (r.events.length === 0) break;
    steps.push({ events: r.events, state: r.state });
    cur = r.state;
  }
  return applyResult(room, cur, steps.flatMap((x) => x.events), steps, now);
}
__name(roomAction, "roomAction");
function markPlayed(room, userId) {
  const i = seatOf(room, userId);
  const seat = room.seats[i];
  if (!seat.auto && !seat.missed) return room;
  return { ...room, seats: room.seats.map((s, k) => k === i ? { ...s, missed: 0, auto: false } : s) };
}
__name(markPlayed, "markPlayed");
function returnToPlay(room, userId) {
  const i = seatOf(room, userId);
  if (!room.seats[i].auto && !room.seats[i].missed) return room;
  return bump(room, { seats: room.seats.map((s, k) => k === i ? { ...s, missed: 0, auto: false } : s) });
}
__name(returnToPlay, "returnToPlay");
function setConnected(room, userId, connected) {
  const i = seatOf(room, userId);
  return bump(room, { seats: room.seats.map((s, k) => k === i ? { ...s, connected } : s) });
}
__name(setConnected, "setConnected");
function tickRoom(room, now, config = DEFAULT_CONFIG) {
  if (room.status !== "playing" || !room.game) return { room, events: [], steps: [] };
  let game = room.game;
  const events = [];
  const steps = [];
  let cur = room;
  for (let guard = 0; guard < 500; guard++) {
    const aw = getAwaiting(game);
    if (!aw) break;
    const idx = Number(aw.playerId.slice(1));
    const seat = cur.seats[idx];
    const overdue = cur.deadline !== null && now >= cur.deadline;
    if (!(seat && (!seat.connected || seat.auto)) && !overdue) break;
    if (overdue && seat && seat.connected && !seat.auto) {
      const missed = (seat.missed ?? 0) + 1;
      cur = { ...cur, seats: cur.seats.map((s, k) => k === idx ? { ...s, missed, auto: missed >= AUTO_AFTER_MISSES } : s) };
    }
    const res = autoAct(game, config);
    game = res.state;
    events.push(...res.events);
    steps.push({ events: res.events, state: res.state });
    for (let g2 = 0; g2 < 2e3 && game.phase === "playing"; g2++) {
      const r = advanceOne(game, config);
      if (r.events.length === 0) break;
      game = r.state;
      events.push(...r.events);
      steps.push({ events: r.events, state: r.state });
    }
    cur = { ...cur, deadline: null };
    if (game.phase !== "playing") break;
  }
  if (game === room.game) return { room, events, steps };
  return applyResult(cur, game, events, steps, now);
}
__name(tickRoom, "tickRoom");
function roomView(room, userId) {
  const game = room.game ? { ...room.game, rngState: 0, seed: 0 } : null;
  const idx = room.seats.findIndex((s) => s.userId === userId);
  return { ...room, seed: 0, game, you: { userId, playerId: idx >= 0 ? `p${idx}` : null } };
}
__name(roomView, "roomView");

// src/online/protocol.ts
var NAME_MAX = 12;
var REQ_ID_MAX = 64;
var MESSAGE_MAX_BYTES = 4096;
function cleanName(raw) {
  const stripped = typeof raw === "string" ? [...raw].filter((c) => c.charCodeAt(0) > 31 && c !== "<" && c !== ">").join("") : "";
  const s = stripped.trim().slice(0, NAME_MAX);
  return s || "\u540D\u7121\u3057";
}
__name(cleanName, "cleanName");
function parseClientMessage(raw) {
  if (raw.length > MESSAGE_MAX_BYTES) return null;
  let m;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!m || typeof m !== "object") return null;
  const o = m;
  const reqId = typeof o.reqId === "string" && o.reqId.length > 0 && o.reqId.length <= REQ_ID_MAX ? o.reqId : null;
  switch (o.t) {
    case "ping":
      return { t: "ping" };
    case "hello": {
      if (typeof o.userId !== "string" || o.userId.length < 8 || o.userId.length > 64) return null;
      if (typeof o.secret !== "string" || o.secret.length < 16 || o.secret.length > 128) return null;
      const create = o.create && typeof o.create === "object" ? { capacity: Number(o.create.capacity) } : void 0;
      return { t: "hello", userId: o.userId, secret: o.secret, name: cleanName(o.name), create };
    }
    case "ready":
      return reqId && typeof o.ready === "boolean" ? { t: "ready", ready: o.ready, reqId } : null;
    case "capacity":
      return reqId && typeof o.capacity === "number" ? { t: "capacity", capacity: o.capacity, reqId } : null;
    case "role":
      return reqId && typeof o.role === "string" && ID_RE.test(o.role) ? { t: "role", role: o.role, reqId } : null;
    case "start":
      return reqId ? { t: "start", reqId } : null;
    case "leave":
      return reqId ? { t: "leave", reqId } : null;
    case "back":
      return reqId ? { t: "back", reqId } : null;
    case "action": {
      const action = cleanAction(o.action);
      return reqId && action ? { t: "action", action, reqId } : null;
    }
    default:
      return null;
  }
}
__name(parseClientMessage, "parseClientMessage");
var ID_RE = /^[a-z0-9_]{1,40}$/;
var oneOf = /* @__PURE__ */ __name((v, list) => typeof v === "string" && list.includes(v), "oneOf");
var smallInt = /* @__PURE__ */ __name((v, max) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max, "smallInt");
function cleanAction(raw) {
  if (!raw || typeof raw !== "object") return null;
  const a = raw;
  switch (a.type) {
    case "roll":
      return { type: "roll" };
    case "hurry":
      return { type: "hurry" };
    case "work":
      return { type: "work" };
    case "lodging":
      return oneOf(a.value, ["kichin", "hatago"]) ? { type: "lodging", value: a.value } : null;
    case "event":
      return smallInt(a.choiceIndex, 20) ? { type: "event", choiceIndex: a.choiceIndex } : null;
    case "meibutsu":
      return typeof a.buy === "boolean" ? { type: "meibutsu", buy: a.buy } : null;
    case "fork":
      return oneOf(a.route, ["main", "lane"]) ? { type: "fork", route: a.route } : null;
    default:
      return null;
  }
}
__name(cleanAction, "cleanAction");

// src/online/roomServer.ts
var GRACE_MS = 8e3;
var LOBBY_IDLE_MS = 30 * 6e4;
var PLAYING_IDLE_MS = 6 * 60 * 6e4;
var FINISHED_KEEP_MS = 30 * 6e4;
var ABANDON_MS = 30 * 6e4;
var SEEN_KEEP = 24;
function alarmFor(s, now) {
  const times = [s.expireAt];
  if (s.room.deadline !== null) times.push(s.room.deadline);
  for (const seat of s.room.seats) {
    const g = s.graceUntil[seat.userId];
    if (!seat.connected && g !== void 0 && g > now) times.push(g);
  }
  return Math.max(now + 50, Math.min(...times));
}
__name(alarmFor, "alarmFor");
function finish2(s, out, now, extra = {}) {
  if (!s) return { stored: null, out, alarmAt: null, destroy: true, ...extra };
  return { stored: s, out, alarmAt: alarmFor(s, now), ...extra };
}
__name(finish2, "finish");
function idleExpire(room, now) {
  return now + (room.status === "finished" ? FINISHED_KEEP_MS : room.status === "lobby" ? LOBBY_IDLE_MS : PLAYING_IDLE_MS);
}
__name(idleExpire, "idleExpire");
function stepViews(steps) {
  return steps.map((st, i) => {
    const last = i === steps.length - 1;
    const { log: log2, diary: _diary, ...rest } = st.state;
    void _diary;
    return { events: st.events, logLen: log2.length, game: last ? null : { ...rest, rngState: 0, seed: 0 } };
  });
}
__name(stepViews, "stepViews");
function stateAll() {
  return { to: "all", state: true };
}
__name(stateAll, "stateAll");
function handleHello(stored, info, now) {
  const { userId, secretHash } = info;
  if (!stored) {
    if (!info.create) return { stored: null, out: [], alarmAt: null, error: { code: "no_room", message: "\u90E8\u5C4B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" } };
    const cap = Math.round(info.create.capacity);
    if (!(cap >= ROOM_MIN_PLAYERS && cap <= ROOM_MAX_PLAYERS)) {
      return { stored: null, out: [], alarmAt: null, error: { code: "room_error", message: "\u4EBA\u6570\u304C\u7BC4\u56F2\u5916\u3067\u3059" } };
    }
    const room2 = createRoom({ code: info.code, hostId: userId, hostName: info.name, capacity: cap, seed: info.seed, turnTimeoutMs: 45e3 });
    const s2 = { room: room2, secrets: { [userId]: secretHash }, seen: {}, graceUntil: {}, expireAt: idleExpire(room2, now) };
    return finish2(s2, [stateAll()], now);
  }
  if (info.create) {
    return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: "room_error", message: "\u305D\u306E\u30B3\u30FC\u30C9\u306F\u4F7F\u308F\u308C\u3066\u3044\u307E\u3059\u3002\u3082\u3046\u4E00\u5EA6\u3064\u304F\u3063\u3066\u304F\u3060\u3055\u3044" } };
  }
  const known = stored.secrets[userId];
  if (known !== void 0 && known !== secretHash) {
    return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: "bad_secret", message: "\u3053\u306E\u5E2D\u306F\u3001\u5225\u306E\u7AEF\u672B\u3067\u4F7F\u308F\u308C\u3066\u3044\u307E\u3059" } };
  }
  let room = stored.room;
  const secrets = { ...stored.secrets };
  const graceUntil = { ...stored.graceUntil };
  try {
    if (room.seats.some((s2) => s2.userId === userId)) {
      room = setConnected(room, userId, true);
      delete graceUntil[userId];
    } else {
      room = joinRoom(room, userId, info.name);
      secrets[userId] = secretHash;
    }
  } catch (e) {
    if (e instanceof RoomError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: "room_error", message: e.message } };
    throw e;
  }
  const s = { ...stored, room, secrets, graceUntil, expireAt: idleExpire(room, now) };
  return finish2(s, [stateAll()], now);
}
__name(handleHello, "handleHello");
function handleMessage(stored, userId, msg, now) {
  if (msg.t === "ping") return { stored, out: [{ to: { userId }, msg: { t: "pong" } }], alarmAt: alarmFor(stored, now) };
  if (msg.t === "hello") return { stored, out: [], alarmAt: alarmFor(stored, now) };
  const reqId = msg.reqId;
  if (stored.seen[userId]?.includes(reqId)) {
    return { stored, out: [{ to: { userId }, msg: { t: "ack", reqId, version: stored.room.version } }], alarmAt: alarmFor(stored, now) };
  }
  try {
    let room = stored.room;
    let steps = [];
    let gone = false;
    switch (msg.t) {
      case "ready":
        room = setReady(room, userId, msg.ready);
        break;
      case "capacity":
        room = setCapacity(room, userId, msg.capacity);
        break;
      case "role":
        room = setRole(room, userId, msg.role);
        break;
      case "start":
        room = startRoom(room, userId, now);
        break;
      case "leave": {
        if (room.status === "lobby") {
          const next = leaveRoom(room, userId);
          if (next === null) gone = true;
          else room = next;
        } else {
          room = setConnected(room, userId, false);
        }
        break;
      }
      case "back":
        room = returnToPlay(room, userId);
        break;
      case "action": {
        const r = roomAction(room, userId, msg.action, now);
        room = r.room;
        steps = r.steps;
        break;
      }
    }
    if (gone) return { stored: null, out: [], alarmAt: null, destroy: true };
    const seen = { ...stored.seen, [userId]: [...stored.seen[userId] ?? [], reqId].slice(-SEEN_KEEP) };
    const graceUntil = { ...stored.graceUntil };
    if (msg.t === "leave") {
      if (room.status === "lobby") {
        delete graceUntil[userId];
        const secrets = { ...stored.secrets };
        delete secrets[userId];
        const s2 = { ...stored, room, secrets, seen, graceUntil, expireAt: idleExpire(room, now) };
        return finish2(s2, [{ to: { userId }, msg: { t: "ack", reqId, version: room.version } }, stateAll()], now);
      }
      graceUntil[userId] = now + GRACE_MS;
    }
    const s = { ...stored, room, seen, graceUntil, expireAt: idleExpire(room, now) };
    const out = [];
    if (steps.length) out.push({ to: "all", msg: { t: "steps", steps: stepViews(steps), version: room.version } });
    out.push({ to: { userId }, msg: { t: "ack", reqId, version: room.version } }, stateAll());
    return finish2(s, out, now);
  } catch (e) {
    if (e instanceof RoomError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: "room_error", message: e.message, reqId } };
    if (e instanceof SessionError) return { stored, out: [], alarmAt: alarmFor(stored, now), error: { code: "session_error", message: e.message, reqId } };
    throw e;
  }
}
__name(handleMessage, "handleMessage");
function handleDisconnect(stored, userId, now) {
  if (!stored.room.seats.some((s2) => s2.userId === userId) || !stored.room.seats.find((s2) => s2.userId === userId)?.connected) {
    return { stored, out: [], alarmAt: alarmFor(stored, now) };
  }
  const room = setConnected(stored.room, userId, false);
  const s = { ...stored, room, graceUntil: { ...stored.graceUntil, [userId]: now + GRACE_MS } };
  return finish2(s, [stateAll()], now);
}
__name(handleDisconnect, "handleDisconnect");
function handleAlarm(stored, now) {
  let room = stored.room;
  const out = [];
  let graceUntil = { ...stored.graceUntil };
  let secrets = stored.secrets;
  let expireAt = stored.expireAt;
  if (room.status === "lobby") {
    for (const seat of room.seats) {
      const g = graceUntil[seat.userId];
      if (!seat.connected && (g === void 0 || now >= g)) {
        const next = leaveRoom(room, seat.userId);
        delete graceUntil[seat.userId];
        secrets = { ...secrets };
        delete secrets[seat.userId];
        if (next === null) return { stored: null, out: [], alarmAt: null, destroy: true };
        room = next;
        out.push(stateAll());
      }
    }
  } else if (room.status === "playing") {
    if (!room.seats.some((s) => s.connected) && room.seats.every((s) => (graceUntil[s.userId] ?? 0) <= now)) {
      expireAt = Math.min(expireAt, now + ABANDON_MS);
    } else {
      const view = { ...room, seats: room.seats.map((s) => ({ ...s, connected: s.connected || (graceUntil[s.userId] ?? 0) > now })) };
      const t = tickRoom(view, now);
      if (t.room !== view) {
        room = { ...t.room, seats: t.room.seats.map((s, i) => ({ ...s, connected: room.seats[i].connected })) };
        if (t.steps.length) out.push({ to: "all", msg: { t: "steps", steps: stepViews(t.steps), version: room.version } });
        out.push(stateAll());
        expireAt = idleExpire(room, now);
      }
    }
  }
  if (now >= expireAt) return { stored: null, out: [], alarmAt: null, destroy: true };
  graceUntil = Object.fromEntries(Object.entries(graceUntil).filter(([, g]) => g > now || !room.seats.find((s) => s.connected)));
  return finish2({ ...stored, room, secrets, graceUntil, expireAt }, out, now);
}
__name(handleAlarm, "handleAlarm");

// worker/roomDO.ts
var RATE_WINDOW_MS = 1e4;
var RATE_MAX = 40;
var RoomDO = class extends DurableObject {
  static {
    __name(this, "RoomDO");
  }
  rate = /* @__PURE__ */ new WeakMap();
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    this.ctx.acceptWebSocket(server);
    const att = { code: request.headers.get("x-room-code") ?? "", userId: null };
    server.serializeAttachment(att);
    return new Response(null, { status: 101, webSocket: client });
  }
  send(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
    }
  }
  socketsOf(userId) {
    const list = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a?.userId && (userId === "all" || a.userId === userId)) list.push({ ws, userId: a.userId });
    }
    return list;
  }
  async apply(r) {
    if (r.destroy) {
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
    } else if (r.stored) {
      await this.ctx.storage.put("s", r.stored);
      if (r.alarmAt !== null) await this.ctx.storage.setAlarm(r.alarmAt);
    }
    for (const o of r.out) {
      const targets = o.to === "all" ? this.socketsOf("all") : this.socketsOf(o.to.userId);
      for (const t of targets) {
        if ("state" in o) {
          if (r.stored) this.send(t.ws, { t: "state", view: roomView(r.stored.room, t.userId) });
        } else {
          this.send(t.ws, o.msg);
        }
      }
    }
    if (r.destroy) for (const ws of this.ctx.getWebSockets()) ws.close(1e3, "\u90E8\u5C4B\u304C\u9589\u3058\u307E\u3057\u305F");
  }
  async webSocketMessage(ws, data) {
    if (typeof data !== "string") return;
    const now = Date.now();
    const hits = (this.rate.get(ws) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
    hits.push(now);
    this.rate.set(ws, hits);
    if (hits.length > RATE_MAX) {
      this.send(ws, { t: "error", code: "rate_limited", message: "\u9001\u308A\u3059\u304E\u3067\u3059\u3002\u5C11\u3057\u5F85\u3063\u3066\u304F\u3060\u3055\u3044" });
      if (hits.length > RATE_MAX * 2) ws.close(1008, "rate limited");
      return;
    }
    const msg = parseClientMessage(data);
    if (!msg) {
      this.send(ws, { t: "error", code: "bad_message", message: "\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" });
      return;
    }
    const att = ws.deserializeAttachment();
    try {
      if (msg.t === "hello") {
        if (att.userId) return;
        const bytes = new TextEncoder().encode(`${msg.userId}:${msg.secret}`);
        const secretHash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
        const stored2 = await this.ctx.storage.get("s") ?? null;
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        const r2 = handleHello(stored2, { code: att.code, userId: msg.userId, secretHash, name: msg.name, create: msg.create, seed }, now);
        if (r2.error) {
          this.send(ws, { t: "error", code: r2.error.code, message: r2.error.message });
          ws.close(1008, r2.error.code);
          return;
        }
        ws.serializeAttachment({ code: att.code, userId: msg.userId });
        for (const other of this.socketsOf(msg.userId)) if (other.ws !== ws) other.ws.close(4e3, "\u5225\u306E\u63A5\u7D9A\u306B\u5207\u308A\u66FF\u308F\u308A\u307E\u3057\u305F");
        await this.apply(r2);
        return;
      }
      if (!att.userId) {
        this.send(ws, { t: "error", code: "not_hello", message: "\u5148\u306B\u53C2\u52A0\u306E\u624B\u7D9A\u304D\u304C\u5FC5\u8981\u3067\u3059" });
        return;
      }
      const stored = await this.ctx.storage.get("s") ?? null;
      if (!stored) {
        this.send(ws, { t: "error", code: "no_room", message: "\u90E8\u5C4B\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
        ws.close(1008, "no_room");
        return;
      }
      const r = handleMessage(stored, att.userId, msg, now);
      if (r.error) {
        this.send(ws, { t: "error", code: r.error.code, message: r.error.message, reqId: r.error.reqId });
        return;
      }
      await this.apply(r);
    } catch (e) {
      console.error("roomDO message error", e);
      this.send(ws, { t: "error", code: "internal", message: "\u30B5\u30FC\u30D0\u30FC\u3067\u30A8\u30E9\u30FC\u304C\u8D77\u304D\u307E\u3057\u305F" });
    }
  }
  async webSocketClose(ws) {
    const att = ws.deserializeAttachment();
    if (!att?.userId) return;
    if (this.socketsOf(att.userId).some((o) => o.ws !== ws && o.ws.readyState === WebSocket.OPEN)) return;
    const stored = await this.ctx.storage.get("s");
    if (!stored) return;
    await this.apply(handleDisconnect(stored, att.userId, Date.now()));
  }
  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
  async alarm() {
    const stored = await this.ctx.storage.get("s");
    if (!stored) return;
    await this.apply(handleAlarm(stored, Date.now()));
  }
};

// worker/index.ts
var CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const m = /^\/api\/rooms\/([^/]+)\/ws$/.exec(url.pathname);
    if (m) {
      const code = m[1].toUpperCase();
      if (!CODE_RE.test(code)) return new Response("bad room code", { status: 400 });
      if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return new Response("forbidden origin", { status: 403 });
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      const headers = new Headers(request.headers);
      headers.set("x-room-code", code);
      return stub.fetch(new Request(request, { headers }));
    }
    if (url.pathname.startsWith("/api/")) return new Response("not found", { status: 404 });
    return env.ASSETS.fetch(request);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-JYoRRp/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-JYoRRp/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  RoomDO,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
