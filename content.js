(async () => {
  // Wait for the page to be fully loaded
  if (document.readyState !== 'complete') {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
  }

  // Try to authenticate
  const user = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'sign-in' }, res => {
      if (res.error) {
        console.error('Authentication error:', res.error);
        resolve(null);
      } else {
        resolve(res.user);
      }
    });
  });

  if (!user) {
    console.error('Failed to authenticate user');
    return;
  }

  // Get user folders
  const uid = user.uid;
  let folders = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'get-folders', uid }, res => {
      if (res.error) {
        console.error('Error getting folders:', res.error);
        resolve({});
      } else {
        resolve(res.folders || {});
      }
    });
  });
  // Find the sidebar - try multiple selectors as Google Classroom's structure might vary
  const sidebar = document.querySelector('[role="navigation"], .QRiHXd');
  if (!sidebar) {
    console.error('Could not find Google Classroom sidebar');
    return;
  }

  // Create and append folder header
  const folderHeader = document.createElement('div');
  folderHeader.textContent = '📁 My Folders';
  folderHeader.style.margin = '10px';
  folderHeader.style.fontWeight = 'bold';
  folderHeader.style.color = 'var(--mdc-theme-text-primary-on-background,#3c4043)';
  sidebar.appendChild(folderHeader);

  const updateFolderLinks = () => {
    document.querySelectorAll('.folder-link').forEach(el => el.remove());
    for (const folderName in folders) {
      const folderLink = document.createElement('div');
      folderLink.textContent = `📂 ${folderName}`;
      folderLink.className = 'folder-link';
      folderLink.style.cursor = 'pointer';
      folderLink.style.marginLeft = '20px';
      folderLink.onclick = () => {
        document.querySelectorAll('[data-folder]').forEach(el => {
          el.style.display = folders[folderName].includes(el.dataset.classroomId) ? '' : 'none';
        });
      };
      sidebar.appendChild(folderLink);
    }
  };

  updateFolderLinks();
  const observer = new MutationObserver(() => {
    // Look for course cards using multiple possible selectors
    document.querySelectorAll(".YVvGBb, .gHz6xd, [data-course-id]").forEach(card => {
      // Try to get class ID from multiple possible sources
      const classId = card.getAttribute("data-course-id") || 
                     card.getAttribute("href")?.split("/").pop() ||
                     card.querySelector("[data-course-id]")?.getAttribute("data-course-id");
                     
      if (!classId || card.dataset.folderInjected) return;
      card.dataset.folderInjected = true;
      card.dataset.classroomId = classId;
      card.dataset.folder = "";      // Try to find the menu button using multiple selectors
      const kebab = card.querySelector(".U26fgb, .VfPpkd-Bz112c-LgbsSe, .uRHG6, [aria-label='More actions']");
      if (!kebab) {
        console.debug('Could not find menu button for class:', classId);
        return;
      }

      const menu = document.createElement("div");
      menu.style.position = "absolute";
      menu.style.zIndex = "9999";
      menu.style.background = "white";
      menu.style.border = "1px solid #ccc";
      menu.style.padding = "5px";
      menu.style.display = "none";
      menu.style.zIndex = "99999";

      const populateMenu = () => {
        menu.innerHTML = '';
        for (const folder in folders) {
          const option = document.createElement("div");
          option.textContent = `Move to ${folder}`;
          option.style.cursor = 'pointer';
          option.onclick = async () => {
            for (const key in folders) {
              folders[key] = folders[key].filter(id => id !== classId);
            }
            folders[folder].push(classId);
            await new Promise(res => {
              chrome.runtime.sendMessage({ type: 'save-folders', uid, folders }, res);
            });
            menu.style.display = 'none';
            alert(`Moved class to ${folder}`);
            updateFolderLinks();
          };
          menu.appendChild(option);
        }
      };

      populateMenu();
      document.body.appendChild(menu);

      kebab.addEventListener("click", (e) => {
        e.preventDefault();
        populateMenu();
        menu.style.left = `${e.pageX}px`;
        menu.style.top = `${e.pageY}px`;
        menu.style.display = 'block';
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
