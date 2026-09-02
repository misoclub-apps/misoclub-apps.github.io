# misoclub web

misoclub の公式サイト。素の HTML / CSS で作られた静的サイトで、GitHub Pages で公開します。

## 構成

アプリは **1 アプリ = 1 ディレクトリ**（`apps/<アプリ>/`）にまとめ、中身は固定ファイル名（`index.html` / `privacy.html` / `privacy-en.html` / `icon.png` / `splash.jpg`）で統一しています。追加するときはフォルダごとコピーするだけです。

```
.
├── index.html              # トップページ（ヒーロー＋アプリ一覧 #apps）
├── apps/
│   ├── index.html          # アプリ一覧ページ（/apps/）
│   ├── _template/          # アプリ追加用テンプレート（フォルダごとコピー）
│   │   ├── index.html      #   DLページの雛形
│   │   ├── privacy.html    #   プライバシーポリシー（日本語）の雛形
│   │   └── privacy-en.html #   プライバシーポリシー（英語）の雛形
│   ├── nihon-tabinikki/    # 1 アプリ = 1 ディレクトリ（/apps/nihon-tabinikki/）
│   │   ├── index.html      #   DLページ（シェアからの遷移先）
│   │   ├── privacy.html    #   プライバシーポリシー（日本語）
│   │   ├── privacy-en.html #   プライバシーポリシー（英語）
│   │   ├── icon.png        #   アイコン（一覧カード用・正方形 256px）
│   │   └── splash.jpg      #   スプラッシュ（DLページ上部・縦長）
│   ├── kinenka/            #（同じ構成）
│   └── taiju-log/          #（同じ構成）
├── css/
│   └── style.css           # 共通スタイル（色は :root の変数で調整。スマホ最適化済み）
├── site.webmanifest        # PWA/ホーム画面用マニフェスト
├── sitemap.xml             # **自動生成**（手で触らない）。tools/gen-sitemap.py と CI が作る
├── robots.txt              # クローラ向け。sitemap.xml の所在を示す
├── assets/                 # サイト共通の画像（アプリ固有のものは apps/<アプリ>/ 配下）
│   ├── logo.png            # ヘッダー用ロゴ（logo-source から余白トリム＋背景透過）
│   ├── logo-source.png     # ロゴ原本（MC＋MISOCLUB・正方形・黒背景）。各素材の元データ
│   ├── favicon.ico         # favicon（16/32/48）
│   ├── favicon-32.png      # favicon（PNG・32px）
│   ├── apple-touch-icon.png# iOS ホーム画面アイコン（180）
│   ├── icon-192/512.png    # Android/PWA アイコン
│   ├── og-image.png        # OGP画像（1200x630）
│   ├── app-store-badge.svg # App Store 公式バッジ（日本語）
│   └── google-play-badge.png # Google Play 公式バッジ（日本語）
├── tools/
│   └── gen-sitemap.py      # sitemap.xml の生成（下の「サイトマップ」参照）
├── .github/workflows/
│   └── sitemap.yml         # push のたびに sitemap.xml を作り直してコミットする
└── .nojekyll               # GitHub Pages の Jekyll 処理を無効化
```

> URL は `/`（トップ）、`/apps/`（一覧）、`/apps/<アプリ>/`（各アプリのDLページ）、`/apps/<アプリ>/privacy.html`（ポリシー）になります。

## ロゴ・アイコン・OGP画像の再生成

すべて `assets/logo-source.png`（MC＋MISOCLUB・正方形・黒背景）から ImageMagick で再生成できます。

```sh
cd assets
# ヘッダー用ロゴ（余白トリム＋黒を透過）
magick logo-source.png -fuzz 12% -trim +repage -bordercolor black -border 60 -fuzz 12% -transparent black logo.png

# アイコン類は MC モノグラム部分だけを使う（小サイズで MISOCLUB がつぶれるため）
magick logo-source.png -crop 1254x900+0+0 +repage -fuzz 10% -trim +repage _mc.png
magick _mc.png -resize 740x -background black -gravity center -extent 1024x1024 _icon.png
magick _icon.png -resize 512x512 icon-512.png
magick _icon.png -resize 192x192 icon-192.png
magick _icon.png -resize 180x180 apple-touch-icon.png
magick _icon.png -resize 32x32 favicon-32.png
magick _icon.png -define icon:auto-resize=16,32,48 favicon.ico
rm -f _mc.png _icon.png

# OGP（ロゴ全体を黒背景1200x630中央）
magick logo-source.png -fuzz 10% -trim +repage -resize x440 -background black -gravity center -extent 1200x630 og-image.png
```

## MIO の画像を作り直す

MIO のランディングページ（`apps/mio/index.html`）だけは、専用スタイル（`apps/mio/mio.css`）を
持つ作り込んだページになっている。使っている画像はすべて **`mc-mio` リポジトリの素材から
機械的に書き出したもの**なので、手で加工しないこと。ストアのスクショを撮り直したら、
以下を流し直せば追随できる。

