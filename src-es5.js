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
    var normalizeI = function(i) {
        i = i || '00';
        if (i === '半') { i = '30'; }
        i = i.replace(/分$/, '');
        return i;
    };
    var createDate = function(y, m, d, hi) {
        var str;
        if (m || d) {
            str = y + '-' + m + '-' + d;
        } else {
            str = y.replace(/(\d+)[a-z]+/, '$1'); //th等撤去;
        }
        var dt = new Date(str + hi);
        if (dt.toString() === 'Invalid Date') {
            return null;
        } else {
            return dt;
        }
    };
    var dtReList = [];
    RE_DATES.forEach(function (d) {
        RE_TIMES.forEach(function (t) {
            var re = reSweetDate.toRegExp('\\s*' + d + t + '\\s*');
            dtReList.push(re);
        });
    });
    var zf = function (n) { return ('0' + n).slice(-2); };
    var analyzeYmd = function (is2nd, y, m, d) {
        var dt = createDate(y, m, d, '');
        if (!dt) { return; }
        if (is2nd) { //日時の２つ目は翌日
            dt = new Date(dt.getTime() + 24 * 3600 * 1000);
        }
        return {
            hasHi: false,
            str: dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate())
        };
    };
    var analyzeYmdhi = function (is2nd, y, m, d, h, i) {
        i = normalizeI(i);
        var dt = createDate(y, m, d, ' ' + h + ':' + i);
        if (!dt) { //時間とっても成立か
            return analyzeYmd(is2nd, y, m, d);
        }
        return {
            hasHi: true,
            str: dt.toISOString().replace(/(:|-|\.\d+)/g, '')
        };
    };
    var date1 = null, date2 = null;
    var pickupDate = function (a, y, m, d, h, i, h2, i2) {
        if (date2) { return ''; }
        y = y || (date1 && date1.args[1]) || NOW.getFullYear();
        if (y.replace) {
            y = y.replace(reSweetDate.toRegExp('^HEISEI (\\d+)'), function (a, y) { return y * 1 + 1988; });
            y = y.replace(reSweetDate.toRegExp('^SHOWA (\\d+)'), function (a, y) { return y * 1 + 1925; });
        }
        var obj;
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
            obj.args = [a, y, m, d, h, i, h2, i2];
            date1 = obj;
        }
        if (h2) {
            pickupDate(a, y, m, d, h2, i2);
        }
        return '';
    };
    if (!selected) { selected = prompt('Text:'); }
    if (!selected) { return; }
    var details = selected.trim();
    selected = selected.replace(/[０-９／．：－]/g, function (s) { return String.fromCharCode(s.charCodeAt(0) - 0xFEE0); }); //半角化
    selected = selected.replace(/　/g,' ').replace(/\s+/g,' ').trim();
    for (var i = 0; i < dtReList.length; i++) {
        selected.replace(dtReList[i], pickupDate);
    }
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(details);
    if (date1) {
        if (!date2) { pickupDate.apply(null, date1.args); }
        url += '&dates=' + date1.str + '/' + date2.str;
    }
    open(url);
    return [(date1 ? date1.str + '/' + date2.str : ''), dtReList];
}
