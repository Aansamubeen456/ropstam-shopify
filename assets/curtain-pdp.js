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

      const formatted = `Rs.${parseFloat(price).toFixed(2)}`;

      // Update ALL price elements on page
      document.querySelectorAll(
        '.price-item--regular, .price__regular .money, .price .money, [class*="price-item"]'
      ).forEach(el => {
        el.textContent = formatted;
      });

      // Update Add to Cart button
      document.querySelectorAll(
        '[name="add"], .product-form__submit, button[type="submit"]'
      ).forEach(btn => {
        if (btn.closest('form[action*="/cart/add"], product-form, .product-form')) {
          btn.textContent = `${formatted} — Add to Cart`;
        }
      });

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

    // ── 7. Listen for changes on our custom selectors ──
    document.addEventListener('change', function (e) {
      if (e.target.id === 'curtain-width' || e.target.id === 'curtain-drop') {
        updatePrice();
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