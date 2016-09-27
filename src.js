function bookmarkletToAddToGoogleCalendar(selected, NOW, open, debug) {
    //正規表現をメンテしやすく書けるようにするもの
    //  空白1個は省略可の空白
    //  空白2個は省略不可の空白
    //  < > はその範囲が将来可
    class RegExpSweet {
        constructor(cbDebug) {
            this.replaces = [];
            this.cbDebug = cbDebug;
            this.addSyntax({'（': '[（\\(]', '）': '[\\)）]'});
            this.addSyntax({'  ': '[\\s　]+'});
            this.addSyntax({' ': '[\\s　]*'});
            this.addSyntax({'<': '(?:', '>': ')?'});
        }
        addSyntax(replacements) {
            Object.keys(replacements).forEach(search => {
                let replace = replacements[search];
            if (!search.match(/\W/)) { search = `\\b${search}\\b`; }
            search = new RegExp(search, 'g');
            this.replaces.unshift({search, replace});
            });
            return this;
        }
        toRegExp(regExpStr, flags) {
            this.replaces.forEach(a => {
                regExpStr = regExpStr.replace(a.search, a.replace);
            });
            if (this.cbDebug) { this.cbDebug(regExpStr); }
            return new RegExp(regExpStr, flags || 'g');
        }
    }
    const reSweetDate = new RegExpSweet(debug);
    reSweetDate.addSyntax({
        WEEK: '<（[月火水木金土日]）>',
        TO: '(?:から|～|-|－)',
        D2: '\\d{1,2}',
        D4: '\\d{4}',
        TIME_JA: '(D2)時 <(D2分|半) <D2秒>>',
        TIME_EN: '(D2)[:：](D2)<[:：]D2>',
    });
    const RE_DATES = [
        `<(D4)年> (D2)月 (D2)日 WEEK `,
        `<(D4)/>(D2)/(D2)(?: WEEK |  )`,
        `(D4)-(D2)-(D2)(?: WEEK |  )`,
        `<(D4)\\.>(D2)\\.(D2)(?: WEEK |  )`,
    ];
    const RE_TIMES = [
        `(D2)() TO (D2)() 時`,
        `TIME_JA <TO TIME_JA>`,
        `TIME_EN <TO TIME_EN>`,
        `()()()()`,
    ];
    let dtReList = [];
    RE_DATES.forEach(d => {
        RE_TIMES.forEach(t => {
            let re = reSweetDate.toRegExp(`\\s*${d + t}\\s*`);
            dtReList.push(re);
        });
    });
    const zf = n => ('0' + n).slice(-2);
    const analyzeYmd = (y, m, d) => {
        let dt = new Date(`${y}-${m}-${d}`);
        if (isNaN(dt)) { return; }
        if (date1) { //日時の２つ目は翌日
            dt = new Date(dt.getTime() + 24 * 3600 * 1000);
        }
        return {
            h: false,
            str: `${y}${zf(dt.getMonth()+1)}${zf(dt.getDate())}`
        };
    };
    const analyzeYmdhi = (y, m, d, h, i) => {
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        let dt = new Date(`${y}-${m}-${d} ${h}:${i}`);
        if (isNaN(dt)) { //時間とっても成立か
            return analyzeYmd(y, m, d);
        }
        return {
            h: true,
            str: dt.toISOString().replace(/(:|-|\.\d+)/g, '')
        };
    };
    let date1 = null, date2 = null;
    const pickupDate = (...args) => {
        if (date2) { return ''; }
        let [a, y, m, d, h, i, h2, i2] = args;
        y = y || NOW.getFullYear();
        let obj;
        if (h) {
            obj = analyzeYmdhi(y, m, d, h, i);
        } else {
            obj = analyzeYmd(y, m, d);
        }
        if (!obj) { return a; }
        if (date1 && date1.h != obj.h) { return a; } //前と書式が違うなら
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
    let _execReListEnd;
    const execReList = (selected, reList, cb4replace) => {
        _execReListEnd = false;
        reList.forEach(re => {
            if (_execReListEnd) { return; }
            let selected2 = selected.replace(re, cb4replace).trim();
            if (selected !== selected2) {
                _execReListEnd = true;
            }
        });
    };
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    let details = selected.trim();
    selected = selected.replace(/\s+/g,' ').trim();
    execReList(selected, dtReList, pickupDate);
    let url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(details);
    if (date1) {
        if (!date2) { pickupDate(...date1.args); }
        url += '&dates=' + date1.str + '/' + date2.str;
    }
    open(url);
    return [(date1 ? date1.str + '/' + date2.str : '')];
}
