/**
 * <slop-meter> — an anonymous, playful "is this AI slop?" rating widget.
 *
 * Usage:
 *   <script type="module" src="/slop-meter.js"></script>
 *   <slop-meter post-id="/blog/my-post/" endpoint="https://slop.example.com"></slop-meter>
 *
 * Attributes:
 *   post-id   opaque id for the thing being rated (defaults to location.pathname)
 *   endpoint  base URL of the slop-meter API (no trailing slash needed)
 *
 * Self-contained: shadow DOM, no dependencies. Inherits the host page's
 * --accent / font via CSS custom properties where available.
 */
(() => {
  if (customElements.get('slop-meter')) return;

  const RANGES = [
    { max: 15, emoji: '✍️', text: 'Unmistakably human.' },
    { max: 30, emoji: '🙂', text: 'Has a pulse.' },
    { max: 45, emoji: '😌', text: 'Mostly real.' },
    { max: 60, emoji: '😐', text: 'Could go either way.' },
    { max: 75, emoji: '🤨', text: 'Getting suspicious…' },
    { max: 90, emoji: '🤖', text: 'Smells like a language model.' },
    { max: 101, emoji: '🛸', text: 'Peak slop. Bleep bloop.' },
  ];
  const labelFor = (s) => RANGES.find((r) => s < r.max) || RANGES[RANGES.length - 1];
  const burstEmoji = (s) => (s >= 60 ? ['🤖', '🛸', '📠', '🔩'] : ['✍️', '🎉', '💡', '☕']);

  const CSS = `
    :host { display: block; font-family: var(--font-body, system-ui, sans-serif); }
    .card {
      border: 1px solid var(--slop-border, #d4cfc4);
      border-radius: 8px;
      padding: 1.4rem 1.5rem;
      background: var(--slop-surface, rgba(0,0,0,0.02));
      position: relative;
      overflow: hidden;
    }
    .q { font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem; color: var(--slop-text, #1a1814); }
    .ends { display: flex; justify-content: space-between; font-size: 1.15rem; margin-bottom: 0.3rem; }
    .ends small { font-size: 0.7rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--slop-muted, #8a8078); align-self: center; }
    input[type=range] {
      width: 100%; margin: 0.2rem 0 0.6rem; cursor: pointer; -webkit-appearance: none; appearance: none;
      height: 6px; border-radius: 999px;
      background: linear-gradient(90deg, #2d8a5c 0%, #d8a93a 50%, var(--accent, #8b2e23) 100%);
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%;
      background: #fff; border: 2px solid var(--accent, #8b2e23); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: grab;
    }
    input[type=range]::-moz-range-thumb {
      width: 22px; height: 22px; border-radius: 50%; background: #fff;
      border: 2px solid var(--accent, #8b2e23); box-shadow: 0 1px 4px rgba(0,0,0,0.25); cursor: grab;
    }
    .readout { display: flex; align-items: baseline; gap: 0.5rem; min-height: 1.6rem; }
    .readout .val { font-weight: 700; font-size: 1.1rem; color: var(--slop-text, #1a1814); }
    .readout .txt { font-size: 0.9rem; color: var(--slop-muted, #8a8078); font-style: italic; }
    .actions { margin-top: 0.9rem; }
    button {
      font-family: inherit; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
      padding: 0.55rem 1.2rem; border-radius: 6px; border: 1px solid var(--accent, #8b2e23);
      background: var(--accent, #8b2e23); color: #fff; cursor: pointer; transition: opacity .15s, transform .15s;
    }
    button:hover { transform: translateY(-1px); }
    button:disabled { opacity: 0.5; cursor: default; transform: none; }
    .result { margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed var(--slop-border, #d4cfc4); }
    .result.hidden { display: none; }
    .result-row { display: flex; gap: 1.5rem; font-size: 0.9rem; color: var(--slop-text, #1a1814); flex-wrap: wrap; }
    .result-row b { font-weight: 700; }
    .result-row .lbl { color: var(--slop-muted, #8a8078); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; display: block; }
    .spark { display: flex; align-items: flex-end; gap: 3px; height: 36px; margin-top: 0.8rem; }
    .spark .bar { flex: 1; background: var(--accent, #8b2e23); opacity: 0.35; border-radius: 2px 2px 0 0; min-height: 2px; transition: height .4s ease; }
    .spark .bar.you { opacity: 1; }
    .hint { font-size: 0.72rem; color: var(--slop-muted, #8a8078); margin-top: 0.6rem; }
    .fx { position: absolute; pointer-events: none; font-size: 1.3rem; will-change: transform, opacity; }
    @media (prefers-reduced-motion: reduce) { .spark .bar { transition: none; } }
  `;

  class SlopMeter extends HTMLElement {
    connectedCallback() {
      if (this._init) return;
      this._init = true;

      this.postId = this.getAttribute('post-id') || location.pathname;
      this.endpoint = (this.getAttribute('endpoint') || '').replace(/\/+$/, '');
      this.storeKey = 'slop-meter:' + this.postId;

      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `
        <style>${CSS}</style>
        <div class="card">
          <p class="q">Is this AI slop? <span class="emoji">😐</span></p>
          <div class="ends"><small>human craft</small><small>pure slop</small></div>
          <input type="range" min="0" max="100" value="50" aria-label="Rate from human craft to AI slop" />
          <div class="readout"><span class="val">50</span><span class="txt">Could go either way.</span></div>
          <div class="actions"><button type="button">Cast your vote</button></div>
          <div class="result hidden">
            <div class="result-row">
              <div><span class="lbl">You said</span><b class="you-val">–</b></div>
              <div><span class="lbl">Crowd avg</span><b class="crowd-val">–</b></div>
              <div><span class="lbl">Votes</span><b class="count-val">–</b></div>
            </div>
            <div class="spark"></div>
          </div>
          <p class="hint"></p>
        </div>`;

      this.$ = (s) => root.querySelector(s);
      this.range = this.$('input');
      this.range.addEventListener('input', () => this.paint());
      this.$('button').addEventListener('click', () => this.submit());

      const prev = this.stored();
      if (prev != null) {
        this.range.value = prev;
        this.paint();
        this.loadStats(prev);
      } else {
        this.paint();
      }
    }

    stored() {
      try { const v = localStorage.getItem(this.storeKey); return v == null ? null : Number(v); }
      catch { return null; }
    }
    remember(score) { try { localStorage.setItem(this.storeKey, String(score)); } catch {} }

    paint() {
      const s = Number(this.range.value);
      const { emoji, text } = labelFor(s);
      this.$('.val').textContent = s;
      this.$('.txt').textContent = text;
      this.$('.emoji').textContent = emoji;
    }

    async submit() {
      if (!this.endpoint) { this.$('.hint').textContent = 'Voting endpoint not configured.'; return; }
      const score = Number(this.range.value);
      const btn = this.$('button');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      try {
        const res = await fetch(this.endpoint + '/vote', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: this.postId, score }),
        });
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        this.remember(score);
        this.reveal(score, data);
        this.burst(score);
        btn.textContent = 'Update vote';
        btn.disabled = false;
      } catch {
        btn.disabled = false;
        btn.textContent = 'Cast your vote';
        this.$('.hint').textContent = 'Could not record that — try again in a moment.';
      }
    }

    async loadStats(score) {
      if (!this.endpoint) return;
      try {
        const res = await fetch(this.endpoint + '/stats?id=' + encodeURIComponent(this.postId));
        if (!res.ok) return;
        this.reveal(score, await res.json());
        this.$('button').textContent = 'Update vote';
      } catch {}
    }

    reveal(score, data) {
      const r = this.$('.result');
      r.classList.remove('hidden');
      this.$('.you-val').textContent = `${score} ${labelFor(score).emoji}`;
      this.$('.crowd-val').textContent =
        data.average == null ? '—' : `${data.average} ${labelFor(data.average).emoji}`;
      this.$('.count-val').textContent = data.count ?? 0;

      const hist = data.histogram || [];
      const max = Math.max(1, ...hist);
      const youBucket = Math.min(9, Math.floor(score / 10));
      this.$('.spark').innerHTML = hist
        .map((c, i) => `<span class="bar${i === youBucket ? ' you' : ''}" style="height:${Math.round((c / max) * 100)}%" title="${c} vote(s)"></span>`)
        .join('');
      this.$('.hint').textContent = 'Anonymous — one vote per day, change it any time.';
    }

    burst(score) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const card = this.shadowRoot.querySelector('.card');
      const set = burstEmoji(score);
      for (let i = 0; i < 12; i++) {
        const el = document.createElement('span');
        el.className = 'fx';
        el.textContent = set[i % set.length];
        el.style.left = 20 + Math.random() * 60 + '%';
        el.style.top = '60%';
        card.appendChild(el);
        el.animate(
          [
            { transform: 'translateY(0) scale(0.6)', opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { transform: `translateY(-${70 + Math.random() * 60}px) translateX(${(Math.random() - 0.5) * 80}px) scale(1.1) rotate(${(Math.random() - 0.5) * 90}deg)`, opacity: 0 },
          ],
          { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }
        ).onfinish = () => el.remove();
      }
    }
  }

  customElements.define('slop-meter', SlopMeter);
})();
