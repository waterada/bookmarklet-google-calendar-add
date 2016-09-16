function h(text) {
    text = text.replace(/&/g, '&amp;');
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/"/g, '&quot;');
    return text;
}

function outputHtml(html, text) {
    console.log(text || html);
    let out = document.getElementById('test');
    out.innerHTML += html + "\n";
}

function outputText(text) {
    outputHtml(h(text));
}

function debug(text) {
    console.log(text);
}

function error(text) {
    console.error(text);
    let out = document.getElementById('test');
    out.innerHTML += '<span style="color: red;">' + h(text) + "</span>\n";
}

function assert(actual, expected, title) {
    if (actual === expected) {
        outputText(`(${title}) OK`);
    } else {
        error(`(${title}) actual   : ${actual}`);
        error(`(${title}) expected : ${expected}`);
    }
}

function open(url) {
    outputHtml(`<a href="${url}" target="_blank">link</a>`, url);
}

function exec_test(TESTS) {
    TESTS.forEach(test => {
        let [ts_text, ex_selected, ex_dates] = test;
        outputText(ts_text);
        let [selected, dates] = bookmarklet_google_calendar_add(ts_text, new Date('2016-01-01'), open, debug);
        assert(selected, ex_selected, 'selected');
        assert(dates, ex_dates, 'dates');
        outputText('--------------------------------');
    });
}
