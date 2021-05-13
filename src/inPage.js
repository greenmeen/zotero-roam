;(()=>{
    zoteroRoam.inPage = {

        addContextMenuListener() {
            var refCitekeys = document.querySelectorAll(".ref-citekey");
            for (var i = 0; i < refCitekeys.length; i++) {
                var ref = refCitekeys[i];
        
                // Handle case where item hasn't been checked against data yet
                if(!ref.dataset.zoteroBib){
                    if(zoteroRoam.data.items.find(libItem => libItem.key == ref.dataset.linkTitle.replace("@", ""))){
                        ref.dataset.zoteroBib = "inLibrary";
                    } else {
                        ref.dataset.zoteroBib = "notFound";
                    }
                }
        
                // Only add a listener for context menu if the item has been found in the library
                if (ref.dataset.zoteroBib == "inLibrary") {
                    // Robust regardless of brackets
                        ref.querySelector('.rm-page-ref').addEventListener("contextmenu", zoteroRoam.interface.popContextMenu);
                }
            }
        },

        checkReferences(update = false){
            let refCitekeyFound = false;
            setTimeout(function(){
                do {
                    let refs = document.getElementsByClassName("rm-page-ref");
                    refCitekeyFound = zoteroRoam.inPage.identifyCitekeys(refs);
                } while (refCitekeyFound == true);
            }, 300);
            zoteroRoam.inPage.checkCitekeys(update = update);
            zoteroRoam.inPage.addContextMenuListener();
        },

        identifyCitekeys(refs){
            let matched = false;
            for (i = 0; i < refs.length; i++) {
                let parentDiv = refs[i].parentElement;
                if (typeof (parentDiv.dataset.linkTitle) === 'undefined') {
                    continue;
                } else {
                    // Only do this for page refs for now, we'll see about tags later or not at all
                    if (parentDiv.dataset.linkTitle.startsWith("@")) {
                        if (parentDiv.classList.contains("ref-citekey")) {
                            matched = false;
                        } else {
                            parentDiv.classList.add("ref-citekey");
                            matched = true;
                        }
                    }
                }
            }
            return matched;
        },

        checkCitekeys(update = false){
            let refCitekeys = document.querySelectorAll('.ref-citekey');
            let newMatches = 0;
            let newUnmatches = 0;

            refCitekeys.forEach(ref => {
                // References that have a data-zotero-bib attribute have already been checked -- use param `update` to see if we should check again
                if (ref.dataset.zoteroBib) {
                    // If `update` is set to 'false', we don't bother checking anything & continue
                    if(update == true){
                        // If `update` is set to 'true', if the item was previously "notFound", check it against the dataset again
                        // If the item was previously "inLibrary", we continue (it's implied by reaching the end of the if statement)
                        if(ref.dataset.zoteroBib == "notFound"){
                            if (zoteroRoam.data.items.find(item => item.key == ref.dataset.linkTitle.replace("@", ""))) {
                                ref.dataset.zoteroBib = "inLibrary";
                                newMatches = newMatches + 1;
                            } else {
                                // Otherwise count it as unmatch
                                newUnmatches = newUnmatches + 1;
                            }
                        }
                    }
                } else {
                    // For items that haven't been checked yet, look for their citekey in the dataset
                    ref.dataset.zoteroBib = (zoteroRoam.data.items.find(item => item.key == ref.dataset.linkTitle.replace("@", ""))) ? "inLibrary" : "notFound";
                    switch(ref.dataset.zoteroBib){
                        case "inLibrary":
                            newMatches += 1;
                            break;
                        case "notFound":
                            newUnmatches += 1;
                    }
                }
            })
            if(newMatches > 0 | newUnmatches > 0){
                console.log(`New matched citekeys: ${newMatches}, New unmatched citekeys: ${newUnmatches}`);
            }
        },

        convertToCitekey(el){
            let libItem = zoteroRoam.data.items.find(item => item.key == el.innerText.slice(1));
            let currentBlock = el.closest('.roam-block');
            // Find the UID of the ref-citekey's block
            let blockUID = currentBlock.id.slice(-9);
            // Find the index of the ref-citekey within the block
            let refIndex = Array.from(currentBlock.querySelectorAll('.ref-citekey')).findIndex(ref => ref == el.parentNode);

            let blockQuery = window.roamAlphaAPI.q('[:find ?text :in $ ?uid :where[?b :block/uid ?uid][?b :block/string ?text]]', blockUID)[0];
            if(blockQuery.length > 0){
                let contents = blockQuery[0];
                let replacementRegex = new RegExp(`(.*?(?:\\[\\[@.+?\\]\\].*?){${refIndex}})(\\[\\[@.+?\\]\\])(.*)`, 'g');
                let newContents = contents.replace(replacementRegex, (match, pre, refcitekey, post) => `${pre}${zoteroRoam.utils.formatItemReference(libItem, 'citation')}${post}`);
                window.roamAlphaAPI.updateBlock({'block': {'uid': blockUID, 'string': newContents}})
            }

        },

        async addPageMenus(){
            let openPages = Array.from(document.querySelectorAll("h1.rm-title-display"));
            for(const page of openPages) {
                let title = page.querySelector("span") ? page.querySelector("span").innerText : "";
                if(title.startsWith("@")){
                    let itemInLib = zoteroRoam.data.items.find(it => it.key == title.slice(1));
                    let pageInGraph = zoteroRoam.utils.lookForPage(title);
                    // If the item is in the library
                    if(typeof(itemInLib) !== 'undefined'){
                        let itemDOI = !itemInLib.data.DOI ? "" : zoteroRoam.utils.parseDOI(itemInLib.data.DOI);
                        // Check if div wrapper already exists, creates it otherwise
                        if(page.parentElement.querySelector(".zotero-roam-page-div") == null){
                            let pageDiv = document.createElement("div");
                            pageDiv.classList.add("zotero-roam-page-div");
                            page.parentElement.appendChild(pageDiv);
                        }

                        // Page menu
                        if(page.parentElement.querySelector(".zotero-roam-page-menu") == null){
                            let menuDiv = document.createElement("div");
                            menuDiv.classList.add("zotero-roam-page-menu");
                            menuDiv.classList.add("bp3-button-group");

                            page.parentElement.querySelector(".zotero-roam-page-div").appendChild(menuDiv);

                            let itemChildren = zoteroRoam.formatting.getItemChildren(itemInLib, { pdf_as: "raw", notes_as: "raw" });
                            let notesButton = !itemChildren.notes ? "" : zoteroRoam.utils.renderBP3Button_group(string = "Import notes", {buttonClass: "bp3-minimal zotero-roam-page-menu-import-notes", icon: "comment"});
                            let pdfButtons = !itemChildren.pdfItems ? "" : itemChildren.pdfItems.map(item => {
                                let pdfHref = (["linked_file", "imported_file", "imported_url"].includes(item.data.linkMode)) ? `zotero://open-pdf/library/items/${item.data.key}` : item.data.url;
                                    let pdfLink = `<a href="${pdfHref}">${item.data.filename || item.data.title}</a>`;
                                    return zoteroRoam.utils.renderBP3Button_group(string = pdfLink, {buttonClass: "bp3-minimal", icon: "paperclip" });
                            }).join("");

                            let recordsButtons = [zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://www.connectedpapers.com/${(!itemInLib.data.DOI) ? "search?q=" + encodeURIComponent(itemInLib.data.title) : "api/redirect/doi/" + itemDOI}" target="_blank">Connected Papers</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-connected-papers", icon: "layout"}),
                                                (!itemInLib.data.DOI) ? "" : zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://api.semanticscholar.org/${itemDOI}" target="_blank">Semantic Scholar</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-semantic-scholar", icon: "bookmark"}),
                                                zoteroRoam.utils.renderBP3Button_group(string = `<a href="https://scholar.google.com/scholar?q=${(!itemInLib.data.DOI) ? encodeURIComponent(itemInLib.data.title) : itemDOI}" target="_blank">Google Scholar</a>`, {buttonClass: "bp3-minimal zotero-roam-page-menu-google-scholar", icon: "learning"})];

                            let backlinksLib = "";
                            if(itemInLib.data.DOI){
                                let scitations = await fetch(`https://api.scite.ai/papers/sources/${itemDOI}`);
                                let scitingPapers = await scitations.json();
                                let scitingDOIs = Object.keys(scitingPapers.papers);
                                
                                if(scitingDOIs.length > 0){
                                    let papersInLib = zoteroRoam.data.items.filter(it => scitingDOIs.includes(it.data.DOI));
                                    backlinksLib = zoteroRoam.utils.renderBP3Button_group(string = `${papersInLib.length > 0 ? "Show" : "No"} Backlinks (${papersInLib.length}/${scitingDOIs.length} citations in library)`, {buttonClass: "bp3-minimal bp3-intent-success zotero-roam-page-menu-backlinks-button", icon: "caret-down bp3-icon-standard rm-caret rm-caret-closed"});

                                    if(papersInLib.length > 0){
                                        backlinksLib += `
                                        <ul class="zotero-roam-page-menu-backlinks-list" style="display:none;">
                                        ${papersInLib.map(paper => {
                                            let pageInGraph = zoteroRoam.utils.lookForPage("@" + paper.key);
                                            return `<li class="zotero-roam-page-menu-backlinks-item"><a href="https://roamresearch.com/${window.location.hash.match(/#\/app\/([^\/]+)/g)[0]}/page/${pageInGraph.uid}">${zoteroRoam.utils.formatItemReference(paper, "zettlr")}</a></li>`;
                                        }).join("")}
                                        </ul>
                                        `
                                    }
                                }
                            }

                            menuDiv.innerHTML = `
                            ${zoteroRoam.utils.renderBP3Button_group(string = "Add metadata", {buttonClass: "bp3-minimal zotero-roam-page-menu-add-metadata", icon: "add"})}
                            ${notesButton}
                            ${pdfButtons}
                            ${recordsButtons.join("")}
                            ${backlinksLib}
                            `;

                            menuDiv.querySelector(".zotero-roam-page-menu-add-metadata").addEventListener("click", function(){
                                console.log("Importing metadata...");
                                zoteroRoam.handlers.addSearchResult(title, pageInGraph.uid);
                            });
                            try{
                                menuDiv.querySelector(".zotero-roam-page-menu-import-notes").addEventListener("click", function(){
                                    console.log("Adding notes...");
                                    zoteroRoam.handlers.addItemNotes(title = title, uid = pageInGraph.uid);
                                });
                            } catch(e){};
                            try{
                                let backlinksButton = menuDiv.querySelector(".zotero-roam-page-menu-backlinks-button");
                                backlinksButton.addEventListener("click", function(){
                                    // Change caret class & show the backlinks list
                                    let caretEl = backlinksButton.querySelector(".bp3-icon-caret-down");
                                    let backlinksList = backlinksButton.parentElement.querySelector(".zotero-roam-page-menu-backlinks-list");

                                    if(Array.from(caretEl.classList).includes("rm-caret-closed") && backlinksList){
                                        caretEl.classList.replace("rm-caret-closed", "rm-caret-open");
                                        backlinksList.style.display = "block";
                                    } else if(Array.from(caretEl.classList).includes("rm-caret-open")){
                                        caretEl.classList.replace("rm-caret-open", "rm-caret-closed");
                                        backlinksList.style.display = "none";
                                    }
                                })
                            } catch(e){};
                        }

                        // Badge from scite.ai
                        if(itemInLib.data.DOI && page.parentElement.querySelector(".scite-badge") == null){
                            let sciteBadge = zoteroRoam.inPage.makeSciteBadge(doi = itemDOI);
                            page.parentElement.querySelector(".zotero-roam-page-div").appendChild(sciteBadge);
                            // Manual trigger to insert badges
                            window.__SCITE.insertBadges();
                        }
                    }
                }
            };
        },

        makeSciteBadge(doi, {layout = "horizontal", showZero = "true", showLabels = "false"} = {}){
            let sciteBadge = document.createElement("div");
            sciteBadge.classList.add("scite-badge");
            sciteBadge.setAttribute("data-doi", doi);
            sciteBadge.setAttribute("data-layout", layout);
            sciteBadge.setAttribute("data-show-zero", showZero);
            sciteBadge.setAttribute("data-show-labels", showLabels);

            return sciteBadge;
        }
    }
})();
