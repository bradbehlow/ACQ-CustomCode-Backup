<script>
 //Custom Bul Assign User

  (function () {
    "use strict";

    console.log("[BULK ASSIGN USERS] Script started");

    const state = {
      locationId: null,
      accessToken: null,
      selectedContactIds: [],
      users: [],
      selectedUserId: null,
      selectedUserName: null,
      isProcessing: false,
    };

    function getLocationIdFromUrl() {
      const match = window.location.href.match(/location\/([^\/]+)/);
      state.locationId = match ? match[1] : null;
      console.log("📍 Location ID:", state.locationId);
      return state.locationId;
    }

    async function getAccessToken() {
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
    }

    async function fetchUsers() {
      if (!state.accessToken) await getAccessToken();
      if (!state.accessToken) return [];

      try {
        const response = await fetch(
          `https://services.leadconnectorhq.com/users/?locationId=${state.locationId}`,
          {
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
              Version: "2021-07-28",
            },
          }
        );
        const data = await response.json();
        state.users = data.users || [];
        return state.users;
      } catch (error) {
        console.error("❌ Fetch users error:", error);
        return [];
      }
    }

    async function assignUserToContact(contactId, userId) {
      if (!state.accessToken) await getAccessToken();
      if (!state.accessToken) return { success: false };

      try {
        const response = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
              "Content-Type": "application/json",
              Version: "2021-07-28",
            },
            body: JSON.stringify({ assignedTo: userId }),
          }
        );
        return { success: response.ok };
      } catch (error) {
        console.error("❌ Assign error:", error);
        return { success: false };
      }
    }

    function updateSelectedContacts() {
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
    }

    async function handleBulkAction() {
      updateSelectedContacts();
      if (state.selectedContactIds.length === 0) {
        alert("Please select contacts first");
        return;
      }
      await showUserSelectionModal();
    }

    function closeModal(overlay, fromProgressModal = false) {
      if (overlay && document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      if (fromProgressModal) {
        try {
          const headerCheckbox = document.querySelector(
            '.tabulator-col.selector input[type="checkbox"]'
          );
          if (headerCheckbox && headerCheckbox.checked) {
            headerCheckbox.click();
          }
        } catch (e) {}
      }
    }

    function injectStyles() {
      if (document.getElementById("bulk-assign-styles")) return;
      const styles = document.createElement("style");
      styles.id = "bulk-assign-styles";
      styles.textContent = `
          .bulk-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; justify-content: center; align-items: center; z-index: 10000; }
          .bulk-modal { background: white; border-radius: 20px; width: 100%; max-width: 480px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); overflow: hidden; }
          .bulk-modal-header { padding: 24px 24px 20px; border-bottom: 1px solid #e5e7eb; }
          .bulk-modal-header h2 { margin: 0; font-size: 18px; font-weight: 600; color: #374151; }
          .bulk-modal-content { padding: 24px; max-height: 350px; overflow-y: auto; }
          .bulk-search { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; margin-bottom: 16px; }
          .bulk-user-item { padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
          .bulk-user-item:hover { border-color: #3b82f6; background: #eff6ff; }
          .bulk-user-item.selected { border-color: #3b82f6; background: #dbeafe; }
          .bulk-user-name { font-weight: 600; color: #374151; font-size: 14px; }
          .bulk-user-email { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .bulk-modal-footer { padding: 20px 24px; border-top: 1px solid #e5e7eb; display: flex; gap: 12px; justify-content: flex-end; }
          .bulk-btn { padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; min-width: 90px; transition: all 0.2s; }
          .bulk-cancel-btn { background: white; color: #374151; border: 1px solid #e2e8f0; }
          .bulk-cancel-btn:hover { background: #f9fafb; }
          .bulk-assign-btn { background: #3b82f6; color: white; border: 1px solid #3b82f6; }
          .bulk-assign-btn:hover { background: #2563eb; }
          .bulk-assign-btn:disabled { background: #9ca3af; cursor: not-allowed; }
          .bulk-selected-user { padding: 16px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 12px; margin-bottom: 20px; }
          .bulk-selected-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
          .bulk-selected-name { font-weight: 600; color: #1e40af; font-size: 14px; }
          .bulk-progress-bar { width: 100%; height: 10px; background: #f3f4f6; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
          .bulk-progress-fill { height: 100%; background: #3b82f6; transition: width 0.3s; width: 0%; }
          .bulk-contact-item { display: flex; justify-content: space-between; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 8px; }
          .bulk-contact-item.processing { border-color: #3b82f6; background: #eff6ff; }
          .bulk-contact-item.success { border-color: #10b981; background: #ecfdf5; }
          .bulk-contact-item.error { border-color: #ef4444; background: #fef2f2; }
        `;
      document.head.appendChild(styles);
    }

    async function showUserSelectionModal() {
      injectStyles();
      const users = await fetchUsers();

      const overlay = document.createElement("div");
      overlay.className = "bulk-modal-overlay";
      const modal = document.createElement("div");
      modal.className = "bulk-modal";
      modal.innerHTML = `
          <div class="bulk-modal-header"><h2>Select User to Assign</h2></div>
          <div class="bulk-modal-content">
            <input type="text" class="bulk-search" placeholder="Search users..." id="user-search">
            <div id="users-list"></div>
          </div>
          <div class="bulk-modal-footer">
            <button class="bulk-btn bulk-cancel-btn" id="cancel-btn">Cancel</button>
            <button class="bulk-btn bulk-assign-btn" id="assign-btn" disabled>Assign</button>
          </div>
        `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const usersList = modal.querySelector("#users-list");
      const searchInput = modal.querySelector("#user-search");
      const assignBtn = modal.querySelector("#assign-btn");
      const cancelBtn = modal.querySelector("#cancel-btn");

      function renderUsers(filter = "") {
        const filtered = users.filter(
          (u) =>
            u.name.toLowerCase().includes(filter.toLowerCase()) ||
            u.email.toLowerCase().includes(filter.toLowerCase())
        );
        usersList.innerHTML = filtered
          .map(
            (u) => `
            <div class="bulk-user-item" data-user-id="${u.id}">
              <div class="bulk-user-name">${u.name}</div>
              <div class="bulk-user-email">${u.email}</div>
            </div>
          `
          )
          .join("");

        usersList.querySelectorAll(".bulk-user-item").forEach((item) => {
          item.addEventListener("click", () => {
            usersList
              .querySelectorAll(".bulk-user-item")
              .forEach((i) => i.classList.remove("selected"));
            item.classList.add("selected");
            state.selectedUserId = item.dataset.userId;
            assignBtn.disabled = false;
          });
        });
      }

      renderUsers();
      searchInput.addEventListener("input", (e) => renderUsers(e.target.value));
      cancelBtn.addEventListener("click", () => closeModal(overlay, false));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay, false);
      });
      assignBtn.addEventListener("click", () => {
        const selectedUser = users.find((u) => u.id === state.selectedUserId);
        state.selectedUserName = selectedUser ? selectedUser.name : "Unknown";
        document.body.removeChild(overlay);
        showProgressModal();
      });
    }

    async function showProgressModal() {
      const overlay = document.createElement("div");
      overlay.className = "bulk-modal-overlay";
      const modal = document.createElement("div");
      modal.className = "bulk-modal";
      modal.innerHTML = `
          <div class="bulk-modal-header"><h2>Assigning Users</h2></div>
          <div class="bulk-modal-content">
            <div class="bulk-selected-user">
              <div class="bulk-selected-label">Selected User:</div>
              <div class="bulk-selected-name">${state.selectedUserName}</div>
            </div>
            <div style="margin-bottom: 12px;"><span id="progress-text">0 / ${state.selectedContactIds.length}</span></div>
            <div class="bulk-progress-bar"><div class="bulk-progress-fill" id="progress-fill"></div></div>
            <div id="contacts-list"></div>
          </div>
          <div class="bulk-modal-footer">
            <button class="bulk-btn bulk-cancel-btn" id="close-btn" style="display:none;">Close</button>
          </div>
        `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const progressFill = modal.querySelector("#progress-fill");
      const progressText = modal.querySelector("#progress-text");
      const contactsList = modal.querySelector("#contacts-list");
      const closeBtn = modal.querySelector("#close-btn");

      state.selectedContactIds.forEach((id) => {
        const contactRow = document
          .querySelector(`[data-id="${id}"]`)
          ?.closest(".tabulator-row");
        let contactDisplay = "-";
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
        item.className = "bulk-contact-item";
        item.id = `contact-${id}`;
        item.innerHTML = `<span>${contactDisplay}</span><span>⏳ Pending</span>`;
        contactsList.appendChild(item);
      });

      let success = 0;
      for (let i = 0; i < state.selectedContactIds.length; i++) {
        const contactId = state.selectedContactIds[i];
        const item = document.getElementById(`contact-${contactId}`);
        item.className = "bulk-contact-item processing";
        item.querySelector("span:last-child").textContent = "🔄 Processing...";

        const result = await assignUserToContact(
          contactId,
          state.selectedUserId
        );

        if (result.success) {
          item.className = "bulk-contact-item success";
          item.querySelector("span:last-child").textContent = "✅ Assigned";
          success++;
        } else {
          item.className = "bulk-contact-item error";
          item.querySelector("span:last-child").textContent = "❌ Failed";
        }

        const percent = ((i + 1) / state.selectedContactIds.length) * 100;
        progressFill.style.width = `${percent}%`;
        progressText.textContent = `${i + 1} / ${
          state.selectedContactIds.length
        }`;
        await new Promise((r) => setTimeout(r, 400));
      }

      closeBtn.style.display = "block";
      closeBtn.addEventListener("click", () => closeModal(overlay, true));
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal(overlay, true);
      });
    }

    function injectDropdownOption(dropdown) {
      if (!dropdown) return;

      const existingOption = dropdown.querySelector("#custom-bulk-action");
      if (existingOption) return;

      const exportOption = Array.from(
        dropdown.querySelectorAll(".n-dropdown-option")
      ).find((option) => option.textContent.includes("Export"));

      if (exportOption) {
        const buttonOption = document.createElement("div");
        buttonOption.className = "n-dropdown-option";
        buttonOption.id = "custom-bulk-action";
        buttonOption.setAttribute("data-dropdown-option", "true");
        buttonOption.innerHTML = `
            <div class="n-dropdown-option-body" style="display: flex; align-items: center;">
              <div class="n-dropdown-option-body__prefix n-dropdown-option-body__prefix--show-icon" style="margin-left: -2px; margin-top: -2px;  display: flex; align-items: center;">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="#475467">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m18-10v6m-3-3h6M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </div>
              <div data-dropdown-option="true" class="n-dropdown-option-body__label" style="font-size: 14px; display: flex; align-items: center;">Bulk Assign User</div>
              <div data-dropdown-option="true" class="n-dropdown-option-body__suffix"></div>
            </div>
          `;

        buttonOption.style.marginTop = "2px";
        buttonOption.style.marginLeft = "4px";
        buttonOption.style.marginRight = "4px";
        buttonOption.style.marginBottom = "2px";
        buttonOption.style.borderRadius = "3px";

        buttonOption.addEventListener("mouseenter", (e) => {
          e.stopPropagation();
          dropdown.querySelectorAll(".n-dropdown-option").forEach((opt) => {
            if (opt !== buttonOption) {
              opt.style.backgroundColor = "";
            }
          });
          buttonOption.style.backgroundColor = "rgb(243, 243, 245)";
        });

        buttonOption.addEventListener("mouseleave", (e) => {
          e.stopPropagation();
          buttonOption.style.backgroundColor = "";
        });

        buttonOption.addEventListener("click", () => {
          handleBulkAction();
          dropdown.style.display = "none";
        });

        exportOption.parentNode.insertBefore(buttonOption, exportOption);
        console.log("✅ Dropdown option injected");
      }
    }

    function setupCheckboxListeners() {
      ["click", "change", "input"].forEach((eventType) => {
        document.addEventListener(eventType, (e) => {
          if (
            e.target.type === "checkbox" &&
            e.target.closest(".tabulator-cell.selector")
          ) {
            setTimeout(() => updateSelectedContacts(), 10);
          }
        });
      });

      const observer = new MutationObserver(() => {
        const headerCheckbox = document.querySelector(
          '.tabulator-col.selector input[type="checkbox"]'
        );
        if (headerCheckbox && !headerCheckbox.dataset.bulkListenerAttached) {
          headerCheckbox.dataset.bulkListenerAttached = "true";
          ["change", "click", "input"].forEach((eventType) => {
            headerCheckbox.addEventListener(eventType, () => {
              setTimeout(() => updateSelectedContacts(), 50);
              setTimeout(() => updateSelectedContacts(), 150);
            });
          });
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      console.log("✅ Checkbox listeners initialized");
    }

    function injectButton() {
      const observer = new MutationObserver(() => {
        const dropdown = document.getElementById(
          "quickfilters-bulk-actions-dropdown"
        );
        if (dropdown && dropdown.style.display !== "none") {
          injectDropdownOption(dropdown);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });

      setInterval(() => {
        const dropdown = document.getElementById(
          "quickfilters-bulk-actions-dropdown"
        );
        if (dropdown && dropdown.style.display !== "none") {
          injectDropdownOption(dropdown);
        }
      }, 50);

      console.log("✅ Aggressive dropdown injection active");
    }

    getLocationIdFromUrl();
    setupCheckboxListeners();
    injectButton();
    console.log("✅ Bulk assign users script initialized");
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        getLocationIdFromUrl();
        setupCheckboxListeners();
        injectButton();
      });
    }
  })();


 </script>
