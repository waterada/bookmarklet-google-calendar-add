function bookmarkletToAddToGoogleCalendar(selected, open, NOW) {
    NOW = NOW || new Date();
    var dtReList = [
        /\b(?:(\d{4})\/)?(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})\b/,
        /\b(?:(\d{4})[.])?(\d{1,2})[.](\d{1,2})\s+(\d{1,2}):(\d{2})\b/,
        /\b(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})\b/,
    ];
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
