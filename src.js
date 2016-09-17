function bookmarklet_google_calendar_add(selected, NOW, open, debug) {
    //必須空白はスペース２つ, < > は省略可の意味
    const WEEK_ = '<[（\\(][月火水木金土日][\\)）]>';
    const TO_ = '(?:から|～|-|－)';
    const TIME_JA = `(D2)時 <(D2|半)分? <D2秒>>`;
    const TIME_EN = `(D2)[:：](D2)<[:：]D2>`;
    const REG_DATES = [
        `<(D4)年> (D2)月 (D2)日 ${WEEK_} `,
        `<(D4)/>(D2)/(D2)(?: ${WEEK_} |  )`,
        `(D4)-(D2)-(D2)(?: ${WEEK_} |  )`,
        `<(D4)\\.>(D2)\\.(D2)(?: ${WEEK_} |  )`,
    ];
    const REG_TIMES = [
        `(D2)() ${TO_} (D2)() 時`,
        `${TIME_JA} <${TO_} ${TIME_JA}>`,
        `${TIME_EN} <${TO_} ${TIME_EN}>`,
        `()()()()`,
    ];
    let reg_dts = [];
    REG_DATES.forEach(d => {
        REG_TIMES.forEach(t => {
            reg_dts.push(d + t);
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
            reg = reg.replace(/  /g, '[\\s　]+').replace(/ /g, '[\\s　]*');
            reg = reg.replace(/\//g, '\\/').replace(/</g, '(?:').replace(/>/g, ')?');
            reg = reg.replace(/\bD2\b/g, '\\d{1,2}').replace(/\bD4\b/g, '\\d{4}');
            reg = `\\s*${reg}\\s*`;
            if (debug) { debug(reg); }
            reg = new RegExp(reg, 'g');
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
