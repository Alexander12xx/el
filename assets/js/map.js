(function () {
    "use strict";

    var map = document.querySelector("[data-market-map]");
    if (!map) { return; }

    var viewport = map.querySelector("[data-map-viewport]");
    var scene = map.querySelector("[data-map-scene]");
    var markerLayer = map.querySelector("[data-map-markers]");
    var route = map.querySelector("[data-map-route]");
    var title = document.querySelector("[data-map-title]");
    var body = document.querySelector("[data-map-body]");
    var kind = document.querySelector("[data-map-kind]");
    var scale = 1;
    var offsetX = 0;
    var offsetY = 0;
    var drag = null;

    var places = [
        {
            name: "Kenya",
            coordinates: [-1.2921, 36.8219],
            kind: "Origin",
            description: "Grown with our partner farms, graded to specification and consolidated in Nairobi for export."
        },
        {
            name: "Netherlands",
            coordinates: [52.1326, 5.2913],
            kind: "Import market",
            description: "Europe's central flower auction and distribution hub for roses and seasonal stems."
        },
        {
            name: "United Kingdom",
            coordinates: [51.5072, -0.1276],
            kind: "Import market",
            description: "A major market for premium Kenyan roses, hypericum and seasonal lines."
        },
        {
            name: "Germany",
            coordinates: [52.52, 13.405],
            kind: "Import market",
            description: "Wholesale and retail programmes for Kenyan cut flowers."
        },
        {
            name: "France",
            coordinates: [48.8566, 2.3522],
            kind: "Import market",
            description: "A destination for Kenyan roses and seasonal varieties."
        },
        {
            name: "Saudi Arabia",
            coordinates: [24.7136, 46.6753],
            kind: "Import market",
            description: "Riyadh and Jeddah receive regular rose and spray-rose programmes."
        },
        {
            name: "United Arab Emirates",
            coordinates: [25.2048, 55.2708],
            kind: "Import market",
            description: "Gulf demand rises around Ramadan, Eid and the winter wedding season."
        }
    ];

    function coordinatesToPercent(coordinates) {
        return {
            x: ((coordinates[1] + 180) / 360) * 100,
            y: ((90 - coordinates[0]) / 180) * 100
        };
    }

    function renderTransform() {
        scene.style.transform = "translate3d(" + offsetX + "px," + offsetY + "px,0) scale(" + scale + ")";
    }

    function clampOffset() {
        var extraX = viewport.clientWidth * (scale - 1) / 2;
        var extraY = viewport.clientHeight * (scale - 1) / 2;
        offsetX = Math.max(-extraX, Math.min(extraX, offsetX));
        offsetY = Math.max(-extraY, Math.min(extraY, offsetY));
    }

    function selectPlace(place, marker) {
        markerLayer.querySelectorAll(".map-marker").forEach(function (item) {
            item.classList.toggle("is-active", item === marker);
            item.setAttribute("aria-pressed", item === marker ? "true" : "false");
        });

        if (title) { title.textContent = place.name; }
        if (body) { body.textContent = place.description; }
        if (kind) { kind.textContent = place.kind; }

        if (place.kind === "Origin") {
            route.setAttribute("d", "");
            return;
        }

        var from = coordinatesToPercent(places[0].coordinates);
        var to = coordinatesToPercent(place.coordinates);
        var startX = from.x * 16;
        var startY = from.y * 8;
        var endX = to.x * 16;
        var endY = to.y * 8;
        var controlX = (startX + endX) / 2;
        var controlY = Math.min(startY, endY) - 62;
        route.setAttribute("d", "M" + startX + " " + startY + " Q" + controlX + " " + controlY + " " + endX + " " + endY);
    }

    places.forEach(function (place, index) {
        var point = coordinatesToPercent(place.coordinates);
        var marker = document.createElement("button");
        marker.type = "button";
        marker.className = "map-marker" + (index === 0 ? " map-marker-origin is-active" : "");
        marker.style.left = point.x + "%";
        marker.style.top = point.y + "%";
        marker.setAttribute("aria-label", place.name + (index === 0 ? ", export origin" : ", flower import market"));
        marker.setAttribute("aria-pressed", index === 0 ? "true" : "false");
        marker.title = place.name;
        marker.innerHTML = '<span class="map-marker-dot" aria-hidden="true"></span>';
        marker.addEventListener("click", function (event) {
            event.stopPropagation();
            selectPlace(place, marker);
        });
        markerLayer.appendChild(marker);
    });

    map.querySelectorAll("[data-map-zoom]").forEach(function (button) {
        button.addEventListener("click", function () {
            var action = button.getAttribute("data-map-zoom");
            scale = action === "reset" ? 1 : Math.max(1, Math.min(2.8, scale + (action === "in" ? .35 : -.35)));
            if (action === "reset") { offsetX = 0; offsetY = 0; }
            clampOffset();
            renderTransform();
        });
    });

    viewport.addEventListener("wheel", function (event) {
        event.preventDefault();
        scale = Math.max(1, Math.min(2.8, scale + (event.deltaY < 0 ? .12 : -.12)));
        clampOffset();
        renderTransform();
    }, { passive: false });

    viewport.addEventListener("pointerdown", function (event) {
        if (event.target.closest("button")) { return; }
        drag = { x: event.clientX - offsetX, y: event.clientY - offsetY };
        viewport.classList.add("is-dragging");
        viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener("pointermove", function (event) {
        if (!drag) { return; }
        offsetX = event.clientX - drag.x;
        offsetY = event.clientY - drag.y;
        clampOffset();
        renderTransform();
    });

    function endDrag() {
        drag = null;
        viewport.classList.remove("is-dragging");
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    window.addEventListener("resize", function () {
        clampOffset();
        renderTransform();
    });
})();