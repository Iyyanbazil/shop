(function () {
  'use strict';

  var STORAGE_KEY = 'shopify_wishlist';

  // Inject global styles for toast, active heart, and wishlist count bubble
  (function () {
    if (document.getElementById('wishlist-global-styles')) return;
    var style = document.createElement('style');
    style.id = 'wishlist-global-styles';
    style.textContent = [
      '.wishlist-toast{position:fixed;bottom:2.4rem;right:2.4rem;background:#1a1a1a;color:#fff;padding:1.2rem 2rem;border-radius:0.8rem;font-size:1.4rem;font-family:inherit;z-index:99999;transform:translateY(1.5rem);opacity:0;transition:transform 0.3s ease,opacity 0.3s ease;pointer-events:none;display:flex;align-items:center;gap:0.8rem;box-shadow:0 4px 20px rgba(0,0,0,0.22);}',
      '.wishlist-toast--visible{transform:translateY(0);opacity:1;}',
      '.wishlist-toast__icon{color:#e8344a;font-size:1.5rem;line-height:1;}',
      '.card__action-btn--wishlist[data-in-wishlist="1"] svg path{fill:#e8344a!important;}',
    ].join('');
    document.head.appendChild(style);
  })();

  function getWishlist() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }

  function saveWishlist(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function isInWishlist(id) {
    return getWishlist().some(function (item) { return String(item.id) === String(id); });
  }

  function addToWishlist(product) {
    var list = getWishlist();
    if (!list.some(function (item) { return String(item.id) === String(product.id); })) {
      list.push(product);
      saveWishlist(list);
    }
  }

  function removeFromWishlist(id) {
    saveWishlist(getWishlist().filter(function (item) { return String(item.id) !== String(id); }));
  }

  function toggleWishlist(product) {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return false;
    }
    addToWishlist(product);
    return true;
  }

  function updateHeartButtons() {
    document.querySelectorAll('.card__action-btn--wishlist[data-product-id]').forEach(function (btn) {
      var inList = isInWishlist(btn.dataset.productId);
      btn.dataset.inWishlist = inList ? '1' : '0';
      btn.setAttribute('aria-label', inList ? 'Remove from favourites' : 'Add to favourites');
    });
  }

  function updateWishlistCount() {
    var count = getWishlist().length;
    document.querySelectorAll('.wishlist-count-bubble').forEach(function (el) {
      el.style.display = count > 0 ? '' : 'none';
      var span = el.querySelector('span');
      if (span) span.textContent = count;
    });
  }

  function showToast(added) {
    var existing = document.querySelector('.wishlist-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'wishlist-toast';

    var icon = document.createElement('span');
    icon.className = 'wishlist-toast__icon';
    icon.textContent = '♥';
    toast.appendChild(icon);
    toast.appendChild(document.createTextNode(added ? 'Added to favourites' : 'Removed from favourites'));
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('wishlist-toast--visible'); });
    });

    setTimeout(function () {
      toast.classList.remove('wishlist-toast--visible');
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 350);
    }, 2600);
  }

  // Capture-phase handler — fires before the card anchor navigation
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.card__action-btn--wishlist[data-product-id]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var product = {
      id: btn.dataset.productId,
      title: btn.dataset.productTitle,
      url: btn.dataset.productUrl,
      image: btn.dataset.productImage,
      price: btn.dataset.productPrice,
      priceFormatted: btn.dataset.productPriceFormatted,
      variantId: btn.dataset.variantId
    };

    var added = toggleWishlist(product);
    btn.dataset.inWishlist = added ? '1' : '0';
    btn.setAttribute('aria-label', added ? 'Remove from favourites' : 'Add to favourites');
    showToast(added);
    updateWishlistCount();

    if (window.WishlistPage && window.WishlistPage.render) {
      window.WishlistPage.render();
    }
  }, true);

  function init() {
    updateHeartButtons();
    updateWishlistCount();

    window.addEventListener('storage', function (e) {
      if (e.key !== STORAGE_KEY) return;
      updateHeartButtons();
      updateWishlistCount();
      if (window.WishlistPage && window.WishlistPage.render) window.WishlistPage.render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.WishlistManager = {
    getWishlist: getWishlist,
    addToWishlist: addToWishlist,
    removeFromWishlist: removeFromWishlist,
    isInWishlist: isInWishlist,
    updateHeartButtons: updateHeartButtons,
    updateWishlistCount: updateWishlistCount
  };
})();
