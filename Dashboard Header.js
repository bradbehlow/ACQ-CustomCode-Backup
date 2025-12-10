<script>
 // Custom Header
  
  
   
    (function () {
      const initCustomDiv = () => {
        const target = document.querySelector(".dashboard-divider");
        if (!target) return;
  
        if (document.getElementById("custom-practice-div")) return;
  
        // Create container div
        const newDiv = document.createElement("div");
        newDiv.id = "custom-practice-div";
        newDiv.style.backgroundColor = "#1C075FFF";
        newDiv.style.color = "#fff";
        newDiv.style.width = "100%";
        newDiv.style.padding = "16px";
        newDiv.style.borderRadius = "8px";
  
        // Add heading
        const heading = document.createElement("h2");
        heading.textContent = "Quick Actions";
        heading.style.margin = "0";
        heading.style.color = "#fff";
        heading.style.fontSize = "18px";
        heading.style.fontWeight = "600";
        newDiv.appendChild(heading);
  
        // Insert below .dashboard-divider
        target.parentNode.insertBefore(newDiv, target.nextSibling);
      };
  
      initCustomDiv();
  
      const observer = new MutationObserver(() => {
        initCustomDiv();
      });
  
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    })();

</script>
