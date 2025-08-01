
<a name="v1.1.0"></a>
## [v1.1.0](https://github.com/aleyoscar/groctxt/compare/v1.0.1...v1.1.0) (2025-07-23)

### Bug Fixes

* **core:** Quit script on process fail
* **core:** Removed quotes from commit message
* **web:** Moved openlist to render. Fixes [#31](https://github.com/aleyoscar/groctxt/issues/31)

### Code Refactoring

* **core:** Migrated gen-chglog scripts to python
* **web:** Moved webmanifest. Added version query
* **web:** Removed obsolete search check

### Features

* **web:** Added service worker
* **web:** Added version query to images


<a name="v1.0.1"></a>
## [v1.0.1](https://github.com/aleyoscar/groctxt/compare/v1.0.0...v1.0.1) (2025-07-22)

### Bug Fixes

* **web:** Show task line number instead of id in edit form
* **web:** Fixed autocomplete edit. Reorganized functions. Fixes [#34](https://github.com/aleyoscar/groctxt/issues/34)
* **web:** Rename compose file and exclude from git

### Code Refactoring

* **core:** Migrate version update to pb
* **web:** Remove console log
* **web:** Switch to proper getter function for raw description

### Features

* **core:** Added powershell gen-chglog script
* **web:** Add windows pb executable


<a name="v1.0.0"></a>
## [v1.0.0](https://github.com/aleyoscar/groctxt/compare/v0.3.2...v1.0.0) (2025-07-22)

### Code Refactoring

* **core:** Migrate gen-chglog to pb
* **core:** Migrate compose to pb
* **core:** Removed python files
* **docs:** Migrate README to pb
* **web:** Migrate delete to pb
* **web:** Migrate complete task to pb
* **web:** Changed filterComplete & sortComplete to showComplete
* **web:** Migrate add/edit task to pb
* **web:** Migrate task listing to pb
* **web:** Restructured form submit
* **web:** Migrate settings to pb
* **web:** Migrate templates into index.html
* **web:** Migrate static files to pb

### Features

* **web:** Always sort by todo.txt standards
* **web:** Added id and raw_description to todotxt library
* **web:** Moved debug to state. Created helper function
* **web:** Created state variable
* **web:** Added debug option
* **web:** Migrate auth from flask to pb. Added auth-less option
* **web:** Added pocketbase v0.28.4 as backend
* **web:** Renamed project to GoDo.txt


<a name="v0.3.2"></a>
## [v0.3.2](https://github.com/aleyoscar/groctxt/compare/v0.3.1...v0.3.2) (2025-07-02)

### Bug Fixes

* **web:** Clearer submit filter text
* **web:** Actually fixes [#29](https://github.com/aleyoscar/groctxt/issues/29)

### Code Refactoring

* **web:** Projects and contexts in one object
* **web:** Alphabetical DOM variables

### Features

* **web:** Group tasks by priority/projects/contexts. Closes [#23](https://github.com/aleyoscar/groctxt/issues/23)


<a name="v0.3.1"></a>
## [v0.3.1](https://github.com/aleyoscar/groctxt/compare/v0.3.0...v0.3.1) (2025-06-30)

### Bug Fixes

* **web:** Clear all checked filters. Fixes [#30](https://github.com/aleyoscar/groctxt/issues/30)
* **web:** Close autocomplete when editing task
* **web:** Set cursor to end for firefox. Fixes [#29](https://github.com/aleyoscar/groctxt/issues/29)
* **web:** Settings modal missing. Fixes [#28](https://github.com/aleyoscar/groctxt/issues/28)
* **web:** Menu icon not showing on mobile. Fixes [#27](https://github.com/aleyoscar/groctxt/issues/27)


<a name="v0.3.0"></a>
## [v0.3.0](https://github.com/aleyoscar/groctxt/compare/v0.2.0...v0.3.0) (2025-06-27)

### Bug Fixes

* **web:** Main tasks list not opening correctly
* **web:** preventDefault only after key identified

### Code Refactoring

* **web:** Improved efficiency and removed redundancy with AI

### Features

* **web:** Don't include current task in autocomplete options
* **web:** Use description instead of raw for autocomplete
* **web:** Edit button for tab vs enter autocomplete for mobile


<a name="v0.2.0"></a>
## [v0.2.0](https://github.com/aleyoscar/groctxt/compare/v0.1.0...v0.2.0) (2025-06-27)

### Bug Fixes

* **core:** Remove unused git-chglog filters
* **web:** Autocomplete for tags in the middle
* **web:** no-list showing with tasks hash
* **web:** Edit task modal title
* **web:** Fixed add button on custom lists. Fixes [#26](https://github.com/aleyoscar/groctxt/issues/26)
* **web:** Check if DOM elements exist before adding listeners
* **web:** Center '+' icon in add button. Closes [#25](https://github.com/aleyoscar/groctxt/issues/25)

### Code Refactoring

* **web:** Consolidated add and edit forms
* **web:** Main task list shows all tasks
* **web:** Renamed edit modal and form
* **web:** Changed template extensions to jinja
* **web:** Functions to load and save settings

### Features

* **core:** Update version info with new tag
* **docs:** Add link to releases page in README
* **web:** Autocomplete for projects/contexts
* **web:** Project/context tags show below description. Closes [#24](https://github.com/aleyoscar/groctxt/issues/24)
* **web:** Add version parameter to static assets
* **web:** Open lists from url hash. Closes [#22](https://github.com/aleyoscar/groctxt/issues/22)
* **web:** Added loading indicator. Closes [#16](https://github.com/aleyoscar/groctxt/issues/16)
* **web:** Persistent login


<a name="v0.1.0"></a>
## v0.1.0 (2025-05-22)

### Bug Fixes

* **docs:** Revised README for clarity.
* **web:** Create todo.txt file if it doesn't exist
* **web:** Aligned task list title & styled add task button
* **web:** Changed filter attribute modal button
* **web:** Check if modal has input to focus on
* **web:** Added '-' to characters for projects/contexts
* **web:** Date showing as local time instead of UTC
* **web:** API delete syntax error
* **web:** Add creation date to tasks without one
* **web:** Edit task showing bare description without attributes
* **web:** Remove priority if task is completed
* **web:** Line up task items with checkboxes. Provide gap
* **web:** Scroll filters horizontally. Fixes [#3](https://github.com/aleyoscar/groctxt/issues/3)
* **web:** Update search form and header. Closes [#2](https://github.com/aleyoscar/groctxt/issues/2) and fixes [#1](https://github.com/aleyoscar/groctxt/issues/1)
* **web:** Removed padding from lists
* **web:** Fixed sorting and filtering after refactor

### Code Refactoring

* **web:** Move modal to separate html
* **web:** Cleanup and organize
* **web:** Search immediately on input
* **web:** Updated favicon
* **web:** Changed to simpler layout with modals

### Features

* **core:** Added git-chglog and github workflow for tagging.
* **core:** Added docker image
* **core:** Removing obsolete 'version' from compose file
* **core:** Load dotenv for development
* **core:** Specify container port in .env
* **core:** Added container name and restart
* **docs:** First pass at README. Added example env and settings.
* **web:** Highlight projects and contexts. Closes [#5](https://github.com/aleyoscar/groctxt/issues/5) & closes [#8](https://github.com/aleyoscar/groctxt/issues/8)
* **web:** Clear forms after closing modal
* **web:** Filter by projects and contexts. Closes [#14](https://github.com/aleyoscar/groctxt/issues/14)
* **web:** Autocomplete & switch to edit existing. Closes [#6](https://github.com/aleyoscar/groctxt/issues/6)
* **web:** Moved input order and set focus on modal open
* **web:** Added created/completed dates to tasks
* **web:** Sort by description then by special. Closes [#7](https://github.com/aleyoscar/groctxt/issues/7)
* **web:** Added custom separated lists & settings. Closes [#17](https://github.com/aleyoscar/groctxt/issues/17)
* **web:** Added logo to login and index
* **web:** Moved head html to base template. Closes [#13](https://github.com/aleyoscar/groctxt/issues/13)
* **web:** Add favicon. Closes [#12](https://github.com/aleyoscar/groctxt/issues/12)
* **web:** Add show all button. Closes [#11](https://github.com/aleyoscar/groctxt/issues/11)
* **web:** Added setting to sort completed to bottom. Closes [#20](https://github.com/aleyoscar/groctxt/issues/20)
* **web:** Flipped states for completed filter button. Closes [#10](https://github.com/aleyoscar/groctxt/issues/10)
* **web:** Select priority from a list. Closes [#9](https://github.com/aleyoscar/groctxt/issues/9)
* **web:** Style completed tasks. Closes [#4](https://github.com/aleyoscar/groctxt/issues/4)
* **web:** Move settings to frontend. Add delete all. Closes [#15](https://github.com/aleyoscar/groctxt/issues/15)
* **web:** Hover style for tasks
* **web:** Delete all completed tasks. Closes [#15](https://github.com/aleyoscar/groctxt/issues/15)
* **web:** Single user authentication
* **web:** Added max width to search bar
* **web:** Added styling to priorities
* **web:** Styling for table head
* **web:** Filter completed tasks

