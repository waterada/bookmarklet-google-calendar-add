function execTests(TESTS) {
    const h = (text) => {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        return text;
    };
    const assert = (actual, expected) => {
        actual = JSON.stringify(actual);
        expected = JSON.stringify(expected);
        if (actual !== expected) {
            return `  actual   : ${actual}\n` +
                `  expected : ${expected}\n`;
        }
        return '';
    };
    let html = '';
    let test = (title, checker, cases) => {
        html += `
                <div style="font-weight: bold;">${h(title)}</div>
                <div style="padding-left: 20px;">
                `;
        for (let args of cases) {
            console.log(`${title}:${JSON.stringify(args)}`);
            let bookmark = new GoogleCalenderAddBookmarklet(new Date('2016-01-01'));
            let expected = args.pop();
            let actual = checker(bookmark, ...args);

            let errorStr = '';
            errorStr += assert(actual, expected);
            if (errorStr) {
                console.error("\n" + errorStr + '--------------------------------');
                html += `
                <div>
                    <span style="margin-right: 10px; color: red; font-weight: bold">NG</span>
                    <code style="margin-right: 10px; color: red; font-weight: bold">${h(JSON.stringify(args))}</code>
                </div>
                <pre style="padding: 10px; color: red;">${h(errorStr)}</pre>
                `;
            } else {
                html += `
                <div>
                    <span style="margin-right: 10px; color: green;">OK</span>
                    <code style="margin-right: 10px;">${h(JSON.stringify(args))}</code>
                </div>
            `;
            }
        }
        html += `</div>`;
    };
    TESTS(test);
    document.getElementById('test').innerHTML = html;
    // let [, reg_dts] = bookmarkletToAddToGoogleCalendar('aaa', () => {});
    // console.log(reg_dts);
}
