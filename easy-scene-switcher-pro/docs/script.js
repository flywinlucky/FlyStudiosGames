(function () {
  var menuToggle = document.querySelector('.menu-toggle');
  var mainNav = document.getElementById('main-nav');

  if (!menuToggle || !mainNav) {
    return;
  }

  function closeMenu() {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  menuToggle.addEventListener('click', function () {
    var isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  mainNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 760) {
      mainNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

(function () {
  var copyFeedback = document.getElementById('copy-feedback');
  var copyButtons = document.querySelectorAll('.copy-btn');

  if (!copyButtons.length) {
    return;
  }

  function announce(message) {
    if (!copyFeedback) {
      return;
    }
    copyFeedback.textContent = message;
  }

  function fallbackCopy(text) {
    var textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'absolute';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    var success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }

  function copyText(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      if (fallbackCopy(text)) {
        resolve();
      } else {
        reject(new Error('Copy not available'));
      }
    });
  }

  copyButtons.forEach(function (button) {
    var defaultText = button.textContent;

    button.addEventListener('click', function () {
      var copyValue = button.getAttribute('data-copy');
      if (!copyValue) {
        announce('No command available for copy.');
        return;
      }

      copyText(copyValue)
        .then(function () {
          button.textContent = 'Copied';
          button.setAttribute('data-state', 'copied');
          announce('Copied to clipboard.');

          window.setTimeout(function () {
            button.textContent = defaultText;
            button.removeAttribute('data-state');
          }, 1600);
        })
        .catch(function () {
          button.textContent = 'Failed';
          announce('Copy failed.');

          window.setTimeout(function () {
            button.textContent = defaultText;
          }, 1600);
        });
    });
  });
})();

(function () {
  var backToTop = document.getElementById('backToTop');
  if (!backToTop) {
    return;
  }

  backToTop.addEventListener('click', function (event) {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
