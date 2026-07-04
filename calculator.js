/**
 * 四柱推命 命式計算エンジン
 * (c) 2026 Antigravity
 */

// 定数定義
const JIKKAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const JUUNISHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 五行の定義
const GOGYOU = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
    '寅': '木', '卯': '木',
    '巳': '火', '午': '火',
    '申': '金', '酉': '金',
    '亥': '水', '子': '水',
    '辰': '土', '戌': '土', '丑': '土', '未': '土'
};

// 五行の色（UI用のカラーコード）
const GOGYOU_COLORS = {
    '木': '#10b981', // 緑
    '火': '#ef4444', // 赤
    '土': '#f59e0b', // 黄・アンバー
    '金': '#e2e8f0', // 白・グレー
    '水': '#3b82f6'  // 青
};

// 蔵干（地支が持つ十干の本気・中気・余気の設定：一般的な配分）
// [地支] : { 本気, 中気, 余気 }
const ZOUKAN_TABLE = {
    '子': { '本気': '癸', '余気': '壬' },
    '丑': { '本気': '己', '中気': '辛', '余気': '癸' },
    '寅': { '本気': '甲', '中気': '丙', '余気': '戊' },
    '卯': { '本気': '乙', '余気': '甲' },
    '辰': { '本気': '戊', '中気': '癸', '余気': '乙' },
    '巳': { '本気': '丙', '中気': '庚', '余気': '戊' },
    '午': { '本気': '丁', '余気': '己' },
    '未': { '本気': '己', '中気': '乙', '余気': '丁' },
    '申': { '本気': '庚', '中気': '壬', '余気': '戊' },
    '酉': { '本気': '辛', '余気': '庚' },
    '戌': { '本気': '戊', '中気': '辛', '余気': '丁' },
    '亥': { '本気': '壬', '中気': '甲' }
};

// 通変星の割り出し（日干を基準とし、対象の干との関係で決定）
// [日干の五行・陰陽] と [対象の五行・陰陽] から導出するマトリクス
// 比肩(同五行/同陰陽), 劫財(同五行/異陰陽)
// 食神(日干が漏らす/同陰陽), 傷官(日干が漏らす/異陰陽)
// 偏財(日干が剋す/同陰陽), 正財(日干が剋す/異陰陽)
// 偏官(日干を剋す/同陰陽), 正官(日干を剋す/異陰陽)
// 偏印(日干を生む/同陰陽), 印綬(日干を生む/異陰陽)
const TUUHENSEI_RELATIONS = {
    // 比劫
    '同・同': '比肩',
    '同・異': '劫財',
    // 食傷 (日干が相手を生み出す)
    '生出・同': '食神',
    '生出・異': '傷官',
    // 財星 (日干が相手をコントロール・剋する)
    '剋出・同': '偏財',
    '剋出・異': '正財',
    // 官星 (相手が日干をコントロール・剋する)
    '剋入・同': '偏官',
    '剋入・異': '正官',
    // 印星 (相手が日干を生み出す)
    '生入・同': '偏印',
    '生入・異': '印綬'
};

// 十干の陰陽（true: 陽/プラス, false: 陰/マイナス）
const INYOU_JIKKAN = {
    '甲': true, '乙': false, '丙': true, '丁': false, '戊': true,
    '己': false, '庚': true, '辛': false, '壬': true, '癸': false
};

// 五行の関係性定義
const GOGYOU_RELATIONS = {
    '木': { '生出': '火', '剋出': '土', '生入': '水', '剋入': '金' },
    '火': { '生出': '土', '剋出': '金', '生入': '木', '剋入': '水' },
    '土': { '生出': '金', '剋出': '水', '生入': '火', '剋入': '木' },
    '金': { '生出': '水', '剋出': '木', '生入': '土', '剋入': '火' },
    '水': { '生出': '木', '剋出': '火', '生入': '金', '剋入': '土' }
};

