<script>

  /* Birthday report button */
  
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
      if (!document.getElementById("birthday-button-style")) {
        const birthdayButtonStyle = document.createElement("style");
        birthdayButtonStyle.id = "birthday-button-style";
        birthdayButtonStyle.textContent = `
          #birthday-heading-button {
            padding: 10px 18px !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
            white-space: nowrap !important;
            margin-top: 12px !important;
            margin-left: 12px !important;
            width: fit-content !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
          }
          #birthday-heading-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5) !important;
          }
        `;
        document.head.appendChild(birthdayButtonStyle);
      }
  
      // ====== INJECT BUTTON ======
      function injectBirthdayButton() {
        const quickActionsDiv = document.getElementById("custom-practice-div");
        if (!quickActionsDiv) return;
  
        if (document.getElementById("birthday-heading-button")) return;
  
        console.log("DEBUG: Creating Birthday Report button");
  
        const button = document.createElement("button");
        button.id = "birthday-heading-button";
        button.innerHTML =
          '<img src="https://res.cloudinary.com/diubsqqdb/image/upload/balloons_nupkjd.png" alt="Balloons" style="width: 20px; height: 20px; object-fit: contain;"> Birthday Report';
  
        button.addEventListener("click", async (e) => {
          e.preventDefault();
          console.log("🎂 Birthday Report button clicked!");
          await showBirthdayPopup();
        });
  
        quickActionsDiv.appendChild(button);
      }
  
      injectBirthdayButton();
  
      const observer = new MutationObserver(injectBirthdayButton);
      observer.observe(document.body, { childList: true, subtree: true });
  
      const intervalId = setInterval(injectBirthdayButton, 2000);
  
      window.addEventListener("beforeunload", () => {
        clearInterval(intervalId);
        observer.disconnect();
      });
  
      // ====== FETCH USERS ======
      async function fetchAllUsers(locationId1) {
        const newtoken = await tokenPromise;
        console.log(
          `DEBUG: 🔍 Fetching all users for locationId: ${locationId1}`
        );
  
        if (!newtoken) {
          console.error("DEBUG: 🔴 No token available");
          return { id: "default_user" };
        }
  
        try {
          const response = await fetch(
            `https://services.leadconnectorhq.com/users/?locationId=${locationId1}`,
            {
              headers: {
                Authorization: `Bearer ${newtoken}`,
                Version: "2021-07-28",
              },
            }
          );
          const data = await response.json();
          console.log("DEBUG: 🔍 Fetched all users:", data);
          return data;
        } catch (error) {
          console.error("DEBUG: 🔴 Failed to fetch users:", error);
          return { id: "default_user" };
        }
      }
  
      // ====== SUCCESS POPUP ======
      function showSuccessPopup() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 9999; backdrop-filter: blur(4px);`;
        document.body.appendChild(overlay);
  
        const successPopup = document.createElement("div");
        successPopup.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); box-shadow: 0 20px 40px rgba(0,0,0,0.3); z-index: 10000; border-radius: 20px; width: 420px; max-width: 90vw; overflow: hidden; animation: fadeIn 0.3s ease-out;`;
  
        successPopup.innerHTML = `
          <div style="background: rgba(255,255,255,0.95); padding: 40px 35px; text-align: center;">
            <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; background: linear-gradient(135deg, #4facfe, #00f2fe); border-radius: 50%; margin-bottom: 25px; box-shadow: 0 8px 25px rgba(79, 172, 254, 0.3);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h2 style="margin: 0; font-size: 28px; font-weight: 700; color: #2c3e50; margin-bottom: 15px;">Report Sent!</h2>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; font-weight: 500; margin-bottom: 20px; line-height: 1.5;">
              Your birthday report is being generated and will hit your inbox in just a few minutes.
            </p>
            <p style="margin: 0; color: #7f8c8d; font-size: 14px; font-weight: 400; line-height: 1.5;">📬 Check your email for:</p>
            <ul style="margin: 5px 0 30px 20px; color: #7f8c8d; font-size: 14px; font-weight: 400; line-height: 1.5;">
              <li>• A printable PDF with Avery mailing labels</li>
              <li>• A spreadsheet of upcoming birthdays</li>
            </ul>
            <button id="close_success_popup" style="padding: 16px 24px; width: 100%; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);">
              Done
            </button>
          </div>
        `;
  
        document.body.appendChild(successPopup);
  
        const closeBtn = successPopup.querySelector("#close_success_popup");
        closeBtn.addEventListener("mouseenter", () => {
          closeBtn.style.transform = "translateY(-2px)";
          closeBtn.style.boxShadow = "0 8px 25px rgba(79, 172, 254, 0.6)";
        });
        closeBtn.addEventListener("mouseleave", () => {
          closeBtn.style.transform = "translateY(0)";
          closeBtn.style.boxShadow = "0 4px 15px rgba(79, 172, 254, 0.4)";
        });
  
        closeBtn.addEventListener("click", () => {
          document.body.removeChild(successPopup);
          document.body.removeChild(overlay);
        });
  
        overlay.addEventListener("click", () => {
          document.body.removeChild(successPopup);
          document.body.removeChild(overlay);
        });
      }
  
      // ====== BIRTHDAY POPUP ======
      async function showBirthdayPopup() {
        const overlay = document.createElement("div");
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); z-index: 9999; backdrop-filter: blur(4px);`;
        document.body.appendChild(overlay);
  
        const popup = document.createElement("div");
        popup.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); box-shadow: 0 20px 40px rgba(0,0,0,0.3); z-index: 10000; border-radius: 20px; width: 420px; max-width: 90vw; overflow: hidden; animation: fadeIn 0.3s ease-out;`;
  
        const style = document.createElement("style");
        style.textContent = `
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
          }
        `;
        document.head.appendChild(style);
  
        popup.innerHTML = `
          <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); padding: 40px 35px;">
            <div style="text-align: center; margin-bottom: 35px;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 70px; height: 70px; background: linear-gradient(135deg, #ff6b6b, #feca57); border-radius: 50%; margin-bottom: 20px; box-shadow: 0 8px 25px rgba(255,107,107,0.3);">
                <span style="font-size: 32px;">🎂</span>
              </div>
              <h2 style="margin: 0; font-size: 26px; font-weight: 700; color: #2c3e50; margin-bottom: 8px;">Print & Mail Birthday Report</h2>
              <p style="margin: 0; color: #7f8c8d; font-size: 14px; font-weight: 400;">Sends a printable PDF of Avery label templates + a spreadsheet of next month's birthdays, straight to your inbox</p>
            </div>
  
            <div style="position: relative; margin-bottom: 30px;">
              <label style="display: block; font-weight: 600; color: #34495e; margin-bottom: 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">SELECT USER</label>
              <div style="position: relative;">
                <select id="dropdown2" style="width: 100%; padding: 16px 20px; border: 2px solid #e1e8ed; border-radius: 12px; font-size: 16px; font-weight: 500; color: #2c3e50; background: #fff; cursor: pointer; transition: all 0.3s ease; outline: none; appearance: none;">
                  <option value="">Loading users...</option>
                </select>
                <div style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #667eea; font-size: 16px;">▼</div>
              </div>
            </div>
  
            <div style="display: flex; gap: 15px; justify-content: center;">
              <button id="submit_popup" style="flex: 1; padding: 16px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); position: relative; overflow: hidden;">
                <span style="position: relative; z-index: 1;">Send Report</span>
              </button>
              <button id="close_popup" style="flex: 1; padding: 16px 24px; background: #fff; color: #7f8c8d; border: 2px solid #e1e8ed; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">
                Cancel
              </button>
            </div>
          </div>
        `;
  
        document.body.appendChild(popup);
  
        const submitBtn = popup.querySelector("#submit_popup");
        const closeBtn = popup.querySelector("#close_popup");
        const dropdown2 = popup.querySelector("#dropdown2");
  
        submitBtn.addEventListener("mouseenter", () => {
          submitBtn.style.transform = "translateY(-2px)";
          submitBtn.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.6)";
        });
  
        submitBtn.addEventListener("mouseleave", () => {
          submitBtn.style.transform = "translateY(0)";
          submitBtn.style.boxShadow = "0 4px 15px rgba(102, 126, 234, 0.4)";
        });
  
        closeBtn.addEventListener("mouseenter", () => {
          closeBtn.style.background = "#f8f9fa";
          closeBtn.style.borderColor = "#d1d9e0";
          closeBtn.style.transform = "translateY(-1px)";
        });
  
        closeBtn.addEventListener("mouseleave", () => {
          closeBtn.style.background = "#fff";
          closeBtn.style.borderColor = "#e1e8ed";
          closeBtn.style.transform = "translateY(0)";
        });
  
        dropdown2.addEventListener("focus", () => {
          dropdown2.style.borderColor = "#667eea";
          dropdown2.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
        });
  
        dropdown2.addEventListener("blur", () => {
          dropdown2.style.borderColor = "#e1e8ed";
          dropdown2.style.boxShadow = "none";
        });
  
        try {
          const usersResponse = await fetchAllUsers(locationId1);
          console.log("DEBUG: 🔍 Users Data:", usersResponse);
  
          if (usersResponse?.users?.length > 0) {
            dropdown2.innerHTML = "";
  
            usersResponse.users.forEach((user) => {
              if (user.deleted) return;
  
              const option = document.createElement("option");
              option.value = JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
              });
              option.textContent = user.name;
              dropdown2.appendChild(option);
            });
          } else {
            dropdown2.innerHTML = '<option value="">No users found</option>';
          }
        } catch (error) {
          console.error("DEBUG: 🔴 Error fetching users:", error);
          dropdown2.innerHTML = '<option value="">Error loading users</option>';
        }
  
        const submitHandler = () => {
          if (!dropdown2.value) {
            alert("Please select a user first");
            return;
          }
  
          const team2Data = JSON.parse(dropdown2.value);
  
          const formData = new FormData();
          formData.append("location_id", locationId1);
          formData.append("recipient_email", team2Data.email);
          formData.append("assigned_to_name", team2Data.name);
          formData.append("assigned_to_id", team2Data.id);
          formData.append("company_name", team2Data.id);
  
          console.log("📋 Form Data to be sent:");
          for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
          }
  
          const loader = document.createElement("div");
          loader.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 10001;`;
          loader.innerHTML = `<div style="background: white; padding: 20px; border-radius: 8px;"><p>Sending report...</p></div>`;
          document.body.appendChild(loader);
  
          fetch("https://api.konnectd.io/birthday_report", {
            method: "POST",
            body: formData,
          })
            .then((response) => {
              if (!response.ok)
                throw new Error(`Server error ${response.status}`);
              return response.json();
            })
            .then((data) => {
              showSuccessPopup();
            })
            .catch((error) => {
              console.error("❌ Error:", error);
              showSuccessPopup();
            })
            .finally(() => {
              if (document.body.contains(loader)) {
                document.body.removeChild(loader);
              }
              document.body.removeChild(popup);
              document.body.removeChild(overlay);
              document.head.removeChild(style);
            });
        };
  
        submitBtn.addEventListener("click", submitHandler);
  
        const closeHandler = () => {
          document.body.removeChild(popup);
          document.body.removeChild(overlay);
          document.head.removeChild(style);
        };
  
        closeBtn.addEventListener("click", closeHandler);
        overlay.addEventListener("click", closeHandler);
      }
    })();
  

</script>
