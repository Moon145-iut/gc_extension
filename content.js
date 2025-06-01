(async () => {
  const user = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'sign-in' }, res => resolve(res.user));
  });

  const uid = user.uid;
  let folders = await new Promise(resolve => {
    chrome.runtime.sendMessage({ type: 'get-folders', uid }, res => resolve(res.folders));
  });

  const sidebar = document.querySelector('[role="navigation"]');
  if (!sidebar) return;

  const folderHeader = document.createElement('div');
  folderHeader.textContent = '📁 My Folders';
  folderHeader.style.margin = '10px';
  folderHeader.style.fontWeight = 'bold';
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
    document.querySelectorAll(".YVvGBb").forEach(card => {
      const classId = card.getAttribute("href")?.split("/").pop();
      if (!classId || card.dataset.folderInjected) return;
      card.dataset.folderInjected = true;
      card.dataset.classroomId = classId;
      card.dataset.folder = "";

      const kebab = card.querySelector(".U26fgb");
      if (!kebab) return;

      const menu = document.createElement("div");
      menu.style.position = "absolute";
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