// 十二運星のテーブル
// [日干][地支] -> 十二運
const JUUNIUN_TABLE = {
    '甲': { '亥': '長生', '子': '沐浴', '丑': '冠帯', '寅': '建禄', '卯': '帝旺', '辰': '衰', '巳': '病', '午': '死', '未': '墓', '申': '絶', '酉': '胎', '戌': '養' },
    '乙': { '午': '長生', '巳': '沐浴', '辰': '冠帯', '卯': '建禄', '寅': '帝旺', '丑': '衰', '子': '病', '亥': '死', '戌': '墓', '酉': '絶', '申': '胎', '未': '養' },
    '丙': { '寅': '長生', '卯': '沐浴', '辰': '冠帯', '巳': '建禄', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '絶', '子': '胎', '丑': '養' },
    '丁': { '酉': '長生', '申': '沐浴', '未': '冠帯', '午': '建禄', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '絶', '亥': '胎', '戌': '養' },
    '戊': { '寅': '長生', '卯': '沐浴', '辰': '冠帯', '巳': '建禄', '午': '帝旺', '未': '衰', '申': '病', '酉': '死', '戌': '墓', '亥': '絶', '子': '胎', '丑': '養' },
    '己': { '酉': '長生', '申': '沐浴', '未': '冠帯', '午': '建禄', '巳': '帝旺', '辰': '衰', '卯': '病', '寅': '死', '丑': '墓', '子': '絶', '亥': '胎', '戌': '養' },
    '庚': { '巳': '長生', '午': '沐浴', '未': '冠帯', '申': '建禄', '酉': '帝旺', '戌': '衰', '亥': '病', '子': '死', '丑': '墓', '寅': '絶', '卯': '胎', '辰': '養' },
    '辛': { '子': '長生', '亥': '沐浴', '戌': '冠帯', '酉': '建禄', '申': '帝旺', '未': '衰', '午': '病', '巳': '死', '辰': '墓', '卯': '絶', '寅': '胎', '丑': '養' },
    '壬': { '申': '長生', '酉': '沐浴', '戌': '冠帯', '亥': '建禄', '子': '帝旺', '丑': '衰', '寅': '病', '卯': '死', '辰': '墓', '巳': '絶', '午': '胎', '未': '養' },
    '癸': { '卯': '長生', '寅': '沐浴', '丑': '冠帯', '子': '建禄', '亥': '帝旺', '戌': '衰', '酉': '病', '申': '死', '未': '墓', '午': '絶', '巳': '胎', '辰': '養' }
};

/**
 * 二十四節気（節入り日）の簡易天文学的計算
 * 四柱推命の月境界を算出するために使用
 * @param {number} year 
 * @param {number} month (1-12)
 * @returns {number} 節入り日 (Day)
 */
function getSetsuiriDay(year, month) {
    // 各月の節気基準定数
    // 1月: 小寒, 2月: 立春, 3月: 啓蟄, 4月: 清明, 5月: 立夏, 6月: 芒種
    // 7月: 小暑, 8月: 立秋, 9月: 白露, 10月: 寒露, 11月: 立冬, 12月: 大雪
    const setsuiriBase = [
        5.4055,  // 1月 小寒
        4.2856,  // 2月 立春
        5.6937,  // 3月 啓蟄
        4.845,   // 4月 清明
        5.792,   // 5月 立夏
        5.952,   // 6月 芒種
        7.172,   // 7月 小暑
        7.812,   // 8月 立秋
        7.942,   // 9月 白露
        8.382,   // 10月 寒露
        7.532,   // 11月 立冬
        7.252    // 12月 大雪
    ];
    
    const idx = month - 1;
    const base = setsuiriBase[idx];
    
    // 簡易近似式による太陽位置からの計算
    const yDiff = year - 1900;
    const leapAdjustment = Math.floor(yDiff / 4);
    
    // 節入りのおよその日付
    let day = Math.floor(base + 0.242194 * yDiff - leapAdjustment);
    
    // 例外的な年次補正 (2000年代以降のズレ補正)
    if (year >= 2000) {
        // 近似精度の微調整
        if (month === 2) {
            // 2000年以降の立春は基本的に2月3日か4日
            const val = 4.8693 + 0.24271 * (year - 2000) - Math.floor((year - 2000) / 4);
            day = Math.floor(val);
        }
    }
    
    return day;
}

/**
 * 通変星を計算する
 * @param {string} nikkan 日干 (基準)
 * @param {string} targetKan 比較する干
 * @returns {string} 通変星の名称
 */
function getTuuhensei(nikkan, targetKan) {
    if (!nikkan || !targetKan) return '';
    if (nikkan === targetKan) return '比肩';

    const baseGogyou = GOGYOU[nikkan];
    const targetGogyou = GOGYOU[targetKan];
    const baseInyou = INYOU_JIKKAN[nikkan];
    const targetInyou = INYOU_JIKKAN[targetKan];

    const isSameInyou = baseInyou === targetInyou;
    const inyouKey = isSameInyou ? '同' : '異';

    if (baseGogyou === targetGogyou) {
        return TUUHENSEI_RELATIONS[`同・${inyouKey}`];
    }

    const relation = GOGYOU_RELATIONS[baseGogyou];
    if (relation.生出 === targetGogyou) {
        return TUUHENSEI_RELATIONS[`生出・${inyouKey}`];
    } else if (relation.剋出 === targetGogyou) {
        return TUUHENSEI_RELATIONS[`剋出・${inyouKey}`];
    } else if (relation.生入 === targetGogyou) {
        return TUUHENSEI_RELATIONS[`生入・${inyouKey}`];
    } else if (relation.剋入 === targetGogyou) {
        return TUUHENSEI_RELATIONS[`剋入・${inyouKey}`];
    }

    return '';
}

