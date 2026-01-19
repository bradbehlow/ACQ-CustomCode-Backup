<script>
  // for target rate ref button

  (function () {
    // ==========================================
    // SHARED CONFIGURATION & UTILITIES
    // ==========================================

    const currentLocationId = getLocationIdFromUrl();
    console.log("DEBUG: Current Location ID:", currentLocationId);

    let adj = 0;

    var locationId1 = currentLocationId;
    var tokenPromise = (async () => {
      return await getAccessToken(locationId1);
    })();

    // Field IDs (shared)
    var FIELD_IDS = {
      rate: "target_rate",
      type: "mortgage_type",
      targetRate: "target_rate",
      alertSetBy: "ALERT_USER_FIELD_ID",
      nationalAverage: "national_average_rate",
    };

    var mortgageTypeMap = {
      Conforming: "Conforming30YrFixed",
      Fha: "FHA30YrFixed",
      Va: "VA30YrFixed",
    };

    // ==========================================
    // PAGE DETECTION & ROUTING
    // ==========================================

    const isContactDetailPage = window.location.href.includes("/detail/");
    const isConversationsPage =
      window.location.href.includes("/conversations/");

    console.log("DEBUG: Page Detection", {
      isContactDetail: isContactDetailPage,
      isConversations: isConversationsPage,
    });

    // ==========================================
    // SHARED HELPER FUNCTIONS
    // ==========================================

    function getLocationIdFromUrl() {
      const url = window.location.href;
      const match = url.match(/location\/([^\/]+)/);
      return match ? match[1] : null;
    }

    function getContactIdFromUrl() {
      const url = window.location.href;
      const match = url.match(/detail\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }

    function getContactIdFromConversationGlobal() {
      console.log("🔍 GETTING CONTACT ID FROM CONVERSATION");
      console.log("📍 Current URL:", window.location.href);

      // Try multiple methods to get contact ID from conversation page

      // Method 1: Check URL for contact ID
      const urlMatch = window.location.href.match(/contact[\/_]([a-zA-Z0-9]+)/);
      if (urlMatch) {
        console.log("📍 Found contact ID in URL:", urlMatch[1]);
        return urlMatch[1];
      }

      // Method 2: Check for selected conversation elements
      const conversationElements =
        document.querySelectorAll("[data-contact-id]");
      if (conversationElements.length > 0 && conversationElements[0]) {
        const contactId =
          conversationElements[0].getAttribute("data-contact-id");
        console.log("📍 Found contact ID in data attribute:", contactId);
        return contactId;
      }

      // Method 3: Look for active/selected conversation
      const activeConversation = document.querySelector(
        '.conversation-item.active, .conversation.selected, [class*="selected"][class*="conversation"]'
      );
      if (activeConversation) {
        const contactId =
          activeConversation.getAttribute("data-contact-id") ||
          activeConversation.getAttribute("data-id") ||
          activeConversation.id;
        console.log("📍 Found contact ID in active conversation:", contactId);
        return contactId;
      }

      // Method 4: Check for contact info in page
      const contactInfo = document.querySelector(
        '[data-testid="contact-info"], .contact-info, .contact-details'
      );
      if (contactInfo) {
        const contactId =
          contactInfo.getAttribute("data-contact-id") ||
          contactInfo.getAttribute("data-id");
        console.log("📍 Found contact ID in contact info:", contactId);
        return contactId;
      }

      console.log("❌ No contact ID found in conversation page");
      return null;
    }

    async function getAccessToken(locationId1) {
      try {
        const response = await fetch(
          `https://api.konnectd.io/api/token/${locationId1}`
        );
        const data = await response.json();
        return data.success ? data.token : null;
      } catch (error) {
        console.error("Error fetching token:", error);
        return null;
      }
    }

    async function fetchContactDetails(contactId) {
      const token = await tokenPromise;
      try {
        const res = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Version: "2021-07-28",
            },
          }
        );
        return res.ok ? await res.json() : null;
      } catch (err) {
        console.error("Error fetching contact:", err);
        return null;
      }
    }

    async function fetchCustomFields(locationId1) {
      const token = await tokenPromise;
      try {
        const res = await fetch(
          `https://services.leadconnectorhq.com/locations/${locationId1}/customFields?model=contact`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Version: "2021-07-28",
            },
          }
        );
        return res.ok ? await res.json() : null;
      } catch (err) {
        console.error("Error fetching custom fields:", err);
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

    // payment button

    // Add this function in the SHARED HELPER FUNCTIONS section (after getMortgageRates function)

    function hidePaymentButtons() {
      // Find all payment buttons by the SVG path signature
      const allButtons = document.querySelectorAll(
        "button.sidebar-option-button"
      );

      allButtons.forEach((button) => {
        const svg = button.querySelector("svg");
        if (svg) {
          const path = svg.querySelector('path[d*="M8.5 14.667"]');
          if (path) {
            // Hide the button
            button.style.display = "none";
            console.log("DEBUG: ✅ Payment button hidden");
          }
        }
      });
    }

    function setupPaymentButtonHiding() {
      // Initial hide
      hidePaymentButtons();

      // Watch for new buttons being added
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.addedNodes.length) {
            hidePaymentButtons();
          }
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Also check periodically as a fallback
      setInterval(hidePaymentButtons, 1000);
    }

    // [INCLUDE ALL YOUR MODAL FUNCTIONS HERE - createGHLCustomModal, showSuccessPopup, updateCustomFields, sendToFlask, showPopup3]
    // I'm keeping them abbreviated for length, but you should include the full versions

    function createGHLCustomModal(
      title,
      ratesObject,
      customerData = [],
      inputType = "number"
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

          //   if (selectedType === "target" && !targetRateValue.trim()) {
          //     alert("Please enter a Target Rate value.");
          //     return null;
          //   }

          // Only require target rate if NO advanced adjustment is provided
          const hasAdjustment =
            adjustmentValue.trim() && adjustmentValue !== "-";
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

    function showSuccessPopup(message, autoClose = false) {
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
                                z-index: 99999;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                                opacity: 0;
                                animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                            `;

      const popup = document.createElement("div");
      popup.style.cssText = `
                                background: linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%);
                                backdrop-filter: blur(20px);
                                -webkit-backdrop-filter: blur(20px);
                                padding: 0;
                                border-radius: 20px;
                                width: 320px;
                                max-width: 90vw;
                                box-shadow: 0 25px 50px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2);
                                border: 1px solid rgba(255,255,255,0.3);
                                text-align: center;
                                position: relative;
                                overflow: hidden;
                                transform: scale(0.8) translateY(40px);
                                animation: modalSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
                            `;

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
              
              
                                @keyframes pulse {
                                    0%, 100% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                }
              
                                @keyframes checkmarkDraw {
                                    0% { stroke-dasharray: 0 100; }
                                    100% { stroke-dasharray: 100 0; }
                                }
              
                                @keyframes successGlow {
                                    0%, 100% { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3); }
                                    50% { box-shadow: 0 10px 40px rgba(16, 185, 129, 0.5); }
                                }
              
                                .success-header-gradient {
                                    background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
                                    background-size: 200% 200%;
                          
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
                                    background: rgba(16, 185, 129, 0.3);
                                    border-radius: 50%;
                                    animation: float 6s ease-in-out infinite;
                                }
              
                                @keyframes float {
                                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
                                    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
                                }
              
                                @keyframes fadeOut {
                                    from { opacity: 1; }
                                    to { opacity: 0; }
                                }
                            `;
      document.head.appendChild(style);

      popup.innerHTML = `
                                <div class="floating-particles">
                                    <div class="particle" style="left: 15%; animation-delay: 0s;"></div>
                                    <div class="particle" style="left: 25%; animation-delay: 1s;"></div>
                                    <div class="particle" style="left: 45%; animation-delay: 2s;"></div>
                                    <div class="particle" style="left: 65%; animation-delay: 3s;"></div>
                                    <div class="particle" style="left: 85%; animation-delay: 4s;"></div>
                                </div>
              
                                <!-- Premium Success Header -->
                                <div class="success-header-gradient" style="
                                    padding: 28px 32px 24px 32px;
                                    position: relative;
                                ">
                                    <div style="
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        flex-direction: column;
                                        text-align: center;
                                    ">
                                        <h2 style="
                                            margin: 0;
                                            font-size: 24px;
                                            font-weight: 700;
                                            color: white;
                                            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                                            line-height: 1.2;
                                        ">Rate Alert Saved!</h2>
                                    </div>
                                </div>
              
                                <!-- Content Area -->
                                <div style="padding: 32px;">
                                    <!-- Success Icon -->
                                    <div style="
                                        margin-bottom: 24px;
                                        display: flex;
                                        justify-content: center;
                                    ">
                                        <div style="
                                            width: 80px;
                                            height: 80px;
                                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                            border-radius: 50%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            animation: pulse 2s infinite, successGlow 3s ease-in-out infinite;
                                        ">
                                            <svg style="width: 40px; height: 40px; color: white;" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd">
                                                    <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/>
                                                </path>
                                            </svg>
                                        </div>
                                    </div>
              
                                    <!-- Message Section -->
                                    <div style="
                                        margin-bottom: 20px;
                                        position: relative;
                                        overflow: hidden;
                                    ">
                                        <div style="
                                            margin-bottom: 10px;
                                            font-size: 14px;
                                            line-height: 1.4;
                                            color: #1e293b;
                                            font-weight: 500;
                                        ">
                                            You'll be notified when the market meets your conditions.
                                        </div>
              
                                        <div style="
                                            font-size: 12px;
                                            line-height: 1.5;
                                            color: #64748b;
                                        ">
                                            <span id="dashboardLink" style="color: #3b82f6; text-decoration: underline; font-weight: 500; cursor: pointer;">
                                                You can view and manage all rate alerts on your dashboard.
                                            </span>
                                        </div>
                                    </div>
              
                                    <!-- Action Button -->
                                    <button
                                        id="successPopupOk"
                                        class="button-hover-effect"
                                        style="
                                            padding: 12px 23px;
                                            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                                            border: none;
                                            border-radius: 12px;
                                            color: white;
                                            font-size: 12px;
                                            font-weight: 600;
                                            cursor: pointer;
                                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                            box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
                                            letter-spacing: 0.3px;
                                            min-width: 180px;
                                        "
                                        onmouseover="
                                            this.style.background='linear-gradient(135deg, #059669 0%, #047857 100%)';
                                            this.style.boxShadow='0 12px 30px rgba(16, 185, 129, 0.6)';
                                        "
                                        onmouseout="
                                            this.style.background='linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                            this.style.boxShadow='0 8px 20px rgba(16, 185, 129, 0.4)';
                                        "
                                    >
                                        Close window
                                    </button>
                                </div>
                            `;

      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      const closePopup = () => {
        overlay.style.animation = "fadeOut 0.3s ease-out forwards";
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }

          if (document.head.contains(style)) {
            document.head.removeChild(style);
          }
        }, 300);
      };

      document.getElementById("dashboardLink").addEventListener("click", () => {
        closePopup();
        const locationId = getLocationIdFromUrl();
        if (locationId) {
          const baseUrl = window.location.hostname.includes("konnectd.io")
            ? "https://app.konnectd.io"
            : "https://app.gohighlevel.com";
          const dashboardUrl =
            baseUrl + "/v2/location/" + locationId + "/dashboard";
          window.open(dashboardUrl, "_blank");
        }
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closePopup();
        }
      });
      document
        .getElementById("successPopupOk")
        .addEventListener("click", closePopup);

      document.addEventListener("keydown", function handleKey(e) {
        if (e.key === "Enter" || e.key === "Escape") {
          closePopup();
          document.removeEventListener("keydown", handleKey);
        }
      });
    }

    async function updateCustomFields(contactId, fields) {
      const token = await tokenPromise;
      const requestData = {
        tags: [],
        customFields: [
          {
            key: FIELD_IDS.rate,
            value: fields.rate,
          },
          {
            key: FIELD_IDS.nationalAverage,
            value: fields.nationalAverage,
          },
        ],
      };

      const response = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            Version: "2021-07-28",
          },
          body: JSON.stringify(requestData),
        }
      );

      return await response.json();
    }

    function sendToFlask(
      contactIds,
      rate,
      mortgageType,
      alertType = "target",
      adjustment = ""
    ) {
      if (!locationId1) return;
      const flaskUrl = `https://api.konnectd.io/target-rate?location_id=${locationId1}&contactIds=${encodeURIComponent(
        contactIds.join(",")
      )}&rate=${encodeURIComponent(rate)}&mortgageType=${encodeURIComponent(
        mortgageType
      )}&alertType=${encodeURIComponent(alertType)}`;

      fetch(flaskUrl)
        .then((res) => res.json())
        .then((data) => console.log("Flask Response:", data))
        .catch((err) => console.error("Flask Error:", err));
    }

    async function showPopup3(contactIds, singleContactDetails = null) {
      console.log("🚀 SHOWPOPUP3 CALLED");
      console.log("📍 Contact IDs:", contactIds);
      console.log("📋 Single Contact Details (RAW):", singleContactDetails);
      console.log(
        "📋 Type of singleContactDetails:",
        typeof singleContactDetails
      );
      console.log(
        "📋 Is singleContactDetails null?:",
        singleContactDetails === null
      );
      console.log(
        "📋 Is singleContactDetails undefined?:",
        singleContactDetails === undefined
      );

      try {
        console.log("🔄 Fetching mortgage rates...");
        const awsNationalRate = await getMortgageRates();
        console.log("📋 AWS National Rate:", awsNationalRate);

        if (!awsNationalRate) {
          console.error("❌ Failed to fetch current mortgage rates");
          alert("Failed to fetch current mortgage rates.");
          return;
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

        console.log("🔄 Fetching custom fields for location:", locationId1);
        const customFieldsfrombackend = await fetchCustomFields(locationId1);
        console.log("📋 Custom fields from backend:", customFieldsfrombackend);

        if (!customFieldsfrombackend || !customFieldsfrombackend.customFields) {
          console.error(
            "❌ Failed to fetch custom fields or customFields missing"
          );
          console.error("❌ customFieldsfrombackend:", customFieldsfrombackend);
          alert("Failed to fetch custom fields.");
          return;
        }

        console.log("🔍 Looking for interest rate field...");
        const interestRateField = customFieldsfrombackend.customFields.find(
          (field) => field.fieldKey === "contact.interest_rate"
        );
        console.log("📋 Interest rate field:", interestRateField);

        console.log("🔍 Looking for target rate field...");
        const targetRateField = customFieldsfrombackend.customFields.find(
          (field) => field.fieldKey === "contact.target_rate"
        );
        console.log("📋 Target rate field:", targetRateField);

        let customerData;
        if (singleContactDetails) {
          console.log("🔄 Processing single contact details...");
          console.log(
            "📋 singleContactDetails keys:",
            Object.keys(singleContactDetails)
          );

          // More flexible contact extraction
          let contact = null;

          // Try different ways to get the contact object
          if (singleContactDetails.contact) {
            console.log("📋 Found contact via .contact property");
            contact = singleContactDetails.contact;
          } else if (singleContactDetails.id) {
            console.log(
              "📋 singleContactDetails appears to be the contact itself"
            );
            contact = singleContactDetails;
          } else if (
            singleContactDetails.data &&
            singleContactDetails.data.contact
          ) {
            console.log("📋 Found contact via .data.contact property");
            contact = singleContactDetails.data.contact;
          } else {
            console.error(
              "❌ Could not find contact object in singleContactDetails:",
              singleContactDetails
            );
            console.error(
              "❌ Available properties:",
              Object.keys(singleContactDetails)
            );
            alert("Invalid contact details: could not find contact object.");
            return;
          }

          console.log("📋 Extracted contact object:", contact);
          console.log("📋 Contact object keys:", Object.keys(contact));

          if (!contact.id) {
            console.error("❌ Contact missing 'id' property:", contact);
            console.error("❌ Contact keys:", Object.keys(contact));
            alert("Contact ID is missing from contact details.");
            return;
          }

          console.log("✅ Contact ID found:", contact.id);

          const firstName = contact.firstName || "";
          const lastName = contact.lastName || "";
          const name = `${firstName} ${lastName}`.trim() || "Unknown Contact";
          console.log("📋 Contact name:", name);

          if (!interestRateField) {
            console.error("❌ Interest rate field not found in custom fields");
          } else {
            console.log(
              "🔍 Looking for rate field with ID:",
              interestRateField.id
            );
          }

          if (!targetRateField) {
            console.error("❌ Target rate field not found in custom fields");
          } else {
            console.log(
              "🔍 Looking for target rate field with ID:",
              targetRateField.id
            );
          }

          console.log("📋 Contact custom fields:", contact.customFields);
          console.log(
            "📋 Contact custom fields type:",
            typeof contact.customFields
          );
          console.log(
            "📋 Contact custom fields is array:",
            Array.isArray(contact.customFields)
          );

          const rateField = contact.customFields?.find(
            (field) => field.id === interestRateField?.id
          );
          console.log("📋 Found rate field:", rateField);

          const targetrateField = contact.customFields?.find(
            (field) => field.id === targetRateField?.id
          );
          console.log("📋 Found target rate field:", targetrateField);

          const rate = rateField?.value
            ? parseFloat(rateField.value).toFixed(3)
            : "--";
          console.log("📋 Processed rate:", rate);

          const targetRateofContact = targetrateField?.value
            ? parseFloat(targetrateField.value).toFixed(3)
            : "--";
          console.log("📋 Processed target rate:", targetRateofContact);

          customerData = [{ name, rate, targetRateofContact }];
          console.log("📋 Final customer data:", customerData);
        } else {
          console.log(
            "📝 No single contact details provided, using empty customer data"
          );
          customerData = [];
        }

        const targetRate = await createGHLCustomModal(
          `You'll be notified when the national average drops to or below your selected target.`,
          ratesObject,
          customerData
        );

        if (targetRate === null) return;

        const adjustment = targetRate.adjustment?.trim() || "";

        const newOption = targetRate.mortgageType || "Conforming";
        let awsaverageRates;

        if (newOption === "Conforming") {
          awsaverageRates = awsConformingRate;
        } else if (newOption === "Fha") {
          awsaverageRates = awsFHARate;
        } else if (newOption === "Va") {
          awsaverageRates = awsVARate;
        } else {
          alert("Please select a valid mortgage type.");
          return;
        }

        const flaskRate =
          newOption === "Conforming"
            ? "30_Yr_Conforming"
            : newOption === "Fha"
            ? "30_Yr_FHA"
            : "30_Yr_VA";

        const awsNational = awsaverageRates;
        let optimalTargetValue;
        let alertType = targetRate.alertType || "target";

        // if (alertType === "target") {
        //   optimalTargetValue = parseFloat(targetRate.rate);
        // } else {
        //   const dropAmount = parseFloat(targetRate.dropAmount);
        //   const contactCurrentInterestRate = parseFloat(customerData[0].rate);

        //   if (
        //     isNaN(contactCurrentInterestRate) ||
        //     contactCurrentInterestRate === 0
        //   ) {
        //     alert(
        //       "Cannot set drop amount alert: Contact's current interest rate is not available or invalid."
        //     );
        //     return;
        //   }

        //   optimalTargetValue = contactCurrentInterestRate - dropAmount;
        // }

        console.log(
          "---------------------->>>>>>>",
          customerData[0],
          customerData[0].rate,
          targetRate
        );

        if (alertType === "target") {
          optimalTargetValue = parseFloat(targetRate.rate);
          if (adj) {
            const currentNationalAvg = parseFloat(ratesObject[newOption]);
            const adjustmentNum = parseFloat(adjustment);
            optimalTargetValue = parseFloat(
              (currentNationalAvg + adjustmentNum).toFixed(3)
            );
          }
        } else {
          const dropAmount = parseFloat(targetRate.dropAmount);
          const contactCurrentInterestRate = parseFloat(customerData[0].rate);

          if (
            isNaN(contactCurrentInterestRate) ||
            contactCurrentInterestRate === 0
          ) {
            alert(
              "Cannot set drop amount alert: Contact's current interest rate is not available or invalid."
            );
            return;
          }

          optimalTargetValue = contactCurrentInterestRate - dropAmount;
        }

        // if (isNaN(optimalTargetValue)) {
        //   alert("Please provide a valid value.");
        //   return;
        // }

        //console all of this

        console.log("Contact IDs:", contactIds);
        console.log("Optimal Target Value:", optimalTargetValue);
        console.log("Flask Rate:", flaskRate);
        console.log("Alert Type:", alertType);
        console.log("Adjustment:", adjustment);

        // Send to Flask and update contacts
        sendToFlask(
          contactIds,
          optimalTargetValue,
          flaskRate,
          alertType,
          adjustment
        );

        await Promise.all(
          contactIds.map((id) =>
            updateCustomFields(id, {
              rate: optimalTargetValue,
              mortgageType: mortgageTypeMap[newOption],
              targetRate: optimalTargetValue,
              nationalAverage: awsNational,
            })
          )
        );

        showSuccessPopup();
      } catch (error) {
        console.error("❌ SHOWPOPUP3 ERROR:", error);
        console.error("❌ Error name:", error.name);
        console.error("❌ Error message:", error.message);
        console.error("❌ Error stack:", error.stack);
        console.error("❌ Contact IDs that caused error:", contactIds);
        console.error(
          "❌ Single contact details that caused error:",
          singleContactDetails
        );
        alert("Failed to set alert: " + error.message);
      }
    }

    function extractContactData(contactDetails, customFields) {
      if (!contactDetails?.contact || !customFields?.customFields) return null;

      const contact = contactDetails.contact;
      const fields = customFields.customFields;

      const loanAmountField = fields.find(
        (f) =>
          f.fieldKey === "contact.loan_amount" ||
          f.name?.toLowerCase().includes("loan amount")
      );
      const loanTermField = fields.find(
        (f) =>
          f.fieldKey === "contact.amortization_term" ||
          f.fieldKey === "contact.loan_term" ||
          f.name?.toLowerCase().includes("term")
      );
      const interestRateField = fields.find(
        (f) =>
          f.fieldKey === "contact.interest_rate" ||
          f.name?.toLowerCase().includes("interest rate")
      );
      const fundedDateField = fields.find(
        (f) => f.fieldKey === "contact.loan_funded"
      );

      const loanAmountValue = contact.customFields?.find(
        (f) => f.id === loanAmountField?.id
      )?.value;
      const loanTermValue = contact.customFields?.find(
        (f) => f.id === loanTermField?.id
      )?.value;
      const interestRateValue = contact.customFields?.find(
        (f) => f.id === interestRateField?.id
      )?.value;
      const fundedDateValue = contact.customFields?.find(
        (f) => f.id === fundedDateField?.id
      )?.value;

      return {
        loanAmount: loanAmountValue || "",
        loanTerm: loanTermValue || "",
        interestRate: interestRateValue || "",
        fundedDate: fundedDateValue || "",
      };
    }

    // ====== ON DEMAND REFINANCE POPUP FUNCTION ======
    async function showOnDemandRefiPopup(contactData = null) {
      if (document.getElementById("on-demand-refi-popup")) return;

      // Create overlay
      const overlay = document.createElement("div");
      overlay.id = "on-demand-refi-popup";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.zIndex = "9999";
      overlay.style.backdropFilter = "blur(8px)";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.padding = "20px";
      overlay.style.boxSizing = "border-box";
      document.body.appendChild(overlay);

      // Add CSS animation
      const style = document.createElement("style");
      style.textContent = `
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes expandDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 400px;
            transform: translateY(0);
          }
        }
        
        .expand-animation {
          animation: expandDown 0.3s ease-out;
          overflow: hidden;
        }
      `;
      document.head.appendChild(style);

      // Create popup
      const popup = document.createElement("div");
      popup.style.position = "fixed";
      popup.style.top = "50%";
      popup.style.left = "50%";
      popup.style.transform = "translate(-50%, -50%)";
      popup.style.background = "rgba(255,255,255,0.98)";
      popup.style.backdropFilter = "blur(20px)";
      popup.style.padding = "0";
      popup.style.boxShadow =
        "0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.3)";
      popup.style.zIndex = "10000";
      popup.style.borderRadius = "24px";
      popup.style.width = "520px";
      popup.style.maxWidth = "95vw";
      popup.style.maxHeight = "90vh";
      popup.style.fontFamily =
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      popup.style.overflow = "hidden";
      popup.style.animation = "slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
      popup.style.border = "1px solid rgba(255,255,255,0.2)";

      popup.innerHTML = `
        <div style="padding: 40px; max-height: 90vh; overflow-y: auto; box-sizing: border-box;">
          <h2 style="
            margin: 0 0 35px 0; 
            color: #1a202c; 
            text-align: center;
            font-size: 28px;
            font-weight: 800;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.5px;
          ">Refinance Analysis</h2>
          
          <!-- LOAN DETAILS SECTION -->
          <div style="
            margin-bottom: 30px;
            padding: 28px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          ">
            <h3 style="
              margin: 0 0 20px 0;
              color: #374151;
              font-size: 18px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
            ">
              <span style="
                background: linear-gradient(135deg, #667eea, #764ba2);
                width: 6px;
                height: 24px;
                border-radius: 3px;
                display: inline-block;
              "></span>
              Loan Details
            </h3>
            
            <div style="display: grid; gap: 20px;">
              <!-- Current Loan Amount -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">Current Loan Amount ($)</label>
                <input type="text" id="currentLoanAmount" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  placeholder="0.00"
                  onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
              </div>
              
              <!-- Current Term -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">Current Term (months)</label>
                <input type="text" id="currentTerm" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  placeholder="0"
                  onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
              </div>
              
              <!-- Current Loan Rate -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">Current Loan Rate (%)</label>
                <input type="text" id="currentLoanRate" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  placeholder="0.00"
                  onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
              </div>
              
              <!-- Funded Date -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">Funded Date</label>
                <input type="date" id="fundedDate" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'; this.showPicker && this.showPicker();"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
              </div>
              
              <!-- New Rate -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">New Rate (%)</label>
                <input type="text" id="newRate" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  placeholder="0.00"
                  onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
              </div>
              
              <!-- New Term -->
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #374151; 
                  font-weight: 600;
                  font-size: 14px;
                ">New Term (months)</label>
                <input type="text" id="newTerm" 
                  style="
                    width: 100%; 
                    padding: 14px 16px; 
                    border: 2px solid #e5e7eb; 
                    border-radius: 12px; 
                    font-size: 16px;
                    font-weight: 600;
                    background: #ffffff;
                    color: #1f2937;
                    transition: all 0.3s ease;
                    box-sizing: border-box;
                  " 
                  placeholder="0"
                  onkeypress="return event.charCode >= 48 && event.charCode <= 57"
                  onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                  onblur="this.style.borderColor='#e5e7eb'; this.style.background='#ffffff'; this.style.boxShadow='none'"
                >
                <div id="newTermWarning" style="
                  display: none;
                  margin-top: 8px;
                  padding: 8px 12px;
                  background: #fef2f2;
                  border: 1px solid #fecaca;
                  border-radius: 6px;
                  color: #dc2626;
                  font-size: 13px;
                  font-weight: 500;
                  line-height: 1.4;
                ">⚠️ Please double-check this value. This field expects months, not years (e.g. 360 for a 30-year loan).</div>
              </div>
            </div>
          </div>
          
          <!-- CLOSING COSTS CARD SECTION -->
          <div style="
            margin-bottom: 30px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          ">
            <div style="
              display: flex; 
              align-items: center; 
              justify-content: space-between;
              padding: 24px;
              cursor: pointer;
              transition: all 0.3s ease;
              background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
              border-bottom: 1px solid rgba(226, 232, 240, 0.8);
            " id="closingCostHeader">
              <div>
                <label style="
                  display: block; 
                  margin-bottom: 8px; 
                  color: #64748b; 
                  font-weight: 600;
                  font-size: 12px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                ">Total Closing Costs</label>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 18px; color: #64748b; font-weight: 500;">$</span>
                  <div id="closingCostTotal" style="
                    font-size: 32px; 
                    font-weight: 800; 
                    color: #1a202c;
                    line-height: 1;
                  ">5,000.00</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 14px; color: #64748b; font-weight: 500;">Details</span>
                <div style="
                  width: 36px;
                  height: 36px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #667eea, #764ba2);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: transform 0.3s ease;
                  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                " id="closingCostToggleIcon">
                  <span style="
                    color: white;
                    font-size: 14px;
                    font-weight: 700;
                    transform: rotate(0deg);
                    transition: transform 0.3s ease;
                  ">▼</span>
                </div>
              </div>
            </div>
            
            <div id="closingCostBreakdown" style="display: none; padding: 32px 24px 24px 24px; background: #ffffff;">
              <div style="display: grid; gap: 24px;">
                <div>
                  <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    color: #374151; 
                    font-weight: 600;
                    font-size: 15px;
                  ">Processing & Underwriting</label>
                  <div style="position: relative;">
                    <span style="
                      position: absolute;
                      left: 16px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: #9ca3af;
                      font-weight: 600;
                      z-index: 1;
                    ">$</span>
                    <input type="text" id="processingInput" 
                      style="
                        width: 100%; 
                        padding: 16px 16px 16px 32px; 
                        border: 2px solid #e5e7eb; 
                        border-radius: 12px; 
                        font-size: 16px;
                        font-weight: 600;
                        background: #fafafa;
                        color: #1f2937;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                      " 
                      value="1500" 
                      placeholder="0.00"
                      onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                      onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                      onblur="this.style.borderColor='#e5e7eb'; this.style.background='#fafafa'; this.style.boxShadow='none'"
                    >
                  </div>
                </div>
                
                <div>
                  <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    color: #374151; 
                    font-weight: 600;
                    font-size: 15px;
                  ">Appraisal</label>
                  <div style="position: relative;">
                    <span style="
                      position: absolute;
                      left: 16px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: #9ca3af;
                      font-weight: 600;
                      z-index: 1;
                    ">$</span>
                    <input type="text" id="appraisalInput" 
                      style="
                        width: 100%; 
                        padding: 16px 16px 16px 32px; 
                        border: 2px solid #e5e7eb; 
                        border-radius: 12px; 
                        font-size: 16px;
                        font-weight: 600;
                        background: #fafafa;
                        color: #1f2937;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                      " 
                      value="500" 
                      placeholder="0.00"
                      onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                      onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                      onblur="this.style.borderColor='#e5e7eb'; this.style.background='#fafafa'; this.style.boxShadow='none'"
                    >
                  </div>
                </div>
                
                <div>
                  <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    color: #374151; 
                    font-weight: 600;
                    font-size: 15px;
                  ">Title & Escrow</label>
                  <div style="position: relative;">
                    <span style="
                      position: absolute;
                      left: 16px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: #9ca3af;
                      font-weight: 600;
                      z-index: 1;
                    ">$</span>
                    <input type="text" id="titleEscrowInput" 
                      style="
                        width: 100%; 
                        padding: 16px 16px 16px 32px; 
                        border: 2px solid #e5e7eb; 
                        border-radius: 12px; 
                        font-size: 16px;
                        font-weight: 600;
                        background: #fafafa;
                        color: #1f2937;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                      " 
                      value="2000" 
                      placeholder="0.00"
                      onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                      onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                      onblur="this.style.borderColor='#e5e7eb'; this.style.background='#fafafa'; this.style.boxShadow='none'"
                    >
                  </div>
                </div>
                
                <div>
                  <label style="
                    display: block; 
                    margin-bottom: 12px; 
                    color: #374151; 
                    font-weight: 600;
                    font-size: 15px;
                  ">Other Costs</label>
                  <div style="position: relative;">
                    <span style="
                      position: absolute;
                      left: 16px;
                      top: 50%;
                      transform: translateY(-50%);
                      color: #9ca3af;
                      font-weight: 600;
                      z-index: 1;
                    ">$</span>
                    <input type="text" id="otherInput" 
                      style="
                        width: 100%; 
                        padding: 16px 16px 16px 32px; 
                        border: 2px solid #e5e7eb; 
                        border-radius: 12px; 
                        font-size: 16px;
                        font-weight: 600;
                        background: #fafafa;
                        color: #1f2937;
                        transition: all 0.3s ease;
                        box-sizing: border-box;
                      " 
                      value="1000" 
                      placeholder="0.00"
                      onkeypress="return event.charCode >= 48 && event.charCode <= 57 || event.charCode === 46"
                      onfocus="this.style.borderColor='#667eea'; this.style.background='#ffffff'; this.style.boxShadow='0 0 0 3px rgba(102, 126, 234, 0.1)'"
                      onblur="this.style.borderColor='#e5e7eb'; this.style.background='#fafafa'; this.style.boxShadow='none'"
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- LENDER CREDIT SECTION -->
          <div style="
            margin-bottom: 40px;
            padding: 28px;
            border-radius: 16px;
            border: 2px solid #e2e8f0;
            background: linear-gradient(145deg, #ffffff, #f8fafc);
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          ">
            <label style="
              display: block; 
              margin-bottom: 20px; 
              color: #374151; 
              font-weight: 700;
              font-size: 16px;
              letter-spacing: -0.25px;
            ">Lender Credit or Cost</label>
            
            <div style="
              display: flex; 
              align-items: stretch; 
              gap: 0;
              border-radius: 12px;
              border: 2px solid #e5e7eb;
              background: #ffffff;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
              <!-- Toggle Buttons -->
              <div style="display: flex; flex-shrink: 0; background: #f8fafc;">
                <button type="button" id="lenderToggleDollar" class="lender-toggle active" style="
                  padding: 16px 20px; 
                  background: linear-gradient(135deg, #667eea, #764ba2); 
                  color: white; 
                  border: none; 
                  cursor: pointer;
                  font-weight: 700;
                  font-size: 16px;
                  transition: all 0.3s ease;
                  position: relative;
                  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                ">$</button>
                <button type="button" id="lenderTogglePercent" class="lender-toggle" style="
                  padding: 16px 20px; 
                  background: transparent; 
                  color: #6b7280; 
                  border: none; 
                  cursor: pointer;
                  font-weight: 700;
                  font-size: 16px;
                  transition: all 0.3s ease;
                ">%</button>
              </div>
              
              <!-- Input Field -->
              <div style="flex: 1; position: relative; display: flex; align-items: center;">
                <input type="text" id="lenderCreditInput" style="
                  width: 100%; 
                  padding: 16px 50px 16px 20px; 
                  border: none; 
                  font-size: 18px;
                  font-weight: 600;
                  background: transparent;
                  color: #1f2937;
                  outline: none;
                  box-sizing: border-box;
                " 
                value="0" 
                placeholder="0.00">
                
                <!-- Suffix Indicator -->
                <span id="lenderSuffix" style="
                  position: absolute;
                  right: 20px;
                  color: #6b7280;
                  font-weight: 700;
                  font-size: 16px;
                ">$</span>
              </div>
            </div>
            
            <!-- Dynamic subtext for percentage mode -->
            <div id="lenderCreditSubtext" style="
              display: none;
              margin-top: 8px;
              font-size: 14px;
              font-weight: 500;
              color: #6b7280;
              padding-left: 4px;
            "></div>
          </div>
          
          <!-- ACTION BUTTONS -->
          <div style="display: flex; gap: 16px;">
            <button id="cancelOnDemand" style="
              flex: 1; 
              padding: 18px; 
              background: #f8fafc; 
              color: #64748b; 
              border: 2px solid #e2e8f0; 
              border-radius: 12px; 
              font-weight: 700; 
              font-size: 16px;
              cursor: pointer;
              transition: all 0.3s ease;
              letter-spacing: -0.25px;
            "
            onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'; this.style.color='#475569'"
            onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.color='#64748b'">
              Cancel
            </button>
            <button id="generateOnDemandBtn" style="
              flex: 2; 
              padding: 18px; 
              background: linear-gradient(135deg, #667eea, #764ba2); 
              color: white; 
              border: none; 
              border-radius: 12px; 
              font-weight: 700; 
              font-size: 16px;
              cursor: pointer;
              box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
              transition: all 0.3s ease;
              position: relative;
              overflow: hidden;
              letter-spacing: -0.25px;
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(102, 126, 234, 0.5)'"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(102, 126, 234, 0.4)'">
              Generate Report
            </button>
          </div>
        </div>
      `;

      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Prefill values after DOM is created
      if (contactData) {
        setTimeout(() => {
          const loanAmountEl = document.getElementById("currentLoanAmount");
          const termEl = document.getElementById("currentTerm");
          const rateEl = document.getElementById("currentLoanRate");
          const fundedDateEl = document.getElementById("fundedDate");

          if (contactData.loanAmount && loanAmountEl) {
            loanAmountEl.value = contactData.loanAmount;
            loanAmountEl.dispatchEvent(new Event("input", { bubbles: true }));
          }
          if (contactData.loanTerm && termEl) {
            termEl.value = contactData.loanTerm;
          }
          if (contactData.interestRate && rateEl) {
            rateEl.value = contactData.interestRate;
          }
          if (contactData.fundedDate && fundedDateEl) {
            fundedDateEl.value = contactData.fundedDate;
          }
        }, 100);
      }

      // Add event listeners for closing costs toggle
      const closingCostHeader = document.getElementById("closingCostHeader");
      const closingCostBreakdown = document.getElementById(
        "closingCostBreakdown"
      );
      const closingCostToggleIcon = document.getElementById(
        "closingCostToggleIcon"
      );
      const closingCostTotal = document.getElementById("closingCostTotal");

      // Function to calculate and update total
      const updateClosingCostTotal = () => {
        const processing =
          parseFloat(document.getElementById("processingInput").value) || 0;
        const appraisal =
          parseFloat(document.getElementById("appraisalInput").value) || 0;
        const titleEscrow =
          parseFloat(document.getElementById("titleEscrowInput").value) || 0;
        const other =
          parseFloat(document.getElementById("otherInput").value) || 0;
        const total = processing + appraisal + titleEscrow + other;
        closingCostTotal.textContent = total.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      };

      // Add input listeners for real-time calculation
      [
        "processingInput",
        "appraisalInput",
        "titleEscrowInput",
        "otherInput",
      ].forEach((id) => {
        document
          .getElementById(id)
          .addEventListener("input", updateClosingCostTotal);
      });

      // Toggle closing costs breakdown
      closingCostHeader.addEventListener("click", () => {
        const isVisible = closingCostBreakdown.style.display !== "none";
        closingCostBreakdown.style.display = isVisible ? "none" : "block";
        const arrow = closingCostToggleIcon.querySelector("span");
        arrow.style.transform = isVisible ? "rotate(0deg)" : "rotate(180deg)";
      });

      // Lender credit toggle functionality
      const dollarToggle = document.getElementById("lenderToggleDollar");
      const percentToggle = document.getElementById("lenderTogglePercent");
      const lenderInput = document.getElementById("lenderCreditInput");
      const lenderSuffix = document.getElementById("lenderSuffix");
      const lenderSubtext = document.getElementById("lenderCreditSubtext");

      dollarToggle.addEventListener("click", () => {
        dollarToggle.style.background =
          "linear-gradient(135deg, #667eea, #764ba2)";
        dollarToggle.style.color = "white";
        percentToggle.style.background = "transparent";
        percentToggle.style.color = "#6b7280";
        lenderSuffix.textContent = "$";
        lenderSubtext.style.display = "none";
      });

      // Function to update the subtext based on percentage and loan amount
      const updateLenderCreditSubtext = () => {
        if (lenderSuffix.textContent !== "%") {
          lenderSubtext.style.display = "none";
          return;
        }

        const percentValue = parseFloat(lenderInput.value) || 0;
        const loanAmountValue =
          parseFloat(
            document.getElementById("currentLoanAmount").value.replace(/,/g, "")
          ) || 0;

        if (percentValue === 0 || loanAmountValue === 0) {
          lenderSubtext.style.display = "none";
          return;
        }

        const dollarValue = loanAmountValue * (percentValue / 100);
        const formattedDollarValue = Math.abs(dollarValue).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );

        lenderSubtext.style.display = "block";
        if (percentValue < 0) {
          lenderSubtext.textContent = `Credit: ≈ $${formattedDollarValue}`;
          lenderSubtext.style.color = "#10b981";
        } else {
          lenderSubtext.textContent = `Cost: ≈ $${formattedDollarValue}`;
          lenderSubtext.style.color = "#ef4444";
        }
      };

      dollarToggle.addEventListener("click", () => {
        dollarToggle.style.background =
          "linear-gradient(135deg, #667eea, #764ba2)";
        dollarToggle.style.color = "white";
        percentToggle.style.background = "transparent";
        percentToggle.style.color = "#6b7280";
        lenderSuffix.textContent = "$";
        lenderSubtext.style.display = "none";
      });

      percentToggle.addEventListener("click", () => {
        percentToggle.style.background =
          "linear-gradient(135deg, #667eea, #764ba2)";
        percentToggle.style.color = "white";
        dollarToggle.style.background = "transparent";
        dollarToggle.style.color = "#6b7280";
        lenderSuffix.textContent = "%";
        updateLenderCreditSubtext();
      });

      // Add input listeners for live updates
      lenderInput.addEventListener("input", updateLenderCreditSubtext);
      document
        .getElementById("currentLoanAmount")
        .addEventListener("input", updateLenderCreditSubtext);

      // Close popup functionality
      const closePopup = () => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };

      document
        .getElementById("cancelOnDemand")
        .addEventListener("click", closePopup);
      document
        .getElementById("generateOnDemandBtn")
        .addEventListener("click", async () => {
          // Validate required fields
          const newRate = document.getElementById("newRate").value.trim();
          const newTerm = document.getElementById("newTerm").value.trim();
          const fundedDate = document.getElementById("fundedDate").value.trim();
          const currentLoanAmount = document
            .getElementById("currentLoanAmount")
            .value.trim();
          const currentTerm = document
            .getElementById("currentTerm")
            .value.trim();
          const currentLoanRate = document
            .getElementById("currentLoanRate")
            .value.trim();
          if (!currentLoanAmount) {
            alert("Please enter the Current Loan Amount");
            document.getElementById("currentLoanAmount").focus();
            return;
          }

          if (!currentTerm) {
            alert("Please enter the Current Term");
            document.getElementById("currentTerm").focus();
            return;
          }

          if (!currentLoanRate) {
            alert("Please enter the Current Loan Rate");
            document.getElementById("currentLoanRate").focus();
            return;
          }

          if (!newRate) {
            alert("Please enter a New Rate");
            document.getElementById("newRate").focus();
            return;
          }

          if (!newTerm) {
            alert("Please enter a New Term");
            document.getElementById("newTerm").focus();
            return;
          }

          if (!fundedDate) {
            alert("Please enter a Funded Date");
            document.getElementById("fundedDate").focus();
            return;
          }

          // Show loading state
          const generateBtn = document.getElementById("generateOnDemandBtn");
          generateBtn.textContent = "Generating...";
          generateBtn.disabled = true;

          // Collect closing cost breakdown
          const closingCostData = {
            total:
              parseFloat(
                document
                  .getElementById("closingCostTotal")
                  .textContent.replace(/,/g, "")
              ) || 0,
            breakdown: {
              processing:
                parseFloat(
                  document
                    .getElementById("processingInput")
                    .value.replace(/,/g, "")
                ) || 0,
              appraisal:
                parseFloat(
                  document
                    .getElementById("appraisalInput")
                    .value.replace(/,/g, "")
                ) || 0,
              titleEscrow:
                parseFloat(
                  document
                    .getElementById("titleEscrowInput")
                    .value.replace(/,/g, "")
                ) || 0,
              other:
                parseFloat(
                  document.getElementById("otherInput").value.replace(/,/g, "")
                ) || 0,
            },
          };

          // Collect lender credit
          const lenderSuffix =
            document.getElementById("lenderSuffix").textContent;
          const isPercentage = lenderSuffix === "%";
          const lenderData = {
            value:
              parseFloat(
                document
                  .getElementById("lenderCreditInput")
                  .value.replace(/,/g, "")
              ) || 0,
            isPercentage: isPercentage,
          };

          // Get contact ID from current page
          const contactId =
            getContactIdFromUrl() || getContactIdFromConversationGlobal();
          if (!contactId) {
            alert("No contact found. Please select a contact first.");
            generateBtn.textContent = "Generate Report";
            generateBtn.disabled = false;
            return;
          }

          // Get contact details
          let contactDetails;
          try {
            contactDetails = await fetchContactDetails(contactId);
            if (!contactDetails) {
              throw new Error("Failed to fetch contact details");
            }
          } catch (error) {
            console.error("Error fetching contact details:", error);
            alert("Error fetching contact details");
            generateBtn.textContent = "Generate Report";
            generateBtn.disabled = false;
            return;
          }

          const contact = contactDetails.contact;
          const selectedContact = contact;

          const locationIdRef = getLocationIdFromUrl();

          // Prepare request data (same format as ref.html)
          const requestData = {
            location_id: locationIdRef,
            selectedContact: selectedContact,
            closing_cost: {
              total: closingCostData.total,
              breakdown: {
                processing: closingCostData.breakdown.processing,
                appraisal: closingCostData.breakdown.appraisal,
                titleEscrow: closingCostData.breakdown.titleEscrow,
                other: closingCostData.breakdown.other,
              },
            },
            lenderCredit: lenderData.value,
            loan_details: {
              current_loan_amount:
                document.getElementById("currentLoanAmount").value,
              current_term: document.getElementById("currentTerm").value,
              current_loan_rate:
                document.getElementById("currentLoanRate").value,
              fundedDate: document.getElementById("fundedDate").value,
              new_rate: document.getElementById("newRate").value,
              new_term: document.getElementById("newTerm").value,
            },
          };

          console.log("Complete Request Data:", requestData);

          // Make API call (same as ref.html)
          try {
            const response = await fetch(
              `https://api.konnectd.io/user-refinance-process`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
              }
            );

            if (!response.ok) {
              throw new Error(
                `Server responded with status ${response.status}`
              );
            }

            const result = await response.json();
            console.log("API Response:", result);

            // Show success popup (same as ref.html)
            const popup = document.querySelector("#on-demand-refi-popup div");
            popup.innerHTML = `
              <div style="padding: 40px; text-align: center;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; background: linear-gradient(135deg, #4CAF50, #2E7D32); border-radius: 50%; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(76, 175, 80, 0.3);">
                  <span style="font-size: 32px; color: white;">✅</span>
                </div>
                <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 24px; font-weight: 700;">Success!</h2>
                <p style="margin: 0 0 30px 0; color: #7f8c8d; font-size: 16px;">Report generated successfully.</p>
                <button id="closeSuccessPopup" style="
                  padding: 14px 28px; 
                  background: #4CAF50; 
                  color: white; 
                  border: none; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  font-weight: 600; 
                  cursor: pointer;
                  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                ">
                  Click here to see the Report
                </button>
              </div>
            `;

            // Add event listener to open report
            document
              .getElementById("closeSuccessPopup")
              .addEventListener("click", () => {
                const reportUrl = result.upload.url;
                window.open(reportUrl, "_blank");
                closePopup();
              });
          } catch (error) {
            console.error("API Error:", error);
            // Show error popup (same as ref.html)
            const popup = document.querySelector("#on-demand-refi-popup div");
            popup.innerHTML = `
              <div style="padding: 40px; text-align: center;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; background: linear-gradient(135deg, #f44336, #c62828); border-radius: 50%; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(244, 67, 54, 0.3);">
                  <span style="font-size: 32px; color: white;">❌</span>
                </div>
                <h2 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 24px; font-weight: 700;">Error</h2>
                <p style="margin: 0 0 20px 0; color: #7f8c8d; font-size: 16px;">There was an error generating your report:</p>
                <p style="margin: 0 0 30px 0; color: #f44336; font-weight: 500; background: #ffebee; padding: 10px; border-radius: 8px;">${error.message}</p>
                <button id="closeErrorPopup" style="
                  padding: 14px 28px; 
                  background: #f44336; 
                  color: white; 
                  border: none; 
                  border-radius: 12px; 
                  font-size: 16px; 
                  font-weight: 600; 
                  cursor: pointer;
                  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                ">
                  Try Again
                </button>
              </div>
            `;

            // Add event listener to try again
            document
              .getElementById("closeErrorPopup")
              .addEventListener("click", () => {
                closePopup();
                // Reopen the popup to try again
                setTimeout(() => {
                  const contactDetails = fetchContactDetails(contactId);
                  const customFields = fetchCustomFields(locationId1);
                  Promise.all([contactDetails, customFields])
                    .then(([details, fields]) => {
                      const contactData = extractContactData(details, fields);
                      showOnDemandRefiPopup(contactData);
                    })
                    .catch(() => {
                      showOnDemandRefiPopup();
                    });
                }, 100);
              });
          }
        });

      // Close on overlay click
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closePopup();
        }
      });

      // Close on Escape key
      const handleEscape = (e) => {
        if (e.key === "Escape") {
          closePopup();
          document.removeEventListener("keydown", handleEscape);
        }
      };
      document.addEventListener("keydown", handleEscape);

      // New Term validation
      const newTermInput = document.getElementById("newTerm");
      const newTermWarning = document.getElementById("newTermWarning");

      newTermInput.addEventListener("input", () => {
        const value = parseInt(newTermInput.value);
        if (!isNaN(value) && value > 0 && value < 120) {
          newTermWarning.style.display = "block";
          newTermInput.style.borderColor = "#fca5a5";
        } else {
          newTermWarning.style.display = "none";
          newTermInput.style.borderColor = "#e5e7eb";
        }
      });
    }

    //
    // ========== OLD: Refi Analysis modal + helper (keeping for reference) ==========
    //
    async function showRefiAnalysis(contactIds, singleContactDetails = null) {
      try {
        const contactId = (contactIds && contactIds[0]) || null;
        if (!contactId) {
          alert("No contact selected for Refi Analysis.");
          return;
        }

        // ensure we have contact details
        let contactDetails = singleContactDetails;
        if (!contactDetails) {
          contactDetails = await fetchContactDetails(contactId);
          if (!contactDetails) {
            alert("Failed to fetch contact details for Refi Analysis.");
            return;
          }
        }

        const customFieldsFromBackend = await fetchCustomFields(locationId1);
        if (!customFieldsFromBackend || !customFieldsFromBackend.customFields) {
          alert("Failed to fetch custom fields.");
          return;
        }

        // try to find some common fields (fall back gracefully)
        const interestRateFieldDef = customFieldsFromBackend.customFields.find(
          (f) => f.fieldKey === "contact.interest_rate"
        );
        const mortgageFieldDef = customFieldsFromBackend.customFields.find(
          (f) => f.fieldKey === "contact.mortgage_type"
        );

        // read values from contact details
        const contact = contactDetails.contact || contactDetails;
        const firstName = contact.firstName || "";
        const lastName = contact.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();

        const rateField =
          contact.customFields?.find(
            (f) => f.id === interestRateFieldDef?.id
          ) ||
          contact.customFields?.find(
            (f) => f.fieldKey === "contact.interest_rate"
          );
        const existingRate = rateField?.value
          ? parseFloat(rateField.value).toFixed(3)
          : "";

        const mortgageField =
          contact.customFields?.find((f) => f.id === mortgageFieldDef?.id) ||
          contact.customFields?.find(
            (f) => f.fieldKey === "contact.mortgage_type"
          );
        const existingMortgage = mortgageField?.value || "";

        // Build a simple modal (keeps styling consistent with other modal)
        const overlay = document.createElement("div");
        overlay.style.cssText = `
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          display:flex; align-items:center; justify-content:center; z-index:99999;
        `;

        const modal = document.createElement("div");
        modal.style.cssText = `
          width:520px; max-width:94vw; border-radius:12px; background: #fff;
          box-shadow:0 20px 40px rgba(2,6,23,0.4); overflow:hidden; font-family:Inter, system-ui, sans-serif;
        `;

        modal.innerHTML = `
          <div style="background:linear-gradient(135deg,#667eea,#764ba2); padding:18px 20px; color:white;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h3 style="margin:0;font-size:18px;">Refi Analysis</h3>
                <div style="opacity:0.9;font-size:13px;margin-top:4px;">Run a quick refinance analysis for ${
                  fullName || "contact"
                }</div>
              </div>
              <div id="refiCloseBtn" style="cursor:pointer;opacity:0.9;">✕</div>
            </div>
          </div>
          <div style="padding:20px;">
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#374151">Borrower</label>
            <div style="margin-bottom:12px;font-size:14px;color:#0f172a">${
              fullName || "--"
            }</div>
  
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#374151">Current Interest Rate (%)</label>
            <input id="refiCurrentRate" type="number" step="0.001" value="${existingRate}" style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;" />
  
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#374151">Mortgage Type</label>
            <input id="refiMortgageType" type="text" value="${existingMortgage}" placeholder="e.g. Conforming" style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;" />
  
            <label style="display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:#374151">Loan Balance (optional)</label>
            <input id="refiLoanBalance" type="number" step="100" placeholder="e.g. 250000" style="width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:18px;" />
  
            <div style="display:flex;gap:10px;">
              <button id="refiCancel" style="flex:1;padding:10px;border-radius:8px;background:#6b7280;color:white;border:none;cursor:pointer;">Cancel</button>
              <button id="refiRun" style="flex:1;padding:10px;border-radius:8px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;cursor:pointer;">Run Refi Analysis</button>
            </div>
          </div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const cleanup = () => {
          if (document.body.contains(overlay))
            document.body.removeChild(overlay);
        };

        document
          .getElementById("refiCloseBtn")
          .addEventListener("click", cleanup);
        document
          .getElementById("refiCancel")
          .addEventListener("click", cleanup);

        document
          .getElementById("refiRun")
          .addEventListener("click", async () => {
            const currentRate =
              document.getElementById("refiCurrentRate").value;
            const mortgageType =
              document.getElementById("refiMortgageType").value || "Conforming";
            const loanBalance =
              document.getElementById("refiLoanBalance").value || "";

            if (!currentRate) {
              alert(
                "Please provide the borrower's current interest rate (or prefill from contact)."
              );
              return;
            }

            // call the same Flask back-end pattern - endpoint for refi analysis
            const flaskUrl = `https://api.konnectd.io/refi-analysis?location_id=${locationId1}&contactIds=${encodeURIComponent(
              contactIds.join(",")
            )}&currentRate=${encodeURIComponent(
              currentRate
            )}&mortgageType=${encodeURIComponent(
              mortgageType
            )}&loanBalance=${encodeURIComponent(loanBalance)}`;

            try {
              const res = await fetch(flaskUrl);
              const data = await res.json();
              console.log("Refi analysis response:", data);
              showSuccessPopup(
                "Refi analysis requested. Check results in your dashboard or notification area."
              );
            } catch (err) {
              console.error("Refi analysis error:", err);
              alert("Failed to run refi analysis.");
            } finally {
              cleanup();
            }
          });
      } catch (err) {
        console.error("showRefiAnalysis error:", err);
        alert("Error opening Refi Analysis.");
      }
    }

    // ==========================================
    // CONTACT DETAIL PAGE LOGIC
    // ==========================================

    if (isContactDetailPage) {
      console.log("DEBUG: Initializing Contact Detail Page injection");

      let observers = [];
      let cleanupIntervals = [];
      let urlCheckIntervalId = null;

      function cleanupTargetRateSystem() {
        console.log("DEBUG: 🧹 Cleaning up target rate system");
        const buttonContainer = document.getElementById(
          "dashboard-target-rate-container"
        );
        if (buttonContainer) {
          buttonContainer.remove();
          console.log("DEBUG: ✅ Removed target rate button");
        }
        observers.forEach((observer) => observer.disconnect());
        observers = [];
        cleanupIntervals.forEach((intervalId) => {
          if (intervalId !== urlCheckIntervalId) clearInterval(intervalId);
        });
        cleanupIntervals = cleanupIntervals.filter(
          (id) => id && id !== urlCheckIntervalId
        );
      }

      function shouldInitialize() {
        const contactId = getContactIdFromUrl();
        return !!contactId;
      }

      function injectTargetRateButton() {
        const targetDiv = document.querySelector(
          ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
        );

        if (!targetDiv) {
          console.log("DEBUG: Tabs div not found yet");
          return false;
        }

        if (!getContactIdFromUrl()) {
          console.log(
            "DEBUG: ❌ No longer on contact page - aborting injection"
          );
          cleanupTargetRateSystem();
          return false;
        }

        // Remove any existing buttons to prevent duplicates
        const existingContainer = document.getElementById(
          "dashboard-target-rate-container"
        );
        if (existingContainer) {
          existingContainer.remove();
          console.log(
            "DEBUG: Removed existing button container to prevent duplicate"
          );
        }

        console.log(
          "DEBUG: Creating target rate + refi buttons for contact detail page"
        );

        const buttonContainer = document.createElement("div");
        buttonContainer.id = "dashboard-target-rate-container";
        buttonContainer.style.cssText = `
                      margin: 7px 0px 15px 0px;
                      padding: 0;
                      width: 100%;
                      display: flex;
                      gap: 8px;
                      align-items: center;
                    `;

        // Left button: Set Target Rate
        const leftBtn = document.createElement("button");
        leftBtn.id = "dashboard-target-rate-button";
        leftBtn.innerHTML =
          '<i class="fa-solid fa-bullseye" style="margin-right: 6px;"></i> Set Target Rate';
        leftBtn.style.cssText = `
                      flex:1;
                      margin: 0;
                      padding: 8px 12px !important;
                      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                      color: white;
                      border: none;
                      border-radius: 6px;
                      font-size: 13px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(0,123,255,0.3);
                      white-space: nowrap;
                    `;

        leftBtn.addEventListener("mouseenter", () => {
          leftBtn.style.transform = "translateY(-2px)";
          leftBtn.style.boxShadow = "0 4px 10px rgba(0, 123, 255, 0.5)";
        });
        leftBtn.addEventListener("mouseleave", () => {
          leftBtn.style.transform = "translateY(0)";
          leftBtn.style.boxShadow = "0 2px 6px rgba(0, 123, 255, 0.3)";
        });

        leftBtn.addEventListener("click", async function () {
          const currentContactId = getContactIdFromUrl();
          if (!currentContactId) {
            alert("No contact ID found - please refresh the page.");
            return;
          }

          try {
            const contactDetails = await fetchContactDetails(currentContactId);
            if (!contactDetails) {
              alert("Failed to fetch contact details.");
              return;
            }
            const contactIds = [currentContactId];
            await showPopup3(contactIds, contactDetails);
          } catch (error) {
            console.error("Error in target button click handler:", error);
            alert("Error loading contact details.");
          }
        });

        // Right button: Refi Analysis
        const rightBtn = document.createElement("button");
        rightBtn.id = "dashboard-refi-analysis-button";
        rightBtn.innerHTML =
          '<i class="fa-solid fa-chart-line" style="margin-right: 6px;"></i> Refi Analysis';
        rightBtn.style.cssText = `
                      flex:1;
                      margin: 0;
                      padding: 8px 12px !important;
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      border: none;
                      border-radius: 6px;
                      font-size: 13px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(16,185,129,0.3);
                      white-space: nowrap;
                    `;

        rightBtn.addEventListener("mouseenter", () => {
          rightBtn.style.transform = "translateY(-2px)";
          rightBtn.style.boxShadow = "0 4px 10px rgba(16,185,129,0.45)";
        });
        rightBtn.addEventListener("mouseleave", () => {
          rightBtn.style.transform = "translateY(0)";
          rightBtn.style.boxShadow = "0 2px 6px rgba(16,185,129,0.3)";
        });

        // rightBtn.addEventListener("click", async function () {
        //   const currentContactId = getContactIdFromUrl();
        //   if (!currentContactId) {
        //     alert("No contact ID found - please refresh the page.");
        //     return;
        //   }
        //   try {
        //     const contactDetails = await fetchContactDetails(currentContactId);
        //     const customFields = await fetchCustomFields(locationId1);
        //     const contactData = extractContactData(
        //       contactDetails,
        //       customFields
        //     );
        //     showOnDemandRefiPopup(contactData);
        //   } catch (error) {
        //     console.error("Error fetching contact data:", error);
        //     showOnDemandRefiPopup();
        //   }
        // });
        rightBtn.addEventListener("click", async function () {
          const currentContactId = getContactIdFromUrl();
          if (!currentContactId) {
            alert("No contact ID found - please refresh the page.");
            return;
          }

          // Show loading state
          const originalText = rightBtn.innerHTML;
          rightBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i> Loading...';
          rightBtn.disabled = true;
          rightBtn.style.opacity = "0.7";
          rightBtn.style.cursor = "wait";

          try {
            console.log(
              "DEBUG: Fetching contact details for:",
              currentContactId
            );
            const contactDetails = await fetchContactDetails(currentContactId);
            console.log("DEBUG: Contact details fetched:", contactDetails);

            const customFields = await fetchCustomFields(locationId1);
            console.log("DEBUG: Custom fields fetched:", customFields);

            const contactData = extractContactData(
              contactDetails,
              customFields
            );
            console.log("DEBUG: Contact data extracted:", contactData);

            showOnDemandRefiPopup(contactData);
          } catch (error) {
            console.error("Error fetching contact data:", error);
            alert("Error loading contact data. Please try again.");
            showOnDemandRefiPopup();
          } finally {
            // Restore button state
            rightBtn.innerHTML = originalText;
            rightBtn.disabled = false;
            rightBtn.style.opacity = "1";
            rightBtn.style.cursor = "pointer";
          }
        });
        buttonContainer.appendChild(leftBtn);
        buttonContainer.appendChild(rightBtn);
        targetDiv.parentNode.insertBefore(buttonContainer, targetDiv);

        console.log(
          "DEBUG: ✅ Target rate + Refi buttons injected successfully"
        );
        return true;
      }

      //   function setupUrlChangeDetection() {
      //     let lastUrl = window.location.href;

      //     const checkUrlChange = () => {
      //       const currentUrl = window.location.href;
      //       if (currentUrl !== lastUrl) {
      //         console.log(
      //           "DEBUG: 🔄 URL changed from",
      //           lastUrl,
      //           "to",
      //           currentUrl
      //         );
      //         lastUrl = currentUrl;
      //         cleanupTargetRateSystem();
      //         setTimeout(() => {
      //           if (shouldInitialize()) {
      //             console.log(
      //               "DEBUG: ✅ New page is contact detail - initializing"
      //             );
      //             initializeContactDetailSystem();
      //           } else {
      //             console.log(
      //               "DEBUG: ❌ New page is not contact detail - skipping"
      //             );
      //           }
      //         }, 100);
      //       }
      //     };

      //     urlCheckIntervalId = setInterval(checkUrlChange, 500);

      //     const handlePopState = () => {
      //       console.log("DEBUG: 🔙 Popstate detected");
      //       setTimeout(checkUrlChange, 100);
      //     };
      //     window.addEventListener("popstate", handlePopState);

      //     window.addEventListener("beforeunload", () => {
      //       window.removeEventListener("popstate", handlePopState);
      //       if (urlCheckIntervalId) {
      //         clearInterval(urlCheckIntervalId);
      //         urlCheckIntervalId = null;
      //       }
      //     });
      //   }

      function setupUrlChangeDetection() {
        let lastUrl = window.location.href;

        const checkUrlChange = () => {
          const currentUrl = window.location.href;
          if (currentUrl !== lastUrl) {
            console.log(
              "DEBUG: 🔄 URL changed from",
              lastUrl,
              "to",
              currentUrl
            );

            // Only handle URL changes if we're still on a contact detail page
            const wasContactDetail = lastUrl.includes("/detail/");
            const isContactDetail = currentUrl.includes("/detail/");

            lastUrl = currentUrl;

            // Only cleanup and reinitialize if we're navigating between contact detail pages
            if (wasContactDetail && isContactDetail) {
              console.log("DEBUG: 🔄 Navigating between contact pages");
              cleanupTargetRateSystem();
              setTimeout(() => {
                if (shouldInitialize()) {
                  console.log("DEBUG: ✅ New contact page - reinitializing");
                  initializeContactDetailSystem();
                }
              }, 100);
            } else if (wasContactDetail && !isContactDetail) {
              // Leaving contact detail page - cleanup only
              console.log(
                "DEBUG: 🚪 Leaving contact detail page - cleaning up"
              );
              cleanupTargetRateSystem();
              // Stop the URL monitoring since we're leaving
              if (urlCheckIntervalId) {
                clearInterval(urlCheckIntervalId);
                urlCheckIntervalId = null;
              }
            }
          }
        };

        urlCheckIntervalId = setInterval(checkUrlChange, 500);

        const handlePopState = () => {
          console.log("DEBUG: 🔙 Popstate detected");
          setTimeout(checkUrlChange, 100);
        };
        window.addEventListener("popstate", handlePopState);

        window.addEventListener("beforeunload", () => {
          window.removeEventListener("popstate", handlePopState);
          if (urlCheckIntervalId) {
            clearInterval(urlCheckIntervalId);
            urlCheckIntervalId = null;
          }
        });
      }

      function initializeContactDetailSystem() {
        if (!injectTargetRateButton()) {
          console.log(
            "DEBUG: Initial injection failed, setting up observer..."
          );

          const tabObserver = new MutationObserver(function (mutations) {
            for (const mutation of mutations) {
              if (mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                  if (
                    node.nodeType === 1 &&
                    (node.matches(
                      ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
                    ) ||
                      node.querySelector(
                        ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
                      ))
                  ) {
                    console.log("DEBUG: Tabs detected via observer");
                    setTimeout(() => {
                      if (getContactIdFromUrl()) {
                        injectTargetRateButton();
                      }
                    }, 150);
                  }
                }
              }
            }
          });

          tabObserver.observe(document.body, {
            childList: true,
            subtree: true,
          });
          observers.push(tabObserver);

          let retryCount = 0;
          const intervalId = setInterval(() => {
            retryCount++;
            const success = injectTargetRateButton();
            if (success) {
              clearInterval(intervalId);
              console.log("✅ Button injected via fallback");
              return;
            }
            if (retryCount > 30) {
              clearInterval(intervalId);
              console.log("⚠️ Fallback exhausted");
            }
          }, 500);
          cleanupIntervals.push(intervalId);
        }
      }

      if (shouldInitialize()) {
        console.log(
          "DEBUG: ✅ Contact detail page detected - injecting button"
        );
        initializeContactDetailSystem();
        setupPaymentButtonHiding();
      }
      setupUrlChangeDetection();
    }

    // ==========================================
    // CONVERSATIONS PAGE LOGIC
    // ==========================================

    if (isConversationsPage) {
      console.log("DEBUG: Initializing Conversations Page injection");

      let currentContactId = null;
      let conversationObserver = null;

      function getContactIdFromConversation() {
        // Try multiple methods to get contact ID
        const conversationElement = document.querySelector("[contactid]");
        if (conversationElement) {
          return conversationElement.getAttribute("contactid");
        }

        // Try from URL if conversation is selected
        const urlMatch = window.location.href.match(
          /conversations\/[^\/]+\/([a-zA-Z0-9]+)/
        );
        if (urlMatch) {
          return urlMatch[1];
        }

        return null;
      }

      function setupContactClickHandler() {
        const conversationElements = document.querySelectorAll(
          "[data-conversation-id]"
        );

        conversationElements.forEach((element) => {
          element.removeEventListener("click", handleConversationClick);
          element.addEventListener("click", handleConversationClick);
        });
      }

      function handleConversationClick(event) {
        const contactId = this.getAttribute("contactid");
        const conversationId = this.getAttribute("data-conversation-id");
        const contactName =
          this.getAttribute("contactname") || this.getAttribute("fullname");

        console.log("📞 Conversation clicked:", {
          contactId: contactId,
          conversationId: conversationId,
          contactName: contactName,
        });

        currentContactId = contactId;

        // Re-inject button after contact selection
        setTimeout(() => {
          injectConversationButton();
        }, 500);
      }

      function injectConversationButton() {
        // Find the "tabs" area that contains All Fields / DND / Actions
        const allTabs = document.querySelectorAll(
          ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
        );

        let targetTab = null;

        // Look for the specific tab that has "All Fields", "DND", "Actions" tabs
        for (const tab of allTabs) {
          const tabLabels = tab.textContent || "";
          if (
            tabLabels.includes("All Fields") &&
            tabLabels.includes("DND") &&
            tabLabels.includes("Actions")
          ) {
            targetTab = tab;
            break;
          }
        }

        if (!targetTab) {
          console.log("DEBUG: Conversation tabs not found yet");
          return false;
        }

        // Remove existing container if any
        const existingContainer = document.getElementById(
          "conversation-target-rate-container"
        );
        if (existingContainer) existingContainer.remove();

        const buttonContainer = document.createElement("div");
        buttonContainer.id = "conversation-target-rate-container";
        buttonContainer.style.cssText = `
                      margin: 7px 0px 15px 0px;
                      padding: 0;
                      width: 100%;
                      display: flex;
                      gap: 8px;
                      align-items: center;
                    `;

        // Left button: Set Target Rate (conversation)
        const leftBtn = document.createElement("button");
        leftBtn.id = "conversation-target-rate-button";
        leftBtn.innerHTML =
          '<i class="fa-solid fa-bullseye" style="margin-right: 6px;"></i> Set Target Rate';
        leftBtn.style.cssText = `
                      flex:1;
                      margin: 0;
                      padding: 8px 12px !important;
                      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
                      color: white;
                      border: none;
                      border-radius: 6px;
                      font-size: 13px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(0,123,255,0.3);
                      white-space: nowrap;
                    `;

        leftBtn.addEventListener("mouseenter", () => {
          leftBtn.style.transform = "translateY(-2px)";
          leftBtn.style.boxShadow = "0 4px 10px rgba(0, 123, 255, 0.5)";
        });
        leftBtn.addEventListener("mouseleave", () => {
          leftBtn.style.transform = "translateY(0)";
          leftBtn.style.boxShadow = "0 2px 6px rgba(0, 123, 255, 0.3)";
        });

        leftBtn.addEventListener("click", async function () {
          const contactId = currentContactId || getContactIdFromConversation();
          if (!contactId) {
            alert("No contact selected. Please select a conversation first.");
            return;
          }

          try {
            const contactDetails = await fetchContactDetails(contactId);
            if (!contactDetails) {
              alert("Failed to fetch contact details.");
              return;
            }
            const contactIds = [contactId];
            await showPopup3(contactIds, contactDetails);
          } catch (error) {
            console.error("Error in conversation target click handler:", error);
            alert("Error loading contact details.");
          }
        });

        // Right button: Refi Analysis (conversation)
        const rightBtn = document.createElement("button");
        rightBtn.id = "conversation-refi-analysis-button";
        rightBtn.innerHTML =
          '<i class="fa-solid fa-chart-line" style="margin-right: 6px;"></i> Refi Analysis';
        rightBtn.style.cssText = `
                      flex:1;
                      margin: 0;
                      padding: 8px 12px !important;
                      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                      color: white;
                      border: none;
                      border-radius: 6px;
                      font-size: 13px;
                      font-weight: 600;
                      cursor: pointer;
                      transition: all 0.2s ease;
                      box-shadow: 0 2px 6px rgba(16,185,129,0.3);
                      white-space: nowrap;
                    `;

        rightBtn.addEventListener("mouseenter", () => {
          rightBtn.style.transform = "translateY(-2px)";
          rightBtn.style.boxShadow = "0 4px 10px rgba(16,185,129,0.45)";
        });
        rightBtn.addEventListener("mouseleave", () => {
          rightBtn.style.transform = "translateY(0)";
          rightBtn.style.boxShadow = "0 2px 6px rgba(16,185,129,0.3)";
        });

        rightBtn.addEventListener("click", async function () {
          const contactId = currentContactId || getContactIdFromConversation();
          if (!contactId) {
            alert("No contact selected. Please select a conversation first.");
            return;
          }
          try {
            const contactDetails = await fetchContactDetails(contactId);
            const customFields = await fetchCustomFields(locationId1);
            const contactData = extractContactData(
              contactDetails,
              customFields
            );
            showOnDemandRefiPopup(contactData);
          } catch (error) {
            console.error("Error fetching contact data:", error);
            showOnDemandRefiPopup();
          }
        });

        buttonContainer.appendChild(leftBtn);
        buttonContainer.appendChild(rightBtn);
        targetTab.parentNode.insertBefore(buttonContainer, targetTab);

        console.log(
          "DEBUG: ✅ Conversation target rate + Refi buttons injected successfully"
        );
        return true;
      }
    }

    // ====== BEGIN: Robust reinjection helpers (fixes needing hard refresh) ======
    // These run irrespective of initial page load and re-insert buttons when routes change.
    function getContactIdFromConversationGlobal() {
      // First try to get from the active conversation element
      const activeConversation = document.querySelector(
        '[data-is-active="true"][contactid]'
      );
      if (activeConversation) {
        const contactId = activeConversation.getAttribute("contactid");
        console.log("Found contact ID from active conversation:", contactId);
        return contactId;
      }

      // Fallback to any element with contactid attribute
      const el = document.querySelector("[contactid]");
      if (el) {
        const contactId = el.getAttribute("contactid");
        console.log("Found contact ID from any element:", contactId);
        return contactId;
      }

      // Last resort - try URL pattern
      const urlMatch = window.location.href.match(
        /conversations\/[^\/]+\/([a-zA-Z0-9]+)/
      );
      if (urlMatch) {
        console.log("Found contact ID from URL:", urlMatch[1]);
        return urlMatch[1];
      }

      console.log("No contact ID found");
      return null;
    }

    function ensureContactDetailButton() {
      const contactTab = document.querySelector(
        ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
      );
      if (!contactTab) return;

      if (!getContactIdFromUrl()) return; // only add on contact detail urls

      // Remove any existing container to prevent duplicates
      const existing = document.getElementById(
        "dashboard-target-rate-container"
      );
      if (existing) existing.remove();

      try {
        const container = document.createElement("div");
        container.id = "dashboard-target-rate-container";
        container.style.cssText =
          "margin:7px 0px 15px 0px;padding:0;display:flex;gap:8px;justify-content:flex-start;";

        const btnLeft = document.createElement("button");
        btnLeft.id = "dashboard-target-rate-button";
        btnLeft.innerHTML =
          '<i class="fa-solid fa-bullseye" style="margin-right:6px;"></i> Rate Alert';
        btnLeft.style.cssText = `flex:1;margin:0;padding:8px 12px;background:linear-gradient(135deg,#007bff 0%,#0056b3 100%);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(0,123,255,0.3);`;

        btnLeft.addEventListener("click", async () => {
          console.log("🎯 RATE ALERT BUTTON CLICKED - Contact Detail Page");
          const cid = getContactIdFromUrl();
          console.log("📍 Contact ID from URL:", cid);
          console.log("📍 Current URL:", window.location.href);

          if (!cid) {
            console.error("❌ No contact ID found");
            alert("No contact ID found. Select a contact then try again.");
            return;
          }

          try {
            console.log("🔄 Fetching contact details for ID:", cid);
            const details = await fetchContactDetails(cid);
            console.log("📋 Contact details response:", details);

            if (!details) {
              console.error("❌ No contact details returned");
              alert("Failed to fetch contact details.");
              return;
            }

            if (!details.contact) {
              console.error(
                "❌ Contact details missing 'contact' property:",
                details
              );
              alert("Invalid contact details format.");
              return;
            }

            if (!details.contact.id) {
              console.error(
                "❌ Contact missing 'id' property:",
                details.contact
              );
              alert("Contact ID is missing from details.");
              return;
            }

            console.log("✅ Valid contact found, ID:", details.contact.id);
            console.log("🚀 Calling showPopup3 with:", [cid], details);
            await showPopup3([cid], details);
          } catch (err) {
            console.error("❌ Contact button error:", err);
            console.error("❌ Error stack:", err.stack);
            alert("Error loading contact details: " + err.message);
          }
        });

        const btnRight = document.createElement("button");
        btnRight.id = "dashboard-refi-analysis-button";
        btnRight.innerHTML =
          '<i class="fa-solid fa-chart-line" style="margin-right:6px;"></i> Refi Analysis';
        btnRight.style.cssText = `flex:1;margin:0;padding:8px 12px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(16,185,129,0.3);`;

        btnRight.addEventListener("click", async () => {
          console.log(
            "📍 📍 📍 CONTACT DETAIL REFI ANALYSIS BUTTON CLICKED 📍 📍 📍"
          );
          console.log("📍 Button element:", btnRight);
          console.log("📍 Button ID:", btnRight.id);
          console.log("📍 Button text:", btnRight.textContent);
          console.log("📍 Current timestamp:", new Date().toISOString());
          console.log("📊 REFI ANALYSIS BUTTON CLICKED - Contact Detail Page");
          const cid = getContactIdFromUrl();
          console.log("📍 Contact ID from URL:", cid);
          console.log("📍 Current URL:", window.location.href);

          if (!cid) {
            console.error("❌ No contact ID found for refi analysis");
            alert("No contact ID found. Select a contact then try again.");
            return;
          }

          try {
            console.log(
              "🔄 Fetching contact details for refi analysis, ID:",
              cid
            );
            const contactDetails = await fetchContactDetails(cid);
            console.log("📋 Contact details for refi:", contactDetails);

            console.log("🔄 Fetching custom fields for location:", locationId1);
            const customFields = await fetchCustomFields(locationId1);
            console.log("📋 Custom fields:", customFields);

            console.log("🔄 Extracting contact data...");
            const contactData = extractContactData(
              contactDetails,
              customFields
            );
            console.log("📋 Extracted contact data:", contactData);

            console.log("🚀 Opening refi popup with data:", contactData);
            showOnDemandRefiPopup(contactData);
          } catch (error) {
            console.error("❌ Error fetching contact data for refi:", error);
            console.error("❌ Error stack:", error.stack);
            console.log("🔄 Opening refi popup without data due to error");
            showOnDemandRefiPopup();
          }
        });

        container.appendChild(btnLeft);
        container.appendChild(btnRight);

        if (contactTab.parentNode)
          contactTab.parentNode.insertBefore(container, contactTab);

        console.log("DEBUG: ensured contact detail two-button container");
      } catch (e) {
        console.error("ensureContactDetailButton error:", e);
      }
    }

    function ensureConversationButton() {
      // find the "tabs" area that contains All Fields / DND / Actions
      const allTabs = document.querySelectorAll(
        ".hr-tabs-nav--segment-type.hr-tabs-nav--top.hr-tabs-nav"
      );
      let targetTab = null;
      for (const t of allTabs) {
        const txt = (t.textContent || "").trim();
        if (
          txt.includes("All Fields") &&
          txt.includes("DND") &&
          txt.includes("Actions")
        ) {
          targetTab = t;
          break;
        }
      }
      if (!targetTab) return;

      if (document.getElementById("conversation-target-rate-container")) return; // already present

      try {
        const container = document.createElement("div");
        container.id = "conversation-target-rate-container";
        container.style.cssText =
          "margin:7px 0px 15px 0px;padding:0;display:flex;gap:8px;justify-content:flex-start;";

        const btnLeft = document.createElement("button");
        btnLeft.id = "conversation-target-rate-button";
        btnLeft.innerHTML =
          '<i class="fa-solid fa-bullseye" style="margin-right:6px;"></i> Rate Alert';
        btnLeft.style.cssText = `flex:1;margin:0;padding:8px 12px;background:linear-gradient(135deg,#007bff 0%,#0056b3 100%);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(0,123,255,0.3);`;

        btnLeft.addEventListener("click", async () => {
          console.log("🎯 RATE ALERT BUTTON CLICKED - Conversation Page");
          const cid = getContactIdFromConversationGlobal();
          console.log("📍 Contact ID from conversation:", cid);
          console.log("📍 Current URL:", window.location.href);

          if (!cid) {
            console.error("❌ No contact selected in conversation");
            alert("No contact selected. Please select a conversation first.");
            return;
          }

          try {
            console.log(
              "🔄 Fetching contact details for conversation ID:",
              cid
            );
            const details = await fetchContactDetails(cid);
            console.log("📋 Conversation contact details (RAW):", details);
            console.log("📋 Conversation details type:", typeof details);
            console.log(
              "📋 Conversation details keys:",
              details ? Object.keys(details) : "null/undefined"
            );

            if (!details) {
              console.error("❌ No contact details returned for conversation");
              alert("Failed to fetch contact details.");
              return;
            }

            // More flexible validation for conversation
            let contactObj = null;
            if (details.contact) {
              contactObj = details.contact;
              console.log(
                "📋 Found conversation contact via .contact property:",
                contactObj
              );
            } else if (details.id) {
              contactObj = details;
              console.log(
                "📋 Conversation details appears to be the contact itself:",
                contactObj
              );
            } else {
              console.error(
                "❌ Could not find contact object in conversation details:",
                details
              );
              alert("Invalid contact details format - no contact found.");
              return;
            }

            if (!contactObj.id) {
              console.error(
                "❌ Conversation contact object missing 'id' property:",
                contactObj
              );
              console.error(
                "❌ Conversation contact object keys:",
                Object.keys(contactObj)
              );
              alert("Contact ID is missing from details.");
              return;
            }

            console.log(
              "✅ Valid conversation contact found, ID:",
              contactObj.id
            );
            console.log(
              "🚀 Calling showPopup3 from conversation with:",
              [cid],
              details
            );
            await showPopup3([cid], details);
          } catch (err) {
            console.error("❌ Conversation button error:", err);
            console.error("❌ Error name:", err.name);
            console.error("❌ Error message:", err.message);
            console.error("❌ Error stack:", err.stack);
            alert("Error loading contact details: " + err.message);
          }
        });

        const btnRight = document.createElement("button");
        btnRight.id = "conversation-refi-analysis-button";
        btnRight.innerHTML =
          '<i class="fa-solid fa-chart-line" style="margin-right:6px;"></i> Refi Analysis';
        btnRight.style.cssText = `flex:1;margin:0;padding:8px 12px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 2px 6px rgba(16,185,129,0.3);`;

        btnRight.addEventListener("click", async () => {
          console.log(
            "📍 📍 📍 CONVERSATION REFI ANALYSIS BUTTON CLICKED 📍 📍 📍"
          );
          console.log("📍 Button element:", btnRight);
          console.log("📍 Button ID:", btnRight.id);
          console.log("📍 Button text:", btnRight.textContent);
          console.log("📍 Current timestamp:", new Date().toISOString());
          console.log("📊 REFI ANALYSIS BUTTON CLICKED - Conversation Page");
          const cid = getContactIdFromConversationGlobal();
          console.log("📍 Contact ID from conversation:", cid);
          console.log("📍 Current URL:", window.location.href);

          if (!cid) {
            console.error(
              "❌ No contact selected for conversation refi analysis"
            );
            alert("No contact selected. Please select a conversation first.");
            return;
          }

          try {
            console.log(
              "🔄 Fetching contact details for conversation refi, ID:",
              cid
            );
            const contactDetails = await fetchContactDetails(cid);
            console.log(
              "📋 Conversation contact details for refi:",
              contactDetails
            );

            console.log(
              "🔄 Fetching custom fields for conversation refi, location:",
              locationId1
            );
            const customFields = await fetchCustomFields(locationId1);
            console.log("📋 Conversation custom fields:", customFields);

            console.log("🔄 Extracting conversation contact data...");
            const contactData = extractContactData(
              contactDetails,
              customFields
            );
            console.log("📋 Extracted conversation contact data:", contactData);

            console.log(
              "🚀 Opening conversation refi popup with data:",
              contactData
            );
            showOnDemandRefiPopup(contactData);
          } catch (error) {
            console.error(
              "❌ Error fetching conversation contact data for refi:",
              error
            );
            console.error("❌ Error stack:", error.stack);
            console.log(
              "🔄 Opening conversation refi popup without data due to error"
            );
            showOnDemandRefiPopup();
          }
        });

        container.appendChild(btnLeft);
        container.appendChild(btnRight);

        if (targetTab.parentNode)
          targetTab.parentNode.insertBefore(container, targetTab);
        console.log("DEBUG: ensured conversation two-button container");
      } catch (e) {
        console.error("ensureConversationButton error:", e);
      }
    }

    // Run continuously to handle SPA route changes and late DOM loads.
    // Interval is small enough to be responsive but light enough to not be intrusive.
    const ghlAutoInjectInterval = setInterval(() => {
      try {
        if (window.location.href.includes("/detail/")) {
          ensureContactDetailButton();
        }
        if (window.location.href.includes("/conversations/")) {
          ensureConversationButton();
        }
        // keep hiding payment buttons too
        hidePaymentButtons();
      } catch (e) {
        console.error("ghlAutoInjectInterval error:", e);
      }
    }, 700);

    // Clean up on unload
    window.addEventListener("beforeunload", () => {
      clearInterval(ghlAutoInjectInterval);
    });
    // ====== POPUP CLOSE ON NAVIGATION ======
    let currentUrl = window.location.href;

    function closeAllPopups() {
      // Close rate alert popup
      const rateAlertPopup = document.querySelector(
        '[style*="position: fixed"][style*="z-index: 9999"]'
      );
      if (rateAlertPopup) {
        rateAlertPopup.remove();
      }

      // Close refi analysis popup
      const refiPopup = document.getElementById("on-demand-refi-popup");
      if (refiPopup) {
        refiPopup.remove();
      }

      // Close any other modal/popup with high z-index
      const allPopups = document.querySelectorAll(
        '[style*="z-index: 9999"], [style*="z-index: 10000"], [style*="z-index: 99999"]'
      );
      allPopups.forEach((popup) => {
        if (popup.style.position === "fixed") {
          popup.remove();
        }
      });
    }

    function checkForNavigation() {
      if (window.location.href !== currentUrl) {
        console.log("Navigation detected, closing popups");
        closeAllPopups();
        currentUrl = window.location.href;
      }
    }

    // Check for navigation changes every 500ms
    setInterval(checkForNavigation, 500);

    // Also listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", () => {
      setTimeout(closeAllPopups, 100);
    });

    // Listen for hash changes
    window.addEventListener("hashchange", () => {
      setTimeout(closeAllPopups, 100);
    });

    // ====== END: Robust reinjection helpers ======
  })();
</script>
