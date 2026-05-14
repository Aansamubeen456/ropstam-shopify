# Curtain Product PDP – Shopify Theme Development Task

## Overview

A custom Product Detail Page (PDP) built for a curtain product on Shopify. The PDP dynamically calculates and displays pricing based on the user's selected **Width** and **Drop**, while keeping the **Fabric Panels** variant hidden from the front end. Pricing logic is driven entirely by Shopify Metafields.

---

## Live Demo

> https://aansa-mubeen.myshopify.com/products/london-curtain

---

## GitHub Repository

**Repo:** `https://github.com/Aansamubeen456/ropstam-shopify`

The Shopify theme is connected directly to this repository. All theme changes are committed and pushed via the Shopify GitHub integration — no manual file uploads required.

### Repository Structure

```
ropstam-shopify/
├── assets/
│   ├── curtain-pdp.js        ← Dynamic pricing logic
│   └── curtain-pdp.css       ← Custom selector styles
├── sections/
│   └── curtain-pdp.liquid    ← Metafield data injection
├── templates/
│   └── product.curtain.json  ← Custom product template
```

---

## Files Created

### Templates

| File                             | Purpose                                                                                                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/product.curtain.json` | Custom product template assigned to the curtain product. Loads the native product layout plus the curtain logic section. Removes "You May Also Like" recommendations. |

### Sections

| File                          | Purpose                                                                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sections/curtain-pdp.liquid` | Hidden section that injects `window.curtainData` (metafield values + variant data) into the page for JavaScript consumption. Also loads the CSS and JS assets. |

### Assets

| File                     | Purpose                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/curtain-pdp.js`  | Core logic: hides native Fabric Panel variant picker, injects Width + Drop dropdowns, calculates price dynamically, updates the Add to Cart button, and sets the correct hidden variant ID for cart submission. |
| `assets/curtain-pdp.css` | Styles for the custom Width and Drop selectors to match the native Horizon theme UI.                                                                                                                            |

---

## Shopify Setup

### Step 1: Product Variants

Create the product with **two variant options**:

| Option        | Values                                   | Visibility      |
| ------------- | ---------------------------------------- | --------------- |
| Fabric Panels | 1 Panel, 2 Panels, 3 Panels, 4 Panels    | Hidden (via JS) |
| Drop          | 100cm, 120cm, 140cm, 160cm, 180cm, 200cm | Visible to user |

This creates **24 variants** (4 panels × 6 drop values). Each variant must have its price set in Shopify Admin to match the pricing table below.

---

### Step 2: Metafields

**Settings → Custom Data → Products** and created three metafield definitions:

#### 1. `custom.available_widths` — Type: JSON

Widths shown to the user in the Width dropdown.

```json
["120cm", "160cm", "180cm", "220cm", "260cm", "300cm", "340cm"]
```

#### 2. `custom.width_panel_map` — Type: JSON

Maps each width (in cm, without unit) to the number of fabric panels required.

```json
{
  "120": 1,
  "160": 1,
  "180": 2,
  "220": 2,
  "260": 3,
  "300": 3,
  "340": 4
}
```

#### 3. `custom.pricing_table` — Type: JSON

Maps panel count → drop (in cm, without unit) → price in PKR.

```json
{
  "1": { "100": 45, "120": 50, "140": 55, "160": 60, "180": 65, "200": 70 },
  "2": { "100": 85, "120": 95, "140": 105, "160": 115, "180": 125, "200": 135 },
  "3": {
    "100": 120,
    "120": 135,
    "140": 150,
    "160": 165,
    "180": 180,
    "200": 195
  },
  "4": {
    "100": 155,
    "120": 175,
    "140": 195,
    "160": 215,
    "180": 235,
    "200": 255
  }
}
```

After creating the definitions, assigned all three metafields to curtain product and enter the JSON values above.

---

### Step 3: Assign the Custom Template

1. Go to **Products → London Curtain**
2. Scrolled to the right sidebar → **Theme template**
3. Select `product.curtain` from the dropdown
4. Saved the file

---

## Pricing Logic Explained

```
User selects Width (e.g. 220cm)
         ↓
JS strips unit → "220"
JS looks up width_panel_map["220"] → 2 panels
         ↓
User selects Drop (e.g. 160cm)
JS strips unit → "160"
         ↓
JS looks up pricing_table["2"]["160"] → Rs.115
         ↓
JS updates Add to Cart button → "Rs.115.00 — Add to Cart"
JS finds Shopify variant where option1="2 Panels" AND option2="160cm"
JS sets that variant's ID on the hidden form input
         ↓
User clicks Add to Cart
Shopify charges the variant's stored price (Rs.115) ✓
```

### Key Rules

- **Width** is a UI-only selector — not a Shopify variant option.
- **Fabric Panels** is a real Shopify variant option but is hidden via JavaScript on page load.
- **Drop** is a real Shopify variant option and is visible to the user.
- The pricing table in metafields and the actual variant prices in Shopify Admin **must match**. The metafield drives the display price; the variant price drives the actual charge.

---

## Media Gallery Settings

| Setting              | Value      | Effect                            |
| -------------------- | ---------- | --------------------------------- |
| `media_presentation` | `carousel` | Carousel-style image navigation   |
| `large_first_image`  | `true`     | First image displayed large       |
| `thumbnail_position` | `left`     | Thumbnail column on the left      |
| `thumbnail_width`    | `72`       | Maximum supported thumbnail width |
| `media_fit`          | `cover`    | Images fill the frame cleanly     |

---

## Tech Stack

- **Shopify Liquid** — metafield rendering, data injection into JavaScript
- **Vanilla JavaScript** — dynamic pricing, variant selection, DOM manipulation
- **CSS** — custom selector styling matching Horizon theme
- **Shopify Metafields (JSON type)** — width/panel mapping and pricing table storage
- **Theme:** Horizon (connected to GitHub via Shopify GitHub integration)

---

## Deployment

The theme is connected to the `ropstam-shopify` GitHub repository using Shopify's native GitHub integration.

### How changes are deployed

1. Make changes in Shopify Theme Editor or via Edit Code
2. Shopify automatically commits changes to the connected branch in `ropstam-shopify`
3. The live store reflects changes immediately on save

### To clone and run locally

```bash
# Clone the repo
git clone https://github.com/Aansamubeen456/ropstam-shopify.git
cd ropstam-shopify

# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme

# Pull latest theme from store
shopify theme pull --store aansa-mubeen.myshopify.com

# Preview locally
shopify theme dev --store aansa-mubeen.myshopify.com
```

---

## How to Install on a New Store

1. Clone the `ropstam-shopify` repo and push to a new store via Shopify CLI
2. In Shopify Admin, create the three metafield definitions (Step 2 above)
3. Create the curtain product with the correct variant structure (Step 1 above)
4. Enter metafield values on the product page
5. Set all 24 variant prices to match the pricing table
6. Assign `product.curtain` template to the product