| 置き場所 | 中身 | 出所（`mc-mio/`） |
|---|---|---|
| `apps/mio/img/hero/` | ヒーローの3テーマ（ゆめかわ・クール・さわやか） | `store/screenshots/old/source/<テーマ>/02_timetable.png` |
| `apps/mio/img/themes/` | きせかえの6テーマタイル | 同上（6テーマぶん） |
| `apps/mio/img/screens/` | 機能セクションの実画面（装飾なし） | `store/screenshots/old/source/dreamy/*.png` |
| `apps/mio/img/widgets/` | ウィジェットの見本 | `assets/widget_previews/*.png` |
| `apps/mio/img/poster/` | ストア掲載の装飾ポスター11枚 | `store/screenshots/android/*.png` |
| `apps/mio/og.jpg` / `splash.jpg` | OGP画像 / DLページの上部 | 同じポスターから切り出し |

`mc-mio` のリポジトリを隣に置いた状態で、`mc-mio/` をカレントにして実行する。

```sh
S=store/screenshots/old/source
A=store/screenshots/android
W=assets/widget_previews
D=LocalPackages/misoclub-site/apps/mio
j() { magick "$1" -colorspace sRGB -resize "$2" -strip -interlace Plane \
        -sampling-factor 4:2:0 -quality "$3" "$4"; }

# ヒーローの3台
j $S/dreamy/02_timetable.png 520x 82 $D/img/hero/tt-dreamy.jpg
j $S/cool/02_timetable.png   430x 80 $D/img/hero/tt-cool.jpg
j $S/fresh/02_timetable.png  430x 80 $D/img/hero/tt-fresh.jpg

# きせかえの6テーマ（同じ画面・同じ寸法にすること）
for t in cute dreamy natural fresh cool simple; do
  j $S/$t/02_timetable.png 320x 78 $D/img/themes/tt-$t.jpg
done

# 機能セクションの実画面（すべて dreamy で揃える）
for pair in "01_home:home" "06_calendar_month:calendar-month" \
  "07_calendar_week:calendar-week" "04_assignments:assignments" \
  "03_courses:courses" "11_parttime:parttime" "12_kakeibo:kakeibo" \
  "13_todo:todo" "20_friend_timetable:friend-timetable" \
  "23_warikan_detail:warikan" "15_events:events" \
  "21_settings_design:settings-design" "22_app_icon:app-icon"; do
  j $S/dreamy/${pair%%:*}.png 440x 80 $D/img/screens/${pair##*:}.jpg
done

# ウィジェット（**縦横比を変えない**。440x440> は枠に収めるだけ）
for f in tt_today tt_week sc_month_labeled sc_three_days hm_upcoming hm_oshi; do
  magick $W/$f.png -colorspace sRGB -resize '440x440>' -strip -quality 84 \
    $D/img/widgets/$f.jpg
done

# ストアの装飾ポスター11枚
for f in $A/*.png; do j "$f" 520x 80 "$D/img/poster/$(basename "$f" .png).jpg"; done

# OGP（1200x630。キャッチとサブコピー2行が収まる位置で切る）
magick $A/01_timetable.png -colorspace sRGB -resize 1200x -gravity north \
  -crop 1200x630+0+70 +repage -strip -quality 84 $D/og.jpg

# DLページのスプラッシュ（総覧ポスター＝ロゴとタグラインが入っている）
j $A/10_overview.png 900x 82 $D/splash.jpg

# ヘッダー用の軽いアイコン（icon.png は 210KB を 36px で出していたので別に持つ。
# icon.png 自体は site.webmanifest とトップ・一覧が参照しているので消さない）
magick $D/icon.png -resize 128x128 -strip $D/icon-128.png
```

書き出したら `apps/mio/index.html` の `width` / `height` 属性を実寸に合わせ直すこと
（合っていないと読み込み中にレイアウトが飛ぶ）。`magick identify` で確認できる。

**文言の正典は `mc-mio/docs/app-features.md`**、**書いてはいけないことは
`mc-mio/docs/store-screenshot-shooting-plan.md` §2.5**。種類数（背景150種類以上・
アプリアイコン200種類以上・ウィジェット21種）を触るときは必ず両方を見直す。
**実数そのままではなく控えめに丸めて書く**（素材が減っても嘘にならないように）。

## アプリを追加するとき

