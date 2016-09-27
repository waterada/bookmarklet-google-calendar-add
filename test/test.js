function execTests(TESTS) {
    const h = (text) => {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace(/"/g, '&quot;');
        return text;
    };
    const assert = ($detail, actual, expected, title) => {
        if (actual === expected) {
            console.log(`(${title}) OK`);
            $(`<div><pre>(${h(title)}) OK</pre></div>`).appendTo($detail);
            return true;
        } else {
            const error = (label, value) => {
                console.error(`(${title}) ${label} : ${value}`);
                $(`<div><pre>(${h(title)}) ${label} : ${h(value)}</pre></div>`).css({color: 'red'}).appendTo($detail);
            };
            error('actual  ', actual);
            error('expected', expected);
            return false;
        }
    };
    TESTS.forEach(test => {
        let [ts_text, ex_dates] = test;
        const $detail = $('<div></div>');
        const $result = $('<span></span>');
        const $title = $('<div></div>').click((e) => {
            if ($(e.target).is('a')) {
                e.stopPropagation();
                return;
            }
            $detail.toggle();
        });
        const openUrl = (url) => {
            $(`<a href="${url}" target="_blank">link</a>`, url).appendTo($title);
        };
        console.log(ts_text);
        $('#test').append(
            $title.append(
                $('<code></code>').text(ts_text).css({marginRight: '10px'}),
                $result.css({marginRight: '20px'})
            ),
            $detail.hide().css({padding: '10px'})
        );
        let [dates] = bookmarkletToAddToGoogleCalendar(ts_text, new Date('2016-01-01'), openUrl);
        let success = true;
        success = assert($detail, dates, ex_dates, 'dates') && success;
        if (success) {
            $result.text('OK');
        } else {
            $result.text('NG').css({color: 'red', fontWeight: 'bold'});
            $detail.show();
        }
        console.log('--------------------------------');
    });
    let [, reg_dts] = bookmarkletToAddToGoogleCalendar('aaa', new Date(), () => {});
    console.log(reg_dts);
}
