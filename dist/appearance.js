// Run before the stylesheet so a saved dark preference does not flash light.
(() => {
  const key = 'snapnest-appearance-v1';
  const allowed = ['system', 'light', 'dark'];
  const valid = value => allowed.includes(value) ? value : 'system';
  let preference = 'system';
  try { preference = valid(localStorage.getItem(key)); } catch {}
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    const mode = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.appearance = mode;
    document.documentElement.style.colorScheme = mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = mode === 'dark' ? '#171c19' : '#f7f6f2';
    const select = document.getElementById('appearance');
    if (select) select.value = preference;
  }

  apply();
  media.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue);
      apply();
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('appearance');
    if (!select) return;
    select.value = preference;
    select.addEventListener('change', () => {
      preference = valid(select.value);
      try { localStorage.setItem(key, preference); } catch {}
      apply();
    });
  });
})();
