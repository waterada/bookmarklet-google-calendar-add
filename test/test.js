function execTests(TESTS) {
    const h = (text) => {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        return text;
    };
    const assert = (actual, expected, title) => {
        if (actual !== expected) {
            return `(${title}) actual   : ${actual}\n` +
                    `(${title}) expected : ${expected}\n`;
        }
        return '';
    };
    let html = '';
    for (let [ts_text, ex_dates] of TESTS) {
        console.log(ts_text);
        let capturedUrl = '';
        let [dates] = bookmarkletToAddToGoogleCalendar(ts_text, (url) => { capturedUrl = url }, new Date('2016-01-01'));
        let errorStr = '';
        errorStr += assert(dates, ex_dates, 'dates');
        if (errorStr) {
            console.error("\n" + errorStr);
            html += `
                <div>
                    <code style="margin-right: 10px;">${h(ts_text)}</code>
                    <span style="margin-right: 20px; color: red; font-weight: bold">NG</span>
                    <a href="${capturedUrl}" target="_blank">link</a>
                </div>
                <pre style="padding: 10px; color: red;">${h(errorStr)}</pre>
            `;
        } else {
            html += `
                <div>
                    <code style="margin-right: 10px;">${h(ts_text)}</code>
                    <span style="margin-right: 20px;">OK</span>
                    <a href="${capturedUrl}" target="_blank">link</a>
                </div>
            `;
        }
        console.log('--------------------------------');
    }
    document.getElementById('test').innerHTML = html;
    let [, reg_dts] = bookmarkletToAddToGoogleCalendar('aaa', () => {});
    console.log(reg_dts);
}
