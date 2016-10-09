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
        '<(YYYY)/>(D2)/(D2)  (D2):(D2)',
        '<(YYYY)[.]>(D2)[.](D2)  (D2):(D2)',
        '(YYYY)-(D2)-(D2)  (D2):(D2)'
    ];
    var dtReList = [];
    RE_DATES.forEach(function (pattern) {
        dtReList.push(reSweetDate.toRegExp('\\b' + pattern + '\\b'));
    });
    var dt = null;
    for (var j = 0; j < dtReList.length; j++) {
        if (dt) { return; }
        var selected2 = selected.replace(dtReList[j], function (a, y, m, d, h, i) {
            y = y || NOW.getFullYear();
            var str = y + '-' + m + '-' + d + ' ' + h + ':' + i;
            dt = new Date(str).toISOString().replace(/(:|-|\.\d+)/g, '');
            return '';
        });
        if (selected !== selected2) { break; }
    }
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&details=' + encodeURIComponent(selected) +
        '&dates=' + dt  + '/' + dt;
    open(url);
    return dt  + '/' + dt;
}
