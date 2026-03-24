(function () {
  var backToTop = document.getElementById('backToTop');
  if (!backToTop) {
    return;
  }

  function refreshButton() {
    if (window.scrollY > 240) {
      backToTop.classList.add('show');
    } else {
      backToTop.classList.remove('show');
    }
  }

  window.addEventListener('scroll', refreshButton, { passive: true });
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  refreshButton();
})();
