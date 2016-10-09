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
    var zf = function (n) { return ('0' + n).slice(-2); };
    var dt1 = null, dt2 = null;
    for (var j = 0; j < dtReList.length; j++) {
        if (dt2) { return; }
        var selected2 = selected.replace(dtReList[j], function (a, y, m, d, h, i) {
            y = y || NOW.getFullYear();
            var str = y + '-' + m + '-' + d;
            if (h) { str += ' ' + h + ':' + i; }
            var dt = new Date(str);
            if (h) {
                dt1 = dt.toISOString().replace(/(:|-|\.\d+)/g, '');
                dt2 = dt1;
            } else {
                dt1 = dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate());
                dt = new Date(dt.getTime() + 24 * 3600 * 1000);
                dt2 = dt.getFullYear() + zf(dt.getMonth() + 1) + zf(dt.getDate());
            }
            return '';
        });
        if (selected !== selected2) { break; }
    }
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(selected) +
        '&dates=' + dt1  + '/' + dt2;
    open(url);
    return dt1  + '/' + dt2;
}
