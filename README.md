# bookmarklet-google-calendar-add

## インストール

```
javascript:(function(d, ...others){
let s=d.createElement('script');s.src='https://waterada.github.io/bookmarklet-google-calendar-add/src/src.js';d.body.appendChild(s);bookmarkletToAddToGoogleCalendar(...others);
})(document, window.getSelection()+'', window.open)
```

上記を Google Chrome で bookmark にするだけです。


## 使い方

1. 日付や時間を含む文字列を選択してから上記のブックマークを選択します。
2. すると、Google カレンダーの追加画面が開き、日付が自動認識されて自動入力され、選択範囲が詳細に入力されている状態になります。


## どんな日付に対応しているのか

[テスト](src/test-cases.js) を参考にしてください。