1. **`apps/_template/` フォルダを `apps/<アプリ>/` にコピー**
2. その中の `index.html`（DLページ）・`privacy.html`（日本語ポリシー）・`privacy-en.html`（英語ポリシー）を編集（アプリ名・各ストアの URL（`href="#"`）・ポリシー本文）
   - **`index.html` の `<meta name="robots" content="noindex" />` を必ず消すこと。** 雛形そのものを検索に出さないために付けてある。消し忘れると、そのアプリのページが検索に出ず `sitemap.xml` にも載らない（消し忘れは `python3 tools/gen-sitemap.py` が警告してくれる）
   - `og:url` と `hreflang` の `アプリ名` の部分を実際のパスに置き換える（3枚とも。`<!-- ↓ コピーしたら実際の URL に直すこと -->` が目印）
   - ポリシー2枚の `noindex` は**そのまま残す**（検索結果に出さない方針）
3. **`icon.png`**（正方形・256px 以上）と **`splash.jpg`**（縦長）を同フォルダに置く
4. **`apps/index.html`**（`/apps/` 一覧）の `<article class="app-card">` を 1 つ複製し、アイコンのパス（`./<アプリ>/icon.png`）・アプリ名・説明・各ストアの URL を差し替え
5. **トップページ `index.html`** の `#apps` セクションにも `<div class="app-card app-card--link">` を 1 つ複製して追記：
   - カードのリンク先＝`./apps/<アプリ>/`
   - 右上の `app-privacy` 内の JA リンク＝`./apps/<アプリ>/privacy.html`、EN リンク＝`./apps/<アプリ>/privacy-en.html`
   - アイコン・アプリ名・説明を差し替え

   **アプリはトップと `/apps/` の 2 か所に載る**ので、両方の更新を忘れないこと。

ストアバッジは App Store / Google Play とも公式バッジ画像を使い、両者を**同じ高さ・横並び**で表示します（一覧カード内、および各アプリの DLページ）。

## アプリのダウンロードページ（`apps/<アプリ>/index.html`）

アプリのシェア機能などから飛ばす遷移先。上部に各アプリのスプラッシュ画像を表示し、iOS / Android を選んでダウンロードしてもらう最小ページです。misoclub の他アプリ一覧（`/apps/`）以外のリンクは置いていません（misoclub ロゴも置きません）。

## ローカルで確認する

ビルド不要。ファイルをブラウザで開くだけでも見られますが、相対リンクを正しく確認するには簡易サーバーが便利です。

```sh
python3 -m http.server 8000
# → http://localhost:8000 を開く
```

## プライバシーポリシー

各アプリに日本語版 `apps/<アプリ>/privacy.html` と英語版 `apps/<アプリ>/privacy-en.html` を用意しています。アプリ側からこれらの URL を直接リンクします（検索結果には出さない `noindex` 付き）。雛形は `apps/_template/privacy.html`（日本語）・`apps/_template/privacy-en.html`（英語）。トップページの各アプリカード右上（🔒 JA / EN）からも両方を開けます。

## サイトマップ

`sitemap.xml` は **GitHub Actions（`.github/workflows/sitemap.yml`）が push のたびに作り直してコミットする**ので、
アプリやページを足したときに**手で何かを叩く必要は無い**。`sitemap.xml` を手で編集しないこと（次の push で上書きされる）。

**載せる／載せないの判断は、各 HTML の `<meta name="robots" content="noindex">` が唯一の正典。**
検索に出したくないページはそれを付けるだけでよく、除外リストのような二重管理はどこにも無い
（例外は雛形の `apps/_template/` と Search Console の確認ファイルで、これはスクリプト側で除外している）。

手元で結果を確認したいときだけ叩く。

```sh
python3 tools/gen-sitemap.py
# → 10 URLs -> sitemap.xml
```

- `<lastmod>` は **git のコミット日時**から取る（ファイルの mtime は checkout のたびに変わるので使わない）。
  そのため CI の `actions/checkout` には **`fetch-depth: 0` が必須**。浅いクローンだと全ページが同じ日付になる。
- `<changefreq>` と `<priority>` は Google が公式に無視するので出力していない。
- `apps/<アプリ>/index.html` に `noindex` が付いていると警告を出す（雛形からの消し忘れをここで捕まえる）。
- CI の push が 403 で落ちる場合は、リポジトリの Settings → Actions → General → Workflow permissions を
  **Read and write permissions** にする。

## GitHub Pages で公開する

リポジトリの Settings → Pages で、Source を `main` ブランチのルート (`/`) に設定すると公開されます。

## TODO

- [x] お問い合わせ先メールアドレス（`misoclubsupport@gmail.com`）を設定
- [x] favicon・ホーム画面アイコン・OGP画像を追加
- [x] App Store / Google Play とも公式バッジを使用
- [ ] ストアURL（App Store / Google Play）を差し替え（一覧カード内バッジ・各アプリの DLページ。現在は `href="#"`）
- [x] 公開URL（`misoclub.pro`）が決まったので、各ページの `og:image` を**絶対URL**に変更し、`og:url` / `og:title` も設定。あわせて検索対象ページに `canonical`、ja/en ペアに `hreflang` を追加
- [x] トップページ（`index.html`）にヒーロー＋アプリ一覧（`#apps`）を用意
