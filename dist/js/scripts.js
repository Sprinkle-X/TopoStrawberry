/*!
* TopoStrawberry website v1.0.0
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

    const loading = document.getElementById('pointcloudLoading');
    const fallback = document.getElementById('pointcloudFallback');
    const resetButton = document.getElementById('pointcloudReset');
    const pointCountLabel = document.getElementById('pointcloudPointCount');
    const state = {
        yaw: 0,
        pitch: 0,
        zoom: 2.6,
        panX: 0,
        panY: 0,
    };
    const initialState = { ...state };
    const pointers = new Map();
    let pointCount = 0;
    let frameRequested = false;
    let pinchDistance = 0;
    let pinchMidpoint = null;
    let renderer = null;

    function showFallback(message) {
        canvas.hidden = true;
        if (fallback) {
            fallback.hidden = false;
        }
        if (loading) {
            loading.textContent = message;
        }
    }

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            throw new Error('Unable to initialize point-cloud shader.');
        }
        return shader;
    }

    function createWebGLRenderer() {
        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: true,
            depth: true,
            powerPreference: 'high-performance',
        });
        if (!gl) {
            throw new Error('WebGL is unavailable.');
        }

        const vertexShader = createShader(
            gl,
            gl.VERTEX_SHADER,
            `
                attribute vec3 aPosition;
                attribute vec3 aColor;
                uniform float uYaw;
                uniform float uPitch;
                uniform float uZoom;
                uniform float uAspect;
                uniform float uPixelRatio;
                uniform vec2 uPan;
                varying vec3 vColor;

                void main() {
                    float cy = cos(uYaw);
                    float sy = sin(uYaw);
                    float cp = cos(uPitch);
                    float sp = sin(uPitch);
                    float rotatedX = cy * aPosition.x + sy * aPosition.z;
                    float yawDepth = -sy * aPosition.x + cy * aPosition.z;
                    float rotatedY = cp * aPosition.y - sp * yawDepth;
                    float rotatedDepth = sp * aPosition.y + cp * yawDepth;
                    float viewDepth = max(rotatedDepth + 2.35, 0.15);
                    vec2 projected = vec2(
                        (rotatedX / viewDepth) * 1.9 / uAspect,
                        (rotatedY / viewDepth) * 1.9
                    );
                    projected = projected * uZoom + uPan;
                    gl_Position = vec4(
                        projected,
                        clamp(rotatedDepth * 0.65, -0.95, 0.95),
                        1.0
                    );
                    gl_PointSize = clamp(
                        (3.4 * uPixelRatio * uZoom) / viewDepth,
                        1.4 * uPixelRatio,
                        4.5 * uPixelRatio
                    );
                    vColor = aColor;
                }
            `
        );
        const fragmentShader = createShader(
            gl,
            gl.FRAGMENT_SHADER,
            `
                precision mediump float;
                varying vec3 vColor;

                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float radius = dot(center, center);
                    if (radius > 0.25) {
                        discard;
                    }
                    float edge = 1.0 - smoothstep(0.17, 0.25, radius);
                    gl_FragColor = vec4(vColor * (0.9 + 0.1 * edge), edge);
                }
            `
        );
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error('Unable to link point-cloud renderer.');
        }
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);

        const locations = {
            position: gl.getAttribLocation(program, 'aPosition'),
            color: gl.getAttribLocation(program, 'aColor'),
            yaw: gl.getUniformLocation(program, 'uYaw'),
            pitch: gl.getUniformLocation(program, 'uPitch'),
            zoom: gl.getUniformLocation(program, 'uZoom'),
            aspect: gl.getUniformLocation(program, 'uAspect'),
            pixelRatio: gl.getUniformLocation(program, 'uPixelRatio'),
            pan: gl.getUniformLocation(program, 'uPan'),
        };
        const positionBuffer = gl.createBuffer();
        const colorBuffer = gl.createBuffer();

        gl.useProgram(program);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        return {
            upload(payload) {
                pointCount = payload.point_count;
                gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(payload.positions), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(locations.position);
                gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(payload.colors), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(locations.color);
                gl.vertexAttribPointer(locations.color, 3, gl.UNSIGNED_BYTE, true, 0, 0);
            },
            resize() {
                const bounds = canvas.getBoundingClientRect();
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
                const width = Math.max(1, Math.round(bounds.width * pixelRatio));
                const height = Math.max(1, Math.round(bounds.height * pixelRatio));
                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                    gl.viewport(0, 0, width, height);
                }
            },
            draw() {
                const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                gl.useProgram(program);
                gl.uniform1f(locations.yaw, state.yaw);
                gl.uniform1f(locations.pitch, state.pitch);
                gl.uniform1f(locations.zoom, state.zoom);
                gl.uniform1f(locations.aspect, canvas.width / Math.max(canvas.height, 1));
                gl.uniform1f(locations.pixelRatio, pixelRatio);
                gl.uniform2f(
                    locations.pan,
                    (2 * state.panX * pixelRatio) / canvas.width,
                    (-2 * state.panY * pixelRatio) / canvas.height
                );
                gl.drawArrays(gl.POINTS, 0, pointCount);
            },
        };
    }

    function scheduleRender() {
        if (frameRequested || !renderer || !pointCount) {
            return;
        }
        frameRequested = true;
        window.requestAnimationFrame(() => {
            frameRequested = false;
            renderer.resize();
            renderer.draw();
        });
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

    try {
        renderer = createWebGLRenderer();
    } catch (error) {
        showFallback('WebGL is unavailable; showing the static reconstruction.');
        return;
    }

    fetch(canvas.dataset.source)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Point-cloud request failed: ${response.status}`);
            }
            return response.json();
        })
        .then((payload) => {
            renderer.upload(payload);
            if (pointCountLabel) {
                pointCountLabel.textContent = `${pointCount.toLocaleString()} rendered points`;
            }
            if (loading) {
                loading.textContent = `${pointCount.toLocaleString()} points loaded · GPU rendering active`;
                window.setTimeout(() => loading.classList.add('is-hidden'), 900);
            }
            renderer.resize();
            scheduleRender();
        })
        .catch(() => {
            showFallback('Interactive data unavailable; showing the static reconstruction.');
        });

    if ('ResizeObserver' in window) {
        new ResizeObserver(scheduleRender).observe(canvas);
    } else {
        window.addEventListener('resize', scheduleRender);
    }
})();
