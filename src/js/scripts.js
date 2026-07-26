/*!
 * Strawberry Dataset site interactions
 */
(function () {
    'use strict';

    const year = document.getElementById('currentYear');
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const navigation = document.getElementById('primaryNavigation');
    if (!navigation || typeof bootstrap === 'undefined') {
        return;
    }

    navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992 && navigation.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(navigation).hide();
            }
        });
    });
})();
