function execTests(TESTS) {
    const assert = function (actual, expected, title) {
        if (actual !== expected) {
            return "\n" +
                    '(' + title + ') actual   : ' + actual + "\n" +
                    '(' + title + ') expected : ' + expected + "\n";
        }
        return '';
    };
    for (var i = 0; i < TESTS.length; i++) {
        var ts_text  = TESTS[i][0];
        var ex_dates = TESTS[i][1];
        console.log(ts_text);
        var capturedUrl = '';
        var dates = bookmarkletToAddToGoogleCalendar(ts_text, function(url){ capturedUrl = url });
        var errorStr = '';
        errorStr += assert(dates, ex_dates, 'dates');
        if (errorStr) {
            console.error(errorStr);
        }
        console.log(capturedUrl);
        console.log('--------------------------------');
    }
}