/**
 * 主要な蔵干を取得する (本気を採用)
 * @param {string} jishi 地支
 * @returns {string} 十干
 */
function getZoukan(jishi) {
    return ZOUKAN_TABLE[jishi] ? ZOUKAN_TABLE[jishi].本気 : '';
}

/**
 * 十二運星を取得する
 * @param {string} nikkan 日干
 * @param {string} jishi 地支
 * @returns {string} 十二運星名
 */
function getJuuniun(nikkan, jishi) {
    if (JUUNIUN_TABLE[nikkan] && JUUNIUN_TABLE[nikkan][jishi]) {
        return JUUNIUN_TABLE[nikkan][jishi];
    }
    return '';
}

/**
 * 指定された日時の四柱推命命式を計算する
 * @param {number} year 
 * @param {number} month 
 * @param {number} day 
 * @param {number|null} hour (null の場合は時柱なし)
 * @returns {object} 算出された命式データ
 */
function calculateMeishiki(year, month, day, hour = null) {
    // 1. 入力値の標準化と節入り判定
    const setsuiriDay = getSetsuiriDay(year, month);
    const isAfterSetsuiri = day >= setsuiriDay;

    // 年の境界判定 (立春は2月の節入り)
    let calcYear = year;
    let setsuiriFeb = getSetsuiriDay(year, 2);
    if (month < 2 || (month === 2 && day < setsuiriFeb)) {
        calcYear = year - 1; // 節入り前は前年扱い
    }

    // 月のインデックス (節入り前なら前月扱い)
    let calcMonthIdx = month; // 1-12
    if (!isAfterSetsuiri) {
        calcMonthIdx = month - 1;
        if (calcMonthIdx === 0) {
            calcMonthIdx = 12;
        }
    }

    // 2. 年柱の干支計算
    // 基準: 1900年の立春以降は「庚子」 (干支番号37, 庚=6, 子=0)
    const yearDiff = calcYear - 1900;
    const nenchuuKanIdx = (6 + (yearDiff % 10) + 10) % 10;
    const nenchuuShiIdx = (0 + (yearDiff % 12) + 12) % 12;
    const nenchuuKan = JIKKAN[nenchuuKanIdx];
    const nenchuuShi = JUUNISHI[nenchuuShiIdx];

    // 3. 月柱の干支計算
    // 月支は固定 (2月節入り後は寅、3月は卯...)
    // 立春(2月)を1番目として計算できるようにシフト
    // 2月=寅(2), 3月=卯(3) ... 12月=子(0), 1月=丑(1)
    const getGetsushiIdx = (m) => {
        // m: 1-12
        const mapping = {
            2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10, 11: 11, 12: 0, 1: 1
        };
        return mapping[m];
    };
    const getsushiShiIdx = getGetsushiIdx(calcMonthIdx);
    const getsushiShi = JUUNISHI[getsushiShiIdx];

    // 月干は年干によって決定 (甲己年は丙寅から順に...)
    const gettsushiKanStartIdx = {
        '甲': 2, '己': 2, // 丙寅から
        '乙': 4, '庚': 4, // 戊寅から
        '丙': 6, '辛': 6, // 庚寅から
        '丁': 9, '壬': 9, // 壬寅から (壬=8だけど子丑スタート調整で9)
        '戊': 0, '癸': 0  // 甲寅から
    };
    
    // 年干に基づくスタート十干インデックス
    let startKanIdx = 0;
    if (['甲', '己'].includes(nenchuuKan)) startKanIdx = 2; // 丙
    else if (['乙', '庚'].includes(nenchuuKan)) startKanIdx = 4; // 戊
    else if (['丙', '辛'].includes(nenchuuKan)) startKanIdx = 6; // 庚
    else if (['丁', '壬'].includes(nenchuuKan)) startKanIdx = 8; // 壬
    else startKanIdx = 0; // 甲

    // 2月(寅)を起点としたシフト分を加算
    // 寅(2月)はシフト0、卯(3月)は1...
    const monthShift = (getsushiShiIdx - 2 + 12) % 12;
    const getsushiKanIdx = (startKanIdx + monthShift) % 10;
    const getsushiKan = JIKKAN[getsushiKanIdx];

    // 4. 日柱の干支計算
    // 基準: 1900年1月1日は 「甲戌」 (甲=0, 戌=10)
    const baseDate = new Date(1900, 0, 1);
    const targetDate = new Date(year, month - 1, day);
    const diffTime = targetDate.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const nikkanKanIdx = (0 + (diffDays % 10) + 10) % 10;
    const nikkanShiIdx = (10 + (diffDays % 12) + 12) % 12;
    const nikkanKan = JIKKAN[nikkanKanIdx];
    const nikkanShi = JUUNISHI[nikkanShiIdx];

    // 5. 時柱の干支計算
    let jichuuKan = null;
    let jichuuShi = null;

    if (hour !== null) {
        // 時支の決定 (23:00-1:00=子, 1:00-3:00=丑...)
        const getJishiIdx = (h) => {
            if (h >= 23 || h < 1) return 0; // 子
            return Math.floor((h - 1) / 2) + 1;
        };
        const jishiIdx = getJishiIdx(hour);
        jichuuShi = JUUNISHI[jishiIdx];

        // 時干の決定 (日干から決定。甲己日は甲子から順に...)
        let startJiKanIdx = 0;
        if (['甲', '己'].includes(nikkanKan)) startJiKanIdx = 0; // 甲
        else if (['乙', '庚'].includes(nikkanKan)) startJiKanIdx = 2; // 丙
        else if (['丙', '辛'].includes(nikkanKan)) startJiKanIdx = 4; // 戊
        else if (['丁', '壬'].includes(nikkanKan)) startJiKanIdx = 6; // 庚
        else startJiKanIdx = 8; // 壬

        const jichuuKanIdx = (startJiKanIdx + jishiIdx) % 10;
        jichuuKan = JIKKAN[jichuuKanIdx];
    }

    // 6. 各種補助星の計算 (蔵干・通変星・十二運星)
    // 蔵干
    const nenchuuZoukan = getZoukan(nenchuuShi);
    const getsuchuuZoukan = getZoukan(getsushiShi);
    const nikkanZoukan = getZoukan(nikkanShi);
    const jichuuZoukan = jichuuShi ? getZoukan(jichuuShi) : null;

    // 通変星 (日干を基準に他柱の天干・蔵干を比較)
    const nenchuuTuuhen = getTuuhensei(nikkanKan, nenchuuKan);
    const nenchuuZoukanTuuhen = getTuuhensei(nikkanKan, nenchuuZoukan);

    const getsuchuuTuuhen = getTuuhensei(nikkanKan, getsushiKan);
    const getsuchuuZoukanTuuhen = getTuuhensei(nikkanKan, getsuchuuZoukan);

    const nikkanZoukanTuuhen = getTuuhensei(nikkanKan, nikkanZoukan); // 日支蔵干通変

    const jichuuTuuhen = jichuuKan ? getTuuhensei(nikkanKan, jichuuKan) : null;
    const jichuuZoukanTuuhen = jichuuZoukan ? getTuuhensei(nikkanKan, jichuuZoukan) : null;

    // 十二運星 (日干と他地支)
    const nenchuuJuuniun = getJuuniun(nikkanKan, nenchuuShi);
    const getsuchuuJuuniun = getJuuniun(nikkanKan, getsushiShi);
    const nikkanJuuniun = getJuuniun(nikkanKan, nikkanShi);
    const jichuuJuuniun = jichuuShi ? getJuuniun(nikkanKan, jichuuShi) : null;

    // 7. 五行バランスの集計 (天干・地支・蔵干から算出)
    const gogyouCounts = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    
    // 対象にする干支のリスト
    const allKans = [
        nenchuuKan, nenchuuShi, nenchuuZoukan,
        getsushiKan, getsushiShi, getsuchuuZoukan,
        nikkanKan, nikkanShi, nikkanZoukan
    ];
    if (jichuuKan) allKans.push(jichuuKan);
    if (jichuuShi) allKans.push(jichuuShi);
    if (jichuuZoukan) allKans.push(jichuuZoukan);

    allKans.forEach(k => {
        if (k && GOGYOU[k]) {
            gogyouCounts[GOGYOU[k]] += 1;
        }
    });

    return {
        input: { year, month, day, hour, setsuiriDay },
        pillars: {
            year: { kan: nenchuuKan, shi: nenchuuShi, zoukan: nenchuuZoukan, tuuhen: nenchuuTuuhen, zoukanTuuhen: nenchuuZoukanTuuhen, juuniun: nenchuuJuuniun },
            month: { kan: getsushiKan, shi: getsushiShi, zoukan: getsuchuuZoukan, tuuhen: getsuchuuTuuhen, zoukanTuuhen: getsuchuuZoukanTuuhen, juuniun: getsuchuuJuuniun },
            day: { kan: nikkanKan, shi: nikkanShi, zoukan: nikkanZoukan, tuuhen: '日干 (自分)', zoukanTuuhen: nikkanZoukanTuuhen, juuniun: nikkanJuuniun },
            time: jichuuKan ? { kan: jichuuKan, shi: jichuuShi, zoukan: jichuuZoukan, tuuhen: jichuuTuuhen, zoukanTuuhen: jichuuZoukanTuuhen, juuniun: jichuuJuuniun } : null
        },
        gogyou: gogyouCounts
    };
}
