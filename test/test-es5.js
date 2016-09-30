function execTests(TESTS) {
    var h = function (text) {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        return text;
    };
    var assert = function (actual, expected, title) {
        if (actual !== expected) {
            return '(' + title + ') actual   : ' + actual + "\n" +
                    '(' + title + ') expected : ' + expected + "\n";
        }
        return '';
    };
    var html = '';
    TESTS.forEach(function (test) {
        var ts_text = test[0];
        var ex_dates = test[1];
        console.log(ts_text);
        var capturedUrl = '';
        var res = bookmarkletToAddToGoogleCalendar(ts_text, function (url) { capturedUrl = url }, new Date('2016-01-01'));
        var dates = res[0];
        var errorStr = '';
        errorStr += assert(dates, ex_dates, 'dates');
        if (errorStr) {
            console.error("\n" + errorStr);
            html += '' +
                '<div>' +
                '    <code style="margin-right: 10px;">' + h(ts_text) + '</code>' +
                '    <span style="margin-right: 20px; color: red; font-weight: bold">NG</span>' +
                '    <a href="' + capturedUrl + '" target="_blank">link</a>' +
                '</div>' +
                '<pre style="padding: 10px; color: red;">' + h(errorStr) + '</pre>' +
            '';
        } else {
            html += '' +
                '<div>' +
                '    <code style="margin-right: 10px;">' + h(ts_text) + '</code>' +
                '    <span style="margin-right: 20px;">OK</span>' +
                '    <a href="' + capturedUrl + '" target="_blank">link</a>' +
                '</div>' +
            '';
        }
        console.log('--------------------------------');
    });
    document.getElementById('test').innerHTML = html;
    var res = bookmarkletToAddToGoogleCalendar('aaa', function () {});
    console.log(res[1]);
}
