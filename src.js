function bookmarkletToAddToGoogleCalendar(selected, open, NOW) {
    NOW = NOW || new Date();
    //正規表現をメンテしやすく書けるようにするもの
    //  空白1個は省略可の空白
    //  空白2個は省略不可の空白
    //  < > はその範囲が将来可
    class RegExpSweet {
        constructor() {
            this.replaces = [];
        }
        addSyntax(replacements) {
            for (let search of Object.keys(replacements)) {
                let replace = replacements[search];
                if (search.match(/^\w+\z/)) { search = `\\b${search}\\b`; }
                search = new RegExp(search, 'g');
                this.replaces.unshift({search, replace});
            }
            return this;
        }
        toRegExp(regExpStr, flags) {
            for (let a of this.replaces) {
                regExpStr = regExpStr.replace(a.search, a.replace);
            }
            return new RegExp(regExpStr, flags || 'g');
        }
    }
    const reSweetDate = new RegExpSweet();
    reSweetDate.addSyntax({'（': '[（\\(]', '）': '[\\)）]'});
    reSweetDate.addSyntax({' ': '\\s*'});
    reSweetDate.addSyntax({'  ': '\\s+'});
    reSweetDate.addSyntax({'<': '(?:', '>': ')?'});
    reSweetDate.addSyntax({
        WEEK: '（[月火水木金土日]）',
        TO: '(?:から|～|-|－)',
        D2: '\\d{1,2}',
        HEISEI: '(?:平成?|[Hh]\\.?)',
        SHOWA: '(?:昭和?|[Ss]\\.?)',
        YYYY: `(?:\\d{4}|(?:HEISEI|SHOWA) \\d{1,2})`,
        TIME_JA: '(D2)時 <(D2分|半) <D2秒>>',
        TIME_EN: '(D2):(D2)<:D2>',
        MONTH: `[A-Z][a-z]{2,8}`,
        D2TH: '\\d{1,2}(?:st|nd|rd|th)?'
    });
    const RE_DATES = [
        '<(YYYY)年> (D2)月 (D2)日 <WEEK> ',
        '<(YYYY)/>(D2)/(D2)(?: WEEK |\\b )',
        '(YYYY)-(D2)-(D2)(?: WEEK |\\b )',
        '<(YYYY)\\.>(D2)\\.(D2)(?: WEEK |\\b )',
        '(MONTH  D2TH  \\d{4}|D2TH  MONTH  \\d{4})()()\\b ',
    ];
    const RE_TIMES = [
        '(D2)() TO (D2)() 時',
        'TIME_JA <TO TIME_JA>',
        'TIME_EN <TO TIME_EN>',
        '()()()()',
    ];
    const normalizeI = (i) => {
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        return i;
    };
    const normalizeDateStr = (y, m, d) => {
        if (m || d) {
            return `${y}-${m}-${d}`;
        } else {
            return y.replace(/(\d+)[a-z]+/, '$1'); //th等撤去;
        }
    };
    let dtReList = [];
    for (let d of RE_DATES) {
        for (let t of RE_TIMES) {
            let re = reSweetDate.toRegExp(`\\s*${d}${t}\\s*`);
            dtReList.push(re);
        }
    }
    const zf = n => ('0' + n).slice(-2);
    const analyzeYmd = (is2nd, y, m, d) => {
        let dt = new Date(normalizeDateStr(y, m, d));
        if (isNaN(dt)) { return; }
        if (is2nd) { //日時の２つ目は翌日
            dt = new Date(dt.getTime() + 24 * 3600 * 1000);
        }
        return {
            hasHi: false,
            str: dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate())
        };
    };
    const analyzeYmdhi = (is2nd, y, m, d, h, i) => {
        i = normalizeI(i);
        let dt = new Date(normalizeDateStr(y, m, d) + ` ${h}:${i}`);
        if (isNaN(dt)) { //時間とっても成立か
            return analyzeYmd(is2nd, y, m, d);
        }
        return {
            hasHi: true,
            str: dt.toISOString().replace(/(:|-|\.\d+)/g, '')
        };
    };
    let date1 = null, date2 = null;
    const pickupDate = (...args) => {
        if (date2) { return ''; }
        let [a, y, m, d, h, i, h2, i2] = args;
        y = y || (date1 && date1.args[1]) || NOW.getFullYear();
        if (y.replace) {
            y = y.replace(reSweetDate.toRegExp('^HEISEI (\\d+)'), (a, y) => y * 1 + 1988);
            y = y.replace(reSweetDate.toRegExp('^SHOWA (\\d+)'), (a, y) => y * 1 + 1925);
        }
        let obj;
        if (h) {
            obj = analyzeYmdhi(!!date1, y, m, d, h, i);
        } else {
            obj = analyzeYmd(!!date1, y, m, d);
        }
        if (!obj) { return a; }
        if (date1 && date1.hasHi != obj.hasHi) { return a; } //前と書式が違うなら
        if (date1) {
            date2 = obj;
        } else {
            obj.args = args;
            date1 = obj;
        }
        if (h2) {
            pickupDate(a, y, m, d, h2, i2);
        }
        return '';
    };
    const execReList = (selected, reList, cb4replace) => {
        for (let re of reList) {
            let selected2 = selected.replace(re, cb4replace).trim();
            if (selected !== selected2) {
                break;
            }
        }
    };
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    let details = selected.trim();
    selected = selected.replace(/[０-９／．：－]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); //半角化
    selected = selected.replace(/　/g,' ').replace(/\s+/g,' ').trim();
    execReList(selected, dtReList, pickupDate);
    let url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(details);
    if (date1) {
        if (!date2) { pickupDate(...date1.args); }
        url += '&dates=' + date1.str + '/' + date2.str;
    }
    open(url);
    return [(date1 ? date1.str + '/' + date2.str : ''), dtReList];
}
