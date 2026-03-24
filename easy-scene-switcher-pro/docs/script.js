(function () {
  var menuButton = document.querySelector('.menu-toggle');
  var nav = document.getElementById('main-nav');
  var copyButtons = document.querySelectorAll('.copy-btn');
  var backTopButton = document.querySelector('.back-top');

  if (menuButton && nav) {
    menuButton.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }

  copyButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var text = button.getAttribute('data-copy') || '';
      if (!text) {
        return;
      }

      navigator.clipboard.writeText(text).then(function () {
        var original = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () {
          button.textContent = original;
        }, 1100);
      });
    });
  });

  if (backTopButton) {
    backTopButton.addEventListener('click', function (event) {
      event.preventDefault();

      // Try smooth behavior first. If unavailable, fallback to instant jump.
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch (error) {
        window.scrollTo(0, 0);
      }
    });
  }
})();
