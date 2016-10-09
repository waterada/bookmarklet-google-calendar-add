function bookmarkletToAddToGoogleCalendar(selected, open, NOW) {
    NOW = NOW || new Date();
    class RegExpSweet {
        constructor() {
            this.replaces = [];
        }
        addSyntax(replacements) {
            for (let search of Object.keys(replacements)) {
                let replace = replacements[search];
                if (search.match(/^\w+$/)) { search = `\\b${search}\\b`; }
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
        WEEK: '（[日月火水木金土]）',
        TO: '(?:から|～|-|－)',
        D2: '\\d{1,2}',
        HEISEI: '(?:平成?|[Hh]\\.?)',
        SHOWA: '(?:昭和?|[Ss]\\.?)',
        YYYY: '(?:\\d{4}|(?:HEISEI|SHOWA) \\d{1,2})',
        TIME_JA: '(D2)時 <(D2分|半) <D2秒>>',
        TIME_EN: '(D2):(D2)<:D2>',
        MONTH: '[A-Z][a-z]{2,8}',
        D2TH: '\\d{1,2}(?:st|nd|rd|th)?'
    });
    const RE_DATES = [
        '<(YYYY)年> (D2)月 (D2)日 <WEEK> ',
        '<(YYYY)/>(D2)/(D2)(?: WEEK |\\b )',
        '<(YYYY)[.]>(D2)[.](D2)(?: WEEK |\\b )',
        '(YYYY)-(D2)-(D2)(?: WEEK |\\b )',
        '(MONTH  D2TH  \\d{4}|D2TH  MONTH  \\d{4})()()\\b ',
        '(次の次の|次の|再来週|来週|今週)? の? ([日月火水木金土])(曜日) の? ',
    ];
    const RE_TIMES = [
        '(D2)() TO (D2)() 時',
        'TIME_JA <TO TIME_JA>',
        'TIME_EN <TO TIME_EN>',
        '()()()()',
    ];
    let dtReList = [];
    for (let d of RE_DATES) {
        for (let t of RE_TIMES) {
            let re = reSweetDate.toRegExp(`\\s*${d}${t}\\s*`);
            dtReList.push(re);
        }
    }
    const normalizer = (y, m, d, h, i) => {
        if (d === '曜日') {
            let cur = NOW.getDay();
            let sel = '日月火水木金土'.indexOf(m);
            let days = sel - cur;
            if (y === '次の次の') {
                days += (cur < sel ? 7 : 14);
            } else if (y === '次の') {
                days += (cur < sel ? 0 : 7);
            } else if (y === '再来週') {
                days += 14;
            } else if (y === '来週') {
                days += 7;
            }
            let dt = new Date(NOW.getTime() + days * 24 * 3600 * 1000);
            y = dt.getFullYear();
            m = dt.getMonth() + 1;
            d = dt.getDate();
        }
        y = y || NOW.getFullYear();
        if (y.replace) {
            y = y.replace(reSweetDate.toRegExp('^HEISEI (\\d+)'), (a, y) => y * 1 + 1988);
            y = y.replace(reSweetDate.toRegExp('^SHOWA (\\d+)'), (a, y) => y * 1 + 1925);
        }
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        return [y, m, d, h, i];
    };
    class SettingDates {
        constructor(normalizer) {
            this._dates = [];
            this._normalizer = normalizer;
        }
        pickupDate(y, m, d, h, i) {
            let dates = this._dates;
            if (dates[1]) { return false; }
            y = y || (dates[0] && dates[0].dt.getFullYear());
            [y, m, d, h, i] = this._normalizer(y, m, d, h, i);
            let is2nd = !!dates[0];
            if (is2nd && !dates[0].hasHi) { h = i = null; } //前に時刻が無いなら今回も使わない
            //日付作成
            let dt;
            {
                let str;
                if (m || d) {
                    str = `${y}-${m}-${d}`;
                } else {
                    str = y.replace(/(\d+)[a-z]+/, '$1'); //th等撤去;
                }
                if (h) { str += ` ${h}:${i}`; }
                dt = new Date(str);
                if (dt.toString() === 'Invalid Date') { dt = null; }
            }
            if (h) {
                if (!dt) { //時間とっても成立か
                    return this.pickupDate(y, m, d);
                }
            } else {
                if (!dt) { return false; }
            }
            if (is2nd && !h && dates[0].hasHi) { //２つ目が時刻なしなのに１つ目が時刻ありなら１つ目を時刻なしに
                this._dates = [];
                this.appendDate(dates[0].dt, !!h);
            }
            this.appendDate(dt, !!h);
            return true;
        };
        appendDate(dt, hasHi, days) {
            if (!hasHi && this._dates[0]) { days = (days || 0) + 1; } //２つ目の日付は+1
            if (days) { dt = new Date(dt.getTime() + days * 24 * 3600 * 1000); }
            let obj = {};
            if (hasHi) {
                obj.str = dt.toISOString().replace(/(:|-|\.\d+)/g, '');
            } else {
                const zf = (n) => ('0' + n).slice(-2);
                obj.str = dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate());
            }
            obj.hasHi = hasHi;
            obj.dt = dt;
            this._dates.push(obj);
            return obj;
        }
        toString() {
            let dates = this._dates;
            if (dates.length == 0) { return ''; }
            if (dates.length == 1) { this.appendDate(dates[0].dt, dates[0].hasHi); }
            return dates[0].str + '/' + dates[1].str;
        }
    }
    let settingDates = new SettingDates(normalizer);
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    let details = selected.trim();
    selected = selected.replace(/[０-９／．：－]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); //半角化
    selected = selected.replace(/　/g,' ').replace(/\s+/g,' ').trim();
    for (let re of dtReList) {
        let foundDate = false;
        selected.replace(re, (a, y, m, d, h, i, h2, i2) => {
            let replaced = settingDates.pickupDate(y, m, d, h, i);
            if (replaced && h2) {
                settingDates.pickupDate(y, m, d, h2, i2);
            }
            foundDate = foundDate || replaced;
        });
        if (foundDate) { break; }
    }
    let dates = settingDates.toString();
    let url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(details) +
        (dates ? '&dates=' + dates : '');
    open(url);
    return [dates, dtReList];
}
