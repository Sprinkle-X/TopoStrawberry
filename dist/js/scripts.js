/*!
* Strawberry Dataset website v1.0.0
* Project code licensed under MIT
*/
/*!
 * Strawberry Dataset site interactions
 */
(function () {
    'use strict';

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    const year = document.getElementById('currentYear');
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const navigation = document.getElementById('primaryNavigation');
    if (navigation && typeof bootstrap !== 'undefined') {
        navigation.querySelectorAll('a[href^="#"]').forEach((link) => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 992 && navigation.classList.contains('show')) {
                    bootstrap.Collapse.getOrCreateInstance(navigation).hide();
                }
            });
        });
    }

    const canvas = document.getElementById('pointcloudViewer');
    if (!canvas) {
        return;
    }

    const context = canvas.getContext('2d', { alpha: false });
    const loading = document.getElementById('pointcloudLoading');
    const fallback = document.getElementById('pointcloudFallback');
    const resetButton = document.getElementById('pointcloudReset');
    const state = {
        yaw: -0.58,
        pitch: 0.22,
        zoom: 1.15,
        panX: 0,
        panY: 0,
    };
    const initialState = { ...state };
    const pointers = new Map();
    let positions = null;
    let colorStyles = null;
    let pointCount = 0;
    let frameRequested = false;
    let pinchDistance = 0;
    let pinchMidpoint = null;

    function scheduleRender() {
        if (frameRequested || !positions) {
            return;
        }
        frameRequested = true;
        window.requestAnimationFrame(() => {
            frameRequested = false;
            renderPointCloud();
        });
    }

    function resizeCanvas() {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(bounds.width * pixelRatio));
        const height = Math.max(1, Math.round(bounds.height * pixelRatio));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            scheduleRender();
        }
    }

    function renderPointCloud() {
        const width = canvas.width;
        const height = canvas.height;
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        context.fillStyle = '#081521';
        context.fillRect(0, 0, width, height);

        context.strokeStyle = '#173246';
        context.lineWidth = Math.max(1, pixelRatio * 0.55);
        const gridSpacing = Math.max(60, Math.round(width / 10));
        for (let x = gridSpacing; x < width; x += gridSpacing) {
            context.beginPath();
            context.moveTo(x, 0);
            context.lineTo(x, height);
            context.stroke();
        }
        for (let y = gridSpacing; y < height; y += gridSpacing) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(width, y);
            context.stroke();
        }

        const cosineYaw = Math.cos(state.yaw);
        const sineYaw = Math.sin(state.yaw);
        const cosinePitch = Math.cos(state.pitch);
        const sinePitch = Math.sin(state.pitch);
        const projectionScale = Math.min(width, height) * 1.5 * state.zoom;
        const cameraDistance = 2.45;
        const projected = [];

        for (let index = 0; index < pointCount; index += 1) {
            const offset = index * 3;
            const x = positions[offset];
            const y = positions[offset + 1];
            const z = positions[offset + 2];
            const rotatedX = cosineYaw * x + sineYaw * z;
            const yawDepth = -sineYaw * x + cosineYaw * z;
            const rotatedY = cosinePitch * y - sinePitch * yawDepth;
            const rotatedDepth = sinePitch * y + cosinePitch * yawDepth;
            const depth = rotatedDepth + cameraDistance;
            if (depth <= 0.1) {
                continue;
            }
            const screenX = width / 2 + state.panX * pixelRatio + (rotatedX / depth) * projectionScale;
            const screenY = height / 2 + state.panY * pixelRatio - (rotatedY / depth) * projectionScale;
            if (screenX < -4 || screenX > width + 4 || screenY < -4 || screenY > height + 4) {
                continue;
            }
            projected.push([rotatedDepth, screenX, screenY, index, depth]);
        }

        projected.sort((a, b) => b[0] - a[0]);
        context.globalAlpha = 0.96;
        for (const point of projected) {
            const index = point[3];
            const size = clamp((2.8 / point[4]) * pixelRatio, 1.1 * pixelRatio, 2.6 * pixelRatio);
            context.fillStyle = colorStyles[index];
            context.fillRect(point[1], point[2], size, size);
        }
        context.globalAlpha = 1;
    }

    function resetView() {
        Object.assign(state, initialState);
        scheduleRender();
        canvas.focus({ preventScroll: true });
    }

    function pointerMidpoint(values) {
        return {
            x: (values[0].x + values[1].x) / 2,
            y: (values[0].y + values[1].y) / 2,
        };
    }

    function pointerDistance(values) {
        return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    }

    canvas.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        canvas.focus({ preventScroll: true });
        canvas.setPointerCapture(event.pointerId);
        pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
            mode: event.shiftKey || event.button === 2 ? 'pan' : 'rotate',
        });
        if (pointers.size === 2) {
            const values = Array.from(pointers.values());
            pinchDistance = pointerDistance(values);
            pinchMidpoint = pointerMidpoint(values);
        }
        canvas.classList.add('is-dragging');
    });

    canvas.addEventListener('pointermove', (event) => {
        const previous = pointers.get(event.pointerId);
        if (!previous) {
            return;
        }
        const current = {
            x: event.clientX,
            y: event.clientY,
            mode: previous.mode,
        };
        pointers.set(event.pointerId, current);

        if (pointers.size === 1) {
            const deltaX = current.x - previous.x;
            const deltaY = current.y - previous.y;
            if (current.mode === 'pan') {
                state.panX += deltaX;
                state.panY += deltaY;
            } else {
                state.yaw += deltaX * 0.007;
                state.pitch = clamp(state.pitch + deltaY * 0.007, -1.35, 1.35);
            }
        } else if (pointers.size === 2) {
            const values = Array.from(pointers.values());
            const distance = pointerDistance(values);
            const midpoint = pointerMidpoint(values);
            if (pinchDistance > 0) {
                state.zoom = clamp(state.zoom * (distance / pinchDistance), 0.45, 3.4);
            }
            if (pinchMidpoint) {
                state.panX += midpoint.x - pinchMidpoint.x;
                state.panY += midpoint.y - pinchMidpoint.y;
            }
            pinchDistance = distance;
            pinchMidpoint = midpoint;
        }
        scheduleRender();
    });

    function releasePointer(event) {
        pointers.delete(event.pointerId);
        if (pointers.size < 2) {
            pinchDistance = 0;
            pinchMidpoint = null;
        }
        if (pointers.size === 0) {
            canvas.classList.remove('is-dragging');
        }
    }

    canvas.addEventListener('pointerup', releasePointer);
    canvas.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener(
        'wheel',
        (event) => {
            event.preventDefault();
            state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.0012), 0.45, 3.4);
            scheduleRender();
        },
        { passive: false }
    );
    canvas.addEventListener('dblclick', resetView);
    canvas.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        let handled = true;
        if (key === 'arrowleft') state.yaw -= 0.08;
        else if (key === 'arrowright') state.yaw += 0.08;
        else if (key === 'arrowup') state.pitch = clamp(state.pitch - 0.08, -1.35, 1.35);
        else if (key === 'arrowdown') state.pitch = clamp(state.pitch + 0.08, -1.35, 1.35);
        else if (key === '+' || key === '=') state.zoom = clamp(state.zoom * 1.12, 0.45, 3.4);
        else if (key === '-' || key === '_') state.zoom = clamp(state.zoom / 1.12, 0.45, 3.4);
        else if (key === 'r' || key === 'home') resetView();
        else handled = false;
        if (handled) {
            event.preventDefault();
            scheduleRender();
        }
    });

    if (resetButton) {
        resetButton.addEventListener('click', resetView);
    }

    fetch(canvas.dataset.source)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Point-cloud request failed: ${response.status}`);
            }
            return response.json();
        })
        .then((payload) => {
            pointCount = payload.point_count;
            positions = new Float32Array(payload.positions);
            colorStyles = new Array(pointCount);
            for (let index = 0; index < pointCount; index += 1) {
                const offset = index * 3;
                colorStyles[index] = `rgb(${payload.colors[offset]},${payload.colors[offset + 1]},${payload.colors[offset + 2]})`;
            }
            if (loading) {
                loading.textContent = `${pointCount.toLocaleString()} points loaded · drag to explore`;
                window.setTimeout(() => loading.classList.add('is-hidden'), 900);
            }
            resizeCanvas();
            scheduleRender();
        })
        .catch(() => {
            canvas.hidden = true;
            if (fallback) {
                fallback.hidden = false;
            }
            if (loading) {
                loading.textContent = 'Interactive data unavailable; showing the static reconstruction.';
            }
        });

    if ('ResizeObserver' in window) {
        new ResizeObserver(resizeCanvas).observe(canvas);
    } else {
        window.addEventListener('resize', resizeCanvas);
    }
})();
