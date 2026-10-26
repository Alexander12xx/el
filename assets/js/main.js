/* =========================================================
    ELWANA BLOOMS
   Global behaviour
   ========================================================== */

(function () {
    "use strict";

    var doc = document;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function $(selector, scope) {
        return (scope || doc).querySelector(selector);
    }

    function $$(selector, scope) {
        return Array.prototype.slice.call((scope || doc).querySelectorAll(selector));
    }


    /* =====================================================
       IMAGE FALLBACK
       Guarantees no broken-image icon is ever visible: if a
       remote image fails, it is removed and the frame shows a
       branded gradient placeholder instead.
    ===================================================== */

    function markImageFallback(img) {
        var frame = img.closest(".frame, .card-media, .page-head-media, .hero-media, .journal-item, .parallax-media, .cta-band .frame");
        if (frame) {
            frame.classList.add("img-fallback");
        }
        img.style.display = "none";
    }

    doc.addEventListener(
        "error",
        function (event) {
            var target = event.target;

            if (target && target.tagName === "IMG") {
                markImageFallback(target);
            }
        },
        true
    );

    // Images that already failed before this script ran.
    $$("img").forEach(function (img) {
        if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
            markImageFallback(img);
        }
    });


    /* =====================================================
       STICKY NAVIGATION
    ===================================================== */

    var navbar = $("#navbar");

    if (navbar) {
        var onScroll = function () {
            if (window.scrollY > 60) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
    }


    /* =====================================================
       ACTIVE NAV LINK
    ===================================================== */

    (function markActiveLink() {
        var page = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
        if (page === "") { page = "index.html"; }

        $$(".nav-links a, .mobile-menu a").forEach(function (link) {
            var href = (link.getAttribute("href") || "").toLowerCase().split("#")[0].split("?")[0];

            if (href === page || (page === "index.html" && href === "")) {
                link.classList.add("active");
            }
        });
    })();


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    var menuButton = $("#menuButton");
    var mobileMenu = $("#mobileMenu");

    if (menuButton && mobileMenu) {
        var closeMenu = function () {
            mobileMenu.classList.remove("open");
            doc.body.classList.remove("menu-open");
            menuButton.setAttribute("aria-expanded", "false");
        };

        menuButton.addEventListener("click", function () {
            var isOpen = mobileMenu.classList.toggle("open");
            doc.body.classList.toggle("menu-open", isOpen);
            menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
            menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
        });

        $$("a", mobileMenu).forEach(function (link) {
            link.addEventListener("click", closeMenu);
        });

        doc.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        window.addEventListener("resize", function () {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        });
    }


    /* =====================================================
       REVEAL ON SCROLL
       Pure IntersectionObserver so content is never left
       hidden if a library fails to load.
    ===================================================== */

    (function reveal() {
        var items = $$(".reveal");

        if (!items.length) { return; }

        if (!("IntersectionObserver" in window) || reduceMotion) {
            items.forEach(function (item) { item.classList.add("is-visible"); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

        items.forEach(function (item) { observer.observe(item); });

        // Safety net: reveal anything still hidden after 3s.
        window.setTimeout(function () {
            $$(".reveal:not(.is-visible)").forEach(function (item) {
                var rect = item.getBoundingClientRect();
                if (rect.top < window.innerHeight) { item.classList.add("is-visible"); }
            });
        }, 3000);
    })();


    /* =====================================================
       PARALLAX BANDS
    ===================================================== */

    (function parallax() {
        var layers = $$(".parallax-media");

        if (!layers.length || reduceMotion) { return; }

        var ticking = false;

        var update = function () {
            layers.forEach(function (layer) {
                var host = layer.parentElement;
                var rect = host.getBoundingClientRect();

                if (rect.bottom < 0 || rect.top > window.innerHeight) { return; }

                var progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                var shift = (progress - 0.5) * 130;

                layer.style.transform = "translate3d(0," + shift.toFixed(1) + "px,0)";
            });

            ticking = false;
        };

        window.addEventListener("scroll", function () {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }, { passive: true });

        update();
    })();


    /* =====================================================
       SCROLL SNAP CAROUSELS
       Replaces the previous Swiper dependency with native
       scroll snapping plus accessible controls.
    ===================================================== */

    $$("[data-carousel]").forEach(function (root) {
        var track = $("[data-carousel-track]", root);
        if (!track) { return; }

        var prev = $("[data-carousel-prev]", root);
        var next = $("[data-carousel-next]", root);

        var step = function () {
            var slide = track.firstElementChild;
            if (!slide) { return; }

            var gap = parseFloat(getComputedStyle(track).columnGap) || 20;
            return slide.getBoundingClientRect().width + gap;
        };

        var sync = function () {
            var max = track.scrollWidth - track.clientWidth - 2;
            if (prev) { prev.disabled = track.scrollLeft <= 2; }
            if (next) { next.disabled = track.scrollLeft >= max; }
        };

        if (prev) {
            prev.addEventListener("click", function () {
                track.scrollBy({ left: -step(), behavior: reduceMotion ? "auto" : "smooth" });
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                track.scrollBy({ left: step(), behavior: reduceMotion ? "auto" : "smooth" });
            });
        }

        track.addEventListener("scroll", sync, { passive: true });
        window.addEventListener("resize", sync);
        sync();
    });


    /* =====================================================
       FILTER BAR
    ===================================================== */

    $$("[data-filter-group]").forEach(function (group) {
        var targetSelector = group.getAttribute("data-filter-group");
        var grid = $(targetSelector);
        if (!grid) { return; }

        var cards = $$("[data-tags]", grid);
        var note = group.getAttribute("data-filter-note") ? $(group.getAttribute("data-filter-note")) : null;
        var buttons = $$(".filter-btn", group);

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                var wanted = (button.getAttribute("data-filter") || "all").toLowerCase();

                buttons.forEach(function (item) { item.classList.remove("active"); });
                button.classList.add("active");

                var shown = 0;

                cards.forEach(function (card) {
                    var tags = (card.getAttribute("data-tags") || "").toLowerCase().split(/\s+/);
                    var match = wanted === "all" || tags.indexOf(wanted) !== -1;

                    card.hidden = !match;
                    if (match) { shown++; }
                });

                if (note) {
                    note.textContent = shown + (shown === 1 ? " variety" : " varieties") + " shown";
                }
            });
        });
    });


    /* =====================================================
       PROCESS SWITCHER
    ===================================================== */

    $$("[data-process]").forEach(function (root) {
        var buttons = $$(".process-button", root);
        var imageWrap = $("[data-process-image]", root);
        var titleWrap = $("[data-process-text]", root);
        if (!buttons.length || !imageWrap) { return; }

        var preload = function (src) {
            var pre = new Image();
            pre.src = src;
        };

        buttons.forEach(function (button) {
            // Warm the cache for each step.
            var src = button.getAttribute("data-image");
            if (src) { preload(src); }

            button.addEventListener("click", function () {
                buttons.forEach(function (item) { item.classList.remove("active"); });
                button.classList.add("active");

                var image = imageWrap.querySelector("img");
                var step = Number(button.getAttribute("data-index"));

                if (image && src) {
                    image.classList.remove("loaded");
                    image.src = src;
                    image.alt = button.getAttribute("data-image-alt") || "";
                    if (image.complete) { image.classList.add("loaded"); }
                }

                if (titleWrap) {
                    $$("[data-step-label]", titleWrap).forEach(function (node) {
                        node.textContent = button.getAttribute("data-label") || node.textContent;
                    });

                    $$("[data-step-title]", titleWrap).forEach(function (node) {
                        node.textContent = button.getAttribute("data-title") || node.textContent;
                    });

                    $$("[data-step-body]", titleWrap).forEach(function (node) {
                        node.textContent = button.getAttribute("data-body") || node.textContent;
                    });
                }

                if (root.getAttribute("data-highlight-step") === "true") {
                    root.style.setProperty("--step", step);
                }
            });
        });
    });


    /* =====================================================
       ACCORDION
    ===================================================== */

    $$("[data-accordion]").forEach(function (root) {
        var triggers = $$(".accordion-trigger", root);

        triggers.forEach(function (trigger) {
            var panel = doc.getElementById(trigger.getAttribute("aria-controls"));
            if (!panel) { return; }

            trigger.addEventListener("click", function () {
                var isOpen = trigger.getAttribute("aria-expanded") === "true";

                triggers.forEach(function (other) {
                    if (other === trigger) { return; }
                    other.setAttribute("aria-expanded", "false");
                    var otherPanel = doc.getElementById(other.getAttribute("aria-controls"));
                    if (otherPanel) { otherPanel.style.maxHeight = null; }
                });

                trigger.setAttribute("aria-expanded", isOpen ? "false" : "true");
                panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";
            });
        });

        window.addEventListener("resize", function () {
            triggers.forEach(function (trigger) {
                if (trigger.getAttribute("aria-expanded") !== "true") { return; }
                var panel = doc.getElementById(trigger.getAttribute("aria-controls"));
                if (panel) { panel.style.maxHeight = panel.scrollHeight + "px"; }
            });
        });
    });


    /* =====================================================
       BACKGROUND VIDEO
       Only loads when allowed, always keeps its poster.
    ===================================================== */

    (function backgroundVideo() {
        $$("[data-bg-video]").forEach(function (video) {
            var wrapper = video.closest(".hero-media, .video-band");
            var poster = video.getAttribute("poster");

            if (poster) {
                video.poster = poster;
                if (wrapper) { wrapper.style.backgroundImage = "url('" + poster + "')"; }
            }

            if (reduceMotion) {
                video.removeAttribute("autoplay");
                video.remove();
                return;
            }

            // Respect data saver hints where available.
            if (navigator.connection && navigator.connection.saveData) {
                video.remove();
                return;
            }

            var attempt = function () {
                var promise = video.play();

                if (promise && typeof promise.catch === "function") {
                    promise.then(function () {
                        video.classList.add("playing");
                    }).catch(function () {
                        // Autoplay blocked: the poster image remains.
                    });
                }
            };

            if (video.readyState >= 3) {
                attempt();
            } else {
                video.addEventListener("canplay", attempt, { once: true });
            }

            // Only start the download once the section is close to view.
            if ("IntersectionObserver" in window) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            io.disconnect();
                            attempt();
                        }
                    });
                }, { rootMargin: "300px" });

                io.observe(wrapper || video);
            } else {
                attempt();
            }
        });
    })();


    /* =====================================================
       PLAY / PAUSE BUTTONS
    ===================================================== */

    (function playControls() {
        $$("[data-play-toggle]").forEach(function (button) {
            var video = doc.getElementById(button.getAttribute("data-play-toggle"));
            if (!video) { return; }

            var playing = false;

            var sync = function () {
                button.textContent = playing ? "Pause" : "Play";
                button.setAttribute("aria-label", (playing ? "Pause" : "Play") + " background film");
            };

            button.addEventListener("click", function () {
                if (video.paused) {
                    var promise = video.play();
                    if (promise && promise.catch) {
                        promise.catch(function () { sync(); });
                    }
                } else {
                    video.pause();
                }
            });

            video.addEventListener("play", function () { playing = true; sync(); });
            video.addEventListener("pause", function () { playing = false; sync(); });

            sync();
        });
    })();


    /* =====================================================
       VIDEO MODAL
    ===================================================== */

    (function videoModal() {
        var modal = $("#videoModal");

        if (modal) {
            var modalVideo = $("video", modal);
            var modalCaption = $("[data-modal-caption]", modal);
            var lastTrigger = null;

            var openModal = function (source, caption, trigger) {
                lastTrigger = trigger || null;

                if (modalVideo && source) {
                    modalVideo.src = source;
                    modalVideo.currentTime = 0;
                    var promise = modalVideo.play();
                    if (promise && promise.catch) { promise.catch(function () {}); }
                }

                if (modalCaption) { modalCaption.textContent = caption || ""; }

                modal.classList.add("open");
                doc.body.classList.add("menu-open");

                var close = $(".modal-close", modal);
                if (close) { close.focus(); }
            };

            var closeModal = function () {
                modal.classList.remove("open");
                doc.body.classList.remove("menu-open");

                if (modalVideo) {
                    modalVideo.pause();
                    modalVideo.removeAttribute("src");
                    modalVideo.load();
                }

                if (lastTrigger) { lastTrigger.focus(); }
            };

            $$("[data-video]").forEach(function (trigger) {
                trigger.addEventListener("click", function (event) {
                    event.preventDefault();
                    openModal(trigger.getAttribute("data-video"), trigger.getAttribute("data-caption"), trigger);
                });
            });

            modal.addEventListener("click", function (event) {
                if (event.target === modal) { closeModal(); }
            });

            $$("[data-modal-close]", modal).forEach(function (button) {
                button.addEventListener("click", closeModal);
            });

            doc.addEventListener("keydown", function (event) {
                if (event.key === "Escape" && modal.classList.contains("open")) { closeModal(); }
            });
        }
    })();


    /* =====================================================
       IMAGE LIGHTBOX
    ===================================================== */

    (function lightbox() {
        var lightbox = $("#lightbox");

        if (!lightbox) { return; }

        var target = $("img", lightbox);
        var caption = $("[data-lightbox-caption]", lightbox);
        var triggers = $$("[data-lightbox]");
        var index = 0;
        var lastTrigger = null;

        var show = function (next) {
            if (!triggers.length) { return; }

            index = (next + triggers.length) % triggers.length;

            var trigger = triggers[index];
            var full = trigger.getAttribute("data-lightbox-full") ||
                       $("img", trigger).getAttribute("src");

            target.src = full;
            target.alt = $("img", trigger).getAttribute("alt") || "";

            if (caption) {
                caption.textContent = trigger.getAttribute("data-lightbox-caption") || target.alt;
            }
        };

        var open = function (startIndex, trigger) {
            lastTrigger = trigger || null;
            show(startIndex);
            lightbox.classList.add("open");
            doc.body.classList.add("menu-open");

            var close = $(".lightbox-close", lightbox);
            if (close) { close.focus(); }
        };

        var close = function () {
            lightbox.classList.remove("open");
            doc.body.classList.remove("menu-open");
            target.removeAttribute("src");

            if (lastTrigger) { lastTrigger.focus(); }
        };

        triggers.forEach(function (trigger, i) {
            trigger.addEventListener("click", function () { open(i, trigger); });
        });

        $(".lightbox-prev", lightbox).addEventListener("click", function () { show(index - 1); });
        $(".lightbox-next", lightbox).addEventListener("click", function () { show(index + 1); });
        $(".lightbox-close", lightbox).addEventListener("click", close);

        lightbox.addEventListener("click", function (event) {
            if (event.target === lightbox) { close(); }
        });

        doc.addEventListener("keydown", function (event) {
            if (!lightbox.classList.contains("open")) { return; }

            if (event.key === "Escape") { close(); }
            if (event.key === "ArrowLeft") { show(index - 1); }
            if (event.key === "ArrowRight") { show(index + 1); }
        });
    })();


    /* =====================================================
       ENQUIRY FORMS
    ===================================================== */

    $$("[data-enquiry-form]").forEach(function (form) {
        var message = $("[data-form-message]", form);

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            var button = $("button[type=submit]", form);
            if (message) {
                message.classList.remove("error");
                message.textContent = "";
            }

            if (!form.reportValidity()) { return; }

            if (button) {
                button.disabled = true;
                button.textContent = "Sending\u2026";
            }

            var labels = {
                company: "Company",
                contact: "Name",
                email: "Email",
                phone: "Phone / WhatsApp",
                market: "Destination market",
                volume: "Weekly volume",
                varieties: "Varieties and requirements",
                flower: "Flower / variety",
                quantity: "Quantity / stems",
                destination: "Destination country",
                shipment_date: "Required delivery window",
                requirements: "Requirements"
            };
            var details = [];

            new FormData(form).forEach(function (value, name) {
                value = value.trim();
                if (value) {
                    details.push((labels[name] || name) + ": " + value);
                }
            });

            var text = "Hello Elwana Blooms, I would like to enquire about flowers.\n\n" + details.join("\n");
            window.location.href = "https://wa.me/254722671336?text=" + encodeURIComponent(text);
        });
    });


    /* =====================================================
       FOOTER YEAR
    ===================================================== */

    $$("[data-year]").forEach(function (node) {
        node.textContent = new Date().getFullYear();
    });

}());
