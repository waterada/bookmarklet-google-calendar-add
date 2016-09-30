function bookmarkletToAddToGoogleCalendar(selected, open, NOW) {
    NOW = NOW || new Date();
    //正規表現をメンテしやすく書けるようにするもの
    //  空白1個は省略可の空白
    //  空白2個は省略不可の空白
    //  < > はその範囲が将来可
    function RegExpSweet() {
        this.replaces = [];
        var _this = this;
        this.__proto__.addSyntax = function (replacements) {
            Object.keys(replacements).forEach(function (search) {
                var replace = replacements[search];
                if (search.match(/^\w+$/)) { search = '\\b' + search + '\\b'; }
                search = new RegExp(search, 'g');
                _this.replaces.unshift({search: search, replace: replace});
            });
            return this;
        };
        this.__proto__.toRegExp = function(regExpStr, flags) {
            _this.replaces.forEach(function (a) {
                regExpStr = regExpStr.replace(a.search, a.replace);
            });
            return new RegExp(regExpStr, flags || 'g');
        }
    }
    var reSweetDate = new RegExpSweet();
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
        YYYY: '(?:\\d{4}|(?:HEISEI|SHOWA) \\d{1,2})',
        TIME_JA: '(D2)時 <(D2分|半) <D2秒>>',
        TIME_EN: '(D2):(D2)<:D2>',
        MONTH: '[A-Z][a-z]{2,8}',
        D2TH: '\\d{1,2}(?:st|nd|rd|th)?'
    });
    var RE_DATES = [
        '<(YYYY)年> (D2)月 (D2)日 <WEEK> ',
        '<(YYYY)/>(D2)/(D2)(?: WEEK |\\b )',
        '(YYYY)-(D2)-(D2)(?: WEEK |\\b )',
        '<(YYYY)\\.>(D2)\\.(D2)(?: WEEK |\\b )',
        '(MONTH  D2TH  \\d{4}|D2TH  MONTH  \\d{4})()()\\b '
    ];
    var RE_TIMES = [
        '(D2)() TO (D2)() 時',
        'TIME_JA <TO TIME_JA>',
        'TIME_EN <TO TIME_EN>',
        '()()()()'
    ];
    var normalizeY = function(y) {
        if (y.replace) {
            y = y.replace(reSweetDate.toRegExp('^HEISEI (\\d+)'), function (a, y) { return y * 1 + 1988; });
            y = y.replace(reSweetDate.toRegExp('^SHOWA (\\d+)'), function (a, y) { return y * 1 + 1925; });
        }
        return y;
    };
    var normalizeI = function(i) {
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        return i;
    };
    var dtReList = [];
    RE_DATES.forEach(function (d) {
        RE_TIMES.forEach(function (t) {
            var re = reSweetDate.toRegExp('\\s*' + d + t + '\\s*');
            dtReList.push(re);
        });
    });
    var SettingDates = function () {
        var dates = [];
        var zf = function (n) { return ('0' + n).slice(-2); };
        this.__proto__.pickupDate = function (y, m, d, h, i) {
            if (dates[1]) { return false; }
            y = normalizeY(y || (dates[0] && dates[0].args[0]) || NOW.getFullYear());
            i = normalizeI(i);
            //日付作成
            var str;
            if (m || d) {
                str = y + '-' + m + '-' + d;
            } else {
                str = y.replace(/(\d+)[a-z]+/, '$1'); //th等撤去;
            }
            var is2nd = !!dates[0];
            if (is2nd && !dates[0].hasHi) { h = i = null; } //前に時刻が無いなら今回も使わない
            if (h) { str += ' ' + h + ':' + i; }
            var dt = new Date(str);
            if (dt.toString() === 'Invalid Date') { dt = null; }
            var obj;
            if (h) {
                if (!dt) { //時間とっても成立か
                    return this.pickupDate(y, m, d);
                }
                obj = { str: dt.toISOString().replace(/(:|-|\.\d+)/g, '') };
            } else {
                if (!dt) { return false; }
                if (is2nd) { //日時の２つ目は翌日
                    dt = new Date(dt.getTime() + 24 * 3600 * 1000);
                }
                obj = { str: dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate()) };
            }
            if (!obj) { return false; }
            obj.hasHi = !!h;
            if (is2nd && !obj.hasHi && dates[0].hasHi) { //２つ目が時刻なしなのに１つ目が時刻ありなら１つ目を時刻なしに
                var prevArgs = dates[0].args;
                dates = [];
                this.pickupDate(prevArgs[0], prevArgs[1], prevArgs[2]);
            }
            obj.args = [y, m, d, h, i];
            dates.push(obj);
            return true;
        };
        this.__proto__.toString = function () {
            if (dates.length == 0) { return ''; }
            if (dates.length == 1) { this.pickupDate.apply(this, dates[0].args); }
            return dates[0].str + '/' + dates[1].str;
        }
    };
    var settingDates = new SettingDates();
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    var details = selected.trim();
    selected = selected.replace(/[０-９／．：－]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); }); //半角化
    selected = selected.replace(/　/g,' ').replace(/\s+/g,' ').trim();
    for (var j = 0; j < dtReList.length; j++) {
        var selected2 = selected.replace(dtReList[j], function (a, y, m, d, h, i, h2, i2) {
            var replaced = settingDates.pickupDate(y, m, d, h, i);
            if (replaced && h2) {
                settingDates.pickupDate(y, m, d, h2, i2);
            }
            return (replaced ? '' : a);
        });
        if (selected !== selected2) { break; }
    }
    var dates = settingDates.toString();
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(details) +
        (dates ? '&dates=' + dates : '');
    open(url);
    return [dates, dtReList];
}
