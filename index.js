function gridCellDimensions() {
  const element = document.createElement("div");
  element.style.position = "fixed";
  element.style.height = "var(--line-height)";
  element.style.width = "1ch";
  document.body.appendChild(element);
  const rect = element.getBoundingClientRect();
  document.body.removeChild(element);
  return { width: rect.width, height: rect.height };
}

// Add padding to each media to maintain grid.
function adjustMediaPadding() {
  const cell = gridCellDimensions();

  function setHeightFromRatio(media, ratio) {
      const rect = media.getBoundingClientRect();
      const realHeight = rect.width / ratio;
      const diff = cell.height - (realHeight % cell.height);
      media.style.setProperty("padding-bottom", `${diff}px`);
  }

  function setFallbackHeight(media) {
      const rect = media.getBoundingClientRect();
      const height = Math.round((rect.width / 2) / cell.height) * cell.height;
      media.style.setProperty("height", `${height}px`);
  }

  function onMediaLoaded(media) {
    if(media.classList.contains("no-padding")) {
      return;
    }
    var width, height;
    switch (media.tagName) {
      case "IMG":
        width = media.naturalWidth;
        height = media.naturalHeight;
        break;
      case "VIDEO":
        width = media.videoWidth;
        height = media.videoHeight;
        break;
    }
    if (width > 0 && height > 0) {
      setHeightFromRatio(media, width / height);
    } else {
      setFallbackHeight(media);
    }
  }

  const medias = document.querySelectorAll("img, video");
  for (media of medias) {
    switch (media.tagName) {
      case "IMG":
        if (media.complete) {
          onMediaLoaded(media);
        } else {
          media.addEventListener("load", () => onMediaLoaded(media));
          media.addEventListener("error", function() {
              setFallbackHeight(media);
          });
        }
        break;
      case "VIDEO":
        switch (media.readyState) {
          case HTMLMediaElement.HAVE_CURRENT_DATA:
          case HTMLMediaElement.HAVE_FUTURE_DATA:
          case HTMLMediaElement.HAVE_ENOUGH_DATA:
            onMediaLoaded(media);
            break;
          default:
            media.addEventListener("loadeddata", () => onMediaLoaded(media));
            media.addEventListener("error", function() {
              setFallbackHeight(media);
            });
            break;
        }
        break;
    }
  }
}

adjustMediaPadding();
window.addEventListener("load", adjustMediaPadding);
window.addEventListener("resize", adjustMediaPadding);

function checkOffsets() {
  const ignoredTagNames = new Set([
    "THEAD",
    "TBODY",
    "TFOOT",
    "TR",
    "TD",
    "TH",
  ]);
  const cell = gridCellDimensions();
  const elements = document.querySelectorAll("body :not(.debug-grid, .debug-toggle)");
  for (const element of elements) {
    if (ignoredTagNames.has(element.tagName)) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      continue;
    }
    const top = rect.top + window.scrollY;
    const left = rect.left + window.scrollX;
    const offset = top % (cell.height / 2);
    if(offset > 0) {
      element.classList.add("off-grid");
      console.error("Incorrect vertical offset for", element, "with remainder", top % cell.height, "when expecting divisible by", cell.height / 2);
    } else {
      element.classList.remove("off-grid");
    }
  }
}

const debugToggle = document.querySelector(".debug-toggle");
function onDebugToggle() {
  document.body.classList.toggle("debug", debugToggle.checked);
}
debugToggle.addEventListener("change", onDebugToggle);
onDebugToggle();

// making specific table sortable
function makeSortable(table) {
  const headers = table.querySelectorAll("th");

  tbody = table.querySelector("tbody");
  function sortByIndex(index) {
      sortTableByColumn(tbody, index);
      updateArrows(headers, index);
      console.log("Table sorted by column " + index);
 };
  headers.forEach((header, index) => {
    header.addEventListener("click", () => sortByIndex(index));
  });

  function sortTableByColumn(table, columnIndex) {
    const rows = Array.from(table.querySelectorAll("tr"));
    console.log(table);
    console.log(rows);
    const isAscending = table.getAttribute("data-sort-asc") === "true";
    const direction = isAscending ? 1 : -1;

    rows.sort((rowA, rowB) => {
      const cellA = rowA.children[columnIndex].textContent.trim();
      const cellB = rowB.children[columnIndex].textContent.trim();

      const cellANum = parseFloat(cellA);
      const cellBNum = parseFloat(cellB);

      if (!isNaN(cellANum) && !isNaN(cellBNum)) {
        return direction * (cellANum - cellBNum);
      } else {
        return direction * cellA.localeCompare(cellB);
      }
    });

    rows.forEach(row => table.appendChild(row));
    table.setAttribute("data-sort-asc", !isAscending);
  }

  function updateArrows(headers, sortedColumnIndex) {
    headers.forEach((header, index) => {
      const arrow = header.querySelector(".sort-arrow");
      if (!arrow) {
        return;
      }
      if (index === sortedColumnIndex) {
        const isAscending = tbody.getAttribute("data-sort-asc") === "true";
        arrow.textContent = isAscending ? " ▲" : " ▼";
      } else {
        arrow.textContent = "";
      }
    });
  }
  sortByIndex(1);
}
makeSortable(document.getElementById("leaderboard-table"));