<script>

/* --------------------------------------------------------------
  10. BUSINESS NAME TO LOAN ID CONVERSION
-------------------------------------------------------------- */
console.log("🚀 [Loan ID] Business Name to Loan ID script loaded");
let businessFieldHelpersInitialized = false;

function updateBusinessNameToLoanId() {
  // Target the FIRST field-container specifically (like the CSS did)
  const firstFieldContainer = document.querySelector(
    "#record-details-new-ui #record-details-tabs #field-container"
  );

  if (!firstFieldContainer) {
    return; // Not on the right page yet
  }

  // Find the Business Name label in the first container
  const labelP = firstFieldContainer.querySelector(
    ".hr-form-item-blank span p"
  );

  if (labelP) {
    const labelText = labelP.textContent.trim();

    // Change "Business Name" to "Loan ID" if needed
    if (labelText === "Business Name") {
      labelP.textContent = "Loan ID";
      console.log(
        "✅ [Loan ID] Found Business Name field - converting to Loan ID"
      );
    }

    // Continue processing if label is "Business Name" OR "Loan ID"
    if (labelText === "Business Name" || labelText === "Loan ID") {
      // Find the input container and placeholder
      const inputContainer = firstFieldContainer.querySelector(
        ".hr-input__text-content"
      );

      if (inputContainer) {
        const placeholder = inputContainer.querySelector(".hr-p");

        if (placeholder) {
          const text = placeholder.textContent.trim();

          // Check if the input is currently focused
          const actualInput =
            firstFieldContainer.querySelector("input, textarea");
          const isFocused =
            actualInput && document.activeElement === actualInput;

          // ALWAYS update if we see "Enter business name"
          if (text === "Enter business name") {
            // If focused, clear it. If not focused, show "Enter Loan ID"
            placeholder.textContent = isFocused ? "" : "Enter Loan ID";
            console.log(
              isFocused
                ? "✅ [Loan ID] Placeholder cleared (focused)"
                : "✅ [Loan ID] Placeholder updated to 'Enter Loan ID'"
            );
          }
        }

        // Set up observer only once
        if (!inputContainer.dataset.loanIdContainerWatched) {
          inputContainer.dataset.loanIdContainerWatched = "true";

          // Watch the container for when GHL replaces the <p> element
          const containerObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              // Check if the input is currently focused
              const actualInput =
                firstFieldContainer.querySelector("input, textarea");
              const isFocused =
                actualInput && document.activeElement === actualInput;

              // Check for new nodes (GHL replacing the <p> element)
              if (
                mutation.type === "childList" &&
                mutation.addedNodes.length > 0
              ) {
                mutation.addedNodes.forEach((node) => {
                  if (
                    node.nodeType === 1 &&
                    node.classList &&
                    node.classList.contains("hr-p")
                  ) {
                    const newText = node.textContent.trim();
                    if (newText === "Enter business name") {
                      // If focused, clear it. If not focused, show "Enter Loan ID"
                      node.textContent = isFocused ? "" : "Enter Loan ID";
                      console.log(
                        isFocused
                          ? "🔄 [Loan ID] Caught replacement while focused - cleared"
                          : "🔄 [Loan ID] Caught replacement - updated to 'Enter Loan ID'"
                      );
                    }
                  }
                });
              }

              // Also watch for text changes
              if (mutation.type === "characterData") {
                const currentPlaceholder =
                  inputContainer.querySelector(".hr-p");
                if (currentPlaceholder) {
                  const currentText = currentPlaceholder.textContent.trim();
                  if (currentText === "Enter business name") {
                    // If focused, clear it. If not focused, show "Enter Loan ID"
                    currentPlaceholder.textContent = isFocused
                      ? ""
                      : "Enter Loan ID";
                    console.log(
                      isFocused
                        ? "🔄 [Loan ID] Caught text change while focused - cleared"
                        : "🔄 [Loan ID] Caught text change - updated to 'Enter Loan ID'"
                    );
                  }
                }
              }
            });
          });

          // Observe the container for when <p> gets replaced or text changes
          containerObserver.observe(inputContainer, {
            childList: true, // Watch for element replacement
            characterData: true, // Watch for text changes
            subtree: true, // Watch all descendants
          });

          console.log("👀 [Loan ID] Observer set up - watching for changes");
        }

        // Add focus/blur handlers to clear placeholder when focused
        const inputElement = firstFieldContainer.querySelector(
          ".hr-input__inline-text"
        );
        if (inputElement && !inputElement.dataset.loanIdFocusHandlerAttached) {
          inputElement.dataset.loanIdFocusHandlerAttached = "true";

          // When the field is focused (clicked), clear the placeholder
          inputElement.addEventListener("click", () => {
            const placeholder = inputContainer.querySelector(".hr-p");
            if (placeholder) {
              placeholder.textContent = "";
              console.log("🎯 [Loan ID] Placeholder cleared on focus");
            }
          });

          // When the field loses focus (blur), restore placeholder if empty
          inputElement.addEventListener("blur", () => {
            const placeholder = inputContainer.querySelector(".hr-p");
            const actualInput =
              firstFieldContainer.querySelector("input, textarea");
            if (placeholder && actualInput && actualInput.value.trim() === "") {
              placeholder.textContent = "Enter Loan ID";
              console.log("🔙 [Loan ID] Placeholder restored on blur");
            }
          });

          console.log("✅ [Loan ID] Focus/blur handlers attached");
        }
      }
    }
  }
}

// Run every 500ms to catch when the field appears
setInterval(updateBusinessNameToLoanId, 500);

  
  

</script>
