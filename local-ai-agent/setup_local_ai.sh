#!/bin/bash
# =============================================================
#  ローカルAI自動化環境 ワンクリックセットアップ（Mac Apple Silicon）
#  使い方：このファイル全体をコピー → ターミナルで
#          pbpaste > ~/setup_local_ai.sh && bash ~/setup_local_ai.sh
# =============================================================
set -e
DIR="$HOME/local-ai-agent"
step(){ echo ""; echo "▶▶ [$1/7] $2"; }

# ---------- 1. Homebrew ----------
step 1 "Homebrew 確認"
if ! command -v brew >/dev/null 2>&1 && [ ! -x /opt/homebrew/bin/brew ]; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
eval "$(/opt/homebrew/bin/brew shellenv)"
grep -q 'brew shellenv' ~/.zprofile 2>/dev/null || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
echo "✅ Homebrew OK"

# ---------- 2. Python / Ollama / tmux ----------
step 2 "Python3.12・Ollama・tmux インストール"
brew install python@3.12 ollama tmux || true
echo "✅ インストール OK"

# ---------- 3. フォルダ・仮想環境・ライブラリ ----------
step 3 "Python仮想環境とライブラリ（数分かかります）"
mkdir -p "$DIR/logs" "$DIR/results"
cd "$DIR"
[ -d .venv ] || /opt/homebrew/bin/python3.12 -m venv .venv
source .venv/bin/activate
pip install -q -U pip
pip install -q -U browser-use langchain-ollama playwright httpx beautifulsoup4
python -m playwright install chromium
echo "✅ ライブラリ OK"

# ---------- 4. Ollama 起動 ----------
step 4 "Ollama 起動"
brew services stop ollama >/dev/null 2>&1 || true
if ! curl -s http://localhost:11434/api/tags >/dev/null; then
  OLLAMA_CONTEXT_LENGTH=32768 OLLAMA_KEEP_ALIVE=30m OLLAMA_MAX_LOADED_MODELS=1 \
    nohup ollama serve > "$DIR/logs/ollama.log" 2>&1 &
  for i in $(seq 1 30); do curl -s http://localhost:11434/api/tags >/dev/null && break; sleep 1; done
fi
curl -s http://localhost:11434/api/tags >/dev/null && echo "✅ Ollama 起動 OK" || { echo "❌ Ollama 起動失敗（$DIR/logs/ollama.log を確認）"; exit 1; }

# ---------- 5. メモリに合わせてモデル選択・ダウンロード ----------
step 5 "モデルのダウンロード（初回は10〜20分）"
MEM_GB=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
if [ "$MEM_GB" -ge 32 ]; then AGENT=qwen2.5-coder:14b; SUM=deepseek-r1:14b
elif [ "$MEM_GB" -ge 24 ]; then AGENT=qwen2.5-coder:14b; SUM=deepseek-r1:8b
else AGENT=qwen2.5-coder:7b; SUM=deepseek-r1:8b; fi
echo "メモリ ${MEM_GB}GB → 操作: $AGENT / 要約: $SUM"
ollama pull "$AGENT"
ollama pull "$SUM"
cat > "$DIR/.env" <<EOF
export AGENT_MODEL=$AGENT
export SUMMARY_MODEL=$SUM
EOF
echo "✅ モデル OK"

# ---------- 6. プログラム本体と起動用ファイル ----------
step 6 "main.py・起動用ファイル作成"
cat > "$DIR/main.py" <<'PYEOF'
#!/usr/bin/env python3
"""
ローカルLLM × browser-use 情報収集エージェント
1) browser-use Agent が Chrome で Google 検索 → 上位3件のタイトル/URLを取得
2) 失敗時は DuckDuckGo(HTML版) から直接取得（フォールバック）
3) 各ページ本文を取得 → ローカルLLMで分析・要約 → ターミナル出力＋保存
"""
import asyncio
import json
import logging
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, unquote, urlparse
from zoneinfo import ZoneInfo

import httpx
from bs4 import BeautifulSoup

QUERY = os.getenv("QUERY", "最新のAI営業ツール トレンド")
AGENT_MODEL = os.getenv("AGENT_MODEL", "qwen2.5-coder:14b")
SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", "deepseek-r1:8b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
HEADLESS = os.getenv("HEADLESS", "0") == "1"
CHROME_PATH = os.getenv(
    "CHROME_PATH", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
)
MAX_STEPS = int(os.getenv("MAX_STEPS", "15"))
TOP_N = 3
JST = ZoneInfo("Asia/Tokyo")
BASE = Path(__file__).resolve().parent
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/129.0 Safari/537.36"
)

logging.Formatter.converter = lambda *a: datetime.now(JST).timetuple()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("agent")


