<script>


 /* Buyer Agent Button */
  
    
   
   
  
    (function () {
      // ====== HELPER VARIABLES ======
      const locationId1 = getLocationIdFromUrl();
      console.log("DEBUG: 📌 Location ID For this account:", locationId1);
  
      const tokenPromise = (async () => {
        return await getAccessToken(locationId1);
      })();
  
      // ====== LOCATION ID HELPER ======
      function getLocationIdFromUrl() {
        const url = window.location.href;
        const match = url.match(/location\/([^/]+)/);
        return match ? match[1] : null;
      }
  
      // ====== GET ACCESS TOKEN HELPER ======
      async function getAccessToken(locationId1) {
        try {
          const response = await fetch(
            `https://api.konnectd.io/api/token/${locationId1}`
          );
          const data = await response.json();
  
          if (data.success) {
            return data.token;
          } else {
            console.error(
              "DEBUG: 🔴 Failed to fetch tokens",
              data.message || "token not found"
            );
            return null;
          }
        } catch (error) {
          console.error("DEBUG: 🔴 Error fetching token initially:", error);
          return null;
        }
      }
  
      // ====== INJECT BUTTON STYLES ======
      if (!document.getElementById("buyer-agent-style")) {
        const buyerAgentStyle = document.createElement("style");
        buyerAgentStyle.id = "buyer-agent-style";
        buyerAgentStyle.textContent = `
          #buyer-agent-heading-button {
            padding: 10px 18px !important;
            background: linear-gradient(135deg, #fd7e14 0%, #ffc107 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 8px rgba(253, 126, 20, 0.3) !important;
            white-space: nowrap !important;
            margin-top: 12px !important;
            width: fit-content !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          #buyer-agent-heading-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(253, 126, 20, 0.5) !important;
          }
        `;
        document.head.appendChild(buyerAgentStyle);
      }
  
      // ====== INJECT BUTTON ======
      function injectBuyerAgentButton() {
        const quickActionsDiv = document.getElementById("custom-practice-div");
        if (!quickActionsDiv) return;
  
        if (document.getElementById("buyer-agent-heading-button")) return;
  
        console.log("DEBUG: Creating Buyer Agent Summary Report button");
  
        const button = document.createElement("button");
        button.id = "buyer-agent-heading-button";
        button.innerHTML =
          '<i class="fa-solid fa-file-lines"></i> Buyer Agent Summary';
  
        button.addEventListener("click", async (e) => {
          e.preventDefault();
          console.log("📊 Buyer Agent Summary Report button clicked!");
          await StartBuyerAgentSummary();
        });
  
        quickActionsDiv.appendChild(button);
      }
  
      injectBuyerAgentButton();
  
      const observer = new MutationObserver(injectBuyerAgentButton);
      observer.observe(document.body, { childList: true, subtree: true });
  
      const intervalId = setInterval(injectBuyerAgentButton, 2000);
  
      window.addEventListener("beforeunload", () => {
        clearInterval(intervalId);
        observer.disconnect();
      });
  
      // ====== FETCH CUSTOM FIELDS ======
      async function fetchCustomFields(locationId1) {
        console.log(
          `DEBUG: 🔍 Fetching custom fields for locationId: ${locationId1}`
        );
        const newtoken = await tokenPromise;
  
        if (!newtoken) {
          console.error(
            "DEBUG: 🔴 No token available, cannot fetch custom fields."
          );
          return null;
        }
  
        try {
          const res = await fetch(
            `https://services.leadconnectorhq.com/locations/${locationId1}/customFields?model=contact`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${newtoken}`,
                Version: "2021-07-28",
              },
            }
          );
  
          if (!res.ok) {
            throw new Error(`DEBUG: 🔴 HTTP error! status: ${res.status}`);
          }
  
          const data = await res.json();
          return data;
        } catch (err) {
          console.error("DEBUG: 🔴 Error fetching custom fields:", err);
          return null;
        }
      }
  
      // ====== FETCH BUYER AGENT DETAILS ======
      async function fetchBuyerAgentDetails(
        locationId,
        buyerAgentCustomFieldId,
        page = 1,
        pageLimit = 20
      ) {
        const newtoken = await tokenPromise;
        console.log(
          `DEBUG: 🔍 Fetching buyer agents for locationId: ${locationId}`
        );
  
        if (!newtoken) {
          console.error("DEBUG: 🔴 No token available");
          return { contacts: [] };
        }
  
        try {
          const response = await fetch(
            `https://services.leadconnectorhq.com/contacts/search`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${newtoken}`,
                Version: "2021-07-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                locationId: locationId,
                page: page,
                pageLimit: pageLimit,
                filters: [
                  {
                    field: `customFields.${buyerAgentCustomFieldId}`,
                    operator: "not_eq",
                    value: "null",
                  },
                ],
                sort: [
                  {
                    field: "dateAdded",
                    direction: "desc",
                  },
                ],
              }),
            }
          );
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
  
          const data = await response.json();
          console.log("DEBUG: ✅ Successfully fetched buyer agents:", data);
          return data;
        } catch (error) {
          console.error("DEBUG: 🔴 Failed to fetch buyer agents:", error);
          return { contacts: [] };
        }
      }
  
      // ====== SHOW BUYER AGENT POPUP ======
      function showBuyerAgentSummaryPopup(contacts) {
        console.log("DEBUG: 📢 Showing Buyer Agent Summary Popup");
        return new Promise((resolve, reject) => {
          const overlay = document.createElement("div");
          overlay.className = "ba-modal-overlay";
  
          const modal = document.createElement("div");
          modal.className = "ba-modal";
  
          const header = document.createElement("div");
          header.className = "ba-modal-header";
          header.innerHTML = `
            <h2>Select Buyer Agent</h2>
            <span class="ba-close-btn">&times;</span>
          `;
  
          const body = document.createElement("div");
          body.className = "ba-modal-body";
  
          const style = document.createElement("style");
          style.textContent = `
            @keyframes ba-fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes ba-slideUp {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            .ba-modal-overlay {
              position: fixed; top: 0; left: 0; width: 100%; height: 100%;
              background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
              display: flex; justify-content: center; align-items: center;
              z-index: 10000; animation: ba-fadeIn 0.2s ease-out;
            }
            .ba-modal {
              background: linear-gradient(to bottom, #ffffff, #f8fafc);
              border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              width: 700px; max-width: 90vw; max-height: 90vh; overflow: hidden;
              animation: ba-slideUp 0.3s ease-out; border: 1px solid rgba(226, 232, 240, 0.8);
            }
            .ba-modal-header {
              padding: 28px 32px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              display: flex; justify-content: space-between; align-items: center;
              position: relative; overflow: hidden;
            }
            .ba-modal-header::before {
              content: ''; position: absolute; top: -50%; right: -10%;
              width: 200px; height: 200px;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
              border-radius: 50%;
            }
            .ba-modal-header h2 {
              margin: 0; font-size: 1.75rem; color: #ffffff; font-weight: 700;
              letter-spacing: -0.02em; display: flex; align-items: center;
              gap: 12px; position: relative; z-index: 1;
            }
            .ba-close-btn {
              font-size: 1.75rem; cursor: pointer; color: rgba(255, 255, 255, 0.9);
              background: rgba(255, 255, 255, 0.1); border: none;
              width: 36px; height: 36px; border-radius: 8px;
              display: flex; align-items: center; justify-content: center;
              transition: all 0.2s ease; position: relative; z-index: 1;
            }
            .ba-close-btn:hover {
              background: rgba(255, 255, 255, 0.2); transform: rotate(90deg);
            }
            .ba-modal-body {
              padding: 32px; overflow-y: auto; max-height: calc(90vh - 200px);
            }
            .ba-search-container {
              margin-bottom: 20px;
            }
            .ba-search-input {
              width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0;
              border-radius: 10px; font-size: 1rem; color: #1e293b;
              background: white; transition: all 0.2s ease; font-family: inherit;
            }
            .ba-search-input:focus {
              outline: none; border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            .ba-agents-list {
              display: flex; flex-direction: column; gap: 12px;
              max-height: 300px; overflow-y: auto; margin-bottom: 20px;
            }
            .ba-agent-item {
              padding: 16px; background: white; border: 2px solid #e2e8f0;
              border-radius: 10px; cursor: pointer; transition: all 0.2s ease;
            }
            .ba-agent-item:hover {
              border-color: #3b82f6; background: #f0f9ff;
            }
            .ba-agent-item.selected {
              border-color: #3b82f6; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
            }
            .ba-agent-name {
              font-weight: 600; color: #1e293b; font-size: 1rem; margin-bottom: 4px;
            }
            .ba-agent-email {
              color: #64748b; font-size: 0.9rem;
            }
            .ba-agent-info {
              display: none; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              padding: 24px; border-radius: 12px; border: 2px solid #bae6fd;
              animation: ba-slideUp 0.3s ease-out;
            }
            .ba-agent-info h3 {
              margin: 0 0 18px 0; color: #0c4a6e; font-size: 1.1rem;
              font-weight: 700; display: flex; align-items: center; gap: 8px;
            }
            .ba-agent-info h3::before {
              content: '✓'; background: #0ea5e9; color: white;
              width: 24px; height: 24px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              font-size: 0.85rem; font-weight: bold;
            }
            .ba-info-grid { display: grid; gap: 14px; }
            .ba-info-item {
              display: flex; align-items: center; gap: 12px;
              background: white; padding: 12px 16px; border-radius: 8px;
              border: 1px solid #bae6fd;
            }
            .ba-info-label {
              font-weight: 600; color: #0c4a6e; min-width: 80px; font-size: 0.9rem;
            }
            .ba-info-value {
              color: #0369a1; font-weight: 500; word-break: break-word; flex: 1;
            }
            .ba-modal-footer {
              padding: 24px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0;
              display: flex; gap: 12px; justify-content: flex-end;
            }
            .ba-btn {
              padding: 12px 28px; border: none; border-radius: 10px;
              cursor: pointer; font-size: 1rem; font-weight: 600;
              transition: all 0.2s ease; font-family: inherit; letter-spacing: -0.01em;
            }
            .ba-cancel-btn {
              background: white; color: #64748b; border: 2px solid #e2e8f0;
            }
            .ba-cancel-btn:hover {
              background: #f8fafc; border-color: #cbd5e1; color: #475569;
            }
            .ba-submit-btn {
              background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
              color: white; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
            }
            .ba-submit-btn:hover:not(:disabled) {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
            }
            .ba-submit-btn:disabled {
              background: #cbd5e1; cursor: not-allowed; box-shadow: none; opacity: 0.6;
            }
            .ba-agent-item.hidden {
              display: none;
            }
          `;
          document.head.appendChild(style);
  
          console.log("📋 Displaying agents in popup:", contacts);
  
          // Search input
          const searchContainer = document.createElement("div");
          searchContainer.className = "ba-search-container";
          searchContainer.innerHTML = `
            <input type="text" class="ba-search-input" placeholder="Search by email..." />
          `;
  
          // Agents list
          const agentsList = document.createElement("div");
          agentsList.className = "ba-agents-list";
  
          // Selected agent info
          const infoContainer = document.createElement("div");
          infoContainer.className = "ba-agent-info";
          infoContainer.style.display = "none";
          infoContainer.innerHTML = `
            <h3>Selected Agent</h3>
            <div class="ba-info-grid">
              <div class="ba-info-item">
                <span class="ba-info-label">Name:</span>
                <span id="ba-selected-name" class="ba-info-value">-</span>
              </div>
              <div class="ba-info-item">
                <span class="ba-info-label">Email:</span>
                <span id="ba-selected-email" class="ba-info-value">-</span>
              </div>
            </div>
          `;
  
          body.appendChild(searchContainer);
          body.appendChild(agentsList);
          body.appendChild(infoContainer);
  
          let selectedIndex = null;
  
          const footer = document.createElement("div");
          footer.className = "ba-modal-footer";
          footer.innerHTML = `
            <button class="ba-btn ba-cancel-btn">Cancel</button>
            <button class="ba-btn ba-submit-btn" disabled>Select Agent</button>
          `;
  
          modal.appendChild(header);
          modal.appendChild(body);
          modal.appendChild(footer);
          overlay.appendChild(modal);
          document.body.appendChild(overlay);
  
          contacts.forEach((contact, index) => {
            const agentItem = document.createElement("div");
            agentItem.className = "ba-agent-item";
            agentItem.dataset.index = index;
            agentItem.dataset.email = contact.email.toLowerCase();
            agentItem.innerHTML = `
              <div class="ba-agent-name">${
                contact.name !== "-" ? contact.name : "No Name"
              }</div>
              <div class="ba-agent-email">${contact.email}</div>
            `;
  
            agentItem.addEventListener("click", () => {
              document.querySelectorAll(".ba-agent-item").forEach((item) => {
                item.classList.remove("selected");
              });
              agentItem.classList.add("selected");
              selectedIndex = index;
  
              // Show selected agent info
              document.getElementById("ba-selected-name").textContent =
                contact.name;
              document.getElementById("ba-selected-email").textContent =
                contact.email;
              infoContainer.style.display = "block";
  
              document.querySelector(".ba-submit-btn").disabled = false;
              console.log("✅ Selected agent:", contact);
            });
  
            agentsList.appendChild(agentItem);
          });
  
          // Search functionality
          const searchInput = document.querySelector(".ba-search-input");
          searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll(".ba-agent-item").forEach((item) => {
              const email = item.dataset.email;
              if (email.includes(searchTerm)) {
                item.classList.remove("hidden");
              } else {
                item.classList.add("hidden");
              }
            });
          });
  
          function cleanup() {
            if (document.body.contains(overlay)) {
              document.body.removeChild(overlay);
            }
            if (document.head.contains(style)) {
              document.head.removeChild(style);
            }
          }
  
          document
            .querySelector(".ba-close-btn")
            .addEventListener("click", () => {
              cleanup();
              reject(new Error("User closed the modal"));
            });
  
          document
            .querySelector(".ba-cancel-btn")
            .addEventListener("click", () => {
              cleanup();
              reject(new Error("User cancelled the selection"));
            });
  
          document
            .querySelector(".ba-submit-btn")
            .addEventListener("click", () => {
              if (selectedIndex !== null) {
                const selectedContact = contacts[selectedIndex];
                console.log("🚀 Submitting selected agent:", selectedContact);
                cleanup();
                resolve(selectedContact);
              }
            });
  
          overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
              cleanup();
              reject(new Error("User clicked outside the modal"));
            }
          });
        });
      }
  
      // ====== START BUYER AGENT SUMMARY ======
      async function StartBuyerAgentSummary() {
        try {
          const AllcustomFields = await fetchCustomFields(locationId1);
          if (!AllcustomFields || !AllcustomFields.customFields) {
            console.error(
              "DEBUG: 🔴 Failed to fetch custom fields or no custom fields found."
            );
            return;
          }
  
          const buyeragentID = AllcustomFields.customFields.find(
            (field) => field.fieldKey === "contact.realtor_email"
          );
  
          console.log("Buyer Agent ID details:", buyeragentID);
          console.log("Buyer Agent ID:", buyeragentID.id);
  
          const TheBuyerAgentEmailID = buyeragentID.id;
  
          if (buyeragentID) {
            console.log("DEBUG: buyeragent Field Check");
          } else {
            console.log("Field not found.");
          }
  
          const buyeragentName = AllcustomFields.customFields.find(
            (field) => field.fieldKey === "contact.realtor_last_name"
          );
  
          console.log("Buyer Agent name details:", buyeragentName);
          console.log("Buyer Agent Name:", buyeragentName.id);
  
          const TheBuyerAgentNameID = buyeragentName.id;
  
          if (buyeragentName) {
            console.log("DEBUG: buyeragent Field Check");
          } else {
            console.log("Field not found.");
          }
  
          const page = 1;
          const pageLimit = 20;
  
          const BuyerAgentDetails = await fetchBuyerAgentDetails(
            locationId1,
            buyeragentID.id,
            page,
            pageLimit
          );
  
          if (!BuyerAgentDetails || !BuyerAgentDetails.contacts) {
            console.error(
              "DEBUG: 🔴 Failed to fetch Buyer Agent Details or no Buyer Agent Details found."
            );
          } else {
            console.log("Buyer Agent Details:", BuyerAgentDetails.contacts);
          }
  
          const BuyerAgentContacts = BuyerAgentDetails.contacts;
  
          console.log("Buyer Agent Contacts:", BuyerAgentContacts);
  
          const extractedData = BuyerAgentContacts.map((contact) => {
            const nameField = contact.customFields?.find(
              (f) => f.id === TheBuyerAgentNameID
            );
            const emailField = contact.customFields?.find(
              (f) => f.id === TheBuyerAgentEmailID
            );
  
            return {
              name: nameField?.value || "-",
              email: emailField?.value || "-",
              contactId: contact.id,
            };
          });
  
          console.log("📊 Extracted buyer agents data:", extractedData);
          console.log("📊 Total agents found:", extractedData.length);
  
          const result = await showBuyerAgentSummaryPopup(extractedData);
  
          if (result && result.email) {
            console.log("Calling Buyer Agent Summary Report API.......");
  
            const apiUrl = `https://api.konnectd.io/buyer-agent-summary-report?location_id=${encodeURIComponent(
              locationId1
            )}&buyer_agent_email=${encodeURIComponent(result.email)}`;
  
            const requestBody = {
              location_id: locationId1,
              buyer_agent_email: result.email,
            };
  
            console.log(
              "Buyer Agent Summary Report API Request Body:",
              requestBody
            );
            console.log("Buyer Agent Summary Report API URL:", apiUrl);
  
            try {
              const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
              });
  
              const data = await response.json();
              console.log("Buyer Agent Summary Report API response:", data);
            } catch (error) {
              console.error("❌ API Request Failed:", error);
            }
          }
  
          console.log("Selected agent:", result);
        } catch (error) {
          console.error("DEBUG: 🔴 Failed to fetch users:", error);
          return { id: "default_user" };
        }
      }
    })();
  
  

</script>
