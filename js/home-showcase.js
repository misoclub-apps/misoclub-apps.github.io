(() => {
  const picker = document.querySelector('[data-feature-picker]');
  const tabs = [...picker.querySelectorAll('a')];
  const panels = tabs.map(tab => document.getElementById(tab.hash.slice(1)));
  if (!panels.every(Boolean)) return;
  picker.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.id = `feature-tab-${i}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', e => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      select(i);
    });
    tab.addEventListener('keydown', e => {
      const next = {ArrowLeft:(i + tabs.length - 1) % tabs.length,
        ArrowRight:(i + 1) % tabs.length, Home:0, End:tabs.length - 1}[e.key];
      if (next == null) return;
      e.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
  function select(index) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(index === i));
      tab.tabIndex = index === i ? 0 : -1;
      panels[i].hidden = index !== i;
      panels[i].tabIndex = index === i ? 0 : -1;
    });
  }
  const hashIndex = () => tabs.findIndex(tab => tab.hash === location.hash);
  select(Math.max(0, hashIndex()));
  window.addEventListener('hashchange', () => { if (hashIndex() >= 0) select(hashIndex()); });
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
