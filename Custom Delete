<script>

 /// custom delete contact
  
  (function () {
    "use strict";
  
    console.log("🔧 Custom Delete Contacts: Script started");
  
    // Configuration
    const CONFIG = {
      API_DELAY: 400,
      MAX_RETRIES: 2,
    };
  
    // State management
    const state = {
      selectedContactIds: [],
      locationId: null,
      accessToken: null,
      isProcessing: false,
    };
  
    // Utility Functions
    const utils = {
      getLocationIdFromUrl() {
        const match = window.location.href.match(/location\/([^\/]+)/);
        state.locationId = match ? match[1] : null;
        console.log("📍 Location ID:", state.locationId);
        return state.locationId;
      },
  
      async getAccessToken() {
        try {
          console.log("🔑 Fetching access token");
          const response = await fetch(
            `https://api.konnectd.io/api/token/${state.locationId}`
          );
          const data = await response.json();
          state.accessToken = data.success ? data.token : null;
          console.log(
            "🔑 Token status:",
            state.accessToken ? "Retrieved" : "Failed"
          );
          return state.accessToken;
        } catch (error) {
          console.error("❌ Token fetch error:", error);
          return null;
        }
      },
  
      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func(...args), wait);
        };
      },
    };
  
    // Contact Selection Management
    const contactManager = {
      updateSelectedContacts() {
        console.log("🔄 Updating selected contacts");
  
        state.selectedContactIds = [];
        const checkboxes = document.querySelectorAll(
          '.tabulator-cell.selector input[type="checkbox"]:checked'
        );
  
        checkboxes.forEach((checkbox) => {
          const row = checkbox.closest(".tabulator-row");
          if (!row) return;
  
          const nameCell = row.querySelector(
            '.tabulator-cell[tabulator-field="name"]'
          );
          const contactElement = nameCell?.querySelector("[data-id]");
          const contactId = contactElement?.getAttribute("data-id");
  
          if (contactId && !state.selectedContactIds.includes(contactId)) {
            state.selectedContactIds.push(contactId);
          }
        });
  
        console.log(`📊 Selected: ${state.selectedContactIds.length} contacts`);
        buttonManager.updateButton();
      },
    };
  
    // Button Management
    const buttonManager = {
      updateButton() {
        if (state.selectedContactIds.length > 0) {
          // Show custom delete button only when contacts selected
          if (!document.getElementById("custom-delete-btn")) {
            this.injectCustomButton();
          }
        } else {
          // Remove custom delete button when no contacts selected
          const customBtn = document.getElementById("custom-delete-btn");
          if (customBtn) {
            customBtn.remove();
          }
        }
      },
  
      injectCustomButton() {
        // Find the More button to insert before it
        const moreButton = document.querySelector(".more");
        if (!moreButton) return;
  
        const customButton = document.createElement("button");
        customButton.id = "custom-delete-btn";
        customButton.className =
          "d-flex cursor-pointer contact-bulk-action-options";
        customButton.setAttribute("data-v-6832c5ce", "");
        customButton.setAttribute("aria-label", "Delete");
  
        customButton.innerHTML = `
        <svg data-v-6832c5ce="" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true" class="h-4 w-4" style="width: 14px; height: 14px;">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 6v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 00-.874-.874C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 00-.874.874C8 3.52 8 4.08 8 5.2V6m2 5.5v5m4-5v5M3 6h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 01-1.311 1.311C16.72 22 15.88 22 14.2 22H9.8c-1.68 0-2.52 0-3.162-.327a3 3 0 01-1.311-1.311C5 19.72 5 18.88 5 17.2V6"></path>
        </svg>
        <span data-v-6832c5ce="">Delete</span>
      `;
  
        customButton.addEventListener("click", () => {
          modalManager.showConfirmationModal();
        });
  
        // Insert before the More button
        moreButton.parentNode.insertBefore(customButton, moreButton);
  
        console.log("✅ Custom delete button injected before More button");
      },
    };
  
    // API Management
    const apiManager = {
      async deleteContact(contactId, retryCount = 0) {
        if (!state.accessToken) {
          await utils.getAccessToken();
        }
  
        if (!state.accessToken) {
          return { success: false, error: "No access token" };
        }
  
        try {
          const response = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contactId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${state.accessToken}`,
                Accept: "application/json",
                Version: "2021-07-28",
              },
            }
          );
  
          if (!response.ok) {
            if (retryCount < CONFIG.MAX_RETRIES && response.status >= 500) {
              console.log(
                `🔄 Retrying contact ${contactId} (attempt ${retryCount + 1})`
              );
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return this.deleteContact(contactId, retryCount + 1);
            }
            throw new Error(`HTTP ${response.status}`);
          }
  
          return { success: true };
        } catch (error) {
          console.error(`❌ Delete failed for ${contactId}:`, error);
          return { success: false, error: error.message };
        }
      },
    };
  
    // Modal Management
    const modalManager = {
      currentModal: null,
  
      injectStyles() {
        if (document.getElementById("custom-delete-modal-styles")) return;
  
        const styles = document.createElement("style");
        styles.id = "custom-delete-modal-styles";
        styles.textContent = `
        .custom-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
        }
  
        .custom-modal {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
          overflow: hidden;
        }
  
        .modal-header {
          padding: 24px 24px 20px 24px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }
  
        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }
  
        .modal-content {
          padding: 24px;
          background: white;
        }
  
        .confirmation-message {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 16px;
          color: #374151;
          margin-bottom: 20px;
        }
  
        .warning-icon {
          width: 48px;
          height: 48px;
          background: #fef3c7;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.3);
          border: 2px solid white;
        }
  
        .modal-footer {
          padding: 20px 24px 24px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          background: white;
        }
  
        .modal-btn {
          padding: 10px 20px;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          min-width: 90px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
  
        .cancel-btn {
          background: white;
          color: #374151;
          border: 1px solid #e2e8f0;
        }
  
        .cancel-btn:hover {
          background: #f9fafb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
  
        .delete-btn {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }
  
        .delete-btn:hover {
          background: #b91c1c;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(220, 38, 38, 0.4);
        }
  
        .progress-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
  
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
  
        .progress-title {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
  
        .progress-stats {
          font-size: 12px;
          color: #6b7280;
        }
  
        .progress-bar {
          width: 100%;
          height: 10px;
          background: #f3f4f6;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 16px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
  
        .progress-fill {
          height: 100%;
          background: #dc2626;
          border-radius: 8px;
          transition: width 0.3s ease;
          width: 0%;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }
  
        .contacts-list {
          max-height: 200px;
          overflow-y: auto;
        }
  
        .contact-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
  
        .contact-item.processing {
          border-color: #3b82f6;
          background: #eff6ff;
        }
  
        .contact-item.success {
          border-color: #10b981;
          background: #ecfdf5;
        }
  
        .contact-item.error {
          border-color: #ef4444;
          background: #fef2f2;
        }
  
        .contact-name {
          font-size: 13px;
          color: #374151;
        }
  
        .contact-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
        }
  
        .status-pending { color: #f59e0b; }
        .status-processing { color: #3b82f6; }
        .status-success { color: #10b981; }
        .status-error { color: #ef4444; }
  
        .results-summary {
          padding: 20px;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          margin-top: 20px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
  
        .summary-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }
      `;
  
        document.head.appendChild(styles);
      },
  
      showConfirmationModal() {
        this.injectStyles();
  
        const overlay = document.createElement("div");
        overlay.className = "custom-modal-overlay";
  
        const modal = document.createElement("div");
        modal.className = "custom-modal";
  
        modal.innerHTML = `
        <div class="modal-header">
          <h2>Delete Confirmation</h2>
        </div>
        <div class="modal-content">
          <div class="confirmation-message">
            <div class="warning-icon">⚠️</div>
            <div>
              Are you sure you want to delete ${
                state.selectedContactIds.length
              } contact${
          state.selectedContactIds.length > 1 ? "s" : ""
        }? This action cannot be undone.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn">Cancel</button>
          <button class="modal-btn delete-btn">Delete</button>
        </div>
      `;
  
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.currentModal = overlay;
  
        // Event listeners
        const cancelBtn = modal.querySelector(".cancel-btn");
        const deleteBtn = modal.querySelector(".delete-btn");
  
        cancelBtn.addEventListener("click", () => this.closeModal());
        deleteBtn.addEventListener("click", () => this.showProgressModal());
  
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) this.closeModal();
        });
      },
  
      showProgressModal() {
        const modal = this.currentModal.querySelector(".custom-modal");
  
        modal.innerHTML = `
        <div class="modal-header">
          <h2>Deleting Contacts</h2>
        </div>
        <div class="modal-content">
          <div class="progress-container">
            <div class="progress-header">
              <div class="progress-title">Deleting Contacts</div>
              <div class="progress-stats">
                <span id="progress-current">0</span> / <span id="progress-total">${state.selectedContactIds.length}</span>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" id="progress-fill"></div>
            </div>
            <div class="contacts-list" id="contacts-list"></div>
          </div>
          <div class="results-summary" id="results-summary" style="display: none;"></div>
        </div>
        <div class="modal-footer">
          <button class="modal-btn cancel-btn" id="close-btn" style="display: none;">Close</button>
        </div>
      `;
  
        this.processContactDeletions();
      },
  
      async processContactDeletions() {
        state.isProcessing = true;
  
        const progressFill = document.getElementById("progress-fill");
        const progressCurrent = document.getElementById("progress-current");
        const contactsList = document.getElementById("contacts-list");
        const resultsSummary = document.getElementById("results-summary");
        const closeBtn = document.getElementById("close-btn");
  
        const totalContacts = state.selectedContactIds.length;
        let successfulDeletions = 0;
        let failedDeletions = 0;
  
        // Create progress items
        state.selectedContactIds.forEach((contactId) => {
          const contactRow = document
            .querySelector(`[data-id="${contactId}"]`)
            ?.closest(".tabulator-row");
          let contactDisplay = contactId.substring(0, 8) + "...";
  
          if (contactRow) {
            const nameCell = contactRow.querySelector(
              '.tabulator-cell[tabulator-field="name"]'
            );
            const emailCell = contactRow.querySelector(
              '.tabulator-cell[tabulator-field="email"]'
            );
  
            if (nameCell && nameCell.textContent.trim()) {
              contactDisplay = nameCell.textContent.trim();
            } else if (emailCell && emailCell.textContent.trim()) {
              contactDisplay = emailCell.textContent.trim();
            }
          }
  
          const item = document.createElement("div");
          item.className = "contact-item";
          item.id = `contact-${contactId}`;
          item.innerHTML = `
          <span class="contact-name">${contactDisplay}</span>
          <div class="contact-status status-pending">
            <span>⏳</span>
            <span>Pending</span>
          </div>
        `;
          contactsList.appendChild(item);
        });
  
        // Process each contact
        for (let i = 0; i < totalContacts; i++) {
          const contactId = state.selectedContactIds[i];
          const progressItem = document.getElementById(`contact-${contactId}`);
          const statusElement = progressItem.querySelector(".contact-status");
  
          // Update to processing
          progressItem.className = "contact-item processing";
          statusElement.className = "contact-status status-processing";
          statusElement.innerHTML = "<span>🔄</span><span>Processing...</span>";
  
          progressItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  
          const result = await apiManager.deleteContact(contactId);
  
          if (result.success) {
            progressItem.className = "contact-item success";
            statusElement.className = "contact-status status-success";
            statusElement.innerHTML = "<span>✅</span><span>Deleted</span>";
            successfulDeletions++;
          } else {
            progressItem.className = "contact-item error";
            statusElement.className = "contact-status status-error";
            statusElement.innerHTML = "<span>❌</span><span>Failed</span>";
            failedDeletions++;
          }
  
          // Update progress
          const progressPercent = ((i + 1) / totalContacts) * 100;
          progressFill.style.width = `${progressPercent}%`;
          progressCurrent.textContent = i + 1;
  
          // Delay between requests
          await new Promise((resolve) => setTimeout(resolve, CONFIG.API_DELAY));
        }
  
        // Show results
        resultsSummary.style.display = "block";
  
        if (failedDeletions === 0) {
          resultsSummary.className = "results-summary";
          resultsSummary.innerHTML = `
          <div class="summary-title">✅ Success!</div>
         
        `;
        } else {
          resultsSummary.className = "results-summary has-errors";
          resultsSummary.innerHTML = `
          <div class="summary-title">⚠️ Completed with Errors</div>
          <div>
            Successfully deleted: <strong>${successfulDeletions}</strong> contacts<br>
            Failed: <strong>${failedDeletions}</strong> contacts
          </div>
        `;
        }
  
        closeBtn.style.display = "block";
        closeBtn.addEventListener("click", () => {
          this.closeModal();
          if (successfulDeletions > 0) {
            // Programmatically click header checkbox to uncheck it and hide additional UI
            const headerCheckbox = document.querySelector(
              '.tabulator-col.selector input[type="checkbox"]'
            );
            if (headerCheckbox && headerCheckbox.checked) {
              headerCheckbox.click();
            }
            tableRefresh.refreshTable();
          }
        });
  
        state.isProcessing = false;
        console.log(
          `✅ Process completed: ${successfulDeletions} succeeded, ${failedDeletions} failed`
        );
      },
  
      closeModal() {
        console.log("🚪 Closing modal...");
        if (this.currentModal && document.body.contains(this.currentModal)) {
          document.body.removeChild(this.currentModal);
        }
        this.currentModal = null;
  
        // Uncheck the header checkbox whenever modal closes
        console.log("🔄 Executing checkbox uncheck script...");
        try {
          document.querySelector('input[aria-label="Select Row"]').click();
          console.log("✅ Header checkbox unchecked successfully");
        } catch (error) {
          console.log(
            "⚠️ Header checkbox not found or already unchecked:",
            error
          );
        }
      },
    };
  
    // Table Refresh Manager
    const tableRefresh = {
      refreshTable() {
        // Method 1: Remove deleted rows from DOM
        this.removeDeletedRows();
  
        // Method 2: Try native GHL refresh
        this.triggerNativeRefresh();
  
        // Method 3: Clear selections
        this.clearSelections();
      },
  
      removeDeletedRows() {
        state.selectedContactIds.forEach((contactId) => {
          const element = document.querySelector(`[data-id="${contactId}"]`);
          const row = element?.closest(".tabulator-row");
          if (row) {
            row.style.opacity = "0";
            setTimeout(() => row.remove(), 300);
          }
        });
      },
  
      triggerNativeRefresh() {
        // Find and click refresh button
        const refreshBtn = document.querySelector(
          '[aria-label*="refresh" i], .refresh, [title*="refresh" i]'
        );
        if (refreshBtn) {
          refreshBtn.click();
          return;
        }
  
        // Try Tabulator redraw
        const table = document.querySelector(".tabulator");
        if (table?.tabulator) {
          table.tabulator.redraw();
        }
      },
  
      clearSelections() {
        // Clear all individual checkboxes
        document
          .querySelectorAll(".tabulator-cell.selector input:checked")
          .forEach((cb) => (cb.checked = false));
  
        // Clear header checkbox (select all)
        const headerCheckbox = document.querySelector(
          '.tabulator-col.selector input[type="checkbox"]'
        );
        if (headerCheckbox) {
          headerCheckbox.checked = false;
        }
  
        state.selectedContactIds = [];
        buttonManager.updateButton();
      },
    };
  
    // Event Listeners Setup
    const eventManager = {
      debouncedUpdate: null,
  
      init() {
        this.debouncedUpdate = utils.debounce(
          () => contactManager.updateSelectedContacts(),
          100
        );
  
        // Checkbox changes
        document.addEventListener("click", (e) => {
          if (
            e.target.type === "checkbox" &&
            e.target.closest(".tabulator-cell.selector")
          ) {
            this.debouncedUpdate();
          }
        });
  
        document.addEventListener("change", (e) => {
          if (
            e.target.type === "checkbox" &&
            e.target.closest(".tabulator-cell.selector")
          ) {
            this.debouncedUpdate();
          }
        });
  
        // Header checkbox (Select All)
        const observer = new MutationObserver(() => {
          const headerCheckbox = document.querySelector(
            '.tabulator-col.selector input[type="checkbox"]'
          );
          if (headerCheckbox && !headerCheckbox.dataset.listenerAttached) {
            headerCheckbox.dataset.listenerAttached = "true";
            headerCheckbox.addEventListener("change", () => {
              setTimeout(() => contactManager.updateSelectedContacts(), 150);
            });
          }
        });
  
        observer.observe(document.body, { childList: true, subtree: true });
        console.log("✅ Event listeners initialized");
      },
    };
  
    // Main Initialization
    function initialize() {
      console.log("🚀 Custom Delete Contacts: Initializing");
  
      if (!utils.getLocationIdFromUrl()) {
        console.log("❌ Location ID not found in URL");
        return;
      }
  
      eventManager.init();
  
      // Initial update
      setTimeout(() => contactManager.updateSelectedContacts(), 1000);
  
      console.log(`✅ Script initialized for location: ${state.locationId}`);
    }
  
    // Start
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize);
    } else {
      initialize();
    }
  })();

</script>
