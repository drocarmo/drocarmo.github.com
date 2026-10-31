// The Hábitos app comes in several icon colors: each time the link is hovered or focused, its
// icon swaps to a different one before it rises
(() => {
  const img = document.querySelector('img[data-icons]');
  if (!img) return;
  const link = img.closest('a');
  const srcs = img.dataset.icons.split(' ').map((c) => `/assets/images/habitos-${c}.png`);
  let current = 0;

  // Fetch them all up front so a swap never shows a blank icon
  srcs.forEach((src) => { new Image().src = src; });

  const swap = () => {
    let next = Math.floor(Math.random() * (srcs.length - 1));
    if (next >= current) next++;  // never the same color twice in a row
    current = next;
    img.src = srcs[current];
  };

  link.addEventListener('mouseenter', swap);
  link.addEventListener('focus', swap);
})();