def check_ollama() -> None:
    try:
        r = httpx.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
        r.raise_for_status()
        names = {m["name"] for m in r.json().get("models", [])}
    except Exception as e:
        sys.exit(f"❌ Ollamaに接続できません（{OLLAMA_HOST}）: {e}\n→ `ollama serve` を起動してください")
    for m in (AGENT_MODEL, SUMMARY_MODEL):
        if m not in names and f"{m}:latest" not in names:
            sys.exit(f"❌ モデル未取得: {m}\n→ `ollama pull {m}` を実行してください")
    log.info("✅ Ollama接続OK / モデル確認OK")


def extract_results(text: str) -> list[dict]:
    if not text:
        return []
    m = re.search(r"\[.*\]", text, re.S)
    if not m:
        return []
    try:
        data = json.loads(m.group(0))
    except json.JSONDecodeError:
        return []
    out = []
    for d in data:
        if isinstance(d, dict) and str(d.get("url", "")).startswith("http"):
            out.append({"title": str(d.get("title", "")).strip(), "url": d["url"].strip()})
    return out[:TOP_N]


async def search_with_agent() -> list[dict]:
    try:
        from browser_use import Agent, Browser
        from browser_use import ChatOllama as BUChatOllama
    except ImportError as e:
        log.error(f"browser-use の読み込み失敗: {e}")
        return []

    google_url = f"https://www.google.com/search?q={quote_plus(QUERY)}&hl=ja"
    ddg_url = f"https://duckduckgo.com/?q={quote_plus(QUERY)}&kl=jp-jp"
    task = f"""
次の手順を正確に実行してください。
1. {google_url} を開く。
2. 広告（「スポンサー」「広告」表記）を除いた自然検索結果の上位{TOP_N}件の「タイトル」と「URL」を取得する。
3. CAPTCHAや「通常と異なるトラフィック」画面が出たら、代わりに {ddg_url} を開いて同様に取得する。
4. 最終回答は次のJSON配列のみを出力（説明文は不要）:
[{{"title": "...", "url": "https://..."}}, ...]
"""
    browser = None
    try:
        llm = BUChatOllama(model=AGENT_MODEL, host=OLLAMA_HOST)
        browser = Browser(executable_path=CHROME_PATH, headless=HEADLESS, user_data_dir=None)
        agent = Agent(task=task, llm=llm, browser=browser, use_vision=False)
        log.info(f"🌐 [1/3] ブラウザAgent起動（{AGENT_MODEL} / headless={HEADLESS}）")
        history = await asyncio.wait_for(agent.run(max_steps=MAX_STEPS), timeout=600)
        results = extract_results(history.final_result() or "")
        log.info(f"Agent取得件数: {len(results)}")
        return results
    except asyncio.TimeoutError:
        log.error("Agentがタイムアウト（10分）")
    except Exception as e:
        log.error(f"Agent実行エラー: {e!r}")
    finally:
        if browser is not None:
            for name in ("kill", "stop", "close"):
                fn = getattr(browser, name, None)
                if fn:
                    try:
                        await fn()
                        break
                    except Exception:
                        pass
    return []


def search_fallback() -> list[dict]:
    log.info("🔁 フォールバック検索（DuckDuckGo HTML版）")
    try:
        r = httpx.get(
            "https://html.duckduckgo.com/html/",
            params={"q": QUERY, "kl": "jp-jp"},
            headers={"User-Agent": UA},
            timeout=20,
            follow_redirects=True,
        )
        r.raise_for_status()
    except Exception as e:
        log.error(f"フォールバック検索失敗: {e}")
        return []
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    for a in soup.select("a.result__a"):
        href = a.get("href", "")
        if "uddg=" in href:
            href = unquote(parse_qs(urlparse(href).query).get("uddg", [""])[0])
        if href.startswith("http") and "duckduckgo.com/y.js" not in href:
            out.append({"title": a.get_text(strip=True), "url": href})
        if len(out) >= TOP_N:
            break
    return out


