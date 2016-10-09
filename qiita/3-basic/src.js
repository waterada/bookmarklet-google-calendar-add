function bookmarkletToAddToGoogleCalendar(selected, open) {
    var dt = new Date(selected).toISOString().replace(/(:|-|\.\d+)/g, '');
    var url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
        '&dates=' + dt  + '/' + dt;
    open(url);
    return dt  + '/' + dt;
}
