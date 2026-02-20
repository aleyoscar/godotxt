import { STATE } from './state.js';
import { getScrollbarWidth } from './utils.js';

export function toggleModal(event, currentTarget=null) {
	currentTarget = currentTarget ? currentTarget : event.currentTarget;
	event.preventDefault();
	const modal = document.getElementById(currentTarget.dataset.target);
	if (modal) modal.open ? closeModal(modal) : openModal(modal);
}

export function openModal(modal) {
	const scrollbarWidth = getScrollbarWidth();
	if (scrollbarWidth) document.documentElement.style.setProperty(STATE.scrollbarWidthCssVar, `${scrollbarWidth}px`);
	document.documentElement.classList.add(STATE.isOpenClass, STATE.openingClass);
	modal.showModal();
	setTimeout(() => {
		STATE.visibleModal = modal;
		document.documentElement.classList.remove(STATE.openingClass);
		modal.querySelector('.modal-focus')?.focus();
	}, STATE.animationDuration);
}

export function closeModal(modal) {
	STATE.visibleModal = null;
	document.documentElement.classList.add(STATE.closingClass);
	setTimeout(() => {
		document.documentElement.classList.remove(STATE.closingClass, STATE.isOpenClass);
		document.documentElement.style.removeProperty(STATE.scrollbarWidthCssVar);
		modal.close();
		modal.querySelector('form')?.reset();
	}, STATE.animationDuration);
}

export function closeModalOutside(e) {
	if (!STATE.visibleModal) return;
	const isClickInside = e.target.closest('article, #autocomplete, [data-target], kbd b, .auto-tag');
	if (!isClickInside) closeModal(STATE.visibleModal);
}
