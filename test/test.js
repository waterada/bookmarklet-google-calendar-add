function execTests(TESTS) {
    const h = (text) => {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        return text;
    };
    const assert = (actual, expected, title) => {
        let html = '';
        if (actual !== expected) {
            const _error = (label, value) => {
                console.error(`(${title}) ${label} : ${value}`);
                return `<div style="color: red;"><pre>(${h(title)}) ${label} : ${h(value)}</pre></div>`;
            };
            html += _error('actual  ', actual);
            html += _error('expected', expected);
        }
        return html;
    };
    let html = '';
    for (let test of TESTS) {
        let [ts_text, ex_dates] = test;
        let capturedUrl = '';
        const captureUrl = (url) => {
            capturedUrl = url;
        };
        console.log(ts_text);
        let [dates] = bookmarkletToAddToGoogleCalendar(ts_text, captureUrl, new Date('2016-01-01'));
        let errorHtml = assert(dates, ex_dates, 'dates');
        let resultHtml;
        if (errorHtml) {
            resultHtml = `<span style="margin-right: 20px; color: red; font-weight: bold">NG</span>`;
            errorHtml = `<div style="padding: 10px;">${errorHtml}</div>`;
        } else {
            resultHtml = `<span style="margin-right: 20px;">OK</span>`;
        }
        html += `
            <div>
                <code style="margin-right: 10px;">${h(ts_text)}</code>
                ${resultHtml}
                <a href="${capturedUrl}" target="_blank">link</a>
            </div>
            ${errorHtml}
        `;
        console.log('--------------------------------');
    }
    document.getElementById('test').innerHTML = html;
    let [, reg_dts] = bookmarkletToAddToGoogleCalendar('aaa', () => {});
    console.log(reg_dts);
}
