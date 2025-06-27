// CONFIG ---------------------------------------------------------------------

const CONFIG = {
	isOpenClass: 'modal-is-open',
	openingClass: 'modal-is-opening',
	closingClass: 'modal-is-closing',
	scrollbarWidthCssVar: '--pico-scrollbar-width',
	animationDuration: 400, // ms
};

let visibleModal = null;

// HELPERS --------------------------------------------------------------------

const getScrollbarWidth = () => window.innerWidth - document.documentElement.clientWidth;

// MODAL HANDLING -------------------------------------------------------------

function toggleModal(event) {
	event.preventDefault();
	const modal = document.getElementById(event.currentTarget.dataset.target);
	if (modal) modal.open ? closeModal(modal) : openModal(modal);
}

function openModal(modal) {
	const scrollbarWidth = getScrollbarWidth();
	if (scrollbarWidth) document.documentElement.style.setProperty(CONFIG.scrollbarWidthCssVar, `${scrollbarWidth}px`);
	document.documentElement.classList.add(CONFIG.isOpenClass, CONFIG.openingClass);
	modal.showModal();
	setTimeout(() => {
		visibleModal = modal;
		document.documentElement.classList.remove(CONFIG.openingClass);
		modal.querySelector('.modal-focus')?.focus();
	}, CONFIG.animationDuration);
}

function closeModal(modal) {
	visibleModal = null;
	document.documentElement.classList.add(CONFIG.closingClass);
	setTimeout(() => {
		document.documentElement.classList.remove(CONFIG.closingClass, CONFIG.isOpenClass);
		document.documentElement.style.removeProperty(CONFIG.scrollbarWidthCssVar);
		modal.close();
		modal.querySelector('form')?.reset();
	}, CONFIG.animationDuration);
}

// EVENT LISTENERS ------------------------------------------------------------

document.addEventListener('click', (event) => {
	if (!visibleModal) return;
	const isClickInside = event.target.closest('article, #autocomplete, [data-target], kbd b, .auto-tag');
	if (!isClickInside) closeModal(visibleModal);
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && visibleModal) closeModal(visibleModal);
});
