<!-- Test Ref BY -->
<script>
  (async function () {
    console.log(
      "Referred By + Email + Phone – FINAL (AUTO-FILL + RE-TYPE WORKS + HYPERLINK)"
    );

    console.log("testing 123");
    setInterval(addCustomButtons, 500);
    /* --------------------------------------------------------------
     1. TOKEN & LOCATION
    -------------------------------------------------------------- */
    let locationId = null;
    let tokenPromise = null;

    function getLocationIdFromUrl() {
      const m = window.location.href.match(/location\/([^/]+)/);
      return m ? m[1] : null;
    }

    async function getAccessToken(locId) {
      try {
        const r = await fetch(`https://api.konnectd.io/api/token/${locId}`);
        const d = await r.json();
        return d.success ? d.token : null;
      } catch (e) {
        console.error("Token fetch error:", e);
        return null;
      }
    }

    (async function initToken() {
      console.log("[DEBUG] initToken started");
      locationId = getLocationIdFromUrl();
      console.log("[DEBUG] Location ID extracted:", locationId);
      if (!locationId) {
        console.error("[DEBUG] No locationId in URL");
        return console.error("No locationId in URL");
      }
      console.log("[DEBUG] Getting access token for location:", locationId);
      tokenPromise = getAccessToken(locationId);
      const token = await tokenPromise;
      if (!token) {
        console.error("[DEBUG] Failed to get token");
        return console.error("Failed to get token");
      }
      console.log(
        "[DEBUG] Token ready – locationId:",
        locationId,
        "Token length:",
        token.length
      );
      console.log("Token ready – locationId:", locationId);
    })();

    /* --------------------------------------------------------------
     2. Add Buttons on the Contacts Page
    -------------------------------------------------------------- */

    function addCustomButtons() {
      let manageSmartListsBtn = document.getElementById(
        "tb_contacts-settings-top"
      );
      if (!manageSmartListsBtn) {
        manageSmartListsBtn = document.getElementById("tb_business");
      }

      let existingDialerBtn = document.getElementById("power-dialer-btn");
      let existingFormsBtn = document.getElementById("forms-btn");
      let existingSurveysBtn = document.getElementById("surveys-btn");

      const url = window.location.href;

      // Remove if not on contacts page
      if (
        !url.includes("contacts") ||
        (!manageSmartListsBtn &&
          (existingDialerBtn || existingFormsBtn || existingSurveysBtn))
      ) {
        // console.log("Manage Smart Lists button not found. Removing existing buttons.");
        existingDialerBtn?.remove();
        existingFormsBtn?.remove();
        existingSurveysBtn?.remove();
        return;
      }

      if (manageSmartListsBtn) {
        const locationMatch = url.match(/location\/([^/]+)/);
        const locationId = locationMatch ? locationMatch[1] : null;

        if (!locationId) {
          console.log("Location ID not found. Buttons will not be created.");
          return;
        }

        function createButton(id, text, href) {
          let button = document.createElement("a");
          button.id = id;
          button.href = href;
          button.className =
            "group text-left mx-1 pb-2 md:pb-3 text-sm font-medium topmenu-navitem cursor-pointer relative px-2";
          button.style.lineHeight = "1.6rem";
          button.innerHTML = `<span class="flex items-center">${text}</span>`;
          button.addEventListener("click", function (event) {
            event.preventDefault();
            window.location.href = href;
          });
          return button;
        }

        if (!existingDialerBtn) {
          let dialerBtn = createButton(
            "power-dialer-btn",
            "Power Dialer",
            `/v2/location/${locationId}/conversations/manual_actions`
          );
          manageSmartListsBtn.insertAdjacentElement("afterend", dialerBtn);
        }

        if (!existingFormsBtn) {
          let formsBtn = createButton(
            "forms-btn",
            "Forms",
            `/v2/location/${locationId}/form-builder/main`
          );
          document
            .getElementById("power-dialer-btn")
            ?.insertAdjacentElement("afterend", formsBtn);
        }

        if (!existingSurveysBtn) {
          let surveysBtn = createButton(
            "surveys-btn",
            "Surveys",
            `/v2/location/${locationId}/survey-builder/main`
          );
          document
            .getElementById("forms-btn")
            ?.insertAdjacentElement("afterend", surveysBtn);
        }
      }
    }

    /* --------------------------------------------------------------
     2. SEARCH API
    -------------------------------------------------------------- */
    const MIN_CHARS = 3;
    const DEBOUNCE_MS = 400;

    async function searchContacts(query) {
      console.log("[DEBUG] searchContacts called with query:", query);
      if (!tokenPromise || !locationId) {
        console.log("[DEBUG] Missing tokenPromise or locationId:", {
          tokenPromise: !!tokenPromise,
          locationId,
        });
        return [];
      }

      console.log("[DEBUG] Getting token...");
      const token = await tokenPromise;
      if (!token) {
        console.log("[DEBUG] No token available");
        return [];
      }
      console.log("[DEBUG] Token obtained successfully");

      // const filters = [
      //   {
      //     group: "OR",
      //     filters: [
      //       { field: "firstNameLowerCase", operator: "contains", value: query },
      //       { field: "lastNameLowerCase", operator: "contains", value: query },
      //       { field: "email", operator: "contains", value: query },
      //       { field: "phone", operator: "contains", value: query },
      //     ],
      //   },
      // ];

      const requestBody = {
        locationId,
        page: 1,
        pageLimit: 25,
        // filters,
        query: query,
        sort: [{ field: "dateAdded", direction: "desc" }],
      };

      console.log("[DEBUG] API request details:", {
        url: "https://services.leadconnectorhq.com/contacts/search",
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.substring(0, 10)}...`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      try {
        console.log("[DEBUG] Making API request...");
        const r = await fetch(
          "https://services.leadconnectorhq.com/contacts/search",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        console.log("[DEBUG] API response status:", r.status, r.statusText);
        if (!r.ok) {
          console.error("[DEBUG] API request failed:", r.status, r.statusText);
          throw new Error(`HTTP ${r.status}`);
        }

        console.log("[DEBUG] Parsing response...");
        const data = await r.json();
        console.log("[DEBUG] Search API response:", data);
        const contacts = data.contacts || [];
        console.log("[DEBUG] Extracted contacts:", contacts.length, "contacts");
        return contacts;
      } catch (e) {
        console.error("[DEBUG] Search error:", e);
        return [];
      }
    }

    /* --------------------------------------------------------------
     3. GLOBAL DROPDOWN
    -------------------------------------------------------------- */
    const dropdown = document.createElement("div");
    dropdown.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 8px 8px;
      max-height: 220px;
      overflow-y: auto;
      z-index: 9999;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      font-size: 14px;
    `;

    const loadingItem = document.createElement("div");
    loadingItem.textContent = "Searching...";
    loadingItem.style.cssText =
      "padding:12px 16px; color:#64748b; font-style:italic;";
    dropdown.appendChild(loadingItem);

    const noResultsItem = document.createElement("div");
    noResultsItem.textContent = "No contacts found";
    noResultsItem.style.cssText = "padding:12px 16px; color:#94a3b8;";
    dropdown.appendChild(noResultsItem);

    document.body.appendChild(dropdown);

    const showDropdown = () => {
      console.log("[DEBUG] showDropdown called");
      dropdown.style.display = "block";
      console.log("[DEBUG] Dropdown display set to block");
    };
    const hideDropdown = () => {
      console.log("[DEBUG] hideDropdown called");
      dropdown.style.display = "none";
      console.log("[DEBUG] Dropdown display set to none");
    };

    const clearResults = () => {
      console.log(
        "[DEBUG] clearResults called, current children:",
        dropdown.children.length
      );
      while (dropdown.children.length > 2)
        dropdown.removeChild(dropdown.lastChild);
      loadingItem.style.display = "none";
      noResultsItem.style.display = "none";
      console.log(
        "[DEBUG] Results cleared, remaining children:",
        dropdown.children.length
      );
    };

    const showLoading = () => {
      console.log("[DEBUG] showLoading called");
      clearResults();
      loadingItem.style.display = "block";
      showDropdown();
      console.log("[DEBUG] Loading state shown");
    };

    /* --------------------------------------------------------------
  3B. TOOLTIP FOR HYPERLINK WITH ARROW
  -------------------------------------------------------------- */
    const tooltip = document.createElement("div");
    tooltip.style.cssText = `
  position: absolute;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  z-index: 10000;
  display: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  font-size: 14px;
  min-width: 250px;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  `;

    // Add arrow element
    const tooltipArrow = document.createElement("div");
    tooltipArrow.style.cssText = `
  position: absolute;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid white;
  top: -6px;
  left: 20px;
  filter: drop-shadow(0 -1px 1px rgba(0,0,0,0.1));
  `;
    tooltip.appendChild(tooltipArrow);

    document.body.appendChild(tooltip);

    const showTooltip = (contact, linkElement) => {
      const name =
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
        "No Name";
      const email = contact.email || "—";
      const phone = contact.phone || "—";

      tooltip.innerHTML = `
    <div style="position: relative;">
      <div style="font-weight:600; color:#111827; margin-bottom:8px;">${name}</div>
      <div style="font-size:13px; color:#64748b; margin-bottom:4px;">
        <strong>Email:</strong> ${email}
      </div>
      <div style="font-size:13px; color:#64748b;">
        <strong>Phone:</strong> ${phone}
      </div>
    </div>
  `;

      // Re-add the arrow after setting innerHTML
      tooltip.appendChild(tooltipArrow);

      const rect = linkElement.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
      tooltip.style.left = `${rect.left + window.scrollX}px`;
      tooltip.style.display = "block";
    };

    const hideTooltip = () => {
      tooltip.style.display = "none";
    };

    /* --------------------------------------------------------------
     4. HELPERS – FIND INPUT + UPDATE DISPLAY
    -------------------------------------------------------------- */
    function getFieldInput(labelText) {
      const label = Array.from(
        document.querySelectorAll("span.hr-form-item-label__text")
      ).find((l) => l.textContent.trim() === labelText);
      if (!label) return null;

      const formItem = label.closest(".hr-form-item");
      if (!formItem) return null;

      // wait for the editable input to appear but don't wait forever
      const timeoutMs = 2000;
      return new Promise((resolve) => {
        const start = Date.now();
        const tryFind = () => {
          const input = formItem.querySelector(
            'input[type="text"], input[type="email"], input[type="tel"], input:not([type])'
          );
          if (input) return resolve(input);
          if (Date.now() - start >= timeoutMs) return resolve(null);
          setTimeout(tryFind, 30);
        };
        tryFind();
      });
    }

    function getFormItem(labelText) {
      const label = Array.from(
        document.querySelectorAll("span.hr-form-item-label__text")
      ).find((l) => l.textContent.trim() === labelText);
      return label ? label.closest(".hr-form-item") : null;
    }

    // install a robust sync watcher for a formItem: keeps visible <p> and hidden input in sync
    function installSyncWatcher(formItem) {
      if (!formItem || formItem.dataset.syncAttached) return;
      formItem.dataset.syncAttached = "1";

      const p = formItem.querySelector("p.hr-p");
      const hidden = formItem.querySelector(
        'input[type="text"], input[type="email"], input[type="tel"], input:not([type])'
      );
      if (!hidden || !p) return;

      // helper to apply value to hidden input (native setter + events)
      const applyToHidden = (value) => {
        setNativeValue(hidden, value || "");
        hidden.dispatchEvent(
          new InputEvent("input", { bubbles: true, composed: true })
        );
        hidden.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
      };

      // MutationObserver: when visible <p> text changes, sync to hidden input
      const mo = new MutationObserver(() => {
        const visible = (p.textContent || "").trim();
        if ((hidden.value || "") !== visible) applyToHidden(visible);
      });
      mo.observe(p, { childList: true, subtree: true, characterData: true });

      // Prevent clearing on mousedown/click of the visible <p>
      const onMouseDown = (ev) => {
        // stop the framework's default placeholder-to-edit logic briefly,
        // set the hidden value and focus the hidden input so the UI remains consistent
        ev.preventDefault();
        const visible = (p.textContent || "").trim();
        applyToHidden(visible);
        try {
          hidden.focus();
          setTimeout(() => hidden.blur(), 40);
        } catch (e) {}
      };
      p.addEventListener("mousedown", onMouseDown);

      // Ensure value present right before form submit
      const formAncestor = formItem.closest("form");
      const onSubmit = () => {
        const visible = (p.textContent || "").trim();
        applyToHidden(visible);
      };
      if (formAncestor) formAncestor.addEventListener("submit", onSubmit, true);

      // Safety interval to reapply if external code clears the input
      let attempts = 0;
      const maxAttempts = 6;
      const tick = setInterval(() => {
        const visible = (p.textContent || "").trim();
        if ((hidden.value || "").trim() === "" && visible)
          applyToHidden(visible);
        attempts++;
        if (attempts >= maxAttempts) {
          clearInterval(tick);
        }
      }, 200);
    }

    function updateDisplayText(labelText, value) {
      const label = Array.from(
        document.querySelectorAll("span.hr-form-item-label__text")
      ).find((l) => l.textContent.trim() === labelText);
      if (!label) return console.warn(`Label not found: ${labelText}`);

      const formItem = label.closest(".hr-form-item");
      if (!formItem) return;

      const p = formItem.querySelector("p.hr-p");
      const container = formItem.querySelector(".hr-input__inline-text");
      const hiddenInput = formItem.querySelector(
        'input[type="text"], input[type="email"], input[type="tel"], input:not([type])'
      );

      if (!p || !container)
        return console.warn(`Elements missing for ${labelText}`);

      // 1. Update <p> text
      p.textContent = value || `Enter ${labelText.toLowerCase()}`;
      p.style.color = value ? "#111827" : "#6b7280";

      // 1b. Update visible inline container text (some UI uses this element)
      container.textContent = value || "";

      // 2. Toggle classes
      const hasValue = !!value;
      p.classList.toggle("hr-input__text-content--active", hasValue);
      container.classList.toggle("has-value", hasValue);

      // 3. Force hidden input sync (redundant but safe)
      if (hiddenInput) {
        hiddenInput.value = value || "";
        // Use InputEvent + composed to better mimic real typing for frameworks
        hiddenInput.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            composed: true,
            data: value,
          })
        );
        hiddenInput.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
        // Some frameworks listen to blur/focusout to commit; fire blur as well
        hiddenInput.dispatchEvent(
          new FocusEvent("blur", { bubbles: true, composed: true })
        );
      }

      // 4. FORCE REPAINT
      container.style.display = "none";
      void container.offsetHeight;
      container.style.display = "";
    }

    // helper: set value via native setter so frameworks (React/Vue) pick it up
    function setNativeValue(el, value) {
      if (!el) return;
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el),
        "value"
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, value);
      } else {
        el.value = value;
      }
    }

    // Watchdog: ensure auto-filled value survives framework focus/clear behavior
    function observeAutoFilledInput(input, value) {
      if (!input) return;
      let attempts = 0;
      const MAX_ATTEMPTS = 6;

      const restore = () => {
        setNativeValue(input, value || "");
        input.dispatchEvent(
          new InputEvent("input", { bubbles: true, composed: true })
        );
        input.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
      };

      // Restore immediately a few times after focus to outrun framework clears
      const onFocus = () => {
        // schedule a couple of microtask/timeouts to override later clears
        restore();
        setTimeout(restore, 10);
        setTimeout(restore, 60);
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          input.removeEventListener("focus", onFocus);
          clearInterval(interval);
          delete input.dataset.autoFilled;
        }
      };
      input.addEventListener("focus", onFocus);

      // MutationObserver to detect external clears and restore
      const mo = new MutationObserver(() => {
        if (input.dataset.autoFilled && (input.value || "").trim() === "") {
          restore();
        }
      });
      mo.observe(input, { attributes: true, attributeFilter: ["value"] });

      // Fallback interval in case framework modifies DOM in non-observable ways
      const interval = setInterval(() => {
        if (input.dataset.autoFilled && (input.value || "").trim() === "") {
          restore();
        }
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          input.removeEventListener("focus", onFocus);
          mo.disconnect();
          clearInterval(interval);
          delete input.dataset.autoFilled;
        }
      }, 200);
    }

    async function fillReferralFields(contact) {
      const email = contact.email || "";
      const phone = contact.phone || "";

      // helper: simulate a real user click (mousedown -> mouseup -> click)
      function simulateUserClick(el) {
        if (!el) return;
        const opts = { bubbles: true, cancelable: true, composed: true };
        el.dispatchEvent(new MouseEvent("mousedown", opts));
        el.dispatchEvent(new MouseEvent("mouseup", opts));
        el.dispatchEvent(new MouseEvent("click", opts));
      }

      // helper: ensure framework has created an editable input for a formItem
      async function ensureEditableInput(formItem, placeholderP) {
        // if input already exists, return quickly
        if (formItem.querySelector('input[type="text"], input:not([type])'))
          return;
        // simulate click to trigger framework's edit mode
        simulateUserClick(placeholderP);
        // wait briefly for framework to insert input (retry a few times)
        for (let i = 0; i < 10; i++) {
          if (formItem.querySelector('input[type="text"], input:not([type])'))
            return;
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      // === EMAIL ===
      // try to trigger the framework to create the input if needed
      const emailFormItem = getFormItem("Referral Source Email");
      const emailP =
        emailFormItem && emailFormItem.querySelector("p.hr-p")
          ? emailFormItem.querySelector("p.hr-p")
          : null;
      if (emailFormItem && emailP)
        await ensureEditableInput(emailFormItem, emailP);

      if (!email) {
        // clear previous value (avoid awaiting a never-resolving input)
        clearField("Referral Source Email");
        // still let display update to placeholder
        updateDisplayText("Referral Source Email", "");
      } else {
        const emailInput = await getFieldInput("Referral Source Email");
        if (emailInput) {
          emailInput.dataset.autoFilled = "1";
          setNativeValue(emailInput, email);
          emailInput.dispatchEvent(
            new InputEvent("input", { bubbles: true, composed: true })
          );
          emailInput.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
          );
          observeAutoFilledInput(emailInput, email);

          // install sync watcher on the email formItem so visible <p> <-> hidden input stay synced
          const emailFormItem2 = emailInput.closest(".hr-form-item");
          installSyncWatcher(emailFormItem2);

          try {
            // focus/blur to make framework register the change
            emailInput.focus();
            await new Promise((r) => setTimeout(r, 30));
            emailInput.blur();
          } catch (e) {}
        }
        updateDisplayText("Referral Source Email", email);
      }

      // === PHONE ===
      // trigger phone input creation if necessary
      const phoneFormItem = getFormItem("Referral Source Phone");
      const phoneP =
        phoneFormItem && phoneFormItem.querySelector("p.hr-p")
          ? phoneFormItem.querySelector("p.hr-p")
          : null;
      if (phoneFormItem && phoneP)
        await ensureEditableInput(phoneFormItem, phoneP);

      if (!phone) {
        // Ensure editable input exists (framework may need activation)
        if (phoneFormItem && phoneP)
          await ensureEditableInput(phoneFormItem, phoneP);

        // Try to get the actual editable input; if present, set it to empty and dispatch events
        const phoneInputEmpty = await getFieldInput("Referral Source Phone");
        if (phoneInputEmpty) {
          // set to empty string via native setter so framework picks it up
          setNativeValue(phoneInputEmpty, "");
          phoneInputEmpty.dispatchEvent(
            new InputEvent("input", { bubbles: true, composed: true })
          );
          phoneInputEmpty.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
          );
          // install sync watcher so visible <p> and hidden input stay in sync
          const phoneFormItem2 = phoneInputEmpty.closest(".hr-form-item");
          installSyncWatcher(phoneFormItem2);

          // focus/blur to force framework commit (same sequence as when we fill a value)
          try {
            phoneInputEmpty.focus();
            await new Promise((r) => setTimeout(r, 30));
            phoneInputEmpty.blur();
          } catch (e) {}

          // remove any autoFilled marker
          delete phoneInputEmpty.dataset.autoFilled;
        } else {
          // Fallback: update visible UI and clear any hidden inputs if present
          clearField("Referral Source Phone");
        }
        updateDisplayText("Referral Source Phone", "");
      } else {
        const phoneInput = await getFieldInput("Referral Source Phone");
        if (phoneInput) {
          phoneInput.dataset.autoFilled = "1";
          setNativeValue(phoneInput, phone);
          phoneInput.dispatchEvent(
            new InputEvent("input", { bubbles: true, composed: true })
          );
          phoneInput.dispatchEvent(
            new Event("change", { bubbles: true, composed: true })
          );
          observeAutoFilledInput(phoneInput, phone);

          // install sync watcher on the phone formItem
          const phoneFormItem2 = phoneInput.closest(".hr-form-item");
          installSyncWatcher(phoneFormItem2);

          try {
            phoneInput.focus();
            await new Promise((r) => setTimeout(r, 30));
            phoneInput.blur();
          } catch (e) {}
        }
        updateDisplayText("Referral Source Phone", phone);
      }
    }

    /* --------------------------------------------------------------
  5B. CONVERT "REFERRED BY" TO HYPERLINK WITH ICON (NON-EDIT MODE)
  -------------------------------------------------------------- */
    function convertToHyperlink(formItem, contact) {
      if (!formItem || !contact || !contact.id) return;
      console.log("[DEBUG] convertToHyperlink called", contact);

      const input = formItem.querySelector("input.hr-input__input-el");
      if (!input) {
        console.log("[DEBUG] No input found for hyperlink");
        return;
      }

      // Check if already has hyperlink
      if (input.style.display === "none") {
        console.log("[DEBUG] Hyperlink already exists");
        return;
      }

      const fullName =
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
        "No Name";
      const contactUrl = `https://app.konnectd.io/v2/location/${locationId}/contacts/detail/${contact.id}`;

      // Create hyperlink that replaces the input visually
      const linkElement = document.createElement("a");
      linkElement.href = contactUrl;
      linkElement.target = "_blank";
      linkElement.rel = "noopener noreferrer";
      linkElement.textContent = fullName + " ↗";
      linkElement.dataset.contactLink = "true";
      linkElement.style.cssText = `
        color: #3b82f6;
        text-decoration: none;
        cursor: pointer;
        display: block;
        padding: 0px;
        font-size: inherit;
        border: 1px solid transparent;
        border-radius: 6px;
        background: white;
        width: fit-content;
      `;

      // Hide input and insert link
      input.style.display = "none";
      input.parentNode.insertBefore(linkElement, input);

      // Add click handler to input for edit mode when visible
      if (!input.dataset.editClickHandler) {
        input.addEventListener("click", () => {
          if (input.style.display !== "none") {
            input.focus();
          }
        });
        input.dataset.editClickHandler = "true";
      }

      // Hover effects
      linkElement.addEventListener("mouseenter", () => {
        linkElement.style.textDecoration = "underline";
        // linkElement.style.borderColor = "#3b82f6";
        showTooltip(contact, linkElement);
      });
      linkElement.addEventListener("mouseleave", () => {
        linkElement.style.textDecoration = "none";
        // linkElement.style.borderColor = "transparent";
        hideTooltip();
      });

      // Add click handler to form item for edit mode (click outside hyperlink)
      formItem.addEventListener("click", (e) => {
        // Only enter edit mode if click is not on the hyperlink itself
        if (!e.target.closest("a[data-contact-link]")) {
          removeHyperlink(formItem);
          input.focus();
        }
      });

      // Right-click or double-click to edit
      linkElement.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        removeHyperlink(formItem);
        input.focus();
      });

      linkElement.addEventListener("dblclick", (e) => {
        e.preventDefault();
        removeHyperlink(formItem);
        input.focus();
      });

      // Store contact data
      formItem.dataset.selectedContactId = contact.id;
      formItem.dataset.selectedContactData = JSON.stringify(contact);

      console.log("[DEBUG] Hyperlink created successfully");
    }
    // NEW FUNCTION: Restore hyperlinks on page load/return
    function restoreHyperlinks() {
      document
        .querySelectorAll(".hr-form-item[data-selected-contact-id]")
        .forEach((formItem) => {
          const contactId = formItem.dataset.selectedContactId;
          const contactData = formItem.dataset.selectedContactData;

          if (contactId && contactData) {
            try {
              const contact = JSON.parse(contactData);
              const p = formItem.querySelector("p.hr-p");

              // Only restore if not already a hyperlink and has text content
              if (
                p &&
                !p.querySelector("a[data-contact-link]") &&
                p.textContent.trim()
              ) {
                convertToHyperlink(formItem, contact);
              }
            } catch (e) {
              console.error("Error restoring hyperlink:", e);
            }
          }
        });
    }
    function removeHyperlink(formItem) {
      if (!formItem) return;
      console.log("[DEBUG] removeHyperlink called");

      const input = formItem.querySelector("input.hr-input__input-el");
      const linkElement = formItem.querySelector("a[data-contact-link]");

      if (linkElement) {
        console.log("[DEBUG] Removing hyperlink element");
        linkElement.remove();
      }

      if (input) {
        console.log("[DEBUG] Showing input again");
        input.style.display = "";
      }

      hideTooltip();
    }

    /* --------------------------------------------------------------
     5C. REFERRED BY HYPERLINK - GET CONTACT ID FROM URL AND CUSTOM FIELDS
    -------------------------------------------------------------- */
    // Extract contact ID from URL
    function extractContactIdFromUrl(url) {
      const match = url.match(/\/contacts\/detail\/([^/?#]+)/);
      return match ? match[1] : null;
    }

    // Fetch custom fields for location
    async function fetchCustomFields(locationId1) {
      const newtoken = await tokenPromise;
      if (!newtoken) {
        console.error("No token available");
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

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data;
      } catch (err) {
        console.error("Error fetching custom fields:", err);
        return null;
      }
    }

    // Get contact by ID
    async function getContactById(contactId) {
      if (!tokenPromise || !locationId) return null;
      const token = await tokenPromise;
      if (!token) return null;

      try {
        const r = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Version: "2021-07-28",
              "Content-Type": "application/json",
            },
          }
        );

        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        return data.contact || data;
      } catch (e) {
        console.error("Error fetching contact by ID:", e);
        return null;
      }
    }

    // Process referred_by and create hyperlink
    async function processReferredByAndCreateHyperlink(formItem) {
      if (!formItem || !formItem.dataset.referredByAttached) return;
      console.log("[DEBUG] processReferredByAndCreateHyperlink called");

      const input = formItem.querySelector("input.hr-input__input-el");
      if (!input) {
        console.log("[DEBUG] No input found for processing");
        return;
      }

      const currentText = (input.value || "").trim();
      console.log("[DEBUG] Current input value:", currentText);

      if (
        !currentText ||
        currentText === "--" ||
        currentText.toLowerCase().includes("enter")
      ) {
        console.log("[DEBUG] No valid text to process");
        return;
      }

      // Skip if already has hyperlink
      const linkElement = formItem.querySelector("a[data-contact-link]");
      if (linkElement) {
        console.log("[DEBUG] Hyperlink already exists");
        return;
      }

      // Don't process if input is focused (in edit mode)
      if (input === document.activeElement) {
        console.log("[DEBUG] Input is focused, skipping");
        return;
      }

      console.log("[DEBUG] Processing referred_by for:", currentText);

      // Search for contact
      let searchResults = await searchContacts(currentText);
      console.log("[DEBUG] Search results:", searchResults);

      if (!searchResults || searchResults.length === 0) {
        console.log("[DEBUG] No contacts found for:", currentText);
        return;
      }

      // Find exact match or use first result
      let matchingContact = searchResults.find((contact) => {
        const fullName = `${contact.firstName || ""} ${
          contact.lastName || ""
        }`.trim();
        return fullName.toLowerCase() === currentText.toLowerCase();
      });

      if (!matchingContact) {
        console.log("[DEBUG] No exact match, using first result");
        matchingContact = searchResults[0];
      }

      if (matchingContact && matchingContact.id) {
        console.log("[DEBUG] Creating hyperlink for contact:", matchingContact);
        convertToHyperlink(formItem, matchingContact);
      }
    }

    // Helper function to create hyperlink for referred by contact
    async function createHyperlinkForReferredBy(
      formItem,
      p,
      contactName,
      contactId,
      locId,
      contactData
    ) {
      const baseUrl = location.href.includes("app.gohighlevel.com")
        ? "https://app.gohighlevel.com"
        : "https://app.konnectd.io";
      const contactDetailUrl = `${baseUrl}/v2/location/${locId}/contacts/detail/${contactId}`;

      // Create hyperlink container
      const linkContainer = document.createElement("span");
      linkContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
      `;

      // Create hyperlink
      const link = document.createElement("a");
      link.href = contactDetailUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = contactName;
      link.dataset.contactLink = "true";
      link.style.cssText = `
        color: #3b82f6;
        text-decoration: none;
        cursor: pointer;
      `;

      // Create hyperlink icon
      const linkIcon = document.createElement("span");
      linkIcon.innerHTML = `↗`;
      linkIcon.style.cssText = `
        font-size: 14px;
        color: #3b82f6;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
      `;

      linkContainer.appendChild(link);
      linkContainer.appendChild(linkIcon);

      linkContainer.addEventListener("mouseenter", () => {
        link.style.textDecoration = "underline";
        if (contactData) {
          showTooltip(contactData, linkContainer);
        }
      });
      linkContainer.addEventListener("mouseleave", () => {
        link.style.textDecoration = "none";
        hideTooltip();
      });

      // Replace text content with hyperlink container
      p.innerHTML = "";
      p.appendChild(linkContainer);
      p.style.color = "#111827";

      // Store contact data for persistence
      formItem.dataset.referredContactId = contactId;
      formItem.dataset.referredContactName = contactName;

      console.log("Hyperlink created to:", contactDetailUrl);
    }

    // Observer for <p> tag in Referred By field - More aggressive
    function observeReferredByP(formItem) {
      if (!formItem) return;

      const p = formItem.querySelector("p.hr-p");
      if (!p) return;

      // Check if observer already attached
      if (p.dataset.referredByObserverAttached) return;
      p.dataset.referredByObserverAttached = "true";

      let debounceTimer = null;
      let checkInterval = null;

      // Function to check and create hyperlink - more aggressive
      function checkAndCreate() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          processReferredByAndCreateHyperlink(formItem);
        }, 300); // Reduced debounce for faster response
      }

      // MutationObserver to watch for text changes - aggressive settings
      const pObserver = new MutationObserver(() => {
        checkAndCreate();
      });

      pObserver.observe(p, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: false,
        attributeOldValue: false,
      });

      // Also observe parent formItem for structural changes
      const formItemObserver = new MutationObserver(() => {
        // Re-check if p tag still exists and recreate observer if needed
        const newP = formItem.querySelector("p.hr-p");
        if (newP && newP !== p) {
          // P tag was replaced, re-attach observer
          if (newP.dataset.referredByObserverAttached !== "true") {
            observeReferredByP(formItem);
          }
        }
        checkAndCreate();
      });

      formItemObserver.observe(formItem, {
        childList: true,
        subtree: true,
      });

      // Check immediately if text already exists
      setTimeout(() => {
        checkAndCreate();
      }, 100);

      // Aggressive polling to catch any missed changes
      checkInterval = setInterval(() => {
        const currentText = (p.textContent || "").trim();
        if (
          currentText &&
          !currentText.toLowerCase().includes("enter") &&
          currentText !== "—" &&
          !p.querySelector("a[data-contact-link]")
        ) {
          checkAndCreate();
        }
      }, 2000); // Check every 2 seconds

      formItem._referredByPObserver = pObserver;
      formItem._referredByFormItemObserver = formItemObserver;
      formItem._referredByCheckInterval = checkInterval;

      // Cleanup function
      const cleanup = () => {
        if (checkInterval) clearInterval(checkInterval);
        if (pObserver) pObserver.disconnect();
        if (formItemObserver) formItemObserver.disconnect();
      };

      // Store cleanup function
      formItem._referredByCleanup = cleanup;
    }

    // Function to restore all Referred By hyperlinks on URL change/refresh - More aggressive
    function restoreAllReferredByHyperlinks() {
      console.log("Restoring Referred By hyperlinks - aggressive mode");

      // Find all Referred By fields - search by label text to catch all cases
      document
        .querySelectorAll("span.hr-form-item-label__text")
        .forEach((label) => {
          const text = label.textContent.trim();
          if (text !== "Referred By") return;

          const formItem = label.closest(".hr-form-item");
          if (!formItem) return;

          const p = formItem.querySelector("p.hr-p");
          if (!p) return;

          const currentText = (p.textContent || "").trim();

          // Skip if no text or placeholder
          if (
            !currentText ||
            currentText.toLowerCase().includes("enter") ||
            currentText === "—"
          ) {
            return;
          }

          // Skip if already has hyperlink (but check if it's valid)
          if (p.querySelector("a[data-contact-link]")) {
            // Verify hyperlink is still valid
            const link = p.querySelector("a[data-contact-link]");
            if (link && link.href && link.href.includes("/contacts/detail/")) {
              return; // Valid hyperlink exists
            }
            // Invalid hyperlink, remove it and recreate
            p.innerHTML = currentText;
          }

          // Don't process if in edit mode
          const input = formItem.querySelector(
            'input[type="text"], input:not([type])'
          );
          if (
            input &&
            (input === document.activeElement || input.offsetParent !== null)
          ) {
            return;
          }

          // Ensure formItem is marked as attached
          formItem.dataset.referredByAttached = "true";

          // Restore hyperlink
          processReferredByAndCreateHyperlink(formItem);
        });
    }

    /* --------------------------------------------------------------
     6. RENDER DROPDOWN
    -------------------------------------------------------------- */
    const renderResults = (contacts, input) => {
      console.log(
        "[DEBUG] renderResults called with:",
        contacts.length,
        "contacts"
      );
      clearResults();
      if (contacts.length === 0) {
        console.log("[DEBUG] No contacts found, showing no results message");
        noResultsItem.style.display = "block";
        showDropdown();
        return;
      }

      console.log("[DEBUG] Rendering", contacts.length, "contact results");
      contacts.forEach((contact, index) => {
        console.log(`[DEBUG] Rendering contact ${index + 1}:`, contact);
        const item = document.createElement("div");
        item.style.cssText = `
          padding:12px 16px;
          cursor:pointer;
          border-bottom:1px solid #f1f5f9;
          transition:background 0.2s;
        `;

        const name =
          `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
          "No Name";
        const email = contact.email || "—";
        const phone = contact.phone || "—";

        item.innerHTML = `
          <div style="font-weight:500; color:#111827;">${name}</div>
          <div style="font-size:12px; color:#64748b;">${email} • ${phone}</div>
        `;

        item.addEventListener("mousedown", async (e) => {
          console.log("[DEBUG] Contact item clicked:", contact);
          e.preventDefault();

          const fullName = `${contact.firstName || ""} ${
            contact.lastName || ""
          }`.trim();

          // 1. Referred By
          input.value = fullName;
          input.dataset.fromDropdown = "true";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          console.log("[DEBUG] Input value set to:", fullName);

          // Store selected contact on the form item
          const formItem = input.closest(".hr-form-item");
          if (formItem) {
            formItem.dataset.selectedContactId = contact.id;
            formItem.dataset.selectedContactData = JSON.stringify(contact);
            console.log("[DEBUG] Contact data stored on form item");
          }

          // 2. HIDE DROPDOWN FIRST
          hideDropdown();

          // 3. FILL EMAIL & PHONE — BLOCKING FOR DISPLAY
          console.log("[DEBUG] Filling referral fields...");
          await fillReferralFields(contact);

          // 4. Convert to hyperlink after blur
          setTimeout(() => {
            if (formItem) {
              console.log("[DEBUG] Converting to hyperlink...");
              convertToHyperlink(formItem, contact);
            }
          }, 100);

          // 5. Refocus
          setTimeout(() => {
            console.log("[DEBUG] Refocusing input");
            input.focus();
          }, 50);
        });

        item.addEventListener(
          "mouseenter",
          () => (item.style.backgroundColor = "#f8fafc")
        );
        item.addEventListener(
          "mouseleave",
          () => (item.style.backgroundColor = "")
        );

        dropdown.appendChild(item);
      });

      showDropdown();
      console.log("[DEBUG] All contacts rendered and dropdown shown");
    };

    /* --------------------------------------------------------------
     7. PER-INPUT STATE
    -------------------------------------------------------------- */
    const inputState = new WeakMap();

    function getState(input) {
      if (!inputState.has(input)) {
        inputState.set(input, {
          debounceTimer: null,
          lastQuery: "",
          lastResults: [],
        });
      }
      return inputState.get(input);
    }

    /* --------------------------------------------------------------
     8. ATTACH TO INPUT
    -------------------------------------------------------------- */
    function attachToInput(input, formItem) {
      console.log("[DEBUG] attachToInput called with:", input, formItem);
      const state = getState(input);
      console.log("[DEBUG] Input state:", state);

      const updatePosition = () => {
        const rect = input.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom + window.scrollY}px`;
        dropdown.style.left = `${rect.left + window.scrollX}px`;
        dropdown.style.width = `${rect.width}px`;
        console.log("[DEBUG] Dropdown position updated:", {
          top: dropdown.style.top,
          left: dropdown.style.left,
          width: dropdown.style.width,
        });
      };
      updatePosition();
      window.addEventListener("resize", updatePosition);

      dropdown.parentInput = input;
      console.log("[DEBUG] Dropdown parent input set:", input);

      input.addEventListener("input", () => {
        console.log("[DEBUG] Input event triggered");
        if (input.dataset.fromDropdown === "true") {
          console.log("[DEBUG] Input from dropdown, skipping search");
          delete input.dataset.fromDropdown;
          return;
        }

        const val = input.value.trim();
        console.log("[DEBUG] User typed →", val, "Length:", val.length);

        clearTimeout(state.debounceTimer);
        hideDropdown();
        console.log("[DEBUG] Dropdown hidden, debounce timer cleared");

        if (val.length < MIN_CHARS) {
          console.log(
            `[DEBUG] Input too short (${val.length} < ${MIN_CHARS}), not searching`
          );
          return;
        }

        console.log(`[DEBUG] Starting search with debounce (${DEBOUNCE_MS}ms)`);
        state.debounceTimer = setTimeout(async () => {
          console.log(
            "[DEBUG] Debounce timer fired, starting search for:",
            val
          );
          state.lastQuery = val;
          showLoading();
          console.log("[DEBUG] Loading indicator shown");

          try {
            const contacts = await searchContacts(val);
            console.log("[DEBUG] Search completed, results:", contacts);
            state.lastResults = contacts;
            renderResults(contacts, input);
            console.log("[DEBUG] Results rendered");
          } catch (error) {
            console.error("[DEBUG] Search error:", error);
            hideDropdown();
          }
        }, DEBOUNCE_MS);
        console.log("[DEBUG] Debounce timer set with ID:", state.debounceTimer);
      });

      input.addEventListener("focus", () => {
        console.log("[DEBUG] Input focused");
        updatePosition();
        // Remove hyperlink when entering edit mode
        removeHyperlink(formItem);
        console.log("[DEBUG] Hyperlink removed on focus");

        if (
          input.value.trim().length >= MIN_CHARS &&
          state.lastResults.length > 0
        ) {
          console.log("[DEBUG] Showing previous results on focus");
          renderResults(state.lastResults, input);
        } else {
          console.log("[DEBUG] No previous results to show on focus");
        }
      });

      input.addEventListener("blur", () => {
        console.log("[DEBUG] Input blurred");
        setTimeout(() => {
          hideDropdown();
          console.log("[DEBUG] Dropdown hidden on blur");

          // Only restore hyperlink if field has value (not intentionally cleared)
          const currentValue = input.value.trim();
          console.log("[DEBUG] Current value on blur:", currentValue);
          if (currentValue) {
            // Restore hyperlink after blur - process referred_by from URL
            setTimeout(() => {
              console.log(
                "[DEBUG] Processing referred by hyperlink after blur"
              );
              processReferredByAndCreateHyperlink(formItem);
            }, 200);

            // Also restore if contact was selected (legacy support)
            const contactId = formItem.dataset.selectedContactId;
            const contactData = formItem.dataset.selectedContactData;
            if (contactId && contactData) {
              console.log(
                "[DEBUG] Restoring hyperlink from stored contact data"
              );
              try {
                const contact = JSON.parse(contactData);
                convertToHyperlink(formItem, contact);
              } catch (e) {
                console.error("[DEBUG] Error parsing contact data:", e);
              }
            }
          } else {
            console.log("[DEBUG] Field cleared, removing stored contact data");
            // Field was cleared - remove stored contact data
            delete formItem.dataset.selectedContactId;
            delete formItem.dataset.selectedContactData;
            delete formItem.dataset.referredContactId;
            delete formItem.dataset.referredContactName;
          }
        }, 200);
        clearTimeout(state.debounceTimer);
        console.log("[DEBUG] Debounce timer cleared on blur");
      });

      const clickOutside = (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
          console.log("[DEBUG] Click outside detected, hiding dropdown");
          hideDropdown();
        }
      };
      if (!input.dataset.clickOutsideAttached) {
        document.addEventListener("click", clickOutside);
        input.dataset.clickOutsideAttached = "1";
        console.log("[DEBUG] Click outside listener attached");
      }
      const cleanup = () => {
        console.log("[DEBUG] Cleaning up event listeners");
        document.removeEventListener("click", clickOutside);
        window.removeEventListener("resize", updatePosition);
      };
      new MutationObserver(cleanup).observe(formItem, { childList: true });
      console.log("[DEBUG] attachToInput completed successfully");
    }

    /* --------------------------------------------------------------
     9. GLOBAL OBSERVER – Referred By
    -------------------------------------------------------------- */
    /* --------------------------------------------------------------
  9. GLOBAL OBSERVER – Referred By
  -------------------------------------------------------------- */
    const globalObserver = new MutationObserver(() => {
      // Restore hyperlinks first
      restoreHyperlinks();

      // Also aggressively restore all referred by hyperlinks
      restoreAllReferredByHyperlinks();

      document
        .querySelectorAll("span.hr-form-item-label__text")
        .forEach((label) => {
          const text = label.textContent.trim();
          if (text !== "Referred By") return;

          const formItem = label.closest(".hr-form-item");
          if (!formItem) return;

          // Mark as attached immediately to avoid duplicates
          if (!formItem.dataset.referredByAttached) {
            formItem.dataset.referredByAttached = "true";
            // label.style.color = "#f97316";
            label.style.fontWeight = "400";
          }

          const placeholderP = formItem.querySelector("p.hr-p");
          // If no p tag, look for the input directly since this structure doesn't use p tags
          const inputElement = formItem.querySelector(
            "input.hr-input__input-el"
          );

          if (!placeholderP && !inputElement) {
            console.log("[DEBUG] No placeholder P or input element found");
            return;
          }

          console.log("[DEBUG] Referred By field detected – attaching", {
            placeholderP,
            inputElement,
          });

          // Start observing the <p> tag for contact names
          observeReferredByP(formItem);

          // Aggressively try to restore hyperlink immediately
          setTimeout(() => {
            processReferredByAndCreateHyperlink(formItem);
          }, 300);

          // Multiple retries to catch delayed DOM updates
          setTimeout(() => {
            processReferredByAndCreateHyperlink(formItem);
          }, 800);

          setTimeout(() => {
            processReferredByAndCreateHyperlink(formItem);
          }, 1500);

          // Handle click on placeholder P or input - if not in edit mode and contact selected, prevent edit
          const clickTarget = placeholderP || inputElement;
          if (clickTarget) {
            clickTarget.addEventListener("click", (e) => {
              console.log("[DEBUG] Click target clicked", e.target);
              const link = formItem.querySelector("a[data-contact-link]");
              if (link) {
                console.log("[DEBUG] Link found, checking click target");
                // If clicking on link itself, let it navigate
                if (
                  e.target === link ||
                  e.target.closest("a[data-contact-link]")
                ) {
                  console.log(
                    "[DEBUG] Clicked on link itself, allowing navigation"
                  );
                  return;
                }
                // If clicking elsewhere, enter edit mode
                console.log("[DEBUG] Clicked elsewhere, entering edit mode");
                removeHyperlink(formItem);
              } else {
                console.log("[DEBUG] No link found");
              }
            });
          }

          // persistent watcher: re-attach whenever the framework inserts a new input
          function attachWatcherPersistent() {
            // ensure we only attach once per formItem
            if (formItem._referredWatcherAttached) return;
            formItem._referredWatcherAttached = true;

            const ensureInputAttached = () => {
              console.log("[DEBUG] ensureInputAttached called");
              const input = formItem.querySelector("input.hr-input__input-el");
              console.log("[DEBUG] Input search result:", input);
              if (!input) {
                console.log("[DEBUG] No input found in formItem");
                return;
              }
              if (input.dataset.referredInputAttached) {
                console.log("[DEBUG] Input already attached, skipping");
                return;
              }
              input.dataset.referredInputAttached = "1";
              console.log(
                "[DEBUG] Referred By input found and attaching!",
                input
              );
              attachToInput(input, formItem);
            };

            // run immediately (in case input already present)
            ensureInputAttached();

            // watch for future insertions/replacements of the input element
            const mo = new MutationObserver(ensureInputAttached);
            mo.observe(formItem, { childList: true, subtree: true });
            // store observer reference so it can be cleaned up later if needed
            formItem._referredMo = mo;
          }

          // Trigger persistent watcher
          attachWatcherPersistent();
        });
    });
    globalObserver.observe(document.body, { childList: true, subtree: true });

    // SPA navigation and URL change detection
    let lastUrl = location.href;
    let lastContactId = null;

    function checkUrlChange() {
      const url = location.href;
      const currentContactId = extractContactIdFromUrl(url);

      // Check if URL changed
      if (url !== lastUrl) {
        lastUrl = url;
        console.log("URL changed – re-scanning");

        // If contact ID changed, restore hyperlinks
        if (currentContactId !== lastContactId) {
          lastContactId = currentContactId;

          // Wait for DOM to update, then restore hyperlinks
          setTimeout(() => {
            restoreAllReferredByHyperlinks();
            restoreHyperlinks(); // Legacy support
            globalObserver.observe(document.body, {
              childList: true,
              subtree: true,
            });
          }, 800);
        } else {
          // URL changed but same contact - still restore after delay
          setTimeout(() => {
            restoreAllReferredByHyperlinks();
            restoreHyperlinks();
            globalObserver.observe(document.body, {
              childList: true,
              subtree: true,
            });
          }, 500);
        }
      } else if (currentContactId && currentContactId !== lastContactId) {
        // Same URL but contact ID extracted (initial load)
        lastContactId = currentContactId;
        setTimeout(() => {
          restoreAllReferredByHyperlinks();
        }, 1000);
      }
    }

    // Aggressive URL change detection
    // Watch for URL changes via MutationObserver (SPA navigation)
    const urlChangeObserver = new MutationObserver(() => {
      checkUrlChange();
    });
    urlChangeObserver.observe(document, { subtree: true, childList: true });

    // Also use popstate for browser back/forward - more aggressive
    window.addEventListener("popstate", () => {
      setTimeout(() => {
        checkUrlChange();
        restoreAllReferredByHyperlinks();
      }, 100);
      setTimeout(() => {
        checkUrlChange();
        restoreAllReferredByHyperlinks();
      }, 500);
    });

    // Watch for hash changes - more aggressive
    window.addEventListener("hashchange", () => {
      setTimeout(() => {
        checkUrlChange();
        restoreAllReferredByHyperlinks();
      }, 100);
      setTimeout(() => {
        checkUrlChange();
        restoreAllReferredByHyperlinks();
      }, 500);
    });

    // Watch for visibility changes (user coming back to tab)
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        setTimeout(() => {
          restoreAllReferredByHyperlinks();
        }, 500);
      }
    });

    // Watch for focus events (user clicking back into page)
    window.addEventListener("focus", () => {
      setTimeout(() => {
        restoreAllReferredByHyperlinks();
      }, 500);
    });

    // Polling for URL changes (aggressive fallback)
    let urlPollInterval = setInterval(() => {
      checkUrlChange();
    }, 1000);

    // Initial check on page load - multiple attempts
    setTimeout(() => {
      checkUrlChange();
      lastContactId = extractContactIdFromUrl(location.href);
      restoreAllReferredByHyperlinks();
      checkExistingInputValues();
    }, 500);

    setTimeout(() => {
      checkUrlChange();
      restoreAllReferredByHyperlinks();
      checkExistingInputValues();
    }, 1000);

    setTimeout(() => {
      checkUrlChange();
      restoreAllReferredByHyperlinks();
      checkExistingInputValues();
    }, 2000);

    // Function to check for existing input values and create hyperlinks on page load
    function checkExistingInputValues() {
      console.log("[DEBUG] Checking existing input values for hyperlinks");

      document
        .querySelectorAll("span.hr-form-item-label__text")
        .forEach((label) => {
          const text = label.textContent.trim();
          if (text !== "Referred By") return;

          const formItem = label.closest(".hr-form-item");
          if (!formItem) return;

          const input = formItem.querySelector("input.hr-input__input-el");
          if (!input) return;

          const currentValue = (input.value || "").trim();
          console.log(
            "[DEBUG] Found Referred By input with value:",
            currentValue
          );

          if (
            currentValue &&
            currentValue !== "--" &&
            !currentValue.toLowerCase().includes("enter")
          ) {
            // Mark as attached
            formItem.dataset.referredByAttached = "true";

            // Process the existing value to create hyperlink
            setTimeout(() => {
              processReferredByAndCreateHyperlink(formItem);
            }, 500);
          }
        });
    }
  })();
</script>
