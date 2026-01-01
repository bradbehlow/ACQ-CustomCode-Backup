<script>

  (function () {
  "use strict";

  // ============================================
  // CONFIGURATION
  // ============================================
  let locationId = null;
  let tokenPromise = null;
  const MIN_SEARCH_CHARS = 3;
  const SEARCH_DEBOUNCE_MS = 400;

  const mortgageTypeMap = {
    Conforming: "Conforming30YrFixed",
    Fha: "FHA30YrFixed",
    Va: "VA30YrFixed",
  };

  let adj = 0;

  // ============================================
  // TOKEN & LOCATION HELPERS
  // ============================================
  function getLocationIdFromUrl() {
    const match = window.location.href.match(/location\/([^\/]+)/);
    return match ? match[1] : null;
  }

  async function getAccessToken(locId) {
    try {
      const response = await fetch(
        `https://api.konnectd.io/api/token/${locId}`
      );
      const data = await response.json();
      return data.success ? data.token : null;
    } catch (error) {
      console.error("Token fetch error:", error);
      return null;
    }
  }

  // Initialize token on load
  (async function initToken() {
    locationId = getLocationIdFromUrl();
    if (locationId) {
      tokenPromise = getAccessToken(locationId);
    }
  })();

  // ============================================
  // SEARCH API
  // ============================================
  async function searchContacts(query) {
    if (!tokenPromise || !locationId) return [];
    const token = await tokenPromise;
    if (!token) return [];

    const filters = [
      {
        group: "OR",
        filters: [
          { field: "firstNameLowerCase", operator: "contains", value: query },
          { field: "lastNameLowerCase", operator: "contains", value: query },
          { field: "email", operator: "contains", value: query },
          { field: "phone", operator: "contains", value: query },
        ],
      },
    ];

    try {
      const response = await fetch(
        "https://services.leadconnectorhq.com/contacts/search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Version: "2021-07-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationId,
            page: 1,
            pageLimit: 20,
            filters,
            sort: [{ field: "dateAdded", direction: "desc" }],
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.contacts || [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  }

  // ============================================
  // FETCH CONTACT DETAILS & CUSTOM FIELDS
  // ============================================
  async function fetchContactDetails(contactId) {
    const token = await tokenPromise;
    if (!token) return null;

    try {
      const response = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Version: "2021-07-28",
          },
        }
      );
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error fetching contact:", error);
      return null;
    }
  }

  async function fetchCustomFields(locationId) {
    const token = await tokenPromise;
    if (!token) return null;

    try {
      const response = await fetch(
        `https://services.leadconnectorhq.com/locations/${locationId}/customFields?model=contact`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Version: "2021-07-28",
          },
        }
      );
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error("Error fetching custom fields:", error);
      return null;
    }
  }

  async function getMortgageRates() {
    try {
      const response = await fetch("https://api.konnectd.io/mortgage-rate");
      const data = await response.json();
      return data.success ? data.rates : null;
    } catch (error) {
      console.error("Error fetching mortgage rates:", error);
      return null;
    }
  }

  function uncheckAllCheckboxes() {
    // Placeholder function - not needed in reusable popup context
    console.log("Checkbox cleanup called");
  }

  // ============================================
  // CREATE RATE ALERT POPUP WITH CONTACT SEARCH
  // ============================================
  // ============================================
  // COPY createGHLCustomModal FUNCTION FROM tarref.html AND PASTE IT HERE
  // (The full ~1500 line function with all CSS, HTML, and modal logic)
  // ============================================
  function createGHLCustomModal(
    title,
    ratesObject,
    customerData = [],
    inputType = "number",
    errorMessage = null
  ) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(30,30,60,0.8) 100%);
                      backdrop-filter: blur(10px);
                      -webkit-backdrop-filter: blur(10px);
                      z-index: 9999;
                      display: flex;
                      justify-content: center;
                      align-items: center;
                      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                      opacity: 0;
                      animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
                      background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%);
                      backdrop-filter: blur(20px);
                      -webkit-backdrop-filter: blur(20px);
                      padding: 0;
                      border-radius: 15px;
                      width: 520px;
                      max-width: 90vw;
                      max-height: 90vh;
                      overflow-y: auto;
                      box-shadow: 0 20px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.2);
                      border: 1px solid rgba(255,255,255,0.3);
                      position: relative;
                      transform: scale(0.8) translateY(40px);
                      animation: modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
                    `;

    // Add keyframe animations
    const style = document.createElement("style");
    style.textContent = `
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
              
                      @keyframes modalSlideIn {
                        to {
                          transform: scale(1) translateY(0);
                        }
                      }
              
                   
              
                      .modal-header-gradient {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                        background-size: 200% 200%;
                     
                      }
              
                      .input-focus-effect:focus,
                      .select-focus-effect:focus {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3), 0 0 0 3px rgba(102, 126, 234, 0.1);
                      }
              
                      input[type="number"]::-webkit-outer-spin-button,
                      input[type="number"]::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                      }
              
                      .button-hover-effect:hover {
                        transform: translateY(-2px);
                      }
              
                      .floating-particles {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                        overflow: hidden;
                      }
              
                      .particle {
                        position: absolute;
                        width: 4px;
                        height: 4px;
                        background: rgba(102, 126, 234, 0.3);
                        border-radius: 50%;
                        animation: float 6s ease-in-out infinite;
                      }
              
                      @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                        50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                      }
              
                      .tooltip {
                        position: relative;
                        display: inline-block;
                        cursor: help;
                      }
              
                      .tooltip .tooltiptext {
                        visibility: hidden;
                        width: 280px;
                        background-color: #374151;
                        color: white;
                        text-align: left;
                        border-radius: 8px;
                        padding: 12px;
                        position: absolute;
                        z-index: 1;
                        bottom: 125%;
                        left: 50%;
                        margin-left: -140px;
                        opacity: 0;
                        transition: opacity 0.3s;
                        font-size: 13px;
                        line-height: 1.4;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                      }
              
                      .tooltip .tooltiptext::after {
                        content: "";
                        position: absolute;
                        top: 100%;
                        left: 50%;
                        margin-left: -5px;
                        border-width: 5px;
                        border-style: solid;
                        border-color: #374151 transparent transparent transparent;
                      }
              
                      .tooltip:hover .tooltiptext {
                        visibility: visible;
                        opacity: 1;
                      }
                      
                      /* Hide number input spinners */
                      .no-wheel-change::-webkit-outer-spin-button,
                      .no-wheel-change::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                      }
              
                      .no-wheel-change {
                        -moz-appearance: textfield;
                      }
                      
                      /* Floating Particles */
                      .floating-particles {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                        overflow: hidden;
                      }
              
                      .particle {
                        position: absolute;
                        width: 4px;
                        height: 4px;
                        background: rgba(102, 126, 234, 0.3);
                        border-radius: 50%;
                        animation: float 6s ease-in-out infinite;
                      }
              
                      @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                        50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                      }
              
                      /* Modal Header Gradient */
                      .modal-header-gradient {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                        background-size: 200% 200%;
                     
                      }
              
                   
              
                      /* Modal Animations */
                      @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                      }
              
                      @keyframes modalSlideIn {
                        to {
                          transform: scale(1) translateY(0);
                        }
                      }
              
                      @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                      }
              
                      /* Input Focus Effects */
                      .input-focus-effect:focus,
                      .select-focus-effect:focus {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3), 0 0 0 3px rgba(102, 126, 234, 0.1);
                      }
              
                      /* Button Hover Effects */
                      .button-hover-effect:hover {
                        transform: translateY(-2px);
                      }
              
                      /* Success Popup Animations */
                      @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                      }
              
                      @keyframes successGlow {
                        0%, 100% { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3); }
                        50% { box-shadow: 0 10px 40px rgba(16, 185, 129, 0.5); }
                      }
              
                      .success-header-gradient {
                        background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                        background-size: 200% 200%;
            
                      }
              
                      /* ====== IMPROVED MODAL STRUCTURE ====== */
              
                      /* Modal Premium Header - Reduced Padding */
                      .modal-premium-header {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                        background-size: 200% 200%;
                      
                        padding: 20px 24px 16px 24px;
                        color: white;
                        text-align: center;
                        position: relative;
                      }
              
                      .modal-close-btn {
                        position: absolute;
                        top: 12px;
                        right: 16px;
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease;
                      }
              
                      .modal-close-btn:hover {
                        background: rgba(255, 255, 255, 0.3);
                        transform: rotate(90deg);
                      }
              
                      .modal-close-icon {
                        width: 16px;
                        height: 16px;
                      }
              
                      .modal-main-title {
                        margin: 0;
                        font-size: 20px;
                        font-weight: 700;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        line-height: 1.3;
                      }
              
                      .modal-subtitle {
                        margin: 6px 0 0 0;
                        font-size: 12px;
                        opacity: 0.9;
                        line-height: 1.4;
                      }
              
                      .modal-rate-display {
                        margin: 8px 0 0 0;
                        font-size: 15px;
                        font-weight: 600;
                      }
              
                      /* Content Area - Improved Padding */
                      .modal-content-area {
                        padding: 20px 24px;
                        max-height: calc(85vh - 180px);
                        overflow-y: auto;
                        overflow-x: hidden;
                      }
              
                      /* Custom Scrollbar */
                      .modal-content-area::-webkit-scrollbar {
                        width: 8px;
                      }
              
                      .modal-content-area::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 4px;
                      }
              
                      .modal-content-area::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 4px;
                      }
              
                      .modal-content-area::-webkit-scrollbar-thumb:hover {
                        background: #94a3b8;
                      }
              
                      /* Form Sections - Tighter Spacing */
                      .loan-type-selector {
                        margin: 0 0 12px 0;
                      }
              
                      .loan-type-label {
                        display: block;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: #333;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                      }
              
                      .loan-type-dropdown {
                        position: relative;
                        width: 100%;
                      }
              
                      .loan-type-select {
                        width: 100%;
                        padding: 5px 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        background: white;
                        font-size: 13px;
                        appearance: none;
                        cursor: pointer;
                        transition: all 0.2s ease;
                      }
              
                      .loan-type-select:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                      }
              
                      .loan-type-chevron {
                        position: absolute;
                        right: 12px;
                        top: 50%;
                        transform: translateY(-50%);
                        pointer-events: none;
                        color: #6b7280;
                      }
              
                      /* Alert Type Section - Now includes input fields */
                      .alert-type-section {
                        margin: 16px 0;
                        padding: 16px;
                        background: #f8fafc;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                      }
              
                      .alert-type-title {
                        font-size: 12px;
                        font-weight: 600;
                        color: #374151;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                      }
              
                      .radio-group {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 16px;
                      }
              
                      .radio-option {
                        flex: 1;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                         padding: 5px 10px;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                        background: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        position: relative;
                      }
              
                      .radio-option:hover {
                        border-color: #cbd5e1;
                        background: #f8fafc;
                      }
              
                      .radio-option.selected {
                        border-color: #667eea;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                      }
              
                      .radio-option.selected .radio-icon {
                color: white;
            }
              
                    /* Update radio icon styles for Font Awesome */
            .radio-icon {
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px; /* Reset font-size for the container */
            }
            
            .radio-icon i {
                font-size: 14px; /* Size for the icons */
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .radio-option.selected .radio-icon i {
                color: white; /* White icon when selected */
            }
            
            .radio-option:not(.selected) .radio-icon i {
                color: #6b7280; /* Gray icon when not selected */
            }
              
                      .radio-label {
                        font-size: 13px;
                        font-weight: 500;
                        margin: 0;
                      }
              
                      /* Input Sections - Now inside alert-type-section */
                      .rate-trigger-section,
                      .drop-amount-section {
                        margin: 16px 0 0 0;
                      }
              
                      .rate-trigger-header,
                      .drop-amount-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 6px;
                        gap: 6px;
                      }
              
                      .rate-trigger-label,
                      .drop-amount-label {
                        font-weight: 600;
                        color: #333;
                        font-size: 13px;
                      }
              
                      .tooltip-icon,
                      .tooltip1 svg,
                      .tooltip3 svg {
                        cursor: help;
                      }
              
                      .input-wrapper,
                      .input-container {
                        display: flex;
                        align-items: center;
                        position: relative;
                      }
              
                      .rate-input,
                      .drop-input {
                        flex: 1;
                        padding: 5px 10px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 13px;
                        transition: all 0.2s ease;
                      }
              
                      .rate-input:focus,
                      .drop-input:focus {
                        outline: none;
                        border-color: #667eea;
                        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                      }
              
                      .input-suffix {
                        position: absolute;
                        right: 14px;
                        color: #6b7280;
                        font-weight: 600;
                        font-size: 12px;
                        pointer-events: none;
                      }
              
                      /* Contacts Section - Optimized Height */
                      .contacts-section {
                        margin: 16px 0;
                      }
              
                      .contacts-label {
                        display: block;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: #333;
                        font-size: 12px;
                      }
              
                      .contacts-container {
                        max-height: 180px;
                        overflow-y: auto;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 8px;
                        background: #fafbfc;
                      }
              
                      .contacts-container::-webkit-scrollbar {
                        width: 6px;
                      }
              
                      .contacts-container::-webkit-scrollbar-track {
                        background: #f1f5f9;
                        border-radius: 3px;
                      }
              
                      .contacts-container::-webkit-scrollbar-thumb {
                        background: #cbd5e1;
                        border-radius: 3px;
                      }
              
                      /* Disclaimer Section - Compact */
                      .disclaimer-container {
                        margin: 16px 0;
                        background: linear-gradient(135deg, #1e293b 0%, #374151 100%);
                        border-radius: 8px;
                        overflow: hidden;
                      }
              
                      .disclaimer-top-border {
                        height: 3px;
                        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
                      }
              
                      .disclaimer-content {
                        display: flex;
                        align-items: flex-start;
                        padding: 12px 14px;
                        gap: 10px;
                      }
              
                      .disclaimer-icon {
                        flex-shrink: 0;
                        margin-top: 2px;
                      }
              
                      .disclaimer-svg {
                        width: 16px;
                        height: 16px;
                      }
              
                      .disclaimer-text {
                        flex: 1;
                      }
              
                      .disclaimer-heading {
                        margin: 0 0 4px 0;
                        color: white;
                        font-size: 13px;
                        font-weight: 600;
                      }
              
                      .disclaimer-message {
                        margin: 0;
                        color: #d1d5db;
                        font-size: 11px;
                        line-height: 1.5;
                      }
              
                      /* Action Buttons - Compact */
                      .modal-action-buttons {
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 18px;
                        padding-top: 18px;
                        border-top: 1px solid #e2e8f0;
                      }
              
                      .modal-btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 8px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                      }
              
                      .modal-btn--cancel {
                        background: #6b7280;
                        color: white;
                      }
              
                      .modal-btn--confirm {
                        background: linear-gradient(135deg, #007bff, #0056b3);
                        color: white;
                        box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
                      }
              
                      .modal-btn--cancel:hover {
                        background: #5a6268;
                        transform: translateY(-1px);
                      }
              
                      .modal-btn--confirm:hover {
                        background: linear-gradient(135deg, #0056b3, #004085);
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
                      }
              
                      .modal-btn__text {
                        display: inline-block;
                      }
              
                      /* Contact Selection Popup Styles */
                      .contact-item {
                        transition: all 0.2s ease;
                        cursor: pointer;
                      }
              
                      .contact-item:hover {
                        background: linear-gradient(90deg, #f0f7ff, #e3f2fd) !important;
                        transform: translateX(6px);
                      }
              
                      .contact-checkbox {
                        transform: scale(1.15);
                        accent-color: #007bff;
                        cursor: pointer;
                      }
              
                      /* Tooltip Variants */
                      .tooltip1,
                      .tooltip3 {
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                      }
              
                      .tooltip1-text,
                      .tooltip3-text {
                        visibility: hidden;
                        width: 260px;
                        background-color: #374151;
                        color: white;
                        text-align: left;
                        border-radius: 6px;
                        padding: 10px;
                        position: absolute;
                        z-index: 1000;
                        bottom: 125%;
                        left: 50%;
                        margin-left: -130px;
                        opacity: 0;
                        transition: opacity 0.3s;
                        font-size: 11px;
                        line-height: 1.5;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                      }
              
                      .tooltip1-text::after,
                      .tooltip3-text::after {
                        content: "";
                        position: absolute;
                        top: 100%;
                        left: 50%;
                        margin-left: -5px;
                        border-width: 5px;
                        border-style: solid;
                        border-color: #374151 transparent transparent transparent;
                      }
              
                      .tooltip1:hover .tooltip1-text,
            .tooltip3:hover .tooltip3-text {
              visibility: visible;
              opacity: 1;
              z-index: 9999; /* ensures tooltip appears above other elements */
                position: absolute;
            
            }
            
            .question-mark {
              position: relative;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 15px;
              height: 15px;
              margin-left: 3px;
              background-color: #9ca3af;
              color: #fff;
              border-radius: 50%;
              font-size: 10px;
              cursor: pointer;
              vertical-align: middle; /* ADD THIS LINE */
              margin-bottom: 2px; /* ADD THIS LINE */
            }
            
            .tooltip-text {
              visibility: hidden;
              opacity: 0;
              position: absolute;
              bottom: 125%;
              left: 50%;
              transform: translateX(-50%);
              background-color: #374151; /* CHANGE TO DARKER GRAY FOR BETTER VISIBILITY */
              color: #fff;
              text-align: center;
              border-radius: 6px;
              padding: 8px 12px;
              white-space: nowrap;
              z-index: 9999;
              transition: opacity 0.2s ease;
              min-width: 200px; /* ADD MIN-WIDTH */
              max-width: 250px; /* ADD MAX-WIDTH */
              word-wrap: break-word; /* ALLOW TEXT TO WRAP */
              white-space: normal; /* ALLOW MULTILINE */
            }
            
            /* Update the arrow color to match */
            .tooltip-text::after {
              content: "";
              position: absolute;
              top: 100%;
              left: 50%;
              margin-left: -5px;
              border-width: 5px;
              border-style: solid;
              border-color: #374151 transparent transparent transparent; /* MATCH BACKGROUND */
            }
            /* Show tooltip on hover */
            .question-mark:hover .tooltip-text {
              visibility: visible;
              opacity: 1;
            }
            
            .advanced-toggle {
                      cursor: pointer;
                      color: #374151;
                      font-weight: 600;
                      font-size: 13px;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                      margin-top: 12px;
                    }
                    .advanced-toggle i { transition: transform .2s; }
                    .advanced-toggle.open i { transform: rotate(90deg); }
            
                    .advanced-section {
                      margin-top: 12px;
                      padding: 12px;
                      background: #f1f5f9;
                      border-radius: 8px;
                      border: 1px solid #e2e8f0;
                      display: none;
                    }
                    .advanced-section.show { display: block; }
            
                    .advanced-label {
                      font-weight: 600;
                      color: #333;
                      font-size: 13px;
                      margin-bottom: 6px;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                    }
                    .advanced-input-wrapper {
                      display: flex;
                      align-items: center;
                      position: relative;
                    }
                    .advanced-input {
                      flex: 1;
                      padding: 5px 10px;
                      border: 1px solid #e2e8f0;
                      border-radius: 8px;
                      font-size: 13px;
                      transition: all 0.2s ease;
                    }
                    .advanced-input:focus {
                      outline: none;
                      border-color: #667eea;
                      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                    }
                    .advanced-suffix { position: absolute; right: 14px; color: #6b7280; font-weight: 600; font-size: 12px; pointer-events: none; }
                  
            
            
              
                      /* Responsive adjustments */
                      @media (max-height: 800px) {
                        .modal-content-area {
                          max-height: calc(80vh - 160px);
                        }
                        
                        .contacts-container {
                          max-height: 140px;
                        }
                      }
              
                      @media (max-height: 700px) {
                        .modal-premium-header {
                          padding: 16px 20px 14px 20px;
                        }
                        
                        .modal-content-area {
                          padding: 16px 20px;
                          max-height: calc(75vh - 140px);
                        }
                        
                        .contacts-container {
                          max-height: 120px;
                        }
                      }
                    `;
    document.head.appendChild(style);

    const generateCustomerContactsHTML = () => {
      if (!customerData || customerData.length === 0) {
        return `
                          <div style="
                            text-align: center;
                            color: #6b7280;
                            font-style: italic;
                            padding: 18px;
                          ">No contacts selected</div>
                        `;
      }

      const maxVisibleContacts = 3;
      const contactHeight = 30;
      const headerHeight = 36;
      const maxHeight = headerHeight + maxVisibleContacts * contactHeight;

      const header = `
                        <div style="
                          display: flex;
                          align-items: center;
                          padding: 6px 10px;
                          background: #e5e7eb;
                          font-weight: bold;
                          color: #111827;
                          border-radius: 2px;
                          margin-bottom: 3px;
                          border: 1px solid #d1d5db;
                          position: sticky;
                          top: 0;
                          z-index: 1;
                        ">
                          <span style="flex: 1; font-size: 12px;">Contact</span>
                          <span style="
                            width: 90px;
                            text-align: right;
                            font-size: 12px;
                            margin-right: 10px;
                            display: flex;
                            align-items: center;
                            justify-content: flex-end;
                            gap: 4px;
                          ">
                            <div class="tooltip3" style="position: relative;">
                             
                              <span class="tooltip3-text">
                                A value here means an alert is already set. Saving a new one will replace it.
                              </span>
                            </div>
                            Target
                          </span>
                          <span style="width: 110px; text-align: right; font-size: 12px;">Interest Rate</span>
                        </div>
              
                        <div style="overflow-y: auto; max-height: ${maxHeight}px; padding-right: 4px;">`;

      let contactsHTML = customerData
        .map((customer) => {
          return `
                            <div style="
                              display: flex;
                              align-items: center;
                              padding: 8px 10px;
                              background: linear-gradient(145deg, #f8fafc 0%, #ffffff 100%);
                              border-radius: 8px;
                              margin-bottom: 2px;
                              border: 1px solid #e2e8f0;
                            ">
                              <span style="
                                flex: 1;
                                font-weight: 600;
                                color: #374151;
                                font-size: 12px;
                                overflow-wrap: break-word;
                              ">${customer.name || "--"}</span>
                              <span style="
                                width: 90px;
                                font-weight: 700;
                                color: #1f2937;
                                font-size: 12px;
                                text-align: right;
                              ">${customer.targetRateofContact || "--"}</span>
                              <span style="
                                width: 110px;
                                font-weight: 700;
                                color: #1f2937;
                                font-size: 12px;
                                text-align: right;
                              ">${customer.rate}</span>
                            </div>
                          `;
        })
        .join("");

      return header + contactsHTML + "</div>";
    };

    modal.innerHTML = `
                  <div class="floating-particles">
                      <div class="particle" style="left: 10%; animation-delay: 0s;"></div>
                      <div class="particle" style="left: 20%; animation-delay: 1s;"></div>
                      <div class="particle" style="left: 30%; animation-delay: 2s;"></div>
                      <div class="particle" style="left: 60%; animation-delay: 3s;"></div>
                      <div class="particle" style="left: 80%; animation-delay: 4s;"></div>
                  </div>
              
                  <!-- Premium Header -->
                 <div class="modal-premium-header" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 0 40px rgba(102, 126, 234, 0.4);
                padding: 28px 32px 24px;
                text-align: center;
                position: relative;
                border-radius: 15px 15px 0 0;
            ">
                      <!-- Close Button -->
                      <div id="closeButton" style="
                          position: absolute;
                          top: 16px;
                          right: 20px;
                          width: 32px;
                          height: 32px;
                          background: rgba(255, 255, 255, 0.2);
                          border-radius: 50%;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          cursor: pointer;
                          transition: all 0.3s ease;
                          border: 1px solid rgba(255, 255, 255, 0.3);
                      ">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                      </div>
              
                      <h2 class="modal-main-title" style="
                          margin: 0 0 8px 0;
                          font-size: 24px;
                          font-weight: 700;
                          color: white;
                          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      ">Set Rate Alert</h2>
                      
                      <div class="modal-subtitle" style="
                          font-size: 14px;
                          color: rgba(255, 255, 255, 0.9);
                          margin-bottom: 16px;
                          line-height: 1.4;
                      ">${title}</div>
                      
                     <h2 class="modal-rate-display" style="
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: white;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            ">Current national average: <span id="currentRateDisplay" style="font-weight: 700;">${
              ratesObject.Conforming
            }%</span></h2>
                  </div>
              
                  <!-- Content Area -->
                  <div class="modal-content-area" style="padding: 32px;">
              
                      <!-- Loan Type Dropdown -->
                      <div class="loan-type-selector" style="margin-bottom: 24px;">
                          <label class="loan-type-label" style="
                              display: block;
                              font-size: 12px;
                              font-weight: 600;
                              color: #374151;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              margin-bottom: 8px;
                          ">SELECT LOAN TYPE</label>
              
                          <div class="loan-type-dropdown" style="position: relative;">
                              <select id="mortgageTypeSelect" class="loan-type-select select-focus-effect" style="
                                  width: 100%;
                                 
                                  border: 2px solid #e5e7eb;
                                  border-radius: 8px;
                               
                                  font-weight: 500;
                                  color: #374151;
                                  background: white;
                                  cursor: pointer;
                                  appearance: none;
                                  transition: all 0.3s ease;
                              ">
                                  <option value="Conforming" selected>CONFORMING</option>
                                  <option value="Fha">FHA</option>
                                  <option value="Va">VA</option>
                              </select>
                              <div class="loan-type-chevron" style="
                                  position: absolute;
                                  right: 16px;
                                  top: 50%;
                                  transform: translateY(-50%);
                                  pointer-events: none;
                                  color: #6b7280;
                              ">
                                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                  </svg>
                              </div>
                          </div>
                      </div>
            
                      <!-- Alert Type Section - Now includes input fields -->
                      <div class="alert-type-section" style="margin-bottom: 24px;">
                          <div class="alert-type-title">
                              <span>Choose Alert Type</span>
                              <div class="tooltip" style="position: relative; display: inline-block;">
                                  <svg width="16" height="16" fill="#9ca3af" viewBox="0 0 20 20" class="tooltip-icon" style="cursor: help;">
                                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                                  </svg>
                                  <span class="tooltiptext">
                                      Target Rate: Alert when national average reaches this exact rate<br>
                                      Drop Amount: Alert when national average drops by this amount from today
                                  </span>
                              </div>
                          </div>
                          <div class="radio-group">
                              <div class="radio-option selected" data-type="target">
                                <div class="radio-icon"><i class="fas fa-bullseye"></i></div>
                                  <span class="radio-label">Target Rate</span>
                              </div>
                              <div class="radio-option" data-type="drop">
                                     <div class="radio-icon"><i class="fas fa-arrow-down"></i></div>
                                  <span class="radio-label">Drop Amount</span>
                              </div>
                          </div>
            
                          <!-- Target Rate Input - Now inside alert-type-section -->
                          <div id="target-rate-section" class="rate-trigger-section">
                              <div class="rate-trigger-header">
                                  <label class="rate-trigger-label">Target Rate (%)   <span class="question-mark">
                ?
                <span class="tooltip-text">Alert me when the national average drops to this rate or lower.</span>
              </span></label>
                                  <div class="tooltip" style="position: relative; display: inline-block;">
                                      <svg width="16" height="16" fill="#9ca3af" viewBox="0 0 20 20" class="tooltip-icon" style="cursor: help;">
                                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                                      </svg>
                                      <span class="tooltiptext">
                                          Alert me when the national average drops by at least this much from today.
                                      </span>
                                  </div>
                              </div>
              
                              <div class="input-wrapper">
                                  <input type="${inputType}" id="targetRateInput" class="rate-input input-focus-effect" step="0.01" placeholder="Enter rate (e.g. 6.25)">
                                  <div class="input-suffix">%</div>
                              </div>
            
                              <!-- ==== NEW: ADVANCED SETTINGS TOGGLE ==== -->
                          <div class="advanced-toggle" id="advancedToggle">
                            <i class="fas fa-chevron-right"></i> Advanced Settings
                          </div>
            
                          <div class="advanced-section" id="advancedSection">
                            <div class="advanced-label">
                              Adjusts for your typical pricing. Example: -0.50 if you usually price half a percent below the average market rate.">?</span>
                            </div>
                            <div class="advanced-input-wrapper">
                              <input type="text" id="adjustmentInput" class="advanced-input input-focus-effect no-wheel-change" placeholder="Enter offset (e.g. -0.50)">
                              <div class="advanced-suffix">%</div>
                            </div>
                          </div>
            
            
            
                          </div>
            
                          <!-- Drop Amount Input - Now inside alert-type-section -->
                          <div id="drop-amount-section" class="drop-amount-section" style="display: none;">
                              <div class="drop-amount-header">
                                  <label class="drop-amount-label">Drop Amount (%)  <span class="question-mark">
                ?
                <span class="tooltip-text">Alert me when rates fall this much from the client’s rate.
            </span>
              </span></label>
                                  <div class="tooltip" style="position: relative; display: inline-block;">
                                      <svg width="16" height="16" fill="#9ca3af" viewBox="0 0 20 20" class="tooltip-icon" style="cursor: help;">
                                          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                                      </svg>
                                      <span class="tooltiptext">
                                          Adjusts for your typical pricing. Example: -0.50 if you usually price half a percent below the average market rate.
                                      </span>
                                  </div>
                              </div>
              
                              <div class="input-container">
                                  <input type="number" id="dropAmountInput" class="drop-input input-focus-effect no-wheel-change" step="0.01" placeholder="Enter amount (e.g. 0.50)">
                                  <div class="input-suffix">%</div>
                              </div>
                              
                              <!-- Error message for drop amount -->
                              <div id="drop-amount-error" style="
                                  display: ${errorMessage ? "block" : "none"};
                                  margin-top: 8px;
                                  padding: 8px 12px;
                                  background: #fef2f2;
                                  border: 1px solid #fecaca;
                                  border-radius: 6px;
                                  color: #dc2626;
                                  font-size: 12px;
                                  font-weight: 500;
                              ">
                                  <svg style="width: 14px; height: 14px; display: inline-block; margin-right: 6px; vertical-align: middle;" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                  </svg>
                                  ${errorMessage || ""}
                              </div>
                          </div>
                      </div>
              
                      <!-- Selected Contacts Section -->
                      <div id="selected-contacts-section" class="contacts-section" style="margin-bottom: 24px;">
                          <label class="contacts-label" style="
                              display: block;
                              font-size: 12px;
                              font-weight: 600;
                              color: #374151;
                              text-transform: uppercase;
                              letter-spacing: 0.5px;
                              margin-bottom: 8px;
                          ">Selected Contacts</label>
                          <div class="contacts-container" style="
                              background: #f8f9fa;
                              border-radius: 8px;
                              border: 1px solid #e5e7eb;
                              padding: 8px;
                          ">
                              ${generateCustomerContactsHTML()}
                          </div>
                      </div>
              
                      <!-- Combined Disclaimer Section -->
                      <div id="disclaimer-section" class="disclaimer-container" style="
                          background: linear-gradient(135deg, #1e293b 0%, #374151 100%);
                          border-radius: 8px;
                          margin-bottom: 24px;
                          overflow: hidden;
                      ">
                          <div class="disclaimer-top-border" style="
                              height: 4px;
                              background: linear-gradient(135deg, #1e293b 0%, #374151 100%);
                          "></div>
                          
                          <div class="disclaimer-content" style="
                              display: flex;
                              align-items: flex-start;
                              padding: 16px;
                          ">
                              <div class="disclaimer-icon" style="
                                  margin-right: 12px;
                                  margin-top: 2px;
                                  flex-shrink: 0;
                              ">
                                  <svg width="20" height="20" fill="white" viewBox="0 0 20 20" class="disclaimer-svg">
                                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                  </svg>
                              </div>
              
                              <div class="disclaimer-text" style="flex: 1;">
                                  <h4 class="disclaimer-heading" style="
                                      margin: 0 0 4px 0;
                                      font-size: 14px;
                                      font-weight: 700;
                                      color: white;
                                  ">Heads-up:</h4>
                                  <p class="disclaimer-message" style="
                                      margin: 0;
                                      font-size: 12px;
                                      color: white;
                                      line-height: 1.4;
                                      opacity: 0.9;
                                  ">Rate alerts are based on national average movements and may not match lender pricing. Always reprice in your LOS before quoting a borrower.</p>
                              </div>
                          </div>
                      </div>
              
                      <!-- Action Buttons -->
                      <div class="modal-action-buttons" style="
                          display: flex;
                          gap: 12px;
                          justify-content: flex-end;
                      ">
                          <button id="customModalCancel" class="modal-btn modal-btn--cancel" style="
                              padding: 12px 24px;
                              background: #6b7280;
                              color: white;
                              border: none;
                              border-radius: 8px;
                              font-size: 14px;
                              font-weight: 600;
                              cursor: pointer;
                              transition: all 0.3s ease;
                              flex: 1;
                          ">Cancel</button>
                          <button id="customModalConfirm" class="modal-btn modal-btn--confirm button-hover-effect" style="
                              padding: 12px 24px;
                              background: linear-gradient(135deg, #007bff, #0056b3);
                              color: white;
                              border: none;
                              border-radius: 8px;
                              font-size: 14px;
                              font-weight: 600;
                              cursor: pointer;
                              transition: all 0.3s ease;
                              flex: 1;
                              box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
                          ">
                              <span class="modal-btn__text">Set Alert</span>
                          </button>
                      </div>
                  </div>
              `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Radio button functionality
    const radioOptions = modal.querySelectorAll(".radio-option");
    const targetRateSection = modal.querySelector("#target-rate-section");
    const dropAmountSection = modal.querySelector("#drop-amount-section");
    const targetRateInput = modal.querySelector("#targetRateInput");
    const dropAmountInput = modal.querySelector("#dropAmountInput");

    radioOptions.forEach((option) => {
      option.addEventListener("click", () => {
        radioOptions.forEach((opt) => opt.classList.remove("selected"));
        option.classList.add("selected");

        // Clear any error messages
        const errorDiv = document.getElementById("drop-amount-error");
        if (errorDiv) {
          errorDiv.style.display = "none";
        }

        const type = option.dataset.type;
        if (type === "target") {
          targetRateSection.style.display = "block";
          dropAmountSection.style.display = "none";
          targetRateInput.focus();
          dropAmountInput.value = "";
        } else {
          targetRateSection.style.display = "none";
          dropAmountSection.style.display = "block";
          dropAmountInput.focus();
          targetRateInput.value = "";
          // Show error if it was passed as parameter
          if (errorMessage) {
            setTimeout(() => {
              if (errorDiv) {
                errorDiv.style.display = "block";
              }
            }, 100);
          }
        }
      });
    });

    /* ---------- ADVANCED SETTINGS TOGGLE ---------- */
    const advToggle = modal.querySelector("#advancedToggle");
    const advSection = modal.querySelector("#advancedSection");
    advToggle.addEventListener("click", () => {
      const isOpen = advSection.classList.toggle("show");
      advToggle.classList.toggle("open", isOpen);
      if (isOpen) {
        advToggle.querySelector("i").style.transform = "rotate(90deg)";
        setTimeout(() => {
          const input = modal.querySelector("#adjustmentInput");
          input.focus();
          requestAnimationFrame(() =>
            input.setSelectionRange(input.value.length, input.value.length)
          );
        }, 100);
      } else {
        advToggle.querySelector("i").style.transform = "";
      }
    });

    /* ---------- INPUT MASK: "-" FIX + DECIMAL SAFE ---------- */
    const adjustmentInput = modal.querySelector("#adjustmentInput");

    adjustmentInput.addEventListener("input", (e) => {
      const input = e.target;
      const oldVal = input.value;
      const oldPos = input.selectionStart;

      let val = oldVal;

      // Convert ".something" to "-0.something" if it starts with "."
      if (val.startsWith(".")) {
        val = "-0" + val;
        input.value = val;
        requestAnimationFrame(() => {
          input.setSelectionRange(val.length, val.length);
        });
        return;
      }

      // Convert "-.something" to "-0.something"
      if (val.startsWith("-.")) {
        const decimalPart = val.slice(2); // Get everything after "-."
        val = "-0." + decimalPart;
        input.value = val;
        requestAnimationFrame(() => {
          input.setSelectionRange(val.length, val.length);
        });
        return;
      }

      // Keep only digits + one dot + one minus
      let clean = val.replace(/[^0-9.-]/g, "");

      // Ensure only one minus at the start
      const minusCount = (clean.match(/-/g) || []).length;
      if (minusCount > 0) {
        clean = "-" + clean.replace(/-/g, "");
      } else {
        // Only add minus if there's content
        if (clean.length > 0) {
          clean = "-" + clean;
        }
      }

      // Ensure only one decimal point
      const parts = clean.split(".");
      if (parts.length > 2) {
        clean = parts[0] + "." + parts.slice(1).join("");
      }

      val = clean;

      // Replace only if actually changed
      if (val !== oldVal) {
        const diff = val.length - oldVal.length;
        input.value = val;
        requestAnimationFrame(() => {
          const newPos = Math.max(0, oldPos + diff);
          input.setSelectionRange(newPos, newPos);
        });
      }
    });

    /* ---------- TOOLTIP FOR ADJUSTMENT ? ---------- */
    const adjTooltip = advSection.querySelector(".question-mark");
    if (adjTooltip) {
      const tipHTML = adjTooltip.getAttribute("data-tip");
      if (tipHTML) {
        const tipSpan = document.createElement("span");
        tipSpan.className = "tooltip-text";
        tipSpan.innerHTML = tipHTML;
        adjTooltip.style.position = "relative";
        adjTooltip.appendChild(tipSpan);

        adjTooltip.addEventListener("mouseenter", () => {
          tipSpan.style.visibility = "visible";
          tipSpan.style.opacity = "1";
        });
        adjTooltip.addEventListener("mouseleave", () => {
          tipSpan.style.visibility = "hidden";
          tipSpan.style.opacity = "0";
        });
      }
    }

    const tooltips = modal.querySelectorAll(".tooltip");
    tooltips.forEach((tooltip) => {
      tooltip.addEventListener("mouseenter", function () {
        const tooltipText = this.querySelector(".tooltiptext");
        if (tooltipText) {
          tooltipText.style.visibility = "visible";
          tooltipText.style.opacity = "1";
        }
      });

      tooltip.addEventListener("mouseleave", function () {
        const tooltipText = this.querySelector(".tooltiptext");
        if (tooltipText) {
          tooltipText.style.visibility = "hidden";
          tooltipText.style.opacity = "0";
        }
      });
    });

    // event listener for dynamic rate update
    const mortgageTypeSelect = document.getElementById("mortgageTypeSelect");
    const currentRateDisplay = document.getElementById("currentRateDisplay");

    mortgageTypeSelect.addEventListener("change", (e) => {
      const selectedType = e.target.value;
      currentRateDisplay.textContent = ratesObject[selectedType] + "%";

      //smooth transition effect
      currentRateDisplay.style.opacity = 0;
      setTimeout(() => {
        currentRateDisplay.textContent = ratesObject[selectedType] + "%";
        currentRateDisplay.style.opacity = 1;
      }, 200);
    });

    // Focus first input field automatically with a slight delay for animation
    setTimeout(() => {
      const select = document.getElementById("mortgageTypeSelect");
      if (select) {
        select.focus();
      }
    }, 600);

    return new Promise((resolve) => {
      const cleanup = () => {
        overlay.style.animation = "fadeOut 0.3s ease-out forwards";
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }

          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 300);
        uncheckAllCheckboxes();
      };

      const getFormValues = () => {
        const mortgageType =
          document.getElementById("mortgageTypeSelect").value;
        const targetRateValue =
          document.getElementById("targetRateInput").value;
        const dropAmountValue =
          document.getElementById("dropAmountInput").value;
        const adjustmentValue =
          document.getElementById("adjustmentInput").value || "";
        const selectedType = document.querySelector(".radio-option.selected")
          .dataset.type;

        // Only require target rate if NO advanced adjustment is provided
        const hasAdjustment = adjustmentValue.trim() && adjustmentValue !== "-";
        if (
          selectedType === "target" &&
          !targetRateValue.trim() &&
          !hasAdjustment
        ) {
          alert("Please enter a Target Rate value or use Advanced Settings.");
          return null;
        }

        if (selectedType === "drop" && !dropAmountValue.trim()) {
          alert("Please enter a Drop Amount value.");
          return null;
        }

        // Check for missing interest rate when using drop amount
        if (selectedType === "drop") {
          const hasValidRate = customerData.some((contact) => {
            const rate = parseFloat(contact.rate);
            return !isNaN(rate) && rate > 0;
          });

          if (!hasValidRate) {
            // Show inline error instead of alert
            const errorDiv = document.getElementById("drop-amount-error");
            if (errorDiv) {
              errorDiv.style.display = "block";
              errorDiv.innerHTML = `
                  <svg style="width: 14px; height: 14px; display: inline-block; margin-right: 6px; vertical-align: middle;" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                  </svg>
                  Missing interest rate — Please enter a current rate to set this alert.
                `;
              // Focus the drop amount input to draw attention
              document.getElementById("dropAmountInput").focus();
            }
            return null;
          }
        }

        // If advanced adjustment is provided, auto-calculate the target rate
        let finalTargetRate = targetRateValue;
        if (selectedType === "target" && hasAdjustment) {
          adj = hasAdjustment;
          const currentNationalAvg = parseFloat(ratesObject[mortgageType]);
          const adjustmentNum = parseFloat(adjustmentValue);
          finalTargetRate = (currentNationalAvg + adjustmentNum).toFixed(3);
        }

        return {
          mortgageType: mortgageType,
          mortgageTypeValue: mortgageTypeMap[mortgageType] || mortgageType,
          rate: selectedType === "target" ? targetRateValue : "",
          dropAmount: selectedType === "drop" ? dropAmountValue : "",
          adjustment: adjustmentValue || "",
          alertType: selectedType,
        };
      };

      document.getElementById("closeButton").addEventListener("click", () => {
        cleanup();
        resolve(null);
      });

      document
        .getElementById("customModalConfirm")
        .addEventListener("click", () => {
          const values = getFormValues();
          if (values) {
            cleanup();
            resolve(values);
          }
        });

      document
        .getElementById("customModalCancel")
        .addEventListener("click", () => {
          cleanup();
          resolve(null);
        });

      const handleEnterKey = (e) => {
        if (e.key === "Enter") {
          const values = getFormValues();
          if (values) {
            cleanup();
            resolve(values);
          }
        }
      };

      document
        .getElementById("targetRateInput")
        .addEventListener("keypress", handleEnterKey);
      document
        .getElementById("dropAmountInput")
        .addEventListener("keypress", handleEnterKey);

      document.addEventListener("keydown", function escapeHandler(e) {
        if (e.key === "Escape") {
          cleanup();
          resolve(null);
          document.removeEventListener("keydown", escapeHandler);
        }
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });
    });
  }

  // ============================================
  // END OF createGHLCustomModal - PASTE ABOVE THIS LINE
  // ============================================

  // ============================================
  // MAIN POPUP LOGIC WITH CONTACT SEARCH
  // ============================================
  async function showRateAlertPopup() {
    // Step 1: Show contact search popup
    const selectedContact = await showContactSearchPopup();

    if (!selectedContact) {
      console.log("No contact selected");
      return null;
    }

    // Step 2: Fetch contact details and custom fields
    const contactDetails = await fetchContactDetails(selectedContact.id);
    if (!contactDetails) {
      alert("Failed to fetch contact details");
      return null;
    }

    const customFieldsData = await fetchCustomFields(locationId);
    if (!customFieldsData) {
      alert("Failed to fetch custom fields");
      return null;
    }

    // Step 3: Extract interest rate from custom fields
    const interestRateField = customFieldsData.customFields?.find(
      (field) => field.fieldKey === "contact.interest_rate"
    );

    const contact = contactDetails.contact;
    const rateField = contact.customFields?.find(
      (field) => field.id === interestRateField?.id
    );
    const interestRate = rateField?.value
      ? parseFloat(rateField.value).toFixed(3)
      : "--";

    // Step 4: Prepare customer data for the rate alert popup
    const customerData = [
      {
        name:
          `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
          "Unknown Contact",
        rate: interestRate,
        targetRateofContact: "--",
      },
    ];

    // Step 5: Fetch mortgage rates
    const awsNationalRate = await getMortgageRates();
    if (!awsNationalRate) {
      alert("Failed to fetch current mortgage rates.");
      return null;
    }

    const parseRate = (rateStr) => {
      if (!rateStr || rateStr === "--") return null;
      return parseFloat(rateStr.replace("%", ""));
    };

    const awsConformingRate =
      parseRate(awsNationalRate["30_yr_conforming"]) || "--";
    const awsFHARate = parseRate(awsNationalRate["30_yr_fha"]) || "--";
    const awsVARate = parseRate(awsNationalRate["30_yr_va"]) || "--";

    const ratesObject = {
      Conforming: awsConformingRate,
      Fha: awsFHARate,
      Va: awsVARate,
    };

    // Step 6: Show the rate alert popup (createGHLCustomModal)
    const result = await createGHLCustomModal(
      `You'll be notified when the national average drops to or below your selected target.`,
      ratesObject,
      customerData
    );

    return result;
  }

  // ============================================
  // CONTACT SEARCH POPUP
  // ============================================
  function showContactSearchPopup() {
    return new Promise((resolve) => {
      // Inject search popup styles
      const style = document.createElement("style");
      style.id = "contact-search-popup-styles";
      style.textContent = `
                .contact-search-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0;
                    animation: fadeIn 0.3s forwards;
                }
                .contact-search-popup {
                    background: white;
                    border-radius: 12px;
                    width: 500px;
                    max-width: 90vw;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    transform: scale(0.9);
                    animation: popIn 0.3s forwards;
                }
                .contact-search-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .contact-search-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1e293b;
                    margin: 0;
                }
                .contact-search-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #64748b;
                    cursor: pointer;
                    padding: 0;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .contact-search-close:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .contact-search-body {
                    padding: 24px;
                }
                .contact-search-label {
                    display: block;
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .contact-search-input-wrapper {
                    position: relative;
                }
                .contact-search-input {
                    width: 100%;
                    padding: 10px 14px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.2s;
                }
                .contact-search-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                .contact-search-hint {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 6px;
                }
                .contact-search-dropdown {
                    margin-top: 12px;
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: #fafbfc;
                    display: none;
                }
                .contact-search-dropdown.show {
                    display: block;
                }
                .contact-search-item {
                    padding: 12px 16px;
                    cursor: pointer;
                    border-bottom: 1px solid #f1f5f9;
                    transition: background 0.2s;
                }
                .contact-search-item:hover {
                    background: #f8fafc;
                }
                .contact-search-item:last-child {
                    border-bottom: none;
                }
                .contact-search-item-name {
                    font-weight: 500;
                    color: #111827;
                    margin-bottom: 4px;
                }
                .contact-search-item-details {
                    font-size: 12px;
                    color: #64748b;
                }
                .contact-search-loading,
                .contact-search-no-results {
                    padding: 16px;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                }
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    to { transform: scale(1); }
                }
            `;
      document.head.appendChild(style);

      // Create popup HTML
      const overlay = document.createElement("div");
      overlay.className = "contact-search-overlay";
      overlay.innerHTML = `
                <div class="contact-search-popup">
                    <div class="contact-search-header">
                        <h3 class="contact-search-title">Select Contact</h3>
                        <button class="contact-search-close">&times;</button>
                    </div>
                    <div class="contact-search-body">
                        <label class="contact-search-label">Search Contact</label>
                        <div class="contact-search-input-wrapper">
                            <input 
                                type="text" 
                                class="contact-search-input" 
                                placeholder="Type name, email, or phone..."
                                autocomplete="off"
                            />
                        </div>
                        <div class="contact-search-hint">Enter at least ${MIN_SEARCH_CHARS} characters to search</div>
                        <div class="contact-search-dropdown" id="contactSearchDropdown"></div>
                    </div>
                </div>
            `;

      document.body.appendChild(overlay);

      const input = overlay.querySelector(".contact-search-input");
      const dropdown = overlay.querySelector("#contactSearchDropdown");
      const closeBtn = overlay.querySelector(".contact-search-close");

      let searchTimeout = null;

      // Search functionality
      input.addEventListener("input", () => {
        const query = input.value.trim();

        clearTimeout(searchTimeout);
        dropdown.classList.remove("show");

        if (query.length < MIN_SEARCH_CHARS) return;

        dropdown.innerHTML =
          '<div class="contact-search-loading">Searching...</div>';
        dropdown.classList.add("show");

        searchTimeout = setTimeout(async () => {
          const contacts = await searchContacts(query);

          if (contacts.length === 0) {
            dropdown.innerHTML =
              '<div class="contact-search-no-results">No contacts found</div>';
            return;
          }

          dropdown.innerHTML = contacts
            .map((contact) => {
              const name =
                `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                "No Name";
              const email = contact.email || "—";
              const phone = contact.phone || "—";

              return `
                            <div class="contact-search-item" data-contact-id="${contact.id}">
                                <div class="contact-search-item-name">${name}</div>
                                <div class="contact-search-item-details">${email} • ${phone}</div>
                            </div>
                        `;
            })
            .join("");

          // Add click handlers to items
          dropdown
            .querySelectorAll(".contact-search-item")
            .forEach((item, index) => {
              item.addEventListener("click", () => {
                cleanup();
                resolve(contacts[index]);
              });
            });
        }, SEARCH_DEBOUNCE_MS);
      });

      // Close handlers
      const cleanup = () => {
        overlay.remove();
        style.remove();
      };

      closeBtn.addEventListener("click", () => {
        cleanup();
        resolve(null);
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(null);
        }
      });

      document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
          cleanup();
          resolve(null);
          document.removeEventListener("keydown", escHandler);
        }
      });

      // Focus input
      setTimeout(() => input.focus(), 100);
    });
  }

  // ============================================
  // EXPOSE GLOBAL API
  // ============================================
  window.ReusablePopup = {
    open: async function () {
      return await showRateAlertPopup();
    },
  };

  console.log("✅ Reusable Rate Alert Popup loaded");
})();


</script>
