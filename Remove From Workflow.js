<script>

 // for remove from workflow
  
  (function () {
    "use strict";
  
    console.log("🔧 Delete Contacts from Workflow: Script started");
  
    // Configuration
    const CONFIG = {
      TARGET_LOCATION_ID: "CWWHglksQdwc75IHsRlw",
      API_DELAY: 400, // Reduced from 500ms for better performance
      MAX_RETRIES: 2,
    };
  
    // State management
    const state = {
      selectedContactIds: [],
      locationId: null,
      accessToken: null,
      isProcessing: false,
      workflows: null,
      workflowsFetched: false,
    };
  
    // Expose selected contacts globally
    Object.defineProperty(window, "selectedContactIds", {
      get: () => state.selectedContactIds,
      set: (value) => {
        state.selectedContactIds = value;
      },
    });
  
    // Utility Functions
    const utils = {
      getLocationIdFromUrl() {
        const match = window.location.href.match(/location\/([^\/]+)/);
        state.locationId = match ? match[1] : null;
        console.log("📍 Location ID:", state.locationId);
  
        if (state.locationId !== CONFIG.TARGET_LOCATION_ID) {
          console.log(
            "❌ Location mismatch. Expected:",
            CONFIG.TARGET_LOCATION_ID,
            "Got:",
            state.locationId
          );
          return false;
        }
  
        console.log("✅ Location ID verified");
        return true;
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
        const existingButton = document.getElementById(
          "delete-contacts-workflow-btn"
        );
  
        if (state.selectedContactIds.length > 0) {
          if (!document.getElementById("delete-contacts-workflow-option")) {
            this.injectButton();
          }
        } else {
          const existingOption = document.getElementById(
            "delete-contacts-workflow-option"
          );
          existingOption?.remove();
        }
      },
  
      injectButton() {
        // Check if already injected
        if (document.getElementById("delete-contacts-workflow-option")) return;
  
        // Wait for dropdown to be available and inject our option
        const checkDropdown = () => {
          const dropdown = document.getElementById(
            "quickfilters-bulk-actions-dropdown"
          );
          if (dropdown) {
            this.injectDropdownOption(dropdown);
          } else {
            // If dropdown not found, try again after a short delay
            setTimeout(checkDropdown, 100);
          }
        };
  
        // Monitor for dropdown creation
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (
                node.nodeType === 1 &&
                node.id === "quickfilters-bulk-actions-dropdown"
              ) {
                this.injectDropdownOption(node);
              }
            });
          });
        });
  
        observer.observe(document.body, { childList: true, subtree: true });
  
        // Also check immediately in case dropdown already exists
        checkDropdown();
  
        // Pre-fetch workflows when button appears
        this.preFetchWorkflows();
  
        console.log("✅ Dropdown option injection setup");
      },
  
      injectDropdownOption(dropdown) {
        // Check if already injected
        if (document.getElementById("delete-contacts-workflow-option")) return;
  
        // Find the "Trigger Automation" option
        const triggerAutomationOption = Array.from(
          dropdown.querySelectorAll(".n-dropdown-option")
        ).find((option) => option.textContent.includes("Trigger Automation"));
  
        if (triggerAutomationOption) {
          // Create our option
          const workflowOption = document.createElement("div");
          workflowOption.className = "n-dropdown-option";
          workflowOption.id = "delete-contacts-workflow-option";
          workflowOption.setAttribute("data-dropdown-option", "true");
          workflowOption.innerHTML = `
            <div class="n-dropdown-option-body">
              <div class="n-dropdown-option-body__prefix n-dropdown-option-body__prefix--show-icon" style="margin-left: -2px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475467">
                  <path d="M16 6v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C8 3.52 8 4.08 8 5.2V6m2 5.5v5m4-5v5M3 6h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C16.72 22 15.88 22 14.2 22H9.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C5 19.72 5 18.88 5 17.2V6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div data-dropdown-option="true" class="n-dropdown-option-body__label" style="font-size: 14px;">Remove from Workflow</div>
              <div data-dropdown-option="true" class="n-dropdown-option-body__suffix"></div>
            </div>
          `;
  
          // Add top margin for hover separation and styling to match native options
          workflowOption.style.marginTop = "2px";
          workflowOption.style.marginLeft = "4px";
          workflowOption.style.marginRight = "4px";
          workflowOption.style.marginBottom = "0px";
          workflowOption.style.borderRadius = "3px";
  
          workflowOption.addEventListener("mouseenter", (e) => {
            e.stopPropagation();
            // Clear any other hover states
            dropdown.querySelectorAll(".n-dropdown-option").forEach((opt) => {
              if (opt !== workflowOption) {
                opt.style.backgroundColor = "";
              }
            });
            workflowOption.style.backgroundColor = "rgb(243, 243, 245)";
          });
  
          workflowOption.addEventListener("mouseleave", (e) => {
            e.stopPropagation();
            workflowOption.style.backgroundColor = "";
          });
  
          // Add click handler
          workflowOption.addEventListener("click", () => {
            workflowManager.handleButtonClick();
            // Close the dropdown
            dropdown.style.display = "none";
          });
  
          // Insert after "Trigger Automation"
          triggerAutomationOption.parentNode.insertBefore(
            workflowOption,
            triggerAutomationOption.nextSibling
          );
  
          console.log("✅ Dropdown option injected");
        }
      },
  
      async preFetchWorkflows() {
        if (state.workflowsFetched) return;
  
        if (!state.locationId) utils.getLocationIdFromUrl();
        if (!state.accessToken) await utils.getAccessToken();
  
        if (state.locationId && state.accessToken) {
          state.workflows = await workflowManager.fetchWorkflows();
          state.workflowsFetched = true;
          console.log("✅ Workflows pre-fetched");
        }
      },
    };
  
    // Workflow Management
    const workflowManager = {
      async handleButtonClick() {
        if (state.isProcessing) return;
  
        if (!state.locationId) utils.getLocationIdFromUrl();
        if (!state.accessToken) await utils.getAccessToken();
  
        if (!state.locationId || !state.accessToken) {
          alert(
            "Error: Could not retrieve required data. Please refresh the page."
          );
          return;
        }
  
        // Use pre-fetched workflows or fetch if not available
        const workflows = state.workflows || (await this.fetchWorkflows());
        // Filter out workflows starting with asterisk
        const filteredWorkflows = workflows.filter(
          (workflow) => !workflow.name || !workflow.name.startsWith("*")
        );
        modalManager.showModal("workflow-selection", filteredWorkflows);
      },
  
      async fetchWorkflows() {
        try {
          console.log("📡 Fetching workflows");
          const response = await fetch(
            `https://services.leadconnectorhq.com/workflows/?locationId=${state.locationId}`,
            {
              headers: {
                Authorization: `Bearer ${state.accessToken}`,
                Accept: "application/json",
                Version: "2021-07-28",
              },
            }
          );
  
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
          const data = await response.json();
          console.log(`✅ Fetched ${data.workflows?.length || 0} workflows`);
          return data.workflows || [];
        } catch (error) {
          console.error("❌ Workflow fetch error:", error);
          alert("Error fetching workflows. Please try again.");
          return [];
        }
      },
  
      // async deleteContactFromWorkflow(contactId, workflowId, retryCount = 0) {
      //     try {
      //         const response = await fetch(
      //             `https://services.leadconnectorhq.com/contacts/${contactId}/workflow/${workflowId}`,
      //             {
      //                 method: 'DELETE',
      //                 headers: {
      //                     'Authorization': `Bearer ${state.accessToken}`,
      //                     'Accept': 'application/json',
      //                     'Version': '2021-07-28',
      //                     'Content-Type': 'application/json'
      //                 },
      //                 body: JSON.stringify({
      //                     eventStartTime: new Date().toISOString()
      //                 })
      //             }
      //         );
  
      //         const data = await response.json();
  
      //         if (!response.ok) {
      //             // Retry logic for transient failures
      //             if (retryCount < CONFIG.MAX_RETRIES && response.status >= 500) {
      //                 console.log(`🔄 Retrying contact ${contactId} (attempt ${retryCount + 1})`);
      //                 await new Promise(resolve => setTimeout(resolve, 1000));
      //                 return this.deleteContactFromWorkflow(contactId, workflowId, retryCount + 1);
      //             }
      //             throw new Error(data.message || `HTTP ${response.status}`);
      //         }
  
      //         return { success: true, data };
      //     } catch (error) {
      //         console.error(`❌ Delete failed for ${contactId}:`, error);
      //         return { success: false, error: error.message };
      //     }
      // }
  
      async deleteContactFromWorkflow(contactId, workflowId, retryCount = 0) {
        try {
          const response = await fetch(
            `https://services.leadconnectorhq.com/contacts/${contactId}/workflow/${workflowId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${state.accessToken}`,
                Accept: "application/json",
                Version: "2021-07-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                eventStartTime: new Date().toISOString(),
              }),
            }
          );
  
          const data = await response.json();
  
          if (!response.ok) {
            if (retryCount < CONFIG.MAX_RETRIES && response.status >= 500) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return this.deleteContactFromWorkflow(
                contactId,
                workflowId,
                retryCount + 1
              );
            }
            throw new Error(data.message || `HTTP ${response.status}`);
          }
  
          // ✅ CHECK THE ACTUAL API RESPONSE FIELD
          if (data.succeded === true) {
            // Note: API uses "succeded" not "succeeded"
            return { success: true, data };
          } else {
            return { success: false, error: "API returned succeded: false" };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      },
    };
  
    // Modal Management
    const modalManager = {
      currentModal: null,
      currentWorkflow: null,
  
      injectStyles() {
        if (document.getElementById("workflow-modal-styles")) return;
  
        const styles = document.createElement("style");
        styles.id = "workflow-modal-styles";
        styles.textContent = `
                .workflow-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    padding: 20px;
                    animation: fadeIn 0.2s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .workflow-modal {
                    background: white;
                    border-radius: 16px;
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow: hidden;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease;
                }
                
                .workflow-modal-header {
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .workflow-modal-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
                    pointer-events: none;
                }
                
                .workflow-modal-header h2 {
                    margin: 0;
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: white;
                    position: relative;
                    z-index: 1;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .workflow-modal-subtitle {
                    font-size: 0.8rem;
                    opacity: 0.95;
                    margin-top: 3px;
                    font-weight: 400;
                }
                
                .workflow-close-btn {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: white;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    transition: all 0.2s;
                    position: relative;
                    z-index: 1;
                }
                
                .workflow-close-btn:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: scale(1.05);
                }
                
                .workflow-search-container {
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f9fafb;
                }
                
                .workflow-search {
                    width: 100%;
                    padding: 10px 14px 10px 40px;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 13px;
                    transition: all 0.2s;
                    background: white url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>') no-repeat 12px center;
                }
                
                .workflow-search:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }
                
                .workflow-list {
                    max-height: 280px;
                    overflow-y: auto;
                    padding: 6px;
                }
                
                .workflow-item {
                    padding: 12px;
                    margin: 3px 0;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: 2px solid transparent;
                }
                
                .workflow-item:hover {
                    background: #f9fafb;
                    transform: translateX(4px);
                }
                
                .workflow-item.selected {
                    background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
                    border-color: #667eea;
                }
                
                .workflow-name {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                    font-size: 14px;
                }
                
                .workflow-id {
                    display: none;
                }
                
                .workflow-status {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    margin-left: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .status-published {
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                    color: #065f46;
                }
                
                .status-draft {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    color: #92400e;
                }
                
                .selected-workflow-info {
                    padding: 20px 24px;
                    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                    border-top: 1px solid #bae6fd;
                    display: none;
                }
                
                .selected-workflow-info h3 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: #0369a1;
                }
                
                .selected-workflow-details {
                    font-size: 14px;
                    color: #0c4a6e;
                    line-height: 1.6;
                }
                
                .workflow-modal-footer {
                    padding: 16px 20px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                    background: #f9fafb;
                }
                
                .workflow-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    transition: all 0.2s;
                    min-width: 100px;
                }
                
                .workflow-cancel-btn {
                    background: white;
                    color: #64748b;
                    border: 2px solid #e2e8f0;
                }
                
                .workflow-cancel-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    transform: translateY(-1px);
                }
                
                .workflow-done-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }
                
                .workflow-done-btn.confirmation-btn {
                    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                }
                
                .workflow-done-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
                }
                
                .workflow-done-btn.confirmation-btn:hover:not(:disabled) {
                    box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
                }
                
                .workflow-done-btn:disabled {
                    background: #cbd5e1;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                
                /* Confirmation Modal Styles */
                .confirmation-content {
                    padding: 24px 20px;
                    text-align: center;
                }
                
                .confirmation-icon {
                    width: 64px;
                    height: 64px;
                    margin: 0 auto 20px;
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                .confirmation-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 10px 0;
                }
                
                .confirmation-message {
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }
                
                .confirmation-details {
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 16px;
                    margin: 16px 0;
                    text-align: left;
                }
                
                .confirmation-detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .confirmation-detail-row:last-child {
                    border-bottom: none;
                }
                
                .confirmation-detail-label {
                    font-weight: 600;
                    color: #374151;
                }
                
                .confirmation-detail-value {
                    color: #6b7280;
                    font-weight: 500;
                }
                
                .confirmation-warning {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-left: 4px solid #f59e0b;
                    padding: 14px 16px;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-size: 13px;
                    color: #92400e;
                    text-align: left;
                    font-weight: 500;
                }
                
                /* Progress UI Styles */
                .progress-content {
                    padding: 20px;
                    flex: 1;
                    overflow-y: auto;
                }
                
                .progress-container {
                    background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    padding: 18px;
                }
                
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .progress-title {
                    font-weight: 700;
                    color: #1f2937;
                    font-size: 15px;
                }
                
                .progress-stats {
                    font-size: 13px;
                    color: #667eea;
                    font-weight: 700;
                    background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
                    padding: 5px 12px;
                    border-radius: 16px;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background: #e5e7eb;
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 20px;
                    position: relative;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                    transition: width 0.3s ease;
                    width: 0%;
                    position: relative;
                    overflow: hidden;
                }
                
                .progress-fill::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                    animation: shimmer 1.5s infinite;
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .contacts-progress-list {
                    max-height: 280px;
                    overflow-y: auto;
                }
                
                .contact-progress-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 10px;
                    margin-bottom: 10px;
                    transition: all 0.2s;
                }
                
                .contact-progress-item.processing {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                }
                
                .contact-progress-item.success {
                    border-color: #10b981;
                    background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
                }
                
                .contact-progress-item.error {
                    border-color: #ef4444;
                    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
                }
                
                .contact-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                }
                
                .contact-name {
                    font-size: 13px;
                    color: #374151;
                    font-weight: 600;
                    background: #f9fafb;
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }
                
                .contact-status {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                }
                
                .status-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .status-pending { color: #f59e0b; }
                .status-processing { color: #3b82f6; }
                .status-success { color: #10b981; }
                .status-error { color: #ef4444; }
                
                .results-summary {
                    padding: 24px;
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                    border: 2px solid #10b981;
                    border-radius: 12px;
                    margin-top: 20px;
                    text-align: center;
                }
                
                .results-summary.has-errors {
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border-color: #f59e0b;
                }
                
                .summary-title {
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 12px;
                }
                
                .summary-success { color: #065f46; }
                .summary-error { color: #92400e; }
                
                .summary-details {
                    font-size: 14px;
                    line-height: 1.8;
                }
                
                .no-workflows, .no-search-results {
                    padding: 40px 20px;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 14px;
                    display: none;
                }
                
                .no-workflows {
                    display: block;
                }
                
                .no-search-results {
                    display: none;
                }
                
                /* Scrollbar Styling */
                .workflow-list::-webkit-scrollbar,
                .contacts-progress-list::-webkit-scrollbar {
                    width: 8px;
                }
                
                .workflow-list::-webkit-scrollbar-track,
                .contacts-progress-list::-webkit-scrollbar-track {
                    background: #f3f4f6;
                    border-radius: 10px;
                }
                
                .workflow-list::-webkit-scrollbar-thumb,
                .contacts-progress-list::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 10px;
                }
                
                /* Responsive */
                @media (max-width: 768px) {
                    .workflow-modal {
                        max-width: 95%;
                        max-height: 95vh;
                    }
                    
                    .workflow-modal-header {
                        padding: 20px;
                    }
                    
                    .workflow-modal-header h2 {
                        font-size: 1.25rem;
                    }
                    
                    .workflow-modal-footer {
                        flex-direction: column;
                    }
                    
                    .workflow-btn {
                        width: 100%;
                    }
                    
                    .contact-progress-item {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 10px;
                    }
                }
            `;
  
        document.head.appendChild(styles);
      },
  
      showModal(type, data = null) {
        this.injectStyles();
  
        if (!this.currentModal) {
          this.createModal();
        }
  
        const modal = this.currentModal.querySelector(".workflow-modal");
  
        switch (type) {
          case "workflow-selection":
            this.updateModalContent(
              modal,
              this.getWorkflowSelectionContent(data)
            );
            this.setupWorkflowSelectionHandlers(modal, data);
            break;
          case "confirmation":
            this.updateModalContent(modal, this.getConfirmationContent(data));
            this.setupConfirmationHandlers(modal, data);
            break;
          case "progress":
            this.updateModalContent(modal, this.getProgressContent(data));
            this.setupProgressHandlers(modal, data);
            break;
        }
      },
  
      createModal() {
        const overlay = document.createElement("div");
        overlay.className = "workflow-modal-overlay";
  
        const modal = document.createElement("div");
        modal.className = "workflow-modal";
  
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        this.currentModal = overlay;
  
        // Global close handler
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) this.closeModal();
        });
      },
  
      updateModalContent(modal, content) {
        modal.innerHTML = content;
      },
  
      getWorkflowSelectionContent(workflows) {
        const workflowItems =
          workflows.length === 0
            ? '<div class="no-workflows">No workflows found</div>'
            : workflows
                .map(
                  (workflow) => `
              <div class="workflow-item" data-workflow-id="${workflow.id}">
                <div class="workflow-name">
                  ${workflow.name}
                  <span class="workflow-status status-${workflow.status}">${workflow.status}</span>
                </div>
              </div>
            `
                )
                .join("");
  
        return `
          <div class="workflow-modal-header">
            <div>
              <h2>Select Workflow</h2>
              <div class="workflow-modal-subtitle">Choose a workflow to remove contacts from</div>
            </div>
            <button class="workflow-close-btn">×</button>
          </div>
          <div class="workflow-search-container">
            <input type="text" class="workflow-search" placeholder="Search workflows..." />
          </div>
          <div class="workflow-list">${workflowItems}</div>
          <div class="selected-workflow-info" style="display: none;">
            <h3>Selected Workflow:</h3>
            <div class="selected-workflow-details">
              <strong>Name:</strong> <span id="selected-workflow-name">-</span><br>
              <strong>Contacts to remove:</strong> <span id="selected-contacts-count">${state.selectedContactIds.length}</span>
            </div>
          </div>
          <div class="workflow-modal-footer">
            <button class="workflow-btn workflow-cancel-btn">Cancel</button>
            <button class="workflow-btn workflow-done-btn" disabled>Continue</button>
          </div>
        `;
      },
  
      setupWorkflowSelectionHandlers(modal, workflows) {
        const closeBtn = modal.querySelector(".workflow-close-btn");
        const cancelBtn = modal.querySelector(".workflow-cancel-btn");
        const doneBtn = modal.querySelector(".workflow-done-btn");
        const searchInput = modal.querySelector(".workflow-search");
        const workflowItems = modal.querySelectorAll(".workflow-item");
        const selectedInfo = modal.querySelector(".selected-workflow-info");
  
        let selectedWorkflow = null;
  
        closeBtn.addEventListener("click", () => this.closeModal());
        cancelBtn.addEventListener("click", () => this.closeModal());
  
        // Add no results message
        const workflowList = modal.querySelector(".workflow-list");
        const noResultsMsg = document.createElement("div");
        noResultsMsg.className = "no-search-results";
        noResultsMsg.textContent = "No workflows found matching your search";
        workflowList.appendChild(noResultsMsg);
  
        // Search
        searchInput.addEventListener("input", (e) => {
          const term = e.target.value.toLowerCase();
          let visibleCount = 0;
  
          workflowItems.forEach((item) => {
            const name = item
              .querySelector(".workflow-name")
              .textContent.toLowerCase();
            const isVisible = name.includes(term);
            item.style.display = isVisible ? "block" : "none";
            if (isVisible) visibleCount++;
          });
  
          // Show/hide no results message
          noResultsMsg.style.display =
            visibleCount === 0 && term.length > 0 ? "block" : "none";
        });
  
        // Workflow selection
        workflowItems.forEach((item) => {
          item.addEventListener("click", () => {
            workflowItems.forEach((i) => i.classList.remove("selected"));
            item.classList.add("selected");
  
            const workflowId = item.getAttribute("data-workflow-id");
            selectedWorkflow = workflows.find((w) => w.id === workflowId);
            this.currentWorkflow = selectedWorkflow;
  
            modal.querySelector("#selected-workflow-name").textContent =
              selectedWorkflow ? selectedWorkflow.name : "Unknown Workflow";
            selectedInfo.style.display = "block";
            doneBtn.disabled = false;
          });
        });
  
        // Continue to confirmation
        doneBtn.addEventListener("click", () => {
          if (selectedWorkflow) {
            this.showModal("confirmation", selectedWorkflow);
          }
        });
      },
  
      getConfirmationContent(workflow) {
        return `
          <div class="workflow-modal-header">
            <div>
              <h2>Confirm Deletion</h2>
              <div class="workflow-modal-subtitle">Please review before proceeding</div>
            </div>
            <button class="workflow-close-btn">×</button>
          </div>
          <div class="confirmation-content">
            <p class="confirmation-message">
              You are about to remove <strong>${
                state.selectedContactIds.length
              }</strong> contact${
          state.selectedContactIds.length > 1 ? "s" : ""
        } from the workflow.
            </p>
            <div class="confirmation-details">
              <div class="confirmation-detail-row">
                <span class="confirmation-detail-label">Workflow:</span>
                <span class="confirmation-detail-value">${workflow.name}</span>
              </div>
              <div class="confirmation-detail-row">
                <span class="confirmation-detail-label">Contacts:</span>
                <span class="confirmation-detail-value">${
                  state.selectedContactIds.length
                }</span>
              </div>
              <div class="confirmation-detail-row">
                <span class="confirmation-detail-label">Action:</span>
                <span class="confirmation-detail-value">Remove from Workflow</span>
              </div>
            </div>
            <div class="confirmation-warning">
              <strong>⚠️ Warning:</strong> This action will immediately remove the contacts from the workflow. Any pending actions for these contacts in this workflow will be cancelled.
            </div>
          </div>
          <div class="workflow-modal-footer">
            <button class="workflow-btn workflow-cancel-btn">Cancel</button>
            <button class="workflow-btn workflow-done-btn confirmation-btn">Yes, Remove Contacts</button>
          </div>
        `;
      },
  
      setupConfirmationHandlers(modal, workflow) {
        const closeBtn = modal.querySelector(".workflow-close-btn");
        const cancelBtn = modal.querySelector(".workflow-cancel-btn");
        const confirmBtn = modal.querySelector(".workflow-done-btn");
  
        closeBtn.addEventListener("click", () => this.closeModal());
        cancelBtn.addEventListener("click", () => this.closeModal());
        confirmBtn.addEventListener("click", () => {
          this.showModal("progress", workflow);
        });
      },
  
      getProgressContent(workflow) {
        return `
          <div class="workflow-modal-header">
            <div>
              <h2>Removing Contacts</h2>
              <div class="workflow-modal-subtitle">Please wait while we process your request</div>
            </div>
            <button class="workflow-close-btn" style="pointer-events: none; opacity: 0.5;">×</button>
          </div>
          <div class="progress-content">
            <div class="progress-container">
              <div class="progress-header">
                <div class="progress-title">Removing from: ${workflow.name}</div>
                <div class="progress-stats">
                  <span id="progress-current">0</span> / <span id="progress-total">${state.selectedContactIds.length}</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
              </div>
              <div class="contacts-progress-list" id="contacts-progress-list"></div>
            </div>
            <div class="results-summary" id="results-summary" style="display: none;"></div>
          </div>
          <div class="workflow-modal-footer">
            <button class="workflow-btn workflow-cancel-btn" id="progress-cancel-btn">Cancel</button>
            <button class="workflow-btn workflow-done-btn" id="progress-close-btn" style="display: none;">Close</button>
          </div>
        `;
      },
  
      setupProgressHandlers(modal, workflow) {
        const cancelBtn = modal.querySelector("#progress-cancel-btn");
        const closeBtn = modal.querySelector("#progress-close-btn");
  
        let cancellationRequested = false;
  
        cancelBtn.addEventListener("click", () => {
          cancellationRequested = true;
          cancelBtn.disabled = true;
          cancelBtn.textContent = "Cancelling...";
        });
  
        closeBtn.addEventListener("click", () => {
          this.closeModal();
          // Update contact list without refresh
          contactManager.updateSelectedContacts();
        });
  
        // Start deletion process
        this.processContactDeletions(
          workflow,
          () => cancellationRequested,
          closeBtn,
          cancelBtn
        );
      },
  
      closeModal() {
        if (this.currentModal && document.body.contains(this.currentModal)) {
          document.body.removeChild(this.currentModal);
        }
        this.currentModal = null;
        this.currentWorkflow = null;
      },
  
      async processContactDeletions(
        workflow,
        getCancellationStatus,
        closeBtn,
        cancelBtn
      ) {
        state.isProcessing = true;
  
        const progressFill = document.getElementById("progress-fill");
        const progressCurrent = document.getElementById("progress-current");
        const contactsList = document.getElementById("contacts-progress-list");
        const resultsSummary = document.getElementById("results-summary");
  
        const totalContacts = state.selectedContactIds.length;
        let successfulDeletions = 0;
        let failedDeletions = 0;
        const errors = [];
  
        // Create progress items
        state.selectedContactIds.forEach((contactId) => {
          // Get contact name/email from the table
          const contactRow = document
            .querySelector(`[data-id="${contactId}"]`)
            ?.closest(".tabulator-row");
          let contactDisplay = "-"; // fallback
  
          if (contactRow) {
            const nameCell = contactRow.querySelector(
              '.tabulator-cell[tabulator-field="name"]'
            );
            const emailCell = contactRow.querySelector(
              '.tabulator-cell[tabulator-field="email"]'
            );
  
            if (nameCell && nameCell.textContent.trim()) {
              let name = nameCell.textContent.trim();
              // Remove initials prefix (e.g., "AU Android User" -> "Android User")
              const nameMatch = name.match(/^[A-Z]{1,3}\s+(.+)$/);
              if (nameMatch) {
                name = nameMatch[1];
              }
              contactDisplay = name;
            } else if (emailCell && emailCell.textContent.trim()) {
              contactDisplay = emailCell.textContent.trim();
            } else {
              contactDisplay = "-";
            }
          }
  
          const item = document.createElement("div");
          item.className = "contact-progress-item";
          item.id = `contact-${contactId}`;
          item.innerHTML = `
                    <div class="contact-info">
                        <span class="contact-name">${contactDisplay}</span>
                        <div class="contact-status status-pending">
                            <span class="status-icon">⏳</span>
                            <span>Pending</span>
                        </div>
                    </div>
                `;
          contactsList.appendChild(item);
        });
  
        // Process each contact
        for (let i = 0; i < totalContacts; i++) {
          if (getCancellationStatus()) {
            console.log("⚠️ Deletion process cancelled by user");
            break;
          }
  
          const contactId = state.selectedContactIds[i];
          const progressItem = document.getElementById(`contact-${contactId}`);
          const statusElement = progressItem.querySelector(".contact-status");
  
          // Update to processing
          progressItem.className = "contact-progress-item processing";
          statusElement.className = "contact-status status-processing";
          statusElement.innerHTML =
            '<span class="status-icon">🔄</span><span>Processing...</span>';
  
          // Scroll to current item
          progressItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  
          try {
            const result = await workflowManager.deleteContactFromWorkflow(
              contactId,
              workflow.id
            );
  
            if (result.success) {
              progressItem.className = "contact-progress-item success";
              statusElement.className = "contact-status status-success";
              statusElement.innerHTML =
                '<span class="status-icon">✅</span><span>Removed</span>';
              successfulDeletions++;
            } else {
              progressItem.className = "contact-progress-item error";
              statusElement.className = "contact-status status-error";
              statusElement.innerHTML = `<span class="status-icon">❌</span><span>Failed</span>`;
              failedDeletions++;
              errors.push({ contactId, error: result.error });
            }
          } catch (error) {
            progressItem.className = "contact-progress-item error";
            statusElement.className = "contact-status status-error";
            statusElement.innerHTML = `<span class="status-icon">❌</span><span>Error</span>`;
            failedDeletions++;
            errors.push({ contactId, error: error.message });
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
  
        if (getCancellationStatus()) {
          resultsSummary.className = "results-summary has-errors";
          resultsSummary.innerHTML = `
                    <div class="summary-title summary-error">⚠️ Operation Cancelled</div>
                    <div class="summary-details">
                        Successfully removed: <strong>${successfulDeletions}</strong> contacts<br>
                        Failed: <strong>${failedDeletions}</strong> contacts<br>
                        Remaining: <strong>${
                          totalContacts - successfulDeletions - failedDeletions
                        }</strong> contacts
                    </div>
                `;
        } else {
          if (failedDeletions === 0) {
            resultsSummary.className = "results-summary";
            resultsSummary.innerHTML = `
                        <div class="summary-title summary-success">✅ Success!</div>
                    `;
          } else {
            resultsSummary.className = "results-summary has-errors";
            resultsSummary.innerHTML = `
                        <div class="summary-title summary-error">⚠️ Completed with Errors</div>
                        <div class="summary-details">
                            Successfully removed: <strong>${successfulDeletions}</strong> contacts<br>
                            Failed: <strong>${failedDeletions}</strong> contacts
                        </div>
                    `;
          }
        }
  
        // Update footer
        cancelBtn.style.display = "none";
        closeBtn.style.display = "block";
  
        // Enable close button in header
        const headerCloseBtn = this.currentModal.querySelector(
          ".workflow-modal-header .workflow-close-btn"
        );
        headerCloseBtn.style.pointerEvents = "auto";
        headerCloseBtn.style.opacity = "1";
        headerCloseBtn.addEventListener("click", () => {
          this.closeModal();
          // Update contact list without refresh
          contactManager.updateSelectedContacts();
        });
  
        state.isProcessing = false;
  
        console.log(
          `✅ Process completed: ${successfulDeletions} succeeded, ${failedDeletions} failed`
        );
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
  
        observer.observe(document.body, {
          childList: true,
          subtree: true,
        });
  
        console.log("✅ Event listeners initialized");
      },
    };
  
    // Main Initialization
    function initialize() {
      console.log("🚀 Delete Contacts from Workflow: Initializing");
  
      eventManager.init();
  
      // Initial update
      setTimeout(() => contactManager.updateSelectedContacts(), 1000);
  
      console.log(
        `✅ Script initialized for location: ${CONFIG.TARGET_LOCATION_ID}`
      );
    }
  
    // Start
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initialize);
    } else {
      initialize();
    }
  })();
  

</script>
