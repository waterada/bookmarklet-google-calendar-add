if (!GoogleCalenderAddBookmarklet) {
    class GoogleCalenderAddBookmarklet {
        constructor(NOW) {
            this._NOW = NOW || new Date();
            this.reSweetDate = new GoogleCalenderAddBookmarklet_RegExpSweet();
            this.reSweetDate.addSyntax({'（': '[（\\(]', '）': '[\\)）]'});
            this.reSweetDate.addSyntax({' ': '\\s*'});
            this.reSweetDate.addSyntax({'  ': '\\s+'});
            this.reSweetDate.addSyntax({'<': '(?:', '>': ')?'});
            this.reSweetDate.addSyntax({
                WEEK: '（[日月火水木金土]）',
                TO: '(?:から|～|-|－)',
                D2: '\\d{1,2}',
                HEISEI: '(?:平成?|[Hh]\\.?)',
                SHOWA: '(?:昭和?|[Ss]\\.?)',
                YYYY: '(?:\\d{4}|(?:HEISEI|SHOWA) \\d{1,2})',
                TIME_JA: '(D2)時 <(D2分|半) <D2秒>>',
                TIME_EN: '(D2):(D2)<:D2>',
                MONTH: '[A-Z][a-z]{2,8}',
                D2TH: '\\d{1,2}(?:st|nd|rd|th)?'
            });
        }

        _normalizeSpaces(selected) {
            return selected.replace(/　/g, ' ').replace(/\s+/g, ' ').trim();
        }

        _normalizeWideChars(selected) {
            return selected.replace(/[０-９／．：－]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); //半角化
        }

        _pickupDate(selected) {
            const RE_DATES = [
                '<(YYYY)年> (D2)月 (D2)日 <WEEK> ',
                '<(YYYY)/>(D2)/(D2)(?: WEEK |\\b )',
                '<(YYYY)[.]>(D2)[.](D2)(?: WEEK |\\b )',
                '(YYYY)-(D2)-(D2)(?: WEEK |\\b )',
                '(MONTH  D2TH  \\d{4}|D2TH  MONTH  \\d{4})()()\\b ',
                '(次の次の|次の|再来週|来週|今週)? の? ([日月火水木金土])(曜日) の? ',
            ];
            const RE_TIMES = [
                '(D2)() TO (D2)() 時',
                'TIME_JA <TO TIME_JA>',
                'TIME_EN <TO TIME_EN>',
                '()()()()',
            ];
            let dtReList = [];
            for (let d of RE_DATES) {
                for (let t of RE_TIMES) {
                    let re = this.reSweetDate.toRegExp(`\\s*${d}${t}\\s*`);
                    dtReList.push(re);
                }
            }
            let pickups = [];
            for (let re of dtReList) {
                selected = selected.replace(re, (a, y, m, d, h, i, h2, i2) => {
                    pickups.push([(y || ''), (m || ''), (d || ''), (h || ''), (i || ''), (h2 || ''), (i2 || '')]);
                    return '';
                });
            }
            return pickups;
        }

        _normalizePickups(pickups) {
            let newPickups = [];
            for (let [y, m, d, h, i, h2, i2] of pickups) {
                newPickups.push([y, m, d, h, i]);
                if (h2) {
                    newPickups.push([y, m, d, h2, i2]);
                }
            }
            return newPickups;
        }

        _normalizeYmd(y, m, d) {
            if (!m && !d) {
                y = y.replace(/(\d+)(?:st|nd|rd|th)\b/, '$1'); //th等撤去;
                let dt = new Date(y);
                y = dt.getFullYear().toString();
                m = this._zf(dt.getMonth() + 1);
                d = this._zf(dt.getDate());
            }
            if (d === '曜日') {
                let cur = this._NOW.getDay();
                let sel = '日月火水木金土'.indexOf(m);
                let days = sel - cur;
                if (y === '次の次の') {
                    days += (cur < sel ? 7 : 14);
                } else if (y === '次の') {
                    days += (cur < sel ? 0 : 7);
                } else if (y === '再来週') {
                    days += 14;
                } else if (y === '来週') {
                    days += 7;
                }
                let dt = new Date(this._NOW.getTime() + days * 24 * 3600 * 1000);
                y = dt.getFullYear().toString();
                m = this._zf(dt.getMonth() + 1);
                d = this._zf(dt.getDate());
            }
            return [y, m, d];
        }

        _normalizeY(y, prev, NOW) {
            y = y || prev.y || NOW.getFullYear().toString();
            y = y.replace(this.reSweetDate.toRegExp('^HEISEI (\\d+)'), (a, y) => y * 1 + 1988);
            y = y.replace(this.reSweetDate.toRegExp('^SHOWA (\\d+)'), (a, y) => y * 1 + 1925);
            return y;
        }

        _normalizeM(m) {
            if (m) { m = this._zf(m); }
            return m;
        }

        _normalizeD(d) {
            if (d) {
                d = this._zf(d);
            }
            return d;
        }

        _normalizeI(i) {
            i = i || '00';
            if (i === '半') { i = '30'; }
            i = i.replace(/分$/, '');
            i = this._zf(i);
            return i;
        }

        _createDate(y, m, d, h, i, first) {
            let hasHi = !!h;
            if (first.exists) {
                if (first.hasHi && !hasHi) { //前回時刻ありで今回時刻なし→今回日付ごと不採用
                    return [null, true];
                }
                if (!first.hasHi && hasHi) { //前回時刻なしで今回時刻あり→今回時刻のみ不採用
                    hasHi = false;
                }
            }
            let dt = new Date(`${y}-${m}-${d}` + (hasHi ? ` ${h}:${i}` : ''));
            if (dt.toString() === 'Invalid Date') {
                if (!first.exists && hasHi) {
                    return this._createDate(y, m, d, '', '', {});
                } else {
                    return [null, hasHi];
                }
            }
            return [dt, hasHi];
        }

        _normalizeDates(dates) {
            return [dates[0], (dates[1] || dates[0])];
        }

        _formatYmdhi(date1, date2) {
            return date1.toISOString().replace(/(:|-|\.\d+)/g, '') + '/' +
                date2.toISOString().replace(/(:|-|\.\d+)/g, '');
        }

        _zf(n) {
            return ('0' + n).slice(-2);
        }

        _extractYmd(dt) {
            return [
                dt.getFullYear(),
                this._zf(dt.getMonth() + 1),
                this._zf(dt.getDate())
            ];
        }

        _formatYmd(date1, date2) {
            date2 = new Date(date2.getTime() + 24 * 3600 * 1000);
            return this._extractYmd(date1).join('') + '/' + this._extractYmd(date2).join('');
        }

        popup(selected, open) {
            selected = this._normalizeSpaces(selected);
            selected = this._normalizeWideChars(selected);
            let pickups = this._pickupDate(selected);
            pickups = this._normalizePickups(pickups);
            let dates = [];
            let first = {};
            for (let [y, m, d, h, i] of pickups) {
                if (dates[1]) { break; }
                [y, m, d] = this._normalizeYmd(y, m, d);
                y = this._normalizeY(y, first, this._NOW);
                m = this._normalizeM(m);
                d = this._normalizeD(d);
                i = this._normalizeI(i);
                let [dt, hasHi] = this._createDate(y, m, d, h, i, first);
                if (!dt) { continue; }
                if (!first.exists) {
                    first = {y, m, d, h, i, hasHi, exists: true};
                }
                dates.push(dt);
            }
            let [date1, date2] = this._normalizeDates(dates);
            let datesStr;
            if (first.hasHi) {
                datesStr = this._formatYmdhi(date1, date2);
            } else {
                datesStr = this._formatYmd(date1, date2);
            }
            let url = 'http://www.google.com/calendar/event?action=TEMPLATE&trp=false' +
                '&details=' + encodeURIComponent(selected.trim()) +
                (datesStr ? '&dates=' + datesStr : '');
            open(url);
            return datesStr;
        }
    }

    class GoogleCalenderAddBookmarklet_RegExpSweet {
        constructor() {
            this.replaces = [];
        }
        addSyntax(replacements) {
            for (let search of Object.keys(replacements)) {
                let replace = replacements[search];
                if (search.match(/^\w+$/)) { search = `\\b${search}\\b`; }
                search = new RegExp(search, 'g');
                this.replaces.unshift({search, replace});
            }
            return this;
        }
        toRegExp(regExpStr, flags) {
            for (let a of this.replaces) {
                regExpStr = regExpStr.replace(a.search, a.replace);
            }
            return new RegExp(regExpStr, flags || 'g');
        }
    }
}
