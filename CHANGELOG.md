
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

