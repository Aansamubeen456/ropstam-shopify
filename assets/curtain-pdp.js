(function () {

  // Run immediately + on DOMContentLoaded for Horizon
  function init() {
    if (!window.curtainData) return;

    const { widthPanelMap, pricingTable, availableWidths, variants } = window.curtainData;

    // ── 1. Aggressively hide ALL native variant picker elements ──
    function hideNativeVariants() {
      // Hide entire variant-selector web component
      document.querySelectorAll('variant-selector').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });

      // Hide individual fieldsets by label text
      document.querySelectorAll('fieldset').forEach(el => {
        el.style.setProperty('display', 'none', 'important');
      });

      // Hide any element whose legend/label contains Fabric Panel OR Drop
      document.querySelectorAll('legend, label').forEach(el => {
        const parent = el.closest('fieldset, .variant-picker__option, .product-form__input');
        if (parent) {
          parent.style.setProperty('display', 'none', 'important');
        }
      });
    }

    // Run immediately and keep retrying for late-rendered components
    hideNativeVariants();
    const hideInterval = setInterval(hideNativeVariants, 200);
    setTimeout(() => clearInterval(hideInterval), 5000);

    // ── 2. Get unique Drop values from variants (option2) ──
    const dropValues = [...new Set(
      variants.filter(v => v.option2).map(v => v.option2)
    )];

    // ── 3. Build our custom Width + Drop selectors ──
    const selectorHTML = `
      <div class="curtain-custom-options" id="curtain-custom-options">
        <div class="curtain-option-row">
          <span class="curtain-option-label">Width</span>
          <select id="curtain-width" class="curtain-select">
            ${availableWidths.map(w => `<option value="${w}">${w}</option>`).join('')}
          </select>
        </div>
        <div class="curtain-option-row">
          <span class="curtain-option-label">Drop</span>
          <select id="curtain-drop" class="curtain-select">
            ${dropValues.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    // ── 4. Inject selectors — only once ──
    function injectSelectors() {
      // Don't inject twice
      if (document.getElementById('curtain-custom-options')) return true;

      const targets = [
        'buy-buttons',
        'product-form',
        '.product-form',
        'form[action*="/cart/add"]'
      ];

      for (const selector of targets) {
        const el = document.querySelector(selector);
        if (el) {
          el.insertAdjacentHTML('beforebegin', selectorHTML);
          return true;
        }
      }
      return false;
    }

    // Retry injection until it works
    if (!injectSelectors()) {
      const injectInterval = setInterval(() => {
        if (injectSelectors()) clearInterval(injectInterval);
      }, 200);
      setTimeout(() => clearInterval(injectInterval), 5000);
    }

    // ── 5. Dynamic price update ──
    // Store base unit price so quantity multiplier can be applied
    let basePrice = 0;

    function getQuantity() {
      const qtyInput = document.querySelector('input[name="quantity"]');
      if (qtyInput) {
        const val = parseInt(qtyInput.value, 10);
        return isNaN(val) || val < 1 ? 1 : val;
      }
      return 1;
    }

    function updateButtonLabel() {
      if (basePrice === 0) return;
      const qty = getQuantity();
      const total = basePrice * qty;
      const formatted = `Rs.${total.toFixed(2)}`;

      // Update only the text span inside the button — do NOT use textContent
      // as that would wipe out the icon and "Added" span HTML structure.
      document.querySelectorAll(
        '[name="add"], .product-form__submit, button[type="submit"]'
      ).forEach(btn => {
        if (btn.closest('form[action*="/cart/add"], product-form, .product-form')) {
          const textSpan = btn.querySelector('.add-to-cart-text__content');
          if (textSpan) {
            textSpan.textContent = `${formatted} — Add to Cart`;
          } else {
            // Fallback: button hasn't been enhanced yet, set textContent
            btn.textContent = `${formatted} — Add to Cart`;
          }
        }
      });
    }

    function updatePrice() {
      const widthEl = document.getElementById('curtain-width');
      const dropEl  = document.getElementById('curtain-drop');
      if (!widthEl || !dropEl) return;

      const widthVal = widthEl.value;
      const dropVal  = dropEl.value;
      const width    = widthVal.replace('cm', '').trim();
      const drop     = dropVal.replace('cm', '').trim();

      // Look up panel count
      const panels = widthPanelMap?.[width];
      if (!panels) {
        console.warn('No panel mapping for width:', width);
        return;
      }

      // Look up price
      const price = pricingTable?.[String(panels)]?.[drop];
      if (price === undefined) {
        console.warn('No price for panels:', panels, 'drop:', drop);
        return;
      }

      // Store base unit price
      basePrice = parseFloat(price);
      const formatted = `Rs.${basePrice.toFixed(2)}`;

      // Update ALL price elements on page (unit price display)
      document.querySelectorAll(
        '.price-item--regular, .price__regular .money, .price .money, [class*="price-item"]'
      ).forEach(el => {
        el.textContent = formatted;
      });

      // Update button label with quantity-aware total
      updateButtonLabel();

      // ── 6. Set correct variant ID for cart submission ──
      const panelLabel = `${panels} Panel${panels > 1 ? 's' : ''}`;
      const match = variants.find(v =>
        v.option1 === panelLabel &&
        v.option2 === dropVal
      );

      if (match) {
        const variantInput = document.querySelector('input[name="id"]');
        if (variantInput) {
          variantInput.value = match.id;
          variantInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        console.log('Matched variant:', match.id, '| Panels:', panelLabel, '| Drop:', dropVal, '| Price:', price);
      } else {
        console.warn('No variant match for:', panelLabel, dropVal);
      }
    }

    // ── 7. Listen for changes on Width/Drop selectors ──
    document.addEventListener('change', function (e) {
      if (e.target.id === 'curtain-width' || e.target.id === 'curtain-drop') {
        updatePrice();
      }
    });

    // ── 8. Listen for quantity changes (input + +/- button clicks) ──
    document.addEventListener('change', function (e) {
      if (e.target.name === 'quantity') {
        updateButtonLabel();
      }
    });
    document.addEventListener('input', function (e) {
      if (e.target.name === 'quantity') {
        updateButtonLabel();
      }
    });
    // The quantity +/- buttons update the input value then trigger click;
    // use a small delay so the input value has already been updated.
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('button[name="plus"], button[name="minus"]');
      if (btn && btn.closest('quantity-selector-component')) {
        setTimeout(updateButtonLabel, 50);
      }
    });

    // Run price update after everything is injected
    setTimeout(updatePrice, 600);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();