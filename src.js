function bookmarklet_google_calendar_add(selected, NOW, open, debug) {
    //正規表現をメンテしやすく書けるようにするもの
    //  空白1個は省略可の空白
    //  空白2個は省略不可の空白
    //  < > はその範囲が将来可
    class RegExpSweet {
        constructor(cbDebug) {
            this.replaces = [];
            this.cbDebug = cbDebug;
            this.addSyntax('（', '[（\\(]').addSyntax('）', '[\\)）]');
            this.addSyntax('  ', '[\\s　]+').addSyntax(' ', '[\\s　]*');
            this.addSyntax('<', '(?:').addSyntax('>', ')?');
        }
        addSyntax(search, replace) {
            if (!search.match(/\W/)) { search = `\\b${search}\\b`; }
            search = new RegExp(search, 'g');
            this.replaces.unshift({search, replace});
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
    //必須空白はスペース２つ, < > は省略可の意味
    const dateRegExp = new RegExpSweet(debug);
    dateRegExp.addSyntax('WEEK', '<（[月火水木金土日]）>');
    dateRegExp.addSyntax('TO', '(?:から|～|-|－)');
    dateRegExp.addSyntax('D2', '\\d{1,2}');
    dateRegExp.addSyntax('D4', '\\d{4}');
    dateRegExp.addSyntax('TIME_JA', '(D2)時 <(D2分|半) <D2秒>>');
    dateRegExp.addSyntax('TIME_EN', '(D2)[:：](D2)<[:：]D2>');
    const REG_DATES = [
        `<(D4)年> (D2)月 (D2)日 WEEK `,
        `<(D4)/>(D2)/(D2)(?: WEEK |  )`,
        `(D4)-(D2)-(D2)(?: WEEK |  )`,
        `<(D4)\\.>(D2)\\.(D2)(?: WEEK |  )`,
    ];
    const REG_TIMES = [
        `(D2)() TO (D2)() 時`,
        `TIME_JA <TO TIME_JA>`,
        `TIME_EN <TO TIME_EN>`,
        `()()()()`,
    ];
    let reg_dts = [];
    REG_DATES.forEach(d => {
        REG_TIMES.forEach(t => {
            let reg = dateRegExp.toRegExp(`\\s*${d + t}\\s*`);
            reg_dts.push(reg);
        });
    });
    const zf = n => ('0' + n).slice(-2);
    const addDateYmd = (y, m, d) => {
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
    const addDateYmdhi = (y, m, d, h, i) => {
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        let dt = new Date(`${y}-${m}-${d} ${h}:${i}`);
        if (isNaN(dt)) { //時間とっても成立か
            return addDateYmd(y, m, d);
        }
        return {
            h: true,
            str: dt.toISOString().replace(/(:|-|\.\d+)/g, '')
        };
    };
    let date1 = null, date2 = null;
    const addDate = (...args) => {
        if (date2) { return ''; }
        let [a, y, m, d, h, i, h2, i2] = args;
        y = y || NOW.getFullYear();
        let obj;
        if (h) {
            obj = addDateYmdhi(y, m, d, h, i);
        } else {
            obj = addDateYmd(y, m, d);
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
            addDate(a, y, m, d, h2, i2);
        }
        return '';
    };
    let _execRegsEnd;
    const execRegs = (selected, regs, cb4replace) => {
        _execRegsEnd = false;
        regs.forEach(reg => {
            if (_execRegsEnd) { return; }
            let selected2 = selected.replace(reg, cb4replace).trim();
            if (selected !== selected2) {
                _execRegsEnd = true;
                selected = selected2;
            }
        });
        return selected;
    };
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    let details = selected.trim();
    selected = selected.replace(/\s+/g,' ').trim();
    selected = execRegs(selected, reg_dts, addDate);
    let url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&text=' + encodeURIComponent(selected) +
        '&details=' + encodeURIComponent(details);
    if (date1) {
        if (!date2) { addDate(...date1.args); }
        url += '&dates=' + date1.str + '/' + date2.str;
    }
    open(url);
    return [selected, (date1 ? date1.str + '/' + date2.str : '')];
}