async def fetch_text(client: httpx.AsyncClient, url: str, limit: int = 3000) -> str:
    try:
        r = await client.get(url, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for t in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            t.decompose()
        text = re.sub(r"\s+", " ", soup.get_text(" ", strip=True))
        return text[:limit] if text else "(本文取得できず)"
    except Exception as e:
        return f"(本文取得エラー: {e.__class__.__name__})"


def summarize(items: list[dict]) -> str:
    from langchain_ollama import ChatOllama

    llm = ChatOllama(model=SUMMARY_MODEL, base_url=OLLAMA_HOST, temperature=0.3, num_ctx=16384)
    sources = "\n\n".join(
        f"### サイト{i}\nタイトル: {it['title']}\nURL: {it['url']}\n本文抜粋: {it['body']}"
        for i, it in enumerate(items, 1)
    )
    prompt = f"""あなたは営業DXのアナリストです。以下は「{QUERY}」の検索上位{len(items)}サイトの抜粋です。
抜粋に書かれている情報のみを根拠に、日本語で次の形式で出力してください（推測で補わないこと）。

## 各サイト要約
- サイト1: （3行以内）
- サイト2: （3行以内）
- サイト3: （3行以内）

## 共通するトレンド（箇条書き3〜5個）

## 営業現場への示唆（箇条書き3個）

{sources}
"""
    res = llm.invoke(prompt)
    return re.sub(r"<think>.*?</think>", "", res.content, flags=re.S).strip()


async def main() -> int:
    start = datetime.now(JST)
    log.info(f"▶ 開始: {start:%Y-%m-%d %H:%M} JST / 検索語: {QUERY}")
    check_ollama()

    results = await search_with_agent()
    if len(results) < TOP_N:
        results = (results + [r for r in search_fallback() if r not in results])[:TOP_N]
    if not results:
        log.error("❌ 検索結果を取得できませんでした")
        return 1

    log.info(f"📄 [2/3] 本文取得中（{len(results)}件）")
    async with httpx.AsyncClient(headers={"User-Agent": UA}, follow_redirects=True) as client:
        bodies = await asyncio.gather(*(fetch_text(client, r["url"]) for r in results))
    items = [{**r, "body": b} for r, b in zip(results, bodies)]

    log.info(f"🧠 [3/3] 分析・要約中（{SUMMARY_MODEL}）")
    try:
        summary = summarize(items)
    except Exception as e:
        log.error(f"要約エラー: {e!r}")
        summary = "(要約失敗)"

    lines = [f"# 調査結果: {QUERY}", f"実行日時: {start:%Y-%m-%d %H:%M} JST", "", "## 上位サイト"]
    lines += [f"{i}. {it['title']}\n   {it['url']}" for i, it in enumerate(items, 1)]
    lines += ["", summary]
    report = "\n".join(lines)

    print("\n" + "=" * 60 + "\n" + report + "\n" + "=" * 60)
    out = BASE / "results" / f"{start:%Y%m%d_%H%M}.md"
    out.parent.mkdir(exist_ok=True)
    out.write_text(report, encoding="utf-8")
    log.info(f"✅ 完了 → 保存先: {out}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(asyncio.run(main()))
    except KeyboardInterrupt:
        log.warning("中断されました")
        sys.exit(130)
PYEOF

# Ollama 起動（未起動なら）
cat > "$DIR/start_ollama.sh" <<'EOF'
#!/bin/bash
DIR="$HOME/local-ai-agent"
curl -s http://localhost:11434/api/tags >/dev/null && { echo "Ollama 起動済み"; exit 0; }
OLLAMA_CONTEXT_LENGTH=32768 OLLAMA_KEEP_ALIVE=30m OLLAMA_MAX_LOADED_MODELS=1 \
  nohup /opt/homebrew/bin/ollama serve > "$DIR/logs/ollama.log" 2>&1 &
sleep 3; echo "Ollama 起動しました"
EOF

# 画面ありで実行（テスト用）
cat > "$DIR/run.sh" <<'EOF'
#!/bin/bash
DIR="$HOME/local-ai-agent"; cd "$DIR"
bash start_ollama.sh; source .venv/bin/activate; source .env
python main.py
EOF

# バックグラウンド実行（リモート切断OK・スリープ防止）
cat > "$DIR/run_bg.sh" <<'EOF'
#!/bin/bash
DIR="$HOME/local-ai-agent"; cd "$DIR"
bash start_ollama.sh; source .venv/bin/activate; source .env
LOG="logs/run_$(date +%Y%m%d_%H%M).log"
HEADLESS=1 nohup caffeinate -is python main.py > "$LOG" 2>&1 &
echo "▶ バックグラウンド開始（PID $!）"
echo "進捗を見る: tail -f $DIR/$LOG"
echo "停止する:   bash $DIR/stop.sh"
EOF

cat > "$DIR/stop.sh" <<'EOF'
#!/bin/bash
pkill -f "python main.py" && echo "停止しました" || echo "実行中の処理はありません"
EOF

chmod +x "$DIR"/*.sh
echo "✅ ファイル作成 OK"

# ---------- 7. 動作確認 ----------
step 7 "動作確認"
source "$DIR/.env"
python -c "import browser_use, langchain_ollama, httpx, bs4; print('✅ ライブラリ読み込み OK')"
[ -x "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ] \
  && echo "✅ Google Chrome 検出 OK" \
  || echo "⚠️ Google Chrome が /Applications にありません（インストールしてください）"

echo ""
echo "=================================================="
echo " 🎉 セットアップ完了"
echo "  テスト実行（画面あり）: bash ~/local-ai-agent/run.sh"
echo "  裏で実行（切断OK）    : bash ~/local-ai-agent/run_bg.sh"
echo "  停止                  : bash ~/local-ai-agent/stop.sh"
echo "  結果フォルダを開く    : open ~/local-ai-agent/results"
echo "=================================================="
open "$DIR" 2>/dev/null || true
