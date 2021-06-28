;(()=>{
    zoteroRoam.interface = {
        icon: null,
        portal: {div: null, id: "zotero-roam-portal"},
        contextMenu: {
            div: null,
            class: "zotero-roam-context-menu",
            overlay: {div: null, class: "zotero-roam-context-overlay"},
            options: {list: [], class: "zotero-roam-context-menu-option", labels: ["Import Zotero data to page", "Convert to citation", "Check for citing papers", "View item information"]},
            visible: false,
            targetElement: null,
            position({top, left}){
                zoteroRoam.interface.contextMenu.div.style.left = `${left}px`;
                zoteroRoam.interface.contextMenu.div.style.top = `${top}px`;
                zoteroRoam.interface.toggleContextOverlay("contextMenu", "show");
            }
        },
        iconContextMenu: {
            div: null,
            class: "zotero-roam-icon-context-menu",
            overlay: {div: null, class: "zotero-roam-icon-context-overlay"},
            options: {list: [], class: "zotero-roam-icon-context-menu-option", labels: ["Update Zotero data", "Search in dataset..."]},
            visible: false,
            position({top, left}){
                zoteroRoam.interface.iconContextMenu.div.style.left = (left >= 0.9*window.innerWidth) ? `calc(${left}px - 10%)` : `${left}px`;
                zoteroRoam.interface.iconContextMenu.div.style.top = `calc(${top}px + 3%)`;
                zoteroRoam.interface.toggleContextOverlay("iconContextMenu", "show");
            }
        },
        citations: {overlay: null, input: null, closeButton: null, overlayClass: "zotero-roam-citations-search"},
        search: {overlay: null, input: null, selectedItemDiv: null, closeButton: null, updateButton: null, overlayClass: "zotero-roam-search"},
        tributeTrigger: ``,
        tributeBlockTrigger: null,
        tributeNewText: ``,
        activeImport: null,

        create(){
            zoteroRoam.interface.createIcon(id = "zotero-roam-icon");
            zoteroRoam.interface.portal.div = zoteroRoam.interface.createPortal(id = zoteroRoam.interface.portal.id);
            zoteroRoam.interface.createContextMenu(elementKey = "contextMenu");
            zoteroRoam.interface.createContextMenu(elementKey = "iconContextMenu");
            // Create search overlay
            zoteroRoam.interface.createOverlay(divClass = zoteroRoam.interface.search.overlayClass);
            zoteroRoam.interface.fillSearchOverlay();
            // Create citations search overlay
            zoteroRoam.interface.createOverlay(divClass = zoteroRoam.interface.citations.overlayClass);
            zoteroRoam.interface.fillCitationsOverlay();
            // Create toast overlay
            zoteroRoam.interface.createToastOverlay();
        },

        setup(){
            zoteroRoam.interface.icon.addEventListener("click", zoteroRoam.extension.toggle);

            zoteroRoam.interface.setupContextMenus(["contextMenu", "iconContextMenu"]);

            zoteroRoam.interface.search.updateButton.addEventListener("click", function(){zoteroRoam.extension.update(popup = true)});
            zoteroRoam.interface.search.closeButton.addEventListener("click", function(){zoteroRoam.interface.toggleSearchOverlay("hide")});
        },

        createIcon(id) {
            try{ document.getElementById(id).closest(".bp3-popover-wrapper").remove() } catch(e){};
            var button = document.createElement('span');
            button.classList.add('bp3-popover-wrapper');
            button.setAttribute("style", "margin-left: 4px;");
            button.innerHTML = `<span class="bp3-popover-target"><span id="${id}" status="off" class="bp3-button bp3-icon-manual bp3-minimal bp3-small"></span>`
            document.querySelector(".rm-topbar").appendChild(button);
        
            zoteroRoam.interface.icon = document.getElementById(id);
        },

        createPortal(id){
            try{ document.getElementById(id).remove() } catch(e){};
            var portalDiv = document.createElement("div");
            portalDiv.classList.add("bp3-portal");
            portalDiv.id = id;
            document.getElementById("app").appendChild(portalDiv);
            
            return portalDiv;
        },

        createContextMenu(elementKey){
            let config = zoteroRoam.interface[`${elementKey}`];
            try{ document.querySelector(`.${config.overlay.class}`).remove() } catch(e){};

            let backdropStyle = `z-index:25;`;
            let containerStyle = `width: auto; position: fixed;z-index:25;`;
            let menuOptions = config.options.labels.map(op => `<li class="${config.options.class}"><a class="bp3-menu-item bp3-popover-dismiss"><div class="bp3-fill bp3-text-overflow-ellipsis">${op}</div></a></li>`).join("");

            var overlayDiv = document.createElement("div");
            overlayDiv.classList.add("bp3-overlay");
            overlayDiv.classList.add("bp3-overlay-open");
            overlayDiv.classList.add(`${config.overlay.class}`);
            overlayDiv.style = `display:none;`;
            overlayDiv.innerHTML = `<div class="bp3-overlay-backdrop bp3-popover-backdrop bp3-popover-appear-done bp3-popover-enter-done" style="${backdropStyle}"></div>
                                    <div class="bp3-transition-container bp3-popover-appear-done bp3-popover-enter-done ${config.class}" style="${containerStyle}">
                                        <div class="bp3-popover bp3-minimal">
                                            <div class="bp3-popover-content">
                                                <div>
                                                    <ul class="bp3-menu bp3-text-small">
                                                        ${menuOptions}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`;

            zoteroRoam.interface.portal.div.appendChild(overlayDiv);
            zoteroRoam.interface[`${elementKey}`].overlay.div = document.querySelector(`.${zoteroRoam.interface[`${elementKey}`].overlay.class}`);
            zoteroRoam.interface[`${elementKey}`].div = document.querySelector(`.${zoteroRoam.interface[`${elementKey}`].class}`);
            zoteroRoam.interface[`${elementKey}`].options.list = document.querySelectorAll(`.${zoteroRoam.interface[`${elementKey}`].options.class}`);
        },

        createToastOverlay(){
            let overlay = document.createElement('div');
            overlay.classList.add("bp3-overlay");
            overlay.classList.add("bp3-overlay-open");
            overlay.classList.add("bp3-toast-container");
            overlay.classList.add("bp3-toast-container-top");
            overlay.classList.add("bp3-toast-container-in-portal");
            overlay.classList.add("zotero-roam-toast-overlay");
            
            zoteroRoam.interface.portal.div.appendChild(overlay);
        },

        async popToast(message, intent = "primary"){
            let toastOverlay = zoteroRoam.interface.portal.div.querySelector('.zotero-roam-toast-overlay');
            toastOverlay.innerHTML = zoteroRoam.utils.renderBP3Toast(string = message, {toastClass: `bp3-intent-${intent}`});

            toastOverlay.querySelector('.bp3-toast').style.opacity = "1";
            await zoteroRoam.utils.sleep(700);
            toastOverlay.querySelector('.bp3-toast').style.top = "-100px";

        },

        createOverlay(divClass, dialogCSS = "align-self:baseline;transition:0.5s;", useBackdrop = true){
            try{ document.querySelector(`.${divClass}-overlay`).remove() } catch(e){};

            let overlay = document.createElement("div");
            overlay.classList.add("bp3-overlay");
            overlay.classList.add("bp3-overlay-open");
            overlay.classList.add("bp3-overlay-scroll-container");
            overlay.classList.add(`${divClass}-overlay`);
            overlay.classList.add(`zotero-roam-dialog-overlay`);
            overlay.setAttribute("overlay-visible", "false");
            overlay.style = "display:none;"
            
            if(useBackdrop){
                let overlayBackdrop = document.createElement("div");
                overlayBackdrop.classList.add("bp3-overlay-backdrop");
                overlayBackdrop.classList.add("bp3-overlay-appear-done");
                overlayBackdrop.classList.add("bp3-overlay-enter-done");
                overlayBackdrop.classList.add(`${divClass}-backdrop`);
                overlayBackdrop.tabIndex = "0";
                overlay.appendChild(overlayBackdrop);
            }
        
            let dialogContainer = document.createElement("div");
            dialogContainer.classList.add("bp3-dialog-container");
            dialogContainer.classList.add("bp3-overlay-content");
            dialogContainer.classList.add("bp3-overlay-appear-done");
            dialogContainer.classList.add("bp3-overlay-enter-done");
            dialogContainer.tabIndex = "0";
        
            let dialogDiv = document.createElement("div");
            dialogDiv.classList.add("bp3-dialog");
            dialogDiv.setAttribute("side-panel", "hidden");
            dialogDiv.style = dialogCSS;
            
            let dialogBody = document.createElement("div");
            dialogBody.classList.add("bp3-dialog-body");

            let dialogMainPanel = document.createElement('div');
            dialogMainPanel.classList.add("main-panel");
            dialogMainPanel.style = `flex: 1 1 100%;`;

            let dialogSidePanel = document.createElement('div');
            dialogSidePanel.classList.add("side-panel");
            dialogSidePanel.style = `flex: 1 0 0%;`;

            let sidePanelContents = document.createElement('div');
            sidePanelContents.classList.add("side-panel-contents");
            dialogSidePanel.appendChild(sidePanelContents);
        
            // Chain up all the DOM elements
            dialogBody.appendChild(dialogMainPanel);
            dialogBody.appendChild(dialogSidePanel);
            dialogDiv.appendChild(dialogBody);
        
            dialogContainer.appendChild(dialogDiv);
        
            overlay.appendChild(dialogContainer);
        
            zoteroRoam.interface.portal.div.appendChild(overlay);

        },

        fillSearchOverlay(divClass = zoteroRoam.interface.search.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);

            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (left)

            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");

            let panelTitle = document.createElement('h5');
            panelTitle.innerText = "Zotero Library";

            let panelSubtitle = document.createElement('p');
            panelSubtitle.classList.add("bp3-text-muted");
            panelSubtitle.classList.add("bp3-text-small");
            panelSubtitle.classList.add("panel-subtitle");
            panelSubtitle.innerText = `Search by title, year, authors (last names), citekey, tags`;
        
            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-search-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");

            headerLeft.appendChild(panelTitle);
            headerLeft.appendChild(panelSubtitle);
            headerLeft.appendChild(searchBar);

            // Header (right)

            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-search-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            let quickCopyElement = document.createElement('label');
            quickCopyElement.classList.add("bp3-control");
            quickCopyElement.classList.add("bp3-switch");
            quickCopyElement.classList.add("bp3-text-small");
            quickCopyElement.classList.add("quick-copy-element");

            let quickCopyInput = document.createElement('input');
            quickCopyInput.id = "zotero-roam-quick-copy-mode";
            quickCopyInput.setAttribute("type", "checkbox");
            quickCopyElement.appendChild(quickCopyInput);

            let quickCopyIndicator = document.createElement('span');
            quickCopyIndicator.classList.add("bp3-control-indicator");
            quickCopyElement.appendChild(quickCopyIndicator);

            quickCopyElement.innerHTML += `Quick Copy`;

            headerRight.appendChild(controlsTop);
            headerRight.appendChild(quickCopyElement);

            // ---
            
            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);

            dialogMainPanel.appendChild(headerContent);

            // ---

            let renderedDiv = document.createElement('div');
            renderedDiv.id = "zotero-roam-library-rendered";
            renderedDiv.setAttribute("view", "search");

            let librarySearchDiv = document.createElement('div');
            librarySearchDiv.id = "zotero-roam-library-search-div";

            let searchPaginationDiv = document.createElement('div');
            searchPaginationDiv.classList.add("bp3-button-group");
            searchPaginationDiv.classList.add("bp3-minimal");
            searchPaginationDiv.innerHTML = `
            <span class="zotero-roam-library-results-count"></span>
            `;

            librarySearchDiv.appendChild(searchPaginationDiv);
        
            let selectedItemDiv = document.createElement('div');
            selectedItemDiv.id = "zotero-roam-search-selected-item";
            selectedItemDiv.classList.add("bp3-card");
        
            let selectedItemMetadata = document.createElement('div');
            selectedItemMetadata.classList.add("selected-item-header");
            let selectedItemGraphInfo = document.createElement('div');
            selectedItemGraphInfo.classList.add("selected-item-body");
        
            selectedItemDiv.appendChild(selectedItemMetadata);
            selectedItemDiv.appendChild(selectedItemGraphInfo);

            renderedDiv.appendChild(librarySearchDiv);
            renderedDiv.appendChild(selectedItemDiv);
        
            dialogMainPanel.appendChild(renderedDiv);

            let footerActions = document.createElement('div');
            footerActions.classList.add("bp3-dialog-footer-actions");
            footerActions.innerHTML = `
            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
            <span class="bp3-popover2-target" tabindex="0">
                <button type="button" class="zotero-roam-update-data bp3-button bp3-minimal">
                <span icon="refresh" class="bp3-icon bp3-icon-refresh"></span>
                <span class="bp3-button-text">Update Zotero data</span>
                </button>
            </span>
            `;

            dialogMainPanel.appendChild(footerActions);

            // Storing info in variables
            zoteroRoam.interface.search.overlay = document.querySelector(`.${divClass}-overlay`);
            zoteroRoam.interface.search.input = document.querySelector("#zotero-roam-search-autocomplete");
            zoteroRoam.interface.search.selectedItemDiv = document.querySelector("#zotero-roam-search-selected-item");
            zoteroRoam.interface.search.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-search-close`);
            zoteroRoam.interface.search.updateButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-update-data`);
        },

        fillCitationsOverlay(divClass = zoteroRoam.interface.citations.overlayClass){
            let dialogMainPanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .main-panel`);
            let dialogSidePanel = document.querySelector(`.${divClass}-overlay .bp3-dialog-body .side-panel-contents`);
            
            let headerContent = document.createElement('div');
            headerContent.classList.add("bp3-input-group");
            headerContent.classList.add("header-content");

            // Header (left)
            let headerLeft = document.createElement('div');
            headerLeft.classList.add("header-left");

            let panelTitle = document.createElement('h5');
            panelTitle.innerText = "Citing Papers";

            let panelSubtitle = document.createElement('p');
            panelSubtitle.classList.add("bp3-text-muted");
            panelSubtitle.classList.add("bp3-text-small");
            panelSubtitle.classList.add("panel-subtitle");
            panelSubtitle.innerText = `Search by title, year, authors (last names), abstract, keywords, publication`;


            let searchBar = document.createElement('input');
            searchBar.id = "zotero-roam-citations-autocomplete";
            searchBar.tabIndex = "1";
            searchBar.type = "text";
            searchBar.classList.add("bp3-input");
            
            headerLeft.appendChild(panelTitle);
            headerLeft.appendChild(panelSubtitle);
            headerLeft.appendChild(searchBar);

            // Header (right)
            let headerRight = document.createElement('div');
            headerRight.classList.add("header-right");

            let controlsTop = document.createElement('div');
            controlsTop.classList.add("controls-top");
            controlsTop.innerHTML = `
            <button type="button" aria-label="Close" class="zotero-roam-search-close bp3-button bp3-minimal bp3-dialog-close-button">
            <span icon="small-cross" class="bp3-icon bp3-icon-small-cross"></span></button>
            `;

            headerRight.appendChild(controlsTop);

            // ---

            headerContent.appendChild(headerLeft);
            headerContent.appendChild(headerRight);
            
            // ---

            let pagination = document.createElement('div');
            pagination.id = "zotero-roam-citations-pagination";
            
            let pageControls = document.createElement('div');
            pageControls.classList.add("bp3-button-group");
            pageControls.classList.add("bp3-minimal");
            pageControls.innerHTML = `
            ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-left", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="previous"'})}
            ${zoteroRoam.utils.renderBP3Button_group(string = "", {icon: "chevron-right", buttonClass: "zotero-roam-page-control", buttonAttribute: 'goto="next"'})}
            <span class="zotero-roam-citations-results-count"></span>
            `;
            pagination.appendChild(pageControls);

            // ---

            dialogMainPanel.appendChild(headerContent);
            dialogMainPanel.appendChild(pagination);

            // ---

            let importHeader = document.createElement('div');
            importHeader.style = `display:flex;justify-content:space-between;margin-bottom:15px;align-items:center;`;
            importHeader.innerHTML = `
            <h4>Add to Zotero</h4>
            ${zoteroRoam.utils.renderBP3Button_group("Import", {buttonClass: "import-button bp3-intent-primary", buttonAttribute: "disabled"})}
            `;

            let importOptions = document.createElement('div');
            importOptions.classList.add("import-options");
            importOptions.style = `display:flex;justify-content:space-between;font-size:0.85em;`;

            let optionsLib = document.createElement('div');
            optionsLib.classList.add("options-library");
            optionsLib.style = `flex:1 0 50%;`;
            optionsLib.innerHTML = `<label class="bp3-label bp3-text-muted">Library</label><div class="options-library-list"></div>`;

            let optionsColl = document.createElement('div');
            optionsColl.classList.add("options-collections");
            optionsColl.style = `flex:1 0 50%;`;
            optionsColl.innerHTML = `<label class="bp3-label bp3-text-muted">Collections</label><div class="options-collections-list"></div>`;

            importOptions.appendChild(optionsLib);
            importOptions.appendChild(optionsColl);

            let importItems = document.createElement('div');
            importItems.classList.add("import-items");
            importItems.classList.add("bp3-list-unstyled");
            importItems.style = `font-size:0.9em;margin:20px 0;`;

            let importCancel = document.createElement('div');
            importCancel.innerHTML = zoteroRoam.utils.renderBP3Button_group("Cancel", {buttonClass: "import-cancel-button bp3-small"});

            dialogSidePanel.appendChild(importHeader);
            dialogSidePanel.appendChild(importOptions);
            dialogSidePanel.appendChild(importItems);
            dialogSidePanel.appendChild(importCancel);

            // ---

            let footerActions = document.createElement('div');
            footerActions.classList.add("bp3-dialog-footer-actions");
            footerActions.innerHTML = `
            <input class="bp3-input clipboard-copy-utility" type="text" readonly style="opacity:0;">
            `;
            dialogMainPanel.appendChild(footerActions);

            
            // Storing info in variables
            zoteroRoam.interface.citations.overlay = document.querySelector(`.${divClass}-overlay`);
            zoteroRoam.interface.citations.input = document.querySelector("#zotero-roam-citations-autocomplete");
            zoteroRoam.interface.citations.closeButton = document.querySelector(`.${divClass}-overlay button.zotero-roam-search-close`);

            // Rigging page controls
            Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(".zotero-roam-page-control")).forEach(control => {
                control.addEventListener("click", (e) => { zoteroRoam.interface.changePage(goto = control.getAttribute("goto")) });
            })

            // Rigging close overlay button
            zoteroRoam.interface.citations.closeButton.addEventListener("click", zoteroRoam.interface.closeCitationsOverlay);

            // Rigging items import button
            zoteroRoam.interface.citations.overlay.querySelector(".import-button").addEventListener("click", zoteroRoam.handlers.importSelectedItems);
            zoteroRoam.interface.citations.overlay.querySelector(".import-cancel-button").addEventListener("click", zoteroRoam.interface.clearImportPanel);

        },

        renderCitationsPagination(){
            let paginationDiv = document.querySelector("#zotero-roam-citations-pagination");

            let paginatedList = paginationDiv.querySelector("ul");
            if(paginatedList == null){
                paginatedList = document.createElement('ul');
                paginatedList.classList.add("zotero-roam-citations-search-results-list");
                paginatedList.classList.add("bp3-menu");
                paginatedList.tabIndex = "-1";
                paginatedList.setAttribute("role", "listbox");
                paginationDiv.appendChild(paginatedList);
            }

            let page = zoteroRoam.citations.pagination.getCurrentPageData();
            // Indicate results shown
            paginationDiv.querySelector(".zotero-roam-citations-results-count").innerHTML = `
            <strong>${zoteroRoam.citations.pagination.startIndex}-${zoteroRoam.citations.pagination.startIndex + page.length - 1}</strong> / ${zoteroRoam.citations.pagination.data.length} citations
            `;
            // Grab current page data, generate corresponding HTML, then inject as contents of paginatedList
            paginatedList.innerHTML = page.map(cit => {
                let titleEl = `<span class="zotero-roam-search-item-title" style="display:block;">${cit.title} ${cit.inLibrary ? '<span icon="endorsed" class="bp3-icon bp3-icon-endorsed bp3-intent-success"></span>' : ''}</span>`;
                // let keywordsEl = cit.keywords.length > 0 ? `<span class="zotero-roam-search-item-tags">${cit.keywords.map(w => "#" + w).join(", ")}</span>` : "";
                let origin = cit.authors + (cit.year ? " (" + cit.year + ")" : "");
                let metaEl = `<span class="zotero-roam-citation-metadata-contents">${zoteroRoam.utils.renderBP3Tag(origin, {modifier: "bp3-intent-warning zotero-roam-citation-origin"})} ${cit.meta}</span>`;
                let linksEl = "";
                for(var service of Object.keys(cit.links)){
                    let linksArray = [];
                    switch(service){
                        case "scite":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="scite"><a href="${cit.links[service]}" target="_blank">Scite</a></span>`);
                            break;
                        case "connectedPapers":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="connected-papers"><a href="${cit.links[service]}" target="_blank">Connected Papers</a></span>`);
                            break;
                        case "semanticScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="semantic-scholar"><a href="${cit.links[service]}" target="_blank">Semantic Scholar</a></span>`);
                            break;
                        case "googleScholar":
                            linksArray.push(`<span class="zotero-roam-citation-link" service="google-scholar"><a href="${cit.links[service]}" target="_blank">Google Scholar</a></span>`);
                            break;
                    }
                    linksEl += linksArray.join(" &#8226; ");
                }

                let keyEl = `
                <span class="bp3-menu-item-label zotero-roam-search-item-key">
                <a href="https://doi.org/${cit.doi}" target="_blank" class="bp3-text-muted zotero-roam-citation-doi-link">${cit.doi}</a>
                ${cit.abstract ? zoteroRoam.utils.renderBP3Button_group("Show Abstract", {buttonClass: "zotero-roam-citation-toggle-abstract bp3-minimal"}) : ""}
                ${zoteroRoam.utils.renderBP3Button_group("Copy DOI", {buttonClass: "zotero-roam-citation-copy-doi bp3-small bp3-outlined", buttonAttribute: 'data-doi="' + cit.doi + '"'})}
                ${zoteroRoam.utils.renderBP3Button_group("Add to Zotero", {buttonClass: "zotero-roam-citation-add-import bp3-small bp3-outlined bp3-intent-primary", icon: "inheritance"})}
                </span>
                `;

                return `
                <li class="zotero-roam-citations-search_result" ${cit.inLibrary ? 'in-library="true"' : ""}>
                <div class="bp3-menu-item">
                <div class="bp3-text-overflow-ellipsis bp3-fill zotero-roam-citation-metadata">
                ${titleEl}
                ${metaEl}
                <span class="zotero-roam-citation-links-list">
                ${linksEl}
                </span>
                </div>
                ${keyEl}
                <span class="zotero-roam-citation-abstract" style="display:none;">${cit.abstract}</span>
                </div></li>
                `
            }).join("");

            // Adding interaction
            // Copy-to-clipboard buttons for DOIs
            try{
                let copyDOIBtns = Array.from(paginationDiv.querySelectorAll('button.zotero-roam-citation-copy-doi'));
                if(copyDOIBtns.length > 0){
                    for(const btn of copyDOIBtns){
                        btn.addEventListener("click", function(){
                            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = btn.dataset.doi;
                            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').select();
                            document.execCommand("copy");
                        })
                    }
                }
            }catch(e){};
            // Toggles for abstracts
            try{
                let abstractToggles = Array.from(paginationDiv.querySelectorAll("button.zotero-roam-citation-toggle-abstract"));
                if(abstractToggles.length > 0){
                    for(const togg of abstractToggles){
                        togg.addEventListener("click", function(){
                            let toggleText = togg.querySelector('.bp3-button-text');
                            let abstractSpan = togg.closest('.zotero-roam-citations-search_result').querySelector('.zotero-roam-citation-abstract');
                            if(abstractSpan.style.display == "none"){
                                abstractSpan.style.display = "block";
                                toggleText.innerHTML = `Hide Abstract`;
                            } else{
                                abstractSpan.style.display = "none";
                                toggleText.innerHTML = `Show Abstract`;
                            }
                        });
                        
                    }
                }
            }catch(e){};
            // Add to Import buttons
            try{
                let addToImportBtns = Array.from(paginationDiv.querySelectorAll("button.zotero-roam-citation-add-import"));
                if(addToImportBtns.length > 0){
                    for(const btn of addToImportBtns){
                        btn.addEventListener("click", function(){
                            zoteroRoam.interface.addToImport(element = btn.closest(".bp3-menu-item"));
                        })
                    }
                }
            }catch(e){};

        },

        setupContextMenus(elementsKeys){
            window.addEventListener("click", e => {
                elementsKeys.forEach(key => {
                    if(zoteroRoam.interface[`${key}`].visible){
                        zoteroRoam.interface.toggleContextOverlay(key, command = "hide");
                    }
                })
            });

            elementsKeys.forEach(key => {
                zoteroRoam.interface[`${key}`].options.list.forEach( (op, index) => {
                    switch(zoteroRoam.interface[`${key}`].options.labels[index]){
                        case "Import Zotero data to page":
                            op.addEventListener("click", () => { zoteroRoam.handlers.addItemData(zoteroRoam.interface.contextMenu.targetElement) })
                            break;
                        case "Convert to citation":
                            op.addEventListener("click", () => { zoteroRoam.inPage.convertToCitekey(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "Check for citing papers":
                            op.addEventListener("click", () => { zoteroRoam.handlers.checkForScitations(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "View item information":
                            op.addEventListener("click", () => { zoteroRoam.interface.popItemInformation(zoteroRoam.interface.contextMenu.targetElement) });
                            break;
                        case "Update Zotero data":
                            op.addEventListener("click", zoteroRoam.extension.update)
                            break;
                        case "Search in dataset...":
                            op.addEventListener("click", () => { zoteroRoam.interface.toggleSearchOverlay("show") });
                    }
                })
            })
        },

        toggleContextOverlay(elementKey, command){
            zoteroRoam.interface[`${elementKey}`].overlay.div.style.display = (command == "show") ? "block" : "none";
            zoteroRoam.interface[`${elementKey}`].visible = (command == "show") ? true : false;
        },

        async toggleSearchOverlay(command, {focus = true} = {}) {
            zoteroRoam.interface.search.overlay.style.display = command === "show" ? "block" : "none";
            if (command == "show") {
                console.log("Opening the Search Panel")
                if(focus == true){
                    await zoteroRoam.utils.sleep(75);
                    zoteroRoam.interface.search.input.focus();
                }
                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                zoteroRoam.interface.search.input.value = "";
                zoteroRoam.interface.search.overlay.setAttribute("overlay-visible", "true");
            } else {
                console.log("Closing the Search Panel")
                zoteroRoam.interface.clearSelectedItem();
                document.querySelector(".zotero-roam-library-results-count").innerHTML = ``;
                zoteroRoam.interface.search.input.value = "";
                zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = "";
                zoteroRoam.interface.search.overlay.setAttribute("overlay-visible", "false");
            }
        },

        changePage(goto){
            if(zoteroRoam.citations.pagination !== null){
                if(zoteroRoam.citations.pagination.nbPages > 0){
                    switch(goto){
                    case "previous":
                        zoteroRoam.citations.pagination.previousPage();
                        break;
                    case "next":
                        zoteroRoam.citations.pagination.nextPage();
                        break;
                    }
                }
            }
        },

        popCitationsOverlay(doi){
            zoteroRoam.citations.currentDOI = doi;
            // All citations -- paginated
            let fullData = zoteroRoam.data.scite.find(item => item.doi == doi).simplified;
            zoteroRoam.citations.pagination = new zoteroRoam.Pagination({data: fullData});
            // Render HTML for pagination
            zoteroRoam.interface.renderCitationsPagination();
            // Setup autocomplete
            if(zoteroRoam.citations.autocomplete == null){
                // zoteroRoam.config.citationsSearch.resultsList.maxResults = zoteroRoam.data.items.length;
                zoteroRoam.citations.autocomplete = new autoComplete(zoteroRoam.config.citationsSearch);
            } else {
                zoteroRoam.citations.autocomplete.init();
            }
            // Make overlay visible
            zoteroRoam.interface.citations.overlay.style.display = "block";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "true");
            zoteroRoam.interface.citations.input.focus();
        },

        closeCitationsOverlay(){
            zoteroRoam.interface.citations.overlay.style.display = "none";
            zoteroRoam.interface.citations.input.value = "";
            zoteroRoam.interface.citations.overlay.querySelector('input.clipboard-copy-utility').value = "";
            zoteroRoam.interface.clearImportPanel();
            zoteroRoam.interface.citations.overlay.setAttribute("overlay-visible", "false");
        },

        popContextOverlay(e, elementKey){
            e.preventDefault();
            const origin = {
                left: e.pageX,
                top: e.pageY
            };
            zoteroRoam.interface[`${elementKey}`].position(origin);
            if(elementKey == "contextMenu"){ zoteroRoam.interface.contextMenu.targetElement = e.target; };
            return false;
        },

        async popContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "contextMenu");
            await zoteroRoam.utils.sleep(200);
            try{
                // Hide default Roam context menu
                document.querySelector('body > .bp3-context-menu+.bp3-portal').style.display = "none";
            } catch(e){};
        },

        popIconContextMenu(e){
            zoteroRoam.interface.popContextOverlay(e, "iconContextMenu");
        },

        popItemInformation(refSpan){
            let citekey = refSpan.parentElement.dataset.linkTitle.replace("@", "");
            zoteroRoam.interface.renderItemInPanel(citekey);
        },

        renderItemInPanel(citekey){
            let itemKey = citekey.startsWith('@') ? citekey : '@' + citekey;
            let selectedItem = zoteroRoam.data.items.find(it => it.key == itemKey.slice(1));

            let itemYear = (selectedItem.meta.parsedDate) ? ` (${(new Date(selectedItem.meta.parsedDate)).getUTCFullYear().toString()})` : "";

            // Generate list of authors as bp3 tags or Roam page references
            let infoAuthors = selectedItem.data.creators.map(c => {return (c.name) ? c.name : [c.firstName, c.lastName].filter(Boolean).join(" ")});
            let infoRolesAuthors = selectedItem.data.creators.map(c => c.creatorType);
            let divAuthors = "";
            if(infoAuthors.length > 0){
                for(i=0; i < infoAuthors.length; i++){
                    let authorInGraph = zoteroRoam.utils.lookForPage(title = infoAuthors[i]);
                    let authorElem = (authorInGraph.present == true) ? zoteroRoam.utils.renderPageReference(title = infoAuthors[i], uid = authorInGraph.uid) : zoteroRoam.utils.renderBP3Tag(string = infoAuthors[i], {modifier: "bp3-intent-primary item-creator-tag"});
                    let authorRole = (infoRolesAuthors[i] && infoRolesAuthors[i] != "author") ? (` (${infoRolesAuthors[i]})`) : "";
                    divAuthors = divAuthors + authorElem + authorRole;
                    if(i < infoAuthors.length - 2){
                        divAuthors = divAuthors + ", ";
                    } else if(i == infoAuthors.length - 2){
                        divAuthors = divAuthors + " & ";
                    }
                }
            }

            // Generate list of tags as bp3 tags or Roam tags
            let infoTags = selectedItem.data.tags.map(t => t.tag);
            let divTags = "";
            if(infoTags.length > 0){
                divTags = `<strong>Tags : </strong>`;
                for(i=0; i < infoTags.length; i++){
                    let tagInGraph = zoteroRoam.utils.lookForPage(title = infoTags[i]);
                    let tagElem = (tagInGraph.present == true) ? zoteroRoam.utils.renderPageTag(title = infoTags[i]) : zoteroRoam.utils.renderBP3Tag(string = infoTags[i]);
                    divTags = divTags + tagElem + " ";
                }
            }

            // Generate list of collections (names) as bp3 tags
            let infoCollections = zoteroRoam.formatting.getItemCollections(selectedItem);
            let divCollections = "";
            if(infoCollections){
                divCollections = `<strong>Collections : </strong>`;
                try {
                    divCollections += infoCollections.map(collec => zoteroRoam.utils.renderBP3Tag(string = collec.data.name, { modifier: "bp3-intent-success bp3-round", icon: "projects" })).join(" ");
                } catch(e){
                    console.log(infoCollections);
                    console.log(e);
                    console.error("Something went wrong while getting the item's collections data");
                }
            }

            // Information about the item
            let pageInGraph = zoteroRoam.utils.lookForPage(itemKey);
            let iconName = (pageInGraph.present == true) ? "tick" : "cross";
            let iconIntent = (pageInGraph.present == true) ? "success" : "danger";
            let itemInfo = (pageInGraph.present == true) ? `In the graph` : "Not in the graph";
            if(pageInGraph.present == true){
                try{
                    let nbChildren = window.roamAlphaAPI.q('[:find (count ?chld) :in $ ?uid :where[?p :block/uid ?uid][?p :block/children ?chld]]', pageInGraph.uid)[0][0];
                    itemInfo = itemInfo + ` (<b>${nbChildren}</b> direct children)`;
                } catch(e){};
            }
            let itemInGraph = `
            <div class="item-in-graph">
            <span class="bp3-icon-${iconName} bp3-icon bp3-intent-${iconIntent}"></span>
            <span> ${itemInfo}</span></div>
            `;
            
            // Render the header section
            let headerDiv = document.querySelector(".selected-item-header");
            headerDiv.innerHTML = `
            <div class="item-basic-metadata">
                <h4 class="item-title" tabindex="0">${selectedItem.data.title || ""}${itemYear}</h4>
                <p class="item-metadata-string">${divAuthors}${zoteroRoam.utils.makeMetaString(selectedItem)}</p>
                </div>
            <div class="item-citekey-section">
                <div class="bp3-fill citekey-element">${itemKey}</div>
                <div class="bp3-button-group bp3-fill bp3-minimal copy-buttons">
                    <a class="bp3-button bp3-intent-primary" format="citekey">Copy @citekey ${(zoteroRoam.shortcuts.sequences["copyCitekey"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitekey") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="citation">[Citation]([[@]]) ${(zoteroRoam.shortcuts.sequences["copyCitation"]) ? zoteroRoam.shortcuts.makeSequenceText("copyCitation") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="tag">#@ ${(zoteroRoam.shortcuts.sequences["copyTag"]) ? zoteroRoam.shortcuts.makeSequenceText("copyTag") : ""}</a>
                    <a class="bp3-button bp3-intent-primary" format="page-reference">[[@]] ${(zoteroRoam.shortcuts.sequences["copyPageRef"]) ? zoteroRoam.shortcuts.makeSequenceText("copyPageRef") : ""}</a>
                </div>
                ${itemInGraph}
            </div>
            `;

            // Render the graph info section
            let bodyDiv = document.querySelector(".selected-item-body");

            let openWebElement = ``;
            if(selectedItem.data.DOI && selectedItem.data.DOI.startsWith("10.")){
                let target = `https://doi.org/${selectedItem.data.DOI}`;
                openWebElement = zoteroRoam.utils.renderBP3Button_link(string = "Open in browser", {linkClass: "bp3-minimal bp3-fill bp3-align-left item-open-in-browser", icon: "share", iconModifier: "bp3-intent-primary", target: target, linkAttribute: `target="_blank"`});
            } else if(selectedItem.data.url){
                openWebElement = zoteroRoam.utils.renderBP3Button_link(string = "Open in browser", {linkClass: "bp3-minimal bp3-fill bp3-align-left item-open-in-browser", icon: "share", iconModifier: "bp3-intent-primary", target: selectedItem.data.url, linkAttribute: `target="_blank"`});
            }
            
            let goToPageModifier = (pageInGraph.present == true) ? `data-uid="${pageInGraph.uid}"` : "disabled";
            let goToPageSeq = (zoteroRoam.shortcuts.sequences["goToItemPage"]) ? zoteroRoam.shortcuts.makeSequenceText("goToItemPage", pre = " ") : "";
            let pageURL = (pageInGraph.present == true) ? `https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${pageInGraph.uid}` : "javascript:void(0)";
            let goToPage = `
            <div class="bp3-button-group bp3-minimal bp3-fill bp3-align-left">
            ${zoteroRoam.utils.renderBP3Button_link(string = "Go to Roam page" + goToPageSeq, {linkClass: "item-go-to-page", icon: "arrow-right", iconModifier: "bp3-intent-primary", target: pageURL, linkAttribute: goToPageModifier})}
            </div>
            `;

            let importSeq = (zoteroRoam.shortcuts.sequences["importMetadata"]) ? zoteroRoam.shortcuts.makeSequenceText("importMetadata", pre = " ") : "";
            let importText = `Import metadata  ${importSeq}`;
            let importButtonGroup = zoteroRoam.utils.renderBP3ButtonGroup(string = importText, { buttonClass: "item-add-metadata", divClass: "bp3-minimal bp3-fill bp3-align-left", icon: "add", modifier: "bp3-intent-primary" });

            // Check for children items
            let infoChildren = zoteroRoam.formatting.getItemChildren(selectedItem, { pdf_as: "raw", notes_as: "raw" });
            let childrenDiv = "";
            if(infoChildren.remoteChildren){
                childrenDiv += `<p>This item has children, but they were not returned by the API data request. This might be due to a request for 'items/top' rather than 'items'.</p>`;
            } else {
                try {
                    let pdfDiv = (!infoChildren.pdfItems) ? `No PDF attachments` : infoChildren.pdfItems.map(item => {
                        let libLoc = item.library.type == "group" ? `groups/${item.library.id}` : `library`;
                        let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/${libLoc}/items/${item.data.key}` : item.data.url;
                        let pdfTitle = item.data.filename || item.data.title;
                        return zoteroRoam.utils.renderBP3Button_link(string = pdfTitle, {linkClass: "bp3-minimal item-pdf-link", icon: "paperclip", target: pdfHref, linkAttribute: `target="_blank"` });
                    }).join("");
                    childrenDiv += pdfDiv;
                    
                    if(infoChildren.notes){
                        let toggleNotesSeq = (zoteroRoam.shortcuts.sequences["toggleNotes"]) ? zoteroRoam.shortcuts.makeSequenceText("toggleNotes", pre = " ") : "";
                        childrenDiv += `${zoteroRoam.utils.renderBP3Button_group(string = `Show Notes` + toggleNotesSeq, {buttonClass: "bp3-minimal bp3-align-left bp3-fill item-see-notes", icon: "comment"})}`;
                        zoteroRoam.interface.search.overlay.querySelector(".side-panel-contents").innerHTML = `
                        <h4>Notes</h4>
                        <div class="item-rendered-notes">
                            ${ infoChildren.notes.map(n => n.data.note).join("<br>") }
                        </div>
                        `
                    }
                } catch(e){
                    console.log(infoChildren);
                    console.log(pdfDiv);
                    console.log(e);
                    console.log("Something went wrong while getting the item's children data");
                }
            }

            bodyDiv.innerHTML = `
            <div class="item-additional-metadata">
                <p class="item-abstract bp3-running-text bp3-text-small bp3-blockquote">${selectedItem.data.abstractNote}</p>
                <p class="item-tags">${divTags}</p>
                <p class="item-collections">${divCollections}</p>
            </div>
            <div class="item-actions">
                <div class="bp3-card">
                    ${openWebElement}
                    ${goToPage}
                    ${importButtonGroup}
                </div>
                <div class="item-pdf-notes">
                    ${childrenDiv}
                </div>
            </div>
            `;

            // Add event listeners to action buttons
            let pageUID = (pageInGraph.uid) ? pageInGraph.uid : "";
            document.querySelector("button.item-add-metadata").addEventListener("click", function(){
                console.log("Importing metadata...");
                zoteroRoam.handlers.addSearchResult(itemKey, pageUID, {popup: true});
            });

            Array.from(document.querySelectorAll('.item-citekey-section .copy-buttons a.bp3-button[format]')).forEach(btn => {
                btn.addEventListener("click", (e) => {
                    switch(btn.getAttribute('format')){
                        case 'citekey':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `${itemKey}`;
                            break;
                        case 'citation':
                            let citationText = `${selectedItem.meta.creatorSummary || ""}${itemYear || ""}`;
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `[${citationText}]([[${itemKey}]])`;
                            break;
                        case 'tag':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `#[[${itemKey}]]`;
                            break;
                        case 'page-reference':
                            zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').value = `[[${itemKey}]]`;
                    };
                    zoteroRoam.interface.search.overlay.querySelector('input.clipboard-copy-utility').select();
                    document.execCommand("copy");
                })
            });
            try{
                let notesButton = document.querySelector("button.item-see-notes");
                notesButton.addEventListener("click", function(){
                    let currentHTML = notesButton.querySelector('.bp3-button-text').innerHTML;
                    switch(true){
                        case (currentHTML.startsWith("Show")):
                            zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "visible");
                            notesButton.querySelector('.bp3-button-text').innerHTML = currentHTML.replace("Show", "Hide");
                            break;
                        case (currentHTML.startsWith("Hide")):
                            zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "hidden");
                            notesButton.querySelector('.bp3-button-text').innerHTML = currentHTML.replace("Hide", "Show");
                            break;
                    }
                });
            } catch(e){};

            // Finally, make the div visible
            document.querySelector("#zotero-roam-library-rendered").setAttribute("view", "item");
            switch(zoteroRoam.interface.search.overlay.getAttribute("overlay-visible")){
                case "true":
                    document.querySelector('h4.item-title').focus();
                    break;
                case "false":
                    zoteroRoam.interface.toggleSearchOverlay("show", {focus: false});
            }

        },

        clearSelectedItem(){
            try {
                zoteroRoam.interface.search.selectedItemDiv.children.forEach(c => {c.innerHTML = ``});
            } catch(e){
                Array.from(zoteroRoam.interface.search.selectedItemDiv.children).forEach(c => {c.innerHTML = ``});
            }
            zoteroRoam.interface.search.overlay.querySelector(".side-panel-contents").innerHTML = ``;
            if(zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").getAttribute("side-panel") == "visible"){
                zoteroRoam.interface.search.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "hidden");
            }
            document.querySelector("#zotero-roam-library-rendered").setAttribute("view", "search");
        },

        // Detect if a block is currently being edited
        checkEditingMode(){
            let textArea = document.querySelector("textarea.rm-block-input");
            if (!textArea || textArea.getAttribute("zotero-tribute") != null) return;

            document.querySelectorAll('.zotero-roam-tribute').forEach(d=>d.remove());

            textArea.setAttribute("zotero-tribute", "active");

            var tribute = new Tribute(zoteroRoam.config.tribute);
            tribute.attach(textArea);

            textArea.addEventListener('tribute-replaced', (e) => {
                let textArea = document.querySelector('textarea.rm-block-input');
                let trigger = e.detail.context.mentionTriggerChar + e.detail.context.mentionText;
                let triggerPos = e.detail.context.mentionPosition;

                let replacement = e.detail.item.original.value;
                let blockContents = e.target.defaultValue;

                let escapedTrigger = zoteroRoam.utils.escapeRegExp(trigger);
                let triggerRegex = new RegExp(escapedTrigger, 'g');
                let newText = blockContents.replaceAll(triggerRegex, (match, pos) => (pos == triggerPos) ? replacement : match );

                // Store info about the replacement, to help debug
                zoteroRoam.interface.tributeTrigger = trigger;
                zoteroRoam.interface.tributeBlockTrigger = textArea;
                zoteroRoam.interface.tributeNewText = newText;

                var setValue = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
                setValue.call(textArea, newText);

                var ev = new Event('input', { bubbles: true });
                textArea.dispatchEvent(ev);
            });

        },

        addToImport(element){
            let identifier = element.querySelector(".zotero-roam-citation-doi-link").innerText;
            let title = element.querySelector(".zotero-roam-search-item-title").innerText;
            let origin = element.querySelector(".zotero-roam-citation-origin").innerText;

            if(zoteroRoam.interface.activeImport == null){
                zoteroRoam.interface.activeImport = {
                    libraries: zoteroRoam.utils.getLibraries(),
                    items: [],
                    currentLib: {}
                }
                zoteroRoam.interface.renderImportOptions();
                zoteroRoam.interface.addToImport(element);
                zoteroRoam.interface.citations.overlay.querySelector(".import-button").removeAttribute("disabled");
                zoteroRoam.interface.citations.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "visible");
            } else {
                if(!zoteroRoam.interface.activeImport.items.includes(identifier)){
                    zoteroRoam.interface.activeImport.items.push(identifier);
                    zoteroRoam.interface.citations.overlay.querySelector(".import-items").innerHTML += `<li><strong>${title}</strong>${origin}</li>`;
                }
            }
        },

        renderImportOptions(){
            let libs = zoteroRoam.interface.activeImport.libraries;
            let optionsLib = zoteroRoam.utils.renderBP3_list(libs, "radio", {varName: "library", has_value: "path", has_string: "name", selectFirst: true, active_if: "writeable"});
            let optionsColl = "";
            if(libs[0].writeable == true){
                zoteroRoam.interface.activeImport.currentLib = libs[0];
                optionsColl = zoteroRoam.utils.renderBP3_list(libs[0].collections.map(cl => {return{name: cl.data.name, key: cl.key}}), "checkbox", {varName: "collections", has_value: "key", has_string: "name"});
            }

            zoteroRoam.interface.citations.overlay.querySelector(".options-library-list").innerHTML = optionsLib;
            zoteroRoam.interface.citations.overlay.querySelector(".options-collections-list").innerHTML = optionsColl;

            Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(`input[name="library"]`)).forEach(el => addEventListener("click", zoteroRoam.interface.selectImportLibrary));

            
        },

        selectImportLibrary(){
            let currentLoc = zoteroRoam.interface.activeImport.currentLib.path;
            let newLoc = Array.from(zoteroRoam.interface.citations.overlay.querySelectorAll(`.options-library [name="library"]`)).find(op => op.checked == true).value;
            if(newLoc != currentLoc){
                zoteroRoam.interface.activeImport.currentLib = zoteroRoam.interface.activeImport.libraries.find(lib => lib.path == newLoc);
                let optionsColl = zoteroRoam.utils.renderBP3_list(zoteroRoam.interface.activeImport.currentLib.collections.map(cl => {return{name: cl.data.name, key: cl.key}}), "checkbox", {varName: "collections", has_value: "key", has_string: "name"});
                zoteroRoam.interface.citations.overlay.querySelector(".options-collections-list").innerHTML = optionsColl;
            }

        },

        clearImportPanel(){
            zoteroRoam.interface.citations.overlay.querySelector(".bp3-dialog").setAttribute("side-panel", "hidden");

            zoteroRoam.interface.activeImport = null;
            zoteroRoam.interface.citations.overlay.querySelector(".import-button").setAttribute("disabled", "");
            zoteroRoam.interface.citations.overlay.querySelector(".options-library-list").innerHTML = ``;
            zoteroRoam.interface.citations.overlay.querySelector(".options-collections-list").innerHTML = ``;
            zoteroRoam.interface.citations.overlay.querySelector(".import-items").innerHTML = ``;

        }
    }
})();
