import { STATE } from './state.js';

// CONFIG ---------------------------------------------------------------------

const CONFIG = {
	isOpenClass: 'modal-is-open',
	openingClass: 'modal-is-opening',
	closingClass: 'modal-is-closing',
	scrollbarWidthCssVar: '--pico-scrollbar-width',
	animationDuration: 400, // ms
};

// HELPERS --------------------------------------------------------------------

const getScrollbarWidth = () => window.innerWidth - document.documentElement.clientWidth;

// MODAL HANDLING -------------------------------------------------------------

export function toggleModal(event, currentTarget=null) {
	currentTarget = currentTarget ? currentTarget : event.currentTarget;
	event.preventDefault();
	const modal = document.getElementById(currentTarget.dataset.target);
	if (modal) modal.open ? closeModal(modal) : openModal(modal);
}

export function openModal(modal) {
	const scrollbarWidth = getScrollbarWidth();
	if (scrollbarWidth) document.documentElement.style.setProperty(CONFIG.scrollbarWidthCssVar, `${scrollbarWidth}px`);
	document.documentElement.classList.add(CONFIG.isOpenClass, CONFIG.openingClass);
	modal.showModal();
	setTimeout(() => {
		STATE.visibleModal = modal;
		document.documentElement.classList.remove(CONFIG.openingClass);
		modal.querySelector('.modal-focus')?.focus();
	}, CONFIG.animationDuration);
}

export function closeModal(modal) {
	STATE.visibleModal = null;
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
	if (!STATE.visibleModal) return;
	const isClickInside = event.target.closest('article, #autocomplete, [data-target], kbd b, .auto-tag');
	if (!isClickInside) closeModal(STATE.visibleModal);
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && STATE.visibleModal) closeModal(STATE.visibleModal);
});
