function bookmarkletToAddToGoogleCalendar(selected, open, NOW) {
    NOW = NOW || new Date();
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
    reSweetDate.addSyntax({' ': '\\s*'});
    reSweetDate.addSyntax({'  ': '\\s+'});
    reSweetDate.addSyntax({'<': '(?:', '>': ')?'});
    reSweetDate.addSyntax({
        D2: '\\d{1,2}',
        YYYY: '\\d{4}'
    });
    var RE_DATES = [
        '<(YYYY)/>(D2)/(D2)<  (D2):(D2)>',
        '<(YYYY)[.]>(D2)[.](D2)<  (D2):(D2)>',
        '(YYYY)-(D2)-(D2)<  (D2):(D2)>'
    ];
    var dtReList = [];
    RE_DATES.forEach(function (pattern) {
        dtReList.push(reSweetDate.toRegExp('\\b' + pattern + '\\b'));
    });
    var SettingDates = function () {
        var dates = [];
        var zf = function (n) { return ('0' + n).slice(-2); };
        this.__proto__.pickupDate = function (y, m, d, h, i) {
            if (dates[1]) { return false; }
            y = y || (dates[0] && dates[0].args[0]) || NOW.getFullYear();
            var is2nd = !!dates[0];
            if (is2nd && !dates[0].hasHi) { h = i = null; } //前に時刻が無いなら今回も使わない
            //日付作成
            var str = y + '-' + m + '-' + d;
            if (h) { str += ' ' + h + ':' + i; }
            var dt = new Date(str);
            if (dt.toString() === 'Invalid Date') { dt = null; }
            var obj = {};
            if (h) {
                if (!dt) { //時間とっても成立か
                    return this.pickupDate(y, m, d);
                }
                obj.str = dt.toISOString().replace(/(:|-|\.\d+)/g, '');
            } else {
                if (!dt) { return false; }
                if (is2nd) { //日時の２つ目は翌日
                    dt = new Date(dt.getTime() + 24 * 3600 * 1000);
                }
                obj.str = dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate());
            }
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
    for (var j = 0; j < dtReList.length; j++) {
        var selected2 = selected.replace(dtReList[j], function (a, y, m, d, h, i) {
            var replaced = settingDates.pickupDate(y, m, d, h, i);
            return (replaced ? '' : a);
        });
        if (selected !== selected2) { break; }
    }
    var dates = settingDates.toString();
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(selected) +
        (dates ? '&dates=' + dates : '');
    open(url);
    return dates;
}
